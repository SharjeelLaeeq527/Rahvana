"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  LogOut,
  Trash2,
  Loader2,
  User,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader } from "@/components/ui/spinner";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { MFACodeModal } from "@/app/components/shared/MFACodeModal";
import { useToast } from "@/app/components/shared/ToastProvider";
import { validateStrongPassword } from "@/lib/security/password";
import SurveyModal from "@/app/components/SurveyModal";
import { SecuritySessionsPanel } from "@/app/components/settings/SecuritySessionsPanel";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const canChangePassword = user?.app_metadata?.provider === "email";

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [profile, setProfile] = useState<{ mfa_enabled: boolean } | null>(null);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  // const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangedModalOpen, setPasswordChangedModalOpen] = useState(false);
  const [mfaCodeModalOpen, setMfaCodeModalOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaCodeError, setMfaCodeError] = useState("");
  const [isVerifyingMfaCode, setIsVerifyingMfaCode] = useState(false);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const userId = user?.id;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(
        `/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`
      );
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      if (!userId) {
        return;
      }

      setPageLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("mfa_enabled")
        .eq("id", userId)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Error fetching profile:", error.message);
        setProfile({ mfa_enabled: false });
      } else {
        setProfile({ mfa_enabled: !!data?.mfa_enabled });
      }

      setPageLoading(false);
    };

    if (userId) {
      fetchProfile();
    } else if (!authLoading) {
      setPageLoading(false);
    }

    return () => {
      active = false;
    };
  }, [authLoading, supabase, userId]);

  const submitPasswordChange = async (
    submittedMfaCode?: string
  ): Promise<"success" | "mfa-required" | "error"> => {
    setMfaCodeError("");
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("All password fields are required.", "error");
      return "error";
    }

    if (!validateStrongPassword(newPassword)) {
      showToast(
        "Your new password must be at least 8 characters long and include uppercase, lowercase, number, and symbol characters.",
        "error"
      );
      return "error";
    }

    if (newPassword !== confirmPassword) {
      showToast("New password and confirmation do not match.", "error");
      return "error";
    }

    if (currentPassword === newPassword) {
      showToast("Your new password must be different from the current one.", "error");
      return "error";
    }

    try {
      setIsPasswordSaving(true);

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          ...(submittedMfaCode ? { mfaCode: submittedMfaCode } : {}),
        }),
      });

      const data = await response.json();

      if (data?.mfaRequired) {
        setMfaCode("");
        setMfaCodeError("");
        setMfaCodeModalOpen(true);
        return "mfa-required";
      }

      if (!response.ok) {
        const errorMessage = data.error || "Password update failed. Please try again.";
        if (submittedMfaCode) {
          setMfaCodeError(errorMessage);
        } else {
          showToast(errorMessage, "error");
        }
        return "error";
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showToast("Password updated successfully.", "success");
      setPasswordChangedModalOpen(true);
      return "success";
    } catch (error) {
      console.error("Error updating password:", error);
      showToast("Password update failed. Please try again.", "error");
      return "error";
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitPasswordChange();
  };

  const handleMfaCodeSubmit = async () => {
    const code = mfaCode.trim();

    if (!/^\d{6}$/.test(code)) {
      setMfaCodeError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    try {
      setIsVerifyingMfaCode(true);
      const result = await submitPasswordChange(code);
      if (result === "success") {
        setMfaCodeModalOpen(false);
      }
    } catch (error) {
      console.error("Error verifying MFA code:", error);
      setMfaCodeError("We couldn't verify that code. Please try again.");
    } finally {
      setIsVerifyingMfaCode(false);
    }
  };

  const handleGlobalSignOut = async () => {
    try {
      setIsSigningOut(true);
      await fetch("/api/auth/signout", { method: "POST" });
      await supabase.auth.signOut({ scope: "local" });
      router.replace(
        `/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`
      );
    } catch (error) {
      console.error("Error signing out:", error);
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      setDeleteAccountModalOpen(false);

      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || "Unable to delete your account right now.", "error");
        return;
      }

      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting account:", error);
      showToast("Unable to delete your account right now.", "error");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#f7fbfb]">
        <Loader size="md" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F6F4EF]">
      {/* HERO HEADER */}
      <header className="site-main-px relative mt-12 overflow-hidden bg-[linear-gradient(135deg,#0A4F49_0%,#073b37_100%)] pt-8 pb-10 text-white sm:pt-10 sm:pb-14">
        {/* Decorative SVG matching Settings & Security Theme */}
        <svg
          className="pointer-events-none absolute right-[300px] bottom-14 h-[160px] w-[150px] opacity-[.14]"
          viewBox="160 70 840 850"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Security Perimeter Rings */}
          <circle
            cx="580"
            cy="520"
            r="370"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeDasharray="16 12"
            opacity="0.6"
          />
          <circle
            cx="580"
            cy="520"
            r="290"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            opacity="0.45"
          />
          <circle
            cx="580"
            cy="520"
            r="210"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="8 8"
            opacity="0.5"
          />
          <line
            x1="580"
            y1="120"
            x2="580"
            y2="155"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.6"
          />
          <line
            x1="970"
            y1="520"
            x2="935"
            y2="520"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.6"
          />
          <line
            x1="190"
            y1="520"
            x2="225"
            y2="520"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Security Shield Crest Aura */}
          <path
            d="M 580 140 Q 720 140 770 230 C 770 430 670 560 580 640 C 490 560 390 430 390 230 Q 440 140 580 140 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeDasharray="18 14"
            opacity="0.55"
          />

          {/* Security & Shield Keyhole Emblem */}
          <g transform="translate(760, 170)" opacity="0.75">
            <path
              d="M 40 0 C 18 0 0 18 0 40 C 0 70 40 110 40 110 C 40 110 80 70 80 40 C 80 18 62 0 40 0 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
            />
            <circle cx="40" cy="38" r="12" fill="currentColor" />
            <polygon points="34,44 46,44 49,66 31,66" fill="currentColor" />
          </g>

          {/* Verified Security Badge */}
          <g transform="translate(210, 610)" opacity="0.7">
            <circle cx="36" cy="36" r="32" fill="none" stroke="currentColor" strokeWidth="5" />
            <circle
              cx="36"
              cy="36"
              r="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 6"
            />
            <polyline
              points="24,36 32,44 48,26"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Rahvana Bird */}
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M236,880C228,876 222,867 222,860C222,854 229,840 237,832C244,824 270,806 281,801C284,800 296,794 300,792C307,789 328,781 348,774C352,772 358,770 360,770C361,769 364,768 366,768C367,768 370,767 371,766C372,766 376,764 380,763C383,762 387,761 390,760C392,760 397,758 401,757C405,756 413,754 418,753C424,751 429,750 430,750C432,750 448,740 452,735C454,734 458,730 462,728C482,713 509,687 523,667C529,659 529,657 523,657C518,657 500,652 492,648C487,646 474,640 469,637C449,626 418,594 404,570C400,564 399,562 389,556C359,535 336,510 321,479C307,452 300,426 300,400C300,383 301,378 306,374C311,370 319,373 326,381C327,383 330,386 331,387C332,389 333,390 333,390C333,391 335,394 338,398C340,403 342,406 342,407C342,407 344,411 346,416C348,421 352,429 354,434C356,440 358,445 359,446C359,448 361,452 363,457C365,462 367,469 369,472C371,476 372,480 372,481C372,481 373,484 374,486C377,493 378,496 379,500C380,502 383,507 384,511C386,514 387,517 387,518C387,518 388,521 390,525C392,529 394,533 395,535C397,540 397,541 402,550C421,585 441,608 468,626C475,631 496,642 498,642C498,642 500,643 502,643C509,646 526,650 532,650C535,650 535,650 541,639C544,632 546,626 546,626C546,625 546,624 547,623C548,622 552,609 557,591C563,564 561,527 551,502C540,474 522,455 487,434C485,433 465,423 462,421C454,418 432,409 421,405C417,403 412,401 410,400C409,400 405,398 403,397C398,396 393,393 382,388C368,382 366,381 361,378C358,376 356,375 355,375C355,375 352,374 350,372C347,371 345,369 344,368C308,347 280,314 266,276C263,267 258,251 257,245C256,242 254,236 254,233C249,216 247,184 248,161C249,142 252,136 259,132C269,127 278,135 293,159C311,187 325,207 337,220C339,223 344,229 347,232C366,254 396,279 416,290C419,291 422,293 424,294C428,297 442,303 451,308C462,313 471,317 476,319C490,325 493,326 502,331C507,333 516,338 520,340C525,343 531,346 533,347C540,351 550,358 560,365C566,369 572,374 573,375C580,380 602,402 609,412C620,427 622,430 630,446C635,457 637,462 643,480C646,488 649,504 653,525C659,563 660,567 668,567C671,567 673,566 675,566C676,565 677,564 678,564C680,564 710,541 728,525C732,522 744,511 754,501C779,477 785,472 798,464C816,454 834,449 854,452C869,454 879,458 892,469C898,474 902,476 913,477C935,480 943,482 943,485C942,487 935,491 930,492C921,494 907,500 894,507C880,515 866,529 858,544C852,555 846,567 846,569C846,570 846,571 845,572C845,572 843,576 842,581C839,589 838,592 835,600C835,602 833,606 832,610C831,615 826,630 822,640C810,675 776,713 739,732C735,734 731,737 730,737C729,738 721,742 714,744C678,758 649,762 609,760C585,759 577,758 568,757C521,751 463,751 439,757C434,758 402,783 383,800C377,805 370,810 368,813C359,820 353,825 340,836C312,859 289,874 269,880C261,883 242,883 236,880ZM259,873C275,872 299,859 323,840C328,836 334,831 337,829C339,826 348,819 355,813C366,803 377,794 395,780C396,778 398,777 399,776C400,775 403,773 406,770C415,763 417,761 409,763C406,764 398,767 391,769C373,773 378,772 340,785C336,786 332,787 331,788C330,788 328,789 326,790C308,797 285,807 276,812C248,829 231,848 231,861C231,866 237,873 243,874C245,874 247,874 248,875C248,875 250,875 251,874C252,874 256,874 259,873ZM652,751C666,749 677,747 683,745C697,741 700,740 711,736C717,734 723,731 725,730C726,730 727,729 728,729C728,729 731,728 733,726C736,724 738,723 739,723C740,723 759,710 766,704C774,697 788,683 791,678C798,669 804,659 804,659C804,658 805,657 805,656C807,654 816,632 820,622C821,617 823,612 823,611C824,610 826,603 828,596C830,589 833,579 835,574C837,568 839,562 840,561C840,560 841,557 842,556C842,555 843,553 844,552C856,529 871,512 888,502C897,497 911,490 914,489C923,488 921,485 911,485C900,484 895,481 884,473C874,466 870,463 860,461C848,458 829,459 816,464C797,472 785,481 746,520C739,527 730,535 726,538C722,541 715,546 710,551C679,575 669,579 661,574C652,568 650,562 643,521C635,473 625,446 601,414C593,404 573,384 561,375C548,365 523,350 510,344C508,343 505,341 504,341C489,333 476,327 475,327C474,327 471,326 468,324C464,323 459,320 455,318C411,299 383,280 352,248C325,221 316,208 282,157C266,133 260,132 257,154C255,168 257,210 260,222C260,224 262,229 262,234C265,245 268,257 273,269C274,272 276,276 276,277C279,287 291,309 301,321C309,332 337,357 340,357C341,357 344,359 347,361C350,363 357,367 362,369C376,376 392,384 392,384C393,384 396,385 399,387C405,390 424,398 432,401C435,402 441,404 446,407C452,409 456,411 457,411C457,411 459,412 461,412C462,413 468,416 474,419C489,426 491,427 498,431C536,456 554,479 565,519C567,526 567,529 567,554C567,581 567,589 563,600C562,601 562,604 561,606C561,609 559,615 557,620C555,626 552,632 552,633C552,635 549,639 547,643C545,647 544,650 544,651C545,651 552,651 559,651C594,651 625,641 668,615C673,612 678,609 679,609C680,608 683,607 686,605C691,602 694,602 694,604C694,605 678,617 667,624C654,633 636,642 627,646C596,656 584,659 556,660L538,660L534,666C530,672 530,673 522,682C518,686 513,692 511,695C507,699 488,718 481,723C474,729 462,738 460,740C457,742 454,745 455,745C455,746 463,745 472,745C492,743 529,745 557,748C576,750 595,752 602,752C612,753 645,752 652,751ZM390,545C390,544 390,543 389,542C386,537 378,518 371,501C369,495 365,486 363,482C362,477 359,470 357,466C356,462 353,455 351,450C349,445 347,440 347,438C335,406 319,380 312,381C310,381 309,382 309,388C308,395 309,420 310,424C311,425 312,429 312,431C312,433 314,438 314,440C315,442 317,447 318,449C324,472 342,502 359,520C374,536 390,549 390,545Z"
          />
        </svg>

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-[7px] rounded-full border border-[#E1F2EE]/22 bg-[#E1F2EE]/14 px-3 py-[5px] text-[11.5px] font-semibold tracking-[0.04em] text-[#E1F2EE] uppercase backdrop-blur-sm">
              <Shield size={13} strokeWidth={2.5} />
              <span>Security &amp; Preferences</span>
            </div>
            <h1 className="text-[clamp(32px,4.5vw,44px)] leading-[1.15] font-semibold tracking-[-0.015em] text-white">
              Account Settings
            </h1>
            <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-white/88">
              Manage your account security, authentication preferences, and active sessions.
            </p>
          </div>
        </div>
      </header>

      {/* PAGE BODY & CONTENT */}
      <main className="relative overflow-hidden bg-[#f8fafa]">
        {/* Subtle Ambient Background Gradients */}
        <div className="pointer-events-none absolute inset-0">
          <div className="grid-bg absolute inset-0 opacity-40" />
          <div className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-[#14a0a6]/10 blur-[130px]" />
          <div className="absolute top-28 -right-40 h-[520px] w-[520px] rounded-full bg-[#32e0c4]/10 blur-[150px]" />
          <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-[#0d7377]/5 blur-[130px]" />
        </div>

        <div className="site-main-px relative z-20 mx-auto max-w-[1100px] space-y-6 pt-6 pb-24 sm:pt-8">
          {/* TOP SUMMARY CARDS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Signed In As */}
            <div className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_rgba(15,61,63,0.04)] backdrop-blur-xl transition-all duration-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Signed in as
                  </p>
                  <p className="mt-1 truncate text-base font-bold text-slate-900">{user.email}</p>
                  <p className="mt-3.5 text-[11px] font-medium text-slate-500">
                    Active personal account
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f6] text-[#0d7377]">
                  <User className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Security Status */}
            <div className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_rgba(15,61,63,0.04)] backdrop-blur-xl transition-all duration-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Security Status
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {profile?.mfa_enabled ? "2FA is Enabled" : "2FA is Disabled"}
                  </p>
                  <p className="mt-3.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    <Info className="h-3.5 w-3.5 shrink-0 text-[#0d7377]" />
                    <span className="truncate">
                      {profile?.mfa_enabled
                        ? "Account protected with two-factor authentication"
                        : "Recommended: Enable 2FA for better security"}
                    </span>
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f6] text-[#0d7377]">
                  <KeyRound className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* SECURITY & ACCESS */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Security &amp; Access
              </h2>
              <span className="text-xs font-semibold text-[#0d7377]">High Privacy Tier</span>
            </div>

            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,61,63,0.04)]">
              {/* Two-Factor Authentication (2FA) */}
              <div className="p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f6] text-[#0d7377]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          Two-Factor Authentication (2FA)
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${
                            profile?.mfa_enabled
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {profile?.mfa_enabled ? "Enabled" : "Not enabled yet"}
                        </span>
                      </div>
                      <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500 sm:text-sm">
                        Add an extra layer of security to your account. You will enter a quick
                        verification code whenever you sign in from a new device.
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-2 pt-2 sm:flex-col sm:items-end sm:justify-center sm:pt-0">
                    <Switch
                      id="two-factor"
                      checked={!!profile?.mfa_enabled}
                      onCheckedChange={() => router.push("/mfa-setup")}
                      className="data-[state=checked]:bg-[#0d7377]"
                    />
                    <button
                      type="button"
                      onClick={() => router.push("/mfa-setup")}
                      className="text-xs font-semibold text-[#0d7377] transition-colors hover:text-[#0A4F49] hover:underline"
                    >
                      {profile?.mfa_enabled ? "Manage 2FA" : "Set Up 2FA"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Change Password */}
              {canChangePassword && (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsPasswordOpen((prev) => !prev)}
                    className="flex w-full cursor-pointer items-center justify-between p-6 text-left transition hover:bg-slate-50/70"
                    aria-expanded={isPasswordOpen}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f6] text-[#0d7377]">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Change Password</h3>
                        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                          Change your password regularly to keep your account safe and secure.
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isPasswordOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isPasswordOpen && (
                    <div className="border-t border-slate-100 bg-[#fafcfc] p-6 pt-5">
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        {/* Current Password Field */}
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="current-password"
                            className="text-xs font-bold text-slate-700"
                          >
                            Current Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="current-password"
                              type={showCurrentPassword ? "text" : "password"}
                              value={passwordForm.currentPassword}
                              onChange={(e) =>
                                setPasswordForm((prev) => ({
                                  ...prev,
                                  currentPassword: e.target.value,
                                }))
                              }
                              placeholder="Enter current password"
                              autoComplete="current-password"
                              disabled={isPasswordSaving}
                              className="h-10 rounded-xl border-slate-200 bg-white pr-10 text-sm focus-visible:border-[#0d7377] focus-visible:ring-[#0d7377]/20"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword((prev) => !prev)}
                              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
                              aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                            >
                              {showCurrentPassword ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* New Password & Confirm Password */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="new-password"
                              className="text-xs font-bold text-slate-700"
                            >
                              New Password
                            </Label>
                            <div className="relative">
                              <Input
                                id="new-password"
                                type={showNewPassword ? "text" : "password"}
                                value={passwordForm.newPassword}
                                onChange={(e) =>
                                  setPasswordForm((prev) => ({
                                    ...prev,
                                    newPassword: e.target.value,
                                  }))
                                }
                                placeholder="Min. 8 characters"
                                autoComplete="new-password"
                                disabled={isPasswordSaving}
                                className="h-10 rounded-xl border-slate-200 bg-white pr-10 text-sm focus-visible:border-[#0d7377] focus-visible:ring-[#0d7377]/20"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
                                aria-label={showNewPassword ? "Hide password" : "Show password"}
                              >
                                {showNewPassword ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label
                              htmlFor="confirm-password"
                              className="text-xs font-bold text-slate-700"
                            >
                              Confirm Password
                            </Label>
                            <div className="relative">
                              <Input
                                id="confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                value={passwordForm.confirmPassword}
                                onChange={(e) =>
                                  setPasswordForm((prev) => ({
                                    ...prev,
                                    confirmPassword: e.target.value,
                                  }))
                                }
                                placeholder="Re-enter password"
                                autoComplete="new-password"
                                disabled={isPasswordSaving}
                                className="h-10 rounded-xl border-slate-200 bg-white pr-10 text-sm focus-visible:border-[#0d7377] focus-visible:ring-[#0d7377]/20"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                              >
                                {showConfirmPassword ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Hint Box */}
                        <div className="flex items-start gap-2.5 rounded-xl border border-[#0d7377]/15 bg-[#e8f6f6]/60 p-3 text-xs text-slate-600">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0d7377]" />
                          <span>
                            Must be at least 8 characters long, containing at least one uppercase
                            letter and one special symbol.
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                          <Button
                            type="submit"
                            disabled={isPasswordSaving}
                            className="h-10 rounded-xl bg-[#0A4F49] px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#073b37] hover:shadow"
                          >
                            {isPasswordSaving ? (
                              <>
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              "Update Password"
                            )}
                          </Button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPasswordOpen(false);
                              setPasswordForm({
                                currentPassword: "",
                                newPassword: "",
                                confirmPassword: "",
                              });
                            }}
                            className="px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* DEVICE & SESSIONS */}
          <section className="space-y-2.5">
            <div className="px-1">
              <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Device &amp; Sessions
              </h2>
            </div>

            <SecuritySessionsPanel />

            {/* <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_24px_rgba(15,61,63,0.04)]">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f6] text-[#0d7377]">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Sign Out</h3>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      Sign out of your account on this browser, or log out from all devices at once.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmSignOutOpen(true)}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#f1f5f9] px-4 py-2.5 text-xs font-bold text-[#0d7377] transition-colors hover:bg-[#e2e8f0]"
                >
                  <span>Sign Out</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div> */}
          </section>

          {/* DANGER ZONE */}
          <section className="space-y-2.5">
            <div className="px-1">
              <h2 className="text-xs font-bold tracking-wider text-rose-500 uppercase">
                Danger Zone
              </h2>
            </div>

            <div className="overflow-hidden rounded-2xl border border-rose-200/80 bg-white p-6 shadow-[0_4px_24px_rgba(244,63,94,0.04)]">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Delete Account</h3>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      Permanently delete your account, saved documents, and application history.
                      This cannot be undone.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSurveyOpen(true)}
                  disabled={isDeletingAccount}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ALL MODALS */}
      <SurveyModal
        open={isSurveyOpen}
        onOpenChange={setIsSurveyOpen}
        onContinue={async ({ reason, followUpAnswers, additionalComments }) => {
          const response = await fetch("/api/account-deletion-feedback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reason,
              follow_up_answers: followUpAnswers,
              additional_comments: additionalComments || null,
            }),
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || "Failed to save account deletion feedback.");
          }

          setDeleteAccountModalOpen(true);
        }}
        onSkip={() => {
          setDeleteAccountModalOpen(true);
        }}
      />

      {/* <ConfirmationModal
        open={confirmSignOutOpen}
        onOpenChange={setConfirmSignOutOpen}
        title="Sign out of all devices?"
        description="This will end every active session for your account, including the one on this browser."
        cancelText="Cancel"
        confirmText="Sign Out"
        onConfirm={handleGlobalSignOut}
        loading={isSigningOut}
        confirmVariant="danger"
      /> */}

      <ConfirmationModal
        open={passwordChangedModalOpen}
        onOpenChange={setPasswordChangedModalOpen}
        title="Password Updated"
        description="Your password has been changed successfully. Would you like to sign out of all active devices? This is recommended if you believe your account may have been accessed by someone else."
        cancelText="Stay Signed In"
        confirmText="Sign Out All Devices"
        confirmVariant="primary"
        loading={isSigningOut}
        onConfirm={async () => {
          setIsSigningOut(true);

          try {
            const response = await fetch("/api/auth/signout", {
              method: "POST",
            });

            if (!response.ok) {
              throw new Error("Unable to sign out of all devices.");
            }

            setPasswordChangedModalOpen(false);
            router.replace("/login");
            router.refresh();
          } catch (error) {
            console.error("Global sign-out failed:", error);
            showToast("Unable to sign out of all devices. Please try again.", "error");
          } finally {
            setIsSigningOut(false);
          }
        }}
      />

      <MFACodeModal
        open={mfaCodeModalOpen}
        onOpenChange={(open) => {
          setMfaCodeModalOpen(open);
          if (!open) {
            setMfaCode("");
            setMfaCodeError("");
          }
        }}
        value={mfaCode}
        onValueChange={setMfaCode}
        onSubmit={handleMfaCodeSubmit}
        loading={isVerifyingMfaCode}
        error={mfaCodeError}
        title="Verify Your Identity"
        description="For security, enter the 6-digit code from your authenticator app before changing your password."
        confirmText="Verify Code"
        loadingText="Verifying..."
        variant="primary"
      />

      <ConfirmationModal
        open={deleteAccountModalOpen}
        onOpenChange={setDeleteAccountModalOpen}
        title="Delete account?"
        description="This permanently removes your account and the data currently linked to it."
        cancelText="Cancel"
        confirmText="Delete Account"
        onConfirm={handleDeleteAccount}
        loading={isDeletingAccount}
        confirmVariant="danger"
      />
    </div>
  );
}
