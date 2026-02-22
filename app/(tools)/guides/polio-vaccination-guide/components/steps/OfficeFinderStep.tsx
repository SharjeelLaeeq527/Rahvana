"use client";

import React, { useState } from "react";
import { usePolioWizard } from "../../PolioContext";
import {
  AlertTriangle,
  Search,
  Clock,
  Phone,
  MapIcon,
  Star,
  Activity,
  X,
} from "lucide-react";

// Assuming offices.json is available at this path for polio offices
import guideData from "../../data/offices.json";

interface OfficeFinderStepProps {
  onClose?: () => void;
}

interface Office {
  id: string;
  name: string;
  city: string;
  district: string;
  province: string;
  address: string;
  phone: string;
  hours: string;
  mapLink: string;
  services: string[];
  nadraConnected: boolean;
  notes: string;
}

export default function OfficeFinderStep({
  onClose,
}: OfficeFinderStepProps = {}) {
  const { state } = usePolioWizard();
  const [searchQuery, setSearchQuery] = useState("");

  const { province, district } = state.location || {};

  const allOffices = guideData.offices;

  const filteredOffices = allOffices.filter((o: Office) => {
    const matchesLocation =
      (!province || o.province === province) &&
      (!district || o.district === district);

    const matchesSearch =
      !searchQuery ||
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.address.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesLocation && matchesSearch;
  });

  const displayOffices = filteredOffices;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary shrink-0" />
            Nearest Vaccination Centers
          </h2>
          <p className="text-slate-600 text-lg max-w-xl">
            Based on your location:{" "}
            <span className="font-semibold text-slate-700 capitalize">
              {district ? district : "All Details"}
              {province ? `, ${province}` : ""}
            </span>
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Warning Box */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start mb-6">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-900 mb-1">
            Important: Ensure NIMS Data Entry
          </p>
          <p className="text-sm text-amber-800/80 leading-relaxed">
            Ensure that the vaccination center you plan to visit offers NIMS
            registration, as you will need this for the online certificate.
            Listings and contact info may change; always confirm details before
            visiting.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by center name, address, or area..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-3.5 pl-12 pr-4 rounded-xl border border-slate-200 text-slate-700 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
        />
      </div>

      {/* Office Cards */}
      <div className="flex flex-col gap-4 mb-8">
        {displayOffices.length > 0 ? (
          displayOffices.map((office: Office, i: number) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg font-bold text-slate-900">
                      {office.name}
                    </h4>
                    {office.nadraConnected && (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-semibold whitespace-nowrap">
                        NIMS Connected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{office.address}</p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <a
                    href={office.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-primary hover:border-primary/50 text-sm font-medium transition-colors"
                  >
                    <MapIcon className="w-4 h-4" />
                    Map
                  </a>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-sm font-medium transition-colors">
                    <Star className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {office.hours}
                </span>
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {office.phone}
                </span>
              </div>

              {office.notes && (
                <div className="px-4 py-2.5 rounded-xl bg-blue-50 text-sm text-blue-800 border border-blue-100 flex items-start gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {/* <span className="mt-0.5">ℹ️</span> */}
                  <span>{office.notes}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">
              No centers found
            </h3>
            <p className="text-slate-500">
              Try adjusting your search criteria or checking nearby districts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
