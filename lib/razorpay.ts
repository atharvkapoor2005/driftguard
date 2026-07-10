import Razorpay from "razorpay";

let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return client;
}

export const PRO_PLAN_ID = process.env.RAZORPAY_PLAN_ID as string;
export const FREE_WATCHED_REPO_LIMIT = 1;
export const PRO_WATCHED_REPO_LIMIT = 25;
