"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Eye, Check, Loader2 } from "lucide-react";
import Link from "next/link";

export default function WatchButton({ repoUrl }: { repoUrl: string }) {
  const { data: session } = useSession();
  const [state, setState] = useState<"idle" | "loading" | "watching" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (!session?.user) return null;

  const watch = async () => {
    setState("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState("watching");
    } catch (e: any) {
      setState("error");
      setMessage(e.message);
    }
  };

  if (state === "watching") {
    return (
      <Link
        href="/watch"
        className="flex items-center gap-1.5 text-xs text-low border border-low/40 bg-low/10 rounded-full px-3 py-1.5"
      >
        <Check className="w-3.5 h-3.5" /> Watching
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={watch}
        disabled={state === "loading"}
        className="flex items-center gap-1.5 text-xs text-gray-300 border border-border rounded-full px-3 py-1.5 hover:border-accent2/50 hover:text-accent2 transition-colors disabled:opacity-60"
      >
        {state === "loading" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Eye className="w-3.5 h-3.5" />
        )}
        Watch this repo
      </button>
      {message && <span className="text-xs text-high">{message}</span>}
    </div>
  );
}
