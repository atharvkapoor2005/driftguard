import { DocsDriftFinding } from "./types";

export interface SourceFile {
  path: string;
  content: string;
}

interface ExportedApi {
  name: string;
  file: string;
  line: number;
  params: string[];
  snippet: string;
}

interface ReadmeCall {
  name: string;
  callArgs: number;
  snippet: string;
}

const STOP_WORDS = new Set([
  "if", "for", "while", "switch", "catch", "function", "return", "console",
  "new", "typeof", "require", "await", "async", "export", "import", "class",
  "constructor", "super", "this", "npm", "npx", "git", "cd", "echo",
  // common method names that show up as `.foo()` calls on arbitrary objects
  // in usage examples — not reliable signals of a top-level package export
  "then", "catch", "finally", "all", "race", "any", "resolve", "reject",
  "map", "filter", "forEach", "reduce", "find", "some", "every", "sort",
  "get", "post", "put", "delete", "patch", "head", "options", "request",
  "pipe", "on", "once", "off", "emit", "log", "warn", "info", "debug",
  "push", "pop", "slice", "splice", "join", "concat", "keys", "values",
  "entries", "next", "done", "test", "describe", "it", "expect", "toString",
  "parseInt", "parseFloat", "stringify", "parse", "assign", "freeze",
  "create", "define", "toJSON", "toFixed", "match", "replace", "split",
  "trim", "includes", "indexOf", "toLowerCase", "toUpperCase",
]);

const JS_EXPORT_PATTERNS = [
  /export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g,
  /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/g,
  /export\s+class\s+([A-Za-z_$][\w$]*)/g,
];

function lineNumberAt(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

function extractParams(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of raw) {
    if ("([{".includes(ch)) depth++;
    if (")]}".includes(ch)) depth--;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts.filter((p) => p && p !== "self" && p !== "this");
}

function extractExportedApis(files: SourceFile[]): ExportedApi[] {
  const apis: ExportedApi[] = [];
  for (const file of files) {
    const isPy = file.path.endsWith(".py");
    if (isPy) {
      const re = /^def\s+([A-Za-z_][\w]*)\s*\(([^)]*)\)\s*:/gm;
      let m: RegExpExecArray | null;
      while ((m = re.exec(file.content))) {
        const [full, name, params] = m;
        if (name.startsWith("_")) continue;
        apis.push({
          name,
          file: file.path,
          line: lineNumberAt(file.content, m.index),
          params: extractParams(params),
          snippet: full.trim(),
        });
      }
    } else {
      for (const pattern of JS_EXPORT_PATTERNS) {
        const re = new RegExp(pattern);
        let m: RegExpExecArray | null;
        while ((m = re.exec(file.content))) {
          const name = m[1];
          const params = m[2] ? extractParams(m[2]) : [];
          apis.push({
            name,
            file: file.path,
            line: lineNumberAt(file.content, m.index),
            params,
            snippet: m[0].trim().slice(0, 160),
          });
        }
      }
    }
  }
  const seen = new Set<string>();
  return apis.filter((a) => {
    const key = a.file + ":" + a.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractReadmeMentions(readme: string): {
  calls: Map<string, ReadmeCall>;
  bareIdentifiers: Set<string>;
} {
  const calls = new Map<string, ReadmeCall>();
  const bareIdentifiers = new Set<string>();

  // Only scan actual code (fenced blocks + inline spans), never prose — an
  // English aside like "for readability (added in 1.2)" would otherwise
  // look exactly like a function call to a naive regex.
  const codeChunks: string[] = [];
  const fenceRe = /```[\w-]*\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(readme))) codeChunks.push(m[1]);

  const codeSpanRe = /`([^`\n]{1,80})`/g;
  while ((m = codeSpanRe.exec(readme))) {
    const raw = m[1].trim();
    codeChunks.push(raw);
    if (/^[A-Za-z_$][\w$]*$/.test(raw)) bareIdentifiers.add(raw);
  }

  const codeText = codeChunks.join("\n");
  const callRe = /\b([A-Za-z_$][\w$]*)\(([^)]*)\)/g;
  while ((m = callRe.exec(codeText))) {
    const name = m[1];
    if (STOP_WORDS.has(name) || name.length < 4) continue;
    // skip method calls like `response.get(...)` or `promise.then(...)` —
    // preceded by a dot, so `name` isn't a standalone top-level identifier
    if (codeText[m.index - 1] === ".") continue;
    if (!calls.has(name)) {
      calls.set(name, {
        name,
        callArgs: extractParams(m[2]).length,
        snippet: m[0].trim().slice(0, 160),
      });
    }
  }

  return { calls, bareIdentifiers };
}

export function analyzeDocsDrift(
  sourceFiles: SourceFile[],
  readme: string
): {
  findings: DocsDriftFinding[];
  exportedApiCount: number;
  documentedApiCount: number;
} {
  const apis = extractExportedApis(sourceFiles);
  const { calls, bareIdentifiers } = extractReadmeMentions(readme || "");
  const findings: DocsDriftFinding[] = [];
  let idCounter = 0;
  const apiNames = new Set(apis.map((a) => a.name));

  // Only a capped subset of source files gets scanned, so a name missing from
  // `apiNames` doesn't prove it's gone — check for *any* occurrence in the
  // scanned source (not just export declarations) before calling it removed.
  const sourceBlob = sourceFiles.map((f) => f.content).join("\n");
  const occursAnywhere = (name: string) =>
    new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(sourceBlob);

  for (const [name, call] of calls) {
    if (apiNames.has(name) || occursAnywhere(name)) continue;
    findings.push({
      id: `dd-${idCounter++}`,
      kind: "removed_api_still_documented",
      severity: "high",
      title: `\`${name}\` is documented but no longer exists in source`,
      detail: `The README shows an example calling \`${name}(...)\`, but no matching export was found anywhere in the scanned source. Readers following the docs will hit a runtime error.`,
      file: "README.md",
      docSnippet: call.snippet,
    });
  }

  for (const api of apis) {
    const call = calls.get(api.name);
    if (!call) continue;
    if (call.callArgs !== api.params.length) {
      findings.push({
        id: `dd-${idCounter++}`,
        kind: "signature_mismatch",
        severity: "medium",
        title: `\`${api.name}\` example doesn't match its current signature`,
        detail: `README example calls \`${api.name}\` with ${call.callArgs} argument(s), but the current implementation takes ${api.params.length} (${api.params.join(", ") || "none"}).`,
        file: api.file,
        line: api.line,
        snippet: api.snippet,
        docSnippet: call.snippet,
      });
    }
  }

  for (const api of apis) {
    if (calls.has(api.name) || bareIdentifiers.has(api.name)) continue;
    findings.push({
      id: `dd-${idCounter++}`,
      kind: "undocumented_export",
      severity: "low",
      title: `\`${api.name}\` is exported but never mentioned in the README`,
      detail: `Consumers won't discover \`${api.name}\` from the docs. Consider adding a usage example.`,
      file: api.file,
      line: api.line,
      snippet: api.snippet,
    });
  }

  const documentedApiCount = apis.filter(
    (a) => calls.has(a.name) || bareIdentifiers.has(a.name)
  ).length;

  const severityOrder = { high: 0, medium: 1, low: 2, info: 3 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    findings: findings.slice(0, 60),
    exportedApiCount: apis.length,
    documentedApiCount,
  };
}
