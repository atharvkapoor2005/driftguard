"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Github, LogOut, Eye } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="w-24 h-8 rounded-full shimmer-bg animate-shimmer" />;
  }

  if (!session?.user) {
    return (
      <motion.button
        whileHover={{ y: -2, borderColor: "rgba(34,211,238,0.5)" }}
        whileTap={{ scale: 0.96 }}
        onClick={() => signIn("github")}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-200 border border-border rounded-full px-3 py-1.5 hover:text-accent2 transition-colors"
      >
        <Github className="w-3.5 h-3.5" /> Sign in
      </motion.button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/watch"
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent2 transition-colors"
      >
        <Eye className="w-3.5 h-3.5" /> Watched repos
      </Link>
      {session.user.image && (
        <img
          src={session.user.image}
          alt={session.user.name ?? "avatar"}
          className="w-7 h-7 rounded-full border border-border"
        />
      )}
      <button
        onClick={() => signOut()}
        className="text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="Sign out"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
