import { Button } from "@/components/ui/button";
import { ReviewStepProps } from "../types";

const ReviewStep = ({
  formData,
  error,
  loading,
  onSubmit,
  onBack,
  onSaveToProfile,
}: ReviewStepProps) => {
  // Helper function to format boolean values
  const formatBoolean = (value: boolean | undefined) => {
    if (value === undefined) return "Not answered";
    return value ? "Yes" : "No";
  };

  // Helper function to format dates
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "Not provided";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-3">
          Review Your Information
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Please review all the information you&apos;ve entered before
          submitting for analysis.
        </p>
      </div>

      {/* Save to Profile Option */}
      {onSaveToProfile && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-blue-900">
              Sync with your Profile
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Save these details to your main profile to auto-fill future forms.
            </p>
          </div>
          <Button
            onClick={onSaveToProfile}
            variant="outline"
            className="bg-white hover:bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap"
          >
            Update Main Profile
          </Button>
        </div>
      )}

      <div className="space-y-8">
        {/* Case Type Section */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <div className="bg-teal-100 text-teal-800 w-10 h-10 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
            </div>
            Case Type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-base text-slate-600 mb-1">Selected Type</p>
              <p className="text-lg font-semibold capitalize">
                {formData.caseType}
              </p>
            </div>
          </div>
        </div>

        {/* Basic Profile Section */}
        {(formData.sponsor_dob ||
          formData.beneficiary_dob ||
          formData.country_of_residence ||
          formData.relationship_start_date ||
          formData.marriage_date ||
          formData.spousal_relationship_type ||
          formData.intended_us_state_of_residence) && (
          <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="bg-primary/20 text-primary w-10 h-10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  ></path>
                </svg>
              </div>
              Basic Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.sponsor_full_name && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Sponsor Name
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.sponsor_full_name}
                  </p>
                </div>
              )}
              {formData.beneficiary_full_name && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Beneficiary Name
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.beneficiary_full_name}
                  </p>
                </div>
              )}
              {formData.sponsor_dob && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Sponsor DOB
                  </p>
                  <p className="text-lg font-semibold">
                    {formatDate(formData.sponsor_dob)}
                  </p>
                </div>
              )}
              {formData.beneficiary_dob && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Beneficiary DOB
                  </p>
                  <p className="text-lg font-semibold">
                    {formatDate(formData.beneficiary_dob)}
                  </p>
                </div>
              )}
              {formData.country_of_residence && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Country of Residence
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.country_of_residence}
                  </p>
                </div>
              )}
              {formData.relationship_start_date && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Relationship Start Date
                  </p>
                  <p className="text-lg font-semibold">
                    {formatDate(formData.relationship_start_date)}
                  </p>
                </div>
              )}
              {formData.marriage_date && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Marriage Date
                  </p>
                  <p className="text-lg font-semibold">
                    {formatDate(formData.marriage_date)}
                  </p>
                </div>
              )}
              {formData.spousal_relationship_type && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Spousal Relationship Type
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.spousal_relationship_type}
                  </p>
                </div>
              )}
              {formData.i130_status && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    I-130 Petition Status
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.i130_status}
                  </p>
                </div>
              )}
              {formData.intended_us_state_of_residence && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Intended US State of Residence
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.intended_us_state_of_residence}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 bg-card rounded-xl p-6 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                <div className="bg-primary/20 text-primary w-10 h-10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    ></path>
                  </svg>
                </div>
                Education & Employment Background
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.highest_education_level && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Highest Education Level
                    </p>
                    <p className="text-lg font-semibold">
                      {formData.highest_education_level}
                    </p>
                  </div>
                )}
                {formData.highest_education_field && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Highest Education Field
                    </p>
                    <p className="text-lg font-semibold">
                      {formData.highest_education_field}
                    </p>
                  </div>
                )}
                {formData.current_occupation_role && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Current Occupation Role
                    </p>
                    <p className="text-lg font-semibold">
                      {formData.current_occupation_role}
                    </p>
                  </div>
                )}
                {formData.industry_sector && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Industry Sector
                    </p>
                    <p className="text-lg font-semibold">
                      {formData.industry_sector}
                    </p>
                  </div>
                )}
                {formData.prior_military_service !== undefined && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Prior Military Service
                    </p>
                    <p className="text-lg font-semibold">
                      {formatBoolean(formData.prior_military_service)}
                    </p>
                  </div>
                )}
                {formData.specialized_weapons_training !== undefined && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Specialized Weapons Training
                    </p>
                    <p className="text-lg font-semibold">
                      {formatBoolean(formData.specialized_weapons_training)}
                    </p>
                  </div>
                )}
                {formData.unofficial_armed_groups !== undefined && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Unofficial Armed Groups
                    </p>
                    <p className="text-lg font-semibold">
                      {formatBoolean(formData.unofficial_armed_groups)}
                    </p>
                  </div>
                )}
                {formData.employer_type && (
                  <div>
                    <p className="text-base text-muted-foreground mb-1">
                      Employer Type
                    </p>
                    <p className="text-lg font-semibold">
                      {formData.employer_type}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Relationship Strength Section */}
        {(formData.how_did_you_meet ||
          formData.number_of_in_person_visits !== undefined ||
          formData.cohabitation_proof !== undefined ||
          formData.shared_financial_accounts !== undefined ||
          formData.wedding_photos_available !== undefined ||
          formData.communication_logs !== undefined ||
          formData.money_transfer_receipts_available !== undefined ||
          formData.driving_license_copy_available !== undefined ||
          formData.children_together !== undefined) && (
          <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="bg-primary/20 text-primary w-10 h-10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  ></path>
                </svg>
              </div>
              Relationship Strength
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.how_did_you_meet && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    How Did You Meet
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.how_did_you_meet}
                  </p>
                </div>
              )}
              {formData.number_of_in_person_visits !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Number of In-Person Visits
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.number_of_in_person_visits}
                  </p>
                </div>
              )}
              {formData.cohabitation_proof !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Cohabitation Proof
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.cohabitation_proof)}
                  </p>
                </div>
              )}
              {formData.shared_financial_accounts !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Shared Financial Accounts
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.shared_financial_accounts)}
                  </p>
                </div>
              )}
              {formData.wedding_photos_available !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Wedding Photos Available
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.wedding_photos_available)}
                  </p>
                </div>
              )}
              {formData.communication_logs !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Communication Logs
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.communication_logs)}
                  </p>
                </div>
              )}
              {formData.money_transfer_receipts_available !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Money Transfer Receipts Available
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.money_transfer_receipts_available)}
                  </p>
                </div>
              )}
              {formData.driving_license_copy_available !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Driving License Copy Available
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.driving_license_copy_available)}
                  </p>
                </div>
              )}
              {formData.children_together !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Children Together
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.children_together)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Immigration History Section */}
        {(formData.previous_visa_applications !== undefined ||
          formData.previous_visa_denial !== undefined ||
          formData.overstay_or_violation !== undefined ||
          formData.criminal_record !== undefined ||
          formData.prior_marriages_exist !== undefined) && (
          <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="bg-primary/20 text-primary w-10 h-10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9"
                  ></path>
                </svg>
              </div>
              Immigration History
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.previous_visa_applications !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Previous Visa Applications
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.previous_visa_applications)}
                  </p>
                </div>
              )}
              {formData.previous_visa_denial !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Previous Visa Denial
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.previous_visa_denial)}
                  </p>
                </div>
              )}
              {formData.overstay_or_violation !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Overstay or Violation
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.overstay_or_violation)}
                  </p>
                </div>
              )}
              {formData.criminal_record !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Criminal Record
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.criminal_record)}
                  </p>
                </div>
              )}
              {formData.prior_marriages_exist !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Prior Marriages Exist
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.prior_marriages_exist)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Financial Profile Section */}
        {(formData.sponsor_annual_income ||
          formData.household_size ||
          formData.has_tax_returns !== undefined ||
          formData.has_employment_letter !== undefined ||
          formData.has_paystubs !== undefined ||
          formData.joint_sponsor_available !== undefined ||
          formData.i864_affidavit_submitted !== undefined ||
          formData.i864_supporting_financial_documents !== undefined) && (
          <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="bg-primary/20 text-primary w-10 h-10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              Financial Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.sponsor_annual_income && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Sponsor Annual Income
                  </p>
                  <p className="text-lg font-semibold">
                    ${formData.sponsor_annual_income?.toLocaleString()}
                  </p>
                </div>
              )}
              {formData.household_size && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Household Size
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.household_size}
                  </p>
                </div>
              )}
              {formData.has_tax_returns !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Has Tax Returns
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.has_tax_returns)}
                  </p>
                </div>
              )}
              {formData.has_employment_letter !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Has Employment Letter
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.has_employment_letter)}
                  </p>
                </div>
              )}
              {formData.has_paystubs !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Has Paystubs
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.has_paystubs)}
                  </p>
                </div>
              )}
              {formData.joint_sponsor_available !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Joint Sponsor Available
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.joint_sponsor_available)}
                  </p>
                </div>
              )}
              {formData.i864_affidavit_submitted !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    I-864 Affidavit Submitted
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.i864_affidavit_submitted)}
                  </p>
                </div>
              )}
              {formData.i864_supporting_financial_documents !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    I-864 Supporting Financial Documents
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(
                      formData.i864_supporting_financial_documents,
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Core Identity Documents Section */}
        {(formData.urdu_marriage_certificate !== undefined ||
          formData.english_translation_certificate !== undefined ||
          formData.nadra_marriage_registration_cert !== undefined ||
          formData.family_registration_certificate !== undefined ||
          formData.birth_certificates !== undefined ||
          formData.prior_marriages_exist !== undefined ||
          formData.prior_marriage_termination_docs !== undefined) && (
          <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="bg-primary/20 text-primary w-10 h-10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
              </div>
              Core Identity Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.urdu_marriage_certificate !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Urdu Marriage Certificate
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.urdu_marriage_certificate)}
                  </p>
                </div>
              )}
              {formData.english_translation_certificate !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    English Translation Certificate
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.english_translation_certificate)}
                  </p>
                </div>
              )}
              {formData.nadra_marriage_registration_cert !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    NADRA Marriage Certificate
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.nadra_marriage_registration_cert)}
                  </p>
                </div>
              )}
              {formData.family_registration_certificate !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Family Registration Certificate
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.family_registration_certificate)}
                  </p>
                </div>
              )}
              {formData.birth_certificates !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Birth Certificates
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.birth_certificates)}
                  </p>
                </div>
              )}
              {formData.prior_marriage_termination_docs !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Prior Marriage Termination Docs
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.prior_marriage_termination_docs)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Passport & Police Documents Section */}
        {(formData.passports_available !== undefined ||
          formData.passport_copy_available !== undefined ||
          formData.valid_police_clearance_certificate !== undefined) && (
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <div className="bg-teal-100 text-teal-800 w-10 h-10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
              </div>
              Passport & Police Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.passports_available !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Passports Available
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.passports_available)}
                  </p>
                </div>
              )}
              {formData.passport_copy_available !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Passport Copy Available
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.passport_copy_available)}
                  </p>
                </div>
              )}
              {formData.valid_police_clearance_certificate !== undefined && (
                <div>
                  <p className="text-base text-slate-600 mb-1">
                    Valid Police Clearance Certificate
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.valid_police_clearance_certificate)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interview & Medical Documents Section */}
        {(formData.ds260_confirmation !== undefined ||
          formData.interview_letter !== undefined ||
          formData.courier_registration !== undefined ||
          formData.medical_report_available !== undefined ||
          formData.polio_vaccination_certificate !== undefined ||
          formData.passport_photos_2x2 !== undefined) && (
          <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="bg-primary/20 text-primary w-10 h-10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  ></path>
                </svg>
              </div>
              Interview & Medical Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.ds260_confirmation !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    DS-260 Confirmation
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.ds260_confirmation)}
                  </p>
                </div>
              )}
              {formData.interview_letter !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Interview Letter
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.interview_letter)}
                  </p>
                </div>
              )}
              {formData.courier_registration !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Courier Registration
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.courier_registration)}
                  </p>
                </div>
              )}
              {formData.medical_report_available !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Medical Report Available
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.medical_report_available)}
                  </p>
                </div>
              )}
              {formData.polio_vaccination_certificate !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Polio Vaccination Certificate
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.polio_vaccination_certificate)}
                  </p>
                </div>
              )}

              {formData.passport_photos_2x2 !== undefined && (
                <div>
                  <p className="text-base text-muted-foreground mb-1">
                    Passport Photos (2x2)
                  </p>
                  <p className="text-lg font-semibold">
                    {formatBoolean(formData.passport_photos_2x2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

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
            variant="outline"
            className="bg-white hover:bg-slate-50 text-secondary-foreground border-input py-6 text-lg"
          >
            ← Previous
          </Button>
          <div className="flex flex-row gap-3">
            <Button
              onClick={onSubmit}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground py-4 md:py-6 text-lg"
            >
              {loading ? "Submitting..." : "Submit for Analysis →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
