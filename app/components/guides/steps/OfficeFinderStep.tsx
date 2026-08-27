"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Search, Clock, Phone, MapIcon, Star } from "lucide-react";
import Pagination from "@/components/ui/pagination";

interface Office {
  name: string;
  address: string;
  hours?: string;
  phone?: string | null;
  province: string;
  district: string;
  city?: string;
  map_link?: string;
}

interface OfficeFinderStepProps {
  province: string | null;
  district: string | null;
  city?: string | null;
  offices?: Office[];
  officeType?: string;
  warningText?: string;
  itemsPerPage?: number; // optional, default 5
}

const OfficeFinderStep = ({
  province,
  district,
  city,
  offices = [],
  officeType = "NADRA",
  warningText,
  itemsPerPage = 5,
}: OfficeFinderStepProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter offices based on province/district/city + search query
  const filteredOffices = useMemo(() => {
    return offices.filter((o) => {
      const matchesLocation =
        (!province || o.province === province) &&
        (!district || o.district === district) &&
        (!city || o.city === city);

      const matchesSearch =
        !searchQuery ||
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.address.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesLocation && matchesSearch;
    });
  }, [offices, province, district, city, searchQuery]);

  // Pagination calculation
  const totalItems = filteredOffices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedOffices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOffices.slice(start, start + itemsPerPage);
  }, [filteredOffices, currentPage, itemsPerPage]);

  const locationLabel = [district, province].filter(Boolean).join(", ") || "Pakistan";
  const defaultWarning = `Verify that the office you plan to visit offers the required services. Office listings and contact information may change; always confirm details before visiting.`;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Heading */}
      <h2 className="text-[1.75rem] font-extrabold text-[hsl(220_20%_10%)] mb-2 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
        Find Your {officeType} Office
      </h2>

      <p className="text-[0.95rem] text-[hsl(215_16%_47%)] mb-6">
        Based on your location: {locationLabel}
      </p>

      {/* Warning Card */}
      <div className="p-4 rounded-xl bg-[hsl(40_100%_97%)] border border-[hsl(40_80%_85%)] flex gap-3 items-start mb-6">
        <AlertTriangle className="w-4.5 h-4.5 text-[hsl(35_80%_45%)] shrink-0 mt-0.5" />
        <div>
          <p className="text-[0.83rem] font-bold text-[hsl(35_80%_35%)] mb-1">
            Important: Verify Before Visiting
          </p>
          <p className="text-[0.83rem] leading-[1.6] text-[hsl(35_50%_30%)]">
            {warningText || defaultWarning}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[hsl(215_16%_60%)]" />
        <input
          type="text"
          placeholder="Search by office name, address, or area..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-[hsl(214_32%_91%)] text-[0.9rem] bg-white text-[hsl(220_20%_10%)] focus:outline-none"
        />
      </div>

      {/* Office Cards */}
      <div className="flex flex-col gap-4">
        {paginatedOffices.length > 0 ? (
          paginatedOffices.map((office, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 rounded-[14px] border border-[hsl(214_32%_91%)] bg-white"
            >
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-[1.05rem] font-bold text-[hsl(220_20%_10%)] font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
                  {office.name}
                </h4>
              </div>
              <p className="text-[0.85rem] text-[hsl(215_16%_50%)] mb-3">{office.address}</p>
              <div className="flex flex-wrap gap-6 text-[0.82rem] text-[hsl(215_16%_47%)] mb-3">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {office.hours || "9:00 AM - 3:00 PM (Mon - Thur), 9:00 AM - 12:00 PM (Fri)"}
                </span>
                {office.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {office.phone}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => {
                    window.open(office.map_link, "_blank");
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] border-[1.5px] border-[hsl(168_80%_30%)] text-[hsl(168_80%_30%)] text-[0.85rem] font-semibold bg-transparent cursor-pointer"
                >
                  <MapIcon className="w-3.5 h-3.5" /> View on Map
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-white text-[0.85rem] font-semibold bg-[#0d7478] shadow-[0_2px_8px_hsl(168_80%_30%/0.3)] cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5" /> Save Office
                </motion.button>
              </div>
            </motion.div>
          ))
        ) : (
          <p className="text-center text-[0.9rem] text-[hsl(215_16%_50%)]">
            No offices found for your selection.
          </p>
        )}
      </div>

      {/* Pagination */}
      {totalItems > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </motion.div>
  );
};

export default OfficeFinderStep;
