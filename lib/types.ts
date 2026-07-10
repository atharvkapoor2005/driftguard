export type Severity = "high" | "medium" | "low" | "info";

export interface DocsDriftFinding {
  id: string;
  kind: "removed_api_still_documented" | "signature_mismatch" | "undocumented_export";
  severity: Severity;
  title: string;
  detail: string;
  file: string;
  line?: number;
  snippet?: string;
  docSnippet?: string;
}

export interface DepRadarFinding {
  id: string;
  packageName: string;
  currentVersion: string;
  latestVersion: string;
  majorsBehind: number;
  severity: Severity;
  usageFiles: { file: string; line: number; snippet: string }[];
  releaseNotes: { version: string; title: string; url: string }[];
}

export interface AnalyzeResult {
  repo: string;
  repoUrl: string;
  filesScanned: number;
  docsDrift: DocsDriftFinding[];
  depRadar: DepRadarFinding[];
  stats: {
    totalFindings: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    exportedApis: number;
    documentedApis: number;
    dependenciesScanned: number;
    dependenciesBehind: number;
  };
}
