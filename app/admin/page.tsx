"use client";

import React from "react";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Globe,
  FileText,
  Calendar,
  MessageSquare,
  Languages,
  ShieldCheck,
  Clock,
  Star,
  Trash2,
} from "lucide-react";
import { Loader } from "@/components/ui/spinner";

import TranslationQueueTable from "./components/translation-queue/TranslationQueueTable";
import { AdminNotificationBell } from "@/lib/AdminNotificationBell";
import PoliceVerificationTable from "./components/police-verifications/PoliceVerificationTable";
import BookAppointmentTable from "./components/book-appointment/BookAppointmentTable";
import ConsultationRequestsTable from "./components/consultation-requests/ConsultationRequestsTable";
import AvailabilityGrid from "./components/consultation-requests/AvailabilityGrid";
import VisaCasesTable from "./components/visa-cases/VisaCasesTable";
import CollapsibleSection from "./components/CollapsibleSection";
import ReviewsTable from "./components/reviews/ReviewsTable";
import BlogCommentsTable from "./components/blog-comments/BlogCommentsTable";
import { FeatureAnnouncementModal } from "./components/feature-announcement/FeatureAnnouncementModal";
import { BlogAnnouncementModal } from "./components/blog-announcement/BlogAnnouncementModal";
import AccountDeletionFeedbackTable from "./components/account-deletion-feedback/AccountDeletionFeedbackTable";
import { AdminProfileTray } from "./components/AdminProfileTray";

export default function AdminPanel() {
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [openFeatureModal, setOpenFeatureModal] = useState(false);
  const [openBlogModal, setOpenBlogModal] = useState(false);

  const handleLogout = async () => {
    try {
      // Call the admin logout API
      const response = await fetch("/api/admin/logout", {
        method: "POST",
      });

      if (!response.ok) {
        console.error("Admin logout failed");
      }
    } catch (err) {
      console.error("Error during admin logout:", err);
    } finally {
      // Sign out from the auth context
      await signOut();
      // Redirect to admin login
      router.push("/admin-login");
    }
  };

  if (authLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-6">
        <Loader size="md" text="Checking authorization..." />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="bg-background p-6">
        <Card className="">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You do not have permission to access the admin panel.
            </p>
            <Button onClick={() => router.push("/admin-login")}>Go to Admin Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Admin Header */}
      <header className="bg-card border-border border-b shadow-sm">
        <div className="site-main-px site-main-py">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-foreground text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-800">
                <Globe className="h-3.5 w-3.5" />
                Your Time:{" "}
                {new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}
              </span>
              <AdminNotificationBell adminUserId={user.id} />
              <AdminProfileTray
                userEmail={user?.email}
                onOpenFeatureModal={() => setOpenFeatureModal(true)}
                onOpenBlogModal={() => setOpenBlogModal(true)}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="site-main-px py-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-foreground text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage visa cases, appointments, consultations, and platform operations
            </p>
          </div>

          {/* Section 1: Visa Journey Management */}
          <CollapsibleSection
            title="Visa Cases Management"
            icon={<FileText className="h-5 w-5" />}
            description="Track and manage user visa applications through NVC, CEAC, and embassy processing"
            badge="NEW"
            badgeColor="bg-blue-100 text-blue-800"
            defaultOpen={true}
          >
            <VisaCasesTable />
          </CollapsibleSection>

          {/* Section 2: Appointment Management */}
          <CollapsibleSection
            title="Appointment Management"
            icon={<Calendar className="h-5 w-5" />}
            description="Manage consultation bookings and appointment availability"
          >
            <div className="space-y-6">
              {/* <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Availability Schedule
                </h3>
                <AvailabilityGrid />
              </div> */}
              <div>
                <h3 className="mb-4 flex items-center gap-2 pt-4 text-lg font-semibold">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  Booked Appointments
                </h3>
                <BookAppointmentTable />
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 3: Consultation Requests */}
          <CollapsibleSection
            title="Consultation Requests"
            icon={<MessageSquare className="h-5 w-5" />}
            description="Review and manage user consultation requests"
          >
            <div className="space-y-6">
              <div className="mt-4">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  Availability Schedule
                </h3>
                <AvailabilityGrid />
              </div>
              <ConsultationRequestsTable />
            </div>
          </CollapsibleSection>

          {/* Section 4: Translation Queue */}
          <CollapsibleSection
            title="Translation Queue"
            icon={<Languages className="h-5 w-5" />}
            description="Process pending document translations"
          >
            <TranslationQueueTable />
          </CollapsibleSection>

          {/* Section 5: Police Verifications */}
          <CollapsibleSection
            title="Police Verifications"
            icon={<ShieldCheck className="h-5 w-5" />}
            description="Manage police clearance certificate verifications"
          >
            <PoliceVerificationTable />
          </CollapsibleSection>

          {/* Section 6: Tool Reviews */}
          <CollapsibleSection
            title="Tool Reviews"
            icon={<Star className="h-5 w-5" />}
            description="Approve, reject, or remove user-submitted reviews for individual tools"
            badge="MODERATION"
            badgeColor="bg-amber-100 text-amber-800"
          >
            <ReviewsTable />
          </CollapsibleSection>

          {/* Section 7: Blog Comments */}
          <CollapsibleSection
            title="Blog Comments"
            icon={<MessageSquare className="h-5 w-5" />}
            description="Moderate, hide, or permanently remove user comments and replies across all blog articles"
            badge="MODERATION"
            badgeColor="bg-teal-100 text-teal-800"
          >
            <BlogCommentsTable />
          </CollapsibleSection>

          {/* Section 8: Account Deletion Feedback */}
          <CollapsibleSection
            title="Account Deletion Feedback"
            icon={<Trash2 className="h-5 w-5" />}
            description="Review and manage feedback from users who have deleted their accounts"
            badge="MODERATION"
            badgeColor="bg-teal-100 text-teal-800"
          >
            <AccountDeletionFeedbackTable />
          </CollapsibleSection>

          <FeatureAnnouncementModal open={openFeatureModal} onOpenChange={setOpenFeatureModal} />
          <BlogAnnouncementModal open={openBlogModal} onOpenChange={setOpenBlogModal} />
        </div>
      </main>
    </div>
  );
}
