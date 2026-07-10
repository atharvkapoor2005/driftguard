"use client";

import { useId } from "react";

export default function Logo({ className = "w-6 h-6" }: { className?: string }) {
  const gradId = useId();

  return (
    <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path
        d="M16 2 L28 7 V15 C28 22.5 23 27.5 16 30 C9 27.5 4 22.5 4 15 V7 Z"
        fill={`url(#${gradId})`}
        opacity="0.15"
        stroke={`url(#${gradId})`}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 16.5 L14 20 L21.5 11.5"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="15" r="12.5" fill="none" stroke={`url(#${gradId})`} strokeWidth="0.75" opacity="0.35" />
    </svg>
  );
}
