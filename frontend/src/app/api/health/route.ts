import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Health check endpoint for the Next.js API routes.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "privaroll-frontend-api",
    timestamp: new Date().toISOString(),
  });
}
