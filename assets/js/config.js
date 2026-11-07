export const CONFIG = {
  siteName: "神州",
  dataDir: new URL("../../data/", import.meta.url),
  dataFiles: {
    site: "data/site.json",
    members: "data/members.json",
    projects: "data/projects.json",
    builds: "data/builds.json",
    news: "data/news.json"
  },
  preview: {
    queryKey: "preview",
    storageKey: "shenzhou_preview_bundle_v1"
  },
  admin: {
    tokenSessionKey: "shenzhou_github_token",
    tokenLocalKey: "shenzhou_github_token_persisted",
    rememberKey: "shenzhou_remember_token",
    repoKey: "shenzhou_repo_settings",
    draftKey: "shenzhou_admin_draft_v1"
  },
  repoDefaults: {
    owner: "",
    repo: "",
    branch: "main"
  }
};

export function inferGitHubRepo() {
  const host = window.location.hostname;
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (host.endsWith(".github.io")) {
    const owner = host.slice(0, -".github.io".length);
    const first = segments[0] || "";
    const isRootSite =
      !first ||
      first.endsWith(".html") ||
      ["assets", "data"].includes(first);
    const repo = isRootSite ? `${owner}.github.io` : first;
    return { owner, repo, branch: "main" };
  }
  return { ...CONFIG.repoDefaults };
}

export function isPreviewMode() {
  return new URLSearchParams(window.location.search).get(CONFIG.preview.queryKey) === "1";
}
