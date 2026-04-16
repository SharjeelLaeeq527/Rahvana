"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Info,
  Calendar,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { 
  Notification, 
  NotificationType, 
  NOTIFICATION_TEMPLATES 
} from "@/types/notifications";

interface NotificationCenterProps {
  userId?: string;
  journeyId?: string;
  trackingStatus?: Record<string, any>;
  onClose?: () => void;
}

export default function NotificationCenter({ 
  userId, 
  journeyId, 
  trackingStatus 
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate mock notifications based on tracking status for demonstration
  useEffect(() => {
    const mockNotifications: Notification[] = [];
    const now = new Date().toISOString();

    if (trackingStatus?.nvc_review_complete) {
      mockNotifications.push({
        id: "1",
        user_id: userId || "user",
        journey_id: journeyId || "journey",
        type: "nvc_review_complete",
        priority: "high",
        title: NOTIFICATION_TEMPLATES.nvc_review_complete.title,
        body: NOTIFICATION_TEMPLATES.nvc_review_complete.body,
        status: "unread",
        created_at: trackingStatus.nvc_review_date || now,
        action_label: "View Status",
        action_url: "#"
      });
    }

    if (trackingStatus?.dq_status === "qualified") {
      mockNotifications.push({
        id: "2",
        user_id: userId || "user",
        journey_id: journeyId || "journey",
        type: "dq_qualified",
        priority: "critical",
        title: NOTIFICATION_TEMPLATES.dq_qualified.title,
        body: NOTIFICATION_TEMPLATES.dq_qualified.body,
        status: "unread",
        created_at: trackingStatus.dq_date || now,
        action_label: "Ready for Interview",
        action_url: "#"
      });
    }

    if (trackingStatus?.interview_date) {
      mockNotifications.push({
        id: "3",
        user_id: userId || "user",
        journey_id: journeyId || "journey",
        type: "interview_scheduled",
        priority: "critical",
        title: NOTIFICATION_TEMPLATES.interview_scheduled.title,
        body: NOTIFICATION_TEMPLATES.interview_scheduled.body,
        status: "unread",
        created_at: now,
        action_label: "Prepare Now",
        action_url: "#"
      });
    }

    // Daily Reminder during NVC Review
    if (!trackingStatus?.nvc_review_complete && !trackingStatus?.dq_status && trackingStatus?.nvc_case_number) {
      mockNotifications.push({
        id: "4",
        user_id: userId || "user",
        journey_id: journeyId || "journey",
        type: "nvc_check_reminder",
        priority: "normal",
        title: NOTIFICATION_TEMPLATES.nvc_check_reminder.title,
        body: NOTIFICATION_TEMPLATES.nvc_check_reminder.body,
        status: "unread",
        created_at: now,
        action_label: "Open CEAC Portal",
        action_url: "https://ceac.state.gov/IV/Login.aspx"
      });
    }

    setNotifications(mockNotifications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  }, [trackingStatus, userId, journeyId]);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "nvc_review_complete": return <CheckCircle2 className="text-green-500" size={18} />;
      case "dq_qualified": return <CheckCircle2 className="text-teal-500" size={18} />;
      case "interview_scheduled": return <Calendar className="text-blue-500" size={18} />;
      case "administrative_processing": return <Clock className="text-orange-500" size={18} />;
      case "admin_status_update": return <Info className="text-primary" size={18} />;
      default: return <Bell className="text-slate-400" size={18} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#d0e4f7] shadow-2xl w-[360px] animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-5 border-b border-[#d0e4f7]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell size={16} className="text-primary" />
          </div>
          <h2 className="text-[15px] font-black text-[#0c1b33]">Notifications</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">
            {notifications.filter(n => n.status === "unread").length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Bell size={24} className="text-slate-200" />
            </div>
            <h3 className="text-[14px] font-bold text-[#0c1b33] mb-1">All caught up!</h3>
            <p className="text-[12px] text-[#6b8097] leading-relaxed">
              When the embassy or admin team updates your case, you'll see notifications here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#d0e4f7]/50">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-5 transition-colors hover:bg-slate-50 cursor-pointer relative group ${n.status === "unread" ? "bg-primary/5" : ""}`}
              >
                {n.status === "unread" && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                )}
                
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-bold text-[#0c1b33] line-clamp-1">{n.title}</span>
                      <span className="text-[10px] text-[#6b8097] whitespace-nowrap ml-2">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#3a4f63] leading-relaxed mb-3 line-clamp-3">
                      {n.body}
                    </p>
                    
                    {n.action_label && (
                      <button className="flex items-center gap-1 text-[11px] font-black text-primary hover:underline uppercase tracking-wider">
                        {n.action_label}
                        <ChevronRight size={12} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#d0e4f7] bg-slate-50">
        <button className="w-full py-2.5 rounded-lg border border-[#d0e4f7] bg-white text-[12px] font-bold text-[#3a4f63] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
          <span>Mark all as read</span>
        </button>
      </div>
    </div>
  );
}
