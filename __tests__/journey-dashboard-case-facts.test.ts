import { buildCaseHealth, buildKeyDates, buildTracking, lockedCaseHealthPreview } from "@/lib/journey/dashboard/buildDashboardModel";
import {
  USCIS_LIVE_STATUS_KEY,
  liveStatusFromUscisResponse,
  readCaseFacts,
} from "@/lib/journey/dashboard/caseFacts";

const today = new Date(2026, 10, 16);
const flags = { interviewAttended: false, isApPhase: false, isApprovedPhase: false, isJourneyComplete: false, today };

describe("case facts use the keys the step tools really save", () => {
  it("reads the spouse receipt record object and the engine's flat receipt keys", () => {
    const spouse = readCaseFacts({
      uscis_receipt_number: { receiptNumber: "ioe0123456789", noticeDate: "2026-02-10", priorityDate: "2026-02-01" },
    });
    expect(spouse.receiptNumber).toBe("IOE0123456789");
    expect(spouse.noticeDate?.getDate()).toBe(10);
    expect(spouse.priorityDate?.getDate()).toBe(1);

    const engine = readCaseFacts({
      uscis_receipt_number: "IOE0123456789",
      uscis_notice_date: "2026-02-10",
      uscis_tracking_enabled: true,
    });
    expect(engine.receiptNumber).toBe("IOE0123456789");
    expect(engine.noticeDate?.getMonth()).toBe(1);
    expect(engine.trackingEnabled).toBe(true);
  });

  it("reads MedicalExamTool, AppointmentReceivedTool, DqRecordingTool and ApprovalNoticeTool keys", () => {
    const f = readCaseFacts({
      med_date: "2026-07-14",
      med_time: "09:30",
      med_clinic: "Panel clinic",
      interviewDate: "2026-11-18",
      consulateLocation: "Islamabad",
      dqSaved: true,
      approvalDetails: { approvalDate: "2026-04-01", receiptNumber: "IOE0123456789" },
      nvcFeeStatus: { aos: "Paid", iv: "Paid" },
    });
    expect(f.medicalDate?.getDate()).toBe(14);
    expect(f.medicalClinic).toBe("Panel clinic");
    expect(f.interviewPlace).toBe("Islamabad");
    expect(f.isDq).toBe(true);
    expect(f.approvalDate?.getMonth()).toBe(3);
    expect(f.receiptNumber).toBe("IOE0123456789");
    expect(f.feesPaid).toBe(true);
  });

  it("lights up the ticket from those keys", () => {
    const t = buildTracking({
      metadata: {
        uscis_receipt_number: { receiptNumber: "IOE0123456789", noticeDate: "2026-02-10" },
        approvalDetails: { approvalDate: "2026-04-01" },
        nvcCaseNum: "ISL2026123456",
        med_date: "2026-12-01",
        med_clinic: "Panel clinic",
      },
      receiptRecord: null,
      ...flags,
    });
    expect(t.stages.map((s) => s.status)).toEqual(["done", "done", "current", "next", "next"]);
    expect(t.stages[0]).toMatchObject({ title: "Petition approved", statusText: "Approved" });
    expect(t.stages[2]).toMatchObject({ statusText: "Booked" });
    expect(t.stages[2].facts.find((x) => x.label === "Clinic")?.value).toBe("Panel clinic");
    expect(t.receipt?.number).toBe("IOE0123456789");
  });

  it("shows a live USCIS status only for the receipt it was checked for", () => {
    const live = { receiptNumber: "IOE0123456789", status: "Case Was Approved", description: "We approved it.", checkedAt: "2026-11-15T10:00:00Z" };
    const t = buildTracking({ metadata: { uscis_receipt_number: "IOE0123456789", [USCIS_LIVE_STATUS_KEY]: live }, receiptRecord: null, ...flags });
    expect(t.receipt).toMatchObject({ status: "Case Was Approved", statusDescription: "We approved it." });
    expect(t.stages[0].title).toBe("USCIS: Case Was Approved");

    const other = buildTracking({ metadata: { uscis_receipt_number: "IOE9999999999", [USCIS_LIVE_STATUS_KEY]: live }, receiptRecord: null, ...flags });
    expect(other.receipt?.status).toBeUndefined();
  });

  it("parses the Torch API response", () => {
    const json = { receiptNumber: "IOE0123456789", data: { case_status: { current_case_status_text_en: "Case Was Received", current_case_status_desc_en: "On ..." } } };
    expect(liveStatusFromUscisResponse("ioe0123456789", json, new Date("2026-11-16T00:00:00Z"))).toEqual({
      receiptNumber: "IOE0123456789",
      status: "Case Was Received",
      description: "On ...",
      checkedAt: "2026-11-16T00:00:00.000Z",
    });
    expect(liveStatusFromUscisResponse("IOE0123456789", { data: {} })).toBeNull();
  });

  it("puts tool-saved dates on the calendar", () => {
    const k = buildKeyDates({ med_date: "2026-07-14", med_clinic: "Panel clinic", approvalDetails: { approvalDate: "2026-04-01" } }, null, []);
    expect(k.map((d) => d.title)).toEqual(["Petition approved", "Medical exam"]);
  });
});

describe("case strength locked by the journey plan", () => {
  it("shows a fixed sample, never the real score, and keeps questionnaire counts", () => {
    const real = buildCaseHealth({
      notStarted: false, loading: false, score: 31, label: "Weak", status: "critical",
      evidence: 12, consistency: 40, completeness: 20, riskPenalty: 60,
      evidenceQuestions: { answered: 2, total: 12 }, consistencyQuestions: { answered: 1, total: 5 },
    });
    const p = lockedCaseHealthPreview(real);
    expect(p.locked).toBe(true);
    expect(real.locked).toBe(false);
    expect(p.score).toBe(72);
    expect(p.factors.map((f) => f.value)).not.toContain(12);
    expect(p.factors.map((f) => f.key)).toEqual(real.factors.map((f) => f.key));
    expect(p.evidenceQuestions).toEqual({ answered: 2, total: 12 });
  });
});
