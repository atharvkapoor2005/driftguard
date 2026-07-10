"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileWarning,
  AlertTriangle,
  BookMarked,
  Package,
  Github,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import RepoInput from "@/components/RepoInput";
import AuthButton from "@/components/AuthButton";
import WatchButton from "@/components/WatchButton";
import HeroIllustration from "@/components/HeroIllustration";
import StatCard from "@/components/StatCard";
import SeverityChart from "@/components/SeverityChart";
import DocsDriftPanel from "@/components/DocsDriftPanel";
import DepRadarPanel from "@/components/DepRadarPanel";
import { AnalyzeResult } from "@/lib/types";

type Tab = "docs" | "deps";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [tab, setTab] = useState<Tab>("docs");

  const analyze = async (repoUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[10%] w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-[-10%] right-[10%] w-96 h-96 bg-accent2/20 rounded-full blur-3xl animate-blob" />
      </div>

      <header className="max-w-6xl mx-auto px-6 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-accent2" />
          <span className="font-bold text-lg tracking-tight">
            Drift<span className="text-gradient">Guard</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {result && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 border border-border rounded-full px-3 py-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Analyze another repo
            </button>
          )}
          <AuthButton />
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!result && (
          <motion.section
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-6xl mx-auto px-6 pt-10 pb-20 flex flex-col md:flex-row items-center gap-8 md:gap-4"
          >
            <div className="flex-1 flex flex-col items-start gap-6">
              <span className="text-xs font-medium px-3 py-1 rounded-full border border-accent/40 bg-accent/10 text-accent2">
                Two scanners, one dashboard
              </span>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Catch <span className="text-gradient">stale docs</span> and{" "}
                <span className="text-gradient">breaking upgrades</span> before
                your users do.
              </h1>
              <p className="text-gray-400 text-base max-w-lg">
                DriftGuard scans any public GitHub repo for two things nobody
                checks until it&apos;s too late: documentation that no longer
                matches the code, and dependencies that are quietly drifting
                toward a breaking major upgrade.
              </p>
              <RepoInput onAnalyze={analyze} loading={loading} />
              {error && (
                <p className="text-sm text-high flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              <HeroIllustration />
            </div>
          </motion.section>
        )}

        {loading && !result && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-4 gap-4"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl shimmer-bg animate-shimmer" />
            ))}
          </motion.div>
        )}

        {result && (
          <motion.section
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto px-6 pb-24"
          >
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <a
                  href={result.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xl font-semibold hover:text-accent2 transition-colors"
                >
                  <Github className="w-5 h-5" /> {result.repo}
                </a>
                <p className="text-xs text-gray-500 mt-1">
                  Scanned {result.filesScanned} files ·{" "}
                  {result.stats.exportedApis} exported APIs ·{" "}
                  {result.stats.dependenciesScanned} dependencies
                </p>
              </div>
              <WatchButton repoUrl={result.repoUrl} />
            </div>

            <div className="grid md:grid-cols-3 gap-5 mb-8">
              <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="High severity" value={result.stats.high} icon={FileWarning} tone="high" index={0} />
                <StatCard label="Medium severity" value={result.stats.medium} icon={AlertTriangle} tone="medium" index={1} />
                <StatCard label="Docs coverage" value={result.stats.exportedApis === 0 ? 0 : Math.round((result.stats.documentedApis / result.stats.exportedApis) * 100)} suffix="%" icon={BookMarked} tone="accent" index={2} />
                <StatCard label="Deps behind" value={result.stats.dependenciesBehind} icon={Package} tone="low" index={3} />
              </div>
              <div className="glass rounded-2xl border border-border p-4">
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                  Severity breakdown
                </p>
                <SeverityChart
                  high={result.stats.high}
                  medium={result.stats.medium}
                  low={result.stats.low}
                  info={result.stats.info}
                />
              </div>
            </div>

            <div className="flex gap-1 mb-6 border-b border-border">
              {[
                { key: "docs" as Tab, label: `Docs Drift (${result.docsDrift.length})` },
                { key: "deps" as Tab, label: `Dependency Radar (${result.depRadar.length})` },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                    tab === t.key ? "text-gray-100" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {t.label}
                  {tab === t.key && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-accent2"
                    />
                  )}
                </button>
              ))}
            </div>

            {tab === "docs" ? (
              <DocsDriftPanel findings={result.docsDrift} />
            ) : (
              <DepRadarPanel findings={result.depRadar} />
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
