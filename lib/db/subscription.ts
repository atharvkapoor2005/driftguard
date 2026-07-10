import { db } from "./index";
import { subscriptions } from "./schema";
import { eq } from "drizzle-orm";

export async function getSubscription(userId: string) {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));
  return row ?? null;
}

export async function isProUser(userId: string): Promise<boolean> {
  const sub = await getSubscription(userId);
  return sub?.status === "active";
}

export async function upsertSubscription(
  userId: string,
  data: Partial<{
    razorpayCustomerId: string;
    razorpaySubscriptionId: string;
    status: string;
    currentPeriodEnd: Date | null;
  }>
) {
  const existing = await getSubscription(userId);
  if (existing) {
    await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.userId, userId));
  } else {
    await db.insert(subscriptions).values({
      userId,
      razorpayCustomerId: data.razorpayCustomerId ?? null,
      razorpaySubscriptionId: data.razorpaySubscriptionId ?? null,
      status: data.status ?? "none",
      currentPeriodEnd: data.currentPeriodEnd ?? null,
    });
  }
}

export async function findUserIdBySubscriptionId(
  razorpaySubscriptionId: string
): Promise<string | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscriptionId));
  return row?.userId ?? null;
}
