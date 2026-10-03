"use client"; // This component will handle client-side interactions

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bell, BellOff, Check, CheckCheck, Clock, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Notification } from "@/types/notifications";
import {
  fetchAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";

interface AdminNotificationBellProps {
  adminUserId: string; // The ID of the currently logged-in admin
}

export function AdminNotificationBell({ adminUserId }: AdminNotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const loadNotifications = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      const {
        notifications: fetchedNotifications,
        unreadCount: fetchedUnreadCount,
        error,
      } = await fetchAdminNotifications(adminUserId);
      if (error) {
        console.error("Failed to load admin notifications:", error);
      } else {
        setNotifications(fetchedNotifications);
        setUnreadCount(fetchedUnreadCount);
      }
      if (!silent) setIsLoading(false);
    },
    [adminUserId]
  );

  useEffect(() => {
    if (adminUserId) {
      if (isInitialLoad) {
        loadNotifications();
        setIsInitialLoad(false);
      }

      // Connect to Realtime for instant updates
      const supabase = createClient();
      const channel = supabase
        .channel(`admin-notifications-${adminUserId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${adminUserId}`,
          },
          () => {
            loadNotifications(true); // Silent refresh on new notification
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [adminUserId, loadNotifications, isInitialLoad]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    const { success, error } = await markNotificationAsRead(notificationId, adminUserId);
    if (error) {
      console.error("Failed to mark notification as read:", error);
    } else if (success) {
      loadNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    const { success, error } = await markAllNotificationsAsRead(adminUserId);
    if (error) {
      console.error("Failed to mark all as read:", error);
    } else if (success) {
      loadNotifications();
    }
  };

  const getPriorityColorHex = (priority: Notification["priority"]) => {
    switch (priority) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "normal":
        return "bg-blue-500";
      case "low":
        return "bg-slate-300";
      default:
        return "bg-slate-300";
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Bell trigger button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-all flex items-center justify-center focus:outline-none ${isOpen ? "bg-slate-100 text-teal-600" : "hover:bg-slate-100 text-slate-600"}`}
      >
        <Bell className="h-6 w-6" />
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-black border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-3 w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] overflow-hidden origin-top-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm">Admin Alerts</h4>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-bold text-teal-600 hover:text-teal-700 uppercase tracking-tight flex items-center gap-1 transition-colors bg-teal-50 px-2 py-1 rounded-lg"
                >
                  Mark all read <CheckCheck className="h-3 w-3" />
                </button>
              )}
            </div>
            {/* Body */}
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="py-20 text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-medium">Checking for updates...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-20 text-center space-y-3 px-10">
                  <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <BellOff className="text-slate-300 h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">All caught up!</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-[160px] mx-auto">
                    No admin notifications requiring your attention.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      className={`w-full text-left flex items-start gap-4 p-4 transition-all relative group ${
                        notification.status === "unread"
                          ? "bg-white hover:bg-slate-50"
                          : "bg-slate-50/30 hover:bg-slate-50"
                      }`}
                    >
                      {/* Priority Dot */}
                      <div
                        className={`h-2 w-2 rounded-full mt-2 shrink-0 ${getPriorityColorHex(notification.priority)} ${notification.status === "read" ? "opacity-30" : "animate-pulse"}`}
                      />

                      {/* Content */}
                      <div
                        className={`flex-1 min-w-0 ${notification.status === "read" ? "opacity-50" : "opacity-100"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          {(notification.candidate_role || notification.candidate_name) && (
                            <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-teal-500/20 bg-teal-50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-teal-700 uppercase">
                              <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                              {notification.candidate_name && notification.candidate_name !== notification.candidate_role
                                ? `${notification.candidate_role || "Beneficiary"}: ${notification.candidate_name}`
                                : notification.candidate_role || "Beneficiary"}
                            </span>
                          )}
                          {notification.status === "unread" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="shrink-0 p-1 rounded-md hover:bg-teal-100 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[12px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {notification.body}
                        </p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <Clock className="h-3 w-3 text-slate-300" />
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {new Date(notification.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
