"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Calendar as CalendarIcon, Save, Trash2, Edit2 } from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Slot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "available" | "unavailable" | "pending" | "confirmed";
}

interface ProcessedSlot extends Slot {
  localStart: Date;
  localEnd: Date;
  localDateLabel: string;
}

const AvailabilityGrid = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New slot form state
  const [newSlot, setNewSlot] = useState({
    date: new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "10:00",
  });
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Edit slot modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeSlotToEdit, setActiveSlotToEdit] = useState<ProcessedSlot | null>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
    status: "available" as "available" | "unavailable" | "pending" | "confirmed",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalDeleting, setModalDeleting] = useState(false);
  const [modalErrorMsg, setModalErrorMsg] = useState<string | null>(null);

  // Helper to add 30 minutes to a time string ("HH:mm")
  const add30Minutes = (timeStr: string): string => {
    if (!timeStr) return "";
    const [hStr, mStr] = timeStr.split(":");
    let h = parseInt(hStr, 10);
    let m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return "";

    m += 30;
    if (m >= 60) {
      m -= 60;
      h = (h + 1) % 24;
    }

    const hOut = h.toString().padStart(2, "0");
    const mOut = m.toString().padStart(2, "0");
    return `${hOut}:${mOut}`;
  };

  // Helper to check if end time is before start time
  const isTimeBefore = (start: string, end: string): boolean => {
    if (!start || !end) return false;
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    
    if (endH < startH) return true;
    if (endH === startH && endM < startM) return true;
    return false;
  };

  // Handlers for New Slot
  const handleNewSlotStartChange = (val: string) => {
    const autoEnd = add30Minutes(val);
    setNewSlot((prev) => ({
      ...prev,
      start_time: val,
      end_time: autoEnd,
    }));
    
    // Clear any previous error if the new time range is valid
    if (statusMsg && !isTimeBefore(val, autoEnd)) {
      setStatusMsg(null);
    }
  };

  const handleNewSlotEndChange = (val: string) => {
    setNewSlot((prev) => ({
      ...prev,
      end_time: val,
    }));
    
    if (isTimeBefore(newSlot.start_time, val)) {
      setStatusMsg({
        type: "error",
        text: "Validation Error: End time cannot be before the start time.",
      });
    } else if (statusMsg?.text.includes("End time")) {
      setStatusMsg(null);
    }
  };

  // Handlers for Edit Slot
  const handleEditSlotStartChange = (val: string) => {
    const autoEnd = add30Minutes(val);
    setEditForm((prev) => ({
      ...prev,
      start_time: val,
      end_time: autoEnd,
    }));
    
    if (modalErrorMsg && !isTimeBefore(val, autoEnd)) {
      setModalErrorMsg(null);
    }
  };

  const handleEditSlotEndChange = (val: string) => {
    setEditForm((prev) => ({
      ...prev,
      end_time: val,
    }));
    
    if (isTimeBefore(editForm.start_time, val)) {
      setModalErrorMsg("Validation Error: End time cannot be before the start time.");
    } else {
      setModalErrorMsg(null);
    }
  };

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/consultation/slots");
      if (response.ok) {
        const data = await response.json();
        setSlots(data);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  // Helper to convert UTC strings to Local Date for display
  const utcToLocal = (dateStr: string, timeStr: string) => {
    // The API returns times in UTC, so we treat them as UTC and convert to user's local time
    // Using the 'Z' suffix tells JavaScript this is a UTC time
    return new Date(`${dateStr}T${timeStr}Z`);
  };

  // Helper to convert Local strings to UTC (for saving)
  const localToUtc = (dateStr: string, timeStr: string) => {
    // Create a date object using the local date and time
    // This interprets the date/time as being in the user's local timezone
    const localDateTime = new Date(`${dateStr}T${timeStr}`);

    // Convert to UTC by getting the ISO string and extracting the date and time parts
    const utcISOString = localDateTime.toISOString();
    const [utcDatePart, timePartWithMs] = utcISOString.split("T");
    const [utcTimePart] = timePartWithMs.split("."); // Remove milliseconds part

    // Extract just hours and minutes
    const [hours, minutes] = utcTimePart.split(":");
    const utcTime = `${hours}:${minutes}`;

    return { date: utcDatePart, time: utcTime };
  };

  const handleAddSlot = async (e: React.MouseEvent) => {
    if (e) e.preventDefault();
    setStatusMsg(null);

    if (isTimeBefore(newSlot.start_time, newSlot.end_time)) {
      setStatusMsg({
        type: "error",
        text: "Validation Error: End time cannot be before the start time.",
      });
      return;
    }

    setSaving(true);
    console.log("Original local slot data:", newSlot);
    const utcData = localToUtc(newSlot.date, newSlot.start_time);
    // Approximate end time by adding 1 hour to start time in UTC logic
    const utcEnd = localToUtc(newSlot.date, newSlot.end_time);

    try {
      const response = await fetch("/api/consultation/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: utcData.date,
          start_time: utcData.time,
          end_time: utcEnd.time,
          status: "available",
          max_bookings: 1,
          current_bookings: 0,
        }),
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (response.ok) {
        setStatusMsg({ type: "success", text: "Slot created successfully!" });
        fetchSlots();
        // Reset form to next hour for easy batch adding
        const [h] = newSlot.start_time.split(":").map(Number);
        const nextH = (h + 1) % 24;
        const nextHStr = nextH.toString().padStart(2, "0");
        const endHStr = ((nextH + 1) % 24).toString().padStart(2, "0");
        setNewSlot((prev) => ({
          ...prev,
          start_time: `${nextHStr}:00`,
          end_time: `${endHStr}:00`,
        }));
      } else {
        const errorText = data.details
          ? `${data.error}: ${data.details}`
          : `Failed: ${data.error || "Unknown error"}`;
        setStatusMsg({ type: "error", text: errorText });
      }
    } catch (error: unknown) {
      console.error("Error adding slot:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setStatusMsg({ type: "error", text: "Network Error: " + errorMessage });
    } finally {
      setSaving(false);
    }
  };

  // Open edit modal
  const handleOpenEditModal = (slot: ProcessedSlot) => {
    setActiveSlotToEdit(slot);
    
    // Extract local date and times safely
    const localDateStr = slot.localStart.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const localStartStr = slot.localStart.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const localEndStr = slot.localEnd.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    setEditForm({
      date: localDateStr,
      start_time: localStartStr,
      end_time: localEndStr,
      status: slot.status,
    });
    setModalErrorMsg(null);
    setShowDeleteConfirm(false);
    setIsEditModalOpen(true);
  };

  // Update time slot
  const handleUpdateSlot = async () => {
    if (!activeSlotToEdit) return;
    setModalErrorMsg(null);

    if (isTimeBefore(editForm.start_time, editForm.end_time)) {
      setModalErrorMsg("Validation Error: End time cannot be before the start time.");
      return;
    }

    setModalSaving(true);
    setStatusMsg(null);

    // Convert local inputs back to UTC for Supabase
    const utcData = localToUtc(editForm.date, editForm.start_time);
    const utcEnd = localToUtc(editForm.date, editForm.end_time);

    try {
      const response = await fetch(`/api/consultation/slots?id=${activeSlotToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeSlotToEdit.id,
          date: utcData.date,
          start_time: utcData.time,
          end_time: utcEnd.time,
          status: editForm.status,
        }),
      });

      if (response.ok) {
        setStatusMsg({ type: "success", text: "Slot updated successfully!" });
        setIsEditModalOpen(false);
        fetchSlots();
      } else {
        const data = await response.json();
        setStatusMsg({ type: "error", text: data.error || "Failed to update slot" });
      }
    } catch (error) {
      console.error("Error updating slot:", error);
      setStatusMsg({ type: "error", text: "Network error updating slot" });
    } finally {
      setModalSaving(false);
    }
  };

  // Delete time slot
  const handleDeleteSlot = async () => {
    if (!activeSlotToEdit) return;
    setModalDeleting(true);
    setStatusMsg(null);

    try {
      const response = await fetch(`/api/consultation/slots?id=${activeSlotToEdit.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setStatusMsg({ type: "success", text: "Slot deleted successfully!" });
        setIsEditModalOpen(false);
        fetchSlots();
      } else {
        const data = await response.json();
        setStatusMsg({ type: "error", text: data.error || "Failed to delete slot" });
      }
    } catch (error) {
      console.error("Error deleting slot:", error);
      setStatusMsg({ type: "error", text: "Network error deleting slot" });
    } finally {
      setModalDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Group slots by local date
  const processedSlots = slots.map((slot) => {
    const start = utcToLocal(slot.date, slot.start_time);
    const end = utcToLocal(slot.date, slot.end_time);
    // Use the local date for grouping, not the UTC date
    const localDateLabel = start.toLocaleDateString("en-CA"); // Format as YYYY-MM-DD
    return {
      ...slot,
      localStart: start,
      localEnd: end,
      localDateLabel: localDateLabel,
    };
  });

  const groupedSlots = processedSlots.reduce(
    (acc, slot) => {
      if (!acc[slot.localDateLabel]) acc[slot.localDateLabel] = [];
      acc[slot.localDateLabel].push(slot);
      return acc;
    },
    {} as Record<string, ProcessedSlot[]>
  );

  // Get unique dates sorted
  const sortedDates = Object.keys(groupedSlots).sort();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rapid Add Slot Card */}
        <Card className="lg:col-span-1 shadow-sm border-teal-100">
          <CardHeader className="bg-teal-50/50">
            <CardTitle className="text-lg flex items-center gap-2 text-teal-800">
              New Slot Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500 mb-1.5 block">
                Date
              </label>
              <Input
                type="date"
                value={newSlot.date}
                onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                className="border-gray-200 focus:ring-teal-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500 mb-1.5 block">
                  Start Time
                </label>
                <Input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => handleNewSlotStartChange(e.target.value)}
                  className="border-gray-200 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500 mb-1.5 block">
                  End Time
                </label>
                <Input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => handleNewSlotEndChange(e.target.value)}
                  className="border-gray-200 focus:ring-teal-500"
                />
              </div>
            </div>

            {statusMsg && (
              <div
                className={cn(
                  "p-3 rounded-lg text-xs font-medium animate-in fade-in slide-in-from-top-1",
                  statusMsg.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                )}
              >
                {statusMsg.text}
              </div>
            )}

            <Button
              onClick={handleAddSlot}
              disabled={saving}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-11"
            >
              {saving ? (
                <>
                  <Loader size="sm" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Available Slot
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Slots Grid */}
        <Card className="lg:col-span-2 shadow-sm border-gray-100 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-teal-600" /> Availability Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                {slots.length} Total Slots
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader size="lg" />
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No availability slots defined yet.</p>
              </div>
            ) : (
              <div className="overflow-auto max-h-125">
                {sortedDates.map((date) => (
                  <div key={date} className="border-b last:border-0 p-4">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded text-xs uppercase tracking-wider">
                        {new Date(date).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {groupedSlots[date]
                        .sort((a, b) => a.start_time.localeCompare(b.start_time))
                        .map((slot) => (
                          <div
                            key={slot.id}
                            className={cn(
                              "group relative flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer hover:shadow-sm",
                              slot.status === "available"
                                ? (slot.localStart.getTime() < Date.now()
                                    ? "bg-gray-50 border-gray-150 grayscale opacity-70 hover:border-gray-300"
                                    : "bg-white border-teal-100 hover:border-teal-400 hover:bg-teal-50/10"
                                  )
                                : slot.status === "confirmed"
                                  ? "bg-green-50 border-green-200 hover:border-green-400"
                                  : slot.status === "pending"
                                    ? "bg-yellow-50 border-yellow-200 hover:border-yellow-400"
                                    : "bg-gray-50 border-gray-200 grayscale opacity-70 hover:border-gray-400"
                            )}
                            onClick={() => handleOpenEditModal(slot)}
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold font-mono">
                                {slot.localStart.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false, // Use 24-hour format to be clear
                                })}
                              </span>
                              <span
                                className={cn(
                                  "text-[9px] uppercase font-black",
                                  slot.status === "available"
                                    ? (slot.localStart.getTime() < Date.now() ? "text-gray-400" : "text-teal-600")
                                    : slot.status === "confirmed"
                                      ? "text-green-600"
                                      : slot.status === "pending"
                                        ? "text-yellow-600"
                                        : "text-gray-400"
                                )}
                              >
                                {slot.status === "available" && slot.localStart.getTime() < Date.now() ? "expired" : slot.status}
                              </span>
                            </div>
                            {slot.status === "available" ? (
                              slot.localStart.getTime() < Date.now() ? (
                                <X className="h-3 w-3 text-gray-300 group-hover:text-red-400 transition-colors" />
                              ) : (
                                <Check className="h-3 w-3 text-teal-300 group-hover:text-teal-500 transition-colors" />
                              )
                            ) : slot.status === "unavailable" ? (
                              <X className="h-3 w-3 text-gray-300 group-hover:text-red-400 transition-colors" />
                            ) : (
                              <Edit2 className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-teal-500 transition-all" />
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Slot Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        {(() => {
          const isActiveSlotPast = activeSlotToEdit ? activeSlotToEdit.localStart.getTime() < Date.now() : false;
          return (
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-teal-800 font-bold">
                  <Edit2 className="h-5 w-5 text-teal-600" /> Edit Slot Details
                </DialogTitle>
                <DialogDescription>
                  {isActiveSlotPast ? (
                    <span className="text-red-500 font-bold block mt-1">
                      ⚠️ This time slot has already passed. It cannot be edited, but you can still delete it.
                    </span>
                  ) : (
                    "Modify the availability date, time range, status, or delete this slot entirely."
                  )}
                </DialogDescription>
              </DialogHeader>

              {showDeleteConfirm ? (
                <div className="py-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                    <Trash2 className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <h4 className="font-bold text-sm">Are you absolutely sure?</h4>
                      <p className="text-xs text-red-600/90 mt-1">
                        Deleting this slot is permanent. If a client is scheduled for this time, the booking reference might be affected.
                      </p>
                    </div>
                  </div>
                  <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={modalDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteSlot}
                      disabled={modalDeleting}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                      {modalDeleting ? "Deleting..." : "Yes, Delete Slot"}
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="py-4 space-y-4">
                  {modalErrorMsg && (
                    <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                      {modalErrorMsg}
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold uppercase text-gray-500 mb-1.5 block">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="border-gray-200 focus:ring-teal-500"
                      disabled={isActiveSlotPast}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase text-gray-500 mb-1.5 block">
                        Start Time
                      </label>
                      <Input
                        type="time"
                        value={editForm.start_time}
                        onChange={(e) => handleEditSlotStartChange(e.target.value)}
                        className="border-gray-200 focus:ring-teal-500"
                        disabled={isActiveSlotPast}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-gray-500 mb-1.5 block">
                        End Time
                      </label>
                      <Input
                        type="time"
                        value={editForm.end_time}
                        onChange={(e) => handleEditSlotEndChange(e.target.value)}
                        className="border-gray-200 focus:ring-teal-500"
                        disabled={isActiveSlotPast}
                      />
                    </div>
                  </div>
                  {/* <div>
                    <label className="text-xs font-semibold uppercase text-gray-500 mb-1.5 block">
                      Slot Status
                    </label>
                    <Select
                      value={editForm.status}
                      onValueChange={(val) =>
                        setEditForm({ ...editForm, status: val as any })
                      }
                      disabled={isActiveSlotPast}
                    >
                      <SelectTrigger className="border-gray-200" disabled={isActiveSlotPast}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available (Teal)</SelectItem>
                        <SelectItem value="unavailable">Unavailable (Gray)</SelectItem>
                        <SelectItem value="pending">Pending Booking (Yellow)</SelectItem>
                        <SelectItem value="confirmed">Confirmed / Booked (Green)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div> */}

                  <DialogFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold self-start gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" /> Delete Slot
                    </Button>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditModalOpen(false)}
                        disabled={modalSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleUpdateSlot}
                        disabled={modalSaving || isActiveSlotPast}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                      >
                        {modalSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          );
        })()}
      </Dialog>
    </div>
  );
};

export default AvailabilityGrid;
