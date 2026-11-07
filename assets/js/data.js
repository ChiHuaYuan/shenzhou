import { CONFIG, isPreviewMode } from "./config.js";

function normalizeBundle(bundle) {
  return {
    site: bundle.site ?? {},
    members: Array.isArray(bundle.members?.members) ? bundle.members.members : [],
    projects: Array.isArray(bundle.projects?.projects) ? bundle.projects.projects : [],
    builds: Array.isArray(bundle.builds?.builds) ? bundle.builds.builds : [],
    news: Array.isArray(bundle.news?.news) ? bundle.news.news : [],
    updatedAt: bundle.site?.updatedAt ?? "",
    preview: Boolean(bundle.preview)
  };
}

function readPreviewBundle() {
  try {
    const raw = window.localStorage.getItem(CONFIG.preview.storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.site) return null;
    return { ...parsed, preview: true };
  } catch (error) {
    console.warn("预览数据读取失败：", error);
    return null;
  }
}

async function fetchJSON(path) {
  const url = new URL(path.replace(/^data\//, ""), CONFIG.dataDir);
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`无法加载 ${path}（HTTP ${response.status}）`);
  }
  return response.json();
}

export async function loadData() {
  if (isPreviewMode()) {
    const previewBundle = readPreviewBundle();
    if (previewBundle) return normalizeBundle(previewBundle);
    console.warn("当前为预览模式，但没有找到本地草稿，将加载已发布数据。");
  }

  const [site, members, projects, builds, news] = await Promise.all([
    fetchJSON("site.json"),
    fetchJSON("members.json"),
    fetchJSON("projects.json"),
    fetchJSON("builds.json"),
    fetchJSON("news.json")
  ]);

  const bundle = normalizeBundle({ site, members, projects, builds, news });
  bundle.preview = false;
  return bundle;
}
