"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Globe,
  AlertCircle,
  CheckCircle,
  FileText,
  ChevronRight,
  ChevronLeft,
  X as CloseIcon,
  Crown,
  CreditCard,
  ShoppingBag,
  Sparkles,
  ChevronDown,
  Lock,
  MessageCircle,
  Coins,
} from "lucide-react";
import { useWallet } from "@/app/context/WalletContext";
import type { ToolModeProps } from "@/types/tool-mode";
import { useResolveToolMode } from "@/lib/hooks/useResolveToolMode";
import { usePlan, normalizePlanTier } from "@/app/context/PlanContext";
import type { PlanTier } from "@/lib/entitlements/config";
import type { JourneyServiceRecord } from "@/lib/journey/toolModeGuards";
import { isConsultationRequestLocked } from "@/lib/journey/toolModeGuards";
import ConsultationRequestCard, {
  type ConsultationRow,
} from "@/components/services/ConsultationRequestCard";
import { isUnlimited } from "@/lib/entitlements/config";
import { useFeatureAccess } from "@/lib/usage/useFeatureAccess";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/spinner";
import { CustomDropdown, DropdownOption } from "@/app/components/shared/CustomDropdown";
import { useAuth } from "@/app/context/AuthContext";
import { PageGate } from "@/app/components/entitlements/PageGate";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { useToast } from "@/app/components/shared/ToastProvider";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { PhoneInput } from "@/components/ui/phone-input";
import type { Value as E164Number } from "react-phone-number-input";
import { validatePhoneNumber, formatPhoneNumber } from "@/lib/validation/phone";
import Input from "../ui/input";

export interface BookConsultationToolProps extends ToolModeProps {
  isOpen?: boolean; // journey overlay control; standalone renders inline (default true)
  onClose?: () => void;
  onSave?: (record: {
    referenceId: string;
    referenceDate: string; // selected_slot ISO datetime
    location: string;
    status: string;
  }) => void;
  initialData?: Record<string, unknown>;
  candidateInfo?: { id?: string; name?: string; relation?: string; visaCategory?: string };
  /** My-Resources-style cards on the journey intro screen. */
  existingRequests?: ConsultationRow[];
  /** Three-state intro gate — same props as Medical/PCC. */
  statusLoading?: boolean;
  locked?: boolean;
  lockHint?: string;
}

interface Booking {
  id: string;
  reference_id: string;
  full_name: string;
  email: string;
  visa_category: string;
  issue_category: string;
  status:
    | "confirmed"
    | "pending_approval"
    | "alternatives_proposed"
    | "canceled"
    | "cancelled"
    | "rejected"
    | "completed";
  selected_slot: string;
  alternate_slots?: string[];
  admin_notes?: string;
}

interface TimeSlot {
  id: string;
  date: Date;
  endDate: Date;
  time: string;
  formattedTime: string;
  available: boolean;
}

interface FormData {
  issue_category: string;
  visa_category: string;
  case_stage: string;
  embassy_consulate: string;
  urgency: string;
  preferred_language: string;
  full_name: string;
  email: string;
  whatsapp_phone: string; // E.164 format from PhoneInput
  case_summary: string;
  selected_slot: Date | null;
  alternate_slots: Date[];
  consent: boolean;
}

