// import { NextRequest, NextResponse } from "next/server";
// import { runIR1Engine } from "@/lib/ir1-engine/ir1Service";
// import { caseDataService } from "@/lib/journey/service";

// // POST /api/v2/ir1-estimate
// // Body: { caseTypeId, filingDate, milestoneDates, location, statusFlags, journey_id?, persist? }
// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();

//     const {
//       caseTypeId,
//       filingDate,
//       milestoneDates,
//       location,
//       statusFlags,
//       journey_id,
//       persist,
//     } = body || {};

//     if (!caseTypeId && !journey_id) {
//       return NextResponse.json({ success: false, error: 'caseTypeId is required' }, { status: 400 });
//     }

//     const engineInput = {
//       caseTypeId,
//       filingDate,
//       milestoneDates,
//       location,
//       statusFlags,
//       apiVersion: 'v2',
//     };

//     const result = await Promise.resolve(runIR1Engine(engineInput as any));

//     if (persist && journey_id) {
//       try {
//         await caseDataService.setCaseData(journey_id, 'ir1_estimate_v2', result, {
//           source: 'system_calculated',
//           source_reference: 'ir1_estimate_api_v2',
//         });
//       } catch (err) {
//         console.error('Failed to persist ir1_estimate_v2:', err);
//       }
//     }

//     return NextResponse.json({ success: true, data: result }, { status: 200 });
//   } catch (error) {
//     console.error('Error in /api/v2/ir1-estimate:', error);
//     return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
//   }
// }
