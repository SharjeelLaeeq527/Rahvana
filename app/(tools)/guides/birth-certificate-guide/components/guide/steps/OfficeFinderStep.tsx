import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Building2, Clock, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfficeFinderStepProps {
  location: { province: string | null; district: string | null };
  savedOffice: any;
  onSave: (office: any) => void;
}

const OfficeFinderStep = ({ location, savedOffice, onSave }: OfficeFinderStepProps) => {
  const [search, setSearch] = useState("");
  
  // Sample data simulating UC offices for the selected district
  const sampleOffice = {
    id: "uc-office-1",
    name: `Union Council Office (${location.district || 'Local'})`,
    address: `Your local UC office based on ${location.district || 'selected'} venue`,
    timings: "Mon-Fri: 9:00 AM - 4:00 PM",
    proTip: "Visit between 10 AM and 1 PM for Secretary's availability.",
    isMandatory: true
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="mb-8">
        <h2 className="text-[2rem] font-black text-[#0f172a] mb-2 font-['Plus_Jakarta_Sans',system-ui]">
          Find Your Union Council
        </h2>
        <p className="text-[1rem] text-slate-500 font-medium font-['Plus_Jakarta_Sans',system-ui]">
          Based on your location: <span className="text-teal-600 font-bold">{location.district}, {location.province}</span>
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search by UC number, area, or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-14 pr-6 py-5 rounded-[18px] border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 shadow-sm outline-none transition-all text-slate-900 font-medium font-['Plus_Jakarta_Sans',system-ui]"
        />
      </div>

      {/* Office Card */}
      <div className="p-8 rounded-[24px] border border-slate-100 bg-white shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-[1.25rem] font-black text-[#0f172a] font-['Plus_Jakarta_Sans',system-ui]">
                {sampleOffice.name}
              </h3>
              {sampleOffice.isMandatory && (
                <span className="px-3 py-1 bg-teal-50 text-teal-700 text-[0.65rem] font-black uppercase tracking-wider rounded-lg">
                  Mandatory
                </span>
              )}
            </div>
            <p className="text-[0.9rem] text-slate-500 font-medium">
              {sampleOffice.address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
           <Clock className="w-4 h-4" />
           <span className="text-[0.85rem] font-bold">{sampleOffice.timings}</span>
        </div>

        {/* Pro-Tip */}
        <div className="p-4 bg-[#f0fdfa] border border-[#ccfbf1] rounded-xl flex items-center gap-3">
           <span className="text-teal-700 text-[0.85rem] font-black italic shrink-0">Pro-Tip:</span>
           <p className="text-[#134e4a] text-[0.85rem] font-bold">
              {sampleOffice.proTip}
           </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
           <button className="flex-1 flex items-center justify-center gap-2 py-4 rounded-[14px] border-2 border-teal-600 text-teal-700 font-black text-[0.95rem] hover:bg-teal-50 transition-all">
              <MapPin className="w-4.5 h-4.5" />
              View on Map
           </button>
           <button 
            onClick={() => onSave(sampleOffice)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-4 rounded-[14px] font-black text-[0.95rem] transition-all",
              savedOffice?.id === sampleOffice.id
                ? "bg-slate-900 text-white"
                : "bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-100"
            )}
           >
              {savedOffice?.id === sampleOffice.id ? (
                <>
                  <Check className="w-4.5 h-4.5" />
                  Office Saved
                </>
              ) : (
                <>
                  <Star className="w-4.5 h-4.5" />
                  Save Office
                </>
              )}
           </button>
        </div>
      </div>
    </motion.div>
  );
};

export default OfficeFinderStep;
