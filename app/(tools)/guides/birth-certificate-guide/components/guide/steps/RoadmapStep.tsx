import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Download, Upload, X, Check, MapPin, AlertCircle } from "lucide-react";
import guideData from "@/data/birth-certificate-guide-data.json";
import { cn } from "@/lib/utils";

interface RoadmapStepProps {
  birthSetting: string | null;
  ageCategory: string | null;
  documentNeed: string | null;
  timing: string | null;
  province: string | null;
  district: string | null;
  parentalStatus: {
    hasCNICs: boolean;
    hasNikahNama: boolean;
    isSingleParent: boolean;
    hasOldRecords: boolean;
    hasSchoolRecord: boolean;
    hasResidenceProof: boolean;
  };
  checkedDocuments: string[];
  onToggleDocument: (id: string) => void;
}

const RoadmapStep = ({
  birthSetting,
  ageCategory,
  documentNeed,
  timing,
  province,
  district,
  parentalStatus,
  checkedDocuments,
  onToggleDocument,
}: RoadmapStepProps) => {
  const { title, estimated_timeline, stations, documents_checklist } =
    guideData.wizard.roadmap;

  const [activeStation, setActiveStation] = useState<string | null>(null);

  // Advanced case-wise filtering logic
  const getFilteredDocs = () => {
    const docs: any[] = [];
    
    // 1. Core Documents (Mandatory for almost all)
    docs.push({ id: 'doc-cnic', label: "Parents CNIC/NICOP", required: true, description: "Originals + Copies" });
    docs.push({ id: 'doc-nikah', label: "Nikah Nama (Marriage Certificate)", required: true, description: "Copy required for relationship proof" });

    // 2. Birth Setting specific
    if (birthSetting === 'hospital') {
      docs.push({ id: 'doc-hospital', label: "Hospital Discharge Slip", required: true, description: "Color or original signed copy" });
    } else if (birthSetting === 'home') {
      docs.push({ id: 'doc-affidavit', label: "Affidavit (Home Birth)", required: true, description: "Signed by parents and 2 witnesses" });
      docs.push({ id: 'doc-witness', label: "Witness CNICs (Two)", required: true, description: "Copies for home birth verification" });
      docs.push({ id: 'doc-vaccation', label: "Vaccination Card", required: false, description: "Strong secondary proof for home births" });
    } else if (birthSetting === 'overseas') {
      docs.push({ id: 'doc-embassy', label: "Embassy S-1 Form / Registration", required: true, description: "Foreign birth registration papers" });
    } else if (birthSetting === 'adoption') {
      docs.push({ id: 'doc-court', label: "Court Guardianship Order", required: true, description: "Mandatory legal document for adoption" });
    }

    // 3. Timing / Age based
    if (timing === 'late' || timing === 'very_late') {
        docs.push({ id: 'doc-vaccation-late', label: "Vaccination Card / Medical Record", required: true, description: "Mandatory for late registrations" });
        if ((ageCategory === '10-18' || ageCategory === '18+') && (parentalStatus.hasSchoolRecord || !parentalStatus.hasOldRecords)) {
            docs.push({ id: 'doc-school', label: "School Admission Cert / Matric Cert", required: true, description: "Proof of age from school record" });
        }
    }
    if (timing === 'very_late') {
        docs.push({ id: 'doc-magistrate', label: "Magistrate Order / Decree", required: true, description: "7+ years cases require court clearance" });
        docs.push({ id: 'doc-news-ad', label: "Newspaper Advertisement", required: true, description: "Public notice for late registration" });
    }

    // 4. Case Type (Correction / Replacement)
    if (documentNeed === 'correction') {
      if (ageCategory === '10-18' || ageCategory === '18+') {
        docs.push({ id: 'doc-school-correction', label: "Matric/School Cert (Original)", required: true, description: "Original record for name/DOB change" });
      }
      docs.push({ id: 'doc-old-cert', label: "Existing Certificate (Original)", required: true, description: "Original carrying errors to be fixed" });
    } else if (documentNeed === 'replacement') {
      docs.push({ id: 'doc-fir', label: "Police FIR (Loss Report)", required: true, description: "Mandatory for lost certificates" });
    }

    // 5. Regional / Optional
    if (province === 'Punjab' || province === 'Sindh') {
        docs.push({ id: 'doc-utility', label: "Residence Proof (Utility Bill)", required: false, description: "To prove UC jurisdiction" });
    }

    // 6. Child Presence
    if (ageCategory !== '0-3') {
        docs.push({ id: 'doc-photo', label: "Recent Photo of Applicant", required: true, description: "White background (3+ years requirement)" });
    }

    return docs;
  };

  const filteredDocs = getFilteredDocs();
  const checkedCount = checkedDocuments.filter(id => filteredDocs.some((d: any) => d.id === id)).length;
  const totalDocs = filteredDocs.length;

  const selectedStation = stations.find(s => s.id === activeStation);

  // Dynamic Station Tasks based on case
  const getStationTasks = (station: any) => {
    let tasks = [...station.tasks];
    
    if (station.id === 'gather') {
        if (birthSetting === 'home') tasks = tasks.filter(t => !t.includes('Hospital')).concat(["Prepare Home Birth Affidavit"]);
        if (timing === 'very_late') tasks.push("Publish News Ad", "Visit Magistrate Office");
    }

    if (station.id === 'nadra') {
        if (ageCategory !== '0-3') tasks.push("Bring applicant for Biometrics");
        else tasks = tasks.filter(t => !t.includes('biometrics')).concat(["Parent presence enough (No biometrics)"]);
    }

    return tasks;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
      {/* Case Alert Header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-teal-50 border border-teal-100 mb-6">
          <AlertCircle className="w-5 h-5 text-teal-600" />
          <div className="text-sm font-medium text-teal-800">
              Generating <span className="font-bold underline">{documentNeed === 'new' ? 'Registration' : documentNeed}</span> guide for 
              {timing === 'timely' ? ' Timely' : ` ${timing?.replace('_',' ')}`} case ({province}).
          </div>
      </div>

      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[1.75rem] font-extrabold text-slate-900 mb-2 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
            {title}
          </h2>
          <p className="text-[0.95rem] text-slate-500 leading-normal font-['Plus_Jakarta_Sans',system-ui]">
            Estimated completion: <span className="text-teal-600 font-bold">{estimated_timeline}</span>
          </p>
        </div>
      </div>

      {/* Journey Timeline */}
      <section>
        <h3 className="text-[0.7rem] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 font-['Plus_Jakarta_Sans',system-ui]">Process Timeline</h3>
        
        <div className="bg-white rounded-[32px] border border-slate-100 p-12 shadow-sm mb-12 relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                {stations.map((station: any, i: number) => (
                    <div key={station.id} className="flex-1 flex flex-col items-center group relative min-w-[140px]">
                        {/* Connecting Line */}
                        {i < stations.length - 1 && (
                            <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-1 bg-[#ccfbf1] rounded-full" />
                        )}

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setActiveStation(activeStation === station.id ? null : station.id)}
                            className={cn(
                                "w-14 h-14 rounded-full flex items-center justify-center text-[1.25rem] font-black transition-all duration-300 mb-5 relative z-20 shadow-lg",
                                activeStation === station.id 
                                    ? "bg-teal-600 text-white ring-8 ring-teal-50" 
                                    : "bg-teal-600 text-white hover:ring-8 hover:ring-teal-50"
                            )}
                        >
                            {i + 1}
                        </motion.button>

                        <div className="text-center space-y-1">
                            <div className={cn(
                                "text-[0.95rem] font-black leading-tight font-['Plus_Jakarta_Sans',system-ui]",
                                activeStation === station.id ? "text-teal-900" : "text-[#0f172a]"
                            )}>
                                {station.title}
                            </div>
                            <div className="flex items-center justify-center gap-1.5 text-slate-400 font-bold text-[0.75rem]">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{i === 0 ? 'Day 1' : i === 1 ? '1-3d' : i === 2 ? '1-2d' : '1-7d'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Station Detail */}
        <AnimatePresence>
            {activeStation !== null && selectedStation && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 overflow-hidden"
            >
                <div className="p-7 rounded-2xl bg-white border-2 border-teal-600 relative shadow-xl">
                    <button
                        onClick={() => setActiveStation(null)}
                        className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-3 mb-3">
                        <div className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-[0.65rem] font-black uppercase tracking-widest">Station {stations.indexOf(selectedStation) + 1}</div>
                        <h4 className="text-[1.15rem] font-black text-slate-900 font-['Plus_Jakarta_Sans',system-ui]">
                            {selectedStation.title}
                        </h4>
                    </div>
                    
                    <p className="text-[0.9rem] text-slate-600 mb-6 leading-relaxed font-['Plus_Jakarta_Sans',system-ui]">
                        {selectedStation.description}
                    </p>
                    
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
                      <h5 className="text-[0.7rem] font-black text-slate-400 uppercase tracking-[0.15em]">Specific Tasks:</h5>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        {getStationTasks(selectedStation).map((task: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2.5 text-[0.85rem] text-slate-700 font-bold font-['Plus_Jakarta_Sans',system-ui]">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                </div>
            </motion.div>
            )}
        </AnimatePresence>
      </section>

      {/* Checklist */}
      <section>
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <h3 className="text-[1.25rem] font-black text-slate-900 font-['Plus_Jakarta_Sans',system-ui]">
                    Personalized Checklist
                </h3>
                <div className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-[0.75rem] font-bold">
                    {checkedCount}/{totalDocs}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocs.map((doc: any) => {
            const isChecked = checkedDocuments.includes(doc.id);

            return (
                <motion.div
                key={doc.id}
                whileHover={{ y: -2 }}
                onClick={() => onToggleDocument(doc.id)}
                className={cn(
                    "p-5 rounded-2xl flex items-start gap-4 transition-all border-2 cursor-pointer relative overflow-hidden group",
                    isChecked ? "bg-teal-50 border-teal-600/30" : "bg-white border-slate-100 hover:border-teal-200"
                )}
                >
                <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                    isChecked ? "bg-teal-600 border-teal-600" : "bg-white border-slate-200"
                )}>
                    {isChecked && <Check className="w-4 h-4 text-white" />}
                </div>

                <div className="flex-1 pr-6">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                            "text-[0.9rem] font-bold",
                            isChecked ? "text-slate-400 line-through" : "text-slate-900"
                        )}>
                        {doc.label}
                        </span>
                        {doc.required && !isChecked && (
                            <span className="text-[0.6rem] font-black text-white bg-red-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">MUST</span>
                        )}
                    </div>
                    <p className={cn(
                        "text-[0.75rem] leading-snug",
                        isChecked ? "text-slate-300" : "text-slate-500"
                    )}>
                        {doc.description}
                    </p>
                </div>
                
                {isChecked && (
                    <div className="absolute top-0 right-0 w-12 h-12 flex items-center justify-center opacity-10">
                        <Check className="w-8 h-8 text-teal-600" />
                    </div>
                )}
                </motion.div>
            );
            })}
        </div>
      </section>

      {/* Final Action: Office Finder (At the end as requested) */}
      <section className="pt-8 border-t border-slate-100">
         <div className="bg-[#f8fafc] rounded-[32px] p-10 border border-slate-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-2 text-center md:text-left">
                    <h4 className="text-[1.5rem] font-black text-slate-900 font-['Plus_Jakarta_Sans',system-ui]">Ready to visit the office?</h4>
                    <p className="text-slate-500 font-medium font-['Plus_Jakarta_Sans',system-ui]">Find your nearest {province} Union Council office for submission.</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex flex-col items-center px-6 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-1">Your Jurisdiction</span>
                        <span className="text-teal-600 font-black text-[0.9rem]">{province}, {district}</span>
                    </div>
                </div>
            </div>
         </div>
      </section>
    </motion.div>
  );
};

export default RoadmapStep;
