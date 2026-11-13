'use client';

import React from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useCandidate } from '@/app/context/CandidateContext';
import { useWizard } from '@/app/(main)/dashboard/hooks/useWizard';
import { getJourneyHrefByType, ir1journeyHref } from '@/lib/constants/routes';
import { useRouter } from 'next/navigation';
import RahvanaDashboard from './RahvanaDashboard';
import { Loader } from '@/components/ui/spinner';
import { useMemo } from 'react';

// ── Roadmap data ─────────────────────────────────────────────────────────────
import ir1Data from '@/data/visa-category/ir-1.json';
import ir5Data from '@/data/visa-category/ir-5.json';
import ir2Data from '@/data/visa-category/ir-2.json';
import f1Data from '@/data/visa-category/f-1.json';
import germanyData from '@/data/visa-category/germany-student-journey.json';

function resolveRoadmapData(category?: string | null): any {
  if (!category) return ir1Data;
  const norm = String(category).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (norm.startsWith('ir5')) return ir5Data;
  if (norm.startsWith('ir1') || norm.startsWith('cr1')) return ir1Data;
  if (norm.startsWith('ir2') || norm.startsWith('cr2')) return ir2Data;
  if (norm.startsWith('f1')) return f1Data;
  if (norm.includes('germany')) return germanyData;
  return ir1Data;
}

function normalizeCategorySlug(category?: string | null): string {
  if (!category) return 'ir-1';
  const norm = String(category).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (norm.startsWith('ir5')) return 'ir-5';
  if (norm.startsWith('ir1') || norm.startsWith('cr1')) return 'ir-1';
  if (norm.startsWith('ir2') || norm.startsWith('cr2')) return 'ir-2';
  if (norm.startsWith('f1')) return 'f-1';
  if (norm.includes('germany')) return 'germany-student-journey';
  return 'ir-1';
}

export default function JdashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { activeCandidate } = useCandidate();

  const activeVisaCategory = activeCandidate?.visaCategory || 'IR-1';
  const categorySlug = useMemo(() => normalizeCategorySlug(activeVisaCategory), [activeVisaCategory]);
  const roadmapData = useMemo(() => resolveRoadmapData(activeVisaCategory), [activeVisaCategory]);

  const { state, actions, isLoaded } = useWizard({
    userId,
    journeyId: categorySlug,
    candidateId: activeCandidate?.id,
    roadmapData,
  });

  // Navigating to a chapter opens the full dedicated journey roadmap at that stage
  const handleSelectChapter = (chapterIdx: number) => {
    actions.setStage(chapterIdx);
    const href = getJourneyHrefByType(activeVisaCategory) || ir1journeyHref;
    router.push(`${href}?stage=${chapterIdx}`);
  };

  const handleSelectStep = (chapterIdx: number, stepIdx: number) => {
    actions.setStage(chapterIdx);
    actions.setCurrentStep(stepIdx);
    const href = getJourneyHrefByType(activeVisaCategory) || ir1journeyHref;
    router.push(`${href}?stage=${chapterIdx}&step=${stepIdx}`);
  };

  const handleLaunchTool = (toolKey: string) => {
    if (toolKey === 'document_vault') {
      const href = getJourneyHrefByType(activeVisaCategory) || ir1journeyHref;
      router.push(`${href}?open=vault`);
    } else {
      router.push(`/tools?tool=${encodeURIComponent(toolKey)}`);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f3f6f9] gap-4">
        <Loader size="lg" />
        <p className="text-[#0d7377] font-medium text-sm">Loading your journey dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#eef3f6] flex items-center justify-center p-2 sm:p-4">
      <RahvanaDashboard
        data={roadmapData}
        state={state}
        actions={actions}
        onSelectChapter={handleSelectChapter}
        onSelectStep={handleSelectStep}
        onLaunchTool={handleLaunchTool}
      />
    </div>
  );
}
