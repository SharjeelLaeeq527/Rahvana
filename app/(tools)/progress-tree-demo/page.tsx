"use client";

import React, { useEffect, useState } from "react";
import { ProgressTree, TreeStep } from "@/app/components/progress-tree/ProgressTree";
import { useProgressTreeStore } from "@/lib/progress-tree-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RotateCcw } from "lucide-react";

// Sample data structure for immigration process
const immigrationSteps: TreeStep[] = [
  {
    id: "1",
    title: "File I-130 Petition",
    description: "Submit petition for alien relative",
    status: "completed",
    children: [
      {
        id: "1.1",
        title: "Gather Required Documents",
        description: "Collect marriage certificate, birth certificates, etc.",
        status: "completed",
      },
      {
        id: "1.2",
        title: "Complete Form I-130",
        description: "Fill out the petition form accurately",
        status: "completed",
      },
      {
        id: "1.3",
        title: "Pay Filing Fee",
        description: "Submit payment of $535",
        status: "completed",
      },
      {
        id: "1.4",
        title: "Submit Application",
        description: "Mail or e-file the complete package",
        status: "completed",
      },
    ],
  },
  {
    id: "2",
    title: "NVC Processing",
    description: "National Visa Center case processing",
    status: "in-progress",
    children: [
      {
        id: "2.1",
        title: "Receive NVC Case Number",
        description: "Wait for case number assignment",
        status: "completed",
      },
      {
        id: "2.2",
        title: "Pay AOS and IV Fees",
        description: "Pay $325 + $220 fees online",
        status: "in-progress",
      },
      {
        id: "2.3",
        title: "Submit DS-260",
        description: "Complete online immigrant visa application",
        status: "pending",
      },
      {
        id: "2.4",
        title: "Submit Civil Documents",
        description: "Upload required supporting documents",
        status: "pending",
      },
    ],
  },
  {
    id: "3",
    title: "Medical Examination",
    description: "Complete medical exam with approved physician",
    status: "locked",
    children: [
      {
        id: "3.1",
        title: "Find Panel Physician",
        description: "Locate approved doctor in your area",
        status: "locked",
      },
      {
        id: "3.2",
        title: "Complete Medical Tests",
        description: "Undergo required medical examination",
        status: "locked",
      },
      {
        id: "3.3",
        title: "Obtain Sealed Results",
        description: "Get sealed medical report envelope",
        status: "locked",
      },
    ],
  },
  {
    id: "4",
    title: "Interview Preparation",
    description: "Prepare for visa interview",
    status: "locked",
    children: [
      {
        id: "4.1",
        title: "Schedule Interview",
        description: "Book appointment at embassy/consulate",
        status: "locked",
      },
      {
        id: "4.2",
        title: "Gather Interview Documents",
        description: "Prepare all required documents for interview",
        status: "locked",
      },
      {
        id: "4.3",
        title: "Attend Interview",
        description: "Attend visa interview appointment",
        status: "locked",
      },
    ],
  },
  {
    id: "5",
    title: "Visa Approval & Travel",
    description: "Receive visa and travel to USA",
    status: "locked",
  },
];

export default function ProgressTreeDemoPage() {
  const { steps, setSteps, toggleStepCompletion, resetProgress, getStepById } =
    useProgressTreeStore();
  const [selectedStep, setSelectedStep] = useState<TreeStep | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Initialize steps if empty
    if (steps.length === 0) {
      setSteps(immigrationSteps);
    }
  }, [steps.length, setSteps]);

  const handleStepClick = (step: TreeStep) => {
    setSelectedStep(step);
    setShowDialog(true);
  };

  const handleToggleCompletion = () => {
    if (selectedStep && selectedStep.status !== "locked") {
      toggleStepCompletion(selectedStep.id);
      // Update the selected step with new data
      const updatedStep = getStepById(selectedStep.id);
      setSelectedStep(updatedStep);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all progress?")) {
      resetProgress();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Immigration Progress Tracker</h1>
            <p className="text-gray-600 mt-2">
              Track your spousal visa application progress step by step
            </p>
          </div>
          <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset Progress
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <ProgressTree
          steps={steps.length > 0 ? steps : immigrationSteps}
          onStepClick={handleStepClick}
          showProgress={true}
        />
      </Card>

      {/* Step Detail Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedStep?.title}</DialogTitle>
            {selectedStep?.description && (
              <DialogDescription className="text-base">
                {selectedStep.description}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  selectedStep?.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : selectedStep?.status === "in-progress"
                      ? "bg-blue-100 text-blue-800"
                      : selectedStep?.status === "locked"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-gray-100 text-gray-600"
                }`}
              >
                {selectedStep?.status === "completed"
                  ? "Completed"
                  : selectedStep?.status === "in-progress"
                    ? "In Progress"
                    : selectedStep?.status === "locked"
                      ? "Locked"
                      : "Pending"}
              </span>
            </div>

            {/* Children steps */}
            {selectedStep?.children && selectedStep.children.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Sub-steps:</h4>
                <ul className="space-y-2">
                  {selectedStep.children.map((child) => (
                    <li key={child.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 ${
                          child.status === "completed"
                            ? "bg-green-500"
                            : child.status === "in-progress"
                              ? "bg-blue-500"
                              : "bg-gray-300"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-sm text-gray-900">{child.title}</p>
                        {child.description && (
                          <p className="text-xs text-gray-600 mt-1">{child.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Tip</h4>
              <p className="text-sm text-blue-800">
                Click on any step to view details and mark it as complete. Parent steps will
                automatically be marked complete when all sub-steps are finished.
              </p>
            </div>
          </div>

          <DialogFooter>
            {selectedStep?.status !== "locked" && (
              <Button
                onClick={handleToggleCompletion}
                variant={selectedStep?.status === "completed" ? "outline" : "default"}
              >
                {selectedStep?.status === "completed" ? "Mark as Incomplete" : "Mark as Complete"}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info cards */}
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">📋 Interactive</h3>
          <p className="text-sm text-gray-600">
            Click on any step to view details and toggle completion status
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">🌲 Hierarchical</h3>
          <p className="text-sm text-gray-600">
            Organize steps with parent-child relationships for complex processes
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">💾 Persistent</h3>
          <p className="text-sm text-gray-600">
            Your progress is automatically saved and restored between sessions
          </p>
        </Card>
      </div>
    </div>
  );
}
