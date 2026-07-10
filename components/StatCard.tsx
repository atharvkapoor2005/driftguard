"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import CountUp from "./CountUp";
import clsx from "clsx";

const colorMap: Record<string, { text: string; glow: string; ring: string }> = {
  high: { text: "text-high", glow: "shadow-[0_0_30px_-10px_rgba(244,63,94,0.6)]", ring: "border-high/40" },
  medium: { text: "text-med", glow: "shadow-[0_0_30px_-10px_rgba(245,158,11,0.6)]", ring: "border-med/40" },
  low: { text: "text-low", glow: "shadow-[0_0_30px_-10px_rgba(34,197,94,0.6)]", ring: "border-low/40" },
  accent: { text: "text-accent2", glow: "shadow-[0_0_30px_-10px_rgba(34,211,238,0.6)]", ring: "border-accent2/40" },
  neutral: { text: "text-gray-200", glow: "", ring: "border-border" },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  suffix = "",
  index = 0,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: keyof typeof colorMap;
  suffix?: string;
  index?: number;
}) {
  const c = colorMap[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={clsx(
        "glass rounded-2xl p-5 flex flex-col gap-2 border transition-shadow cursor-default",
        c.ring,
        "hover:" + c.glow
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-gray-400">{label}</span>
        <Icon className={clsx("w-4 h-4", c.text)} />
      </div>
      <div className={clsx("text-3xl font-bold tabular-nums", c.text)}>
        <CountUp value={value} />
        {suffix}
      </div>
    </motion.div>
  );
}
