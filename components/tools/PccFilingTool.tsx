"use client";

import { useState, useEffect, Suspense, Fragment } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  User,
  Users,
  Phone,
  CreditCard,
  Home,
  Globe,
  AlertCircle,
  Mail,
  Calendar,
  Clock,
  Send,
  Upload,
  X,
  Lock,
  ShoppingBag,
  Sparkles,
  Crown,
  Loader2,
  Coins,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { Loader } from "@/components/ui/spinner";
import { useToast } from "@/app/components/shared/ToastProvider";
import { useWallet } from "@/app/context/WalletContext";
import { E, msg } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import { Input } from "@/components/ui/input";
import type { ToolModeProps } from "@/types/tool-mode";
import { useResolveToolMode } from "@/lib/hooks/useResolveToolMode";
import { normalizePlanTier } from "@/app/context/PlanContext";
import type { PlanTier } from "@/lib/entitlements/config";
import PccRequestCard, { type PccRequestRow } from "@/components/services/PccRequestCard";

export interface PccFilingToolProps extends ToolModeProps {
  /** Journey overlay control. Standalone page omits these → renders inline full-page. */
  isOpen?: boolean;
  onClose?: () => void;
  /** Called after a successful filing so StepView can persist it to journey metadata. */
  onSave?: (record: {
    referenceId: string;
    referenceDate: string;
    location: string;
    status: string;
  }) => void;
  /** Pre-fill from a previously saved journey request. */
  initialData?: Record<string, unknown>;
  candidateInfo?: { id?: string; name?: string; relation?: string; visaCategory?: string };
  /** Existing requests surfaced on the journey intro screen (My-Resources-style cards). */
  existingRequests?: PccRequestRow[];
  /** Journey mode only: block a new filing while an active request / validity window remains. */
  locked?: boolean;
  /** Human-readable reason shown on the intro when `locked` is true. */
  lockHint?: string;
  /** Journey mode only: initial services-status fetch is still in flight. */
  statusLoading?: boolean;
}

const purposeOptions = [
  { value: "Immigration", label: "Immigration" },
  { value: "Visa", label: "Visa" },
];

const deliveryTypeOptions = [
  { value: "Hard Copy", label: "Hard Copy (Sign with Stamp)" },
  { value: "Digital", label: "Delivered via Email (Digital copy)" },
];

