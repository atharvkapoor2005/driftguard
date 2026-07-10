import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRazorpay, PRO_PLAN_ID } from "@/lib/razorpay";
import { getSubscription, upsertSubscription } from "@/lib/db/subscription";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const razorpay = getRazorpay();
    const existing = await getSubscription(session.user.id);
    if (existing?.status === "active") {
      return NextResponse.json({ error: "Already on the Pro plan" }, { status: 409 });
    }

    let customerId = existing?.razorpayCustomerId ?? undefined;
    if (!customerId) {
      const customer = await razorpay.customers.create({
        name: session.user.name || session.user.email,
        email: session.user.email,
        fail_existing: 0,
      });
      customerId = customer.id;
    }

    // 120 monthly cycles (~10 years) is Razorpay's way of expressing an
    // "until cancelled" subscription — there's no unbounded option.
    const subscription = await razorpay.subscriptions.create({
      plan_id: PRO_PLAN_ID,
      customer_notify: 1,
      total_count: 120,
      notes: { userId: session.user.id },
    });

    await upsertSubscription(session.user.id, {
      razorpayCustomerId: customerId,
      razorpaySubscriptionId: subscription.id,
      status: "created",
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error("Failed to create Razorpay subscription", err);
    return NextResponse.json(
      { error: "Couldn't start checkout. Try again in a moment." },
      { status: 500 }
    );
  }
}
