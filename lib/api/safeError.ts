import { NextResponse } from "next/server";

/**
 * Returns a generic error response to the client while logging the real detail
 * on the server only. Prevents leaking database/internal error messages (which
 * help an attacker map our system) to the caller.
 *
 * Usage inside a route's catch block:
 *   } catch (error) {
 *     return safeError(error);
 *   }
 */
export function safeError(
  error: unknown,
  publicMessage: string = "Something went wrong. Please try again.",
  status: number = 500
) {
  // Full detail stays in server logs, never in the response body.
  console.error("[API error]", error);
  return NextResponse.json({ error: publicMessage }, { status });
}
