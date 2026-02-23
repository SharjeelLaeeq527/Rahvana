import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import guideData from "@/data/nikah-nama-guide-data.json";

interface LocationStepProps {
  province: string | null;
  district: string | null;
  city: string | null;
  onProvinceChange: (val: string) => void;
  onDistrictChange: (val: string) => void;
  onCityChange: (val: string) => void;
}

const LocationStep = ({
  province,
  district,
  city,
  onProvinceChange,
  onDistrictChange,
  onCityChange,
}: LocationStepProps) => {
  const locData = guideData.wizard.location;
  const selectedProvince = locData.provinces.find((p: any) => p.name === province);
  const districts = selectedProvince?.districts || [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-[1.75rem] font-extrabold text-slate-900 mb-2 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
        {locData.title}
      </h2>

      <p className="text-[0.95rem] text-slate-500 mb-8 leading-normal font-['Plus_Jakarta_Sans',system-ui]">
        {locData.description}
      </p>

      <div className="flex flex-col gap-6 max-w-135">
        {/* Province */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 font-['Plus_Jakarta_Sans',system-ui]">
            Province / Territory <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <select
              value={province || ""}
              onChange={(e) => {
                onProvinceChange(e.target.value);
                onDistrictChange("");
                onCityChange("");
              }}
              className="w-full px-4 py-3 text-[0.9/rem] border border-slate-200 rounded-[10px] bg-white text-slate-900 appearance-none cursor-pointer outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all font-medium font-['Plus_Jakarta_Sans',system-ui]"
            >
              <option value="">Select Province</option>
              {locData.provinces.map((p: any) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>

            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 font-['Plus_Jakarta_Sans',system-ui]">
            District <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <select
              value={district || ""}
              onChange={(e) => {
                onDistrictChange(e.target.value);
                onCityChange("");
              }}
              disabled={!province}
              className={`w-full px-4 py-3 text-[0.9/rem] border border-slate-200 rounded-[10px] bg-white text-slate-900 appearance-none cursor-pointer outline-none focus:border-teal-500 transition-all font-medium font-['Plus_Jakarta_Sans',system-ui] ${
                !province ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <option value="">
                {province ? "Select District" : "Select Province First"}
              </option>
              {districts.map((d: any) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 font-['Plus_Jakarta_Sans',system-ui]">
            City / Area <span className="text-red-500">*</span>
          </label>

          <input
            type="text"
            placeholder={
              district ? "Enter your city or area" : "Select District First"
            }
            value={city || ""}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={!district}
            className={`w-full px-4 py-3 text-[0.9rem] border border-slate-200 rounded-[10px] bg-white text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all font-medium font-['Plus_Jakarta_Sans',system-ui] ${
              !district ? "opacity-60 cursor-not-allowed" : ""
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default LocationStep;
