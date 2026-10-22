import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { triggerPCCNotification } from "@/lib/notifications";
import { safeError } from "@/lib/api/safeError";

interface PoliceVerificationData {
  user_id?: string;
  full_name: string;
  father_name: string;
  email: string;
  phone_number: string;
  dob?: string;

  cnic: string;
  cnic_issue_date?: string;
  cnic_expiry_date?: string;
  passport_number: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;

  province: string;
  district: string;
  purpose: string;
  delivery_type: string;

  current_address: string;
  stay_from?: string;
  stay_to?: string;
  residing_in: string;
  residing_country?: string;
  target_country: string;

  was_arrested: boolean;
  fir_no?: string;
  fir_year?: string;
  police_station?: string;
  arrest_status?: string;

  witness1_name: string;
  witness1_father: string;
  witness1_cnic: string;
  witness1_contact: string;
  witness1_address: string;

  witness2_name: string;
  witness2_father: string;
  witness2_cnic: string;
  witness2_contact: string;
  witness2_address: string;

  request_id: string;
  status: "pending";
  admin_notes?: string;
  source?: string | null;
  journey_slug?: string | null;
  awaiting_payment?: boolean;
}

function generateRequestId() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
  return `PV-${dateStr}-${randomStr}`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      }
    );

    const body = await req.json();
    const requestId = generateRequestId();

    const verificationData: PoliceVerificationData = {
      user_id: body.userId || null,
      full_name: body.fullName,
      father_name: body.fatherName,
      email: body.email,
      phone_number: body.mobile,
      dob: body.dob || null,

      cnic: body.cnic,
      cnic_issue_date: body.cnicIssue || null,
      cnic_expiry_date: body.cnicExpiry || null,
      passport_number: body.passport,
      passport_issue_date: body.passportIssue || null,
      passport_expiry_date: body.passportExpiry || null,

      province: body.province || "Unknown",
      district: body.district,
      purpose: body.purpose,
      delivery_type: body.deliveryType,

      current_address: body.address,
      stay_from: body.stayFrom || null,
      stay_to: body.stayTo || null,
      residing_in: body.residingIn,
      residing_country: body.residingCountry || null,
      target_country: body.targetCountry,

      was_arrested: body.arrested === "Yes",
      fir_no: body.firNo || null,
      fir_year: body.firYear || null,
      police_station: body.policeStation || null,
      arrest_status: body.status || null,

      witness1_name: body.witness1Name,
      witness1_father: body.witness1Father,
      witness1_cnic: body.witness1Cnic,
      witness1_contact: body.witness1Contact,
      witness1_address: body.witness1Address,

      witness2_name: body.witness2Name,
      witness2_father: body.witness2Father,
      witness2_cnic: body.witness2Cnic,
      witness2_contact: body.witness2Contact,
      witness2_address: body.witness2Address,

      request_id: requestId,
      status: "pending",
      admin_notes: body.candidate_id
        ? `[Candidate: ${body.candidate_id}] ${body.candidate_name || ""}`.trim()
        : "",
      // Origin tagging: 'journey' rows are hidden from standalone My Resources.
      source: body.source === "journey" ? "journey" : "standalone",
      journey_slug: body.journey_slug || null,
      // Draft flag: standalone must-pay requests are created hidden and revealed by the
      // Stripe webhook / verify-session once paid. Credit/journey/plan rows stay false.
      awaiting_payment: body.awaitingPayment === true,
    };

    const { data, error } = await supabase
      .from("police_verification_requests")
      .insert([verificationData])
      .select()
      .single();

    if (error) {
      console.error("Error creating police verification request:", error);
      return safeError(error);
    }
    // Notify admins of the new PCC request only if not awaiting payment (e.g. journey mode)
    if (!verificationData.awaiting_payment) {
      const locationParts = [verificationData.district, verificationData.province].filter(Boolean);
      const locationText = locationParts.length > 0 ? ` for ${locationParts.join(", ")}` : "";
      const refText = verificationData.request_id ? ` (${verificationData.request_id})` : "";

      const pccNotificationBody = `${verificationData.full_name} has submitted a new Police Verification request${refText}${locationText}.`;

      triggerPCCNotification(
        data.id,
        body.journeyId || undefined,
        verificationData.full_name,
        pccNotificationBody
      ).catch((err) => {
        console.error("[PCCNotif] Error triggering admin notification:", err);
      });
    }

    return Response.json({ success: true, id: data.id, requestId: data.request_id });
  } catch (error) {
    console.error("Unexpected error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
