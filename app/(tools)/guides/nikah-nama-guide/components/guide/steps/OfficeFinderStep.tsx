import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Search,
  Clock,
  Phone,
  MapIcon,
  Star,
} from "lucide-react";
import guideData from "@/data/nikah-nama-guide-data.json";

interface OfficeFinderStepProps {
  province: string | null;
  district: string | null;
}

const OfficeFinderStep = ({ province, district }: OfficeFinderStepProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const allOffices = guideData.wizard.offices;

  const filteredOffices = allOffices.filter((o: any) => {
    const matchesSearch =
      !searchQuery ||
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.address.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const displayOffices =
    filteredOffices.length > 0 ? filteredOffices : allOffices;

  const locationLabel =
    [district, province].filter(Boolean).join(", ") || "Pakistan";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-[1.75rem] font-extrabold text-slate-900 mb-2 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
        Find Your Union Council
      </h2>

      <p className="text-[0.95rem] text-slate-500 mb-6 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
        Based on your location: <span className="text-teal-600 font-bold">{locationLabel}</span>
      </p>


      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />

        <input
          type="text"
          placeholder="Search by UC number, area, or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-[0.8rem] pl-11 pr-4 rounded-[12px] border border-slate-200 text-[0.9rem] bg-white text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
        />
      </div>

      {/* Office Cards */}
      <div className="flex flex-col gap-4">
        {displayOffices.map((office: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-5 rounded-[14px] border border-slate-200 bg-white"
          >
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-[1.05rem] font-bold text-slate-900 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
                {office.name}
              </h4>

              <span className="px-2 py-1 rounded-md bg-teal-50 text-teal-700 text-[0.7rem] font-bold uppercase tracking-wider">
                {office.badge}
              </span>
            </div>

            <p className="text-[0.85rem] text-slate-500 mb-3">
              {office.address}
            </p>

            <div className="flex flex-wrap gap-6 text-[0.82rem] text-slate-500 mb-3">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {office.hours}
              </span>
            </div>

            <div className="px-4 py-2 rounded-lg bg-teal-50/50 text-[0.8rem] text-teal-800 mb-4 border border-teal-100/50">
              <span className="font-bold mr-1">Pro-Tip:</span> {office.tip}
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 border-teal-600 text-teal-700 text-[0.85rem] font-bold bg-white cursor-pointer hover:bg-teal-50 transition-all font-['Plus_Jakarta_Sans',system-ui]"
              >
                <MapIcon className="w-3.5 h-3.5" />
                View on Map
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white text-[0.85rem] font-bold cursor-pointer bg-teal-600 hover:bg-teal-700 shadow-sm transition-all font-['Plus_Jakarta_Sans',system-ui]"
              >
                <Star className="w-3.5 h-3.5" />
                Save Office
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default OfficeFinderStep;
