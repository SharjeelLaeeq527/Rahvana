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
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyState,
  loading,
  onRowClick,
  rowClassName = "hover:bg-slate-50 border-b border-slate-100",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return emptyState || <div className="text-center py-12">No data found</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-slate-200">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`text-lg font-bold text-slate-800 py-4 ${
                    column.className || ""
                  }`}
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
  );
}
