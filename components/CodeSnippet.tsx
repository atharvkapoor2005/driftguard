"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

const KEYWORDS =
  /\b(export|const|function|async|await|def|class|return|import|from|require|let|var|if|else)\b/g;

function highlight(code: string) {
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const withStrings = escaped.replace(
    /(&quot;.*?&quot;|'[^']*'|"[^"]*")/g,
    '<span class="text-low">$1</span>'
  );
  const withKeywords = withStrings.replace(
    KEYWORDS,
    '<span class="text-accent2">$1</span>'
  );
  return withKeywords;
}

export default function CodeSnippet({
  code,
  label,
}: {
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="relative rounded-lg border border-border bg-[#0d1420] overflow-hidden group">
      {label && (
        <div className="px-3 py-1.5 text-[11px] text-gray-400 border-b border-border bg-panel2 font-mono">
          {label}
        </div>
      )}
      <button
        onClick={onCopy}
        className="absolute top-1.5 right-1.5 p-1.5 rounded-md bg-panel2/80 border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-panel2"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-low" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>
      <pre className="p-3 text-xs font-mono overflow-x-auto text-gray-300 leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
      </pre>
    </div>
  );
}
