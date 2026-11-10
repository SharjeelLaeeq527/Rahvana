"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Languages,
  RefreshCw,
} from "lucide-react";
import { ADMIN_DOCUMENT_TEMPLATES } from "../components/AdminProfileTray";

const TEMPLATE_DIR = "/document-templates";

function templateSrc(file: string) {
  return `${TEMPLATE_DIR}/${file}`;
}

export default function DocumentTemplatesPage() {
  const { user, isAdmin, isLoading: authLoading, isAdminLoading } = useAuth();
  const router = useRouter();

  const [selectedKey, setSelectedKey] = useState<string>("birth-certificate");
  const [frameKey, setFrameKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);

  // Pick up ?template=... from the profile-tray links without useSearchParams
  // (avoids the Suspense/CSR-bailout requirement on static rendering).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("template");
    const match = ADMIN_DOCUMENT_TEMPLATES.find((t) => t.key === param);
    if (match) setSelectedKey(match.key);
  }, []);

  const selected = useMemo(
    () =>
      ADMIN_DOCUMENT_TEMPLATES.find((t) => t.key === selectedKey) ??
      ADMIN_DOCUMENT_TEMPLATES[0],
    [selectedKey]
  );

  const src = templateSrc(selected.file);

  const handleSelect = (key: string) => {
    setSelectedKey(key);
    setIframeLoading(true);
    setFrameKey((k) => k + 1);
    // Keep the URL shareable/bookmarkable
    router.replace(`/admin/document-templates?template=${key}`, { scroll: false });
  };

  if (authLoading || isAdminLoading) {
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
              You do not have permission to access document templates.
            </p>
            <Button onClick={() => router.push("/admin-login")}>Go to Admin Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen site-main-px site-main-py">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center text-sm transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Admin Panel
          </Link>
          <h1 className="text-foreground flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Languages className="h-7 w-7 text-teal-600" />
            True Translation Document Templates
          </h1>
          <p className="text-muted-foreground mt-2">
            Editable civil-document translation templates. Fields are directly editable —
            use the print button inside each template to produce the certified output.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-border bg-card shadow-sm hover:bg-muted"
            onClick={() => {
              setIframeLoading(true);
              setFrameKey((k) => k + 1);
            }}
          >
            <RefreshCw className="mr-1.5 h-4 w-4 text-teal-600" />
            Reload
          </Button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-40 items-center rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <ExternalLink className="mr-1.5 h-4 w-4 text-teal-600" />
            Open in New Tab
          </a>
        </div>
      </div>

      {/* Template selector */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ADMIN_DOCUMENT_TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          const isSelected = tpl.key === selected.key;
          return (
            <button
              key={tpl.key}
              onClick={() => handleSelect(tpl.key)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left shadow-sm transition-all",
                isSelected
                  ? "border-teal-500 bg-teal-50/60 ring-1 ring-teal-500/30"
                  : "border-border bg-card hover:border-teal-300 hover:bg-muted/40"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card border border-border shadow-sm",
                  isSelected && "border-teal-200"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5", tpl.iconColor)} />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-sm font-semibold",
                    isSelected ? "text-teal-800" : "text-foreground"
                  )}
                >
                  {tpl.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {isSelected ? "Currently open" : "Click to open"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Template viewer — renders the HTML template exactly as designed */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/30 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-teal-600" />
              {selected.label} — True Translation
            </CardTitle>
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-widest hidden sm:block">
              Editable · Print-ready
            </span>
          </div>
        </CardHeader>
        <CardContent className="relative p-0">
          {iframeLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
              <Loader size="sm" text="Loading template..." />
            </div>
          )}
          <iframe
            key={`${selected.key}-${frameKey}`}
            src={src}
            title={`${selected.label} True Translation Template`}
            onLoad={() => setIframeLoading(false)}
            className="h-[calc(100vh-220px)] min-h-[640px] w-full border-0 bg-white"
          />
        </CardContent>
      </Card>
    </div>
  );
}
