"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Eye,
  MousePointerClick,
  Activity,
  ArrowLeft,
  TrendingUp,
  Clock,
  Globe,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnalyticsData {
  realtime: {
    activeUsers: string;
  };
  headers: string[];
  rows: Array<{
    date: string;
    metrics: string[];
  }>;
  totals: string[];
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("this-week");

  const periods = [
    { value: "today", label: "Today" },
    { value: "this-week", label: "This week" },
    { value: "last-week", label: "Last week" },
    { value: "this-month", label: "This month" },
    { value: "last-month", label: "Last month" },
    { value: "this-year", label: "This year" },
    { value: "last-year", label: "Last year" },
  ];

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await fetch(`/api/analytics?period=${period}`);
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [period]);

  // Map metric names to icons and friendly labels
  const metricMap: Record<string, { label: string; icon: any; color: string }> =
    {
      activeUsers: {
        label: "Active Users",
        icon: Users,
        color: "text-blue-600",
      },
      sessions: { label: "Sessions", icon: Activity, color: "text-green-600" },
      screenPageViews: {
        label: "Page Views",
        icon: Eye,
        color: "text-purple-600",
      },
      eventCount: {
        label: "Events",
        icon: MousePointerClick,
        color: "text-orange-600",
      },
    };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Admin Panel
            </Link>
            <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-teal-600" />
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Performance metrics and live activity for Rahvana.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            {/* Period Selector */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1 shadow-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px] border-none shadow-none focus:ring-0">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Live Indicator */}
            {/* <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 px-4 py-3 rounded-2xl">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-teal-900 leading-none">
                  {data?.realtime.activeUsers || "0"}
                </span>
                <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider mt-0.5">
                  Live Now
                </span>
              </div>
            </div> */}
          </div>
        </div>

        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <Loader size="lg" text="Updating results..." />
          </div>
        ) : error ? (
          <div className="py-20 flex flex-col items-center justify-center bg-background">
            <Card className="max-w-md w-full border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  Error Fetching Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 mb-6">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {data?.headers.map((header, index) => {
                const config = metricMap[header] || {
                  label: header,
                  icon: Activity,
                  color: "text-gray-600",
                };
                const Icon = config.icon;

                return (
                  <Card
                    key={header}
                    className="overflow-hidden border-border bg-card hover:border-teal-300 transition-all duration-300"
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {config.label}
                      </CardTitle>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">
                        {Number(data.totals?.[index] || 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {periods.find((p) => p.value === period)?.label}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Date Table */}
            <Card className="border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="border-b border-border bg-muted/30">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                    Traffic Overview
                  </CardTitle>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    Daily Breakdown
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {data && data.rows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <th className="px-6 py-4">Date</th>
                          {data.headers.map((header) => (
                            <th key={header} className="px-6 py-4">
                              {metricMap[header]?.label || header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[...(data.rows || [])].reverse().map((row, i) => (
                          <tr
                            key={i}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-foreground">
                              {row.date
                                ? `${row.date.substring(0, 4)}-${row.date.substring(4, 6)}-${row.date.substring(6, 8)}`
                                : "N/A"}
                            </td>
                            {row.metrics?.map((m, j) => (
                              <td
                                key={j}
                                className="px-6 py-4 text-sm text-foreground"
                              >
                                {Number(m || 0).toLocaleString()}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                    <Globe className="h-10 w-10 mb-2 opacity-20" />
                    <p>No traffic data available for this range.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
