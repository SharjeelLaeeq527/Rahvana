'use client';

import { useEffect, useRef } from 'react';
import './rahvana-dashboard.css';
import { DASHBOARD_HTML } from './dashboard-markup';
import { mountDashboard } from './dashboard-engine';
import { buildDashboardOptions } from './useJourneyDashboardBridge';
import type { DashboardOptions } from './types';

export interface RahvanaDashboardProps {
  data?: any;
  state?: any;
  actions?: any;
  onSelectChapter?: (idx: number) => void;
  onSelectStep?: (chapterIdx: number, stepIdx: number) => void;
  onLaunchTool?: (toolKey: string) => void;
  options?: DashboardOptions;
}

/**
 * Rahvana redesigned Journey Dashboard (v71 data-linked).
 *
 * Can run standalone with mock fallback, or receives real journey data,
 * state, actions, and callbacks to dynamically display live journey progress,
 * Case Strength, tracking, milestones, and alerts.
 */
export default function RahvanaDashboard(props: RahvanaDashboardProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.innerHTML = DASHBOARD_HTML;

    let finalOptions: DashboardOptions = props.options ? { ...props.options } : {};
    if (props.data && props.state) {
      const bridged = buildDashboardOptions({
        data: props.data,
        state: props.state,
        actions: props.actions,
        receiptRecord: props.options?.receiptRecord,
        tier: props.options?.tier,
        onSelectChapter: props.onSelectChapter,
        onSelectStep: props.onSelectStep,
        onLaunchTool: props.onLaunchTool,
        onOpenCaseStrength: props.options?.onOpenCaseStrength,
      });
      finalOptions = {
        ...bridged,
        ...props.options,
        onSelectChapter: props.onSelectChapter ?? props.options?.onSelectChapter ?? bridged.onSelectChapter,
        onSelectStep: props.onSelectStep ?? props.options?.onSelectStep ?? bridged.onSelectStep,
        onLaunchTool: props.onLaunchTool ?? props.options?.onLaunchTool ?? bridged.onLaunchTool,
        onOpenCaseStrength: props.options?.onOpenCaseStrength ?? bridged.onOpenCaseStrength,
      };
    } else {
      if (props.onSelectChapter) finalOptions.onSelectChapter = props.onSelectChapter;
      if (props.onSelectStep) finalOptions.onSelectStep = props.onSelectStep;
      if (props.onLaunchTool) finalOptions.onLaunchTool = props.onLaunchTool;
      if (props.options?.onOpenCaseStrength) finalOptions.onOpenCaseStrength = props.options.onOpenCaseStrength;
    }

    const dispose = mountDashboard(root, finalOptions);
    return () => {
      dispose();
      root.innerHTML = '';
    };
  }, [
    props.data,
    props.state?.currentStage,
    props.state?.currentStep,
    props.state?.completedSteps?.size,
    props.state?.metadata,
    props.options,
  ]);

  return <div ref={rootRef} className="rv-root" />;
}
