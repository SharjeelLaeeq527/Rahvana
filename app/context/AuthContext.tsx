// app/context/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthError, User, Session } from "@supabase/supabase-js";

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
    password: string,
  ) => Promise<{
    error: AuthError | null;
    mfaRequired?: boolean;
    factorId?: string;
    challengeId?: string;
  }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  enableMFA: () => Promise<{
    success: boolean;
    qrCode?: string;
    secret?: string;
    factorId?: string;
    error?: string;
  }>;
  verifyMFASetup: (
    factorId: string,
    code: string,
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  verifyMFALogin: (
    factorId: string,
    challengeId: string,
    code: string,
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
    code: string,
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

  // MFA auth state
  const authLevel = (session as { aal?: string })?.aal ?? "aal1";

  const mfaEnrolled = Array.isArray(user?.factors) && user.factors.length > 0;

  const mfaPending = mfaEnrolled && authLevel === "aal1";
  const isAuthenticated = !!user && !mfaPending;

  // Helper function to safely extract MFA error details
  const extractMFAErrorDetails = (
    error: MFAError | AuthError,
  ): { factorId?: string; challengeId?: string } => {
    const typedError = error as MFAError;
    return {
      factorId: typedError.factorId || typedError.metadata?.factorId,
      challengeId: typedError.challengeId || typedError.metadata?.challengeId,
    };
  };

  // Fetch user profile to check admin status
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Use API route to check admin status (which uses service role)
      const response = await fetch("/api/auth/check-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        console.error(
          "Failed to check admin status:",
          response.status,
          response.statusText,
        );
        return false;
      }

      const data = await response.json();
      return data.isAdmin || false;
    } catch (error) {
      console.error(
        "Error checking admin status (network or parsing error):",
        error,
      );
      return false;
    }
  }, []);

  // Fetch profile
  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("[AuthContext] fetchProfile error:", error.message, "userId:", userId);
          return;
        }
        setProfile(data);
      } catch (err) {
        console.error("[AuthContext] fetchProfile unexpected error:", err);
      }
    },
    [supabase],
  );

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        // IMPORTANT: Use getUser() instead of getSession().
        // getSession() reads tokens from local storage/cookies WITHOUT
        // validating them against the Supabase server. In production,
        // this can return a stale or invalid session, causing "Valued User"
        // and other auth issues. getUser() makes a server round-trip to
        // validate the token and returns the authoritative user object.
        const {
          data: { user: validatedUser },
        } = await supabase.auth.getUser();

        if (validatedUser) {
          // Now get the session for the session object (tokens, etc.)
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();
          setUser(validatedUser);
          setSession(currentSession);
          fetchProfile(validatedUser.id);
          const adminStatus = await fetchUserProfile(validatedUser.id);
          setIsAdmin(adminStatus);
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (_error) {
        console.error("Error getting initial session:", _error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      setUser(session?.user ?? null);
      setSession(session ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
        const adminStatus = await fetchUserProfile(session.user.id);
        setIsAdmin(adminStatus);
      } else {
        // User signed out — clear all user-specific state
        setProfile(null);
        setIsAdmin(false);
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
        error: "Failed to initialize MFA setup",
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
        error: "Failed to verify MFA setup",
      };
    }
  };

  const verifyMFALogin = async (
    factorId: string,
    challengeId: string,
    code: string,
  ) => {
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });
  
      if (error) {
        return { success: false, error: error.message };
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
        error: "Failed to verify MFA code",
      };
    }
  };

  const getAuthenticatorAssuranceLevel = async () => {
    try {
      const supabase = createClient();
      const { data, error } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

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
      const supabase = createClient();
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
        error: "Failed to verify MFA setup",
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
                    message: "MFA setup error",
                    code: "mfa_error",
                  } as unknown as AuthError,
                };
              }

              if (!fetchedTotp || fetchedTotp.length === 0) {
                 return {
                    error: {
                      message: "No MFA factors found",
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
        const factors = (data.session.user as any)?.factors || [];
        const totpFactors = factors.filter((f: any) => f.factor_type === 'totp' && f.status === 'verified');
        
        if (totpFactors.length > 0) {
           const factorId = totpFactors[0].id;
           
           // Only challenge if we have a valid factor
           if (factorId) {
              const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: factorId
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
          message: "Sign in failed",
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
            message: data.error,
            status: response.status,
            code: "SIGNUP_ERROR",
            name: "SignUpError",
          } as unknown as AuthError,
        };
      }

      return { error: null };
    } catch {
      return {
        error: {
          message: "An unexpected error occurred",
          status: 500,
          code: "UNEXPECTED_ERROR",
          name: "UnexpectedError",
        } as unknown as AuthError,
      };
    }
  };

  const signOut = async () => {
    // 1. Call the server-side sign-out API route first.
    //    This uses the server Supabase client which can properly clear
    //    the httpOnly cookies set by the middleware. It also revokes
    //    the refresh token globally on the Supabase server.
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (err) {
      console.error('[AuthContext] Server signout failed:', err);
    }

    // 2. Also sign out on the browser client to clear any local state
    //    (localStorage tokens, in-memory session, etc.)
    await supabase.auth.signOut({ scope: 'local' });

    // 3. Eagerly clear React state so UI updates immediately
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/auth/callback`,
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
