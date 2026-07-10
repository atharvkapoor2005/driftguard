"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, ScanSearch, Github, Package, Slack, Triangle, Mail, ShieldCheck, Code2, Zap } from "lucide-react";
import CountUp from "./CountUp";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const INTEGRATIONS = [
  { icon: Github, label: "GitHub" },
  { icon: Package, label: "npm registry" },
  { icon: Slack, label: "Slack" },
  { icon: Triangle, label: "Vercel" },
  { icon: Mail, label: "Resend" },
];

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Real static analysis",
    body: "Not a guess — it parses actual exports and cross-references real README code blocks.",
  },
  {
    icon: Code2,
    title: "Open source",
    body: "The whole engine is public on GitHub. Read exactly how every finding is produced.",
  },
  {
    icon: Zap,
    title: "Free forever, on-demand",
    body: "One-off scans cost nothing and need no signup. Pay only if you want scheduled monitoring.",
  },
];

export default function SocialProof() {
  const [stats, setStats] = useState<{ totalScans: number; githubStars: number } | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 pb-24 space-y-16">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={container}
        className="grid grid-cols-2 md:grid-cols-2 gap-4"
      >
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-border p-6 text-center">
          <ScanSearch className="w-5 h-5 text-accent2 mx-auto mb-2" />
          <div className="text-3xl font-bold text-gray-100">
            <CountUp value={stats?.totalScans ?? 0} />
            <span className="text-accent2">+</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">repos scanned</p>
        </motion.div>
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-border p-6 text-center">
          <Star className="w-5 h-5 text-med mx-auto mb-2" />
          <div className="text-3xl font-bold text-gray-100">
            <CountUp value={stats?.githubStars ?? 0} />
          </div>
          <p className="text-xs text-gray-500 mt-1">GitHub stars</p>
        </motion.div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={container}
      >
        <motion.p variants={fadeUp} className="text-center text-xs uppercase tracking-wider text-gray-500 mb-5">
          Integrates with
        </motion.p>
        <motion.div variants={container} className="flex flex-wrap items-center justify-center gap-3">
          {INTEGRATIONS.map((i) => (
            <motion.div
              key={i.label}
              variants={fadeUp}
              whileHover={{ y: -3, borderColor: "rgba(34,211,238,0.4)" }}
              className="flex items-center gap-2 border border-border rounded-full px-4 py-2 text-sm text-gray-400 glass"
            >
              <i.icon className="w-4 h-4 text-accent2" /> {i.label}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={container}
        className="grid md:grid-cols-3 gap-5"
      >
        {VALUE_PROPS.map((v) => (
          <motion.div
            key={v.title}
            variants={fadeUp}
            whileHover={{ y: -6 }}
            className="glass rounded-2xl border border-border p-6 transition-shadow hover:shadow-[0_0_30px_-12px_rgba(34,211,238,0.4)]"
          >
            <v.icon className="w-5 h-5 text-accent2 mb-3" />
            <h3 className="font-semibold text-gray-100 mb-1.5">{v.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{v.body}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
