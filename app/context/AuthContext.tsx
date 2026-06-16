// app/context/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { E, msg } from '@/lib/errors'
import { createClient } from "@/lib/supabase/client";
import { AuthError, User, Session, AuthChangeEvent } from "@supabase/supabase-js";

// Define types for MFA error metadata
interface MFAMetadata {
  factorId?: string;
  challengeId?: string;
}

// Define types for MFA error
interface MFAError {
  code: string;
  factorId?: string;
  challengeId?: string;
  metadata?: MFAMetadata;
  message: string;
}

export interface UserProfile {
  username?: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  website?: string;
  role?: string;
  mfa_enabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  authLevel: string;
  mfaEnrolled: boolean;
  mfaPending: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: AuthError | null;
    mfaRequired?: boolean;
    factorId?: string;
    challengeId?: string;
  }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: (redirectUrl?: string | null) => Promise<{ error: AuthError | null }>;
  enableMFA: () => Promise<{
    success: boolean;
    qrCode?: string;
    secret?: string;
    factorId?: string;
    error?: string;
  }>;
  verifyMFASetup: (
    factorId: string,
    code: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  verifyMFALogin: (
    factorId: string,
    challengeId: string,
    code: string
  ) => Promise<{
    success: boolean;
    user?: User;
    session?: Session;
    error?: string;
  }>;
  getAuthenticatorAssuranceLevel: () => Promise<{
    currentLevel: string | null;
    nextLevel: string | null;
    error?: string;
  }>;
  listMFACheckFactors: () => Promise<{
    totp: Array<{
      id: string;
      friendly_name?: string;
      factor_type: string;
      status: string;
      created_at?: string;
      updated_at?: string;
    }>;
    error?: string;
  }>;
  checkMFAStatus: (userId: string) => Promise<boolean>;
  disableMFASetup: (
    factorId: string,
    code: string
  ) => Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // useMemo ensures the same client instance is used across renders,
  // preventing stale closures in fetchProfile and onAuthStateChange.
  const supabase = useMemo(() => createClient(), []);

  // Track last fetched userId to prevent redundant 'burst' calls on mount
  const fetchingRef = useRef<{ id: string; timestamp: number } | null>(null);

  // MFA auth state
  const authLevel = (session as { aal?: string })?.aal ?? "aal1";
  const mfaEnrolled = Array.isArray(user?.factors) && user.factors.length > 0;
  const mfaPending = mfaEnrolled && authLevel === "aal1";
  const isAuthenticated = !!user && !mfaPending;

  // Helper function to safely extract MFA error details
  const extractMFAErrorDetails = (
    error: MFAError | AuthError
  ): { factorId?: string; challengeId?: string } => {
    const typedError = error as MFAError;
    return {
      factorId: typedError.factorId || typedError.metadata?.factorId,
      challengeId: typedError.challengeId || typedError.metadata?.challengeId,
    };
  };

  // Check admin status — silent on any failure, defaults to false.
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const response = await fetch("/api/auth/check-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data.isAdmin || false;
    } catch {
      // Network error — user is not admin by default
      return false;
    }
  }, []);

  // Fetch profile with retry and fallback.
  // Never throws — always sets a usable profile even on network failure.
  const fetchProfile = useCallback(
    async (userId: string, userMeta?: { full_name?: string; name?: string; email?: string }) => {
      // Try up to 3 attempts with increasing delays (1s, 2s)
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
          }

          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          if (!error && data) {
            setProfile(data);
            return; // Success
          }

          // PGRST116 = no row found — user has no profile yet, skip retry
          if ((error as any)?.code === "PGRST116") break;
        } catch {
          // Network error — try again silently
        }
      }

      // All attempts failed — use metadata fallback so UI never shows blank
      const fallbackName =
        userMeta?.full_name || userMeta?.name || userMeta?.email?.split("@")[0] || "User";

      setProfile({
        full_name: fallbackName,
        email: userMeta?.email || "",
        role: "user",
      });
    },
    [supabase]
  );

  useEffect(() => {
    // Deduplicated initialization helper
    const initializeUser = async (u: User | null, s: Session | null) => {
      if (!u) {
        setUser(null);
        setSession(s);
        setProfile(null);
        setIsAdmin(false);
        setIsLoading(false);
        fetchingRef.current = null;
        return;
      }

      // Check if we already fetched for THIS user recently (within 5s)
      const now = Date.now();
      if (fetchingRef.current?.id === u.id && now - fetchingRef.current.timestamp < 5000) {
        return;
      }
      fetchingRef.current = { id: u.id, timestamp: now };

      setUser(u);
      setSession(s);

      // Preliminary profile
      setProfile(
        (prev) =>
          prev || {
            full_name: u.user_metadata?.full_name || u.email?.split("@")[0] || "User",
            email: u.email || "",
            role: "user",
          }
      );

      // Fetch full details in background
      fetchProfile(u.id, {
        full_name: u.user_metadata?.full_name,
        name: u.user_metadata?.name,
        email: u.email,
      });

      fetchUserProfile(u.id).then(setIsAdmin);
    };

    const getInitialSession = async () => {
      const loadingWatchdog = setTimeout(() => setIsLoading(false), 7000);
      try {
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const code = params.get("code");
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete("code");
            window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search);
          }
        }

        const {
          data: { session: s },
        } = await supabase.auth.getSession();
        const {
          data: { user: u },
        } = await supabase.auth.getUser();

        await initializeUser(u, s);
      } catch (err) {
        console.error("Error getting initial session:", err);
      } finally {
        setIsLoading(false);
        clearTimeout(loadingWatchdog);
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      // Only trigger initialization for relevant events to avoid loops
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED") {
        await initializeUser(session?.user ?? null, session);
      } else if (event === "SIGNED_OUT") {
        await initializeUser(null, null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, fetchUserProfile]);

  const enableMFA = async () => {
    try {
      const response = await fetch("/api/auth/mfa/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      return {
        success: true,
        qrCode: data.data.qrCode,
        secret: data.data.secret,
        factorId: data.data.factorId,
      };
    } catch {
      return {
        success: false,
        error: msg(E.AUTH_MFA_ENABLE_FAILED),
      };
    }
  };

  const verifyMFASetup = async (factorId: string, code: string) => {
    try {
      const response = await fetch("/api/auth/mfa/verify-enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      return { success: true };
    } catch {
      return {
        success: false,
        error: msg(E.AUTH_MFA_VERIFY_FAILED),
      };
    }
  };

  const verifyMFALogin = async (factorId: string, challengeId: string, code: string) => {
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (error) {
        return { success: false, error: msg(E.AUTH_MFA_CODE_INVALID) };
      }

      // 🔥 Get updated session AFTER successful verification
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return {
          success: false,
          error: "Failed to retrieve upgraded session",
        };
      }

      return {
        success: true,
        user: session.user,
        session,
      };
    } catch {
      return {
        success: false,
        error: msg(E.AUTH_MFA_CODE_INVALID),
      };
    }
  };

  const getAuthenticatorAssuranceLevel = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (error) {
        return {
          currentLevel: "aal1",
          nextLevel: "aal1",
          error: error.message,
        };
      }

      return {
        currentLevel: data.currentLevel || "aal1",
        nextLevel: data.nextLevel || "aal1",
      };
    } catch {
      return {
        currentLevel: "aal1",
        nextLevel: "aal1",
        error: "Failed to get assurance level",
      };
    }
  };

  const listMFACheckFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

        if (error) {
        return { totp: [], error: error.message };
      }

      return {
        totp: data.totp || [],
      } as {
        totp: Array<{
          id: string;
          friendly_name?: string;
          factor_type: string;
          status: string;
          created_at?: string;
          updated_at?: string;
        }>;
        error?: string;
      };
    } catch {
      return { totp: [], error: "Failed to list MFA factors" };
    }
  };

  // Function to check if user has MFA enabled
  const checkMFAStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("mfa_enabled")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error checking MFA status:", error);
        return false;
      }

      return data?.mfa_enabled || false;
    } catch (err) {
      console.error("Error in checkMFAStatus:", err);
      return false;
    }
  };

  const disableMFASetup = async (factorId: string, code: string) => {
    try {
      const response = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      return { success: true, message: "MFA disabled successfully" };
    } catch {
      return {
        success: false,
        error: msg(E.AUTH_MFA_DISABLE_FAILED),
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // First, attempt to sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Check if there's an error
      if (error) {
        // Check if it's specifically an MFA required error
        if (error.code === "mfa_required") {
          // Extract factor information from the error (if available)
          const { factorId, challengeId } = extractMFAErrorDetails(error);

          if (!factorId || !challengeId) {
            const { totp: fetchedTotp, error: factorsError } = await listMFACheckFactors();

            if (factorsError) {
              return {
                error: {
                  message: msg(E.AUTH_MFA_ENABLE_FAILED),
                  code: "mfa_error",
                } as unknown as AuthError,
              };
            }

            if (!fetchedTotp || fetchedTotp.length === 0) {
              return {
                error: {
                  message: msg(E.AUTH_MFA_FACTOR_NOT_FOUND),
                  code: "mfa_no_factors",
                } as unknown as AuthError,
              };
            }

            // Create challenge for the first factor
            const { data: challengeData, error: challengeError } =
              await supabase.auth.mfa.challenge({
                factorId: fetchedTotp[0].id,
              });

            if (challengeError) {
              return { error: challengeError };
            }

            return {
              error: null,
              mfaRequired: true,
              factorId: fetchedTotp[0].id,
              challengeId: challengeData.id,
            };
          }

          // Return the MFA challenge information
          return {
            error: null,
            mfaRequired: true,
            factorId,
            challengeId,
          };
        }

        // For other errors, return as-is
        return { error };
      }

      // Check if user has MFA factors but is only at AAL1
      if (data?.session) {
        // Use factors from the session if available, otherwise fetch them
        const userWithFactors = data.session.user as User & {
          factors?: Array<{ id: string; factor_type: string; status: string }>;
        };
        const factors = userWithFactors?.factors || [];
        const totpFactors = factors.filter(
          (f) => f.factor_type === "totp" && f.status === "verified"
        );

        if (totpFactors.length > 0) {
          const factorId = totpFactors[0].id;

          // Only challenge if we have a valid factor
          if (factorId) {
            const { data: challengeData, error: challengeError } =
              await supabase.auth.mfa.challenge({
                factorId: factorId,
              });

            if (!challengeError && challengeData) {
              return {
                error: null,
                mfaRequired: true,
                factorId: factorId,
                challengeId: challengeData.id,
              };
            }
          }
        }
      }

      // Normal login success
      return { error: null };
    } catch (err) {
      console.error("Sign in error:", err);
      return {
        error: {
          message: msg(E.AUTH_LOGIN_FAILED),
          code: "sign_in_error",
        } as unknown as AuthError,
      };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            message: data.message || data.error || msg(E.AUTH_UNEXPECTED_ERROR),
            status: response.status,
            code: data.code || "SIGNUP_ERROR",
            name: "SignUpError",
          } as unknown as AuthError,
        };
      }

      return { error: null };
    } catch {
      return {
        error: {
          message: msg(E.AUTH_UNEXPECTED_ERROR),
          status: 500,
          code: "UNEXPECTED_ERROR",
          name: "UnexpectedError",
        } as unknown as AuthError,
      };
    }
  };

  const signOut = async () => {
    // ── SERVER-SIDE SIGN OUT (fire-and-forget) ──────────────────────
    // Don't await this — if the API route hangs (cold start, network),
    // we must not block the UI. The full page reload will handle the rest.
    fetch("/api/auth/signout", { method: "POST" }).catch(() => {});

    // ── LOCAL SIGN OUT (with timeout) ───────────────────────────────
    // supabase.auth.signOut() can sometimes hang in production.
    // Race it against a 3-second timeout so the UI is never stuck.
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: "local" }),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    } catch {
      // Swallow errors — we're signing out regardless
    }

    // ── CLEAR REACT STATE ───────────────────────────────────────────
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const signInWithGoogle = async (redirectUrl?: string | null) => {
    // Always use the current browser origin so localhost never jumps to production
    const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";

    if (typeof document !== "undefined" && redirectUrl) {
      document.cookie = `oauth_redirect=${encodeURIComponent(redirectUrl)}; path=/; max-age=3600; SameSite=Lax`;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${currentOrigin}/api/auth/callback`,
      },
    });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isLoading,
        isAuthenticated,
        authLevel,
        mfaEnrolled,
        mfaPending,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        enableMFA,
        verifyMFASetup,
        verifyMFALogin,
        getAuthenticatorAssuranceLevel,
        listMFACheckFactors,
        checkMFAStatus,
        disableMFASetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
