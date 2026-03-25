"use client";

import { Button } from "@/components/ui/button";
import type { CaseTypeStepProps } from "./types";

export function CaseTypeStep({
  formData,
  error,
  onCaseTypeChange,
  onNext,
  onBack,
}: CaseTypeStepProps) {
  return (
    <div className="space-y-8 mx-2">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          Select Case Type
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Please select the type of visa case you want to prepare for interview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ACTIVE: SPOUSE */}
        <button
          type="button"
          className={`p-8 border-2 rounded-xl text-center transition-all cursor-pointer ${
            formData.caseType === "Spouse"
              ? "border-teal-600 bg-teal-50/20 ring-2 ring-teal-200"
              : "border-border hover:border-teal-400 hover:bg-muted"
          }`}
          onClick={() => {
            onCaseTypeChange("Spouse");
            window.scrollBy({
              top: window.innerHeight,
              left: 0,
              behavior: "smooth",
            });
          }}
        >
          <div className="mx-auto bg-teal-100 text-teal-800 w-16 h-16 rounded-full flex items-center justify-center mb-4">
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
          <h3 className="font-bold text-xl mb-2 text-foreground">Spouse Visa</h3>
          <p className="text-base text-muted-foreground">
            IR-1 / CR-1 – Spouse of U.S. Citizen
          </p>
        </button>

        {/* COMING SOON: PARENT */}
        <div className="p-8 border-2 rounded-xl text-center bg-muted/20 border-border opacity-70">
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

        {/* COMING SOON: CHILD */}
        <div className="p-8 border-2 rounded-xl text-center bg-slate-50 border-slate-200 opacity-70">
          <div className="mx-auto bg-slate-200 text-slate-500 w-16 h-16 rounded-full flex items-center justify-center mb-4">
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
          <h3 className="font-bold text-xl mb-2 text-slate-500">Child Visa</h3>
          <p className="text-base text-slate-500">
            IR-2 – Unmarried Child of U.S. Citizen
          </p>
          <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-600">
            Coming Soon
          </span>
        </div>

        {/* COMING SOON: FAMILY */}
        <div className="p-8 border-2 rounded-xl text-center bg-slate-50 border-slate-200 opacity-70">
          <div className="mx-auto bg-slate-200 text-slate-500 w-16 h-16 rounded-full flex items-center justify-center mb-4">
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
          <h3 className="font-bold text-xl mb-2 text-slate-500">Family Visa</h3>
          <p className="text-base text-slate-500">
            F1 / F2A / F2B / F3 / F4 – Family Preference Visas
          </p>
          <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-600">
            Coming Soon
          </span>
        </div>

        {/* COMING SOON: K1 */}
        <div className="p-8 border-2 rounded-xl text-center bg-slate-50 border-slate-200 opacity-70">
          <div className="mx-auto bg-slate-200 text-slate-500 w-16 h-16 rounded-full flex items-center justify-center mb-4">
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
          <h3 className="font-bold text-xl mb-2 text-slate-500">K1 Visa</h3>
          <p className="text-base text-slate-500">K1 – Fiance(e) of US Citizen</p>
          <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-600">
            Coming Soon
          </span>
        </div>

        {/* COMING SOON: B1/B2 */}
        <div className="p-8 border-2 rounded-xl text-center bg-slate-50 border-slate-200 opacity-70">
          <div className="mx-auto bg-slate-200 text-slate-500 w-16 h-16 rounded-full flex items-center justify-center mb-4">
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
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="font-bold text-xl mb-2 text-slate-500">B1/B2 Visa</h3>
          <p className="text-base text-slate-500">B1 / B2 – Visitor Visa</p>
          <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-600">
            Coming Soon
          </span>
        </div>
      </div>

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

      <div className="flex flex-row justify-between gap-4 pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="bg-muted hover:bg-muted/80 text-muted-foreground border-border px-6 py-3 text-base"
        >
          ← Back
        </Button>

        <Button
          onClick={onNext}
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 text-base"
          disabled={!formData.caseType}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
