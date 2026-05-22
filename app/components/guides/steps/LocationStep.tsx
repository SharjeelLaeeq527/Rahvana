"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Province {
  name: string;
  districts: string[];
}

interface LocationData {
  title: string;
  description: string;
  country: string;
  country_note: string;
  location_note: string;
  provinces: Province[];
}

interface LocationStepProps {
  province: string | null;
  district: string | null;
  city: string | null;
  onProvinceChange: (val: string) => void;
  onDistrictChange: (val: string) => void;
  onCityChange: (val: string) => void;
  data?: LocationData;
}

const LocationStep = ({
  province,
  district,
  city,
  onProvinceChange,
  onDistrictChange,
  onCityChange,
  data,
}: LocationStepProps) => {
  const title = data?.title || "Location Information";
  const description = data?.description || "";
  const country = data?.country || "Pakistan";
  const countryNote = data?.country_note || "";
  const locationNote = data?.location_note || "";
  const provinces = data?.provinces || [];
  const selectedProvince = provinces.find((p) => p.name === province);
  const districts = selectedProvince?.districts || [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-[1.75rem] font-extrabold text-[hsl(220_20%_10%)] mb-2 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
        {title}
      </h2>

      <p className="text-[0.95rem] text-[hsl(215_16%_47%)] mb-8">{description}</p>

      <div className="flex flex-col gap-6 max-w-135">
        {/* Country */}
        <div>
          <label className="block text-sm font-semibold text-[hsl(220_20%_20%)] mb-1.5">
            Country
          </label>

          <input
            type="text"
            readOnly
            value={country}
            className="w-full px-4 py-3 text-[0.9rem] border border-[hsl(214_32%_91%)] rounded-[10px] bg-[hsl(210_20%_98%)] text-[hsl(215_16%_47%)] cursor-default"
          />

          <p className="text-[0.78rem] text-[hsl(168_80%_30%)] mt-1.5">{countryNote}</p>
        </div>

        {/* Province */}
        <div>
          <label className="block text-sm font-semibold text-[hsl(220_20%_20%)] mb-1.5">
            Province / Territory <span className="text-[hsl(0_84%_60%)]">*</span>
          </label>

          <Select
            value={province || ""}
            onValueChange={(val) => {
              onProvinceChange(val);
              onDistrictChange("");
              onCityChange("");
            }}
          >
            <SelectTrigger className="w-full px-4 py-3 text-[0.9rem] rounded-[10px] border border-[hsl(214_32%_91%)] bg-white text-[hsl(220_20%_10%)] cursor-pointer focus:outline-none">
              <SelectValue placeholder="Select Province" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((p) => (
                <SelectItem key={p.name} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-semibold text-[hsl(220_20%_20%)] mb-1.5">
            City / Area <span className="text-[hsl(0_84%_60%)]">*</span>
          </label>

          <input
            type="text"
            placeholder={province ? "Enter your City / Area" : "Select Province First"}
            value={city || ""}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={!province}
            className={`w-full px-4 py-3 text-[0.9rem] border border-[hsl(214_32%_91%)] rounded-[10px] bg-white text-[hsl(220_20%_10%)] focus:outline-none ${
              !province ? "opacity-60 cursor-not-allowed" : "cursor-text"
            }`}
          />
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-semibold text-[hsl(220_20%_20%)] mb-1.5">
            District <span className="text-[hsl(0_84%_60%)]">*</span>
          </label>

          <Select
            value={district || ""}
            onValueChange={(val) => onDistrictChange(val)}
            disabled={!city}
          >
            <SelectTrigger
              className={`w-full px-4 py-3 text-[0.9rem] rounded-[10px] border border-[hsl(214_32%_91%)] bg-white text-[hsl(220_20%_10%)] cursor-pointer focus:outline-none ${
                !city ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <SelectValue placeholder={city ? "Select District" : "Enter City First"} />
            </SelectTrigger>

            <SelectContent>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Info Card */}
        <div className="p-4 rounded-xl bg-[hsl(168_60%_96%)] border border-[hsl(168_50%_88%)] flex gap-3 items-start">
          <Info className="w-4.5 h-4.5 text-[hsl(168_80%_30%)] shrink-0 mt-0.5" />
          <p className="text-[0.83rem] leading-[1.6] text-[hsl(168_60%_20%)]">{locationNote}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default LocationStep;
