"use client";

import React, { useState } from "react";
import { usePolioWizard } from "../../PolioContext";
import { MapPin, CheckCircle2, ChevronRight, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Step2() {
  const { state, setCurrentStep, completeStep } = usePolioWizard();
  const [selectedProv, setSelectedProv] = useState<string | null>(
    state.location?.province || "punjab",
  );

  const PROVINCES = ["Punjab", "Sindh", "KP", "Balochistan", "Islamabad"];

  const handleNext = () => {
    if (selectedProv) {
      completeStep(2);
      setCurrentStep(3);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
          Where to Go?
        </h2>
        <p className="text-slate-600 text-lg">
          Select your region to see where you can get vaccinated and registered
          on NIMS.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 mb-8">
        <Tabs
          defaultValue={selectedProv?.toLowerCase() || "punjab"}
          onValueChange={(val) => {
            const match = PROVINCES.find((p) => p.toLowerCase() === val);
            if (match) setSelectedProv(match);
          }}
          className="w-full"
        >
          <TabsList className="flex flex-wrap h-auto bg-slate-100 p-1.5 rounded-xl mb-8">
            {PROVINCES.map((prov) => (
              <TabsTrigger
                key={prov}
                value={prov.toLowerCase()}
                className="flex-1 min-w-fit px-4 py-2.5 rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all text-sm md:text-base"
              >
                {prov}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="bg-slate-50/50 rounded-2xl p-4 md:p-6 border border-slate-100 min-h-[200px] flex flex-col justify-center">
            <TabsContent value="punjab" className="mt-0">
              <LocationInfo
                title="Punjab"
                points={[
                  "Major Govt Hospitals (DHQ/THQ)",
                  "District Health Offices (DHO)",
                  "International Airports (Lahore, Islamabad, Multan)",
                ]}
              />
            </TabsContent>
            <TabsContent value="sindh" className="mt-0">
              <LocationInfo
                title="Sindh (Karachi)"
                points={[
                  "Govt Hospitals (Jinnah, Civil)",
                  "DHO Offices (Nazimabad, South, Korangi)",
                  "Select NADRA-linked Mega Centers",
                ]}
              />
            </TabsContent>
            <TabsContent value="kp" className="mt-0">
              <LocationInfo
                title="Khyber Pakhtunkhwa"
                points={[
                  "DHO Offices & EPI Centers",
                  "Govt Vaccination Units",
                  "Mandatory for some local docs (Birth/Marriage)",
                ]}
              />
            </TabsContent>
            <TabsContent value="balochistan" className="mt-0">
              <LocationInfo
                title="Balochistan"
                points={[
                  "DHO Offices (Quetta)",
                  "Provincial EPI Headquarters",
                  "Availability may vary - check locally",
                ]}
              />
            </TabsContent>
            <TabsContent value="islamabad" className="mt-0">
              <LocationInfo
                title="Islamabad (ICT)"
                points={[
                  "NIH (National Institute of Health)",
                  "PIMS Hospital",
                  "Polyclinic Hospital",
                ]}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="bg-amber-50 rounded-xl p-5 border border-amber-100 flex items-start gap-3 mb-8">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900 mb-1">Important Note</h4>
          <p className="text-amber-800 text-sm leading-relaxed">
            Private hospitals can give polio vaccines, but ONLY government or
            recognized EPI teams can record it in NIMS. Ensure the center you
            visit has NIMS access to record your data.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-auto">
        <button
          onClick={() => setCurrentStep(1.75)}
          className="text-slate-500 hover:text-slate-800 font-medium transition-colors px-4 py-2"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          // disabled={!selectedProv}
          className={`px-8 py-3.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
            selectedProv
              ? "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  );
}

function LocationInfo({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <MapPin className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">{title} Centers</h3>
      </div>
      <ul className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
        {points.map((p, i) => (
          <li
            key={i}
            className="flex items-start gap-3 p-4 bg-white border border-slate-100 shadow-sm rounded-xl transition-all hover:border-primary/20 hover:shadow-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <span className="text-slate-700 font-medium">{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
