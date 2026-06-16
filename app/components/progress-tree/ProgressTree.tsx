"use client";

import React, { useState } from "react";
import { Check, ChevronDown, ChevronRight, Circle, CheckCircle2, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "completed" | "in-progress" | "pending" | "locked";

export interface TreeStep {
  id: string;
  title: string;
  description?: string;
  status: StepStatus;
  children?: TreeStep[];
  onClick?: () => void;
}

interface ProgressTreeProps {
  steps: TreeStep[];
  onStepClick?: (step: TreeStep) => void;
  className?: string;
  showProgress?: boolean;
}

const getStatusIcon = (status: StepStatus) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case "in-progress":
      return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
    case "locked":
      return <Lock className="w-5 h-5 text-gray-400" />;
    default:
      return <Circle className="w-5 h-5 text-gray-400" />;
  }
};

const getStatusColor = (status: StepStatus) => {
  switch (status) {
    case "completed":
      return "border-green-500 bg-green-50";
    case "in-progress":
      return "border-blue-500 bg-blue-50";
    case "locked":
      return "border-gray-300 bg-gray-50";
    default:
      return "border-gray-300 bg-white";
  }
};

const TreeNode: React.FC<{
  step: TreeStep;
  level: number;
  onStepClick?: (step: TreeStep) => void;
  isLast?: boolean;
}> = ({ step, level, onStepClick, isLast = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = !!(step.children && step.children.length > 0);

  const handleClick = () => {
    if (step.onClick) {
      step.onClick();
    }
    if (onStepClick) {
      onStepClick(step);
    }
  };

  return (
    <div className="relative">
      {/* Tree branch connector */}
      {level > 0 && (
        <>
          {/* Horizontal line */}
          <div
            className="absolute left-0 top-6 w-6 h-px bg-gray-300"
            style={{ left: `${(level - 1) * 24}px` }}
          />
          {/* Vertical line */}
          {!isLast && (
            <div
              className="absolute top-6 bottom-0 w-px bg-gray-300"
              style={{ left: `${(level - 1) * 24}px` }}
            />
          )}
        </>
      )}

      {/* Step content */}
      <div
        className={cn(
          "flex items-start gap-3 mb-2 p-3 rounded-lg border-2 transition-all",
          getStatusColor(step.status),
          step.status !== "locked" && "cursor-pointer hover:shadow-md",
          "relative"
        )}
        style={{ marginLeft: `${level * 24}px` }}
        onClick={step.status !== "locked" ? handleClick : undefined}
      >
        {/* Expand/Collapse button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Status icon */}
        <div className="shrink-0 mt-0.5">{getStatusIcon(step.status)}</div>

        {/* Step details */}
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              "font-semibold text-sm",
              step.status === "completed" && "text-green-700",
              step.status === "in-progress" && "text-blue-700",
              step.status === "locked" && "text-gray-400"
            )}
          >
            {step.title}
          </h4>
          {step.description && (
            <p
              className={cn(
                "text-xs mt-1",
                step.status === "locked" ? "text-gray-400" : "text-gray-600"
              )}
            >
              {step.description}
            </p>
          )}
        </div>

        {/* Completion badge */}
        {step.status === "completed" && (
          <div className="shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              <Check className="w-3 h-3" />
              Done
            </span>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {step.children!.map((child, index) => (
            <TreeNode
              key={child.id}
              step={child}
              level={level + 1}
              onStepClick={onStepClick}
              isLast={index === step.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const calculateProgress = (steps: TreeStep[]): { completed: number; total: number } => {
  let completed = 0;
  let total = 0;

  const traverse = (items: TreeStep[]) => {
    items.forEach((item) => {
      if (!item.children || item.children.length === 0) {
        total++;
        if (item.status === "completed") {
          completed++;
        }
      }
      if (item.children) {
        traverse(item.children);
      }
    });
  };

  traverse(steps);
  return { completed, total };
};

export const ProgressTree: React.FC<ProgressTreeProps> = ({
  steps,
  onStepClick,
  className,
  showProgress = true,
}) => {
  const { completed, total } = calculateProgress(steps);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress header */}
      {showProgress && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">Overall Progress</h3>
            <span className="text-sm font-medium text-gray-600">
              {completed} of {total} steps completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
              style={{ width: `${percentage}%` }}
            >
              {percentage > 10 && (
                <span className="text-white text-xs font-bold">{percentage}%</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tree structure */}
      <div className="space-y-1">
        {steps.map((step, index) => (
          <TreeNode
            key={step.id}
            step={step}
            level={0}
            onStepClick={onStepClick}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
};
