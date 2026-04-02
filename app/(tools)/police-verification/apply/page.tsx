"use client";

import { useState, Suspense } from "react";
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
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { Loader } from "@/components/ui/spinner";

function PoliceApplyContent() {
  // const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  // const province = searchParams.get("province") || "";
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    targetCountry: "",
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

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
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

    if (
      name.toLowerCase().includes("mobile") ||
      name.toLowerCase().includes("contact")
    ) {
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

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    name: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();

      // Photograph and Passport Copy: JPG, PNG
      if (name === "photograph" || name === "passportCopy") {
        if (!["jpg", "jpeg", "png"].includes(ext || "")) {
          alert("Only JPG and PNG formats are allowed for this field.");
          return;
        }
      }

      // Utility Bill and Police Letter: PDF
      if (name === "utilityBill" || name === "policeLetter") {
        if (ext !== "pdf") {
          alert("Only PDF format is allowed for this field.");
          return;
        }
      }

      // File Size Check (Max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit.");
        return;
      }

      setFiles((prev) => ({ ...prev, [name]: file }));
    }
  };

  const validateStep = (step: number) => {
    let isValid = true;
    // let newErrors = { ...errors }; // Keep existing regex errors

    if (step === 1) {
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
      if (formData.residingIn === "Abroad" && !formData.residingCountry)
        isValid = false;
      if (!formData.targetCountry) isValid = false;

      // Passport checks (assuming required)
      if (!formData.passport) isValid = false;
      if (!formData.passportIssue) isValid = false;
      if (!formData.passportExpiry) isValid = false;

      if (!isValid) alert("Please fill all required fields in Step 1");
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

      if (!isValid)
        alert("Please fill all details for both witnesses in Step 2");
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

      if (!isValid)
        alert(
          "Please upload all required documents" +
            (formData.arrested === "Yes" ? " including arrest details." : "."),
        );
    }

    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    if (validateStep(3)) {
      setIsSubmitting(true);
      try {
        // 1. Submit text data
        const payload = {
          ...formData,
          userId: user?.id,
        };

        const response = await fetch("/api/police-verification/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Submission failed");

        const { id, requestId } = result;

        // 2. Upload files
        const fileUploadPromises = Object.entries(files).map(
          async ([key, file]) => {
            if (!file) return;

            const uploadFormData = new FormData();
            uploadFormData.append("file", file);
            uploadFormData.append("requestId", id);
            uploadFormData.append("fileType", key);

            const uploadRes = await fetch("/api/police-verification/upload", {
              method: "POST",
              body: uploadFormData,
            });

            if (!uploadRes.ok) {
              console.error(`Failed to upload ${key}`);
            }
          },
        );

        await Promise.all(fileUploadPromises);

        alert(
          `Application Submitted Successfully! Your Request ID is: ${requestId}`,
        );
        router.push("/user-dashboard");
      } catch (error) {
        console.error(error);
        alert(
          "Failed to submit application: " +
            (error instanceof Error ? error.message : "Unknown error"),
        );
      } finally {
        setIsSubmitting(false);
      }
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

  return (
    <div className="w-full bg-[#f8fafc] flex flex-col items-center site-main-px site-main-py">
      <div className="w-full bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl shadow-gray-200/50 overflow-hidden flex flex-col min-h-[700px] border border-gray-100">
        {/* Header */}
        <div className="p-6 md:p-8 pb-4 md:pb-6 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-primary/10 rounded-xl sm:rounded-2xl shrink-0">
                <ShieldCheck className="text-primary" size={28} />
              </div>
              {/* {province} */}
              Sindh Police Verification Form
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    s === currentStep
                      ? "w-8 bg-primary"
                      : s < currentStep
                        ? "w-4 bg-primary/40"
                        : "w-4 bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
          <div
            className="flex items-center gap-4 md:gap-6 overflow-x-auto pb-4 md:pb-0"
            style={{ scrollbarWidth: "none" }}
          >
            <div className="flex items-center gap-2 text-sm shrink-0">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStep >= 1
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                1
              </span>
              <span
                className={
                  currentStep >= 1
                    ? "text-gray-900 font-semibold"
                    : "text-gray-400"
                }
              >
                Personal Info
              </span>
            </div>
            <div className="w-4 md:w-8 h-px bg-gray-200 shrink-0" />
            <div className="flex items-center gap-2 text-sm shrink-0">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStep >= 2
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                2
              </span>
              <span
                className={
                  currentStep >= 2
                    ? "text-gray-900 font-semibold"
                    : "text-gray-400"
                }
              >
                Details of Deponents/Guarantor
              </span>
            </div>
            <div className="w-4 md:w-8 h-px bg-gray-200 shrink-0" />
            <div className="flex items-center gap-2 text-sm shrink-0">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStep >= 3
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                3
              </span>
              <span
                className={
                  currentStep >= 3
                    ? "text-gray-900 font-semibold"
                    : "text-gray-400"
                }
              >
                Documents Required
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 p-6 md:p-12 overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                {...fadeIn}
                className="space-y-6 md:space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">
                      Purpose
                    </label>
                    <select
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Immigration">Immigration</option>
                      <option value="Visa">Visa</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">
                      Certificate Delivery Type
                    </label>
                    <select
                      name="deliveryType"
                      value={formData.deliveryType}
                      onChange={handleChange}
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Type</option>
                      <option value="Hard Copy">
                        Hard Copy (Sign with Stamp)
                      </option>
                      <option value="Digital">
                        Delivered via Email (Digital copy)
                      </option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className={`absolute left-4 top-1/2 -translate-y-1/2 ${
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
                      className={`w-full p-4 pl-12 rounded-2xl bg-gray-50 border transition-all ${
                        errors.email
                          ? "border-red-300 bg-red-50/30 focus:bg-white focus:border-red-500"
                          : "border-transparent focus:bg-white focus:border-primary"
                      } outline-none focus:ring-4 ${
                        errors.email
                          ? "focus:ring-red-500/5"
                          : "focus:ring-primary/5"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 ml-1 font-medium">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">
                      Father Name / WO / DO
                    </label>
                    <div className="relative">
                      <Users
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type="text"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleChange}
                        placeholder="Enter father/husband name"
                        className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Date Of Birth
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all cursor-pointer"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-4xl border border-gray-100 space-y-6">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <CreditCard size={20} className="text-primary" /> CNIC
                    Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                        CNIC Number
                      </label>
                      <input
                        type="text"
                        name="cnic"
                        value={formData.cnic}
                        onChange={handleChange}
                        placeholder="XXXXX-XXXXXXX-X"
                        className={`w-full p-4 rounded-xl bg-white border outline-none transition-all ${
                          errors.cnic
                            ? "border-red-300 focus:border-red-500"
                            : "border-gray-100 focus:border-primary"
                        }`}
                      />
                      {errors.cnic && (
                        <p className="text-[10px] text-red-500 ml-1 font-bold">
                          {errors.cnic}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                        Issue Date
                      </label>
                      <input
                        type="date"
                        name="cnicIssue"
                        value={formData.cnicIssue}
                        onChange={handleChange}
                        className="w-full p-4 rounded-xl bg-white border border-gray-100 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        name="cnicExpiry"
                        value={formData.cnicExpiry}
                        onChange={handleChange}
                        className="w-full p-4 rounded-xl bg-white border border-gray-100 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-4xl border border-gray-100 space-y-6">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Globe size={20} className="text-primary" /> Passport
                    Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                        Passport No
                      </label>
                      <input
                        type="text"
                        name="passport"
                        value={formData.passport}
                        onChange={handleChange}
                        placeholder="Passport Number"
                        className="w-full p-4 rounded-xl bg-white border border-gray-100 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                        Issue Date
                      </label>
                      <input
                        type="date"
                        name="passportIssue"
                        value={formData.passportIssue}
                        onChange={handleChange}
                        className="w-full p-4 rounded-xl bg-white border border-gray-100 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        name="passportExpiry"
                        value={formData.passportExpiry}
                        onChange={handleChange}
                        className="w-full p-4 rounded-xl bg-white border border-gray-100 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Mobile (Pakistan cell number)
                  </label>
                  <div className="relative">
                    <Phone
                      className={`absolute left-4 top-1/2 -translate-y-1/2 ${
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
                      className={`w-full p-4 pl-12 rounded-2xl bg-gray-50 border transition-all ${
                        errors.mobile
                          ? "border-red-300 bg-red-50/30 focus:bg-white focus:border-red-500"
                          : "border-transparent focus:bg-white focus:border-primary"
                      } outline-none focus:ring-4 ${
                        errors.mobile
                          ? "focus:ring-red-500/5"
                          : "focus:ring-primary/5"
                      }`}
                    />
                  </div>
                  {errors.mobile && (
                    <p className="text-xs text-red-500 ml-1 font-medium">
                      {errors.mobile}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Current Address (Verification for Pakistan)
                  </label>
                  <div className="relative">
                    <Home
                      className="absolute left-4 top-6 text-gray-400"
                      size={20}
                    />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter full address"
                      rows={3}
                      className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">
                      Stay From (as given address)
                    </label>
                    <input
                      type="date"
                      name="stayFrom"
                      value={formData.stayFrom}
                      onChange={handleChange}
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">
                      Stay To (as given address)
                    </label>
                    <input
                      type="date"
                      name="stayTo"
                      value={formData.stayTo}
                      onChange={handleChange}
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Select Your Current District
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
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

                <div className="bg-gray-50 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 space-y-6">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Presently Residing
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({ ...p, residingIn: "Pakistan" }))
                      }
                      className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all ${
                        formData.residingIn === "Pakistan"
                          ? "border-primary bg-white shadow-lg shadow-primary/10 text-primary font-bold"
                          : "border-transparent bg-white/50 text-gray-500 hover:bg-white"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          formData.residingIn === "Pakistan"
                            ? "border-primary bg-primary"
                            : "border-gray-300"
                        }`}
                      />
                      Pakistan
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({ ...p, residingIn: "Abroad" }))
                      }
                      className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all ${
                        formData.residingIn === "Abroad"
                          ? "border-primary bg-white shadow-lg shadow-primary/10 text-primary font-bold"
                          : "border-transparent bg-white/50 text-gray-500 hover:bg-white"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
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
                      <label className="text-sm font-bold text-gray-700 ml-1">
                        Select Country
                      </label>
                      <select
                        name="residingCountry"
                        value={formData.residingCountry}
                        onChange={handleChange}
                        className="w-full p-4 rounded-2xl bg-white border border-gray-100 focus:border-primary outline-none transition-all"
                      >
                        <option value="">Select Country</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="UAE">UAE</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                      </select>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Name of Country for which Certificate is required
                  </label>
                  <select
                    name="targetCountry"
                    value={formData.targetCountry}
                    onChange={handleChange}
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                  >
                    <option value="">Select Country</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="UAE">UAE</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                  </select>
                </div>

                {/* Arrest History & Review Moved inside Step 3 for compact flow */}
                <div className="bg-orange-50 border border-orange-100 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-100 rounded-2xl shrink-0">
                      <AlertCircle className="text-orange-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        Arrest History
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        In case you were arrested by Police. Please attach
                        documents if applicable.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 px-1">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({ ...p, arrested: "Yes" }))
                      }
                      className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all ${
                        formData.arrested === "Yes"
                          ? "border-orange-500 bg-white shadow-lg shadow-orange-500/10 text-orange-600 font-bold"
                          : "border-transparent bg-white/50 text-gray-500 hover:bg-white"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          formData.arrested === "Yes"
                            ? "border-orange-500 bg-orange-500"
                            : "border-gray-300"
                        }`}
                      />
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({ ...p, arrested: "No" }))
                      }
                      className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all ${
                        formData.arrested === "No"
                          ? "border-gray-700 bg-white shadow-lg text-gray-700 font-bold"
                          : "border-transparent bg-white/50 text-gray-500 hover:bg-white"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                            FIR No
                          </label>
                          <input
                            type="text"
                            name="firNo"
                            value={formData.firNo}
                            onChange={handleChange}
                            placeholder="e.g. 123"
                            className="w-full p-4 rounded-xl bg-white border border-orange-100 focus:border-orange-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                            FIR Year
                          </label>
                          <input
                            type="text"
                            name="firYear"
                            value={formData.firYear}
                            onChange={handleChange}
                            placeholder="e.g. 2024"
                            className="w-full p-4 rounded-xl bg-white border border-orange-100 focus:border-orange-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                            Police Station
                          </label>
                          <select
                            name="policeStation"
                            value={formData.policeStation}
                            onChange={handleChange}
                            className="w-full p-4 rounded-xl bg-white border border-orange-100 focus:border-orange-500 outline-none transition-all cursor-pointer"
                          >
                            <option value="">Select Station</option>
                            <option value="Clifton">Clifton</option>
                            <option value="Defense">Defense</option>
                            <option value="Gulshan">Gulshan</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                          Judgment Copy (Attachment)
                        </label>
                        <div className="relative group">
                          <input
                            type="file"
                            onChange={(e) =>
                              handleFileChange(e, "judgmentCopy")
                            }
                            className="hidden"
                            id="judgementUpload"
                          />
                          <label
                            htmlFor="judgementUpload"
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-dashed border-orange-300 hover:border-orange-500 cursor-pointer transition-all group-hover:bg-orange-50/50"
                          >
                            <div className="p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors">
                              <Upload className="text-orange-600" size={20} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-800">
                                {files.judgmentCopy
                                  ? files.judgmentCopy.name
                                  : "Choose File"}
                              </p>
                              <p className="text-xs text-gray-400">
                                PDF, JPG, PNG (Max 5MB)
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                          Status
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="w-full p-4 rounded-xl bg-white border border-orange-100 focus:border-orange-500 outline-none transition-all cursor-pointer"
                        >
                          <option value="">Select Status</option>
                          <option value="Acquitted">Acquitted</option>
                          <option value="Released">
                            Released US 169/497 crpc
                          </option>
                          <option value="Pending">Pending Trial</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                {...fadeIn}
                className="space-y-6 md:space-y-8"
              >
                {/* Witness 1 */}
                <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="p-2.5 bg-primary/10 rounded-2xl shrink-0">
                      <User className="text-primary" size={20} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        Full Name ( Witness 1 )
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400">
                        Enter first guarantor details
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">
                        Name
                      </label>
                      <input
                        type="text"
                        name="witness1Name"
                        value={formData.witness1Name}
                        onChange={handleChange}
                        placeholder="Name"
                        className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">
                        Father Name / WO / DO
                      </label>
                      <input
                        type="text"
                        name="witness1Father"
                        value={formData.witness1Father}
                        onChange={handleChange}
                        placeholder="FatherName"
                        className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">
                        CNIC
                      </label>
                      <input
                        type="text"
                        name="witness1Cnic"
                        value={formData.witness1Cnic}
                        onChange={handleChange}
                        placeholder="XXXXX-XXXXXXX-X"
                        className={`w-full p-4 rounded-2xl bg-gray-50 border transition-all ${
                          errors.witness1Cnic
                            ? "border-red-300 bg-red-50/10"
                            : "border-transparent focus:bg-white focus:border-primary"
                        } outline-none focus:ring-4 focus:ring-primary/5`}
                      />
                      {errors.witness1Cnic && (
                        <p className="text-xs text-red-500 ml-1 font-medium">
                          {errors.witness1Cnic}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">
                        Contact No
                      </label>
                      <input
                        type="text"
                        name="witness1Contact"
                        value={formData.witness1Contact}
                        onChange={handleChange}
                        placeholder="03XX-XXXXXXX"
                        className={`w-full p-4 rounded-2xl bg-gray-50 border transition-all ${
                          errors.witness1Contact
                            ? "border-red-300 bg-red-50/10"
                            : "border-transparent focus:bg-white focus:border-primary"
                        } outline-none focus:ring-4 focus:ring-primary/5`}
                      />
                      {errors.witness1Contact && (
                        <p className="text-xs text-red-500 ml-1 font-medium">
                          {errors.witness1Contact}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">
                      Address
                    </label>
                    <textarea
                      name="witness1Address"
                      value={formData.witness1Address}
                      onChange={handleChange}
                      placeholder="Enter Address"
                      rows={2}
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Witness 2 */}
                <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="p-2.5 bg-primary/10 rounded-2xl shrink-0">
                      <User className="text-primary" size={20} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        Full Name ( Witness 2 )
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400">
                        Enter second guarantor details
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">
                        Name
                      </label>
                      <input
                        type="text"
                        name="witness2Name"
                        value={formData.witness2Name}
                        onChange={handleChange}
                        placeholder="Name"
                        className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">
                        Father Name / WO / DO
                      </label>
                      <input
                        type="text"
                        name="witness2Father"
                        value={formData.witness2Father}
                        onChange={handleChange}
                        placeholder="FatherName"
                        className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">
                        CNIC
                      </label>
                      <input
                        type="text"
                        name="witness2Cnic"
                        value={formData.witness2Cnic}
                        onChange={handleChange}
                        placeholder="XXXXX-XXXXXXX-X"
                        className={`w-full p-4 rounded-2xl bg-gray-50 border transition-all ${
                          errors.witness2Cnic
                            ? "border-red-300 bg-red-50/10"
                            : "border-transparent focus:bg-white focus:border-primary"
                        } outline-none focus:ring-4 focus:ring-primary/5`}
                      />
                      {errors.witness2Cnic && (
                        <p className="text-xs text-red-500 ml-1 font-medium">
                          {errors.witness2Cnic}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">
                        Contact No
                      </label>
                      <input
                        type="text"
                        name="witness2Contact"
                        value={formData.witness2Contact}
                        onChange={handleChange}
                        placeholder="03XX-XXXXXXX"
                        className={`w-full p-4 rounded-2xl bg-gray-50 border transition-all ${
                          errors.witness2Contact
                            ? "border-red-300 bg-red-50/10"
                            : "border-transparent focus:bg-white focus:border-primary"
                        } outline-none focus:ring-4 focus:ring-primary/5`}
                      />
                      {errors.witness2Contact && (
                        <p className="text-xs text-red-500 ml-1 font-medium">
                          {errors.witness2Contact}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">
                      Address
                    </label>
                    <textarea
                      name="witness2Address"
                      value={formData.witness2Address}
                      onChange={handleChange}
                      placeholder="Enter Address"
                      rows={2}
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                {...fadeIn}
                className="space-y-6 md:space-y-8"
              >
                <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 md:space-y-8">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="p-2.5 bg-primary/10 rounded-2xl shrink-0">
                      <Upload className="text-primary" size={20} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        Documents Required
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400">
                        Please upload necessary legal documents
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Photograph */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">
                        Passport Size Photograph (.JPG, .PNG)
                      </label>
                      <div className="relative group">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, "photograph")}
                          className="hidden"
                          id="photographUpload"
                        />
                        <label
                          htmlFor="photographUpload"
                          className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200 hover:border-primary cursor-pointer transition-all group-hover:bg-primary/5"
                        >
                          <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-primary/10 transition-colors">
                            <Upload
                              className="text-gray-400 group-hover:text-primary"
                              size={20}
                            />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate">
                              {files.photograph
                                ? files.photograph.name
                                : "Choose File"}
                            </p>
                            <p className="text-xs text-gray-400">
                              Max size 2MB
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Passport Copy */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">
                        Attach copy of Passport (.JPG, .PNG)
                      </label>
                      <div className="relative group">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, "passportCopy")}
                          className="hidden"
                          id="passportUpload"
                        />
                        <label
                          htmlFor="passportUpload"
                          className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200 hover:border-primary cursor-pointer transition-all group-hover:bg-primary/5"
                        >
                          <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-primary/10 transition-colors">
                            <Upload
                              className="text-gray-400 group-hover:text-primary"
                              size={20}
                            />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate">
                              {files.passportCopy
                                ? files.passportCopy.name
                                : "Choose File"}
                            </p>
                            <p className="text-xs text-gray-400">
                              Max size 5MB
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Utility Bill */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">
                        Copy of Utility Bill (.PDF)
                      </label>
                      <div className="relative group">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, "utilityBill")}
                          className="hidden"
                          id="billUpload"
                        />
                        <label
                          htmlFor="billUpload"
                          className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200 hover:border-primary cursor-pointer transition-all group-hover:bg-primary/5"
                        >
                          <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-primary/10 transition-colors">
                            <Upload
                              className="text-gray-400 group-hover:text-primary"
                              size={20}
                            />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate">
                              {files.utilityBill
                                ? files.utilityBill.name
                                : "Choose File"}
                            </p>
                            <p className="text-xs text-gray-400">
                              PDF format required
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Police Letter */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">
                        Letter regarding Police Verification (.PDF)
                      </label>
                      <div className="relative group">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, "policeLetter")}
                          className="hidden"
                          id="letterUpload"
                        />
                        <label
                          htmlFor="letterUpload"
                          className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200 hover:border-primary cursor-pointer transition-all group-hover:bg-primary/5"
                        >
                          <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-primary/10 transition-colors">
                            <Upload
                              className="text-gray-400 group-hover:text-primary"
                              size={20}
                            />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate">
                              {files.policeLetter
                                ? files.policeLetter.name
                                : "Choose File"}
                            </p>
                            <p className="text-xs text-gray-400">
                              PDF format required
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 space-y-6">
                  <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-4">
                    Application Review
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold">
                        Province
                      </p>
                      <p className="font-semibold text-gray-700 text-sm sm:text-base">
                        {/* {province} */} Sindh
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold">
                        Purpose
                      </p>
                      <p className="font-semibold text-gray-700 text-sm sm:text-base">
                        {formData.purpose}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold">
                        Delivery
                      </p>
                      <p className="font-semibold text-gray-700 text-sm sm:text-base truncate">
                        {formData.deliveryType || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold">
                        District
                      </p>
                      <p className="font-semibold text-gray-700 text-sm sm:text-base">
                        {formData.district || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                      <Clock className="text-primary" size={20} />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      By submitting, I confirm that all provided information is
                      accurate and matches my legal documents. Processing takes
                      3-7 working days.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 bg-white border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <button
            onClick={handleBack}
            className="w-full sm:w-auto justify-center px-8 py-4 rounded-2xl bg-gray-50 text-gray-600 font-bold hover:bg-gray-100 transition-all flex items-center gap-2 group"
          >
            <ChevronLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />{" "}
            Back
          </button>
          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              disabled={Object.keys(errors).length > 0}
              className="w-full sm:w-auto justify-center px-10 py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 group shadow-xl shadow-primary/25"
            >
              Continue{" "}
              <ChevronRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(errors).length > 0 || isSubmitting}
              className="w-full sm:w-auto justify-center px-10 py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 group shadow-xl shadow-green-600/25"
            >
              {isSubmitting ? (
                <Loader size="sm" text="Running Checks" />
              ) : (
                <>
                  Submit Application{" "}
                  <Send
                    size={20}
                    className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                  />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PoliceApplyPage() {
  return (
    <Suspense fallback={<Loader fullScreen size="lg" text="Loading..." />}>
      <PoliceApplyContent />
    </Suspense>
  );
}
