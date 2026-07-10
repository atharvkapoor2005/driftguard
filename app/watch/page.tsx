import { auth, signIn } from "@/auth";
import WatchList from "@/components/WatchList";
import Link from "next/link";
import { ShieldAlert, Github } from "lucide-react";

export default async function WatchPage() {
  const session = await auth();

  return (
    <main className="relative min-h-screen">
      <header className="max-w-3xl mx-auto px-6 pt-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-accent2" />
          <span className="font-bold text-lg tracking-tight">
            Drift<span className="text-gradient">Guard</span>
          </span>
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold mb-1">Watched repos</h1>
        <p className="text-gray-500 text-sm mb-8">
          DriftGuard re-scans these daily and emails you when a new high-severity
          finding shows up.
        </p>

        {!session?.user ? (
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/watch" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-accent to-accent2 text-white text-sm font-medium rounded-full px-5 py-2.5"
            >
              <Github className="w-4 h-4" /> Sign in with GitHub to continue
            </button>
          </form>
        ) : (
          <WatchList />
        )}
      </div>
    </main>
  );
}
