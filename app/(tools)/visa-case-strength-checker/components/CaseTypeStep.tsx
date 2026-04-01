import { Button } from "@/components/ui/button";
import { CaseTypeStepProps } from "../types";

const CaseTypeStep = ({
  formData,
  error,
  onCaseTypeChange,
  isAuthenticated,
  loading = false,
  onNext,
  onBack,
}: CaseTypeStepProps) => (
  <div className="space-y-8">
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-slate-900 mb-3">
        Select Case Type
      </h2>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Please select the type of visa case you want to assess.
      </p>
      {isAuthenticated && (
        <div className="mt-4">
          <button
            onClick={() =>
              (window.location.href = "/visa-case-strength-checker/my-cases")
            }
            suppressHydrationWarning
            className="text-teal-600 hover:text-teal-700 hover:underline text-base font-medium cursor-pointer"
          >
            See your cases →
          </button>
        </div>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ACTIVE: SPOUSE (IR-1) */}
      <button
        type="button"
        suppressHydrationWarning
        className={`p-5 md:p-8 border-2 rounded-xl text-center transition-all cursor-pointer ${
          formData.caseType === "ir-1"
            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        }`}
        onClick={() => {
          onCaseTypeChange("ir-1");
        }}
      >
        <div className="mx-auto bg-primary/10 text-primary w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 md:h-8 md:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-lg md:text-xl mb-2 text-foreground">
          Spouse Visa
        </h3>
        <p className="text-base text-muted-foreground">
          IR-1 / CR-1 – Spouse of U.S. Citizen
        </p>
      </button>

      {/* ACTIVE: K1 */}
      {/* <button
        type="button"
        suppressHydrationWarning
        className={`p-5 md:p-8 border-2 rounded-xl text-center transition-all cursor-pointer ${
          formData.caseType === "k-1"
            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        }`}
        onClick={() => {
          onCaseTypeChange("k-1");
        }}
      >
        <div className="mx-auto bg-primary/10 text-primary w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 md:h-8 md:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-lg md:text-xl mb-2 text-foreground">
          Fiance(e) Visa
        </h3>
        <p className="text-base text-muted-foreground">
          K-1 – Fiance(e) of U.S. Citizen
        </p>
      </button> */}

      {/* COMING SOON: PARENT */}
      <div className="p-8 border-2 rounded-xl text-center bg-muted/30 border-border opacity-70">
        <div className="mx-auto bg-muted text-muted-foreground w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-xl mb-2 text-muted-foreground">
          Parent Visa
        </h3>
        <p className="text-base text-muted-foreground">
          IR-5 – Parent of U.S. Citizen
        </p>
        <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
          Coming Soon
        </span>
      </div>

      <div className="p-8 border-2 rounded-xl text-center bg-muted/30 border-border opacity-70">
        <div className="mx-auto bg-muted text-muted-foreground w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-xl mb-2 text-muted-foreground">
          Fiance(e) Visa
        </h3>
        <p className="text-base text-muted-foreground">
          K-1 – Fiance(e) of U.S. Citizen
        </p>
        <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
          Coming Soon
        </span>
      </div>

      {/* COMING SOON: CHILD */}
      <div className="p-8 border-2 rounded-xl text-center bg-muted/30 border-border opacity-70">
        <div className="mx-auto bg-muted text-muted-foreground w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-xl mb-2 text-muted-foreground">
          Child Visa
        </h3>
        <p className="text-base text-muted-foreground">
          IR-2 – Unmarried Child of U.S. Citizen
        </p>
        <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
          Coming Soon
        </span>
      </div>
    </div>

    {error && (
      <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-lg text-destructive">
        <div className="flex items-start">
          <svg
            className="h-5 w-5 text-destructive mt-0.5 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    )}

    <div className="flex flex-row justify-between gap-2 sm:gap-4 pt-6">
      <Button
        onClick={onBack}
        suppressHydrationWarning
        variant="outline"
        className="bg-white hover:bg-slate-50 text-secondary-foreground border-input py-6 text-lg"
      >
        ← Back
      </Button>

      <Button
        onClick={onNext}
        suppressHydrationWarning
        className="bg-teal-600 hover:bg-teal-700 text-white py-4 md:py-6 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={!formData.caseType || loading}
      >
        {loading ? "Creating Session..." : "Next →"}
      </Button>
    </div>
  </div>
);

export default CaseTypeStep;
