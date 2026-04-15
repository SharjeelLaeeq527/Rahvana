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
}: WaitingStateCardProps) {
  const iconMap = {
    file: <FileText className="h-5 w-5" />,
    calendar: <Calendar className="h-5 w-5" />,
    clock: <Clock className="h-5 w-5" />,
    check: <CheckCircle className="h-5 w-5" />,
    alert: <AlertTriangle className="h-5 w-5" />,
  };

  const statusColors = {
    complete: "bg-green-50 border-green-200 text-green-900",
    pending: "bg-yellow-50 border-yellow-200 text-yellow-900",
    waiting: "bg-blue-50 border-blue-200 text-blue-900",
    "action-needed": "bg-red-50 border-red-200 text-red-900",
  };

  const badgeColors = {
    complete: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    waiting: "bg-blue-100 text-blue-800",
    "action-needed": "bg-red-100 text-red-800",
  };

  return (
    <Card className={`border-2 ${statusColors[status]} transition-all hover:shadow-md`}>
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
            {date && (
              <p className="text-xs font-medium opacity-70">Date: {date}</p>
            )}

            {/* Action Button */}
            {(actionLabel || showIVToolLink) && (
              <div className="flex gap-2 mt-3">
                {actionLabel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onAction}
                    className="text-xs"
                  >
                    {actionLabel}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
                {actionUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(actionUrl, "_blank")}
                    className="text-xs"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Open Link
                  </Button>
                )}
              </div>
            )}

            {/* IV Wait Times Tool Link */}
            {showIVToolLink && ivEmbassy && (
              <div className="mt-3 p-3 bg-white/50 rounded-lg border border-current">
                <p className="text-xs font-semibold mb-1">
                  📊 Estimated Wait Time at {ivEmbassy}:
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    window.open(`/iv-tool?city=${ivEmbassy}`, "_blank")
                  }
                  className="text-xs p-0 h-auto font-medium"
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
