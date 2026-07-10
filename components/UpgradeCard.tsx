"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, CreditCard } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function UpgradeCard({ onUpgraded }: { onUpgraded: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Couldn't load payment provider. Check your connection.");

      const res = await fetch("/api/billing/create-subscription", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't start checkout.");

      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "DriftGuard Pro",
        description: "Up to 25 watched repos, priority alerts",
        theme: { color: "#6366f1" },
        handler: () => {
          setTimeout(onUpgraded, 1500);
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      rzp.on("payment.failed", () => {
        setError("Payment failed. You can try again.");
        setLoading(false);
      });
      rzp.open();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl border border-accent/40 p-5 space-y-3"
    >
      <div className="flex items-center gap-2 text-accent2">
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-semibold">Upgrade to Pro — ₹699/mo</span>
      </div>
      <p className="text-sm text-gray-400">
        Watch up to 25 repos instead of 1. Same daily scans, same email + Slack alerts.
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={upgrade}
        disabled={loading}
        className="btn-shine w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-accent2 text-white text-sm font-medium rounded-lg py-2.5 disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        Upgrade now
      </motion.button>
      {error && <p className="text-xs text-high">{error}</p>}
    </motion.div>
  );
}
