# DriftGuard

Paste a public GitHub repo URL and DriftGuard scans it for two things nobody checks until it's too late:

- **Docs Drift** — README examples that call functions which no longer exist, have the wrong number of arguments, or exported APIs that were never documented.
- **Dependency Radar** — dependencies that are one or more major versions behind latest, with exactly where in your codebase they're used and which GitHub releases to review before upgrading.

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind + Framer Motion + Recharts, backed by the GitHub REST API and the npm registry. No database — every scan runs live against the repo you give it.

## Running locally

```bash
npm install
npm run dev
```

Set `GITHUB_TOKEN` in `.env.local` to a GitHub personal access token (no scopes required for public repos) to avoid the unauthenticated API's 60 req/hour rate limit.

## How the analysis works

**Docs Drift** extracts exported functions/classes from source files (regex-based, JS/TS/Python) and cross-references them against code fences and inline code spans in the README. It only scans actual code blocks, not prose, to avoid false positives.

**Dependency Radar** reads `package.json`, checks each dependency's latest version on npm, and greps your source for import/require sites to show the real blast radius of an upgrade — plus links to GitHub releases between your current and latest version, when available.

Both are heuristics over a capped sample of files, not a full static analyzer — treat findings as a starting point for review, not ground truth.
