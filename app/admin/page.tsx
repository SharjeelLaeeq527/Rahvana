
"use client";

import React from "react";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Globe,
  TrendingUp,
  FileText,
  Calendar,
  MessageSquare,
  Languages,
  ShieldCheck,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Loader } from "@/components/ui/spinner";

import TranslationQueueTable from "./components/translation-queue/TranslationQueueTable";
import PoliceVerificationTable from "./components/police-verifications/PoliceVerificationTable";
import BookAppointmentTable from "./components/book-appointment/BookAppointmentTable";
import ConsultationRequestsTable from "./components/consultation-requests/ConsultationRequestsTable";
import AvailabilityGrid from "./components/consultation-requests/AvailabilityGrid";
import VisaCasesTable from "./components/visa-cases/VisaCasesTable";
import CollapsibleSection from "./components/CollapsibleSection";
import { FeatureAnnouncementModal } from "./components/feature-announcement/FeatureAnnouncementModal";

export default function AdminPanel() {
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [openFeatureModal, setOpenFeatureModal] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
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
            <Button onClick={() => router.push("/admin-login")}>
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Admin Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="site-main-px site-main-py">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-foreground">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                <Globe className="h-3.5 w-3.5" />
                Your Time:{" "}
                {new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}
              </span>
              <span className="text-sm text-muted-foreground">
                Admin: {user?.email}
              </span>
              <Link
                href="/admin/dashboard"
                className="text-white bg-teal-600 hover:bg-teal-700 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <TrendingUp className="h-4 w-4" />
                View Analytics
              </Link>
              <button
                onClick={() => setOpenFeatureModal(true)}
                className="text-teal-600 border-2 border-teal-600 hover:bg-teal-100 hover:text-teal-700 rounded-lg p-1"
              >
                Feature Announcement
              </button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="site-main-px py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
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
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Availability Schedule
                </h3>
                <AvailabilityGrid />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
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
            <ConsultationRequestsTable />
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

          <FeatureAnnouncementModal
            open={openFeatureModal}
            onOpenChange={setOpenFeatureModal}
          />
        </div>
      </main>
    </div>
  );
}
