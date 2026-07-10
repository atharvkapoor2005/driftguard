"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl border border-low/30 p-10 flex flex-col items-center text-center gap-3"
    >
      <div className="w-14 h-14 rounded-full bg-low/10 flex items-center justify-center">
        <ShieldCheck className="w-7 h-7 text-low" />
      </div>
      <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md">{subtitle}</p>
    </motion.div>
  );
}
