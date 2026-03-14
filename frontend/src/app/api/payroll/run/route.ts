import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

/**
 * POST /api/payroll/run
 *
 * Proxies the payroll run request to the backend server which has
 * BitGo SDK and access tokens. This avoids CORS issues since the
 * request goes server-to-server from the Next.js serverless function.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/api/payroll/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Payroll proxy failed:", error);
    return NextResponse.json(
      {
        error: "Failed to connect to payroll backend",
        message: error.message,
      },
      { status: 502 },
    );
  }
}
