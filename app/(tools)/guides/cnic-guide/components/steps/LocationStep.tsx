"use client";

import React, { useState, useEffect } from "react";
import { useCnicWizard } from "../../CnicContext";
import { MapPin } from "lucide-react";

interface District {
  id: string;
  name: string;
  cities: string[];
}

interface Province {
  id: string;
  name: string;
  districts: District[];
}

// Assuming locations.json is available at this path as per the old code
import locationsData from "../../data/locations.json";

export default function LocationStep() {
  const { state, setLocation, setCurrentStep, completeStep } = useCnicWizard();

  const [selectedProvince, setSelectedProvince] = useState(
    state.location?.province || "",
  );
  const [selectedDistrict, setSelectedDistrict] = useState(
    state.location?.district || "",
  );
  const [selectedCity, setSelectedCity] = useState(state.location?.city || "");

  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    if (selectedProvince) {
      const province = locationsData.provinces.find(
        (p: Province) => p.id === selectedProvince,
      );
      setAvailableDistricts(province?.districts || []);

      // Only reset if the province changed and it's not the initial load matching state
      if (state.location?.province !== selectedProvince) {
        setSelectedDistrict("");
        setSelectedCity("");
      }
    }
  }, [selectedProvince, state.location?.province]);

  useEffect(() => {
    if (selectedDistrict) {
      const province = locationsData.provinces.find(
        (p: Province) => p.id === selectedProvince,
      );
      const district = province?.districts.find(
        (d: District) => d.id === selectedDistrict,
      );
      setAvailableCities(district?.cities || []);

      if (state.location?.district !== selectedDistrict) {
        setSelectedCity("");
      }
    }
  }, [selectedDistrict, selectedProvince, state.location?.district]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation({
      province: selectedProvince,
      district: selectedDistrict,
      city: selectedCity,
    });
    completeStep(2);
    setCurrentStep(3);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const isFormValid = selectedProvince && selectedDistrict && selectedCity;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center mb-4 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
          Location Details
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight flex items-center gap-3">
          <MapPin className="w-8 h-8 text-primary" />
          Where do you live?
        </h2>
        <p className="text-slate-600 text-lg max-w-xl">
          Your current residential address helps determine the nearest NADRA
          centers and accurate processing jurisdictions.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white border border-slate-100 p-6 md:p-8 rounded-2xl shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Country
            </label>
            <input
              type="text"
              value="Pakistan"
              disabled
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed focus:outline-hidden"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              This wizard is specifically for Pakistan birth certificates.
            </p>
          </div>

          {/* Province */}
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Province / Territory <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50 hover:bg-white"
              required
            >
              <option value="">Select Province / Territory</option>
              {locationsData.provinces.map((province: Province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              District <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedProvince}
              required
            >
              <option value="">
                {selectedProvince ? "Select District" : "Select Province First"}
              </option>
              {availableDistricts.map((district: District) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          {/* City / Area */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              City / Area <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedDistrict}
              required
            >
              <option value="">
                {selectedDistrict
                  ? "Select City / Area"
                  : "Select District First"}
              </option>
              {availableCities.map((city: string) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mt-6">
          <p className="text-sm text-primary leading-relaxed">
            <span className="font-bold flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4" /> Why location matters:
            </span>
            For a CNIC application, your residential address dictates the
            specific NADRA center you must visit. Ensuring this matches your
            supporting documents is crucial to avoid application rejection.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
          <button
            type="button"
            onClick={handleBack}
            className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-4">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Step 2 of 5
            </div>
            <button
              type="submit"
              disabled={!isFormValid}
              className="bg-primary hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md shadow-primary/20"
            >
              Next
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
