"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Github, Clock, AlertTriangle, Slack } from "lucide-react";

interface WatchedRepo {
  id: string;
  repoFullName: string;
  slackWebhookUrl: string | null;
  lastScanAt: string | null;
  lastHigh: number;
  lastMedium: number;
}

export default function WatchList() {
  const [repos, setRepos] = useState<WatchedRepo[] | null>(null);
  const [input, setInput] = useState("");
  const [webhook, setWebhook] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/watch");
    const data = await res.json();
    setRepos(data.repos ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const addRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: input.trim(), slackWebhookUrl: webhook.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInput("");
      setWebhook("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const removeRepo = async (id: string) => {
    setRepos((r) => r?.filter((x) => x.id !== id) ?? null);
    await fetch("/api/watch", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={addRepo} className="glass rounded-xl border border-border p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="owner/repo"
              className="w-full bg-panel2 border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-accent2/60"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 0 24px -4px rgba(34,211,238,0.6)" }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={adding}
            className="btn-shine flex items-center gap-1.5 bg-gradient-to-r from-accent to-accent2 text-white text-sm font-medium rounded-lg px-4 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" /> Watch
          </motion.button>
        </div>
        <div className="relative">
          <Slack className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
            placeholder="Slack webhook URL (optional)"
            className="w-full bg-panel2 border border-border rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:border-accent2/60 text-gray-300"
          />
        </div>
        {error && <p className="text-xs text-high">{error}</p>}
      </form>

      {repos === null ? (
        <div className="h-20 rounded-xl shimmer-bg animate-shimmer" />
      ) : repos.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-10">
          Not watching anything yet — add a repo above.
        </p>
      ) : (
        <AnimatePresence>
          {repos.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass rounded-xl border border-border p-4 flex items-center justify-between gap-3 mb-3"
            >
              <div>
                <p className="font-mono text-sm text-gray-100">{r.repoFullName}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {r.lastScanAt ? new Date(r.lastScanAt).toLocaleString() : "not scanned yet"}
                  </span>
                  {r.lastHigh > 0 && (
                    <span className="flex items-center gap-1 text-high">
                      <AlertTriangle className="w-3 h-3" /> {r.lastHigh} high
                    </span>
                  )}
                  {r.slackWebhookUrl && (
                    <span className="flex items-center gap-1 text-low">
                      <Slack className="w-3 h-3" /> connected
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeRepo(r.id)}
                className="text-gray-500 hover:text-high transition-colors p-1.5"
                aria-label="Stop watching"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
