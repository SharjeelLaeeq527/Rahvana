"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

interface WaitingStateCardProps {
  icon: "file" | "calendar" | "clock" | "check" | "alert";
  title: string;
  description: string;
  date?: string;
  status?: "complete" | "pending" | "waiting" | "action-needed";
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
  showIVToolLink?: boolean;
  ivEmbassy?: string;
  className?: string; // Support for grid spans and other custom styling
}

export default function WaitingStateCard({
  icon,
  title,
  description,
  date,
  status = "pending",
  actionLabel,
  actionUrl,
  onAction,
  showIVToolLink,
  ivEmbassy,
  className,
}: WaitingStateCardProps) {
  const iconMap = {
    file: <FileText className="h-5 w-5" />,
    calendar: <Calendar className="h-5 w-5" />,
    clock: <Clock className="h-5 w-5" />,
    check: <CheckCircle className="h-5 w-5" />,
    alert: <AlertTriangle className="h-5 w-5" />,
  };

  const statusColors = {
    complete: "bg-white border-[#afdbdb] text-slate-900",
    pending: "bg-white border-[#cdadcc] text-slate-900",
    waiting: "bg-white border-[#a8d4d5] text-slate-900",
    "action-needed": "bg-white border-[#db8090] text-slate-900",
  };

  const badgeColors = {
    complete: "bg-[#e6f5f5] text-[#095c5f] border border-[#a8d4d5]/50",
    pending: "bg-[#f5eef5] text-[#6b4566] border border-[#d5c0d3]/50",
    waiting: "bg-[#e6f5f5] text-[#095c5f] border border-[#a8d4d5]/50",
    "action-needed": "bg-[#fbe8ec] text-[#7a3a4a] border border-[#f0c8d0]/50",
  };

  return (
    <Card
      className={`border-2 ${statusColors[status]} transition-all hover:shadow-md h-full ${className || ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">{iconMap[icon]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">{title}</h4>
              <Badge className={`text-xs ${badgeColors[status]}`}>
                {status === "complete"
                  ? "Complete"
                  : status === "waiting"
                    ? "Waiting"
                    : status === "action-needed"
                      ? "Action Needed"
                      : "Pending"}
              </Badge>
            </div>
            <p className="text-xs opacity-80 mb-2">{description}</p>
            {date && <p className="text-xs font-medium opacity-70">Date: {date}</p>}

            {/* Action Button */}
            {(actionLabel || showIVToolLink) && (
              <div className="flex gap-2 mt-3">
                {actionLabel && (
                  <Button
                    size="sm"
                    onClick={onAction}
                    className="text-xs bg-[#0d7377] text-white border-0 hover:bg-[#095c5f] hover:text-white shadow-sm"
                  >
                    {actionLabel}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
                {actionUrl && (
                  <Button
                    size="sm"
                    onClick={() => window.open(actionUrl, "_blank")}
                    className="text-xs bg-[#0d7377] text-white border-0 hover:bg-[#095c5f] hover:text-white shadow-sm"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Open Link
                  </Button>
                )}
              </div>
            )}

            {/* IV Wait Times Tool Link */}
            {showIVToolLink && ivEmbassy && (
              <div className="mt-3 p-3 bg-[#f7fafa] rounded-xl border border-[#e0eded]">
                <p className="text-xs font-semibold mb-1 text-slate-700">
                  📊 Estimated Wait Time at {ivEmbassy}:
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(`/iv-tool?city=${ivEmbassy}`, "_blank")}
                  className="text-xs p-0 h-auto font-semibold text-[#0d7377] hover:text-[#095c5f] hover:bg-[#0d7377]/8"
                >
                  View IV Wait Times <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
