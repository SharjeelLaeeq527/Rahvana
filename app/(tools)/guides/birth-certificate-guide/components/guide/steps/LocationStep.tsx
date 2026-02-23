import { motion } from "framer-motion";
import { ChevronDown, MapPin } from "lucide-react";
import guideData from "@/data/birth-certificate-guide-data.json";

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
  const selectedDistrictObj = districts.find((d: any) => d.name === district) as any;
  const cities = selectedDistrictObj?.cities || [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-[1.75rem] font-extrabold text-slate-900 mb-2 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
          {locData.title}
        </h2>
        <p className="text-[0.95rem] text-slate-500 leading-normal font-['Plus_Jakarta_Sans',system-ui]">
          {locData.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex flex-col gap-6">
          {/* Province */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 font-['Plus_Jakarta_Sans',system-ui]">
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
                className="w-full px-4 py-3 text-[0.9rem] border-2 border-slate-100 rounded-xl bg-white text-slate-900 appearance-none cursor-pointer outline-none focus:border-teal-500 transition-all font-medium font-['Plus_Jakarta_Sans',system-ui]"
              >
                <option value="">Select Province</option>
                {locData.provinces.map((p: any) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* District */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 font-['Plus_Jakarta_Sans',system-ui]">
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
                className={`w-full px-4 py-3 text-[0.9rem] border-2 border-slate-100 rounded-xl bg-white text-slate-900 appearance-none cursor-pointer outline-none focus:border-teal-500 transition-all font-medium font-['Plus_Jakarta_Sans',system-ui] ${
                  !province ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <option value="">
                  {province ? "Select District" : "Select Province First"}
                </option>
                {districts.map((d: any) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 font-['Plus_Jakarta_Sans',system-ui]">
              City / Area <span className="text-red-500">*</span>
            </label>

            {cities.length > 0 ? (
              <div className="relative">
                <select
                  value={city || ""}
                  onChange={(e) => onCityChange(e.target.value)}
                  disabled={!district}
                  className={`w-full px-4 py-3 text-[0.9rem] border-2 border-slate-100 rounded-xl bg-white text-slate-900 appearance-none cursor-pointer outline-none focus:border-teal-500 transition-all font-medium font-['Plus_Jakarta_Sans',system-ui] ${
                    !district ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">
                    {district ? "Select City" : "Select District First"}
                  </option>
                  {cities.map((c: string) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
              </div>
            ) : (
              <input
                type="text"
                placeholder={
                  district ? "Enter your city or area" : "Select District First"
                }
                value={city || ""}
                onChange={(e) => onCityChange(e.target.value)}
                disabled={!district}
                className={`w-full px-4 py-4 text-[0.9rem] border-2 border-slate-100 rounded-xl bg-white text-slate-900 outline-none focus:border-teal-500 transition-all font-medium font-['Plus_Jakarta_Sans',system-ui] ${
                  !district ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            )}
          </div>
        </div>

        {/* Province Specific Notes */}
        <div className="flex flex-col gap-4">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-widest font-['Plus_Jakarta_Sans',system-ui]">Regional Policies</label>
          <div className="p-6 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col gap-4">
            {selectedProvince ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-teal-600 shadow-sm">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-teal-900">{selectedProvince.name} Policy 2026</h4>
                </div>
                <p className="text-sm text-teal-800 leading-relaxed italic">
                  "{selectedProvince.note}"
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500 italic">Select a province to view specific local registration policies and fee exemptions.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LocationStep;
