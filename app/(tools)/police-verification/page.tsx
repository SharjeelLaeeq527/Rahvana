"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import {
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  MapPin,
  CheckCircle,
  AlertCircle,
  FileText,
  // Info,
  User,
  Phone,
  CreditCard,
  // Calendar,
  Home,
  Globe,
  Users,
  Image,
  CheckSquare,
  Send,
  Clock,
  Truck,
  Banknote,
  Building2,
  Fingerprint,
  Search,
  Navigation,
  X,
  Eye,
  Download,
} from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { PKMCenter, pkmCenters } from "./(data)/punjab-pkm-centers";
import { balochistanCenters } from "./(data)/balochistan-pkm-centers";
import { kpkCenters } from "./(data)/kpk-centers";
import { findNearestCenters, geocodeAddress } from "./location-utils";
import {
  AuthorityLetterModal,
  AuthorityLetterPreviewModal,
} from "./components/AuthorityLetterComponents";

export default function PoliceVerificationPage() {
  const router = useRouter();
  const [province, setProvince] = useState<string>("");
  const [step, setStep] = useState(1);
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isAuthorityModalOpen, setIsAuthorityModalOpen] = useState(false);
  const [isAuthorityPreviewModalOpen, setIsAuthorityPreviewModalOpen] =
    useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    relation: "S/O",
    guardianName: "",
    cnic: "",
    address: "",
    purpose: "Study",
    email: "",
    phone: "",
    district: "",
  });

  const [authorityFormData, setAuthorityFormData] = useState({
    fullName: "",
    relationType: "S/O",
    relationName: "",
    cnic: "",
    authFullName: "",
    authRelationType: "S/O",
    authRelationName: "",
    authCnic: "",
    authRelationship: "Father",
    authAddress: "",
    passportNo: "",
    abroadAddress: "",
    officeLocation: "",
    stayFrom: "",
    stayTo: "",
  });

  const fadeIn = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 },
  };

  const provinces = [
    { id: "Sindh", label: "Sindh", available: true },
    { id: "Punjab", label: "Punjab", available: true },
    { id: "Balochistan", label: "Balochistan", available: true },
    { id: "KPK", label: "KPK", available: true },
  ];

  const handleNext = () => {
    if (province) {
      setStep(2);
    }
  };

  return (
    <div className="w-full flex items-center justify-center bg-background site-main-px site-main-py">
      <div className="w-full bg-card rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[600px] border border-border">
        {/* Header */}
        <div className="p-8 pb-6 border-b border-border bg-card sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldCheck className="text-primary" size={28} />
            </div>
            Police Verification Guide
          </h1>
          <p className="text-muted-foreground mt-2 ml-14">
            Follow our step-by-step guide to complete your police verification
            process.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-card">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" {...fadeIn} className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    Select Your Province
                  </h2>
                  <p className="text-muted-foreground">
                    Please choose the province where you are applying for
                    verification.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {provinces.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setProvince(p.id)}
                      className={`group relative p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                        province === p.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30 hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`p-3 rounded-full ${
                            province === p.id
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                          }`}
                        >
                          <MapPin size={24} />
                        </div>
                        {province === p.id && (
                          <div className="text-primary">
                            <CheckCircle
                              size={24}
                              className="fill-primary text-white"
                            />
                          </div>
                        )}
                      </div>
                      <h3
                        className={`text-lg font-semibold ${
                          province === p.id ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {p.label}
                      </h3>
                    </button>
                  ))}
                </div>

                <div className="pt-8 flex justify-end">
                  <button
                    onClick={handleNext}
                    disabled={!province}
                    className="px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg hover:shadow-primary/25"
                  >
                    Continue <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" {...fadeIn} className="h-full">
                {province === "Sindh" ? (
                  <SindhInstructions
                    onGenerateLetter={() => setIsLetterModalOpen(true)}
                    onApply={() =>
                      router.push(
                        `/police-verification/apply?province=${province}`,
                      )
                    }
                  />
                ) : province === "Punjab" ? (
                  <PunjabInstructions
                    onGenerateLetter={() => setIsLetterModalOpen(true)}
                    onGenerateAuthorityLetter={() =>
                      setIsAuthorityModalOpen(true)
                    }
                    onApply={() =>
                      router.push(
                        `/police-verification/apply?province=${province}`,
                      )
                    }
                  />
                ) : province === "Balochistan" ? (
                  <BalochistanInstructions
                    onGenerateLetter={() => setIsLetterModalOpen(true)}
                    onGenerateAuthorityLetter={() =>
                      setIsAuthorityModalOpen(true)
                    }
                    onApply={() =>
                      router.push(
                        `/police-verification/apply?province=${province}`,
                      )
                    }
                  />
                ) : province === "KPK" ? (
                  <KPKInstructions
                    onGenerateLetter={() => setIsLetterModalOpen(true)}
                    onGenerateAuthorityLetter={() =>
                      setIsAuthorityModalOpen(true)
                    }
                    onApply={() =>
                      router.push(
                        `/police-verification/apply?province=${province}`,
                      )
                    }
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                    <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center">
                      <AlertCircle className="text-orange-500" size={48} />
                    </div>
                    <div className="space-y-2 max-w-md">
                      <h2 className="text-2xl font-bold text-foreground">
                        Instructions Not Available
                      </h2>
                      <p className="text-muted-foreground">
                        We are currently updating our database for {province}.
                        Detailed instructions will be available soon.
                      </p>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-primary font-medium hover:underline flex items-center gap-2"
                    >
                      <ChevronLeft size={18} /> Go Back to Province Selection
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <LetterModal
        isOpen={isLetterModalOpen}
        onClose={() => setIsLetterModalOpen(false)}
        onOpenPreview={() => setIsPreviewModalOpen(true)}
        formData={formData}
        setFormData={setFormData}
        province={province}
      />
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        province={province}
        formData={formData}
      />
      <AuthorityLetterModal
        isOpen={isAuthorityModalOpen}
        onClose={() => setIsAuthorityModalOpen(false)}
        onOpenPreview={() => setIsAuthorityPreviewModalOpen(true)}
        formData={authorityFormData}
        setFormData={setAuthorityFormData}
        province={province}
      />
      <AuthorityLetterPreviewModal
        isOpen={isAuthorityPreviewModalOpen}
        onClose={() => setIsAuthorityPreviewModalOpen(false)}
        formData={authorityFormData}
        province={province}
      />
    </div>
  );
}

