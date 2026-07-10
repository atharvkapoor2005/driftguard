"use client";

import { useState } from "react";
import clsx from "clsx";
import { Severity } from "@/lib/types";

const config: Record<Severity, { label: string; classes: string; tip: string }> = {
  high: {
    label: "High",
    classes: "bg-high/15 text-high border-high/40",
    tip: "Likely to break for real users — fix before your next release.",
  },
  medium: {
    label: "Medium",
    classes: "bg-med/15 text-med border-med/40",
    tip: "Worth reviewing soon — could confuse consumers or fail silently.",
  },
  low: {
    label: "Low",
    classes: "bg-low/15 text-low border-low/40",
    tip: "Minor polish — nice to fix, not urgent.",
  },
  info: {
    label: "Info",
    classes: "bg-info/15 text-info border-info/40",
    tip: "For your awareness — no action required.",
  },
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const [open, setOpen] = useState(false);
  const c = config[severity];
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        className={clsx(
          "px-2.5 py-1 rounded-full text-xs font-semibold border cursor-help select-none",
          c.classes
        )}
      >
        {c.label}
      </span>
      {open && (
        <span className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-2 w-52 text-xs text-gray-200 bg-panel2 border border-border rounded-lg p-2.5 shadow-xl animate-in">
          {c.tip}
        </span>
      )}
    </span>
  );
}
