const API = "https://api.github.com";

function authHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "driftguard-app",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function parseRepoUrl(input: string): { owner: string; repo: string } {
  const trimmed = input.trim().replace(/\.git$/, "").replace(/\/$/, "");
  const match = trimmed.match(
    /(?:github\.com[/:])([^/]+)\/([^/]+?)(?:\/.*)?$/
  );
  if (match) return { owner: match[1], repo: match[2] };
  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length === 2) return { owner: parts[0], repo: parts[1] };
  throw new Error(
    "Couldn't parse that as a GitHub repo. Use a URL like https://github.com/owner/repo or owner/repo."
  );
}

async function ghFetch(url: string, retries = 2): Promise<Response> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
    if (res.ok) return res;
    if (res.status === 404) throw new Error("Repo not found (is it public?).");
    if (res.status === 403)
      throw new Error("GitHub API rate limit hit. Try again in a bit.");
    if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < retries) {
      lastErr = new Error(`GitHub API error: ${res.status}`);
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      continue;
    }
    throw new Error(`GitHub API error: ${res.status}`);
  }
  throw lastErr ?? new Error("GitHub API error");
}

export async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  const res = await ghFetch(`${API}/repos/${owner}/${repo}`);
  const data = await res.json();
  return data.default_branch as string;
}

export interface TreeEntry {
  path: string;
  type: "blob" | "tree";
  size?: number;
}

export async function getTree(
  owner: string,
  repo: string,
  branch: string
): Promise<TreeEntry[]> {
  const res = await ghFetch(
    `${API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  );
  const data = await res.json();
  return (data.tree || []) as TreeEntry[];
}

export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<string> {
  const res = await ghFetch(
    `${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(
      /%2F/g,
      "/"
    )}?ref=${branch}`
  );
  const data = await res.json();
  if (data.encoding === "base64") {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }
  return data.content ?? "";
}

export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function getNpmPackageInfo(name: string): Promise<{
  latestVersion: string;
  repositoryUrl?: string;
} | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const latestVersion = data["dist-tags"]?.latest;
    let repositoryUrl: string | undefined = data.repository?.url;
    if (repositoryUrl) {
      repositoryUrl = repositoryUrl
        .replace(/^git\+/, "")
        .replace(/\.git$/, "")
        .replace(/^git:\/\//, "https://");
    }
    if (!latestVersion) return null;
    return { latestVersion, repositoryUrl };
  } catch {
    return null;
  }
}

export async function getGithubReleasesBetween(
  repositoryUrl: string | undefined,
  fromVersion: string,
  toVersion: string
): Promise<{ version: string; title: string; url: string }[]> {
  if (!repositoryUrl || !repositoryUrl.includes("github.com")) return [];
  const match = repositoryUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return [];
  const [, owner, repo] = match;
  try {
    const res = await fetch(
      `${API}/repos/${owner}/${repo}/releases?per_page=30`,
      { headers: authHeaders(), cache: "no-store" }
    );
    if (!res.ok) return [];
    const releases = await res.json();
    if (!Array.isArray(releases)) return [];
    return releases
      .filter((r: any) => {
        const tag = (r.tag_name || "").replace(/^v/, "");
        return isVersionInRange(tag, fromVersion, toVersion);
      })
      .slice(0, 8)
      .map((r: any) => ({
        version: r.tag_name,
        title: r.name || r.tag_name,
        url: r.html_url,
      }));
  } catch {
    return [];
  }
}

function isVersionInRange(v: string, from: string, to: string): boolean {
  const parse = (s: string) => s.split(".").map((n) => parseInt(n, 10) || 0);
  const cmp = (a: number[], b: number[]) => {
    for (let i = 0; i < 3; i++) {
      if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0);
    }
    return 0;
  };
  const pv = parse(v);
  return cmp(pv, parse(from)) > 0 && cmp(pv, parse(to)) <= 0;
}
