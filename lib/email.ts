import { Resend } from "resend";
import { DocsDriftFinding, DepRadarFinding } from "./types";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "DriftGuard <onboarding@resend.dev>";

export async function sendDriftAlertEmail(
  to: string,
  repoFullName: string,
  newDocsFindings: DocsDriftFinding[],
  newDepFindings: DepRadarFinding[]
) {
  const docsItems = newDocsFindings
    .map((f) => `<li><strong>${f.title}</strong> — <code>${f.file}${f.line ? ":" + f.line : ""}</code></li>`)
    .join("");
  const depItems = newDepFindings
    .map(
      (f) =>
        `<li><strong>${f.packageName}</strong> ${f.currentVersion} → ${f.latestVersion} (${f.majorsBehind} major version${f.majorsBehind > 1 ? "s" : ""} behind)</li>`
    )
    .join("");

  const html = `
    <div style="font-family: sans-serif; max-width: 560px;">
      <h2>🛡️ New DriftGuard findings for ${repoFullName}</h2>
      ${docsItems ? `<h3>Docs Drift</h3><ul>${docsItems}</ul>` : ""}
      ${depItems ? `<h3>Dependency Radar</h3><ul>${depItems}</ul>` : ""}
      <p><a href="https://driftguard-nu.vercel.app">View full dashboard</a></p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `DriftGuard: new findings in ${repoFullName}`,
      html,
    });
  } catch (err) {
    console.error("Failed to send alert email", err);
  }
}
