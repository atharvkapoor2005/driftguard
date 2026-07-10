import { DepRadarFinding, Severity } from "./types";
import { getNpmPackageInfo, getGithubReleasesBetween, mapLimit } from "./github";
import { SourceFile } from "./docsDrift";

function cleanVersion(raw: string): string {
  return raw.replace(/^[\^~>=<\s]+/, "").split(" ")[0].split("||")[0].trim();
}

function majorOf(version: string): number {
  const n = parseInt(version.split(".")[0], 10);
  return Number.isNaN(n) ? 0 : n;
}

function severityForMajorsBehind(majors: number, usageCount: number): Severity {
  if (majors >= 3 || (majors >= 2 && usageCount >= 3)) return "high";
  if (majors >= 1) return "medium";
  return "info";
}

function findUsageSites(
  pkgName: string,
  files: SourceFile[]
): { file: string; line: number; snippet: string }[] {
  const sites: { file: string; line: number; snippet: string }[] = [];
  const escaped = pkgName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(?:from\\s+["']${escaped}["']|require\\(["']${escaped}["']\\)|import\\s+["']${escaped}["'])`
  );
  for (const file of files) {
    const lines = file.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        sites.push({ file: file.path, line: i + 1, snippet: lines[i].trim().slice(0, 140) });
        if (sites.length >= 6) return sites;
      }
    }
  }
  return sites;
}

export async function analyzeDepRadar(
  packageJsonContent: string | null,
  sourceFiles: SourceFile[]
): Promise<{ findings: DepRadarFinding[]; scanned: number }> {
  if (!packageJsonContent) return { findings: [], scanned: 0 };

  let pkg: any;
  try {
    pkg = JSON.parse(packageJsonContent);
  } catch {
    return { findings: [], scanned: 0 };
  }

  const deps: Record<string, string> = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };
  const names = Object.keys(deps).slice(0, 30);

  const results = await mapLimit(names, 8, async (name) => {
    const declared = cleanVersion(deps[name]);
    const info = await getNpmPackageInfo(name);
    if (!info) return null;
    const currentMajor = majorOf(declared);
    const latestMajor = majorOf(info.latestVersion);
    const majorsBehind = Math.max(0, latestMajor - currentMajor);
    if (majorsBehind === 0) return null;

    const usageFiles = findUsageSites(name, sourceFiles);
    const severity = severityForMajorsBehind(majorsBehind, usageFiles.length);
    const releaseNotes = await getGithubReleasesBetween(
      info.repositoryUrl,
      declared,
      info.latestVersion
    );

    const finding: DepRadarFinding = {
      id: `dr-${name}`,
      packageName: name,
      currentVersion: declared,
      latestVersion: info.latestVersion,
      majorsBehind,
      severity,
      usageFiles,
      releaseNotes,
    };
    return finding;
  });

  const findings = results.filter((f): f is DepRadarFinding => f !== null);
  const severityOrder: Record<Severity, number> = { high: 0, medium: 1, low: 2, info: 3 };
  findings.sort(
    (a, b) =>
      severityOrder[a.severity] - severityOrder[b.severity] || b.majorsBehind - a.majorsBehind
  );

  return { findings, scanned: names.length };
}