export default function BookConsultationTool({
  isOpen = true,
  onClose,
  onSave,
  initialData,
  existingRequests,
  statusLoading,
  locked,
  lockHint,
  embedded,
  mode: propMode,
  journeyContext: propContext,
  journeyTier: propJourneyTier,
}: BookConsultationToolProps) {
  // 1) Mode resolution — journey overlay vs standalone page.
  const { isJourney, journeyContext, journeyTier } = useResolveToolMode({
    mode: propMode,
    journeyContext: propContext,
    journeyTier: propJourneyTier,
  });

  const accountPlan = usePlan();
  const rawJourneyTier = propJourneyTier ?? journeyTier ?? journeyContext?.subscriptionTier;
  // 2) Effective tier — journey tier when embedded, account tier when standalone.
  const effectiveTier: PlanTier = normalizePlanTier(isJourney ? rawJourneyTier : accountPlan.tier);

  // 3) Overlay gate — journey mode starts on the intro screen, not the wizard.
  //    Standalone default `isOpen = true`, so this only fires for the modal path.
  const [started, setStarted] = useState(false);

  const router = useRouter();

  // Function to validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Function to validate name format (allow letters, spaces, hyphens, apostrophes)
  const validateName = (name: string): boolean => {
    if (!name.trim()) return false; // Name cannot be empty

    // Allow letters (both cases), spaces, hyphens, apostrophes, and periods
    const nameRegex = /^[a-zA-Z\s\-\'\.]+$/;
    return nameRegex.test(name) && name.trim().length >= 2;
  };

  // Function to validate case summary (minimum length requirement)
  const validateCaseSummary = (summary: string): boolean => {
    // Minimum 20 characters for a meaningful case summary
    return summary.trim().length >= 20;
  };

  const searchParams = useSearchParams();

  // View state
  const [activeView, setActiveView] = useState<"booking" | "requests">("booking");

  useEffect(() => {
    // Journey mode always opens on the booking view (intro gate); ignore URL tab param.
    if (isJourney) return;
    const tab = searchParams?.get("tab");
    if (tab === "requests" || tab === "my-requests") {
      setActiveView("requests");
    }
  }, [searchParams, isJourney]);

  // Lock background scroll while the journey overlay is open (mirrors Medical/PCC).
  // Without this the page behind the fixed overlay scrolls on its own, producing a
  // second scrollbar next to the overlay's internal scroll region.
  useEffect(() => {
    if (isJourney && isOpen && !embedded) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isJourney, isOpen, embedded]);

  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Google Calendar View States
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month" | "year">("week");
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());

  // Automatically switch to single Day view on mobile screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCalendarView("day");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Ref for managing calendar scrollbar centering
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    issue_category: "",
    visa_category: "",
    case_stage: "",
    embassy_consulate: "Islamabad",
    urgency: "" as string,
    preferred_language: "English",
    full_name: "",
    email: "",
    whatsapp_phone: "", // E.164 format phone number
    case_summary: "",
    selected_slot: null as Date | null,
    alternate_slots: [] as Date[],
    consent: false,
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  // Automatically scroll calendar timeline to 8 AM on view change so users do not start at midnight
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 640; // 8 hours * 80px row height = 640px
    }
  }, [calendarView, currentStep]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showConsultationUpgradeModal, setShowConsultationUpgradeModal] = useState(false);
  const [remainingConsultations, setRemainingConsultations] = useState<number | null>(null);
  const [consultationCreditLimit, setConsultationCreditLimit] = useState<number>(2);

  const [consultationCreditsLoading, setConsultationCreditsLoading] = useState(true);
  const { tier } = usePlan();
  const { user, isLoading: authLoading } = useAuth();
  const { checkAccess, consumeAccess } = useFeatureAccess();
  const { showToast } = useToast();
  const [useCreditIfAvailable, setUseCreditIfAvailable] = useState<boolean>(true);

  const wallet = useWallet();
  const costCredits = 99;
  const hasWalletCredits = wallet.balance !== null && wallet.balance >= costCredits;
  const deficit = Math.max(costCredits, costCredits - (wallet.balance ?? 0));

  // Mock data for dropdowns
  const issueCategories = [
    {
      value: "i130-preparation",
      label: "I-130 Petition Preparation",
      group: "Petition & Application Filing",
    },
    {
      value: "i129f-petition",
      label: "I-129F (K-1 Fiance) Petition",
      group: "Petition & Application Filing",
    },
    {
      value: "filing-strategy",
      label: "Filing Strategy (AOS vs. Consular)",
      group: "Petition & Application Filing",
    },
    {
      value: "priority-date",
      label: "Priority Date Questions",
      group: "Petition & Application Filing",
    },
    {
      value: "birth-certificate",
      label: "Birth Certificate Issues (NADRA)",
      group: "Document Preparation & Evidence",
    },
    {
      value: "marriage-certificate",
      label: "Marriage Certificate Authentication",
      group: "Document Preparation & Evidence",
    },
    {
      value: "police-clearance",
      label: "Police Clearance Certificates",
      group: "Document Preparation & Evidence",
    },
    {
      value: "translation",
      label: "Document Translation & Certification",
      group: "Document Preparation & Evidence",
    },
    {
      value: "bona-fide-evidence",
      label: "Evidence of Bona Fide Relationship",
      group: "Document Preparation & Evidence",
    },
    {
      value: "financial-docs",
      label: "Financial Documentation",
      group: "Document Preparation & Evidence",
    },
    {
      value: "nvc-welcome",
      label: "NVC Welcome Letter/Case Creation",
      group: "NVC Processing",
    },
    {
      value: "ds260",
      label: "DS-260 Completion & Submission",
      group: "NVC Processing",
    },
    {
      value: "i864",
      label: "I-864 Affidavit of Support",
      group: "NVC Processing",
    },
    {
      value: "nvc-fees",
      label: "NVC Fee Payment Issues",
      group: "NVC Processing",
    },
    {
      value: "dq-status",
      label: "Documentarily Qualified Status",
      group: "NVC Processing",
    },
    {
      value: "interview-scheduling",
      label: "Interview Appointment Scheduling",
      group: "Embassy Interview & Processing",
    },
    {
      value: "interview-prep",
      label: "Interview Preparation",
      group: "Embassy Interview & Processing",
    },
    {
      value: "medical-exam",
      label: "Medical Examination",
      group: "Embassy Interview & Processing",
    },
    {
      value: "interview-outcome",
      label: "Interview Outcome Explanation",
      group: "Embassy Interview & Processing",
    },
    {
      value: "221g-white",
      label: "221(g) White Slip (Documents Missing)",
      group: "Administrative Processing & 221(g)",
    },
    {
      value: "221g-blue",
      label: "221(g) Blue/Pink Slip (Background Check)",
      group: "Administrative Processing & 221(g)",
    },
    {
      value: "ap-timeline",
      label: "Administrative Processing Timeline",
      group: "Administrative Processing & 221(g)",
    },
    {
      value: "ceac-status",
      label: "CEAC Status Interpretation",
      group: "Administrative Processing & 221(g)",
    },
    {
      value: "income-requirements",
      label: "I-864 Income Requirements",
      group: "Financial Sponsorship",
    },
    {
      value: "joint-sponsor",
      label: "Joint Sponsor Requirements",
      group: "Financial Sponsorship",
    },
    {
      value: "public-charge",
      label: "Public Charge Considerations",
      group: "Financial Sponsorship",
    },
    {
      value: "visa-bulletin",
      label: "Visa Bulletin Interpretation",
      group: "Visa Bulletin & Wait Times",
    },
    {
      value: "retrogression",
      label: "Category Retrogression",
      group: "Visa Bulletin & Wait Times",
    },
    {
      value: "aging-out",
      label: "Aging Out & CSPA Protection",
      group: "Visa Bulletin & Wait Times",
    },
    {
      value: "other",
      label: "Other / Not Listed",
      group: "Other",
    },
  ];

  const issueCategoryOptions: DropdownOption[] = issueCategories.map((item) => ({
    value: item.value,
    label: `${item.group} - ${item.label}`,
  }));

  const embassyOptions: DropdownOption[] = [
    { value: "islamabad", label: "U.S. Embassy Islamabad" },
    // { value: "karachi", label: "U.S. Consulate Karachi" },
    // { value: "other", label: "Other Country" },
  ];

  const urgencyOptions: DropdownOption[] = [
    { value: "normal_low", label: "Low - General guidance" },
    { value: "normal_medium", label: "Medium - Deadline within 30 days" },
    { value: "urgent_high", label: "High - Deadline within 7 days" },
    { value: "urgent_immediate", label: "Urgent - Immediate help needed" },
  ];

  const preferredLanguageOptions: DropdownOption[] = [
    { value: "English", label: "English" },
    { value: "Urdu", label: "Urdu" },
  ];

  const caseStages = [
    {
      value: "pre-filing",
      label: "Pre-Filing / Planning",
      group: "USCIS Phase",
    },
    { value: "petition-filed", label: "Petition Filed", group: "USCIS Phase" },
    { value: "rfe-received", label: "RFE Received", group: "USCIS Phase" },
    {
      value: "petition-approved",
      label: "Petition Approved",
      group: "USCIS Phase",
    },
    { value: "nvc-received", label: "Case at NVC", group: "NVC Phase" },
    { value: "ds260-submitted", label: "DS-260 Submitted", group: "NVC Phase" },
    { value: "dq", label: "Documentarily Qualified", group: "NVC Phase" },
    {
      value: "interview-scheduled",
      label: "Interview Scheduled",
      group: "NVC Phase",
    },
    {
      value: "pre-interview",
      label: "Preparing for Interview",
      group: "Embassy Phase",
    },
    {
      value: "interview-completed",
      label: "Interview Completed",
      group: "Embassy Phase",
    },
    {
      value: "221g-ap",
      label: "221(g) / Admin Processing",
      group: "Embassy Phase",
    },
    { value: "visa-approved", label: "Visa Approved", group: "Embassy Phase" },
    {
      value: "other",
      label: "Not Listed",
      group: "Other",
    },
  ];

  const countryCodes = [
    { code: "+92", name: "Pakistan" },
    { code: "+1", name: "USA/Canada" },
    { code: "+44", name: "UK" },
    { code: "+91", name: "India" },
    { code: "+971", name: "UAE" },
    { code: "+966", name: "Saudi Arabia" },
    { code: "+61", name: "Australia" },
    { code: "+49", name: "Germany" },
    { code: "+33", name: "France" },
    { code: "+81", name: "Japan" },
    { code: "+86", name: "China" },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const caseStageOptions: DropdownOption[] = caseStages.map((item) => ({
    value: item.value,
    label: `${item.group} - ${item.label}`,
  }));

  const countryCodeOptions: DropdownOption[] = countryCodes.map((item) => ({
    value: item.code,
    label: `${item.code} ${item.name}`,
  }));

  // Load time slots from API
  const fetchTimeSlots = async () => {
    try {
      const response = await fetch("/api/consultation/slots");
      if (response.ok) {
        const slots = await response.json();
        interface ApiTimeSlot {
          id: string;
          date: string;
          start_time: string;
          end_time: string;
          status: string;
        }

        const formattedSlots = slots.map((slot: ApiTimeSlot) => {
          // slot.date is "YYYY-MM-DD", slot.start_time is "HH:mm:ss"

          // Create a combined datetime string in business timezone
          const slotDateTimeStr = `${slot.date}T${slot.start_time}`;
          const slotEndDateStr = `${slot.date}T${slot.end_time}`;

          // Convert to user's timezone
          const slotDate = new Date(slotDateTimeStr + "Z"); // Treat as UTC then convert to user's timezone
          const slotEndDate = new Date(slotEndDateStr + "Z"); // Treat as UTC then convert to user's timezone

          // Format for user's detected timezone (browser's local TZ by default)
          const formatOptions: Intl.DateTimeFormatOptions = {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };

          const displayTime = slotDate.toLocaleTimeString([], formatOptions);
          const displayEndTime = slotEndDate.toLocaleTimeString([], formatOptions);

          return {
            id: slot.id,
            date: slotDate,
            endDate: slotEndDate,
            time: slot.start_time,
            formattedTime: `${displayTime} - ${displayEndTime}`,
            available: slot.status === "available",
          };
        });
        setAvailableSlots(formattedSlots);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Slot fetch error:", error);
      setAvailableSlots([]);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, []); // Only fetch once, uses browser's local TZ by default via toLocaleTimeString

  const fetchUserBookings = async (query = "") => {
    setLoading(true);
    try {
      const url = query
        ? `/api/consultation?search=${encodeURIComponent(query)}`
        : "/api/consultation";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Filter by current logged-in user's email so they only see their own confirmed requests
        const myBookings = data.filter(
          (booking: any) =>
            booking.email === user?.email &&
            booking.payment_status !== "pending" &&
            booking.payment_status !== "failed"
        );
        setUserBookings(myBookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === ("requests" as "booking" | "requests")) {
      fetchUserBookings(searchQuery);
    }
  }, [activeView, searchQuery]);

  // Load user bookings whenever the user auth state is verified
  useEffect(() => {
    if (user) {
      fetchUserBookings("");
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const loadConsultationCredits = async () => {
      if (authLoading || !user) return; // Do not fetch if auth is loading or user is not logged in

      setConsultationCreditsLoading(true);
      const access = await checkAccess("expert_consultation");
      if (!isMounted) return;

      const usage = access.data?.data?.usage;
      if (access.allowed && usage?.limit !== undefined) {
        setConsultationCreditLimit(usage.limit);
      }
      if (access.allowed && usage?.remaining !== undefined) {
        setRemainingConsultations(usage.remaining);
      } else if (access.allowed && usage?.limit !== undefined) {
        setRemainingConsultations(usage.limit);
      } else {
        setRemainingConsultations(null);
      }

      setConsultationCreditsLoading(false);
    };

    void loadConsultationCredits();

    return () => {
      isMounted = false;
    };
  }, [checkAccess, user, authLoading]);

  const handleAcceptAlternative = async (bookingId: string, slot: Date) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/consultation?id=${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve", // User approving a proposed alternative makes it confirmed
          selected_slot: slot.toISOString(),
        }),
      });
      if (response.ok) {
        fetchUserBookings(searchQuery);
      }
    } catch (error) {
      console.error("Error accepting alternative:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean | Date | Date[] | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileDrop = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setFormData((prev) => ({
      ...prev,
      selected_slot: slot.date,
    }));
    if (errors.selected_slot) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.selected_slot;
        return newErrors;
      });
    }
  };

  const handleDropZoneDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFiles(true);
  };

  const handleDropZoneDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFiles(false);
  };

  const handleDropZoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFiles(false);
    handleFileDrop(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Comprehensive form validation before submission
    if (!formData.issue_category) {
      showToast("Please select an issue category.", "error");
      setLoading(false);
      return;
    }

    if (!formData.case_stage) {
      showToast("Please select a case stage.", "error");
      setLoading(false);
      return;
    }

    if (!formData.full_name || !validateName(formData.full_name)) {
      showToast(
        "Please enter a valid full name (letters, spaces, hyphens, apostrophes only).",
        "error"
      );
      setLoading(false);
      return;
    }

    if (!formData.email || !validateEmail(formData.email)) {
      showToast("Please enter a valid email address.", "error");
      setLoading(false);
      return;
    }

    if (!validatePhoneNumber(formData.whatsapp_phone)) {
      showToast("Please enter a valid phone number.", "error");
      setLoading(false);
      return;
    }

    if (!formData.case_summary || !validateCaseSummary(formData.case_summary)) {
      showToast("Please provide a detailed case summary with at least 20 characters.", "error");
      setLoading(false);
      return;
    }

    if (!formData.selected_slot) {
      showToast("Please select a consultation time slot.", "error");
      setLoading(false);
      return;
    }

    if (!formData.consent) {
      showToast("Please agree to the consent terms before submitting.", "error");
      setLoading(false);
      return;
    }

    setLoading(true);

    // Standalone check: pre-flight check on wallet credits
    if (!isJourney) {
      if (wallet.balance === null || wallet.balance < costCredits) {
        wallet.openTopup({ amount: deficit });
        showToast(
          `You need 99 credits for an expert consultation (Balance: ${wallet.balance ?? 0} credits). Please top up to proceed.`,
          "error"
        );
        setLoading(false);
        return;
      }
    }

    console.log("Submitting form...", formData);

    try {
      // 1. Upload attachments first if any
      const uploadedPaths: string[] = [];
      for (const file of attachments) {
        const fileData = new FormData();
        fileData.append("file", file);

        try {
          const uploadRes = await fetch("/api/consultation/upload", {
            method: "POST",
            body: fileData,
          });

          if (uploadRes.ok) {
            const uploadInfo = await uploadRes.json();
            uploadedPaths.push(uploadInfo.path);
          }
        } catch (err) {
          console.error("File upload failed for:", file.name, err);
        }
      }

      // Phone number is already in E.164 format from PhoneInput
      const finalPhoneStr = formData.whatsapp_phone;

      if (isJourney) {
        // Journey mode: 0 credits, paid immediately, tagged with journey scope
        const payload = {
          ...formData,
          whatsapp_phone: finalPhoneStr,
          attachments: uploadedPaths,
          selected_slot: formData.selected_slot?.toISOString(),
          alternate_slots: formData.alternate_slots?.map((slot) => slot.toISOString()),
          payment_status: "paid",
          source: "journey",
          journey_slug: journeyContext?.journeySlug || null,
          candidate_id: journeyContext?.candidateId || null,
        };

        const response = await fetch("/api/consultation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const result = await response.json();
          onSave?.({
            referenceId: String(result.reference_id ?? result.id),
            referenceDate: formData.selected_slot
              ? new Date(formData.selected_slot).toISOString()
              : new Date().toISOString(),
            location: "Remote (video call)",
            status: "pending_approval",
          });
          setReferenceId(result.reference_id);
          setShowConfirmation(true);
          return;
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to submit consultation");
        }
      } else {
        // Standalone mode: create draft with payment_status: 'pending', then deduct credits atomically
        const payload = {
          ...formData,
          whatsapp_phone: finalPhoneStr,
          attachments: uploadedPaths,
          selected_slot: formData.selected_slot?.toISOString(),
          alternate_slots: formData.alternate_slots?.map((slot) => slot.toISOString()),
          payment_status: "pending",
          source: "standalone",
        };

        const response = await fetch("/api/consultation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to create consultation request");
        }

        const bookingId = result.id;

        // Deduct 99 credits atomically
        try {
          const deductResult = await wallet.deductServiceBooking("book-a-consultation", bookingId);

          if (deductResult.body.success) {
            setReferenceId(result.reference_id);
            setShowConfirmation(true);
            fetchTimeSlots();
            return;
          }

          if (deductResult.status === 402) {
            const deficitAmount = deductResult.body.deficit ?? costCredits;
            wallet.openTopup({ amount: deductResult.body.topupAmount ?? deficitAmount });
            showToast(
              `Insufficient credits. Please top up ${deficitAmount} credits to complete your booking.`,
              "error"
            );
            setLoading(false);
            return;
          }

          const rawErr = deductResult.body.error || "Failed to deduct service credits";
          if (rawErr === "NETWORK_ERROR") {
            throw new Error(
              "Connection error: could not reach the server to process credits. No credits were deducted and your consultation has not been booked. Please check your connection and try again."
            );
          }
          throw new Error(rawErr);
        } catch (deductErr: unknown) {
          console.error("Credit deduction failed:", deductErr);
          const errMsg =
            deductErr instanceof Error
              ? deductErr.message === "NETWORK_ERROR"
                ? "Connection error: could not reach the server to process credits. No credits were deducted and your consultation has not been booked. Please check your connection and try again."
                : deductErr.message
              : "Credit deduction failed. Your consultation has not been booked. Please try again.";
          showToast(errMsg, "error");
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      showToast(error instanceof Error ? error.message : "An error occurred during submission.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return; // Don't proceed if validation fails
    }
    setCurrentStep((prev) => Math.min(prev + 1, isJourney ? 3 : 4));
  };
  // Validation function for each step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.issue_category) {
        newErrors.issue_category = "Issue category is required";
      }
      if (!formData.case_stage) {
        newErrors.case_stage = "Case stage is required";
      }
      if (!formData.urgency) {
        newErrors.urgency = "Urgency level is required";
      }
    } else if (step === 2) {
      if (!formData.full_name || !validateName(formData.full_name)) {
        newErrors.full_name = "Please enter a valid full name";
      }
      if (!formData.email || !validateEmail(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      if (!validatePhoneNumber(formData.whatsapp_phone)) {
        newErrors.phone_number = "Please enter a valid phone number";
      }
      if (!formData.preferred_language) {
        newErrors.preferred_language = "Preferred language is required";
      }
      if (!formData.case_summary || !validateCaseSummary(formData.case_summary)) {
        newErrors.case_summary = "Case summary must be at least 20 characters";
      }
      if (!formData.consent) {
        newErrors.consent = "You must agree to the terms to continue";
      }
    } else if (step === 3) {
      if (!formData.selected_slot) {
        newErrors.selected_slot = "Please select a consultation time slot";
        showToast("Please select a consultation time slot.", "error");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setFormData({
      issue_category: "",
      visa_category: "",
      case_stage: "",
      embassy_consulate: "",
      urgency: "normal",
      preferred_language: "English",
      full_name: "",
      email: "",
      whatsapp_phone: "",
      case_summary: "",
      selected_slot: null,
      alternate_slots: [],
      consent: false,
    });
    setAttachments([]);
    setCurrentStep(1);
    setShowConfirmation(false);
    fetchTimeSlots();
  };

  // Google Calendar Grid & Navigation Helper Functions
  const isSameDay = (d1: Date, d2: Date): boolean => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isToday = (date: Date): boolean => {
    return isSameDay(date, new Date());
  };

  const getWeekDates = (date: Date): Date[] => {
    const current = new Date(date);
    const day = current.getDay(); // 0 is Sun, 6 is Sat
    const diff = current.getDate() - day; // Go back to Sunday

    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(current);
      d.setDate(diff + i);
      d.setHours(0, 0, 0, 0);
      week.push(d);
    }
    return week;
  };

  const getWeekRangeLabel = (date: Date): string => {
    const week = getWeekDates(date);
    const start = week[0];
    const end = week[6];

    const optionsStart: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const optionsEnd: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };

    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.toLocaleDateString(undefined, { ...optionsStart, year: "numeric" })} ${end.toLocaleDateString(undefined, optionsEnd)}`;
    } else if (start.getMonth() !== end.getMonth()) {
      return `${start.toLocaleDateString(undefined, optionsStart)} ${end.toLocaleDateString(undefined, optionsEnd)}`;
    } else {
      return `${start.toLocaleDateString(undefined, { month: "long" })} ${start.getDate()} ${end.getDate()}, ${start.getFullYear()}`;
    }
  };

  const getDayLabel = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getMonthLabel = (date: Date): string => {
    return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  };

  const getMonthGridDates = (date: Date): Date[] => {
    const current = new Date(date);
    const year = current.getFullYear();
    const month = current.getMonth();

    // Get first day of month
    const firstDayOfMonth = new Date(year, month, 1);
    // Get Sunday before the first day of the month
    const startDay = firstDayOfMonth.getDay(); // 0 is Sun, 1 is Mon...
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - startDay);

    const grid: Date[] = [];
    const totalDays = 42; // standard 6 rows of 7 days
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      d.setHours(0, 0, 0, 0);
      grid.push(d);
    }
    return grid;
  };

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour} ${period}`;
  };

  const getGMTOffset = (): string => {
    const offset = -new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const sign = offset >= 0 ? "+" : "-";
    return `GMT${sign}${String(hours).padStart(2, "0")}`;
  };

  const getDecimalHour = (date: Date): number => {
    return date.getHours() + date.getMinutes() / 60;
  };

  const getHourBoundaries = () => {
    return { startHour: 0, endHour: 24, hoursRange: Array.from({ length: 24 }, (_, i) => i) };
  };

  const getSlotPosition = (slot: TimeSlot, startHour: number, endHour: number) => {
    const totalHours = endHour - startHour; // dynamic total span

    const startDecimal = getDecimalHour(slot.date);
    const endDecimal = getDecimalHour(slot.endDate);

    const duration = Math.max(0.5, endDecimal - startDecimal); // min duration 30 mins

    const relativeStart = Math.max(0, startDecimal - startHour);

    const top = (relativeStart / totalHours) * 100;
    const height = (duration / totalHours) * 100;

    return {
      top: `${top}%`,
      height: `${height}%`,
    };
  };

  const getDaysInMonthForYearView = (year: number, month: number): Date[] => {
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay(); // Sunday-Saturday padding
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - startDay);

    const days: Date[] = [];
    const totalDays = 42; // standard 6 weeks to match monthly grids
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }
    return days;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Issue Category *
                </label>
                <CustomDropdown
                  value={formData.issue_category}
                  onChange={(value) => {
                    handleInputChange("issue_category", value);
                    if (errors.issue_category && value) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.issue_category;
                        return newErrors;
                      });
                    }
                  }}
                  options={issueCategoryOptions}
                  placeholder="Select an issue category..."
                  className={errors.issue_category ? "border-red-500" : ""}
                />
                {errors.issue_category && (
                  <p className="mt-1 text-sm text-red-600">{errors.issue_category}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Case Stage *</label>
                <CustomDropdown
                  value={formData.case_stage}
                  onChange={(value) => {
                    handleInputChange("case_stage", value);
                    if (errors.case_stage && value) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.case_stage;
                        return newErrors;
                      });
                    }
                  }}
                  options={caseStageOptions}
                  placeholder="Select stage..."
                  className={errors.case_stage ? "border-red-500" : ""}
                />
                {errors.case_stage && (
                  <p className="mt-1 text-sm text-red-600">{errors.case_stage}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Embassy / Consulate
                </label>
                <Input
                  id="embassy_consulate"
                  name="embassy_consulate"
                  value={formData.embassy_consulate || ""}
                  placeholder="Select embassy..."
                  disabled
                  readOnly
                  className="cursor-not-allowed bg-gray-100 font-medium text-gray-700"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Urgency *</label>
                <CustomDropdown
                  value={formData.urgency}
                  onChange={(value) => {
                    handleInputChange("urgency", value);
                    if (errors.urgency && value) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.urgency;
                        return newErrors;
                      });
                    }
                  }}
                  options={urgencyOptions}
                  placeholder="Select urgency level..."
                  className={errors.urgency ? "border-red-500" : ""}
                />
                {errors.urgency && <p className="mt-1 text-sm text-red-600">{errors.urgency}</p>}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Full Name *</label>
                <div className="relative">
                  <User className="absolute top-3.5 left-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => {
                      const nameValue = e.target.value;
                      // Validate name format (allow only letters, spaces, hyphens, apostrophes)
                      if (nameValue && !validateName(nameValue)) {
                        // Allow the input but potentially show a warning
                        console.warn("Name contains invalid characters");
                      }
                      handleInputChange("full_name", nameValue);
                      // Clear error when user types
                      if (errors.full_name) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.full_name;
                          return newErrors;
                        });
                      }
                    }}
                    className={`w-full rounded-lg border py-3 pr-4 pl-10 transition focus:ring-2 focus:ring-teal-500 ${
                      errors.full_name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="John Doe"
                    required
                  />
                </div>
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute top-3.5 left-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      const emailValue = e.target.value;
                      // Validate email format
                      if (emailValue && !validateEmail(emailValue)) {
                        // Optionally show a warning to the user
                        console.warn("Invalid email format");
                      }
                      handleInputChange("email", emailValue);
                      // Clear error when user types
                      if (errors.email) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.email;
                          return newErrors;
                        });
                      }
                    }}
                    className={`w-full rounded-lg border py-3 pr-4 pl-10 transition focus:ring-2 focus:ring-teal-500 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  WhatsApp Phone *
                </label>
                <PhoneInput
                  value={formData.whatsapp_phone || ""}
                  onChange={(value) => {
                    handleInputChange("whatsapp_phone", value || "");
                    // Clear error when user types
                    if (errors.phone_number) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.phone_number;
                        return newErrors;
                      });
                    }
                  }}
                  defaultCountry="PK"
                  placeholder="300 1234567"
                  className={errors.phone_number ? "border-red-500" : ""}
                />
                {errors.phone_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Language *</label>
                <CustomDropdown
                  value={formData.preferred_language}
                  onChange={(value) => {
                    handleInputChange("preferred_language", value);
                    if (errors.preferred_language && value) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.preferred_language;
                        return newErrors;
                      });
                    }
                  }}
                  options={preferredLanguageOptions}
                  placeholder="Select language..."
                  className={errors.preferred_language ? "border-red-500" : ""}
                />
                {errors.preferred_language && (
                  <p className="mt-1 text-sm text-red-600">{errors.preferred_language}</p>
                )}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Attachments (Optional)
              </label>
              <div
                onClick={() => document.getElementById("consultation-file-input")?.click()}
                onDragOver={handleDropZoneDragOver}
                onDragLeave={handleDropZoneDragLeave}
                onDrop={handleDropZoneDrop}
                className={`group block cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                  isDraggingFiles
                    ? "border-teal-500 bg-teal-50/60"
                    : "border-gray-200 hover:border-teal-400 hover:bg-teal-50/30"
                }`}
              >
                <input
                  id="consultation-file-input"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                />
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-teal-100">
                  <FileText className="h-6 w-6 text-gray-400 group-hover:text-teal-600" />
                </div>
                <p className="text-sm font-bold text-gray-700">Click to upload or drag and drop</p>
                <p className="mt-1 text-xs text-gray-500">
                  Notices, letters, or forms relevant to your case
                </p>
              </div>
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-gray-100 p-3 text-sm"
                    >
                      <span>{file.name}</span>
                      <Button
                        variant="ghost"
                        onClick={() => removeAttachment(index)}
                        className="h-auto p-1 text-red-500 hover:bg-red-50"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Detailed Case Summary *
              </label>
              <textarea
                value={formData.case_summary}
                onChange={(e) => {
                  const summaryValue = e.target.value;
                  // Validate case summary length
                  if (summaryValue && !validateCaseSummary(summaryValue)) {
                    // Optionally show a character count or warning
                    console.warn("Case summary should be at least 20 characters");
                  }
                  handleInputChange("case_summary", summaryValue);
                  // Clear error when user types
                  if (errors.case_summary) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.case_summary;
                      return newErrors;
                    });
                  }
                }}
                rows={5}
                className={`min-h-30 w-full rounded-lg border px-4 py-3 transition focus:ring-2 focus:ring-teal-500 ${
                  errors.case_summary ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Tell us about your visa status, any RFE/221g received, and specific questions you have..."
                required
              />
              {errors.case_summary && (
                <p className="mt-1 text-sm text-red-600">{errors.case_summary}</p>
              )}
            </div>
            <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-5">
              <label className="group flex cursor-pointer items-start gap-3">
                <div className="relative mt-0.5 flex h-5 items-center">
                  <input
                    type="checkbox"
                    required
                    checked={formData.consent}
                    onChange={(e) => {
                      handleInputChange("consent", e.target.checked);
                      // Clear error when user checks the box
                      if (errors.consent && e.target.checked) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.consent;
                          return newErrors;
                        });
                      }
                    }}
                    className={`h-4 w-4 cursor-pointer rounded text-teal-600 focus:ring-teal-500 ${
                      errors.consent ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                <span className="text-xs leading-relaxed font-medium text-gray-600 transition-colors group-hover:text-teal-900">
                  I consent to being contacted via email and WhatsApp. I understand this
                  consultation provides general guidance and does not constitute legal advice.
                </span>
              </label>
              {errors.consent && <p className="mt-1 text-sm text-red-600">{errors.consent}</p>}
            </div>
          </div>
        );
      case 3: {
        const weekDates = getWeekDates(currentCalendarDate);
        const monthDates = getMonthGridDates(currentCalendarDate);
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const { startHour, endHour, hoursRange } = getHourBoundaries();

        const visibleSlots = availableSlots.filter((slot) => {
          const isPast = slot.date.getTime() < Date.now();
          const hasUserBooking = userBookings.some(
            (booking) =>
              booking.email === user?.email &&
              new Date(booking.selected_slot).getTime() === slot.date.getTime()
          );

          if (isPast) {
            // In the past, only show if the current user booked/canceled it
            return hasUserBooking;
          } else {
            // In the future, show if it is available OR if the current user booked/canceled it
            return slot.available || hasUserBooking;
          }
        });

        const handlePrevDate = () => {
          setCurrentCalendarDate((prev) => {
            const next = new Date(prev);
            if (calendarView === "day") {
              next.setDate(prev.getDate() - 1);
            } else if (calendarView === "week") {
              next.setDate(prev.getDate() - 7);
            } else if (calendarView === "month") {
              next.setMonth(prev.getMonth() - 1);
            } else if (calendarView === "year") {
              next.setFullYear(prev.getFullYear() - 1);
            }
            return next;
          });
        };

        const handleNextDate = () => {
          setCurrentCalendarDate((prev) => {
            const next = new Date(prev);
            if (calendarView === "day") {
              next.setDate(prev.getDate() + 1);
            } else if (calendarView === "week") {
              next.setDate(prev.getDate() + 7);
            } else if (calendarView === "month") {
              next.setMonth(prev.getMonth() + 1);
            } else if (calendarView === "year") {
              next.setFullYear(prev.getFullYear() + 1);
            }
            return next;
          });
        };

        return (
          <div className="space-y-6">
            {/* Header info bar */}
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-teal-100 bg-teal-50/50 p-4 shadow-xs sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <Info className="mt-0.5 h-5 w-5 text-teal-600" />
                <p className="text-sm font-medium text-teal-800">
                  Select your preferred consultation slot using the Calendar below.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100/60 px-3 py-1.5 text-xs font-bold text-teal-900">
                  <Globe className="h-3.5 w-3.5 text-teal-700" />
                  Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </span>
              </div>
            </div>

            {/* Google Calendar Controls Toolbar */}
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50/50 p-4 md:flex-row md:items-center">
              {/* Left Side: Navigation Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentCalendarDate(new Date())}
                  className="flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-extrabold text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 hover:shadow-md active:scale-95"
                >
                  Today
                </button>
                <div className="flex min-h-10 items-center overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={handlePrevDate}
                    className="flex cursor-pointer items-center justify-center border-r border-gray-200 p-2.5 text-gray-600 transition hover:bg-gray-50"
                    title="Previous"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextDate}
                    className="flex cursor-pointer items-center justify-center p-2.5 text-gray-600 transition hover:bg-gray-50"
                    title="Next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="ml-2 text-base font-black tracking-tight text-gray-800 select-none sm:text-lg">
                  {calendarView === "day" && getDayLabel(currentCalendarDate)}
                  {calendarView === "week" && getWeekRangeLabel(currentCalendarDate)}
                  {calendarView === "month" && getMonthLabel(currentCalendarDate)}
                  {calendarView === "year" && currentCalendarDate.getFullYear()}
                </h3>
              </div>

              {/* Right Side: View Filter Dropdown */}
              <div className="flex flex-wrap items-center gap-3">
                {/* View Dropdown Dropdown (Using Project's CustomDropdown) */}
                <div className="z-50 min-w-32 select-none">
                  <CustomDropdown
                    value={calendarView}
                    onChange={(val) => setCalendarView(val as any)}
                    options={[
                      { value: "day", label: "Day" },
                      { value: "week", label: "Week" },
                      { value: "month", label: "Month" },
                      { value: "year", label: "Year" },
                    ]}
                    placeholder="Select view"
                  />
                </div>
              </div>
            </div>

            {/* Calendar Main Grid Area */}
            {visibleSlots.length > 0 ? (
              <div>
                {/* 1. WEEK VIEW */}
                {calendarView === "week" && (
                  <div className="relative overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-xs select-none">
                    <div className="min-w-[800px]">
                      {/* Header Row */}
                      <div className="flex border-b border-gray-200 bg-gray-50/70 py-1">
                        {/* Spacing for Left Hour Labels column */}
                        <div className="w-18 flex-shrink-0 border-r border-gray-100" />

                        {/* 7 columns */}
                        <div className="grid flex-1 grid-cols-7">
                          {weekDates.map((date, idx) => {
                            const active = isToday(date);
                            return (
                              <div
                                key={idx}
                                className="flex flex-col items-center justify-center border-r border-gray-100 py-2.5 text-center last:border-r-0"
                              >
                                <span className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase">
                                  {date.toLocaleDateString(undefined, { weekday: "short" })}
                                </span>
                                <span
                                  className={cn(
                                    "mt-1.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black transition-all duration-300",
                                    active
                                      ? "bg-teal-600 text-white shadow-md shadow-teal-100"
                                      : "text-gray-700"
                                  )}
                                >
                                  {date.getDate()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Scrollable Timeline Grid Container */}
                      <div
                        ref={scrollContainerRef}
                        className="relative flex scrollbar-thin scrollbar-thumb-gray-200 overflow-y-auto rounded-b-[22px] border-t border-gray-100"
                        style={{ height: "500px" }}
                      >
                        {/* 24 hours * 80px height = 1920px vertical height */}
                        <div
                          className="relative flex min-w-[800px] flex-1"
                          style={{ height: "1920px" }}
                        >
                          {/* Side Hour Labels Column */}
                          <div className="relative z-10 flex w-18 flex-col border-r border-gray-100 bg-white/95 backdrop-blur-xs select-none">
                            {hoursRange.map((hour) => (
                              <div
                                key={hour}
                                className="relative flex h-20 items-center justify-end pr-3 select-none"
                              >
                                {hour === 0 && (
                                  <span className="absolute top-0 right-3 text-[9px] font-bold text-gray-400">
                                    {getGMTOffset()}
                                  </span>
                                )}
                                {hour < 23 && (
                                  <span className="absolute right-3 bottom-0 translate-y-1/2 transform text-[9px] font-bold text-gray-400">
                                    {formatHour(hour + 1)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Days Grid Columns */}
                          <div className="relative grid flex-1 grid-cols-7">
                            {/* Horizontal background hour gridlines */}
                            <div className="pointer-events-none absolute inset-0 flex flex-col">
                              {hoursRange.map((hour) => (
                                <div
                                  key={hour}
                                  className="flex-1 border-b border-gray-100/60 last:border-b-0"
                                />
                              ))}
                            </div>

                            {/* Vertical daily slot containers */}
                            {weekDates.map((colDate, colIdx) => {
                              const daySlots = visibleSlots.filter((slot) =>
                                isSameDay(slot.date, colDate)
                              );

                              return (
                                <div
                                  key={colIdx}
                                  className="relative h-full border-r border-gray-100 last:border-r-0"
                                >
                                  {isToday(colDate) && (
                                    <div className="pointer-events-none absolute inset-0 bg-teal-500/3" />
                                  )}

                                  {daySlots.map((slot) => {
                                    const isSelectedPrimary =
                                      formData.selected_slot?.getTime() === slot.date.getTime();
                                    const pos = getSlotPosition(slot, startHour, endHour);
                                    const isPast = slot.date.getTime() < Date.now();
                                    const isSelectable = slot.available && !isPast;

                                    const matchingBooking = userBookings.find(
                                      (booking) =>
                                        booking.email === user?.email &&
                                        new Date(booking.selected_slot).getTime() ===
                                          slot.date.getTime()
                                    );
                                    const isCancelled =
                                      matchingBooking?.status === "cancelled" ||
                                      matchingBooking?.status === "canceled";

                                    return (
                                      <div
                                        key={slot.id}
                                        onClick={() => {
                                          if (!isSelectable) return;
                                          if (
                                            formData.selected_slot?.getTime() ===
                                            slot.date.getTime()
                                          ) {
                                            handleInputChange("selected_slot", null);
                                          } else {
                                            handleSlotSelect(slot);
                                          }
                                        }}
                                        style={{ top: pos.top, height: pos.height }}
                                        className={cn(
                                          "absolute right-1 left-1 z-20 flex min-h-[36px] flex-col justify-center overflow-hidden rounded-2xl border px-3 py-0.5 shadow-xs transition-all duration-300 select-none",
                                          isSelectable
                                            ? "cursor-pointer hover:scale-102 hover:shadow-md"
                                            : "pointer-events-none opacity-60 grayscale",
                                          isSelectedPrimary
                                            ? "z-30 border-teal-700 bg-teal-600 text-white ring-2 ring-teal-200"
                                            : isSelectable
                                              ? "border-teal-200 bg-teal-50/50 text-teal-800 hover:border-teal-300 hover:bg-teal-100/70"
                                              : isCancelled
                                                ? "z-30 animate-pulse border-red-200 bg-red-50 text-red-800"
                                                : !slot.available
                                                  ? isPast
                                                    ? "border-purple-150 bg-purple-50/60 text-purple-500"
                                                    : "border-purple-200 bg-purple-50 text-purple-800"
                                                  : "border-gray-150 bg-gray-100/40 text-gray-400"
                                        )}
                                        title={`${slot.formattedTime} - ${isSelectedPrimary ? "Selected" : isCancelled ? "Canceled" : !slot.available ? (isPast ? "Completed" : "Booked") : isPast ? "Passed" : "Click to Select"}`}
                                      >
                                        <div className="flex flex-col justify-center">
                                          <span
                                            className={cn(
                                              "block text-[9px] leading-tight font-black tracking-wider uppercase",
                                              isSelectedPrimary
                                                ? "text-white/90"
                                                : isSelectable
                                                  ? "text-teal-700"
                                                  : isCancelled
                                                    ? "font-extrabold text-red-700"
                                                    : !slot.available
                                                      ? isPast
                                                        ? "text-purple-500/80"
                                                        : "text-purple-800"
                                                      : "text-gray-400"
                                            )}
                                          >
                                            {isSelectedPrimary
                                              ? "Selected"
                                              : isCancelled
                                                ? "Canceled"
                                                : !slot.available
                                                  ? isPast
                                                    ? "Completed"
                                                    : "Booked"
                                                  : isPast
                                                    ? "Passed"
                                                    : "Available"}
                                          </span>
                                          <span className="mt-0.5 block text-[10px] leading-tight font-black">
                                            {slot.date.toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DAY VIEW */}
                {calendarView === "day" && (
                  <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xs select-none">
                    {/* Day View Header */}
                    <div className="flex items-center gap-4 border-b border-gray-200 bg-gray-50/70 px-6 py-4">
                      <span
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-full text-xl font-black transition-all duration-300",
                          isToday(currentCalendarDate)
                            ? "bg-teal-600 text-white shadow-md shadow-teal-100"
                            : "bg-gray-200 text-gray-800"
                        )}
                      >
                        {currentCalendarDate.getDate()}
                      </span>
                      <div>
                        <h4 className="text-lg font-black tracking-wide text-gray-800 uppercase">
                          {currentCalendarDate.toLocaleDateString(undefined, { weekday: "long" })}
                        </h4>
                        <p className="text-xs font-extrabold text-gray-500">
                          {currentCalendarDate.toLocaleDateString(undefined, {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Day view timeline body */}
                    <div
                      ref={scrollContainerRef}
                      className="relative flex scrollbar-thin scrollbar-thumb-gray-200 overflow-y-auto rounded-b-[22px] border-t border-gray-100"
                      style={{ height: "500px" }}
                    >
                      {/* 24 hours * 80px height = 1920px vertical height */}
                      <div className="relative flex w-full flex-1" style={{ height: "1920px" }}>
                        {/* Hours column */}
                        <div className="relative z-10 flex w-18 flex-col border-r border-gray-100 bg-white/95 backdrop-blur-xs select-none">
                          {hoursRange.map((hour) => (
                            <div
                              key={hour}
                              className="relative flex h-20 items-center justify-end pr-3 select-none"
                            >
                              {hour === 0 && (
                                <span className="absolute top-0 right-3 text-[9px] font-semibold text-gray-400">
                                  {getGMTOffset()}
                                </span>
                              )}
                              {hour < 23 && (
                                <span className="absolute right-3 bottom-0 translate-y-1/2 transform text-[9px] font-semibold text-gray-400">
                                  {formatHour(hour + 1)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Single Day Container Grid */}
                        <div className="relative flex-1">
                          {/* Horizontal background hour gridlines */}
                          <div className="pointer-events-none absolute inset-0 flex flex-col">
                            {hoursRange.map((hour) => (
                              <div
                                key={hour}
                                className="flex-1 border-b border-gray-100/60 last:border-b-0"
                              />
                            ))}
                          </div>

                          {/* Slots list absolute representation */}
                          <div className="relative h-full w-full">
                            {visibleSlots
                              .filter((slot) => isSameDay(slot.date, currentCalendarDate))
                              .map((slot) => {
                                const isSelectedPrimary =
                                  formData.selected_slot?.getTime() === slot.date.getTime();
                                const pos = getSlotPosition(slot, startHour, endHour);
                                const isPast = slot.date.getTime() < Date.now();
                                const isSelectable = slot.available && !isPast;

                                const matchingBooking = userBookings.find(
                                  (booking) =>
                                    booking.email === user?.email &&
                                    new Date(booking.selected_slot).getTime() ===
                                      slot.date.getTime()
                                );
                                const isCancelled =
                                  matchingBooking?.status === "cancelled" ||
                                  matchingBooking?.status === "canceled";

                                return (
                                  <div
                                    key={slot.id}
                                    onClick={() => {
                                      if (!isSelectable) return;
                                      if (
                                        formData.selected_slot?.getTime() === slot.date.getTime()
                                      ) {
                                        handleInputChange("selected_slot", null);
                                      } else {
                                        handleSlotSelect(slot);
                                      }
                                    }}
                                    style={{ top: pos.top, height: pos.height }}
                                    className={cn(
                                      "absolute right-4 left-4 z-20 flex min-h-[36px] items-center justify-between rounded-2xl border px-4 py-0.5 shadow-xs transition-all duration-300 select-none",
                                      isSelectable
                                        ? "cursor-pointer hover:scale-101 hover:shadow-md"
                                        : "pointer-events-none opacity-60 grayscale",
                                      isSelectedPrimary
                                        ? "z-30 border-teal-700 bg-teal-600 text-white ring-2 ring-teal-200"
                                        : isSelectable
                                          ? "border-teal-200 bg-teal-50/50 text-teal-800 hover:border-teal-300 hover:bg-teal-100/70"
                                          : isCancelled
                                            ? "z-30 animate-pulse border-red-200 bg-red-50 text-red-800"
                                            : !slot.available
                                              ? isPast
                                                ? "border-purple-150 bg-purple-50/60 text-purple-500"
                                                : "border-purple-200 bg-purple-50 text-purple-800"
                                              : "border-gray-150 bg-gray-100/40 text-gray-400"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={cn(
                                          "text-[9px] font-black tracking-wider uppercase",
                                          isSelectedPrimary
                                            ? "text-white/90"
                                            : isSelectable
                                              ? "text-teal-700"
                                              : isCancelled
                                                ? "font-extrabold text-red-700"
                                                : !slot.available
                                                  ? isPast
                                                    ? "text-purple-500/80"
                                                    : "text-purple-800"
                                                  : "text-gray-400"
                                        )}
                                      >
                                        {isSelectedPrimary
                                          ? "Selected"
                                          : isCancelled
                                            ? "Canceled"
                                            : !slot.available
                                              ? isPast
                                                ? "Completed"
                                                : "Booked"
                                              : isPast
                                                ? "Passed"
                                                : "Available"}
                                      </div>
                                      <span className="text-[10px] font-black">
                                        {slot.date.toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>

                                    <span
                                      className={cn(
                                        "rounded-full border px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase transition-all duration-300 select-none",
                                        isSelectedPrimary
                                          ? "border-white/30 bg-white/20 text-white"
                                          : isSelectable
                                            ? "border-teal-200/60 bg-white text-teal-700 hover:border-teal-400 hover:bg-teal-50"
                                            : isCancelled
                                              ? "border-red-200 bg-red-100 font-extrabold text-red-700"
                                              : "pointer-events-none border-gray-200 bg-gray-50 text-gray-400 opacity-60"
                                      )}
                                    >
                                      {isPast && slot.available
                                        ? "Passed"
                                        : isCancelled
                                          ? "Canceled"
                                          : !slot.available
                                            ? isPast
                                              ? "Booked"
                                              : "Booked"
                                            : "Select"}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. MONTH VIEW */}
                {calendarView === "month" && (
                  <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xs select-none">
                    {/* Days of week labels */}
                    <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/70">
                      {daysOfWeek.map((day) => (
                        <div
                          key={day}
                          className="py-3 text-center text-xs font-extrabold tracking-widest text-gray-400 uppercase"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Month grid days cells (6 weeks) */}
                    <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 bg-gray-50/10">
                      {monthDates.map((date, idx) => {
                        const isCurrentMonth = date.getMonth() === currentCalendarDate.getMonth();
                        const active = isToday(date);
                        const daySlots = visibleSlots.filter((slot) => isSameDay(slot.date, date));

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "relative flex min-h-24 flex-col justify-between border-gray-100 p-2 transition-colors",
                              !isCurrentMonth ? "bg-gray-100/40" : "bg-white",
                              active && "bg-teal-500/3"
                            )}
                          >
                            {/* Day number cell top */}
                            <div className="mb-1 flex items-center justify-between">
                              {active ? (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-xs font-black text-white shadow-xs">
                                  {date.getDate()}
                                </span>
                              ) : (
                                <span
                                  className={cn(
                                    "text-xs font-extrabold",
                                    isCurrentMonth ? "text-gray-700" : "text-gray-400"
                                  )}
                                >
                                  {date.getDate()}
                                </span>
                              )}

                              {daySlots.length > 0 && (
                                <span className="rounded-md border border-teal-100 bg-teal-50 px-1.5 py-0.5 text-[9px] font-black text-teal-800 uppercase">
                                  {daySlots.length} slot{daySlots.length > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>

                            {/* Inner Day Slots badge items list */}
                            <div className="mt-1 flex max-h-16 flex-1 scrollbar-none flex-col gap-1 overflow-y-auto">
                              {daySlots.map((slot) => {
                                const isSelectedPrimary =
                                  formData.selected_slot?.getTime() === slot.date.getTime();
                                const isPast = slot.date.getTime() < Date.now();
                                const isSelectable = slot.available && !isPast;

                                const matchingBooking = userBookings.find(
                                  (booking) =>
                                    booking.email === user?.email &&
                                    new Date(booking.selected_slot).getTime() ===
                                      slot.date.getTime()
                                );
                                const isCancelled =
                                  matchingBooking?.status === "cancelled" ||
                                  matchingBooking?.status === "canceled";

                                return (
                                  <div
                                    key={slot.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isSelectable) return;
                                      if (
                                        formData.selected_slot?.getTime() === slot.date.getTime()
                                      ) {
                                        handleInputChange("selected_slot", null);
                                      } else {
                                        handleSlotSelect(slot);
                                      }
                                    }}
                                    className={cn(
                                      "flex items-center justify-between truncate rounded-md border px-2 py-1 text-[9px] font-bold shadow-xs transition select-none",
                                      isSelectable
                                        ? "cursor-pointer"
                                        : "pointer-events-none opacity-60 grayscale",
                                      isSelectedPrimary
                                        ? "border-teal-700 bg-teal-600 font-black text-white"
                                        : isSelectable
                                          ? "border-teal-100 bg-teal-50/50 text-teal-800 hover:border-teal-200 hover:bg-teal-100"
                                          : isCancelled
                                            ? "border-red-200 bg-red-50 text-red-800"
                                            : !slot.available
                                              ? isPast
                                                ? "border-purple-150 bg-purple-50/60 text-purple-500"
                                                : "border-purple-200 bg-purple-50 text-purple-800"
                                              : "border-gray-150 bg-gray-100/40 text-gray-400"
                                    )}
                                    title={`${slot.formattedTime} - ${isSelectedPrimary ? "Selected" : isCancelled ? "Canceled" : !slot.available ? (isPast ? "Completed" : "Booked") : isPast ? "Passed" : "Click to Select"}`}
                                  >
                                    <span className="truncate">
                                      {slot.date.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      })}
                                      {isCancelled
                                        ? " (Canceled)"
                                        : !slot.available && (isPast ? " (Booked)" : " (Booked)")}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. YEAR VIEW */}
                {calendarView === "year" && (
                  <div className="grid grid-cols-1 gap-6 rounded-3xl border border-gray-200 bg-gray-50/30 p-4 select-none sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 12 }).map((_, monthIdx) => {
                      const monthDate = new Date(currentCalendarDate.getFullYear(), monthIdx, 1);
                      const days = getDaysInMonthForYearView(
                        currentCalendarDate.getFullYear(),
                        monthIdx
                      );

                      return (
                        <div
                          key={monthIdx}
                          className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs transition-all duration-300 hover:border-teal-100 hover:shadow-md"
                        >
                          <h4
                            onClick={() => {
                              setCurrentCalendarDate(monthDate);
                              setCalendarView("month");
                            }}
                            className="mb-3 cursor-pointer border-b border-gray-100 pb-1.5 text-center text-xs font-black tracking-widest text-gray-800 uppercase transition hover:text-teal-600"
                          >
                            {monthDate.toLocaleDateString(undefined, { month: "long" })}
                          </h4>

                          {/* Days of week mini labels */}
                          <div className="mb-1 grid grid-cols-7 text-center text-[8px] font-extrabold text-gray-400">
                            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                              <div key={i}>{d}</div>
                            ))}
                          </div>

                          {/* Days grid layout */}
                          <div className="grid flex-1 grid-cols-7 gap-x-0.5 gap-y-1 text-center">
                            {days.map((date, idx) => {
                              const isCurrentMonth = date.getMonth() === monthIdx;
                              const hasSlots = visibleSlots.some((slot) =>
                                isSameDay(slot.date, date)
                              );
                              const active = isToday(date);

                              return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    if (!isCurrentMonth) return;
                                    setCurrentCalendarDate(date);
                                    setCalendarView("day");
                                  }}
                                  className={cn(
                                    "mx-auto flex h-4.5 w-4.5 cursor-pointer items-center justify-center rounded-full text-[9px] font-black transition select-none",
                                    !isCurrentMonth
                                      ? "pointer-events-none bg-transparent text-gray-200"
                                      : active
                                        ? "bg-teal-600 text-white shadow-xs"
                                        : hasSlots
                                          ? "border border-teal-200/50 bg-teal-50 font-black text-teal-800 hover:bg-teal-100"
                                          : "text-gray-500 hover:bg-gray-100"
                                  )}
                                  title={
                                    hasSlots
                                      ? `${visibleSlots.filter((s) => isSameDay(s.date, date)).length} available slots`
                                      : ""
                                  }
                                >
                                  {date.getDate()}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white py-20 text-center select-none">
                <Calendar className="mx-auto mb-4 h-14 w-14 animate-bounce text-gray-300 duration-1000" />
                <h4 className="text-base font-black text-gray-800">
                  No consultation slots are currently available.
                </h4>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-gray-400">
                  Please check back later or contact support if you need assistance scheduling your
                  session.
                </p>
              </div>
            )}

            {/* Step error indicators */}
            {errors.selected_slot && (
              <p className="mt-4 animate-pulse text-center text-sm font-bold text-red-600">
                {errors.selected_slot}
              </p>
            )}

            {/* Visual Selected Summary cards below the calendar */}
            {formData.selected_slot && (
              <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-slate-50 p-5 shadow-2xs">
                <h4 className="text-xs font-black tracking-wider text-slate-500 uppercase">
                  Your Booking Selection
                </h4>

                <div className="max-w-md">
                  {/* Primary Selection Summary Card */}
                  <div className="flex items-center justify-between gap-2 rounded-xl border-l-4 border-teal-500 bg-white p-4 shadow-sm">
                    <div>
                      <span className="rounded-full border border-teal-100 bg-teal-50 px-2 py-0.5 text-[10px] font-black tracking-wider text-teal-600 uppercase">
                        Selected Slot
                      </span>
                      <h5 className="mt-1.5 text-sm font-extrabold text-gray-800">
                        {formData.selected_slot.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </h5>
                      <p className="mt-0.5 text-xs font-bold text-gray-500">
                        {visibleSlots.find(
                          (s) => s.date.getTime() === formData.selected_slot?.getTime()
                        )?.formattedTime || ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange("selected_slot", null)}
                      className="cursor-pointer p-1 text-slate-400 transition hover:text-red-500"
                      title="Remove Selection"
                    >
                      <CloseIcon className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
      case 4: {
        const selectedIssue =
          issueCategories.find((c) => c.value === formData.issue_category)?.label ||
          formData.issue_category ||
          "General Inquiry";
        const selectedStage =
          caseStages.find((s) => s.value === formData.case_stage)?.label ||
          formData.case_stage ||
          "Not Specified";
        const selectedUrgency =
          urgencyOptions.find((u) => u.value === formData.urgency)?.label ||
          formData.urgency ||
          "Normal";
        const selectedEmbassy =
          embassyOptions.find((e) => e.value === formData.embassy_consulate)?.label ||
          formData.embassy_consulate ||
          "Not Specified";

        const formattedDate =
          formData.selected_slot?.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }) || "No slot selected";

        const slotTime =
          availableSlots.find((s) => s.date.getTime() === formData.selected_slot?.getTime())
            ?.formattedTime || "";

        const hasCredit = remainingConsultations !== null && remainingConsultations > 0;

        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-300">
            {/* Heading / Premium Badge */}
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-linear-to-r from-slate-900 to-slate-800 p-6 text-white shadow-xl sm:flex-row sm:items-center">
              <div>
                <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/20 px-3 py-1 text-xs font-bold tracking-wider text-teal-300 uppercase">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Order Review
                </span>
                <h3 className="text-xl font-bold">Review your Consultation Details</h3>
                <p className="mt-1 text-xs font-light text-slate-400">
                  Confirm details and complete booking.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-md">
                <Coins className="h-4 w-4 text-amber-300" />
                <span className="text-sm font-semibold">
                  {wallet.isLoading ? "..." : `${wallet.balance ?? 0} Credits Available`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
              {/* Order breakdown */}
              <div className="space-y-6 md:col-span-3">
                {/* Summary Card */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
                  <h4 className="mb-4 flex items-center gap-2 border-b pb-2 text-sm font-bold tracking-wider text-slate-900 uppercase">
                    <FileText className="h-4 w-4 text-teal-600" />
                    Consultation Summary
                  </h4>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold tracking-tight text-slate-400 uppercase">
                        Issue / Subject
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{selectedIssue}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-tight text-slate-400 uppercase">
                        Visa Stage
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{selectedStage}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-tight text-slate-400 uppercase">
                        Urgency Priority
                      </p>
                      <span
                        className={cn(
                          "mt-1.5 inline-block rounded px-2 py-0.5 text-[11px] font-bold",
                          formData.urgency.startsWith("urgent")
                            ? "border border-red-100 bg-red-50 text-red-600"
                            : "border border-slate-100 bg-slate-50 text-slate-600"
                        )}
                      >
                        {selectedUrgency}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-tight text-slate-400 uppercase">
                        Language Preference
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {formData.preferred_language}
                      </p>
                    </div>
                    {formData.embassy_consulate && (
                      <div>
                        <p className="text-xs font-semibold tracking-tight text-slate-400 uppercase">
                          Embassy / Consulate
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-800">{selectedEmbassy}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <p className="text-xs font-semibold tracking-tight text-slate-400 uppercase">
                      Selected Slot
                    </p>
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-teal-100/50 bg-teal-50/50 p-4">
                      <div className="flex items-center justify-center rounded-lg bg-teal-600 p-2 text-white">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{formattedDate}</p>
                        <p className="mt-0.5 text-xs font-bold text-teal-700">{slotTime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secure checkout info */}
                {/* <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Secure Transaction Guaranteed</h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Your consultation details are handled with standard end-to-end encryption. Direct Stripe payment uses secure 256-bit SSL encryption.
                    </p>
                  </div>
                </div> */}
              </div>

              {/* Price Breakdown & Wallet Credits */}
              <div className="space-y-6 md:col-span-2">
                <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/60 bg-slate-50/55 p-6 shadow-sm">
                  <div>
                    <h4 className="mb-4 flex items-center gap-2 border-b pb-2 text-sm font-bold tracking-wider text-slate-900 uppercase">
                      <ShoppingBag className="h-4 w-4 text-teal-600" />
                      Price Breakdown
                    </h4>

                    {/* Order line items */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600">1x Expert Consultation</span>
                        <span className="font-bold text-slate-800">99 Credits ($99.00)</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600">Wallet Balance</span>
                        <span className="font-bold text-slate-800">
                          {wallet.isLoading ? "..." : `${wallet.balance ?? 0} Credits`}
                        </span>
                      </div>

                      {hasWalletCredits && (
                        <div className="flex items-center justify-between text-sm text-[#0d7377]">
                          <span className="font-medium">Balance After Booking</span>
                          <span className="font-bold">
                            {(wallet.balance ?? 99) - 99} Credits
                          </span>
                        </div>
                      )}

                      <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-4">
                        <span className="text-base font-bold text-slate-900">Total Due</span>
                        <span className="text-xl font-black text-slate-900">
                          99 Credits ($99.00)
                        </span>
                      </div>
                    </div>

                    {hasWalletCredits ? (
                      <div className="mt-5 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 p-3">
                        <Coins className="h-4 w-4 flex-shrink-0 text-[#0d7377]" />
                        <span className="text-[11px] font-bold text-teal-800">
                          99 credits will be deducted from your Rahvana Wallet upon confirmation.
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
                              You have {wallet.balance ?? 0} credits. 99 credits are required to book this consultation.
                            </p>
                            <button
                              type="button"
                              onClick={() => wallet.openTopup({ amount: deficit })}
                              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#0d7377] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0a5c5f]"
                            >
                              <Coins size={12} /> Top up {deficit} Credits (${deficit})
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Secure transaction info */}
                  <div className="mt-6 flex flex-col gap-2 rounded-xl border border-slate-200/60 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 shrink-0 text-teal-600" />
                      <h5 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                        Secure Transaction
                      </h5>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500">
                      Standalone requests are paid with your Rahvana Wallet credits ($1 = 1 credit). If your balance is short, you can top up instantly via Stripe.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  if (activeView === ("requests" as "booking" | "requests")) {
    return (
      <div className="bg-gray-50 pt-[55px] pb-12">
        <div className="relative mb-10 overflow-hidden bg-linear-to-r from-teal-800 to-teal-600 py-12 text-white shadow-lg">
          <div className="relative z-10 w-full px-4">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-3xl font-black tracking-tight">
                My <span className="text-teal-200">Requests</span>
              </h1>
              <Button
                onClick={() => setActiveView("booking")}
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                New Request
              </Button>
            </div>
            <p className="font-light text-teal-50">
              Track and manage your existing consultation requests.
            </p>
          </div>
          <Globe className="absolute -top-20 -right-20 h-64 w-64 -rotate-12 transform text-white/5" />
        </div>

        <div className="mx-auto w-full px-4">
          <div className="min-h-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
            <div className="flex flex-col items-center justify-between gap-4 border-b bg-gray-50 p-6 sm:flex-row">
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Search by name, email or Reference ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchUserBookings(searchQuery)}
                  className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm transition focus:ring-2 focus:ring-teal-500"
                />
                <Globe className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
              </div>
              <Button
                onClick={() => fetchUserBookings(searchQuery)}
                className="bg-teal-600 py-2 text-sm"
              >
                Search
              </Button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader size="md" />
                </div>
              ) : userBookings.length === 0 ? (
                <div className="py-20 text-center">
                  <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
                  <p className="mt-1 text-gray-500">
                    We couldn&#39;t find any requests matching your criteria.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userBookings.map((booking: Booking) => (
                    <div
                      key={booking.id}
                      className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 transition hover:border-teal-200 hover:shadow-md"
                    >
                      {/* Top Header Row */}
                      <div className="flex flex-col items-start justify-between gap-2 border-b border-gray-100 pb-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-teal-50 px-2.5 py-1 font-mono text-xs font-bold text-teal-700">
                            {booking.reference_id}
                          </span>
                          <span
                            className={cn(
                              "flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-black uppercase",
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-700"
                                : booking.status === "pending_approval"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : booking.status === "alternatives_proposed"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-gray-100 text-gray-700"
                            )}
                          >
                            {booking.status?.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="font-medium text-gray-400">Requested Date:</span>
                          <span className="text-gray-750 rounded bg-gray-50 px-2 py-0.5 font-semibold">
                            {new Date(booking.selected_slot).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Content Row */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                            Applicant
                          </p>
                          <h4 className="text-base leading-tight font-extrabold text-gray-900">
                            {booking.full_name}
                          </h4>
                          <p className="mt-1 text-xs text-gray-500">
                            Case Stage:{" "}
                            <span className="font-semibold text-gray-700">
                              {booking.visa_category} • {booking.issue_category}
                            </span>
                          </p>
                        </div>

                        {booking.admin_notes && (
                          <CollapsibleAdminNotes notes={booking.admin_notes} />
                        )}
                      </div>

                      {/* Alternatives Row */}
                      {booking.status === "alternatives_proposed" &&
                        booking.alternate_slots &&
                        booking.alternate_slots.length > 0 && (
                          <div className="mt-1 rounded-xl border border-purple-100 bg-purple-50 p-4">
                            <p className="text-purple-750 mb-2 text-[10px] font-black uppercase">
                              Alternative Slots Proposed by Admin:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {booking.alternate_slots.map((slot: string, idx: number) => (
                                <Button
                                  key={idx}
                                  onClick={() =>
                                    handleAcceptAlternative(booking.id, new Date(slot))
                                  }
                                  variant="outline"
                                  className="hover:bg-purple-650 hover:border-purple-650 text-purple-755 h-auto border-purple-200 bg-white px-3 py-1.5 text-[10px] font-semibold transition-colors hover:text-white"
                                >
                                  {new Date(slot).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}{" "}
                                  @{" "}
                                  {new Date(slot).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white text-center shadow-xl">
          <div className="bg-teal-600 py-10">
            <CheckCircle className="mx-auto h-20 w-20 text-white" />
          </div>
          <div className="p-8">
            <h2 className="mb-2 text-2xl font-bold">Request Received!</h2>
            <p className="mb-6 text-gray-600">
              Your reference ID is:{" "}
              <span className="font-mono font-bold text-teal-700">{referenceId}</span>
            </p>
            <div className="space-y-3">
              <Button onClick={resetForm} className="w-full bg-teal-600">
                Book Another
              </Button>
              <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#fafcff]">
        <div className="bg-primary/5 pointer-events-none absolute top-0 right-0 h-96 w-96 translate-x-1/3 -translate-y-1/2 rounded-full blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -translate-x-1/3 translate-y-1/2 rounded-full bg-purple-500/5 blur-[80px]" />
        <Loader size="lg" text="Loading profile..." />
      </div>
    );
  }

  if (!user) {
    return (
      <PageGate
        feature="expert_consultation"
        title="Expert Consultation"
        description="Please log in or sign up to book a personalized consultation with our immigration experts."
      >
        <></>
      </PageGate>
    );
  }

  // Journey overlay contract — return nothing while closed so StepView / EmbeddedToolContainer
  // can mount the component unconditionally without leaking the wizard into every step.
  // Standalone callers default `isOpen = true`, so this is a no-op on /book-consultation.
  if (!isOpen) return null;

  const consultTotalSteps = isJourney ? 3 : 4;
  // Metro-line stations. In journey mode the Checkout station is dropped (payment is
  // handled by the plan/tier gate, not in-wizard Stripe), so the wizard finalizes from
  // Select Time — mirroring how MedicalAppointmentTool removes its checkout step in
  // journey (`medTotalSteps = isJourney ? 7 : 8`).
  const consultMetroSteps = [
    { step: 1, label: "Case Details", icon: FileText },
    { step: 2, label: "Contact Info", icon: User },
    { step: 3, label: "Select Time", icon: Clock },
    ...(isJourney ? [] : [{ step: 4, label: "Checkout", icon: CreditCard }]),
  ];
  const consultCurrentStep = Math.min(currentStep, consultTotalSteps);
  const consultProgressPct = Math.min(
    100,
    Math.round(((consultCurrentStep - 1) / (consultTotalSteps - 1)) * 100)
  );

  return (
    <div
      className={
        isJourney
          ? embedded
            ? started
              ? "w-full bg-white font-sans"
              : "w-full font-sans"
            : "animate-in slide-in-from-bottom-[18px] fixed inset-0 z-[150] flex flex-col overflow-hidden bg-white font-sans duration-[0.28s] ease-in-out"
          : "bg-gray-50 pt-[55px] pb-12"
      }
    >
      {/* Journey topbar — mirrors Medical/PCC exactly (Close button + progress bar + step counter).
          Uses `shrink-0` (not `sticky`) because the outer wrapper is a flex column with
          `overflow-hidden`; the scrollable region lives one level deeper. In `embedded`
          mode this topbar is dropped entirely and the RoadmapLayoutEngine breadcrumb
          (Dashboard › Expert Consultation › ✕) provides close/back instead. */}
      {isJourney && !embedded && (
        <div className="z-10 flex h-[64px] shrink-0 items-center gap-3 border-b border-[#d0e4f7] bg-white px-4 sm:gap-4 sm:px-6">
          <button
            onClick={onClose}
            aria-label="Close"
            className="hover:bg-primary/10 focus:ring-primary flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-[#f4f7fb] text-[#3a4f63] transition-all outline-none focus:ring-2"
          >
            <CloseIcon size={16} strokeWidth={2} />
          </button>
          <div className="h-[5px] min-w-4 flex-1 overflow-hidden rounded-[10px] bg-[#d0e4f7]">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${consultProgressPct}%`, backgroundColor: "#0f766e" }}
            />
          </div>
          <div className="shrink-0 text-[12px] font-medium whitespace-nowrap text-[#6b8097]">
            Step {consultCurrentStep} of {consultTotalSteps}
          </div>
        </div>
      )}

      {/* Standalone-only hero: gradient banner, credits pill, Book New / My Requests tabs.
          Journey mode replaces all of that with the topbar above, and the wizard's own
          intro screen already explains what the service does. */}
      {!isJourney && (
        <div className="relative mb-10 overflow-hidden bg-linear-to-r from-teal-800 to-teal-600 py-16 text-white">
          <div className="relative z-10 w-full px-4">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h1 className="mb-4 text-4xl font-black md:text-5xl">
                  Book <span className="text-teal-200">Expert Consultation</span>
                </h1>
                <p className="max-w-2xl text-xl font-light text-teal-50">
                  Personalized guidance for your U.S. immigration journey.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
                  <Coins className="h-4 w-4 text-amber-300" />
                  {wallet.isLoading ? (
                    <span>Loading credits...</span>
                  ) : (
                    <span>Wallet Balance: {wallet.balance ?? 0} Credits</span>
                  )}
                  <button
                    type="button"
                    onClick={() => wallet.openTopup({ amount: deficit })}
                    className="ml-2 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white transition-colors hover:bg-white/30"
                  >
                    Top Up
                  </button>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-4 md:items-end">
                <QuickAccessButton
                  item={{
                    id: "book-a-consultation",
                    title: "Book Consultation",
                    href: "/book-consultation",
                    icon_name: "Briefcase",
                  }}
                  className="!border-white/25 !text-white hover:!bg-white/20 focus-visible:ring-white/50"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => setActiveView("booking")}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold",
                      "transition-colors duration-200",
                      "focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none",
                      activeView === "booking"
                        ? "!bg-white !text-teal-800 shadow-lg hover:!bg-white hover:!text-teal-800"
                        : "!border !border-white/25 !bg-white/10 !text-white hover:!border-white/40 hover:!bg-white/20 hover:!text-white active:!bg-white/25"
                    )}
                  >
                    Book New
                  </Button>

                  <Button
                    onClick={() => setActiveView("requests")}
                    className={cn(
                      "rounded-full px-6 py-2 text-sm font-bold",
                      "transition-colors duration-200",
                      "focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none",
                      activeView === "requests"
                        ? "!bg-white !text-teal-800 shadow-lg hover:!bg-white hover:!text-teal-800"
                        : "!border !border-white/25 !bg-white/10 !text-white hover:!border-white/40 hover:!bg-white/20 hover:!text-white active:!bg-white/25"
                    )}
                  >
                    My Requests
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <Globe className="absolute -right-20 -bottom-20 h-80 w-80 text-white/5" />
        </div>
      )}

      {/* Scrollable content region — in journey mode this is the single scroll bar
          (fixed inset-0 flex-col + overflow-hidden outer means the outer doesn't
          scroll, so no double scroll with the wizard's internal calendar). In
          standalone mode this wrapper is a passthrough with no styling. */}
      <div className={cn(isJourney && !embedded && "min-h-0 flex-1 overflow-y-auto")}>
        <div className={cn("relative z-20 mx-auto max-w-7xl px-4", isJourney && "py-6 sm:py-8")}>
          {/* Journey mode: intro header shown once the wizard has started. Placed inside the
              scrollable region so it scrolls away with the content (not pinned). */}
          {isJourney && started && (
            <div className="mb-5 px-1 text-center">
              <h1 className="flex items-center justify-center gap-2.5 text-xl font-bold text-gray-900">
                <div className="bg-primary/10 shrink-0 rounded-xl p-2">
                  <MessageCircle className="text-primary" size={22} />
                </div>
                Book Expert Consultation
              </h1>
              <p className="mt-1.5 text-sm text-slate-600">
                Get targeted 30-minute guidance from a specialist for your specific case.
              </p>
            </div>
          )}

          {activeView === "booking" && (
            <div
              className={cn(
                "slide-up overflow-hidden rounded-3xl",
                // Journey intro step: transparent so the page shows through (matches
                // Medical/PCC). Once the wizard starts (and in standalone) keep the
                // framed white card.
                isJourney && !started
                  ? "bg-transparent"
                  : "border border-teal-100 bg-white shadow-2xl"
              )}
            >
              {/* Improved Progress Tracker — metro-line stepper.
                Journey mode: hidden on the intro screen (before `started`), shown once the
                wizard is running so the metro line matches step 1..4 progress.
                Standalone mode: always shown below the hero. */}
              {(!isJourney || started) && (
                <div className="border-b border-gray-100 bg-gray-50/50 px-3 py-6 sm:p-8">
                  <div className="relative mx-auto flex max-w-2xl items-start justify-between">
                    {/* Connecting rail — inset so it runs exactly dot-to-dot
                    (first/last station centers sit at 12.5% / 87.5% of the row) */}
                    <div
                      className="absolute top-4 -z-10 h-0.5 bg-gray-200 sm:top-5"
                      style={{
                        left: `${50 / consultMetroSteps.length}%`,
                        right: `${50 / consultMetroSteps.length}%`,
                      }}
                    >
                      <div
                        className="h-full bg-teal-600 transition-all duration-500"
                        style={{ width: `${((currentStep - 1) / (consultTotalSteps - 1)) * 100}%` }}
                      />
                    </div>

                    {consultMetroSteps.map((item) => (
                      <div
                        key={item.step}
                        className="flex flex-1 flex-col items-center gap-1.5 px-0.5 sm:gap-2"
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-10 sm:w-10",
                            currentStep >= item.step
                              ? "border-teal-600 bg-teal-600 text-white shadow-lg shadow-teal-200"
                              : "border-gray-200 bg-white text-gray-400"
                          )}
                        >
                          {currentStep > item.step ? (
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                          ) : (
                            <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-center text-[10px] leading-tight font-bold tracking-tight uppercase sm:text-xs",
                            currentStep >= item.step ? "text-teal-900" : "text-gray-400"
                          )}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Journey mode: three-state intro mirrors Medical/PCC exactly —
                eyebrow + heading + description + framed card containing service blurb,
                existing-request cards (if any), and one of:
                  statusLoading → slate/teal "Checking…" row.
                  locked        → amber Lock banner with full-sentence lockHint.
                  else          → teal "Start Consultation Service" CTA that flips `started`.
                Standalone mode skips this whole block (the wizard is revealed immediately). */}
              {isJourney && !started && (
                <div className="mx-auto w-full max-w-2xl px-5 py-8">
                  <div className="mb-2 text-[11px] font-bold tracking-widest text-teal-700 uppercase">
                    Rahvana Consultation Service
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-slate-900">
                    Book your expert consultation through Rahvana
                  </h2>
                  <p className="mb-8 text-sm leading-relaxed text-slate-600">
                    Rahvana connects you one-on-one with a U.S. immigration expert who will review
                    your case, answer your questions, and help you plan the next step. Start the
                    booking service below to describe your case and pick a slot.
                  </p>

                  <div className="rounded-2xl bg-slate-50 p-6">
                    {existingRequests && existingRequests.length > 0 && (
                      <div className="mb-6">
                        <div className="mb-2 text-[11px] font-bold tracking-widest text-teal-700 uppercase">
                          Your Consultations
                        </div>
                        <div className="space-y-4">
                          {existingRequests.map((req) => (
                            <ConsultationRequestCard key={req.id} req={req} />
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
                        <span className="text-sm text-slate-600">
                          Checking your existing consultations…
                        </span>
                      </div>
                    ) : locked ? (
                      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <div className="text-sm leading-relaxed text-amber-900">
                          {lockHint ??
                            "You already have an active consultation. You can book another once its session takes place."}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setStarted(true)}
                        className="w-full cursor-pointer rounded-xl bg-teal-700 py-3.5 font-bold text-white transition-colors hover:bg-teal-800"
                      >
                        Start Consultation Service
                      </button>
                    )}
                  </div>

                  <p className="mt-6 text-center text-[11.5px] leading-[1.65] text-[#6b8097]">
                    Consultation slots are subject to expert availability. Rahvana provides
                    scheduling and guidance only; final immigration decisions rest with USCIS and
                    your consulate.
                  </p>
                </div>
              )}

              {(!isJourney || started) && (
                <form onSubmit={handleSubmit} className="p-4 sm:p-8 md:p-12">
                  <div>{renderStepContent()}</div>
                  <div className="mt-4 flex items-center justify-between gap-4 border-t bg-gray-50 px-4 py-3 sm:px-8 sm:py-5">
                    <Button
                      key="prev-btn"
                      type="button"
                      variant="ghost"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className="gap-1 bg-teal-600 px-2 text-xs text-white hover:bg-teal-700 sm:gap-2 sm:px-4 sm:text-sm"
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" /> Previous
                    </Button>
                    {currentStep < consultTotalSteps ? (
                      <Button
                        key="next-btn"
                        type="button"
                        onClick={handleNext}
                        className="gap-1 bg-teal-600 px-4 text-xs hover:bg-teal-700 sm:gap-2 sm:px-8 sm:text-sm"
                      >
                        Next <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    ) : (
                      <Button
                        key="submit-btn"
                        type={isJourney || hasWalletCredits ? "submit" : "button"}
                        onClick={!isJourney && !hasWalletCredits ? () => wallet.openTopup({ amount: deficit }) : undefined}
                        disabled={!formData.selected_slot || loading}
                        className="gap-1 bg-teal-600 px-4 text-xs hover:bg-teal-700 sm:gap-2 sm:px-8 sm:text-sm"
                      >
                        {loading
                          ? "Processing..."
                          : isJourney
                            ? "Confirm & Book"
                            : hasWalletCredits
                              ? "Pay 99 Credits & Book"
                              : `Top up ${deficit} Credits to Book`}
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* UpgradeModal for expert_consultation */}
      {showConsultationUpgradeModal && (
        <UpgradeModal
          feature={"expert_consultation"}
          onClose={() => setShowConsultationUpgradeModal(false)}
          onConfirm={(action: "upgrade" | "addon", target?: string) => {
            // Redirect to pricing page with the selected plan pre-selected
            const plan = typeof target === "string" ? target : "executive";
            window.location.href = `/pricing?plan=${plan}`;
          }}
        />
      )}
    </div>
  );
}

// Helper components for consistency
const Info = ({ className }: { className?: string }) => <AlertCircle className={className} />;

type ButtonVariant = "primary" | "outline" | "ghost";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: ButtonVariant;
  type?: "button" | "submit" | "reset";
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled,
  className,
  variant = "primary",
  type = "button",
}) => {
  const base =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-teal-600 text-white hover:bg-teal-700 shadow-sm",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-600 hover:bg-gray-100",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(base, variants[variant], className)}
    >
      {children}
    </button>
  );
};

// --- Collapsible Admin Notes component ---
function CollapsibleAdminNotes({ notes }: { notes: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-teal-100">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between bg-teal-50/70 px-3 py-2 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-50 focus:outline-none"
      >
        <span>Admin Note</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-teal-50 bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-700">
          {notes}
        </div>
      )}
    </div>
  );
}

// Backward-compatible named alias — safe to drop once all call sites use the default export.
export { BookConsultationTool as ConsultationBookingPage };
