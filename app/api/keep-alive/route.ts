import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const startTime = Date.now();

    // Lightweight query to keep Supabase database active and prevent 7-day inactivity pause
    const { count, error } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .limit(1);

    const durationMs = Date.now() - startTime;

    if (error) {
      console.error("Keep-alive Supabase query error:", error);
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to ping Supabase database",
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: "ok",
        message: "Supabase database keep-alive ping successful",
        responseTimeMs: durationMs,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Unexpected error in keep-alive endpoint:", err);
    return NextResponse.json(
      {
        status: "error",
        message: "Unexpected server error during keep-alive ping",
        error: err?.message || String(err),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
