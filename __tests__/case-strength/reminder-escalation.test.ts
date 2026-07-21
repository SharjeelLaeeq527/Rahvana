/**
 * Phase 3 — ReminderEngine document escalation (CASE_STRENGTH_ALERT_ESCALATION_PLAN §2).
 *
 * Verifies the bell/email reminders derive urgency from the SAME shared
 * `computeDocumentStage` the dashboard uses, gated per-category by
 * `profile.documentEscalation`, so the two systems can't contradict each other:
 *   - opted-in (IR-5): calm to-do (info) is NOT pushed; due-soon → "normal";
 *     critical → "high".
 *   - not opted-in (IR-1): legacy instant "high", unchanged.
 */

import { ReminderEngine } from "@/lib/reminders/ReminderEngine";

const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();

/** Minimal chainable Supabase stub keyed by table name. */
function makeSupabase(opts: {
  journeyType: string;
  docs?: any[];
  steps?: any[];
  caseData?: any[];
}) {
  const tableRows = (table: string): any[] => {
    if (table === "journeys") return [{ journey_type: opts.journeyType }];
    if (table === "journey_documents") return opts.docs ?? [];
    if (table === "steps") return opts.steps ?? [];
    if (table === "case_data") return opts.caseData ?? [];
    return [];
  };
  return {
    from(table: string) {
      const rows = tableRows(table);
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        in: () => builder,
        is: () => builder,
        order: () => builder,
        limit: () => builder,
        single: () => Promise.resolve({ data: rows[0] ?? null }),
        then: (resolve: any) => Promise.resolve({ data: rows }).then(resolve),
      };
      return builder;
    },
  };
}

const DOC = {
  id: "d1",
  document_type: "birth_certificate",
  document_label: "Birth Certificate",
  step_key: "step_1_2",
  status: "not_started",
};

async function runMissingDocs(sb: any): Promise<any[]> {
  const engine = new ReminderEngine(sb as any);
  return (engine as any).checkMissingDocuments("journey-1");
}

describe("ReminderEngine — document escalation opt-in (Phase 3)", () => {
  it("legacy (IR-1, no escalation config): instant high, original wording", async () => {
    const sb = makeSupabase({ journeyType: "IR1", docs: [DOC] });
    const out = await runMissingDocs(sb);
    expect(out).toHaveLength(1);
    expect(out[0].priority).toBe("high");
    expect(out[0].title).toBe("Document Required: Birth Certificate");
  });

  it("opted-in (IR-5), freshly reached step: calm to-do is NOT pushed to the bell", async () => {
    const sb = makeSupabase({
      journeyType: "IR5",
      docs: [DOC],
      steps: [{ step_key: "step_1_2", status: "in_progress", started_at: iso(Date.now()), completed_at: null }],
    });
    const out = await runMissingDocs(sb);
    expect(out).toHaveLength(0);
  });

  it("opted-in (IR-5), lingering on step: escalates to 'normal' (due soon)", async () => {
    const sb = makeSupabase({
      journeyType: "IR5",
      docs: [DOC],
      steps: [
        { step_key: "step_1_2", status: "in_progress", started_at: iso(Date.now() - 10 * DAY), completed_at: null },
      ],
    });
    const out = await runMissingDocs(sb);
    expect(out).toHaveLength(1);
    expect(out[0].priority).toBe("normal");
    expect(out[0].title).toBe("Document Due Soon: Birth Certificate");
  });

  it("opted-in (IR-5), long overdue: escalates to 'high' (critical/blocking)", async () => {
    const sb = makeSupabase({
      journeyType: "IR5",
      docs: [DOC],
      steps: [
        { step_key: "step_1_2", status: "in_progress", started_at: iso(Date.now() - 30 * DAY), completed_at: null },
      ],
    });
    const out = await runMissingDocs(sb);
    expect(out).toHaveLength(1);
    expect(out[0].priority).toBe("high");
    expect(out[0].title).toBe("Document Required: Birth Certificate");
  });

  it("opted-in (IR-5), near target filing date: critical even on a fresh step", async () => {
    const sb = makeSupabase({
      journeyType: "IR5",
      docs: [DOC],
      steps: [{ step_key: "step_1_2", status: "in_progress", started_at: iso(Date.now()), completed_at: null }],
      caseData: [{ data_value: iso(Date.now() + 3 * DAY) }],
    });
    const out = await runMissingDocs(sb);
    expect(out).toHaveLength(1);
    expect(out[0].priority).toBe("high");
  });
});
