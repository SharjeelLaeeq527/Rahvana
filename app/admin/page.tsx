"use client";

import React from "react";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Loader } from "@/components/ui/spinner";

import TranslationQueueTable from "./components/translation-queue/TranslationQueueTable";
import PoliceVerificationTable from "./components/police-verifications/PoliceVerificationTable";
import BookAppointmentTable from "./components/book-appointment/BookAppointmentTable";
import ConsultationRequestsTable from "./components/consultation-requests/ConsultationRequestsTable";
import AvailabilityGrid from "./components/consultation-requests/AvailabilityGrid";
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
        <div className="">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage appointments, translations, and police verifications
            </p>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Availability Management</h2>
            <AvailabilityGrid />
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Consultation Requests</h2>
            <ConsultationRequestsTable />
          </div>

          <BookAppointmentTable />

          <TranslationQueueTable />

          <PoliceVerificationTable />

          <FeatureAnnouncementModal
            open={openFeatureModal}
            onOpenChange={setOpenFeatureModal}
          />
        </div>
      </main>
    </div>
  );
}