const districtOptions = [
  { value: "Karachi Central", label: "Karachi Central" },
  { value: "Karachi East", label: "Karachi East" },
  { value: "Karachi South", label: "Karachi South" },
  { value: "Karachi West", label: "Karachi West" },
  { value: "Korangi", label: "Korangi" },
  { value: "Malir", label: "Malir" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Sukkur", label: "Sukkur" },
];

const countryOptions = [
  { value: "USA", label: "USA" },
  { value: "UK", label: "UK" },
  { value: "Canada", label: "Canada" },
  { value: "Australia", label: "Australia" },
  { value: "UAE", label: "UAE" },
  { value: "Saudi Arabia", label: "Saudi Arabia" },
];

const policeStationOptions = [
  { value: "Clifton", label: "Clifton" },
  { value: "Defense", label: "Defense" },
  { value: "Gulshan", label: "Gulshan" },
];

const policeCaseStatusOptions = [
  { value: "Acquitted", label: "Acquitted" },
  { value: "Released", label: "Released US 169/497 crpc" },
  { value: "Pending", label: "Pending Trial" },
];

interface CheckoutStepProps {
  formData: any;
  error: string | null;
  loading: boolean;
  walletBalance: number | null;
  walletLoading: boolean;
  onTopup: (deficit: number) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const CheckoutStep = ({
  formData,
  error,
  loading,
  walletBalance,
  walletLoading,
  onTopup,
  onBack,
  onSubmit,
}: CheckoutStepProps) => {
  const costCredits = 25;
  const hasWalletCredits = walletBalance !== null && walletBalance >= costCredits;
  const deficit = Math.max(costCredits, costCredits - (walletBalance ?? 0));

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="mb-6 flex flex-col items-start gap-2 md:flex-row md:items-center">
        <div className="bg-primary rounded px-3 py-1 font-semibold text-white">Checkout</div>
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Payment & Confirmation</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        {/* Left column: Request summary */}
        <div className="space-y-4 md:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <h4 className="text-xs font-bold tracking-tight text-gray-400 uppercase">
              Request Summary
            </h4>
            <div className="mt-3 space-y-2">
              <p className="text-sm font-semibold text-gray-800">{formData.fullName}</p>
              <p className="text-xs text-gray-500">
                CNIC: <span className="font-medium text-gray-700">{formData.cnic}</span>
              </p>
              <p className="text-xs text-gray-500">
                District: <span className="font-medium text-gray-700">{formData.district}</span>
              </p>
              <p className="text-xs text-gray-500">
                Purpose: <span className="font-medium text-gray-700">{formData.purpose}</span>
              </p>
              <p className="text-xs text-gray-500">
                Delivery: <span className="font-medium text-gray-700">{formData.deliveryType}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-gray-200/60 bg-gray-50 p-5">
            <div className="flex items-center gap-2">
              <CreditCard className="text-primary h-4 w-4 shrink-0" />
              <h5 className="text-xs font-bold tracking-wide text-gray-900 uppercase">
                Secure Transaction
              </h5>
            </div>
            <p className="w-full text-xs leading-relaxed text-gray-500">
              Standalone requests are paid with your Rahvana Wallet credits ($1 = 1 credit). If your
              balance is short, you can top up instantly via Stripe.
            </p>
          </div>
        </div>

        {/* Right column: Cart breakdown */}
        <div className="md:col-span-2">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-gray-50/55 p-6">
            <div>
              <h4 className="mb-4 flex items-center gap-2 border-b pb-2 text-sm font-bold tracking-wider text-gray-900 uppercase">
                <ShoppingBag className="text-primary h-4 w-4" />
                Price Breakdown
              </h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-600">1x PCC Filing (Sindh)</span>
                  <span className="font-bold text-gray-800">25 Credits ($25.00)</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-600">Wallet Balance</span>
                  <span className="font-bold text-gray-800">
                    {walletLoading ? "..." : `${walletBalance ?? 0} Credits`}
                  </span>
                </div>

                {hasWalletCredits && (
                  <div className="flex items-center justify-between text-sm text-[#0d7377]">
                    <span className="font-medium">Balance After Booking</span>
                    <span className="font-bold">{(walletBalance ?? 25) - costCredits} Credits</span>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-4">
                  <span className="text-base font-bold text-gray-900">Total Due</span>
                  <span className="text-xl font-black text-gray-900">25 Credits ($25.00)</span>
                </div>
              </div>

              {hasWalletCredits ? (
                <div className="mt-5 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 p-3">
                  <Coins className="h-4 w-4 flex-shrink-0 text-[#0d7377]" />
                  <span className="text-[11px] font-bold text-teal-800">
                    25 credits will be deducted from your Rahvana Wallet upon confirmation.
                  </span>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                  <div className="flex items-start gap-2">
                    <Coins className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">
                        Insufficient Wallet Balance
                      </p>
                      <p className="mt-0.5 text-[11px] text-amber-700">
                        You have {walletBalance ?? 0} credits. 25 credits are required to file this
                        PCC request.
                      </p>
                      <button
                        type="button"
                        onClick={() => onTopup(deficit)}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#0d7377] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0a5c5f]"
                      >
                        <Coins size={12} /> Top up {deficit} Credits (${deficit})
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onBack}
                className="w-full rounded-2xl bg-gray-100 px-6 py-3.5 text-center text-sm font-bold text-gray-700 transition-all hover:bg-gray-200 active:scale-[0.99] sm:w-auto sm:py-3"
              >
                Back
              </button>
              <button
                type="button"
                onClick={hasWalletCredits ? onSubmit : () => onTopup(deficit)}
                disabled={loading}
                className="bg-primary hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8 sm:py-3"
              >
                {loading
                  ? "Processing..."
                  : hasWalletCredits
                    ? "Pay 25 Credits & Confirm"
                    : `Top up ${deficit} Credits to Submit`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// interface SuccessStepProps {
//   onReset: () => void;
// }

function PoliceApplyContent({
  isOpen = true,
  onClose,
  onSave,
  initialData,
  existingRequests,
  locked,
  lockHint,
  statusLoading,
  embedded,
  mode: propMode,
  journeyContext: propContext,
  journeyTier: propJourneyTier,
}: PccFilingToolProps) {
  // const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { activeCandidate, activeCandidateId, isMultiCandidate } = useCandidate();
  const { profile } = useUserProfile();
  const { showToast } = useToast();
  // const province = searchParams.get("province") || "";
  const [currentStep, setCurrentStep] = useState(1);
  // Journey-only intro gate (mirrors the medical tool): show a "what is this service"
  // screen first, reveal the filing wizard only after the user clicks Apply.
  const [started, setStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const wallet = useWallet();
  const [referenceId, setReferenceId] = useState("");

  // 1) Mode resolution — journey when embedded in StepView, standalone otherwise.
  const { isJourney, journeyContext, journeyTier } = useResolveToolMode({
    mode: propMode,
    journeyContext: propContext,
    journeyTier: propJourneyTier,
  });

  // 2) Effective tier — journey tier when embedded, null otherwise
  const rawJourneyTier = propJourneyTier ?? journeyTier ?? journeyContext?.subscriptionTier;
  const journeyTierEffective: PlanTier | null =
    isJourney && rawJourneyTier ? normalizePlanTier(rawJourneyTier) : null;
  void journeyTierEffective;

  const [formData, setFormData] = useState({
    purpose: "Immigration",
    deliveryType: "",
    email: "",
    fullName: "",
    fatherName: "",
    dob: "",
    cnic: "",
    cnicIssue: "",
    cnicExpiry: "",
    passport: "",
    passportIssue: "",
    passportExpiry: "",
    mobile: "",
    address: "",
    stayFrom: "",
    stayTo: "",
    district: "",
    residingIn: "Pakistan",
    residingCountry: "",
    targetCountry: "United States",
    arrested: "No",
    firNo: "",
    firYear: "",
    policeStation: "",
    status: "",
    witness1Name: "",
    witness1Father: "",
    witness1Cnic: "",
    witness1Contact: "",
    witness1Address: "",
    witness2Name: "",
    witness2Father: "",
    witness2Cnic: "",
    witness2Contact: "",
    witness2Address: "",
  });

  // Auto-fill active candidate biographics
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      fullName:
        activeCandidate.fullName ||
        (profile?.name?.first
          ? `${profile.name.first} ${profile.name.last || ""}`.trim()
          : prev.fullName),
      cnic: activeCandidate.cnic || profile?.cnic || prev.cnic,
      passport: activeCandidate.passportNumber || profile?.passportNumber || prev.passport,
      passportIssue: profile?.passportIssueDate || prev.passportIssue,
      passportExpiry: profile?.passportExpiry || prev.passportExpiry,
      dob: activeCandidate.dateOfBirth || profile?.dateOfBirth || prev.dob,
      email: prev.email || profile?.sponsor?.email || user?.email || "",
      mobile: prev.mobile || profile?.phone || profile?.sponsor?.phone || "",
      address:
        prev.address ||
        (profile?.currentAddress
          ? `${profile.currentAddress.street || ""}, ${profile.currentAddress.city || ""}`.trim()
          : ""),
      fatherName:
        prev.fatherName ||
        (profile?.father?.name?.first
          ? `${profile.father.name.first} ${profile.father.name.last || ""}`.trim()
          : ""),
    }));
  }, [activeCandidate, profile, user]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const SuccessStep = () => {
    // const { t } = useLanguage();
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h2 className="mb-4 text-xl font-bold text-slate-900 sm:text-2xl">
          Request Submitted Successfully!
        </h2>
        <p className="mb-3 text-slate-600">
          Your request Id is <span className="text-sm font-bold text-slate-900">{referenceId}</span>
        </p>
        <p className="mb-8 text-slate-600">
          Your PCC request has been received. Our team will process your request and you will
          receive a confirmation once the process is completed.
        </p>
        <div className="flex justify-center gap-4">
          <Link href={"/resources?tab=services"}>
            <Button onClick={() => {}} className="bg-teal-600 text-white hover:bg-teal-700">
              Check Status
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  const formatCNIC = (value: string) => {
    const digits = value.replace(/\D/g, "");
    let formatted = "";
    if (digits.length > 0) formatted += digits.substring(0, 5);
    if (digits.length > 5) formatted += "-" + digits.substring(5, 12);
    if (digits.length > 12) formatted += "-" + digits.substring(12, 13);
    return formatted;
  };

  const formatMobile = (value: string) => {
    const digits = value.replace(/\D/g, "");
    let formatted = "";
    if (digits.length > 0) formatted += digits.substring(0, 4);
    if (digits.length > 4) formatted += "-" + digits.substring(4, 11);
    return formatted;
  };

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    judgmentCopy: null,
    photograph: null,
    passportCopy: null,
    utilityBill: null,
    policeLetter: null,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let newValue = value;

    if (
      name.toLowerCase().includes("cnic") &&
      !name.toLowerCase().includes("issue") &&
      !name.toLowerCase().includes("expiry")
    ) {
      newValue = formatCNIC(value);
      if (newValue.replace(/\D/g, "").length < 13) {
        setErrors((prev) => ({ ...prev, [name]: "CNIC must be 13 digits" }));
      } else {
        setErrors((prev) => {
          const newErr = { ...prev };
          delete newErr[name];
          return newErr;
        });
      }
    }

    if (name.toLowerCase().includes("mobile") || name.toLowerCase().includes("contact")) {
      newValue = formatMobile(value);
      const digits = newValue.replace(/\D/g, "");
      if (digits.length < 11) {
        setErrors((prev) => ({
          ...prev,
          [name]: "Phone number must be 11 digits",
        }));
      } else {
        setErrors((prev) => {
          const newErr = { ...prev };
          delete newErr[name];
          return newErr;
        });
      }
    }

    if (name === "email") {
      if (value && !validateEmail(value)) {
        setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
      } else {
        setErrors((prev) => {
          const newErr = { ...prev };
          delete newErr.email;
          return newErr;
        });
      }
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();

      // Photograph and Passport Copy: JPG, PNG
      if (name === "photograph" || name === "passportCopy") {
        if (!["jpg", "jpeg", "png"].includes(ext || "")) {
          showToast("Only JPG and PNG formats are allowed for this field.", "error");
          return;
        }
      }

      // Utility Bill and Police Letter: PDF
      if (name === "utilityBill" || name === "policeLetter") {
        if (ext !== "pdf") {
          showToast("Only PDF format is allowed for this field.", "error");
          return;
        }
      }

      // File Size Check (Max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("File size exceeds 5MB limit.", "error");
        return;
      }

      setFiles((prev) => ({ ...prev, [name]: file }));
    }
  };

  const validateStep = (step: number) => {
    let isValid = true;
    // let newErrors = { ...errors }; // Keep existing regex errors

    if (step === 1) {
      if (Object.keys(errors).length > 0) {
        const firstErr = Object.values(errors)[0];
        showToast(firstErr || "Please fix validation errors in Step 1", "error");
        return false;
      }

      if (!formData.purpose) isValid = false;
      if (!formData.deliveryType) isValid = false;
      if (!formData.email) isValid = false;
      if (!formData.fullName) isValid = false;
      if (!formData.fatherName) isValid = false;
      if (!formData.dob) isValid = false;
      if (!formData.cnic) isValid = false;
      if (!formData.cnicIssue) isValid = false;
      if (!formData.cnicExpiry) isValid = false;
      if (!formData.mobile) isValid = false;
      if (!formData.address) isValid = false;
      if (!formData.stayFrom) isValid = false;
      if (!formData.stayTo) isValid = false;
      if (!formData.district) isValid = false;
      if (formData.residingIn === "Abroad" && !formData.residingCountry) isValid = false;
      if (!formData.targetCountry) isValid = false;

      // Passport checks (assuming required)
      if (!formData.passport) isValid = false;
      if (!formData.passportIssue) isValid = false;
      if (!formData.passportExpiry) isValid = false;

      if (!isValid) {
        showToast(msg(E.POLICE_STEP1_INCOMPLETE), "error");
      }
    }

    if (step === 2) {
      if (
        !formData.witness1Name ||
        !formData.witness1Father ||
        !formData.witness1Cnic ||
        !formData.witness1Contact ||
        !formData.witness1Address
      )
        isValid = false;

      if (
        !formData.witness2Name ||
        !formData.witness2Father ||
        !formData.witness2Cnic ||
        !formData.witness2Contact ||
        !formData.witness2Address
      )
        isValid = false;

      if (!isValid) showToast("Please fill all details for both witnesses in Step 2", "error");
    }

    if (step === 3) {
      if (!files.photograph) isValid = false;
      if (!files.passportCopy) isValid = false;
      if (!files.utilityBill) isValid = false;
      if (!files.policeLetter) isValid = false;

      if (formData.arrested === "Yes") {
        if (!formData.firNo) isValid = false;
        if (!formData.firYear) isValid = false;
        if (!formData.policeStation) isValid = false;
        if (!formData.status) isValid = false;
        if (!files.judgmentCopy) isValid = false;
      }

      if (!isValid) {
        showToast(
          "Please upload all required documents" +
            (formData.arrested === "Yes" ? " including arrest details." : "."),
          "error"
        );
      }
    }

    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Journey mode has no payment/checkout step — finalize directly from the last
      // form step (standalone continues to the "Payment & Confirmation" step 4).
      if (isJourney && currentStep === 3) {
        void handleCheckoutSubmit();
        return;
      }
      if (currentStep < 4) setCurrentStep(currentStep + 1);
    }
  };

  const handleCheckoutSubmit = async () => {
    try {
      setCheckoutLoading(true);
      setCheckoutError(null);

      // 1. Save application (as awaiting payment in standalone, directly active in journey)
      const payload = {
        ...formData,
        userId: user?.id,
        candidate_id: activeCandidateId || "candidate-1",
        candidate_name: activeCandidate.fullName || activeCandidate.label || "",
        // Origin tag: journey-embedded requests are kept out of standalone My Resources.
        ...(isJourney
          ? { source: "journey", journey_slug: journeyContext?.journeySlug || null }
          : { source: "standalone" }),
        awaitingPayment: !isJourney,
      };

      const response = await fetch("/api/police-verification/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Submission failed");
      }

      const { id, requestId } = result;
      setReferenceId(requestId);

      // 2. Upload files (attached regardless of payment status)
      const uploadPromises = Object.entries(files).map(async ([key, file]) => {
        if (!file) return;
        const fd = new FormData();
        fd.append("file", file);
        fd.append("requestId", id);
        fd.append("fileType", key);
        await fetch("/api/police-verification/upload", { method: "POST", body: fd });
      });
      await Promise.all(uploadPromises);

      // 3a) Journey mode: 0 credits, no wallet, no Stripe — finalize directly.
      if (isJourney) {
        onSave?.({
          referenceId: requestId,
          referenceDate: new Date().toISOString().slice(0, 10),
          location: formData.district || "Sindh",
          status: "requested",
        });
        setCurrentStep(5);
        return;
      }

      // 3b) Standalone mode: strictly deduct 25 wallet credits ($25)
      // Check wallet balance first
      if (wallet.balance === null || wallet.balance < 25) {
        const deficit = Math.max(25, 25 - (wallet.balance ?? 0));
        wallet.openTopup({ amount: deficit });
        setCheckoutError(
          `You need 25 credits for PCC filing (Balance: ${wallet.balance ?? 0} credits). Please top up to proceed.`
        );
        setCheckoutLoading(false);
        return;
      }

      // Sufficient balance: deduct 25 credits atomically for service booking
      try {
        const deductResult = await wallet.deductServiceBooking("pcc-filing-service", id);

        if (deductResult.body.success) {
          setCurrentStep(5);
          return;
        }

        if (deductResult.status === 402) {
          const deficit = deductResult.body.deficit ?? 25;
          wallet.openTopup({ amount: deductResult.body.topupAmount ?? deficit });
          setCheckoutError(
            `Insufficient credits. Please top up ${deficit} credits to complete your application.`
          );
          setCheckoutLoading(false);
          return;
        }

        throw new Error(deductResult.body.error || "Failed to deduct service credits");
      } catch (deductErr: unknown) {
        console.error("Credit deduction failed:", deductErr);
        setCheckoutError(
          deductErr instanceof Error
            ? deductErr.message
            : "Credit deduction failed. Please try again."
        );
        setCheckoutLoading(false);
        return;
      }
    } catch (err) {
      console.error(err);
      setCheckoutError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else router.back();
  };

  const fadeIn = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 },
  };

  // Lock background scroll while the journey overlay is open (mirrors the Sponsorship overlay).
  useEffect(() => {
    if (isJourney && isOpen && !embedded) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isJourney, isOpen, embedded]);

  // Each time the journey overlay opens, show the intro screen first.
  useEffect(() => {
    if (isJourney && isOpen) setStarted(false);
  }, [isJourney, isOpen]);

  // In journey mode this tool is mounted on every step but must stay hidden until the
  // launch card opens it via isOpen. Standalone omits isOpen (defaults true) → renders inline.
  if (!isOpen) return null;

  // Topbar progress mirrors the filing wizard. In journey mode the payment/checkout step (4) is
  // skipped, so the visible wizard is steps 1–3; standalone still counts the checkout (1–4).
  const pccTotalSteps = isJourney ? 3 : 4;
  const pccCurrentStep = currentStep >= pccTotalSteps ? pccTotalSteps : currentStep;
  const pccProgressPct = Math.min(100, Math.round((pccCurrentStep / pccTotalSteps) * 100));

  // Journey intro screen (image 4): shown before the filing wizard. No topbar progress bar /
  // step count here — those appear once the user clicks Apply for PCC.
  const showIntro = isJourney && !started && currentStep < 5;
  if (showIntro) {
    return (
      <div
        className={
          embedded
            ? "w-full font-sans"
            : "animate-in slide-in-from-bottom-[18px] fixed inset-0 z-[150] overflow-y-auto bg-white font-sans duration-[0.28s] ease-in-out"
        }
      >
        {!embedded && (
          <div className="sticky top-0 z-10 flex h-[64px] items-center gap-3 border-b border-[#d0e4f7] bg-white px-4 sm:gap-4 sm:px-6">
            <button
              onClick={onClose}
              aria-label="Close"
              className="hover:bg-primary/10 focus:ring-primary flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-[#f4f7fb] text-[#3a4f63] transition-all outline-none focus:ring-2"
            >
              <X size={16} strokeWidth={2} />
            </button>
            <div className="flex-1" />
            <QuickAccessButton
              item={{
                id: "service-pcc-filing-service-—-sindh",
                title: "Sindh Police Verification Service",
                href: "/police-verification/apply",
                icon_name: "Shield",
              }}
              mode="icon"
            />
          </div>
        )}
        <div className="mx-auto w-full max-w-2xl px-5 py-12">
          <div className="mb-2 text-[11px] font-bold tracking-widest text-teal-700 uppercase">
            PCC Filing Service
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">
            Rahvana submits your PCC application
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-slate-600">
            This service is available for Sindh residents only. Rahvana will handle the application
            submission. You must still pick up the certificate yourself when ready.
          </p>
          {existingRequests && existingRequests.length > 0 && (
            <div className="mb-8">
              <div className="mb-2 text-[11px] font-bold tracking-widest text-teal-700 uppercase">
                Your PCC Requests
              </div>
              <div className="space-y-4">
                {existingRequests.map((req) => (
                  <PccRequestCard key={req.id} req={req} />
                ))}
              </div>
            </div>
          )}
          {statusLoading ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
              <svg
                className="h-4 w-4 animate-spin text-[#0d7377]"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                />
              </svg>
              <span className="text-sm text-slate-600">Checking your existing PCC requests…</span>
            </div>
          ) : locked ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div className="text-sm leading-relaxed text-amber-900">
                {lockHint ||
                  "You already have an active PCC request. You can file another once it completes and its 6-month validity passes."}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setStarted(true)}
              className="w-full cursor-pointer rounded-xl bg-teal-700 py-3.5 font-bold text-white transition-colors hover:bg-teal-800"
            >
              Apply for PCC
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isJourney
          ? embedded
            ? "w-full bg-[#f8fafc] font-sans"
            : "animate-in slide-in-from-bottom-[18px] fixed inset-0 z-[150] overflow-y-auto bg-[#f8fafc] font-sans duration-[0.28s] ease-in-out"
          : "sm:site-main-px site-main-py flex w-full flex-col items-center bg-[#f8fafc] px-2 pt-24 sm:pt-28 md:mt-8 md:pt-4"
      }
    >
      {isJourney && !embedded && (
        <div className="sticky top-0 isolate z-50 mb-4 flex h-[64px] items-center gap-3 border-b border-[#d0e4f7] bg-white px-4 sm:gap-4 sm:px-6">
          {/* Close (left) */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="hover:bg-primary/10 focus:ring-primary flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-[#f4f7fb] text-[#3a4f63] transition-all outline-none focus:ring-2"
          >
            <X size={16} strokeWidth={2} />
          </button>
          {/* Progress (center) */}
          <div className="h-[5px] min-w-4 flex-1 overflow-hidden rounded-[10px] bg-[#d0e4f7]">
            <div
              className="h-full bg-linear-to-r transition-all duration-500"
              style={{ width: `${pccProgressPct}%`, backgroundColor: "#0f766e" }}
            />
          </div>
          <div className="shrink-0 text-[12px] font-medium whitespace-nowrap text-[#6b8097]">
            Step {pccCurrentStep} of {pccTotalSteps}
          </div>
          {/* Quick access (right) */}
          <QuickAccessButton
            item={{
              id: "service-pcc-filing-service-—-sindh",
              title: "Sindh Police Verification Service",
              href: "/police-verification/apply",
              icon_name: "Shield",
            }}
            mode="icon"
          />
        </div>
      )}
      <div
        className={
          isJourney
            ? "flex w-full flex-col"
            : "flex min-h-[700px] w-full flex-col overflow-hidden rounded-none border-0 bg-transparent shadow-none md:rounded-[2.5rem] md:border md:border-gray-100 md:bg-white md:shadow-2xl md:shadow-gray-200/50"
        }
      >
        {/* Journey-only compact heading — keeps the service title + a short description visible
            so users immediately understand what this screen is (standalone uses the sticky header). */}
        {isJourney && (
          <div className="mt-4 mb-5 px-1 text-center">
            <h1 className="flex items-center justify-center gap-2.5 text-xl font-bold text-gray-900">
              <div className="bg-primary/10 shrink-0 rounded-xl p-2">
                <ShieldCheck className="text-primary" size={22} />
              </div>
              Sindh Police Verification Form
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Apply for your Police Character Certificate (PCC) for Sindh.
            </p>
          </div>
        )}
        {embedded && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {[
                { n: 1, label: "Personal Info" },
                { n: 2, label: "Details of Deponents/Guarantor" },
                { n: 3, label: "Documents Required" },
              ]
                .filter((s) => s.n <= pccTotalSteps)
                .map((s, idx) => (
                  <Fragment key={s.n}>
                    {idx > 0 && <div className="h-px w-4 shrink-0 bg-gray-200 md:w-8" />}
                    <div className="flex shrink-0 items-center gap-2 text-sm">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          pccCurrentStep >= s.n
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {s.n}
                      </span>
                      <span
                        className={
                          pccCurrentStep >= s.n ? "font-semibold text-gray-900" : "text-gray-400"
                        }
                      >
                        {s.label}
                      </span>
                    </div>
                  </Fragment>
                ))}
            </div>
          </div>
        )}
        {/* Header (standalone only — journey mode uses the topbar above for title / quick-access / progress) */}
        {!isJourney && (
          <div className="sticky top-[36px] z-20 mb-4 border-b border-gray-100 bg-white px-3 py-4 shadow-sm backdrop-blur-md sm:mb-6 sm:p-6 md:top-0 md:bg-white/80 md:p-8 md:pb-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex flex-wrap items-center gap-6">
                <h1 className="flex items-center gap-3 text-xl font-bold text-gray-900 sm:text-2xl">
                  <div className="bg-primary/10 shrink-0 rounded-xl p-2 sm:rounded-2xl sm:p-2.5">
                    <ShieldCheck className="text-primary" size={28} />
                  </div>
                  {/* {province} */}
                  Sindh Police Verification Form
                </h1>
                {isMultiCandidate && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
                    <span>
                      Applying for:{" "}
                      <strong>
                        {activeCandidate.fullName
                          ? `${activeCandidate.fullName} (${activeCandidate.label})`
                          : activeCandidate.label}
                      </strong>
                    </span>
                  </div>
                )}
                <QuickAccessButton
                  item={{
                    id: "service-pcc-filing-service-—-sindh",
                    title: "Sindh Police Verification Service",
                    href: "/police-verification/apply",
                    icon_name: "Shield",
                  }}
                />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {/* Credit visibility (standalone only — journey mode has no credits) */}
                {/* {!isJourney && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold whitespace-nowrap text-teal-800">
                    <Coins size={14} className="text-[#0d7377]" />
                    25 Credits ($25) • Balance: {wallet.isLoading ? "..." : `${wallet.balance ?? 0} Credits`}
                  </span>
                )} */}
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      s === currentStep
                        ? "bg-primary w-8"
                        : s < currentStep
                          ? "bg-primary/40 w-4"
                          : "w-4 bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div
              className="flex items-center gap-4 overflow-x-auto pb-4 md:gap-6 md:pb-0"
              style={{ scrollbarWidth: "none" }}
            >
              <div className="flex shrink-0 items-center gap-2 text-sm">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    currentStep >= 1 ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  1
                </span>
                <span
                  className={currentStep >= 1 ? "font-semibold text-gray-900" : "text-gray-400"}
                >
                  Personal Info
                </span>
              </div>
              <div className="h-px w-4 shrink-0 bg-gray-200 md:w-8" />
              <div className="flex shrink-0 items-center gap-2 text-sm">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    currentStep >= 2 ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  2
                </span>
                <span
                  className={currentStep >= 2 ? "font-semibold text-gray-900" : "text-gray-400"}
                >
                  Details of Deponents/Guarantor
                </span>
              </div>
              <div className="h-px w-4 shrink-0 bg-gray-200 md:w-8" />
              <div className="flex shrink-0 items-center gap-2 text-sm">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    currentStep >= 3 ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  3
                </span>
                <span
                  className={currentStep >= 3 ? "font-semibold text-gray-900" : "text-gray-400"}
                >
                  Documents Required
                </span>
              </div>

              <div className="h-px w-4 shrink-0 bg-gray-200 md:w-8" />
              <div className="flex shrink-0 items-center gap-2 text-sm">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    currentStep >= 4 ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  4
                </span>
                <span
                  className={currentStep >= 4 ? "font-semibold text-gray-900" : "text-gray-400"}
                >
                  Payment & Confirmation
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-3 pt-8 pb-8 sm:p-6 sm:pt-10 md:p-12 md:pt-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" {...fadeIn} className="space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-bold text-gray-700">Purpose</label>
                    <CustomDropdown
                      value={formData.purpose}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          purpose: value,
                        }))
                      }
                      options={[
                        { value: "Immigration", label: "Immigration" },
                        { value: "Visa", label: "Visa" },
                      ]}
                      className="w-full [&_button]:w-full [&_button]:min-w-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-bold text-gray-700">
                      Certificate Delivery Type
                    </label>
                    <CustomDropdown
                      value={formData.deliveryType}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          deliveryType: value,
                        }))
                      }
                      options={deliveryTypeOptions}
                      placeholder="Select Type"
                      className="w-full [&_button]:w-full [&_button]:min-w-0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-sm font-bold text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail
                      className={`absolute top-1/2 left-4 -translate-y-1/2 ${
                        errors.email ? "text-red-400" : "text-gray-400"
                      }`}
                      size={20}
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className={`w-full rounded-2xl border bg-gray-50 p-4 pl-12 transition-all ${
                        errors.email
                          ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:bg-white"
                          : "focus:border-primary border-transparent focus:bg-white"
                      } outline-none focus:ring-4 ${
                        errors.email ? "focus:ring-red-500/5" : "focus:ring-primary/5"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="ml-1 text-xs font-medium text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-bold text-gray-700">Full Name</label>
                    <div className="relative">
                      <User
                        className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        className="focus:border-primary focus:ring-primary/5 w-full rounded-2xl border border-transparent bg-gray-50 p-4 pl-12 transition-all outline-none focus:bg-white focus:ring-4"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-bold text-gray-700">
                      Father Name / WO / DO
                    </label>
                    <div className="relative">
                      <Users
                        className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type="text"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleChange}
                        placeholder="Enter father/husband name"
                        className="focus:border-primary focus:ring-primary/5 w-full rounded-2xl border border-transparent bg-gray-50 p-4 pl-12 transition-all outline-none focus:bg-white focus:ring-4"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-sm font-bold text-gray-700">Date Of Birth</label>
                  <div className="relative">
                    <Calendar
                      className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="focus:border-primary focus:ring-primary/5 w-full cursor-pointer rounded-2xl border border-transparent bg-gray-50 p-4 pl-12 transition-all outline-none focus:bg-white focus:ring-4"
                    />
                  </div>
                </div>

                <div className="space-y-6 rounded-4xl border border-gray-100 bg-gray-50 p-6">
                  <h3 className="flex items-center gap-2 font-bold text-gray-800">
                    <CreditCard size={20} className="text-primary" /> CNIC Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                        CNIC Number
                      </label>
                      <input
                        type="text"
                        name="cnic"
                        value={formData.cnic}
                        onChange={handleChange}
                        placeholder="XXXXX-XXXXXXX-X"
                        className={`w-full rounded-xl border bg-white p-4 transition-all outline-none ${
                          errors.cnic
                            ? "border-red-300 focus:border-red-500"
                            : "focus:border-primary border-gray-100"
                        }`}
                      />
                      {errors.cnic && (
                        <p className="ml-1 text-[10px] font-bold text-red-500">{errors.cnic}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                        Issue Date
                      </label>
                      <input
                        type="date"
                        name="cnicIssue"
                        value={formData.cnicIssue}
                        onChange={handleChange}
                        className="focus:border-primary w-full rounded-xl border border-gray-100 bg-white p-4 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        name="cnicExpiry"
                        value={formData.cnicExpiry}
                        onChange={handleChange}
                        className="focus:border-primary w-full rounded-xl border border-gray-100 bg-white p-4 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 rounded-4xl border border-gray-100 bg-gray-50 p-6">
                  <h3 className="flex items-center gap-2 font-bold text-gray-800">
                    <Globe size={20} className="text-primary" /> Passport Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                        Passport No
                      </label>
                      <input
                        type="text"
                        name="passport"
                        value={formData.passport}
                        onChange={handleChange}
                        placeholder="Passport Number"
                        className="focus:border-primary w-full rounded-xl border border-gray-100 bg-white p-4 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                        Issue Date
                      </label>
                      <input
                        type="date"
                        name="passportIssue"
                        value={formData.passportIssue}
                        onChange={handleChange}
                        className="focus:border-primary w-full rounded-xl border border-gray-100 bg-white p-4 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        name="passportExpiry"
                        value={formData.passportExpiry}
                        onChange={handleChange}
                        className="focus:border-primary w-full rounded-xl border border-gray-100 bg-white p-4 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-sm font-bold text-gray-700">
                    Mobile (Pakistan cell number)
                  </label>
                  <div className="relative">
                    <Phone
                      className={`absolute top-1/2 left-4 -translate-y-1/2 ${
                        errors.mobile ? "text-red-400" : "text-gray-400"
                      }`}
                      size={20}
                    />
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="e.g. 03XX-XXXXXXX"
                      className={`w-full rounded-2xl border bg-gray-50 p-4 pl-12 transition-all ${
                        errors.mobile
                          ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:bg-white"
                          : "focus:border-primary border-transparent focus:bg-white"
                      } outline-none focus:ring-4 ${
                        errors.mobile ? "focus:ring-red-500/5" : "focus:ring-primary/5"
                      }`}
                    />
                  </div>
                  {errors.mobile && (
                    <p className="ml-1 text-xs font-medium text-red-500">{errors.mobile}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-sm font-bold text-gray-700">
                    Current Address (Verification for Pakistan)
                  </label>
                  <div className="relative">
                    <Home className="absolute top-6 left-4 text-gray-400" size={20} />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter full address"
                      rows={3}
                      className="focus:border-primary focus:ring-primary/5 w-full resize-none rounded-2xl border border-transparent bg-gray-50 p-4 pl-12 transition-all outline-none focus:bg-white focus:ring-4"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-bold text-gray-700">
                      Stay From (as given address)
                    </label>
                    <input
                      type="date"
                      name="stayFrom"
                      value={formData.stayFrom}
                      onChange={handleChange}
                      className="focus:border-primary focus:ring-primary/5 w-full rounded-2xl border border-transparent bg-gray-50 p-4 transition-all outline-none focus:bg-white focus:ring-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-bold text-gray-700">
                      Stay To (as given address)
                    </label>
                    <input
                      type="date"
                      name="stayTo"
                      value={formData.stayTo}
                      onChange={handleChange}
                      className="focus:border-primary focus:ring-primary/5 w-full rounded-2xl border border-transparent bg-gray-50 p-4 transition-all outline-none focus:bg-white focus:ring-4"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-sm font-bold text-gray-700">
                    Select Your Current District
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="focus:border-primary focus:ring-primary/5 w-full rounded-2xl border border-transparent bg-gray-50 p-4 transition-all outline-none focus:bg-white focus:ring-4"
                  >
                    <option value="">Select District</option>
                    <option value="Karachi Central">Karachi Central</option>
                    <option value="Karachi East">Karachi East</option>
                    <option value="Karachi South">Karachi South</option>
                    <option value="Karachi West">Karachi West</option>
                    <option value="Korangi">Korangi</option>
                    <option value="Malir">Malir</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Sukkur">Sukkur</option>
                  </select>
                </div>

                <div className="space-y-6 rounded-3xl border border-gray-100 bg-gray-50 p-6 md:rounded-[2.5rem] md:p-8">
                  <label className="ml-1 text-sm font-bold text-gray-700">Presently Residing</label>
                  <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, residingIn: "Pakistan" }))}
                      className={`flex items-center gap-3 rounded-2xl border-2 px-6 py-3 transition-all ${
                        formData.residingIn === "Pakistan"
                          ? "border-primary shadow-primary/10 text-primary bg-white font-bold shadow-lg"
                          : "border-transparent bg-white/50 text-gray-500 hover:bg-white"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full border-2 ${
                          formData.residingIn === "Pakistan"
                            ? "border-primary bg-primary"
                            : "border-gray-300"
                        }`}
                      />
                      Pakistan
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, residingIn: "Abroad" }))}
                      className={`flex items-center gap-3 rounded-2xl border-2 px-6 py-3 transition-all ${
                        formData.residingIn === "Abroad"
                          ? "border-primary shadow-primary/10 text-primary bg-white font-bold shadow-lg"
                          : "border-transparent bg-white/50 text-gray-500 hover:bg-white"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full border-2 ${
                          formData.residingIn === "Abroad"
                            ? "border-primary bg-primary"
                            : "border-gray-300"
                        }`}
                      />
                      Abroad
                    </button>
                  </div>

                  {formData.residingIn === "Abroad" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <label className="ml-1 text-sm font-bold text-gray-700">Select Country</label>
                      <CustomDropdown
                        value={formData.residingCountry}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            residingCountry: value,
                          }))
                        }
                        options={[
                          { value: "", label: "Select Country" },
                          { value: "USA", label: "USA" },
                          { value: "UK", label: "UK" },
                          { value: "Canada", label: "Canada" },
                          { value: "Australia", label: "Australia" },
                          { value: "UAE", label: "UAE" },
                          { value: "Saudi Arabia", label: "Saudi Arabia" },
                        ]}
                        className="w-full [&_button]:w-full [&_button]:min-w-0"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-sm font-bold text-gray-700">
                    Name of Country for which Certificate is required
                  </label>
                  <Input
                    id="targetCountry"
                    name="targetCountry"
                    // value={formData.targetCountry || "United States"}
                    value="United States"
                    disabled
                    readOnly
                    className="cursor-not-allowed bg-gray-100 font-medium text-gray-700"
                  />
                </div>

                {/* Arrest History & Review Moved inside Step 3 for compact flow */}
                <div className="space-y-6 rounded-3xl border border-orange-100 bg-orange-50 p-6 md:rounded-[2.5rem] md:p-8">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 rounded-2xl bg-orange-100 p-2.5">
                      <AlertCircle className="text-orange-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Arrest History</h3>
                      <p className="text-xs text-gray-500 sm:text-sm">
                        In case you were arrested by Police. Please attach documents if applicable.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 px-1 sm:flex-row sm:gap-8">
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, arrested: "Yes" }))}
                      className={`flex items-center gap-3 rounded-2xl border-2 px-6 py-3 transition-all ${
                        formData.arrested === "Yes"
                          ? "border-orange-500 bg-white font-bold text-orange-600 shadow-lg shadow-orange-500/10"
                          : "border-transparent bg-white/50 text-gray-500 hover:bg-white"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full border-2 ${
                          formData.arrested === "Yes"
                            ? "border-orange-500 bg-orange-500"
                            : "border-gray-300"
                        }`}
                      />
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, arrested: "No" }))}
                      className={`flex items-center gap-3 rounded-2xl border-2 px-6 py-3 transition-all ${
                        formData.arrested === "No"
                          ? "border-gray-700 bg-white font-bold text-gray-700 shadow-lg"
                          : "border-transparent bg-white/50 text-gray-500 hover:bg-white"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full border-2 ${
                          formData.arrested === "No"
                            ? "border-gray-700 bg-gray-700"
                            : "border-gray-300"
                        }`}
                      />
                      No
                    </button>
                  </div>

                  {formData.arrested === "Yes" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-6 pt-4"
                    >
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                            FIR No
                          </label>
                          <input
                            type="text"
                            name="firNo"
                            value={formData.firNo}
                            onChange={handleChange}
                            placeholder="e.g. 123"
                            className="w-full rounded-xl border border-orange-100 bg-white p-4 transition-all outline-none focus:border-orange-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                            FIR Year
                          </label>
                          <input
                            type="text"
                            name="firYear"
                            value={formData.firYear}
                            onChange={handleChange}
                            placeholder="e.g. 2024"
                            className="w-full rounded-xl border border-orange-100 bg-white p-4 transition-all outline-none focus:border-orange-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                            Police Station
                          </label>
                          <select
                            name="policeStation"
                            value={formData.policeStation}
                            onChange={handleChange}
                            className="w-full cursor-pointer rounded-xl border border-orange-100 bg-white p-4 transition-all outline-none focus:border-orange-500"
                          >
                            <option value="">Select Station</option>
                            <option value="Clifton">Clifton</option>
                            <option value="Defense">Defense</option>
                            <option value="Gulshan">Gulshan</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                          Judgment Copy (Attachment)
                        </label>
                        <div className="group relative">
                          <input
                            type="file"
                            onChange={(e) => handleFileChange(e, "judgmentCopy")}
                            className="hidden"
                            id="judgementUpload"
                          />
                          <label
                            htmlFor="judgementUpload"
                            className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-orange-300 bg-white p-4 transition-all group-hover:bg-orange-50/50 hover:border-orange-500"
                          >
                            <div className="rounded-xl bg-orange-50 p-3 transition-colors group-hover:bg-orange-100">
                              <Upload className="text-orange-600" size={20} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="truncate text-sm font-bold text-gray-800">
                                {files.judgmentCopy ? files.judgmentCopy.name : "Choose File"}
                              </p>
                              <p className="text-xs text-gray-400">PDF, JPG, PNG (Max 5MB)</p>
                            </div>
                            {files.judgmentCopy && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setFiles((prev) => ({
                                    ...prev,
                                    judgmentCopy: null,
                                  }));
                                  const inputEl = document.getElementById(
                                    "judgementUpload"
                                  ) as HTMLInputElement;
                                  if (inputEl) inputEl.value = "";
                                }}
                                className="z-10 shrink-0 rounded-lg bg-gray-100 p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                          Status
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="w-full cursor-pointer rounded-xl border border-orange-100 bg-white p-4 transition-all outline-none focus:border-orange-500"
                        >
                          <option value="">Select Status</option>
                          <option value="Acquitted">Acquitted</option>
                          <option value="Released">Released US 169/497 crpc</option>
                          <option value="Pending">Pending Trial</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" {...fadeIn} className="space-y-6 md:space-y-8">
                {/* Witness 1 */}
                <div className="space-y-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:rounded-[2.5rem] md:p-8">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="bg-primary/10 shrink-0 rounded-2xl p-2.5">
                      <User className="text-primary" size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 sm:text-lg">
                        Full Name ( Witness 1 )
                      </h3>
                      <p className="text-xs text-gray-400 sm:text-sm">
                        Enter first guarantor details
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-bold text-gray-700">Name</label>
                      <input
                        type="text"
                        name="witness1Name"
                        value={formData.witness1Name}
                        onChange={handleChange}
                        placeholder="Name"
                        className="focus:border-primary focus:ring-primary/5 w-full rounded-2xl border border-transparent bg-gray-50 p-4 transition-all outline-none focus:bg-white focus:ring-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-bold text-gray-700">
                        Father Name / WO / DO
                      </label>
                      <input
                        type="text"
                        name="witness1Father"
                        value={formData.witness1Father}
                        onChange={handleChange}
                        placeholder="FatherName"
                        className="focus:border-primary focus:ring-primary/5 w-full rounded-2xl border border-transparent bg-gray-50 p-4 transition-all outline-none focus:bg-white focus:ring-4"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-bold text-gray-700">CNIC</label>
                      <input
                        type="text"
                        name="witness1Cnic"
                        value={formData.witness1Cnic}
                        onChange={handleChange}
                        placeholder="XXXXX-XXXXXXX-X"
                        className={`w-full rounded-2xl border bg-gray-50 p-4 transition-all ${
                          errors.witness1Cnic
                            ? "border-red-300 bg-red-50/10"
                            : "focus:border-primary border-transparent focus:bg-white"
                        } focus:ring-primary/5 outline-none focus:ring-4`}
                      />
                      {errors.witness1Cnic && (
                        <p className="ml-1 text-xs font-medium text-red-500">
                          {errors.witness1Cnic}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-bold text-gray-700">Contact No</label>
                      <input
                        type="text"
                        name="witness1Contact"
                        value={formData.witness1Contact}
                        onChange={handleChange}
                        placeholder="03XX-XXXXXXX"
                        className={`w-full rounded-2xl border bg-gray-50 p-4 transition-all ${
                          errors.witness1Contact
                            ? "border-red-300 bg-red-50/10"
                            : "focus:border-primary border-transparent focus:bg-white"
                        } focus:ring-primary/5 outline-none focus:ring-4`}
                      />
                      {errors.witness1Contact && (
                        <p className="ml-1 text-xs font-medium text-red-500">
                          {errors.witness1Contact}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-bold text-gray-700">Address</label>
                    <textarea
                      name="witness1Address"
                      value={formData.witness1Address}
                      onChange={handleChange}
                      placeholder="Enter Address"
                      rows={2}
                      className="focus:border-primary focus:ring-primary/5 w-full resize-none rounded-2xl border border-transparent bg-gray-50 p-4 transition-all outline-none focus:bg-white focus:ring-4"
                    />
                  </div>
                </div>

                {/* Witness 2 */}
                <div className="space-y-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:rounded-[2.5rem] md:p-8">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="bg-primary/10 shrink-0 rounded-2xl p-2.5">
                      <User className="text-primary" size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 sm:text-lg">
                        Full Name ( Witness 2 )
                      </h3>
                      <p className="text-xs text-gray-400 sm:text-sm">
                        Enter second guarantor details
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-bold text-gray-700">Name</label>
                      <input
                        type="text"
                        name="witness2Name"
                        value={formData.witness2Name}
                        onChange={handleChange}
                        placeholder="Name"
                        className="focus:border-primary focus:ring-primary/5 w-full rounded-2xl border border-transparent bg-gray-50 p-4 transition-all outline-none focus:bg-white focus:ring-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-bold text-gray-700">
                        Father Name / WO / DO
                      </label>
                      <input
                        type="text"
                        name="witness2Father"
                        value={formData.witness2Father}
                        onChange={handleChange}
                        placeholder="FatherName"
                        className="focus:border-primary focus:ring-primary/5 w-full rounded-2xl border border-transparent bg-gray-50 p-4 transition-all outline-none focus:bg-white focus:ring-4"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-bold text-gray-700">CNIC</label>
                      <input
                        type="text"
                        name="witness2Cnic"
                        value={formData.witness2Cnic}
                        onChange={handleChange}
                        placeholder="XXXXX-XXXXXXX-X"
                        className={`w-full rounded-2xl border bg-gray-50 p-4 transition-all ${
                          errors.witness2Cnic
                            ? "border-red-300 bg-red-50/10"
                            : "focus:border-primary border-transparent focus:bg-white"
                        } focus:ring-primary/5 outline-none focus:ring-4`}
                      />
                      {errors.witness2Cnic && (
                        <p className="ml-1 text-xs font-medium text-red-500">
                          {errors.witness2Cnic}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-bold text-gray-700">Contact No</label>
                      <input
                        type="text"
                        name="witness2Contact"
                        value={formData.witness2Contact}
                        onChange={handleChange}
                        placeholder="03XX-XXXXXXX"
                        className={`w-full rounded-2xl border bg-gray-50 p-4 transition-all ${
                          errors.witness2Contact
                            ? "border-red-300 bg-red-50/10"
                            : "focus:border-primary border-transparent focus:bg-white"
                        } focus:ring-primary/5 outline-none focus:ring-4`}
                      />
                      {errors.witness2Contact && (
                        <p className="ml-1 text-xs font-medium text-red-500">
                          {errors.witness2Contact}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-bold text-gray-700">Address</label>
                    <textarea
                      name="witness2Address"
                      value={formData.witness2Address}
                      onChange={handleChange}
                      placeholder="Enter Address"
                      rows={2}
                      className="focus:border-primary focus:ring-primary/5 w-full resize-none rounded-2xl border border-transparent bg-gray-50 p-4 transition-all outline-none focus:bg-white focus:ring-4"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" {...fadeIn} className="space-y-6 md:space-y-8">
                <div className="space-y-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:space-y-8 md:rounded-[2.5rem] md:p-8">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="bg-primary/10 shrink-0 rounded-2xl p-2.5">
                      <Upload className="text-primary" size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 sm:text-lg">
                        Documents Required
                      </h3>
                      <p className="text-xs text-gray-400 sm:text-sm">
                        Please upload necessary legal documents
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {/* Photograph */}
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-bold text-gray-700">
                        Passport Size Photograph (.JPG, .PNG)
                      </label>
                      <div className="group relative">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, "photograph")}
                          className="hidden"
                          id="photographUpload"
                        />
                        <label
                          htmlFor="photographUpload"
                          className="hover:border-primary group-hover:bg-primary/5 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 transition-all"
                        >
                          <div className="group-hover:bg-primary/10 rounded-xl bg-white p-3 shadow-sm transition-colors">
                            <Upload className="group-hover:text-primary text-gray-400" size={20} />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-bold text-gray-800">
                              {files.photograph ? files.photograph.name : "Choose File"}
                            </p>
                            <p className="text-xs text-gray-400">Max size 2MB</p>
                          </div>
                          {files.photograph && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFiles((prev) => ({
                                  ...prev,
                                  photograph: null,
                                }));
                                const inputEl = document.getElementById(
                                  "photographUpload"
                                ) as HTMLInputElement;
                                if (inputEl) inputEl.value = "";
                              }}
                              className="z-10 shrink-0 rounded-lg bg-gray-100 p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Passport Copy */}
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-bold text-gray-700">
                        Attach copy of Passport (.JPG, .PNG)
                      </label>
                      <div className="group relative">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, "passportCopy")}
                          className="hidden"
                          id="passportUpload"
                        />
                        <label
                          htmlFor="passportUpload"
                          className="hover:border-primary group-hover:bg-primary/5 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 transition-all"
                        >
                          <div className="group-hover:bg-primary/10 rounded-xl bg-white p-3 shadow-sm transition-colors">
                            <Upload className="group-hover:text-primary text-gray-400" size={20} />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-bold text-gray-800">
                              {files.passportCopy ? files.passportCopy.name : "Choose File"}
                            </p>
                            <p className="text-xs text-gray-400">Max size 5MB</p>
                          </div>
                          {files.passportCopy && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFiles((prev) => ({
                                  ...prev,
                                  passportCopy: null,
                                }));
                                const inputEl = document.getElementById(
                                  "passportUpload"
                                ) as HTMLInputElement;
                                if (inputEl) inputEl.value = "";
                              }}
                              className="z-10 shrink-0 rounded-lg bg-gray-100 p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Utility Bill */}
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-bold text-gray-700">
                        Copy of Utility Bill (.PDF)
                      </label>
                      <div className="group relative">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, "utilityBill")}
                          className="hidden"
                          id="billUpload"
                        />
                        <label
                          htmlFor="billUpload"
                          className="hover:border-primary group-hover:bg-primary/5 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 transition-all"
                        >
                          <div className="group-hover:bg-primary/10 rounded-xl bg-white p-3 shadow-sm transition-colors">
                            <Upload className="group-hover:text-primary text-gray-400" size={20} />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-bold text-gray-800">
                              {files.utilityBill ? files.utilityBill.name : "Choose File"}
                            </p>
                            <p className="text-xs text-gray-400">PDF format required</p>
                          </div>
                          {files.utilityBill && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFiles((prev) => ({
                                  ...prev,
                                  utilityBill: null,
                                }));
                                const inputEl = document.getElementById(
                                  "billUpload"
                                ) as HTMLInputElement;
                                if (inputEl) inputEl.value = "";
                              }}
                              className="z-10 shrink-0 rounded-lg bg-gray-100 p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Police Letter */}
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-bold text-gray-700">
                        Letter regarding Police Verification (.PDF)
                      </label>
                      <div className="group relative">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, "policeLetter")}
                          className="hidden"
                          id="letterUpload"
                        />
                        <label
                          htmlFor="letterUpload"
                          className="hover:border-primary group-hover:bg-primary/5 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 transition-all"
                        >
                          <div className="group-hover:bg-primary/10 rounded-xl bg-white p-3 shadow-sm transition-colors">
                            <Upload className="group-hover:text-primary text-gray-400" size={20} />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-bold text-gray-800">
                              {files.policeLetter ? files.policeLetter.name : "Choose File"}
                            </p>
                            <p className="text-xs text-gray-400">PDF format required</p>
                          </div>
                          {files.policeLetter && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFiles((prev) => ({
                                  ...prev,
                                  policeLetter: null,
                                }));
                                const inputEl = document.getElementById(
                                  "letterUpload"
                                ) as HTMLInputElement;
                                if (inputEl) inputEl.value = "";
                              }}
                              className="z-10 shrink-0 rounded-lg bg-gray-100 p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 rounded-3xl border border-gray-100 bg-gray-50 p-6 md:rounded-[2.5rem] md:p-8">
                  <h3 className="border-b border-gray-200 pb-4 font-bold text-gray-900">
                    Application Review
                  </h3>
                  <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase sm:text-xs">
                        Province
                      </p>
                      <p className="text-sm font-semibold text-gray-700 sm:text-base">
                        {/* {province} */} Sindh
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase sm:text-xs">
                        Purpose
                      </p>
                      <p className="text-sm font-semibold text-gray-700 sm:text-base">
                        {formData.purpose}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase sm:text-xs">
                        Delivery
                      </p>
                      <p className="truncate text-sm font-semibold text-gray-700 sm:text-base">
                        {formData.deliveryType || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase sm:text-xs">
                        District
                      </p>
                      <p className="text-sm font-semibold text-gray-700 sm:text-base">
                        {formData.district || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-primary/5 border-primary/10 flex flex-col items-start gap-2 rounded-2xl border p-4 md:flex-row md:gap-4">
                    <div className="bg-primary/10 shrink-0 rounded-xl p-2">
                      <Clock className="text-primary" size={20} />
                    </div>
                    <p className="text-sm leading-relaxed text-gray-600">
                      By submitting, I confirm that all provided information is accurate and matches
                      my legal documents. Processing takes 3-7 working days.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" {...fadeIn}>
                <CheckoutStep
                  formData={formData}
                  error={checkoutError}
                  loading={checkoutLoading}
                  walletBalance={wallet.balance}
                  walletLoading={wallet.isLoading}
                  onTopup={(deficit) => wallet.openTopup({ amount: deficit })}
                  onBack={() => setCurrentStep(3)}
                  onSubmit={handleCheckoutSubmit}
                />
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div key="step5" {...fadeIn}>
                <SuccessStep />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {currentStep < 4 && (
          <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-gray-100 bg-white/90 px-2 py-4 sm:flex-row sm:p-6 md:bg-white md:p-8">
            <button
              onClick={handleBack}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-50 px-8 py-4 font-bold text-gray-600 transition-all hover:bg-gray-100 sm:w-auto"
            >
              <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-1" />{" "}
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={
                Object.keys(errors).length > 0 ||
                (isJourney && currentStep === 3 && checkoutLoading)
              }
              className="bg-primary hover:bg-primary/90 group md:shadow-primary/25 flex w-full items-center justify-center gap-2 rounded-2xl px-10 py-4 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto md:not-first:shadow-xl"
            >
              {isJourney && currentStep === 3 && checkoutLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Processing…
                </>
              ) : (
                <>
                  Continue{" "}
                  <ChevronRight
                    size={20}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PccFilingTool(props: PccFilingToolProps) {
  return (
    <Suspense fallback={<Loader fullScreen size="lg" text="Loading..." />}>
      <PoliceApplyContent {...props} />
    </Suspense>
  );
}
