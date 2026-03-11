import React, { useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MenuItem } from "./MenuItem";
import { ComingSoonModal } from "../shared/ComingSoonModal";
import { useAuth } from "@/app/context/AuthContext";

export interface MegaMenuItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  badge?: "Soon" | "Live";
  disabled?: boolean;
}

interface MegaMenuCategory {
  label: string;
  items: MegaMenuItem[];
}

interface MegaMenuTab {
  id: string;
  label: string;
  items?: MegaMenuItem[];
  categories?: MegaMenuCategory[];
}

interface MegaMenuProps {
  isOpen: boolean;
  tabs?: MegaMenuTab[];
  items?: MegaMenuItem[];
  showSearch?: boolean;
  footerLink?: {
    label: string;
    href: string;
  };
  arrowOffset?: number;
}

const MegaMenu: React.FC<MegaMenuProps> = ({
  isOpen,
  tabs,
  items,
  showSearch = false,
  footerLink,
  arrowOffset = 40,
}) => {
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [showComingSoon, setShowComingSoon] = useState(false);

  const { user } = useAuth();

  // Auto-select first tab when menu opens or tabs change
  React.useEffect(() => {
    if (tabs && tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs]);

  if (!isOpen) return null;

  const activeTabData = tabs?.find((t) => t.id === activeTab);

  // Flatten items for search if categories exist
  const getFlatItems = () => {
    if (items) return items;
    if (!activeTabData) return [];

    if (activeTabData.items) return activeTabData.items;

    if (activeTabData.categories) {
      return activeTabData.categories.flatMap((c) => c.items);
    }

    return [];
  };

  const currentItems = getFlatItems();

  const filteredItems = searchQuery
    ? currentItems.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : currentItems;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="relative w-full max-w-[min(1100px,calc(100vw-2rem))] flex flex-col max-h-[80vh] mb-10 mt-0 origin-top shadow-sm"
    >
      {/* Main panel */}
      <div className="relative bg-background rounded-2xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.15)] border border-border/60 overflow-hidden flex flex-col max-h-[80vh]">
      {/* Horizontal Tabs Header */}
      {tabs && (
        <div className="w-full bg-slate-50/80 border-b border-slate-100 px-6 pt-4">
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 pb-3 text-sm font-semibold transition-all relative ${
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-slate-500 hover:text-primary/70"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-4">
        {/* Search Bar */}
        {showSearch && (
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search a visa type... (IR-1, H-1B, B-2...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
            />
          </div>
        )}

        {/* Items Grid */}
        <div className="flex flex-col gap-8">
          <AnimatePresence mode="popLayout" initial={false}>
            {searchQuery ? (
              // ------------- SEARCH RESULTS (FLAT GRID) -------------
              <motion.div
                key="search-results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6"
              >
                {filteredItems.map((item, index) => (
                  <MenuItem
                    key={`${item.title}-${index}`}
                    item={item}
                    index={index}
                  />
                ))}
              </motion.div>
            ) : (
              // ------------- CATEGORIZED OR FLAT VIEW -------------
              <motion.div
                key="normal-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Access current tab data */}
                {(() => {
                  const activeTabData = tabs?.find((t) => t.id === activeTab);
                  const hasCategories =
                    activeTabData?.categories &&
                    activeTabData.categories.length > 0;

                  if (hasCategories) {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        {activeTabData!.categories!.map((category) => (
                          <div
                            key={category.label}
                            className="flex flex-col gap-4"
                          >
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                              {category.label}
                            </h3>
                            <div className="flex flex-col gap-2">
                              {category.items.map((item, itemIndex) => (
                                <MenuItem
                                  key={item.title}
                                  item={item}
                                  index={itemIndex}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    // Flat items (fallback)
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {filteredItems.map((item, index) => (
                          <MenuItem
                            key={item.title}
                            item={item}
                            index={index}
                          />
                        ))}
                      </div>
                    );
                  }
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {searchQuery && filteredItems.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm italic">
              No items found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="border-t border-slate-100 bg-slate-50/50 p-5 flex justify-between shrink-0">
        <Link
          href={footerLink?.href || "#"}
          className="flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all"
        >
          {footerLink?.label || "Explore all journeys"}
          <ArrowRight className="h-4 w-4" />
        </Link>
        {!user && (
          <button
            onClick={() => setShowComingSoon(true)}
            className="flex items-center cursor-pointer gap-2 text-sm font-bold text-primary hover:gap-3 transition-all"
          >
            Get Early Access
          </button>
        )}
      </div>

      {showComingSoon && (
        <ComingSoonModal
          open={showComingSoon}
          onOpenChange={setShowComingSoon}
        />
      )}
    </div>
    </motion.div>
  );
};

export default MegaMenu;
