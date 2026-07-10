"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Package, ExternalLink, MapPin } from "lucide-react";
import { DepRadarFinding, Severity } from "@/lib/types";
import SeverityBadge from "./SeverityBadge";
import CodeSnippet from "./CodeSnippet";
import EmptyState from "./EmptyState";

const FILTERS: { key: Severity | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
];

export default function DepRadarPanel({ findings }: { findings: DepRadarFinding[] }) {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? findings : findings.filter((f) => f.severity === filter)),
    [findings, filter]
  );

  if (findings.length === 0) {
    return (
      <EmptyState
        title="No risky dependency upgrades pending"
        subtitle="Every dependency is within a major version of latest. Nothing to review right now."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === f.key
                ? "bg-accent/20 border-accent text-accent2"
                : "border-border text-gray-400 hover:text-gray-200 hover:border-gray-500"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((f, i) => {
          const open = openId === f.id;
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2, borderColor: "rgba(34,211,238,0.35)" }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="glass rounded-xl border border-border overflow-hidden transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]"
            >
              <button
                onClick={() => setOpenId(open ? null : f.id)}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <Package className="w-4 h-4 mt-0.5 text-accent2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SeverityBadge severity={f.severity} />
                    <span className="font-medium text-sm text-gray-100 font-mono">
                      {f.packageName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {f.currentVersion} → {f.latestVersion}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {f.majorsBehind} major version{f.majorsBehind > 1 ? "s" : ""} behind ·{" "}
                    {f.usageFiles.length} usage site{f.usageFiles.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4">
                      {f.usageFiles.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> Blast radius
                          </p>
                          <div className="grid md:grid-cols-2 gap-2">
                            {f.usageFiles.map((u, idx) => (
                              <CodeSnippet
                                key={idx}
                                code={u.snippet}
                                label={`${u.file}:${u.line}`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {f.releaseNotes.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                            Releases to review
                          </p>
                          <ul className="space-y-1.5">
                            {f.releaseNotes.map((r) => (
                              <li key={r.version}>
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-accent2 hover:underline flex items-center gap-1.5 group"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                  <span className="font-mono text-xs text-gray-500">
                                    {r.version}
                                  </span>
                                  {r.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
