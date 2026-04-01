"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import SearchableIndexedDropdown from "@/app/(tools)/(visa)/visa-category/ir-category/components/SearchableIndexedDropdown";
import { COUNTRIES } from "@/data/countries";
import { Globe, AlertCircle } from "lucide-react";
import { ExpandableTooltip } from "../shared/ExpandableTooltip";

interface CountrySelectionModalProps {
  isOpen: boolean;
  onCountrySelected: (country: string) => void;
  isLoading?: boolean;
  noDataMessage?: string;
}

export default function CountrySelectionModal({
  isOpen,
  onCountrySelected,
  isLoading = false,
  noDataMessage,
}: CountrySelectionModalProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  if (!isOpen) return null;

  const isCountrySelected = selectedCountry.trim().length > 0;

  const handleConfirm = () => {
    if (isCountrySelected) {
      onCountrySelected(selectedCountry);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 text-primary rounded-lg p-2">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Select Your Destination Country
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose the country for which you want to prepare your visa
            interview.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          <ExpandableTooltip
            message="Visa interviews vary from country to country. Based on your
                          selection, we'll show you the relevant interview categories
                          and preparation content we've built for that country to help
                          you get ready with confidence."
            defaultOpen={false}
          />

          {/* Country Selection */}
          <div className="space-y-2">
            <SearchableIndexedDropdown
              id="destinationCountry"
              label="Destination Country"
              value={selectedCountry}
              onChange={setSelectedCountry}
              options={COUNTRIES}
              placeholder="Select your country..."
              disabledOptions={COUNTRIES.filter((c) => c !== "United States")}
            />
          </div>

          {/* No Data Message */}
          {noDataMessage && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  {noDataMessage}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-3">
          <Button
            disabled={!isCountrySelected || isLoading}
            onClick={handleConfirm}
            className="rounded-xl"
          >
            {isLoading ? "Loading..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
