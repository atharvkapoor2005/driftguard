"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, GitBranch } from "lucide-react";

const EXAMPLES = ["expressjs/express", "sindresorhus/chalk", "axios/axios"];

export default function RepoInput({
  onAnalyze,
  loading,
}: {
  onAnalyze: (repo: string) => void;
  loading: boolean;
}) {
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || loading) return;
    onAnalyze(value.trim());
  };

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={submit} className="relative">
        <GitBranch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="github.com/owner/repo"
          className="w-full glass rounded-full pl-11 pr-28 py-3.5 text-sm text-gray-100 placeholder:text-gray-500 outline-none focus:border-accent2/60 border border-border transition-colors"
        />
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={loading}
          className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-full bg-gradient-to-r from-accent to-accent2 text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {loading ? "Scanning" : "Analyze"}
        </motion.button>
      </form>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="text-xs text-gray-500">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => !loading && onAnalyze(ex)}
            className="text-xs px-2.5 py-1 rounded-full border border-border text-gray-400 hover:text-accent2 hover:border-accent2/50 transition-colors font-mono"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