function SindhInstructions({
  onGenerateLetter,
  onApply,
}: {
  onGenerateLetter: () => void;
  onApply: () => void;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const instructionSets = [
    {
      title: "Initial Requirements",
      description:
        "Ensure you have your original CNIC ready and follow these preliminary steps to access the main form.",
      steps: [
        {
          title: "Choose Application Purpose",
          description:
            "From the 'Purpose Type' dropdown, select 'Immigration'. This is essential for visa and travel-related verification.",
          icon: FileText,
        },
        {
          title: "Enter Your CNIC Number",
          description:
            "Carefully type your 13-digit valid CNIC number. Ensure there are no typos, as this links to your official record.",
          icon: ShieldCheck,
        },
        {
          title: "Complete Security Check",
          description:
            "Tick the captcha checkbox ('I am not a robot'). This is a mandatory security measure to proceed.",
          icon: CheckCircle,
        },
        {
          title: "Submit and Confirm",
          description:
            "Click 'Continue'. A confirmation popup will appear—click 'OK' to be redirected to the detailed Step 1 form.",
          icon: ChevronRight,
        },
      ],
    },
    {
      title: "Step 1: Personal Information",
      description:
        "Provide your background details. All information must match your official government documents exactly.",
      steps: [
        {
          title: "Certificate Delivery Type",
          description:
            "Select either 'Hard Copy (Sign with Stamp)' or 'Delivered via Email (Digital Copy)'.",
          icon: FileText,
        },
        {
          title: "Personal Details",
          description:
            "Enter your valid Email, Full Name, Father/Husband Name, and select Date of Birth.",
          icon: User,
        },
        {
          title: "CNIC & Passport",
          description:
            "Provide CNIC Issue/Expiry dates. Enter Passport Number with Issue/Expiry dates.",
          icon: CreditCard,
        },
        {
          title: "Contact Information",
          description: "Enter a valid Pakistan Cell Number for verification.",
          icon: Phone,
        },
        {
          title: "Address & Stay",
          description:
            "Enter Current Address and specify the 'Stay From' and 'Stay To' dates.",
          icon: Home,
        },
        {
          title: "District & Residence",
          description:
            "Select your Current District and indicate if you are presently residing in Pakistan or Abroad.",
          icon: MapPin,
        },
        {
          title: "Select Country",
          description:
            "If you selected 'Abroad' in the previous step, select the specific country where you are currently staying.",
          icon: Globe,
        },
        {
          title: "Certificate Purpose",
          description:
            "Select the Name of Country for which the certificate is required.",
          icon: Globe,
        },
        {
          title: "Criminal Record Declaration",
          description:
            "Select 'Yes' or 'No'. If 'Yes', provide FIR details (No, Year, Station), upload Judgment Copy, and select Status (e.g., Acquitted, Pending Trial, Released US 169/497).",
          icon: AlertCircle,
        },
        {
          title: "Save and Continue",
          description:
            "Review your entries for accuracy, then click the 'Next' button at the bottom of the official form to move to Step 2.",
          icon: ChevronRight,
        },
      ],
    },
    {
      title: "Step 2: Details of Deponents / Guarantor",
      description:
        "Provide information for two witnesses who can verify your identity and residence.",
      steps: [
        {
          title: "Witness 1 Information",
          description:
            "Enter Full Name, Father/Husband Name, and a valid 13-digit CNIC for your first witness.",
          icon: User,
        },
        {
          title: "Witness 1 Contact & Address",
          description:
            "Provide a valid contact number and current residential address for Witness 1.",
          icon: MapPin,
        },
        {
          title: "Witness 2 Information",
          description:
            "Provide the same details (Name, Father's Name, CNIC) for your second witness.",
          icon: Users,
        },
        {
          title: "Witness 2 Contact & Address",
          description:
            "Enter the contact number and full address for Witness 2.",
          icon: Home,
        },
        {
          title: "Final Review",
          description:
            "Double-check all witness details for accuracy, then click 'Next' to proceed to document uploads.",
          icon: ChevronRight,
        },
      ],
    },
    {
      title: "Step 3: Documents Required",
      description:
        "Upload the following scanned documents. Pay close attention to the required file formats.",
      steps: [
        {
          title: "Passport Size Photograph",
          description:
            "Upload your recent photograph. (Allowed formats: .JPG, .PNG)",
          icon: Image,
        },
        {
          title: "Passport Copy",
          description:
            "Upload a copy of your current Passport. (Allowed formats: .JPG, .PNG)",
          icon: CreditCard,
        },
        {
          title: "Utility Bill Copy",
          description:
            "Upload a copy of your recent Utility Bill for address verification. (Allowed format: .PDF)",
          icon: FileText,
        },
        {
          title: "Verification Letter",
          description:
            "Upload the official Letter regarding Police Verification. (Allowed format: .PDF)",
          icon: FileText,
        },
        {
          title: "Accept Terms",
          description:
            "Tick the 'I accept the Terms and Conditions' checkbox after reading.",
          icon: CheckSquare,
        },
        {
          title: "Submit Application",
          description:
            "Click the 'Submit' button to complete your application process.",
          icon: Send,
        },
      ],
    },
  ];

  const currentSet = instructionSets[currentStepIndex];
  const isLastStep = currentStepIndex === instructionSets.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const nextStep = () => {
    if (!isLastStep) setCurrentStepIndex((prev) => prev + 1);
  };

  const prevStep = () => {
    if (!isFirstStep) setCurrentStepIndex((prev) => prev - 1);
  };

  return (
    <div className="flex flex-col h-full relative pb-24">
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            {currentSet.title}
          </h2>
          <span className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
            Part {currentStepIndex + 1} of {instructionSets.length}
          </span>
        </div>
        <p className="text-muted-foreground">{currentSet.description}</p>
      </div>

      <div className="space-y-4 overflow-y-auto px-1">
        {currentSet.steps.map((step, index) => (
          <div
            key={index}
            className="flex gap-4 p-4 rounded-2xl border border-border bg-muted/20 hover:bg-card hover:shadow-sm hover:border-primary/30 transition-all"
          >
            <div className="shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {index + 1}
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                {step.title}
                <step.icon size={18} className="text-primary" />
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-card border-t border-border flex items-center justify-between md:absolute md:rounded-b-3xl">
        <div className="w-1/3 flex justify-start">
          {!isFirstStep && (
            <button
              onClick={prevStep}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary font-medium transition-colors px-4 py-2 hover:bg-muted rounded-lg"
            >
              <ChevronLeft size={20} /> Back
            </button>
          )}
        </div>

        <div className="w-1/3 flex justify-center gap-3">
          <button
            onClick={onGenerateLetter}
            className="px-6 py-3 rounded-xl bg-primary  mr-6 text-white font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            Generate Letter <FileText size={18} />
          </button>
          <button
            onClick={onApply}
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            Apply Now
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="w-1/3 flex justify-end">
          {!isLastStep ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors px-4 py-2 hover:bg-primary/5 rounded-lg"
            >
              Next <ChevronRight size={20} />
            </button>
          ) : (
            <div className="w-[84px]"></div> // Spacer to keep center alignment valid
          )}
        </div>
      </div>
    </div>
  );
}

function PunjabInstructions({
  onGenerateLetter,
  onGenerateAuthorityLetter,
  onApply,
}: {
  onGenerateLetter: () => void;
  onGenerateAuthorityLetter: () => void;
  onApply: () => void;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const instructionSets = [
    {
      title: "Process Overview",
      description:
        "Punjab Character Certificates are issued through the Police Khidmat Markaz (PKM) network.",
      steps: [
        {
          title: "PKM Service",
          description:
            "Citizens can apply for a Character Certificate from any PKM center in Punjab, regardless of their district of residence.",
          icon: Building2,
        },
        {
          title: "Purpose of Certificate",
          description:
            "Required for traveling abroad, international jobs, immigration, and general verification.",
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: "Required Documents",
      description:
        "Ensure you have all these documents before visiting the PKM center.",
      steps: [
        {
          title: "Identity Proof",
          description: "Original CNIC or B-Form along with a clear photocopy.",
          icon: CreditCard,
        },
        {
          title: "Travel Documents",
          description: "Original Passport and a copy of the biometric page.",
          icon: FileText,
        },
        {
          title: "Legal & Authority",
          description:
            "An Affidavit and (if applicant is abroad) an Authority Letter stamped by the relevant Embassy.",
          icon: ShieldCheck,
          showButtonStyle: "authority",
        },
        {
          title: "Photograph",
          description:
            "Required only if you are applying on behalf of a blood relative.",
          icon: Image,
        },
      ],
    },
    {
      title: "Fee & Timeline",
      description: "Processing details for your application.",
      steps: [
        {
          title: "Processing Fee",
          description: "Rs. 500, payable directly at the PKM counters.",
          icon: Banknote,
        },
        {
          title: "Turnaround Time",
          description:
            "The certificate is usually ready within 3 working days after the application date.",
          icon: Clock,
        },
        {
          title: "Delivery Method",
          description:
            "Your certificate will be delivered to your address via Courier service.",
          icon: Truck,
        },
      ],
    },
    {
      title: "Special Instructions",
      description: "Additional details for specific applicant scenarios.",
      steps: [
        {
          title: "Living Away from Home",
          description:
            "You can apply from any city in Punjab. For example, a resident of Mianwali living in Multan can apply at the Multan PKM.",
          icon: MapPin,
        },
        {
          title: "PKM Center Locator",
          description:
            "Not sure where the nearest center is? Use our locator tool below to find PKM centers near you.",
          icon: Navigation,
        },
        {
          title: "Applying from Abroad",
          description:
            "Blood relatives can submit the form on your behalf with a duly attested Authority Letter.",
          icon: Users,
        },
      ],
    },
  ];

  const currentSet = instructionSets[currentStepIndex];
  const isLastStep = currentStepIndex === instructionSets.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const nextStep = () => {
    if (!isLastStep) setCurrentStepIndex((prev) => prev + 1);
  };

  const prevStep = () => {
    if (!isFirstStep) setCurrentStepIndex((prev) => prev - 1);
  };

  return (
    <div className="flex flex-col h-full relative pb-24">
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            {currentSet.title}
          </h2>
          <span className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
            Part {currentStepIndex + 1} of {instructionSets.length}
          </span>
        </div>
        <p className="text-gray-500">{currentSet.description}</p>
      </div>

      <div className="space-y-4 overflow-y-auto px-1">
        {currentSet.steps.map((step, index) => (
          <div key={index}>
            <div className="flex gap-4 p-4 rounded-2xl border border-border bg-muted/20 hover:bg-card hover:shadow-sm hover:border-primary/30 transition-all">
              <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {index + 1}
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {step.title}
                  <step.icon size={18} className="text-primary" />
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
            {step.title === "PKM Center Locator" && (
              <div className="mt-4 px-4">
                <PKMLocator province="Punjab" />
              </div>
            )}
            {step.showButtonStyle === "authority" && (
              <div className="mt-4 px-4">
                <button
                  onClick={onGenerateAuthorityLetter}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-primary/5 text-primary font-semibold hover:bg-primary/10 transition-all border border-primary/20"
                >
                  <FileText size={20} /> Generate Authority Letter
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-card border-t border-border flex items-center justify-between md:absolute md:rounded-b-3xl">
        <div className="w-1/3 flex justify-start">
          <button
            onClick={() => prevStep()}
            className={`${
              isFirstStep ? "invisible" : ""
            } flex items-center gap-2 text-gray-500 hover:text-primary font-medium transition-colors px-4 py-2 hover:bg-gray-50 rounded-lg`}
          >
            <ChevronLeft size={20} /> Back
          </button>
        </div>

        <div className="w-1/3 flex justify-center gap-3">
          <button
            onClick={onGenerateLetter}
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            Generate Letter <FileText size={18} />
          </button>
          <button
            onClick={onApply}
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            Apply Now
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="w-1/3 flex justify-end">
          {!isLastStep ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors px-4 py-2 hover:bg-primary/5 rounded-lg"
            >
              Next <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors px-4 py-2 hover:bg-primary/5 rounded-lg"
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PKMLocator({ province }: { province: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [nearestCenters, setNearestCenters] = useState<
    (PKMCenter & { distance: number })[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const centersData =
    province === "Punjab"
      ? pkmCenters
      : province === "Balochistan"
        ? balochistanCenters
        : kpkCenters;

  const getBrowserLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const centers = findNearestCenters(latitude, longitude, centersData);
        setNearestCenters(centers);
        setLoading(false);
      },
      () => {
        setError(
          "Unable to retrieve your location. Please check permissions or enter manually.",
        );
        setLoading(false);
      },
    );
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    const location = await geocodeAddress(searchQuery, province);

    if (location) {
      const centers = findNearestCenters(
        location.lat,
        location.lng,
        centersData,
      );
      setNearestCenters(centers);
    } else {
      // Fallback: try geocoding without province constraint if it failed
      const fallbackLocation = await geocodeAddress(searchQuery, "");
      if (fallbackLocation) {
        const centers = findNearestCenters(
          fallbackLocation.lat,
          fallbackLocation.lng,
          centersData,
        );
        setNearestCenters(centers);
      } else {
        setError(
          `Could not find "${searchQuery}" in ${province}. Please try entering a city name like "Peshawar" or "Multan".`,
        );
      }
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-primary/10 shadow-sm p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={getBrowserLocation}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl bg-primary/5 text-primary font-semibold hover:bg-primary/10 transition-all border border-primary/20"
        >
          {loading ? <Loader size="sm" /> : <Navigation size={20} />}
          Use My Current Location
        </button>
        <div className="flex-1">
          <form onSubmit={handleManualSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Or enter city/area"
              className="w-full p-4 pr-12 rounded-2xl border border-gray-100 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all"
            >
              {loading ? <Loader size="sm" /> : <Search size={20} />}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <AnimatePresence>
        {nearestCenters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-4 border-t border-gray-50"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-800">
                Nearest {province === "KPK" ? "PAL / PKM" : "PKM"} Centers
              </h4>
              <button
                onClick={() => setNearestCenters([])}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-3">
              {nearestCenters.map((center, index) => (
                <div
                  key={index}
                  className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-4 hover:border-primary/20 transition-all"
                >
                  <div className="p-3 rounded-xl bg-white text-primary shadow-sm">
                    <Building2 size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-gray-800">
                        {center.name}
                      </h5>
                      <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-full border border-primary/10">
                        ~{center.distance.toFixed(1)} km
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {center.address}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BalochistanInstructions({
  onGenerateLetter,
  onGenerateAuthorityLetter,
  onApply,
}: {
  onGenerateLetter: () => void;
  onGenerateAuthorityLetter: () => void;
  onApply: () => void;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const instructionSets = [
    {
      title: "Process Overview",
      description:
        "Balochistan Character Certificates are issued through the Police Mobile Khidmat Markaz.",
      steps: [
        {
          title: "Mobile PKM Service",
          description:
            "Citizens living in Quetta can apply for a Character Certificate from these mobile centers. This facility is expanding to other districts soon.",
          icon: Building2,
        },
        {
          title: "PKM Center Locator",
          description:
            "Find the nearest PKM center in Balochistan (Quetta, Gwadar, etc.) using our locator tool.",
          icon: Navigation,
        },
        {
          title: "Purpose of Certificate",
          description:
            "Essential for international travel, employment abroad, and immigration verification.",
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: "Required Documents",
      description:
        "Prepare these documents before visiting the Mobile PKM center.",
      steps: [
        {
          title: "Identity Proof",
          description: "Original CNIC or B-Form and a clear photocopy.",
          icon: CreditCard,
        },
        {
          title: "Travel Documents",
          description: "Original Passport and a copy of the biometric page.",
          icon: FileText,
        },
        {
          title: "Legal Documents",
          description:
            "An Affidavit and (if abroad) an Embassy-stamped or attested Authority Letter.",
          icon: ShieldCheck,
          showButtonStyle: "authority",
        },
        {
          title: "Photograph",
          description:
            "Needed only if applying for a blood relative's certificate.",
          icon: Image,
        },
      ],
    },
    {
      title: "Fee & Processing",
      description: "Application cost and turnaround time.",
      steps: [
        {
          title: "Processing Fee",
          description:
            "Rs. 350, payable at the Police Mobile Khidmat Markaz counters.",
          icon: Banknote,
        },
        {
          title: "Turnaround Time",
          description:
            "Your certificate will be ready in 3 working days after the application date.",
          icon: Clock,
        },
        {
          title: "Delivery",
          description:
            "The certificate is delivered to your residential address via Courier.",
          icon: Truck,
        },
      ],
    },
    {
      title: "Special Scenarios",
      description: "Guidance for applicants who are currently abroad.",
      steps: [
        {
          title: "Remote Submission",
          description:
            "A blood relative (parent, sibling, etc.) can submit the form on your behalf with an Authority Letter.",
          icon: Users,
        },
        {
          title: "Authority Letter",
          description:
            "Must mention the duration of stay and be attested by two respectable persons or the Embassy.",
          icon: FileText,
        },
      ],
    },
  ];

  const currentSet = instructionSets[currentStepIndex];
  const isLastStep = currentStepIndex === instructionSets.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const nextStep = () => {
    if (!isLastStep) setCurrentStepIndex((prev) => prev + 1);
  };

  const prevStep = () => {
    if (!isFirstStep) setCurrentStepIndex((prev) => prev - 1);
  };

  return (
    <div className="flex flex-col h-full relative pb-24">
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            {currentSet.title}
          </h2>
          <span className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
            Part {currentStepIndex + 1} of {instructionSets.length}
          </span>
        </div>
        <p className="text-gray-500">{currentSet.description}</p>
      </div>

      <div className="space-y-4 overflow-y-auto px-1">
        {currentSet.steps.map((step, index) => (
          <div key={index}>
            <div className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm hover:border-primary/10 transition-all">
              <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {index + 1}
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {step.title}
                  <step.icon size={18} className="text-primary" />
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
            {step.title === "PKM Center Locator" && (
              <div className="mt-4 px-4">
                <PKMLocator province="Balochistan" />
              </div>
            )}
            {step.showButtonStyle === "authority" && (
              <div className="mt-4 px-4">
                <button
                  onClick={onGenerateAuthorityLetter}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-primary/5 text-primary font-semibold hover:bg-primary/10 transition-all border border-primary/20"
                >
                  <FileText size={20} /> Generate Authority Letter
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 flex items-center justify-between md:absolute md:rounded-b-3xl">
        <div className="w-1/3 flex justify-start">
          <button
            onClick={() => prevStep()}
            className={`${
              isFirstStep ? "invisible" : ""
            } flex items-center gap-2 text-gray-500 hover:text-primary font-medium transition-colors px-4 py-2 hover:bg-gray-50 rounded-lg`}
          >
            <ChevronLeft size={20} /> Back
          </button>
        </div>

        <div className="w-1/3 flex justify-center gap-3">
          <button
            onClick={onGenerateLetter}
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            Generate Letter <FileText size={18} />
          </button>
          <button
            onClick={onApply}
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            Apply Now
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="w-1/3 flex justify-end">
          {!isLastStep ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors px-4 py-2 hover:bg-primary/5 rounded-lg"
            >
              Next <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors px-4 py-2 hover:bg-primary/5 rounded-lg"
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function KPKInstructions({
  onGenerateLetter,
  onGenerateAuthorityLetter,
  onApply,
}: {
  onGenerateLetter: () => void;
  onGenerateAuthorityLetter: () => void;
  onApply: () => void;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const instructionSets = [
    {
      title: "Initial Documents",
      description:
        "Gather these essential documents to start your application process.",
      steps: [
        {
          title: "Attested Affidavit",
          description:
            "Submit a 10-point affidavit on stamp paper, duly attested by the Oath Commissioner.",
          icon: FileText,
        },
        {
          title: "Identity Records",
          description:
            "Provide unattested photocopies of your recent CNIC and recent Passport (for overseas applicants).",
          icon: CreditCard,
        },
        {
          title: "Photographs",
          description:
            "Attach two recent passport-size photographs to your application.",
          icon: Image,
        },
      ],
    },
    {
      title: "Local Verification",
      description:
        "You must verify your record at the local level before final submission.",
      steps: [
        {
          title: "Police Station Check",
          description:
            "Verify your criminal record from the Beat Officer, Moharrar, SHO, and Circle DSP on the back of your stamp paper.",
          icon: ShieldCheck,
        },
        {
          title: "Address-Based Filing",
          description:
            "Apply in your respective district according to the permanent and present addresses on your CNIC.",
          icon: MapPin,
        },
        {
          title: "Multiple Addresses",
          description:
            "If you have lived at multiple addresses, you must verify your record from all relevant police stations.",
          icon: Home,
        },
      ],
    },
    {
      title: "Special Categories",
      description: "Guidance for overseas applicants and Afghan citizens.",
      steps: [
        {
          title: "Overseas Applicants",
          description:
            "A blood relative can submit the stamp paper along with their own CNIC copy and your last exit date from Pakistan.",
          icon: Users,
          showButtonStyle: "authority",
        },
        {
          title: "Afghan Citizens",
          description:
            "Submit Passport, Visa, last entry in Pakistan, Special Branch report, TIF Form, and Afghan Citizen Card, attested letter from Afghan Consulate General to SP Security office Police Lines Peshawar through TCS.",
          icon: Globe,
        },
      ],
    },
    {
      title: "Submission & Collection",
      description: "Final steps to obtain your Police Clearance Certificate.",
      steps: [
        {
          title: "PKM Center Locator",
          description:
            "Find the nearest PAL or PKM center in KPK using our locator tool.",
          icon: Navigation,
        },
        {
          title: "PAL Office Visit",
          description:
            "Personally visit the Police Assistance Lines (PAL) office for the final application process.",
          icon: Building2,
        },
        {
          title: "Collection",
          description:
            "You must personally visit to collect the Police Clearance Certificate after signature and fingerprints.",
          icon: Fingerprint,
        },
      ],
    },
  ];

  const currentSet = instructionSets[currentStepIndex];
  const isLastStep = currentStepIndex === instructionSets.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const nextStep = () => {
    if (!isLastStep) setCurrentStepIndex((prev) => prev + 1);
  };

  const prevStep = () => {
    if (!isFirstStep) setCurrentStepIndex((prev) => prev - 1);
  };

  return (
    <div className="flex flex-col h-full relative pb-24">
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            {currentSet.title}
          </h2>
          <span className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
            Part {currentStepIndex + 1} of {instructionSets.length}
          </span>
        </div>
        <p className="text-gray-500">{currentSet.description}</p>
      </div>

      <div className="space-y-4 overflow-y-auto px-1">
        {currentSet.steps.map((step, index) => (
          <div key={index}>
            <div className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm hover:border-primary/10 transition-all">
              <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {index + 1}
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {step.title}
                  <step.icon size={18} className="text-primary" />
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
            {step.title === "PKM Center Locator" && (
              <div className="mt-4 px-4">
                <PKMLocator province="KPK" />
              </div>
            )}
            {step.showButtonStyle === "authority" && (
              <div className="mt-4 px-4">
                <button
                  onClick={onGenerateAuthorityLetter}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-primary/5 text-primary font-semibold hover:bg-primary/10 transition-all border border-primary/20"
                >
                  <FileText size={20} /> Generate Authority Letter
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 flex items-center justify-between md:absolute md:rounded-b-3xl">
        <div className="w-1/3 flex justify-start">
          <button
            onClick={() => prevStep()}
            className={`${
              isFirstStep ? "invisible" : ""
            } flex items-center gap-2 text-gray-500 hover:text-primary font-medium transition-colors px-4 py-2 hover:bg-gray-50 rounded-lg`}
          >
            <ChevronLeft size={20} /> Back
          </button>
        </div>

        <div className="w-1/3 flex justify-center gap-3">
          <button
            onClick={onGenerateLetter}
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            Generate Letter <FileText size={18} />
          </button>
          <button
            onClick={onApply}
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            Apply Now
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="w-1/3 flex justify-end">
          {!isLastStep ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors px-4 py-2 hover:bg-primary/5 rounded-lg"
            >
              Next <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors px-4 py-2 hover:bg-primary/5 rounded-lg"
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface FormData {
  fullName: string;
  relation: string;
  guardianName: string;
  cnic: string;
  address: string;
  purpose: string;
  email: string;
  phone: string;
  district: string;
}

interface LetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreview: () => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  province: string;
}

function LetterModal({
  isOpen,
  onClose,
  onOpenPreview,
  formData,
  setFormData,
  province,
}: LetterModalProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCNIC = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    let formatted = cleaned;
    if (cleaned.length > 5 && cleaned.length <= 12) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    } else if (cleaned.length > 12) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(
        5,
        12,
      )}-${cleaned.slice(12, 13)}`;
    }
    return formatted;
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    // Allows optional + only at start, followed by digits
    return /^\+?[0-9]*$/.test(phone);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    let newValue = value;
    let error = "";

    if (name === "cnic") {
      newValue = formatCNIC(value);
      if (newValue.replace(/-/g, "").length !== 13) {
        error = "CNIC must be 13 digits";
      }
    } else if (name === "phone") {
      if (!validatePhone(value)) return;
      newValue = value;
    } else if (name === "email") {
      if (value && !validateEmail(value)) {
        error = "Invalid email format";
      }
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const downloadPDF = async () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

    try {
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: "police_verification",
          data: { ...formData, province },
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Police_Verification_Letter_${
        formData.fullName.replace(/\s+/g, "_") || "unnamed"
      }.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm px-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card w-full max-w-2xl xl:max-w-4xl my-auto rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-border"
      >
        <div className="p-6 md:p-8 overflow-y-auto bg-card">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Generate Letter
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-primary/30 rounded-full transition-colors bg-primary/10"
            >
              <X size={24} className="text-muted-foreground" />
            </button>
          </div>

          <form className="space-y-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full p-3 rounded-xl border border-input bg-background/50 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">
                  Relation
                </label>
                <select
                  name="relation"
                  value={formData.relation}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-input bg-background/50 focus:border-primary outline-none transition-all"
                >
                  <option value="S/O">S/O</option>
                  <option value="D/O">D/O</option>
                  <option value="W/O">W/O</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">
                Father/Guardian/Husband Name
              </label>
              <input
                type="text"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleChange}
                placeholder="Enter guardian name"
                className="w-full p-3 rounded-xl border border-input bg-background/50 focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">
                CNIC Number
                {errors.cnic && (
                  <span className="text-red-500 text-xs ml-2">
                    ({errors.cnic})
                  </span>
                )}
              </label>
              <input
                type="text"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                placeholder="42101-1234567-1"
                maxLength={15}
                className={`w-full p-3 rounded-xl border bg-background/50 outline-none transition-all ${
                  errors.cnic
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-input focus:border-primary"
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">
                Full Residential Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your complete address"
                className="w-full p-3 rounded-xl border border-input bg-background/50 focus:border-primary outline-none transition-all min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">
                  Purpose
                </label>
                <select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-input bg-background/50 focus:border-primary outline-none transition-all"
                >
                  <option value="Study">Study</option>
                  <option value="Immigration">Immigration</option>
                  <option value="Foreign Employment">Foreign Employment</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">
                  District/Region
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="e.g. Karachi Central"
                  className="w-full p-3 rounded-xl border border-input bg-background/50 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">
                  Email Address
                  {errors.email && (
                    <span className="text-red-500 text-xs ml-2">
                      (Invalid format)
                    </span>
                  )}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  className={`w-full p-3 rounded-xl border bg-background/50 outline-none transition-all ${
                    errors.email
                      ? "border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-input focus:border-primary"
                  }`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full p-3 rounded-xl border border-input bg-background/50 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={onOpenPreview}
                disabled={
                  Object.values(errors).some((e) => e !== "") ||
                  !formData.fullName ||
                  !formData.cnic
                }
                className="flex-1 py-4 bg-muted text-muted-foreground font-bold rounded-2xl hover:bg-muted/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye size={20} /> Preview
              </button>
              <button
                type="button"
                disabled={
                  Object.values(errors).some((e) => e !== "") ||
                  !formData.fullName ||
                  !formData.cnic
                }
                onClick={downloadPDF}
                className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={20} /> Download PDF
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  province: string;
  formData: FormData;
}

function PreviewModal({
  isOpen,
  onClose,
  province,
  formData,
}: PreviewModalProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

    try {
      const res = await fetch(`${apiUrl}/fill-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: "police_verification",
          data: { ...formData, province },
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Police_Verification_Letter_${
        formData.fullName.replace(/\s+/g, "_") || "unnamed"
      }.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-card w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-border"
      >
        <div className="p-6 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-foreground">
              Letter Preview
            </h2>
            <button
              onClick={downloadPDF}
              className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm"
            >
              <Download size={16} /> Download
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 flex justify-center">
          <div
            ref={previewRef}
            className="shadow-lg w-full max-w-[210mm]"
            style={{ backgroundColor: "#ffffff" }}
          >
            <LetterContent formData={formData} province={province} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function LetterContent({
  formData,
  province,
}: {
  formData: FormData;
  province: string;
}) {
  return (
    <div
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        lineHeight: "1.6",
        textAlign: "left",
        margin: "0 auto",
        fontSize: "12pt",
        width: "210mm",
        minHeight: "297mm",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
        color: "#000000",
        padding: "20mm",
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "1.25rem",
          textDecoration: "underline",
          marginBottom: "2.5rem",
        }}
      >
        Application for Issuance of Police Character Certificate
      </div>

      <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>To,</div>
      <div style={{ fontWeight: "bold" }}>
        The Senior Superintendent of Police (SSP)
      </div>
      <div style={{ marginBottom: "2rem" }}>
        {formData.district || "[District/Region]"}, {province}, Pakistan
      </div>

      <div style={{ fontWeight: "bold", marginBottom: "1rem" }}>
        Subject:{" "}
        <span style={{ textDecoration: "underline" }}>
          Application for Issuance of Police Character Certificate
        </span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>Respected Sir,</div>

      <div style={{ marginBottom: "1.5rem", textAlign: "justify" }}>
        I,{" "}
        <span style={{ fontWeight: "bold", textDecoration: "underline" }}>
          {formData.fullName || "[Full Name]"}
        </span>
        ,{" "}
        <span style={{ fontWeight: "bold", textDecoration: "underline" }}>
          {formData.relation}
        </span>{" "}
        <span style={{ fontWeight: "bold", textDecoration: "underline" }}>
          {formData.guardianName || "[Guardian Name]"}
        </span>
        , CNIC No.{" "}
        <span style={{ fontWeight: "bold", textDecoration: "underline" }}>
          {formData.cnic || "[CNIC Number]"}
        </span>
        , resident of{" "}
        <span style={{ fontWeight: "bold", textDecoration: "underline" }}>
          {formData.address || "[Full Residential Address]"}
        </span>
        , respectfully request the issuance of a Police Character Certificate in
        my favor.
      </div>

      <div style={{ marginBottom: "1.5rem", textAlign: "justify" }}>
        The certificate is required for{" "}
        <span style={{ fontWeight: "bold", textDecoration: "underline" }}>
          {formData.purpose}
        </span>{" "}
        purposes. I affirm that I have no criminal record, and the certificate
        is necessary for my overseas plans.
      </div>

      <div style={{ marginBottom: "2rem" }}>
        Kindly process my request at your earliest convenience. For any further
        information, you may contact me at:
      </div>

      <div style={{ marginBottom: "0.25rem" }}>
        <span style={{ fontWeight: "bold" }}>Email:</span>{" "}
        {formData.email || "[Email Address]"}
      </div>
      <div style={{ marginBottom: "2.5rem" }}>
        <span style={{ fontWeight: "bold" }}>Phone:</span>{" "}
        {formData.phone || "[Phone Number]"}
      </div>

      <div style={{ marginBottom: "2rem" }}>
        I shall remain grateful for your cooperation.
      </div>

      <div style={{ marginTop: "3rem" }}>
        <div style={{ fontWeight: "bold" }}>Sincerely,</div>
        <div style={{ marginTop: "1rem" }}>
          {formData.fullName || "[Full Name]"}
        </div>
        <div>CNIC: {formData.cnic || "[CNIC Number]"}</div>
        <div>Date: {new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
}
