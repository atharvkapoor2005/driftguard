import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { watchedRepos, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { runAnalysis } from "@/lib/analyze";
import { sendDriftAlertEmail } from "@/lib/email";
import { sendSlackAlert } from "@/lib/slack";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: watchedRepos.id,
      repoFullName: watchedRepos.repoFullName,
      slackWebhookUrl: watchedRepos.slackWebhookUrl,
      lastFindingIds: watchedRepos.lastFindingIds,
      userEmail: users.email,
    })
    .from(watchedRepos)
    .innerJoin(users, eq(watchedRepos.userId, users.id))
    .where(eq(watchedRepos.active, true));

  const results = await Promise.allSettled(
    rows.map(async (row) => {
      const result = await runAnalysis(row.repoFullName);
      const relevant = [
        ...result.docsDrift.filter((f) => f.severity === "high" || f.severity === "medium"),
        ...result.depRadar.filter((f) => f.severity === "high" || f.severity === "medium"),
      ];
      const currentIds = relevant.map((f) => f.id);
      const previousIds = new Set(row.lastFindingIds ?? []);
      const newFindings = relevant.filter((f) => !previousIds.has(f.id));

      if (newFindings.length > 0) {
        const newDocs = result.docsDrift.filter((f) => newFindings.includes(f));
        const newDeps = result.depRadar.filter((f) => newFindings.includes(f));
        await Promise.all([
          sendDriftAlertEmail(row.userEmail, row.repoFullName, newDocs, newDeps),
          row.slackWebhookUrl
            ? sendSlackAlert(row.slackWebhookUrl, row.repoFullName, newDocs, newDeps)
            : Promise.resolve(),
        ]);
      }

      await db
        .update(watchedRepos)
        .set({
          lastScanAt: new Date(),
          lastHigh: result.stats.high,
          lastMedium: result.stats.medium,
          lastFindingIds: currentIds,
        })
        .where(eq(watchedRepos.id, row.id));

      return { repo: row.repoFullName, newFindings: newFindings.length };
    })
  );

  const summary = results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { repo: rows[i].repoFullName, error: String(r.reason) }
  );

  return NextResponse.json({ scanned: rows.length, summary });
}
