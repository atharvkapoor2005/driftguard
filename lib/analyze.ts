import {
  parseRepoUrl,
  getDefaultBranch,
  getTree,
  getFileContent,
  mapLimit,
} from "@/lib/github";
import { analyzeDocsDrift, SourceFile } from "@/lib/docsDrift";
import { analyzeDepRadar } from "@/lib/depRadar";
import { AnalyzeResult, Severity } from "@/lib/types";

const SOURCE_EXT = [".ts", ".tsx", ".js", ".jsx", ".py"];
const EXCLUDE_DIR = /(^|\/)(node_modules|dist|build|\.next|vendor|test|tests|__tests__|coverage|examples?|demo|benchmark)(\/|$)/i;
const MAX_SOURCE_FILES = 60;
const MAX_FILE_SIZE = 60_000;
const PRIORITY_DIR = /(^|\/)(src|lib)(\/|$)/i;

export async function runAnalysis(repoUrl: string): Promise<AnalyzeResult> {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const branch = await getDefaultBranch(owner, repo);
  const tree = await getTree(owner, repo, branch);

  const readmeEntry = tree.find(
    (t) => t.type === "blob" && /^readme\.md$/i.test(t.path)
  );
  const pkgEntry = tree.find((t) => t.type === "blob" && t.path === "package.json");

  const sourceCandidates = tree
    .filter(
      (t) =>
        t.type === "blob" &&
        SOURCE_EXT.some((ext) => t.path.endsWith(ext)) &&
        !EXCLUDE_DIR.test(t.path) &&
        (t.size ?? 0) < MAX_FILE_SIZE
    )
    .sort((a, b) => {
      const aPriority = PRIORITY_DIR.test(a.path) ? 0 : 1;
      const bPriority = PRIORITY_DIR.test(b.path) ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.path.split("/").length - b.path.split("/").length;
    })
    .slice(0, MAX_SOURCE_FILES);

  const safeFetch = async (path: string): Promise<string | null> => {
    try {
      return await getFileContent(owner, repo, path, branch);
    } catch {
      return null;
    }
  };

  const [readmeContent, pkgContent] = await Promise.all([
    readmeEntry ? safeFetch(readmeEntry.path) : Promise.resolve(""),
    pkgEntry ? safeFetch(pkgEntry.path) : Promise.resolve(null),
  ]);

  const sourceFilesRaw = await mapLimit(sourceCandidates, 10, async (entry) => {
    const content = await safeFetch(entry.path);
    return content === null ? null : { path: entry.path, content };
  });
  const sourceFiles: SourceFile[] = sourceFilesRaw.filter(
    (f): f is SourceFile => f !== null
  );

  const [docsDriftResult, depRadarResult] = await Promise.all([
    Promise.resolve(analyzeDocsDrift(sourceFiles, readmeContent || "")),
    analyzeDepRadar(pkgContent, sourceFiles),
  ]);

  const allSeverities: Severity[] = [
    ...docsDriftResult.findings.map((f) => f.severity),
    ...depRadarResult.findings.map((f) => f.severity),
  ];
  const count = (s: Severity) => allSeverities.filter((x) => x === s).length;

  return {
    repo: `${owner}/${repo}`,
    repoUrl: `https://github.com/${owner}/${repo}`,
    filesScanned: sourceFiles.length + (readmeEntry ? 1 : 0) + (pkgEntry ? 1 : 0),
    docsDrift: docsDriftResult.findings,
    depRadar: depRadarResult.findings,
    stats: {
      totalFindings: allSeverities.length,
      high: count("high"),
      medium: count("medium"),
      low: count("low"),
      info: count("info"),
      exportedApis: docsDriftResult.exportedApiCount,
      documentedApis: docsDriftResult.documentedApiCount,
      dependenciesScanned: depRadarResult.scanned,
      dependenciesBehind: depRadarResult.findings.length,
    },
  };
}
