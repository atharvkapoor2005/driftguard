const fs = require("fs");

const COMMENT_MARKER = "<!-- driftguard-report -->";

function severityEmoji(sev) {
  return { high: "🔴", medium: "🟠", low: "🟢", info: "🔵" }[sev] || "⚪";
}

function buildMarkdown(result) {
  const { repo, repoUrl, stats, docsDrift, depRadar } = result;
  const lines = [
    COMMENT_MARKER,
    `### 🛡️ DriftGuard report for [\`${repo}\`](${repoUrl})`,
    "",
    `| High | Medium | Low | Dependencies behind |`,
    `|---|---|---|---|`,
    `| ${stats.high} | ${stats.medium} | ${stats.low} | ${stats.dependenciesBehind} |`,
    "",
  ];

  const topDocs = docsDrift.filter((f) => f.severity === "high" || f.severity === "medium").slice(0, 8);
  if (topDocs.length > 0) {
    lines.push("<details><summary><strong>Docs Drift</strong> — README examples that no longer match the code</summary>", "");
    for (const f of topDocs) {
      lines.push(`- ${severityEmoji(f.severity)} **${f.title}** — \`${f.file}${f.line ? ":" + f.line : ""}\``);
    }
    lines.push("", "</details>", "");
  }

  const topDeps = depRadar.filter((f) => f.severity === "high" || f.severity === "medium").slice(0, 8);
  if (topDeps.length > 0) {
    lines.push("<details><summary><strong>Dependency Radar</strong> — dependencies drifting toward a breaking upgrade</summary>", "");
    for (const f of topDeps) {
      lines.push(
        `- ${severityEmoji(f.severity)} **${f.packageName}** \`${f.currentVersion} → ${f.latestVersion}\` (${f.majorsBehind} major version${f.majorsBehind > 1 ? "s" : ""} behind, ${f.usageFiles.length} usage site${f.usageFiles.length !== 1 ? "s" : ""})`
      );
    }
    lines.push("", "</details>", "");
  }

  if (topDocs.length === 0 && topDeps.length === 0) {
    lines.push("No high or medium severity findings. ✅", "");
  }

  lines.push(`_Full dashboard: ${repoUrl ? `https://driftguard-nu.vercel.app` : ""}_`);
  return lines.join("\n");
}

async function ghApi(path, options = {}) {
  const base = process.env.GITHUB_API_URL || "https://api.github.com";
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${options.method || "GET"} ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

async function upsertPrComment(repoFull, prNumber, body) {
  const [owner, repo] = repoFull.split("/");
  const comments = await ghApi(`/repos/${owner}/${repo}/issues/${prNumber}/comments`);
  const existing = comments.find((c) => c.body?.includes(COMMENT_MARKER));
  if (existing) {
    await ghApi(`/repos/${owner}/${repo}/issues/comments/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
  } else {
    await ghApi(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  }
}

function writeOutput(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  if (file) fs.appendFileSync(file, `${name}=${value}\n`);
}

async function main() {
  const apiUrl = process.env.API_URL || "https://driftguard-nu.vercel.app";
  const repoFull = process.env.GITHUB_REPOSITORY;
  if (!repoFull) throw new Error("GITHUB_REPOSITORY is not set — is this running inside a GitHub Action?");

  console.log(`Scanning ${repoFull} via ${apiUrl}...`);
  const res = await fetch(`${apiUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl: repoFull }),
  });
  if (!res.ok) {
    console.error(`DriftGuard API returned ${res.status}: ${await res.text()}`);
    process.exitCode = 0; // don't block unrelated PRs on an infra hiccup
    return;
  }
  const result = await res.json();
  const markdown = buildMarkdown(result);

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) fs.appendFileSync(summaryFile, markdown + "\n");
  console.log(markdown);

  writeOutput("high", result.stats.high);
  writeOutput("medium", result.stats.medium);
  writeOutput("total", result.stats.totalFindings);

  if (process.env.GITHUB_EVENT_NAME === "pull_request" && process.env.GITHUB_EVENT_PATH) {
    const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf-8"));
    const prNumber = event.pull_request?.number;
    if (prNumber && process.env.GITHUB_TOKEN) {
      await upsertPrComment(repoFull, prNumber, markdown);
      console.log(`Posted/updated comment on PR #${prNumber}`);
    }
  }

  if (process.env.FAIL_ON_HIGH === "true" && result.stats.high > 0) {
    console.error(`Failing: ${result.stats.high} high-severity finding(s).`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 0; // infra/network errors shouldn't fail unrelated PRs
});
