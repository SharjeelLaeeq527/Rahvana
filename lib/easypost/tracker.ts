import client from "./client";
import * as Errors from '@/lib/errors'

export interface TrackerData {
  id: string;
  tracking_code: string;
  carrier: string;
  status: string;
  signed_by?: string;
  weight?: number;
  est_delivery_date?: string;
  shipment_id?: string;
  created_at: string;
  updated_at: string;
  events?: Array<{
    type: string;
    status: string;
    description: string;
    location?: string;
    timestamp: string;
  }>;
}

// Create a tracker in EasyPost - This registers the tracking with EasyPost for monitoring
export async function createTracker(trackingCode: string, carrier: string): Promise<TrackerData> {
  try {
    console.log(`[EasyPost] Creating tracker for ${carrier}: ${trackingCode}`);

    const tracker = await client.Tracker.create({
      tracking_code: trackingCode,
      carrier: carrier.toLowerCase(), // e.g., 'usps', 'fedex', 'ups', etc
    });

    console.log(`[EasyPost] Tracker created: ${tracker.id}`);

    return {
      id: tracker.id,
      tracking_code: tracker.tracking_code,
      carrier: tracker.carrier,
      status: tracker.status || "unknown",
      signed_by: tracker.signed_by,
      weight: tracker.weight,
      est_delivery_date: tracker.est_delivery_date,
      shipment_id: tracker.shipment_id,
      created_at: tracker.created_at,
      updated_at: tracker.updated_at,
      events: (tracker as any).events || [],
    };
  } catch (error) {
    console.error("[EasyPost] Error creating tracker:", error);
    throw new Error(Errors.msg(Errors.E.EASPOST_TRACKER_CREATE_FAILED));
  }
}

// Retrieve current tracker status - Call this during cron job to get latest status
export async function getTracker(trackerId: string): Promise<TrackerData> {
  try {
    console.log(`[EasyPost] Fetching tracker: ${trackerId}`);

    const tracker = await client.Tracker.retrieve(trackerId);

    console.log(`[EasyPost] Tracker status: ${tracker.status}`);

    return {
      id: tracker.id,
      tracking_code: tracker.tracking_code,
      carrier: tracker.carrier,
      status: tracker.status || "unknown",
      signed_by: tracker.signed_by,
      weight: tracker.weight,
      est_delivery_date: tracker.est_delivery_date,
      shipment_id: tracker.shipment_id,
      created_at: tracker.created_at,
      updated_at: tracker.updated_at,
      events: (tracker as any).events || [],
    };
  } catch (error) {
    console.error("[EasyPost] Error retrieving tracker:", error);
    throw error;
  }
}

// Parse tracker status into user-friendly format
export function getStatusLabel(status: string): {
  label: string;
  color: string;
  description: string;
} {
  const statusMap: Record<string, { label: string; color: string; description: string }> = {
    pre_transit: {
      label: "Pre-Transit",
      color: "bg-yellow-100 text-yellow-800",
      description: "Shipment information received",
    },
    in_transit: {
      label: "In Transit",
      color: "bg-blue-100 text-blue-800",
      description: "Your package is on its way",
    },
    out_for_delivery: {
      label: "Out for Delivery",
      color: "bg-blue-100 text-blue-800",
      description: "Package is out for delivery today",
    },
    delivered: {
      label: "Delivered",
      color: "bg-green-100 text-green-800",
      description: "Package delivered successfully",
    },
    available_for_pickup: {
      label: "Available for Pickup",
      color: "bg-purple-100 text-purple-800",
      description: "Package is available for pickup",
    },
    failure: {
      label: "Delivery Failed",
      color: "bg-red-100 text-red-800",
      description: "Delivery was not completed",
    },
    unknown: {
      label: "Unknown Status",
      color: "bg-gray-100 text-gray-800",
      description: "Status could not be determined",
    },
  };

  return (
    statusMap[status] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
      description: "Status: " + status,
    }
  );
}
