"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader } from "@/components/ui/spinner";

export interface Column<T> {
  key: string;
  label: string;
  width?: string;
  render: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (item: T, index: number) => string | number;
  emptyState?: React.ReactNode;
  loading?: boolean;
  refreshing?: boolean;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyState,
  loading,
  refreshing = false,
  onRowClick,
  rowClassName = "hover:bg-slate-50 border-b border-slate-100",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return emptyState || <div className="py-12 text-center">No data found</div>;
  }

  return (
    <div className="relative overflow-visible rounded-xl border border-slate-200 bg-white shadow-lg">
      {refreshing && (
        <div className="pointer-events-none absolute top-3 right-4 z-20 flex items-center gap-2 rounded-full border border-teal-100 bg-white px-3 py-1.5 text-xs font-medium text-teal-700 shadow-sm">
          <Loader size="sm" />
          <span className="hidden lg:inline">Updating...</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-full overflow-visible">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-slate-200">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={`py-4 text-lg font-bold text-slate-800 ${column.className || ""}`}
                    style={column.width ? { width: column.width } : {}}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.map((item, index) => (
                <TableRow
                  key={rowKey(item, index)}
                  className={rowClassName}
                  onClick={() => onRowClick?.(item, index)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={`${rowKey(item, index)}-${column.key}`}
                      className={`py-5 ${column.className || ""}`}
                    >
                      {column.render(item, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
