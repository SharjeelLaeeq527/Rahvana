import React from "react";
import { Users, Book, ArrowRight, Upload } from "lucide-react";

interface HouseholdBuilderProps {
  hhCount: number;
  jsCount: number;
  hhRelationships: Record<number, string>;
  hhDocsStatus: Record<string, string>;
  setHhCount: (val: number) => void;
  setJsCount: (val: number) => void;
  setHhRelationships: (val: any) => void;
  setHhDocsStatus: (val: any) => void;
  actions: any;
  stepEntitlement: any;
  currentStep: any;
  setIsTutorialOpen: (val: boolean) => void;
  setTutorialIdx: (val: number) => void;
  setTutorialPath: (val: string) => void;
  setUseCeacGuideData: (val: boolean) => void;
  setActiveHhDoc: (val: any) => void;
  setIsHhDocGuideOpen: (val: boolean) => void;
  setActiveUploadId: (val: string) => void;
  setActiveUploadType: (val: string) => void;
  openUploadModal: (val: string) => void;
  getStepIcon: (icon: string) => React.ReactNode;
  mapDocumentNameToId: (name: string) => string;
}

export const HouseholdBuilder: React.FC<HouseholdBuilderProps> = ({
  hhCount,
  jsCount,
  hhRelationships,
  hhDocsStatus,
  setHhCount,
  setJsCount,
  setHhRelationships,
  setHhDocsStatus,
  actions,
  stepEntitlement,
  currentStep,
  setIsTutorialOpen,
  setTutorialIdx,
  setTutorialPath,
  setUseCeacGuideData,
  setActiveHhDoc,
  setIsHhDocGuideOpen,
  setActiveUploadId,
  setActiveUploadType,
  openUploadModal,
  getStepIcon,
  mapDocumentNameToId,
}) => {
  const getHhDocItems = (count: number, relationships: Record<number, string>) => {
    const items: any[] = [];
    for (let i = 1; i <= count; i++) {
      const rel = relationships[i] || "other-hh";
      const label =
        rel === "spouse"
          ? "Spouse"
          : rel === "child"
            ? "Child"
            : rel === "parent"
              ? "Parent"
              : rel === "sibling"
                ? "Sibling"
                : rel === "other-relative"
                  ? "Relative"
                  : "Member";

      // Common requirements for all household members
      items.push({
        id: `hh${i}-i864a`,
        icon: "file",
        title: `Form I-864A — ${label}`,
        sub: "The contract between the petitioner and household member",
        tags: [
          { cls: "tag-hh", label: "Household Member" },
          { cls: "tag-js", label: "Financial Sponsor" },
          { cls: "tag-uscis", label: "USCIS Form" },
        ],
        guideKey: "i864a",
        group: "required",
      });

      items.push({
        id: `hh${i}-tax`,
        icon: "calc",
        title: `IRS Tax Return Transcript — ${label}`,
        sub: "Most recent year required; last 3 years recommended",
        tags: [
          { cls: "tag-hh", label: "Household Member" },
          { cls: "tag-pay", label: "Income Proof" },
          { cls: "tag-gov", label: "Govt Record" },
        ],
        guideKey: "tax-transcript-hh",
        group: "required",
      });

      // Relationship-specific proofs
      switch (rel) {
        case "spouse":
          items.push({
            id: `hh${i}-marriage`,
            icon: "file",
            title: "Marriage Certificate",
            sub: "Legal proof of marriage to the petitioner",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-rel", label: "Relationship Proof" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "marriage-cert-hh",
            group: "required",
          });
          break;

        case "child":
          items.push({
            id: `hh${i}-birth`,
            icon: "birth",
            title: `Birth Certificate — ${label}`,
            sub: "Shows the parent-child relationship to the petitioner",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-rel", label: "Relationship Proof" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "birth-cert-hh",
            group: "required",
          });
          break;

        case "parent":
          items.push({
            id: `hh${i}-birth-petitioner`,
            icon: "birth",
            title: "Birth Certificate of Petitioner",
            sub: "Shows the relationship to the parent household member",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-rel", label: "Relationship Proof" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "birth-cert-petitioner",
            group: "required",
          });
          items.push({
            id: `hh${i}-id`,
            icon: "id",
            title: `Identity Document — ${label}`,
            sub: "Government-issued ID for the household member",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-id", label: "Identity" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "id-doc-hh",
            group: "required",
          });
          items.push({
            id: `hh${i}-residence`,
            icon: "home",
            title: `Proof of Shared Residence — ${label}`,
            sub: "Confirms parent and petitioner share the same household",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-res", label: "Shared Residence" },
            ],
            guideKey: "shared-residence",
            group: "conditional",
          });
          break;

        case "sibling":
          items.push({
            id: `hh${i}-birth-sponsor`,
            icon: "birth",
            title: "Birth Certificate of Petitioner",
            sub: "Shows shared parentage with the sibling household member",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-rel", label: "Relationship Proof" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "birth-cert-sponsor",
            group: "required",
          });
          items.push({
            id: `hh${i}-birth-hh`,
            icon: "birth",
            title: `Birth Certificate — ${label}`,
            sub: "Combined with petitioner's birth cert to show shared parentage",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-rel", label: "Relationship Proof" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "birth-cert-hh",
            group: "required",
          });
          items.push({
            id: `hh${i}-id`,
            icon: "id",
            title: `Identity Document — ${label}`,
            sub: "Government-issued ID for the household member",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-id", label: "Identity" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "id-doc-hh",
            group: "required",
          });
          items.push({
            id: `hh${i}-residence`,
            icon: "home",
            title: `Proof of Shared Residence — ${label}`,
            sub: "Confirms sibling and petitioner share the same household",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-res", label: "Shared Residence" },
            ],
            guideKey: "shared-residence",
            group: "conditional",
          });
          break;

        case "other-relative":
        case "other-hh":
        default:
          items.push({
            id: `hh${i}-residence`,
            icon: "home",
            title: `Proof of Shared Residence — ${label}`,
            sub: "Demonstrates the shared-household basis for including their income",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-res", label: "Shared Residence" },
            ],
            guideKey: "shared-residence",
            group: "required",
          });
          items.push({
            id: `hh${i}-family-link`,
            icon: "link",
            title: `Supporting Family-Link Evidence — ${label}`,
            sub: "Civil records or affidavit establishing the household connection",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-rel", label: "Relationship Proof" },
            ],
            guideKey: "family-link",
            group: "required",
          });
          items.push({
            id: `hh${i}-id`,
            icon: "id",
            title: `Identity Document — ${label}`,
            sub: "Government-issued ID for the household member",
            tags: [
              { cls: "tag-hh", label: "Household Member" },
              { cls: "tag-id", label: "Identity" },
              { cls: "tag-gov", label: "Govt Record" },
            ],
            guideKey: "id-doc-hh",
            group: "conditional",
          });
          break;
      }
    }
    return items;
  };

  const allItems = getHhDocItems(hhCount, hhRelationships);
  const total = allItems.length;
  const reviewed = allItems.filter((item: any) => hhDocsStatus[item.id] === "reviewed").length;
  const progressPct = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  const renderHhDocCard = (item: any) => {
    const st = hhDocsStatus[item.id] || "not-started";
    const stLabel =
      st === "reviewed" ? "\u2713 Reviewed" : st === "in-progress" ? "In progress" : "Open guide";

    return (
      <div
        key={item.id}
        onClick={() => {
          if (!stepEntitlement.guard()) return;
          if (hhDocsStatus[item.id] === "not-started") {
            const next = { ...hhDocsStatus, [item.id]: "in-progress" };
            setHhDocsStatus(next);
            actions.updateMetadata({ hhDocsStatus: next });
          }
          setActiveHhDoc(item);
          setIsHhDocGuideOpen(true);
        }}
        className={`w-full group bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[17px_20px] flex items-center gap-[15px] text-left transition-all hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-px active:translate-y-0 cursor-pointer ${
          st === "reviewed"
            ? "bg-[#e8f5ef] border-[#a8d9be]"
            : st === "in-progress"
              ? "bg-[#fef8e8] border-[#f0d98a]"
              : ""
        }`}
      >
        <div
          className={`w-[38px] h-[38px] rounded-[9px] bg-[#e8f1fb] border border-[#d0e4f7] flex items-center justify-center shrink-0 text-[16px] transition-all group-hover:bg-primary/10 group-hover:border-primary/30 ${
            st === "reviewed" ? "bg-[#e8f5ef] border-[#a8d9be]" : ""
          }`}
        >
          {getStepIcon(item.icon)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-[#0c1b33] mb-0.5 leading-tight">
            {item.title}
          </div>
          <div className="text-[12px] text-[#6b8097] leading-tight">{item.sub}</div>
          <div className="flex gap-[5px] mt-[6px] flex-wrap">
            {item.tags.map((tag: any, idx: number) => {
              const tagMap: Record<string, string> = {
                "tag-hh": "bg-[#fff7ed] text-[#b45309] border-[#fed7aa]",
                "tag-js": "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]",
                "tag-rel": "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]",
                "tag-res": "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]",
                "tag-id": "bg-[#eef3fa] text-[#3a4f63] border-[#d0e4f7]",
                "tag-gov": "bg-[#fff7ed] text-[#b45309] border-[#fed7aa]",
              };
              return (
                <span
                  key={idx}
                  className={`text-[10px] font-semibold px-2 py-[2px] rounded-full tracking-wider border ${
                    tagMap[tag.cls] || "bg-[#f4f7fb] text-[#6b8097]"
                  }`}
                >
                  {tag.label}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const defId = mapDocumentNameToId(item.title);
              setActiveUploadId(item.id);
              setActiveUploadType("hh");
              openUploadModal(defId);
            }}
            className="rounded-full bg-white px-[11px] py-[5px] border border-[#d0e4f7] text-[12px] font-medium flex items-center justify-center gap-1 text-[#6b8097] hover:border-primary hover:text-primary transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <Upload size={14} strokeWidth={2.5} />
            <span>Vault</span>
          </button>
          <div
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 transition-all border ${
              st === "reviewed"
                ? "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]"
                : st === "in-progress"
                  ? "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                  : "bg-[#f4f7fb] text-[#6b8097] border-[#d0e4f7]"
            }`}
          >
            {stLabel}
          </div>
        </div>
      </div>
    );
  };

  const req = allItems.filter((i: any) => i.group === "required");
  const cond = allItems.filter((i: any) => i.group === "conditional");

  return (
    <div className="flex flex-col mt-4">
      <div className="flex gap-[7px] flex-wrap mb-7">
        <span className="text-[11px] font-semibold tracking-wider uppercase px-3 py-[2px] rounded-full bg-[#f3f0fb] text-[#4a2d8a] border border-[#c9bef2]">
          CEAC Portal
        </span>
        <span className="text-[11px] font-semibold tracking-wider uppercase px-3 py-[2px] rounded-full bg-[#fff7ed] text-[#b45309] border border-[#fed7aa]">
          Financial Sponsorship
        </span>
        <span className="text-[11px] font-semibold tracking-wider uppercase px-3 py-[2px] rounded-full bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be]">
          Interactive Checklist
        </span>
      </div>

      {/* DISTINCTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-7">
        <div className="bg-[#e8f1fb] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-4.5">
          <div className="text-[10px] font-bold tracking-widest uppercase text-[#2d4a6e] mb-1.5">
            Joint Sponsor
          </div>
          <div className="text-[15px] font-semibold text-[#0c1b33] mb-1.5 leading-tight">
            Added in CEAC, no proof checklist
          </div>
          <div className="text-[13px] text-[#3a4f63] leading-relaxed">
            A joint sponsor is an independent U.S. citizen or LPR who sponsors separately. Added
            through the CEAC sponsorship flow \u2014{" "}
            <strong>no relationship-proof documents</strong> are typically required from them.
          </div>
        </div>
        <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[16px] p-4.5">
          <div className="text-[10px] font-bold tracking-widest uppercase text-[#15744f] mb-1.5">
            Household Member
          </div>
          <div className="text-[15px] font-semibold text-[#0e5c3c] mb-1.5 leading-tight">
            Added in CEAC + relationship proof required
          </div>
          <div className="text-[13px] text-[#3a4f63] leading-relaxed">
            A household member&apos;s income is used alongside the petitioner&apos;s. Added through
            CEAC \u2014 and also requires <strong>relationship-proof documentation</strong> showing
            their connection to the sponsoring household.
          </div>
        </div>
      </div>

      {/* PRIMARY LAUNCH MODULE */}
      <div className="bg-[#0e1e38] rounded-[16px] border border-white/7 shadow-[0_20px_60px_rgba(12,27,51,0.18)] overflow-hidden mb-6 relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-primary via-[#6aa8f0] to-transparent opacity-70" />
        <div className="p-8 md:p-[32px_34px_28px]">
          <div className="flex items-start gap-4 mb-[22px]">
            <div className="w-[46px] h-[46px] rounded-[11px] bg-white/6 border border-white/10 flex items-center justify-center shrink-0">
              <Users className="text-white/75" size={22} />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-white/35 mb-1">
                CEAC Guidance
              </div>
              <div className="text-[clamp(19px,2.8vw,23px)] text-white/92 leading-tight">
                Add sponsorship participants in CEAC
              </div>
            </div>
          </div>
          <div className="h-px bg-white/10 mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[9px] mb-[26px]">
            {[
              "Access the affidavit support section",
              "Add a household member or joint sponsor",
              "Review what information CEAC needs",
              "Return here to prepare relationship proof",
            ].map((cue, idx) => (
              <div
                key={idx}
                className="bg-white/6 border border-white/10 rounded-[10px] p-[11px_13px] flex items-start gap-[9px]"
              >
                <div className="w-[5px] h-[5px] rounded-full bg-[#6aa8f0]/70 shrink-0 mt-[5px]" />
                <div className="text-[13px] text-white/55 leading-tight">{cue}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              if (!stepEntitlement.guard()) return;
              setUseCeacGuideData(true);
              setTutorialIdx(0);
              setIsTutorialOpen(true);
            }}
            className="w-full py-4 px-7 bg-[#b48ad6] text-white rounded-[12px] text-[15px] font-semibold cursor-pointer hover:bg-[#561864] transition-all shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:shadow-[0_8px_32px_rgba(47,111,212,0.45)] hover:-translate-y-0.5 active:translate-y-0"
          >
            Start CEAC Guide
          </button>
        </div>
      </div>

      {/* GUIDE CARDS - Flex Layout */}
      {(() => {
        const tool = currentStep.tool_data as any;
        const guideCards = tool?.guide_cards;

        if (guideCards && guideCards.length > 0 && tool?.tutorial_steps) {
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
              {guideCards.map((card: any) => (
                <button
                  key={card.id}
                  onClick={() => {
                    if (!stepEntitlement.guard()) return;
                    const pathMap: Record<string, "household_member" | "joint_sponsor"> = {
                      "add-household-member": "household_member",
                      "add-joint-sponsor": "joint_sponsor",
                    };
                    setTutorialPath(
                      pathMap[card.id] || (card.id as "household_member" | "joint_sponsor")
                    );
                    setTutorialIdx(0);
                    setIsTutorialOpen(true);
                  }}
                  className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px] text-left group hover:border-primary hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)] hover:-translate-y-px transition-all cursor-pointer select-none flex flex-col"
                >
                  <div className="flex items-center gap-[10px] mb-[12px]">
                    <div className="w-[36px] h-[36px] rounded-[9px] bg-[#f3f0fb] border border-[#c9bef2] flex items-center justify-center shrink-0">
                      <Book size={18} className="text-[#4a2d8a]" strokeWidth={1.7} />
                    </div>
                  </div>
                  <h3 className="text-[14px] font-semibold text-[#0c1b33] mb-1">{card.title}</h3>
                  <p className="text-[12px] text-[#6b8097] leading-normal mb-3">{card.subtitle}</p>
                  <div className="flex items-center gap-1 mt-auto text-[12px] font-semibold text-primary">
                    <span>View guide</span>
                    <ArrowRight size={11} strokeWidth={2} />
                  </div>
                </button>
              ))}
            </div>
          );
        }
        return null;
      })()}

      {/* SCENARIO BUILDER */}
      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[22px] mb-[18px]">
        <div className="text-[14px] font-semibold text-[#0c1b33] mb-4">
          Define your scenario \u2014 who is involved in the sponsorship?
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-[#6b8097] uppercase tracking-wider mb-1.5 ml-0.5">
              Number of joint sponsors
            </label>
            <select
              value={jsCount}
              onChange={(e) => setJsCount(parseInt(e.target.value))}
              className="w-full p-[9px_12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] bg-white outline-none focus:border-primary appearance-none bg-position-[right_10px_center] bg-no-repeat pr-[30px]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b8097' stroke-width='2' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              }}
            >
              <option value="0">0 \u2014 not using a joint sponsor</option>
              <option value="1">1 joint sponsor</option>
              <option value="2">2 joint sponsors</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-[#6b8097] uppercase tracking-wider mb-1.5 ml-0.5">
              Number of household members
            </label>
            <select
              value={hhCount}
              onChange={(e) => setHhCount(parseInt(e.target.value))}
              className="w-full p-[9px_12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] bg-white outline-none focus:border-primary appearance-none bg-[position:right_10px_center] bg-no-repeat pr-[30px]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b8097' stroke-width='2' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              }}
            >
              <option value="0">0 \u2014 no household members</option>
              <option value="1">1 household member</option>
              <option value="2">2 household members</option>
              <option value="3">3 household members</option>
            </select>
          </div>
        </div>

        {hhCount > 0 && (
          <div className="mt-4 pt-4 border-t border-[#d0e4f7]">
            <div className="text-[11px] font-bold text-[#6b8097] uppercase tracking-widest mb-3 ml-0.5">
              Household member relationship to the petitioner
            </div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: hhCount }).map((_, idx) => {
                const num = idx + 1;
                return (
                  <div key={num} className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-[13px] font-medium text-[#3a4f63] min-w-[140px]">
                      Household Member {num}
                    </span>
                    <select
                      value={hhRelationships[num] || "other-hh"}
                      onChange={(e) =>
                        setHhRelationships((prev: any) => ({
                          ...prev,
                          [num]: e.target.value,
                        }))
                      }
                      className="flex-1 p-[8px_10px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[13px] bg-white outline-none focus:border-primary appearance-none bg-[position:right_8px_center] bg-no-repeat pr-[26px]"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%236b8097' stroke-width='2' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                      }}
                    >
                      <option value="spouse">Spouse of petitioner</option>
                      <option value="child">Child of petitioner</option>
                      <option value="parent">Parent of petitioner</option>
                      <option value="sibling">Sibling of petitioner</option>
                      <option value="other-relative">Other relative</option>
                      <option value="other-hh">Other household member</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SUMMARY BANNER */}
      {(jsCount > 0 || hhCount > 0) && (
        <div className="bg-[#0c1b33] rounded-[16px] p-[16px_20px] mb-5 flex flex-wrap gap-x-8 gap-y-4">
          <div className="flex flex-col">
            <div className="text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-0.5">
              Joint Sponsors
            </div>
            <div className="text-[14px] font-semibold text-white/90">
              {jsCount === 0 ? "None" : `${jsCount} joint sponsor${jsCount > 1 ? "s" : ""}`}
            </div>
            {jsCount > 0 && (
              <div className="text-[11px] text-white/50 mt-0.5">
                No relationship-proof checklist required
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <div className="text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-0.5">
              Household Members
            </div>
            <div className="text-[14px] font-semibold text-white/90">
              {hhCount === 0 ? "None" : `${hhCount} household member${hhCount > 1 ? "s" : ""}`}
            </div>
            {hhCount > 0 && (
              <div className="text-[11px] text-white/50 mt-0.5">
                Relationship-proof checklist generated below
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROGRESS AND CHECKLIST */}
      {hhCount > 0 ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-7">
            <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-primary to-[#6aa8f0] transition-all duration-500 rounded-[10px]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap">
              {reviewed} of {total} reviewed
            </div>
          </div>

          <div className="flex flex-col gap-7">
            {req.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-[10px]">
                  <span className="text-[11px] font-semibold tracking-widest uppercase text-[#6b8097]">
                    Required
                  </span>
                  <span className="text-[10px] font-semibold tracking-widest uppercase px-[9px] py-[3px] rounded-full bg-[#ffeaea] text-[#a01c1c] border border-[#f5bebe]">
                    Required
                  </span>
                  <div className="flex-1 h-px bg-[#d0e4f7]" />
                </div>
                {req.map((item: any) => renderHhDocCard(item))}
              </div>
            )}
            {cond.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-[10px]">
                  <span className="text-[11px] font-semibold tracking-widest uppercase text-[#6b8097]">
                    Required if Applicable
                  </span>
                  <span className="text-[10px] font-semibold tracking-widest uppercase px-[9px] py-[3px] rounded-full bg-[#fef8e8] text-[#8a6200] border border-[#f0d98a]">
                    Required if Applicable
                  </span>
                  <div className="flex-1 h-px bg-[#d0e4f7]" />
                </div>
                {cond.map((item: any) => renderHhDocCard(item))}
              </div>
            )}
          </div>
        </div>
      ) : jsCount > 0 ? (
        <div className="bg-white border-[1.5px] border-dashed border-[#d0e4f7] rounded-[16px] p-[32px_24px] text-center mb-5">
          <div className="text-[14px] font-semibold text-[#6b8097] mb-1.5">
            No relationship-proof checklist needed
          </div>
          <div className="text-[13px] text-[#6b8097]">
            Joint sponsors do not require relationship documentation. Your I-864 forms are the
            primary requirement \u2014 see Step 5 for those.
          </div>
        </div>
      ) : (
        <div className="bg-white border-[1.5px] border-dashed border-[#d0e4f7] rounded-[16px] p-[32px_24px] text-center mb-5">
          <div className="text-[14px] font-semibold text-[#6b8097] mb-1.5">
            Set your scenario above
          </div>
          <div className="text-[13px] text-[#6b8097]">
            Select the number of joint sponsors and household members to see the relevant checklist.
          </div>
        </div>
      )}
    </div>
  );
};
