"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/spinner";
import { CustomDropdown, DropdownOption } from "@/app/components/shared/CustomDropdown";
import { usePlan } from "@/app/context/PlanContext";
import { useAuth } from "@/app/context/AuthContext";
import { PageGate } from "@/app/components/entitlements/PageGate";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { useFeatureAccess } from "@/lib/usage/useFeatureAccess";
import { useToast } from "@/app/components/shared/ToastProvider";

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
  | "cancelled";
  selected_slot: string;
  alternate_slots?: string[];
  admin_notes?: string;
}

interface TimeSlot {
  id: string;
  date: Date;
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
  country_code: string;
  phone_number: string;
  whatsapp_phone: string;
  case_summary: string;
  selected_slot: Date | null;
  alternate_slots: Date[];
  consent: boolean;
}

const ConsultationBookingPage = () => {
  const router = useRouter();

  // Function to get phone number placeholder based on country code
  const getPhonePlaceholder = (countryCode: string): string => {
    switch (countryCode) {
      case "+92": // Pakistan
        return "300 1234567";
      case "+1": // USA/Canada
        return "123 456 7890";
      case "+44": // UK
        return "7123 456789";
      case "+91": // India
        return "98765 43210";
      case "+971": // UAE
        return "50 123 4567";
      case "+966": // Saudi Arabia
        return "50 123 4567";
      case "+61": // Australia
        return "412 345 678";
      case "+49": // Germany
        return "151 23456789";
      case "+33": // France
        return "6 12 34 56 78";
      case "+81": // Japan
        return "90-1234-5678";
      case "+86": // China
        return "138 0013 8000";
      default:
        return "123 456 7890"; // Default placeholder
    }
  };

  // Function to validate phone number format based on country code
  const validatePhoneNumber = (phone: string, countryCode: string): boolean => {
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, "");

    // Basic length validation based on country code
    switch (countryCode) {
      case "+92": // Pakistan: typically 10-11 digits after country code
        return digitsOnly.length >= 10 && digitsOnly.length <= 11;
      case "+1": // USA/Canada: 10 digits
        return digitsOnly.length === 10;
      case "+44": // UK: 10-11 digits
        return digitsOnly.length >= 10 && digitsOnly.length <= 11;
      case "+91": // India: 10 digits
        return digitsOnly.length === 10;
      case "+971": // UAE: 9 digits
        return digitsOnly.length === 9;
      case "+966": // Saudi Arabia: 9 digits
        return digitsOnly.length === 9;
      case "+61": // Australia: 9 digits
        return digitsOnly.length === 9;
      case "+49": // Germany: 10-11 digits
        return digitsOnly.length >= 10 && digitsOnly.length <= 11;
      case "+33": // France: 9 digits
        return digitsOnly.length === 9;
      case "+81": // Japan: 10 digits
        return digitsOnly.length >= 10;
      case "+86": // China: 11 digits
        return digitsOnly.length === 11;
      default:
        // Default: minimum 7 digits, maximum 15 digits
        return digitsOnly.length >= 7 && digitsOnly.length <= 15;
    }
  };

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

  // View state
  const [activeView, setActiveView] = useState<"booking" | "requests">(
    "booking",
  );
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    issue_category: "",
    visa_category: "",
    case_stage: "",
    embassy_consulate: "",
    urgency: "" as string,
    preferred_language: "English",
    full_name: "",
    email: "",
    country_code: "+92",
    phone_number: "",
    whatsapp_phone: "",
    case_summary: "",
    selected_slot: null as Date | null,
    alternate_slots: [] as Date[],
    consent: false,
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showConsultationUpgradeModal, setShowConsultationUpgradeModal] =
    useState(false);
  const [remainingConsultations, setRemainingConsultations] = useState<
    number | null
  >(null);
  const [consultationCreditsLoading, setConsultationCreditsLoading] =
    useState(true);
  const { tier } = usePlan();
  const { user, isLoading: authLoading } = useAuth();
  const { checkAccess, consumeAccess } = useFeatureAccess();
  const hasExecutiveAccess = tier === "executive";
  const { showToast } = useToast();

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
    { value: "karachi", label: "U.S. Consulate Karachi" },
    { value: "other", label: "Other Country" },
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
  useEffect(() => {
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
            const displayEndTime = slotEndDate.toLocaleTimeString(
              [],
              formatOptions,
            );

            return {
              id: slot.id,
              date: slotDate,
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
        setUserBookings(data);
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

  useEffect(() => {
    let isMounted = true;

    const loadConsultationCredits = async () => {
      setConsultationCreditsLoading(true);
      const access = await checkAccess("expert_consultation");
      if (!isMounted) return;

      const usage = access.data?.data?.usage;
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
  }, [checkAccess]);

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
    value: string | boolean | Date | Date[],
  ) => {
    // Validate phone number field to prevent alphabetic characters
    if (field === "phone_number" && typeof value === "string") {
      // Allow only digits, spaces, hyphens, parentheses, plus signs, and periods
      const cleanedValue = value.replace(/[^\d\s\-\(\)\+.]/g, "");
      setFormData((prev) => ({
        ...prev,
        [field]: cleanedValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
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

  const handleAlternateSlotSelect = (slot: TimeSlot) => {
    if (
      formData.alternate_slots.some((s) => s.getTime() === slot.date.getTime())
    ) {
      setFormData((prev) => ({
        ...prev,
        alternate_slots: prev.alternate_slots.filter(
          (s) => s.getTime() !== slot.date.getTime(),
        ),
      }));
    } else {
      if (formData.alternate_slots.length < 2) {
        setFormData((prev) => ({
          ...prev,
          alternate_slots: [...prev.alternate_slots, slot.date],
        }));
      }
    }
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
        "error",
      );
      setLoading(false);
      return;
    }

    if (!formData.email || !validateEmail(formData.email)) {
      showToast("Please enter a valid email address.", "error");
      setLoading(false);
      return;
    }

    if (!validatePhoneNumber(formData.phone_number, formData.country_code)) {
      showToast(
        `Please enter a valid phone number for the selected country (${formData.country_code}).`,
        "error",
      );
      setLoading(false);
      return;
    }

    if (!formData.case_summary || !validateCaseSummary(formData.case_summary)) {
      showToast(
        "Please provide a detailed case summary with at least 20 characters.",
        "error",
      );
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

    const hasCredit = tier === "executive" && remainingConsultations !== null && remainingConsultations > 0;

    setLoading(true);

    if (hasCredit) {
      const reservation = await consumeAccess("expert_consultation");

      if (!reservation.allowed) {
        setShowConsultationUpgradeModal(true);
        setLoading(false);
        return;
      }

      if (reservation.data?.remaining !== undefined) {
        setRemainingConsultations(reservation.data.remaining);
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

      // 2. Clean up and combine phone fields
      const cleanPhoneNumber = formData.phone_number.replace(/[^\d+]/g, "");
      const finalPhoneStr =
        `${formData.country_code}${cleanPhoneNumber.startsWith("+") ? cleanPhoneNumber.substring(1) : cleanPhoneNumber}`.replace(
          /\s+/g,
          "",
        );

      const payload = {
        ...formData,
        whatsapp_phone: finalPhoneStr,
        attachments: uploadedPaths,
        selected_slot: formData.selected_slot?.toISOString(),
        alternate_slots: formData.alternate_slots?.map((slot) =>
          slot.toISOString(),
        ),
      };

      console.log("Final Payload:", payload);

      const response = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();

        // If not using credit, redirect to Stripe checkout!
        if (!hasCredit && user?.id) {
          try {
            const stripeRes = await fetch("/api/stripe/checkout", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                consultationId: result.id,
                userId: user.id,
              }),
            });

            const stripeData = await stripeRes.json();

            if (!stripeRes.ok) {
              throw new Error(stripeData.error || "Failed to create checkout session");
            }

            if (stripeData.url) {
              window.location.href = stripeData.url;
              return; // Do not show confirmation screen yet since they are redirecting to pay
            } else {
              throw new Error("No checkout URL returned");
            }
          } catch (stripeErr: any) {
            console.error("Checkout redirection failed:", stripeErr);
            showToast(`Redirection failed: ${stripeErr.message || stripeErr}`, "error");
          }
        } else {
          // Free booking -> show confirmation directly!
          setReferenceId(result.reference_id);
          setShowConfirmation(true);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Submission failed:", errorData);
        showToast(`Failed to submit: ${errorData.error || "Check console for details"}`, "error");
      }
    } catch (error) {
      console.error("Submission error:", error);
      showToast("An error occurred during submission.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return; // Don't proceed if validation fails
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
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
    } else if (step === 2) {
      if (!formData.full_name || !validateName(formData.full_name)) {
        newErrors.full_name = "Please enter a valid full name";
      }
      if (!formData.email || !validateEmail(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      if (!validatePhoneNumber(formData.phone_number, formData.country_code)) {
        newErrors.phone_number = "Please enter a valid phone number";
      }
      if (
        !formData.case_summary ||
        !validateCaseSummary(formData.case_summary)
      ) {
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
      country_code: "+92",
      phone_number: "",
      whatsapp_phone: "",
      case_summary: "",
      selected_slot: null,
      alternate_slots: [],
      consent: false,
    });
    setAttachments([]);
    setCurrentStep(1);
    setShowConfirmation(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <p className="mt-1 text-sm text-red-600">
                    {errors.issue_category}
                  </p>
                )}
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visa Category *
                </label>
                <select
                  value={formData.visa_category}
                  onChange={(e) => {
                    handleInputChange("visa_category", e.target.value);
                    // Clear error when user selects a value
                    if (errors.visa_category && e.target.value) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.visa_category;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 transition ${
                    errors.visa_category ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                >
                  <option value="">Select a visa category...</option>
                  {[...new Set(visaCategories.map((c) => c.group))].map(
                    (group) => (
                      <optgroup key={group} label={group!}>
                        {visaCategories
                          .filter((c) => c.group === group)
                          .map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                      </optgroup>
                    ),
                  )}
                </select>
                {errors.visa_category && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.visa_category}
                  </p>
                )}
              </div> */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Case Stage *
                </label>
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
                  <p className="mt-1 text-sm text-red-600">
                    {errors.case_stage}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Embassy / Consulate
                </label>
                <CustomDropdown
                  value={formData.embassy_consulate}
                  onChange={(value) =>
                    handleInputChange("embassy_consulate", value)
                  }
                  options={embassyOptions}
                  placeholder="Select embassy..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency *
                </label>
                <CustomDropdown
                  value={formData.urgency}
                  onChange={(value) => handleInputChange("urgency", value)}
                  options={urgencyOptions}
                  placeholder="Select urgency level..."
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
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
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 transition ${errors.full_name ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="John Doe"
                    required
                  />
                </div>
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.full_name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
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
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 transition ${errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Phone *
                </label>
                <div className="flex gap-2">
                  <CustomDropdown
                    value={formData.country_code}
                    onChange={(value) => {
                      handleInputChange("country_code", value);
                      // Clear error when user changes country code
                      if (errors.phone_number) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.phone_number;
                          return newErrors;
                        });
                      }
                    }}
                    options={countryCodeOptions}
                    placeholder="Code"
                    className={errors.phone_number ? "border-red-500" : ""}
                  />
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => {
                        // Allow only digits, spaces, hyphens, parentheses, plus signs, and periods
                        const cleanedValue = e.target.value.replace(
                          /[^\d\s\-\(\)\+.]/g,
                          "",
                        );
                        handleInputChange("phone_number", cleanedValue);
                        // Clear error when user types
                        if (errors.phone_number) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.phone_number;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 transition ${errors.phone_number
                        ? "border-red-500"
                        : "border-gray-300"
                        }`}
                      placeholder={getPhonePlaceholder(formData.country_code)}
                      required
                    />
                  </div>
                </div>
                {errors.phone_number && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.phone_number}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language *
                </label>
                <CustomDropdown
                  value={formData.preferred_language}
                  onChange={(value) =>
                    handleInputChange("preferred_language", value)
                  }
                  options={preferredLanguageOptions}
                  placeholder="Select language..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div
                onClick={() => document.getElementById("consultation-file-input")?.click()}
                onDragOver={handleDropZoneDragOver}
                onDragLeave={handleDropZoneDragLeave}
                onDrop={handleDropZoneDrop}
                className={`border-2 border-dashed rounded-2xl p-8 transition-all group cursor-pointer text-center block ${isDraggingFiles
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
                <div className="bg-gray-100 group-hover:bg-teal-100 transition-colors w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-gray-400 group-hover:text-teal-600" />
                </div>
                <p className="text-sm font-bold text-gray-700">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Notices, letters, or forms relevant to your case
                </p>
              </div>
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-100 p-3 rounded-lg text-sm"
                    >
                      <span>{file.name}</span>
                      <Button
                        variant="ghost"
                        onClick={() => removeAttachment(index)}
                        className="p-1 h-auto text-red-500 hover:bg-red-50"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Case Summary *
              </label>
              <textarea
                value={formData.case_summary}
                onChange={(e) => {
                  const summaryValue = e.target.value;
                  // Validate case summary length
                  if (summaryValue && !validateCaseSummary(summaryValue)) {
                    // Optionally show a character count or warning
                    console.warn(
                      "Case summary should be at least 20 characters",
                    );
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 transition min-h-30 ${errors.case_summary ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Tell us about your visa status, any RFE/221g received, and specific questions you have..."
                required
              />
              {errors.case_summary && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.case_summary}
                </p>
              )}
            </div>
            <div className="bg-teal-50/50 border border-teal-100 p-5 rounded-2xl">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center h-5 mt-0.5">
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
                    className={`w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer ${errors.consent ? "border-red-500" : "border-gray-300"
                      }`}
                  />
                </div>
                <span className="text-xs text-gray-600 leading-relaxed font-medium group-hover:text-teal-900 transition-colors">
                  I consent to being contacted via email and WhatsApp. I
                  understand this consultation provides general guidance and
                  does not constitute legal advice.
                </span>
              </label>
              {errors.consent && (
                <p className="mt-1 text-sm text-red-600">{errors.consent}</p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Selected slots are held as &#34;Pending Approval&#34; until
                  confirmed.
                </p>
              </div>
              <div className="flex justify-end">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  <Globe className="h-3.5 w-3.5" />
                  Your Time:{" "}
                  {new Date().toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZoneName: "short",
                  })}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSlots.length > 0 ? (
                availableSlots.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={() => handleSlotSelect(slot)}
                    className={cn(
                      "border rounded-xl p-4 cursor-pointer transition",
                      formData.selected_slot?.getTime() === slot.date.getTime()
                        ? "border-teal-500 bg-teal-50"
                        : slot.available
                          ? "border-gray-200 hover:border-teal-300 hover:bg-teal-50/30"
                          : "opacity-50 cursor-not-allowed bg-gray-50",
                    )}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {slot.date.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Clock className="h-4 w-4" /> {slot.formattedTime}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No consultation slots are currently available.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Please check back later or contact us for assistance.
                  </p>
                </div>
              )}
            </div>
            {formData.selected_slot && (
              <div className="space-y-4">
                <p className="text-sm font-medium">
                  Alternative Slots (Optional - Max 2)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableSlots
                    .filter(
                      (s) =>
                        s.available &&
                        s.date.getTime() !== formData.selected_slot?.getTime(),
                    )
                    .slice(0, 6)
                    .map((slot) => (
                      <div
                        key={`alt-${slot.id}`}
                        onClick={() => handleAlternateSlotSelect(slot)}
                        className={cn(
                          "border rounded-lg p-3 cursor-pointer transition text-xs",
                          formData.alternate_slots.some(
                            (s) => s.getTime() === slot.date.getTime(),
                          )
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50",
                        )}
                      >
                        {slot.date.toLocaleDateString()} - {slot.formattedTime}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        );
      case 4: {
        const selectedIssue = issueCategories.find(c => c.value === formData.issue_category)?.label || formData.issue_category || "General Inquiry";
        const selectedStage = caseStages.find(s => s.value === formData.case_stage)?.label || formData.case_stage || "Not Specified";
        const selectedUrgency = urgencyOptions.find(u => u.value === formData.urgency)?.label || formData.urgency || "Normal";

        const formattedDate = formData.selected_slot?.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric"
        }) || "No slot selected";

        const slotTime = availableSlots.find(s => s.date.getTime() === formData.selected_slot?.getTime())?.formattedTime || "";

        const hasCredit = tier === "executive" && remainingConsultations !== null && remainingConsultations > 0;

        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Heading / Premium Badge */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-linear-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-teal-500/30">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Order Review
                </span>
                <h3 className="text-xl font-bold">Review your Consultation Details</h3>
                <p className="text-slate-400 text-xs mt-1 font-light">Confirm details and complete booking.</p>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                {tier !== "free" ? (
                  <span
                    aria-hidden="true"
                    className={`plan-icon plan-icon--${tier}`}
                    style={{ width: 28, height: 28, flexShrink: 0 }}
                  />
                ) : null}
                <span className="text-sm font-semibold capitalize">{tier} Plan</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Order breakdown */}
              <div className="md:col-span-3 space-y-6">
                {/* Summary Card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-600" />
                    Consultation Summary
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-tight">Issue / Subject</p>
                      <p className="text-sm font-bold text-slate-800 mt-1">{selectedIssue}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-tight">Visa Stage</p>
                      <p className="text-sm font-bold text-slate-800 mt-1">{selectedStage}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-tight">Urgency Priority</p>
                      <span className={cn(
                        "inline-block text-[11px] font-bold px-2 py-0.5 rounded mt-1.5",
                        formData.urgency.startsWith("urgent")
                          ? "bg-red-50 text-red-600 border border-red-100"
                          : "bg-slate-50 text-slate-600 border border-slate-100"
                      )}>
                        {selectedUrgency}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-tight">Language Preference</p>
                      <p className="text-sm font-bold text-slate-800 mt-1">{formData.preferred_language}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-tight">Selected Slot</p>
                    <div className="mt-2 flex items-center gap-3 bg-teal-50/50 border border-teal-100/50 p-4 rounded-xl">
                      <div className="bg-teal-600 text-white rounded-lg p-2 flex items-center justify-center">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{formattedDate}</p>
                        <p className="text-xs font-bold text-teal-700 mt-0.5">{slotTime}</p>
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

              {/* Shopping Cart Summary & Payment Choice */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-slate-50/55 border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-teal-600" />
                      Price Breakdown
                    </h4>

                    {/* Order line items */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">1x Expert Consultation</span>
                        <span className="text-slate-800 font-bold">$99.00</span>
                      </div>

                      {/* Plan Discounts / Benefits */}
                      {hasCredit ? (
                        <div className="flex justify-between items-center text-sm text-green-600">
                          <span className="font-semibold flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                            Executive Credit Applied
                          </span>
                          <span className="font-bold">-$99.00</span>
                        </div>
                      ) : null}

                      <div className="border-t border-slate-200 pt-4 mt-2 flex justify-between items-center">
                        <span className="text-base font-bold text-slate-900">Total Due</span>
                        <span className="text-xl font-black text-slate-900">
                          {hasCredit ? "$0.00" : "$99.00"}
                        </span>
                      </div>
                    </div>

                    {/* Show available credits message */}
                    {tier === "executive" && (
                      <div className="mt-5 p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span className="text-[11px] font-bold text-amber-800">
                          {remainingConsultations !== null ? (
                            remainingConsultations === 1
                              ? "1 Executive Consultation credit left"
                              : `${remainingConsultations} Executive Consultation credits left`
                          ) : (
                            "Executive credits active."
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Show Checkout badge if no credits */}
                  {!hasCredit && (
                    <div className="mt-5 p-4 rounded-xl bg-teal-50 border border-teal-100 flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-teal-800">Secure Card Checkout</p>
                        <p className="text-[11px] text-teal-700/80 mt-0.5 leading-relaxed">
                          Payment is processed securely via Stripe. All major credit and debit cards accepted.
                        </p>
                      </div>
                    </div>
                  )}
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
      <div className="bg-gray-50 pb-12">
        <div className="bg-linear-to-r from-teal-800 to-teal-600 text-white py-12 mb-10 shadow-lg relative overflow-hidden">
          <div className="w-full px-4 relative z-10">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-black tracking-tight">
                My <span className="text-teal-200">Requests</span>
              </h1>
              <Button
                onClick={() => setActiveView("booking")}
                variant="outline"
                className="text-white border-white/30 bg-white/10 hover:bg-white/20"
              >
                New Request
              </Button>
            </div>
            <p className="text-teal-50 font-light">
              Track and manage your existing consultation requests.
            </p>
          </div>
          <Globe className="absolute -right-20 -top-20 h-64 w-64 text-white/5 transform -rotate-12" />
        </div>

        <div className="w-full mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-100">
            <div className="p-6 border-b bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Search by name, email or Reference ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && fetchUserBookings(searchQuery)
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition text-sm"
                />
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <Button
                onClick={() => fetchUserBookings(searchQuery)}
                className="bg-teal-600 text-sm py-2"
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
                <div className="text-center py-20">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">
                    No requests found
                  </h3>
                  <p className="text-gray-500 mt-1">
                    We couldn&#39;t find any requests matching your criteria.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userBookings.map((booking: Booking) => (
                    <div
                      key={booking.id}
                      className="border border-gray-100 rounded-xl p-5 hover:border-teal-200 hover:shadow-md transition bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                            {booking.reference_id}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] uppercase font-black px-2 py-0.5 rounded flex items-center gap-1",
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-700"
                                : booking.status === "pending_approval"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : booking.status === "alternatives_proposed"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-gray-100 text-gray-700",
                            )}
                          >
                            {booking.status?.replace("_", " ")}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900">
                          {booking.full_name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {booking.visa_category} • {booking.issue_category}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">
                            Requested Date
                          </p>
                          <p className="text-sm font-medium">
                            {new Date(booking.selected_slot).toLocaleString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>

                        {booking.status === "alternatives_proposed" &&
                          booking.alternate_slots &&
                          booking.alternate_slots.length > 0 && (
                            <div className="mt-4 p-4 bg-teal-50 rounded-xl border border-teal-100 text-left w-full sm:w-auto">
                              <p className="text-[10px] font-black uppercase text-teal-700 mb-2">
                                Alternative Slots Proposed:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {booking.alternate_slots.map(
                                  (slot: string, idx: number) => (
                                    <Button
                                      key={idx}
                                      onClick={() =>
                                        handleAcceptAlternative(
                                          booking.id,
                                          new Date(slot),
                                        )
                                      }
                                      variant="outline"
                                      className="text-[10px] py-1 h-auto bg-white hover:bg-teal-600 hover:text-white transition-colors"
                                    >
                                      {new Date(slot).toLocaleDateString(
                                        undefined,
                                        { month: "short", day: "numeric" },
                                      )}{" "}
                                      @{" "}
                                      {new Date(slot).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </Button>
                                  ),
                                )}
                              </div>
                              {booking.admin_notes && (
                                <p className="mt-2 text-[10px] text-teal-800 italic">
                                  <strong>Note:</strong> {booking.admin_notes}
                                </p>
                              )}
                            </div>
                          )}
                      </div>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center">
          <div className="bg-teal-600 py-10">
            <CheckCircle className="h-20 w-20 text-white mx-auto" />
          </div>
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-2">Request Received!</h2>
            <p className="text-gray-600 mb-6">
              Your reference ID is:{" "}
              <span className="font-mono font-bold text-teal-700">
                {referenceId}
              </span>
            </p>
            <div className="space-y-3">
              <Button onClick={resetForm} className="w-full bg-teal-600">
                Book Another
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full"
              >
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
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#fafcff] overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/3" />
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

  return (
    <div className="bg-gray-50 pb-12">
      <div className="bg-linear-to-r from-teal-800 to-teal-600 text-white py-16 mb-10 relative overflow-hidden">
        <div className="w-full px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-4">
                Book <span className="text-teal-200">Consultation</span>
              </h1>
              <p className="text-xl text-teal-50 max-w-2xl font-light">
                Personalized guidance for your U.S. immigration journey.
              </p>
              {tier === "executive" && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
                  <Crown className="h-4 w-4 text-amber-200" />
                  {consultationCreditsLoading ? (
                    <span>Loading consultation credits...</span>
                  ) : remainingConsultations !== null ? (
                    <span>
                      Remaining consultation credits: {remainingConsultations}/2
                    </span>
                  ) : (
                    <span>Consultation credits unavailable</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setActiveView("booking");
                }}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                  activeView === ("booking" as "booking" | "requests")
                    ? "bg-white text-teal-800 shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/20",
                )}
              >
                Book New
              </Button>
              <Button
                onClick={() => setActiveView("requests")}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-bold transition-all",
                  activeView === ("requests" as "booking" | "requests")
                    ? "bg-white text-teal-800 shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/20",
                )}
              >
                My Requests
              </Button>
            </div>
          </div>
        </div>
        <Globe className="absolute -right-20 -bottom-20 h-80 w-80 text-white/5" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-20">
        {activeView === "booking" && (
          <div className="bg-white rounded-3xl shadow-2xl border border-teal-100 overflow-hidden slide-up">
            {/* Improved Progress Tracker */}
            <div className="bg-gray-50/50 border-b border-gray-100 p-8">
              <div className="flex justify-between items-center max-w-2xl mx-auto relative">
                {/* Connecting Lines */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-10">
                  <div
                    className="h-full bg-teal-600 transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                  />
                </div>

                {[
                  { step: 1, label: "Case Details", icon: FileText },
                  { step: 2, label: "Contact Info", icon: User },
                  { step: 3, label: "Select Time", icon: Clock },
                  { step: 4, label: "Checkout", icon: CreditCard },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                        currentStep >= item.step
                          ? "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-200"
                          : "bg-white border-gray-200 text-gray-400",
                      )}
                    >
                      {currentStep > item.step ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <item.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-bold tracking-tight uppercase",
                        currentStep >= item.step
                          ? "text-teal-900"
                          : "text-gray-400",
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-8 md:p-12">
              <div>{renderStepContent()}</div>
              <div className="mt-4 px-4 py-3 sm:px-8 sm:py-5 bg-gray-50 border-t flex justify-between items-center gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 1 || loading}
                  className="bg-teal-600 hover:bg-teal-700 text-xs sm:text-sm gap-1 sm:gap-2 px-2 sm:px-4 text-white"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" /> Previous
                </Button>
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-teal-600 hover:bg-teal-700 text-xs sm:text-sm gap-1 sm:gap-2 px-4 sm:px-8"
                  >
                    Next <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!formData.selected_slot || loading}
                    className="bg-teal-600 hover:bg-teal-700 text-xs sm:text-sm gap-1 sm:gap-2 px-2 sm:px-8"
                  >
                    {loading ? (
                      "Processing..."
                    ) : tier === "executive" && remainingConsultations !== null && remainingConsultations > 0 ? (
                      "Confirm & Book (Free)"
                    ) : (
                      "Proceed to Payment ($99)"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}
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
};

export default ConsultationBookingPage;

// Helper components for consistency
const Info = ({ className }: { className?: string }) => (
  <AlertCircle className={className} />
);

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
