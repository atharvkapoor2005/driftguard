import { DocsDriftFinding, DepRadarFinding } from "./types";

export async function sendSlackAlert(
  webhookUrl: string,
  repoFullName: string,
  newDocsFindings: DocsDriftFinding[],
  newDepFindings: DepRadarFinding[]
) {
  const lines = [
    `🛡️ *New DriftGuard findings for ${repoFullName}*`,
    ...newDocsFindings.slice(0, 5).map((f) => `• ${f.title} — \`${f.file}\``),
    ...newDepFindings
      .slice(0, 5)
      .map((f) => `• ${f.packageName} ${f.currentVersion} → ${f.latestVersion}`),
    `<https://driftguard-nu.vercel.app|View full dashboard>`,
  ];

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lines.join("\n") }),
    });
  } catch (err) {
    console.error("Failed to send Slack alert", err);
  }
}
