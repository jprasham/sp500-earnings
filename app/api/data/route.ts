/* app/api/data/route.ts — Server-side data fetch & processing */

import { NextResponse } from "next/server";
import { fetchAndProcess } from "@/lib/data";

export const dynamic = "force-dynamic"; // always fresh
export const revalidate = 0;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_DATA_URL;
  const tol = parseFloat(process.env.NEXT_PUBLIC_INLINE_TOLERANCE ?? "0.02");

  if (!url) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_DATA_URL is not configured." },
      { status: 500 }
    );
  }

  try {
    const data = await fetchAndProcess(url, tol);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
