import { NextRequest, NextResponse } from "next/server";
import { runAnalysis } from "@/lib/analyze";
import { incrementScanCount } from "@/lib/db/stats";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { repoUrl } = await req.json();
    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });
    }
    const result = await runAnalysis(repoUrl);
    incrementScanCount();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Something went wrong analyzing that repo." },
      { status: 500 }
    );
  }
}
