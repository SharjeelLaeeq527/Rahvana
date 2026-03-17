"use client";

import { Button } from "@/components/ui/button";
import type { ReviewStepProps } from "./types";

export function ReviewStep({
  formData,
  error,
  loading,
  onSubmit,
  onBack,
}: ReviewStepProps) {
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
        <h2 className="text-3xl font-bold text-foreground mb-3">
          Review Your Information
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Please review all the information you&apos;ve entered before
          submitting for interview preparation.
        </p>
      </div>

      <div className="space-y-6">
        {/* Case Type Section */}
        <div className="bg-muted/20 rounded-xl p-6 border border-border">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            Case Type
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Selected Type</p>
              <p className="font-medium capitalize">{formData.caseType}</p>
            </div>
          </div>
        </div>

        {/* Basic Case Information Section */}
        {(formData["beneficiary_country"] ||
          formData["age_range"] ||
          formData["highest_education"] ||
          formData["marriage_date"] ||
          formData["months_since_marriage"] ||
          formData["marriage_location"] ||
          formData["previous_marriages"]) && (
          <div className="bg-muted/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-teal-600"
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
              Basic Case Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {formData["beneficiary_country"] && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Beneficiary Country
                  </p>
                  <p className="font-medium">
                    {formData["beneficiary_country"]}
                  </p>
                </div>
              )}
              {formData["age_range"] && (
                <div>
                  <p className="text-sm text-slate-600">Age Range</p>
                  <p className="font-medium">{formData["age_range"]}</p>
                </div>
              )}
              {formData["highest_education"] && (
                <div>
                  <p className="text-sm text-slate-600">Highest Education</p>
                  <p className="font-medium">{formData["highest_education"]}</p>
                </div>
              )}
              {formData["marriage_date"] && (
                <div>
                  <p className="text-sm text-slate-600">Marriage Date</p>
                  <p className="font-medium">
                    {formatDate(formData["marriage_date"])}
                  </p>
                </div>
              )}
              {formData["months_since_marriage"] && (
                <div>
                  <p className="text-sm text-slate-600">
                    Months Since Marriage
                  </p>
                  <p className="font-medium">
                    {formData["months_since_marriage"]}
                  </p>
                </div>
              )}
              {formData["marriage_location"] && (
                <div>
                  <p className="text-sm text-slate-600">Marriage Location</p>
                  <p className="font-medium">{formData["marriage_location"]}</p>
                </div>
              )}
              {formData["previous_marriages"] && (
                <div>
                  <p className="text-sm text-slate-600">Previous Marriages</p>
                  <p className="font-medium">
                    {formData["previous_marriages"]}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Relationship Origin Section */}
        {(formData["relationship_origin_type"] ||
          formData["total_time_spent_together"] ||
          formData["number_of_in_person_visits"] !== undefined ||
          formData["proposal_details"] ||
          formData["courtship_duration"]) && (
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-teal-600"
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
              Relationship Origin
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {formData["relationship_origin_type"] && (
                <div>
                  <p className="text-sm text-slate-600">How Did You Meet</p>
                  <p className="font-medium">
                    {formData["relationship_origin_type"]}
                  </p>
                </div>
              )}
              {formData["total_time_spent_together"] && (
                <div>
                  <p className="text-sm text-slate-600">
                    Total Time Spent Together
                  </p>
                  <p className="font-medium">
                    {formData["total_time_spent_together"]}
                  </p>
                </div>
              )}
              {formData["number_of_in_person_visits"] !== undefined && (
                <div>
                  <p className="text-sm text-slate-600">
                    Number of In-Person Visits
                  </p>
                  <p className="font-medium">
                    {formData["number_of_in_person_visits"]}
                  </p>
                </div>
              )}
              {formData["proposal_details"] && (
                <div>
                  <p className="text-sm text-slate-600">Proposal Details</p>
                  <p className="font-medium">{formData["proposal_details"]}</p>
                </div>
              )}
              {formData["courtship_duration"] && (
                <div>
                  <p className="text-sm text-slate-600">Courtship Duration</p>
                  <p className="font-medium">
                    {formData["courtship_duration"]}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Married Life & Daily Interaction Section */}
        {(formData["current_living_arrangement"] ||
          formData["spouse_address"] ||
          formData["communication_frequency"] ||
          formData["daily_communication"] ||
          formData["shared_activities"] ||
          formData["important_dates_knowledge"] !== undefined) && (
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-teal-600"
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
              Married Life & Daily Interaction
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {formData["current_living_arrangement"] && (
                <div>
                  <p className="text-sm text-slate-600">
                    Current Living Arrangement
                  </p>
                  <p className="font-medium">
                    {formData["current_living_arrangement"]}
                  </p>
                </div>
              )}
              {formData["spouse_address"] && (
                <div>
                  <p className="text-sm text-slate-600">Spouse Address</p>
                  <p className="font-medium">{formData["spouse_address"]}</p>
                </div>
              )}
              {formData["communication_frequency"] && (
                <div>
                  <p className="text-sm text-slate-600">
                    Communication Frequency
                  </p>
                  <p className="font-medium">
                    {formData["communication_frequency"]}
                  </p>
                </div>
              )}
              {formData["daily_communication"] && (
                <div>
                  <p className="text-sm text-slate-600">Daily Communication</p>
                  <p className="font-medium">
                    {formData["daily_communication"]}
                  </p>
                </div>
              )}
              {formData["shared_activities"] && (
                <div>
                  <p className="text-sm text-slate-600">Shared Activities</p>
                  <p className="font-medium">{formData["shared_activities"]}</p>
                </div>
              )}
              {formData["important_dates_knowledge"] !== undefined && (
                <div>
                  <p className="text-sm text-slate-600">
                    Important Dates Knowledge
                  </p>
                  <p className="font-medium">
                    {formatBoolean(formData["important_dates_knowledge"])}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Family & Social Knowledge Section */}
        {(formData["met_spouse_family"] !== undefined ||
          formData["family_reaction_to_marriage"] ||
          formData["wedding_attendees"] ||
          formData["marriage_type"] ||
          formData["mutual_friends"] !== undefined) && (
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
              Family & Social Knowledge
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {formData["met_spouse_family"] !== undefined && (
                <div>
                  <p className="text-sm text-slate-600">Met Spouse Family</p>
                  <p className="font-medium">
                    {formatBoolean(formData["met_spouse_family"])}
                  </p>
                </div>
              )}
              {formData["family_reaction_to_marriage"] && (
                <div>
                  <p className="text-sm text-slate-600">
                    Family Reaction to Marriage
                  </p>
                  <p className="font-medium">
                    {formData["family_reaction_to_marriage"]}
                  </p>
                </div>
              )}
              {formData["wedding_attendees"] && (
                <div>
                  <p className="text-sm text-slate-600">Wedding Attendees</p>
                  <p className="font-medium">{formData["wedding_attendees"]}</p>
                </div>
              )}
              {formData["marriage_type"] && (
                <div>
                  <p className="text-sm text-slate-600">Marriage Type</p>
                  <p className="font-medium">{formData["marriage_type"]}</p>
                </div>
              )}
              {formData["mutual_friends"] !== undefined && (
                <div>
                  <p className="text-sm text-slate-600">Mutual Friends</p>
                  <p className="font-medium">
                    {formatBoolean(formData["mutual_friends"])}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Travel & Background History Section */}
        {(formData["military_or_defense_background"] !== undefined ||
          formData["previous_us_visits"] !== undefined ||
          formData["previous_visa_refusal"] !== undefined ||
          formData["visa_overstay_history"] !== undefined ||
          formData["criminal_history"] !== undefined) && (
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                ></path>
              </svg>
              Travel & Background History
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {formData["military_or_defense_background"] !== undefined && (
                <div>
                  <p className="text-sm text-slate-600">
                    Military/Defense Background
                  </p>
                  <p className="font-medium">
                    {formatBoolean(formData["military_or_defense_background"])}
                  </p>
                </div>
              )}
              {formData["previous_us_visits"] !== undefined && (
                <div>
                  <p className="text-sm text-slate-600">Previous US Visits</p>
                  <p className="font-medium">
                    {formatBoolean(formData["previous_us_visits"])}
                  </p>
                </div>
              )}
              {formData["previous_visa_refusal"] !== undefined && (
                <div>
                  <p className="text-sm text-slate-600">
                    Previous Visa Refusal
                  </p>
                  <p className="font-medium">
                    {formatBoolean(formData["previous_visa_refusal"])}
                  </p>
                </div>
              )}
              {formData["visa_overstay_history"] !== undefined && (
                <div>
                  <p className="text-sm text-slate-600">
                    Visa Overstay History
                  </p>
                  <p className="font-medium">
                    {formatBoolean(formData["visa_overstay_history"])}
                  </p>
                </div>
              )}
              {formData["criminal_history"] !== undefined && (
                <div>
                  <p className="text-sm text-slate-600">Criminal History</p>
                  <p className="font-medium">
                    {formatBoolean(formData["criminal_history"])}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Background & Future Plans Section */}
        {(formData["beneficiary_employment"] ||
          formData["sponsor_employment"] ||
          formData["english_proficiency"] ||
          formData["intended_us_state"] ||
          formData["living_arrangements_in_us"] ||
          formData["future_plans"]) && (
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-teal-600"
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
              Background & Future Plans
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {formData["beneficiary_employment"] && (
                <div>
                  <p className="text-sm text-slate-600">
                    Beneficiary Employment
                  </p>
                  <p className="font-medium">
                    {formData["beneficiary_employment"]}
                  </p>
                </div>
              )}
              {formData["sponsor_employment"] && (
                <div>
                  <p className="text-sm text-slate-600">Sponsor Employment</p>
                  <p className="font-medium">
                    {formData["sponsor_employment"]}
                  </p>
                </div>
              )}
              {formData["english_proficiency"] && (
                <div>
                  <p className="text-sm text-slate-600">English Proficiency</p>
                  <p className="font-medium">
                    {formData["english_proficiency"]}
                  </p>
                </div>
              )}
              {formData["intended_us_state"] && (
                <div>
                  <p className="text-sm text-slate-600">Intended US State</p>
                  <p className="font-medium">{formData["intended_us_state"]}</p>
                </div>
              )}
              {formData["living_arrangements_in_us"] && (
                <div>
                  <p className="text-sm text-slate-600">
                    Living Arrangements in US
                  </p>
                  <p className="font-medium">
                    {formData["living_arrangements_in_us"]}
                  </p>
                </div>
              )}
              {formData["future_plans"] && (
                <div>
                  <p className="text-sm text-slate-600">Future Plans</p>
                  <p className="font-medium">{formData["future_plans"]}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Petitioner Information Section */}
        {(formData["petitioner_status"] ||
          formData["petitioner_income_level"] ||
          formData["household_size"]) && (
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-teal-600"
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
              Petitioner Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {formData["petitioner_status"] && (
                <div>
                  <p className="text-sm text-slate-600">Petitioner Status</p>
                  <p className="font-medium">{formData["petitioner_status"]}</p>
                </div>
              )}
              {formData["petitioner_income_level"] && (
                <div>
                  <p className="text-sm text-slate-600">
                    Petitioner Income Level
                  </p>
                  <p className="font-medium">
                    {formData["petitioner_income_level"]}
                  </p>
                </div>
              )}
              {formData["household_size"] && (
                <div>
                  <p className="text-sm text-slate-600">Household Size</p>
                  <p className="font-medium">{formData["household_size"]}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finances & Household Management Section */}
        {(formData["joint_finances"] !== undefined ||
          formData["financial_arrangement_description"]) && (
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-teal-600"
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
              Finances & Household Management
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {formData["joint_finances"] !== undefined && (
                <div>
                  <p className="text-sm text-slate-600">Joint Finances</p>
                  <p className="font-medium">
                    {formatBoolean(formData["joint_finances"])}
                  </p>
                </div>
              )}
              {formData["financial_arrangement_description"] && (
                <div>
                  <p className="text-sm text-slate-600">
                    Financial Arrangement Description
                  </p>
                  <p className="font-medium">
                    {formData["financial_arrangement_description"]}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-red-500 mt-0.5 mr-3"
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

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 px-6 py-3 text-base"
          >
            ← Back
          </Button>
          <Button
            onClick={onSubmit}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 px-6 py-3 text-base disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Generate Interview Prep"}
          </Button>
        </div>
      </div>
    </div>
  );
}
