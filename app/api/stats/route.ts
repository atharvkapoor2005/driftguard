import { NextResponse } from "next/server";
import { getTotalScans } from "@/lib/db/stats";

export const runtime = "nodejs";
export const revalidate = 300;

async function getGithubStars(): Promise<number> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "driftguard-app",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await fetch("https://api.github.com/repos/atharvkapoor2005/driftguard", {
      headers,
      next: { revalidate: 300 },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.stargazers_count ?? 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  const [totalScans, githubStars] = await Promise.all([getTotalScans(), getGithubStars()]);
  return NextResponse.json({ totalScans, githubStars });
}
