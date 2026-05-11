import { useState } from "react";

interface UseSponsorshipProps {
  metadata: any;
}

export const useSponsorship = ({ metadata }: UseSponsorshipProps) => {
  const [jsCount, setJsCount] = useState<number>(
    (metadata.jsCount as number) || 0,
  );
  const [hhCount, setHhCount] = useState<number>(
    (metadata.hhCount as number) || 0,
  );
  const [hhRelationships, setHhRelationships] = useState<
    Record<number, string>
  >((metadata.hhRelationships as Record<number, string>) || {});
  
  const [hhDocsStatus, setHhDocsStatus] = useState<Record<string, string>>(
    (metadata.hhDocsStatus as Record<string, string>) || {},
  );

  const [isSponsorshipCalcOpen, setIsSponsorshipCalcOpen] = useState(false);
  const sponsorshipResult = (metadata.sponsorshipResult as any) || null;

  return {
    jsCount,
    setJsCount,
    hhCount,
    setHhCount,
    hhRelationships,
    setHhRelationships,
    hhDocsStatus,
    setHhDocsStatus,
    isSponsorshipCalcOpen,
    setIsSponsorshipCalcOpen,
    sponsorshipResult,
  };
};
