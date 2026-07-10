import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRazorpay } from "@/lib/razorpay";
import { getSubscription, upsertSubscription } from "@/lib/db/subscription";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await getSubscription(session.user.id);
  if (!sub?.razorpaySubscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  try {
    await getRazorpay().subscriptions.cancel(sub.razorpaySubscriptionId, false);
    await upsertSubscription(session.user.id, { status: "cancelled" });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Failed to cancel subscription", err);
    return NextResponse.json({ error: "Couldn't cancel. Try again." }, { status: 500 });
  }
}
