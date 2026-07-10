import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { watchedRepos } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { parseRepoUrl } from "@/lib/github";
import { isProUser } from "@/lib/db/subscription";
import { FREE_WATCHED_REPO_LIMIT, PRO_WATCHED_REPO_LIMIT } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(watchedRepos)
    .where(eq(watchedRepos.userId, session.user.id));

  const pro = await isProUser(session.user.id);
  return NextResponse.json({
    repos: rows,
    pro,
    limit: pro ? PRO_WATCHED_REPO_LIMIT : FREE_WATCHED_REPO_LIMIT,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { repoUrl, slackWebhookUrl } = await req.json();
  if (!repoUrl) return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });

  let owner: string, repo: string;
  try {
    ({ owner, repo } = parseRepoUrl(repoUrl));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  const repoFullName = `${owner}/${repo}`;

  const existing = await db
    .select()
    .from(watchedRepos)
    .where(eq(watchedRepos.userId, session.user.id));

  if (existing.some((r) => r.repoFullName.toLowerCase() === repoFullName.toLowerCase())) {
    return NextResponse.json({ error: "Already watching this repo" }, { status: 409 });
  }

  const pro = await isProUser(session.user.id);
  const limit = pro ? PRO_WATCHED_REPO_LIMIT : FREE_WATCHED_REPO_LIMIT;
  if (existing.length >= limit) {
    return NextResponse.json(
      {
        error: pro
          ? `Pro plan is capped at ${limit} watched repos.`
          : `Free plan includes ${limit} watched repo. Upgrade to Pro for up to ${PRO_WATCHED_REPO_LIMIT}.`,
        needsUpgrade: !pro,
      },
      { status: 403 }
    );
  }

  const [row] = await db
    .insert(watchedRepos)
    .values({
      userId: session.user.id,
      repoFullName,
      slackWebhookUrl: slackWebhookUrl || null,
    })
    .returning();

  return NextResponse.json({ repo: row });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db
    .delete(watchedRepos)
    .where(and(eq(watchedRepos.id, id), eq(watchedRepos.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}
