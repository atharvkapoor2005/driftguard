"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, FileWarning, BookOpen, Sparkles } from "lucide-react";
import { DocsDriftFinding, Severity } from "@/lib/types";
import SeverityBadge from "./SeverityBadge";
import CodeSnippet from "./CodeSnippet";
import EmptyState from "./EmptyState";

const kindIcon: Record<DocsDriftFinding["kind"], any> = {
  removed_api_still_documented: FileWarning,
  signature_mismatch: Sparkles,
  undocumented_export: BookOpen,
};

const FILTERS: { key: Severity | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

export default function DocsDriftPanel({ findings }: { findings: DocsDriftFinding[] }) {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? findings : findings.filter((f) => f.severity === filter)),
    [findings, filter]
  );

  if (findings.length === 0) {
    return (
      <EmptyState
        title="No documentation drift detected"
        subtitle="Every documented API call lines up with the current source. Nicely maintained repo."
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
          const Icon = kindIcon[f.kind];
          const open = openId === f.id;
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="glass rounded-xl border border-border overflow-hidden"
            >
              <button
                onClick={() => setOpenId(open ? null : f.id)}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <Icon className="w-4 h-4 mt-0.5 text-accent2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SeverityBadge severity={f.severity} />
                    <span className="font-medium text-sm text-gray-100">{f.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                    {f.file}
                    {f.line ? `:${f.line}` : ""}
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
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-sm text-gray-300">{f.detail}</p>
                      <div className="grid md:grid-cols-2 gap-3">
                        {f.snippet && <CodeSnippet code={f.snippet} label={f.file} />}
                        {f.docSnippet && (
                          <CodeSnippet code={f.docSnippet} label="README.md" />
                        )}
                      </div>
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
