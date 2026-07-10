import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { upsertSubscription, findUserIdBySubscriptionId } from "@/lib/db/subscription";

export const runtime = "nodejs";

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

const ACTIVE_EVENTS = new Set(["subscription.activated", "subscription.charged", "subscription.resumed"]);
const PAST_DUE_EVENTS = new Set(["subscription.pending", "subscription.halted"]);
const CANCELLED_EVENTS = new Set(["subscription.cancelled", "subscription.completed", "subscription.expired"]);

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventType: string = event.event;
  const sub = event.payload?.subscription?.entity;
  if (!sub?.id) {
    return NextResponse.json({ ok: true });
  }

  const userId =
    sub.notes?.userId || (await findUserIdBySubscriptionId(sub.id));
  if (!userId) {
    return NextResponse.json({ ok: true });
  }

  let status: string | null = null;
  if (ACTIVE_EVENTS.has(eventType)) status = "active";
  else if (PAST_DUE_EVENTS.has(eventType)) status = "past_due";
  else if (CANCELLED_EVENTS.has(eventType)) status = "cancelled";

  if (status) {
    await upsertSubscription(userId, {
      razorpaySubscriptionId: sub.id,
      status,
      currentPeriodEnd: sub.current_end ? new Date(sub.current_end * 1000) : null,
    });
  }

  return NextResponse.json({ ok: true });
}
