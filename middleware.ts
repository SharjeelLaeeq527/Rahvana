import type { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";
import { assertMiddlewareBodySize } from "@/lib/security/request-body";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const blocked = assertMiddlewareBodySize(request);
    if (blocked) return blocked;
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
