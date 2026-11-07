import { CONFIG, inferGitHubRepo } from "./config.js";
import { icon } from "./icons.js";
import { avatar, statusBadge } from "./ui.js";
import {
  clamp,
  escapeHTML,
  formatDate,
  splitComma,
  splitLines
} from "./utils.js";

const GITHUB_API = "https://api.github.com";
const app = document.querySelector("#admin-app");
const toastRoot = document.querySelector("#admin-toast");
const logoutButton = document.querySelector("#admin-logout");
const connection = document.querySelector("#admin-connection");
const connectionText = document.querySelector("#admin-connection-text");

const TABS = [
  { id: "site", label: "站点设置", icon: "file-text" },
  { id: "members", label: "成员管理", icon: "users", collection: "members" },
  { id: "projects", label: "工程管理", icon: "hammer", collection: "projects" },
  { id: "builds", label: "坐标管理", icon: "pin", collection: "builds" },
  { id: "news", label: "公告日志", icon: "clipboard", collection: "news" }
];

const COLLECTION_META = {
  members: {
    singular: "成员",
    plural: "位成员",
    listKey: "members",
    title: "成员管理",
    eyebrow: "MEMBER DIRECTORY",
    description: "维护成员名册、职位、状态和公开简介。",
    addLabel: "添加成员"
  },
  projects: {
    singular: "工程",
    plural: "项工程",
    listKey: "projects",
    title: "工程管理",
    eyebrow: "BUILD LOG",
    description: "更新工程进度、负责人、里程碑和工地动态。",
    addLabel: "添加工程"
  },
  builds: {
    singular: "坐标",
    plural: "处坐标",
    listKey: "builds",
    title: "坐标管理",
    eyebrow: "LANDMARKS",
    description: "管理公开建筑坐标。关闭「公开」后，该坐标不会出现在前台。",
    addLabel: "添加坐标"
  },
  news: {
    singular: "日志",
    plural: "条日志",
    listKey: "news",
    title: "公告日志",
    eyebrow: "GUILD JOURNAL",
    description: "首页展示最新三条日志；置顶条目会排在前面。",
    addLabel: "添加日志"
  }
};

const state = {
  token: "",
  owner: "",
  repo: "",
  branch: "main",
  repoFullName: "",
  docs: null,
  initialDocs: null,
  activeTab: "site",
  busy: false,
  error: "",
  notice: null,
  pendingImages: {},
  remember: false,
  connected: false
};

/* --------------------------------------------------------------------------
   Small helpers
   -------------------------------------------------------------------------- */

const deepClone = (value) => JSON.parse(JSON.stringify(value));
const today = () => new Date().toISOString().slice(0, 10);

function uid(prefix) {
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

function getPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function setPath(object, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  let target = object;
  keys.forEach((key) => {
    if (!target[key] || typeof target[key] !== "object") target[key] = {};
    target = target[key];
  });
  target[last] = value;
}

function splitOnce(value, separator = "|") {
  const text = String(value ?? "");
  const index = text.search(/[|｜]/);
  if (index === -1) return [text.trim(), ""];
  return [text.slice(0, index).trim(), text.slice(index + 1).trim()];
}

function parseParagraphs(value) {
  return String(value)
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePipeValues(value) {
  return splitLines(value)
    .map((line, index) => {
      const [title, desc] = splitOnce(line);
      return {
        number: String(index + 1).padStart(2, "0"),
        title,
        desc
      };
    })
    .filter((item) => item.title);
}

function parseSteps(value) {
  return splitLines(value)
    .map((line) => {
      const [title, desc] = splitOnce(line);
      return { title, desc };
    })
    .filter((item) => item.title);
}

function parseFaq(value) {
  return splitLines(value)
    .map((line) => {
      const [q, a] = splitOnce(line);
      return { q, a };
    })
    .filter((item) => item.q);
}

function serializeParagraphs(items) {
  return (items || []).join("\n\n");
}

function serializePipeValues(items, keyA = "title", keyB = "desc") {
  return (items || []).map((item) => `${item[keyA] || ""} | ${item[keyB] || ""}`).join("\n");
}

function serializeMilestones(milestones) {
  return (milestones || [])
    .map((item) => `${item.done ? "[x]" : "[ ]"} ${item.title || ""} | ${item.date || ""}`)
    .join("\n");
}

function parseMilestones(value) {
  return splitLines(value)
    .map((line) => {
      const done = /^\s*\[(x|X|✓|✅)\]\s*/.test(line);
      const clean = line.replace(/^\s*\[(x|X|✓|✅)\]\s*/, "");
      const [title, date] = splitOnce(clean);
      return { title, done, date };
    })
    .filter((item) => item.title);
}

function serializeUpdates(updates) {
  return (updates || []).map((item) => `${item.date || ""} | ${item.text || ""}`).join("\n");
}

function parseUpdates(value) {
  return splitLines(value)
    .map((line) => {
      const [date, text] = splitOnce(line);
      return { date, text };
    })
    .filter((item) => item.date || item.text);
}

function serializeDoc(key) {
  return `${JSON.stringify(state.docs[key], null, 2)}\n`;
}

function dirtyKeys() {
  if (!state.docs || !state.initialDocs) return [];
  return Object.keys(state.docs).filter(
    (key) => JSON.stringify(state.docs[key]) !== JSON.stringify(state.initialDocs[key])
  );
}

function isDirty() {
  return dirtyKeys().length > 0;
}

function collectionItems(key) {
  return state.docs[key][COLLECTION_META[key].listKey];
}

function branchPath(branch = state.branch) {
  return branch.split("/").map(encodeURIComponent).join("/");
}

function repoApiPath() {
  return `/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}`;
}

/* --------------------------------------------------------------------------
   Storage
   -------------------------------------------------------------------------- */

function loadSavedSettings() {
  try {
    const raw = window.localStorage.getItem(CONFIG.admin.repoKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveSettings() {
  try {
    window.localStorage.setItem(
      CONFIG.admin.repoKey,
      JSON.stringify({ owner: state.owner, repo: state.repo, branch: state.branch })
    );
    window.localStorage.setItem(CONFIG.admin.rememberKey, String(state.remember));
  } catch {
    /* Storage can be unavailable in private modes. */
  }
}

function persistToken() {
  try {
    window.sessionStorage.removeItem(CONFIG.admin.tokenSessionKey);
    window.localStorage.removeItem(CONFIG.admin.tokenLocalKey);
    if (state.remember) {
      window.localStorage.setItem(CONFIG.admin.tokenLocalKey, state.token);
    } else {
      window.sessionStorage.setItem(CONFIG.admin.tokenSessionKey, state.token);
    }
    window.localStorage.setItem(CONFIG.admin.rememberKey, String(state.remember));
  } catch {
    /* Ignore storage failures; the session still works. */
  }
}

function clearStoredToken() {
  try {
    window.sessionStorage.removeItem(CONFIG.admin.tokenSessionKey);
    window.localStorage.removeItem(CONFIG.admin.tokenLocalKey);
  } catch {
    /* Ignore. */
  }
}

function readStoredToken() {
  try {
    return (
      window.sessionStorage.getItem(CONFIG.admin.tokenSessionKey) ||
      window.localStorage.getItem(CONFIG.admin.tokenLocalKey) ||
      ""
    );
  } catch {
    return "";
  }
}

/* --------------------------------------------------------------------------
   GitHub API
   -------------------------------------------------------------------------- */

class GitHubError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
  }
}

async function github(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${GITHUB_API}${path}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${state.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new GitHubError("无法连接 GitHub。请检查网络后重试。", 0);
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    let message = "";
    if (response.status === 401) {
      message = "令牌无效或已过期，请重新生成 Personal Access Token。";
    } else if (response.status === 403) {
      message = "令牌权限不足，或触发了 GitHub API 频率限制。请确认 Contents 读写权限。";
    } else if (response.status === 404) {
      message = "仓库、分支或文件不存在，也可能令牌没有访问权限。";
    } else if (response.status === 409 || response.status === 422) {
      message = "仓库在读取后发生了新的提交，请刷新后重试。";
    } else {
      message = data?.message
        ? `GitHub 返回错误：${data.message}`
        : `GitHub 请求失败（HTTP ${response.status}）。`;
    }
    throw new GitHubError(message, response.status);
  }

  return data;
}

function decodeBase64Utf8(content) {
  const binary = atob(String(content).replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

async function readRepoFile(path) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const data = await github(
    `${repoApiPath()}/contents/${encodedPath}?ref=${encodeURIComponent(state.branch)}`
  );
  if (!data?.content) {
    throw new GitHubError(`无法读取 ${path}，文件可能是空的。`, 0);
  }
  try {
    return JSON.parse(decodeBase64Utf8(data.content));
  } catch {
    throw new GitHubError(`${path} 不是有效的 JSON，请先检查仓库中的文件。`, 0);
  }
}

async function fetchAllDocs() {
  const entries = await Promise.all(
    Object.keys(CONFIG.dataFiles).map(async (key) => [key, await readRepoFile(CONFIG.dataFiles[key])])
  );
  const docs = Object.fromEntries(entries);
  if (!docs.site?.guild) {
    throw new GitHubError("data/site.json 的结构无法识别，缺少 guild 字段。", 0);
  }
  for (const key of ["members", "projects", "builds", "news"]) {
    const listKey = COLLECTION_META[key].listKey;
    if (!Array.isArray(docs[key]?.[listKey])) {
      throw new GitHubError(`data/${key}.json 的结构无法识别，缺少 ${listKey} 数组。`, 0);
    }
  }
  return docs;
}

function validateDocs() {
  const issues = [];
  const site = state.docs.site;
  if (!site.guild?.name) issues.push("站点设置里的「公会名」不能为空。");
  if (!site.guild?.server) issues.push("站点设置里的「服务器名」不能为空。");

  const memberIds = new Set();
  collectionItems("members").forEach((member) => {
    if (!member.name || !member.role) issues.push("有成员缺少名字或职位。");
    if (memberIds.has(member.id)) issues.push(`成员 ID 重复：${member.id}`);
    memberIds.add(member.id);
  });

  const projectIds = new Set();
  collectionItems("projects").forEach((project) => {
    if (!project.name) issues.push("有工程缺少名称。");
    if (!Number.isFinite(Number(project.progress))) issues.push(`工程「${project.name}」的进度不是数字。`);
    if (projectIds.has(project.id)) issues.push(`工程 ID 重复：${project.id}`);
    projectIds.add(project.id);
  });

  const buildIds = new Set();
  collectionItems("builds").forEach((build) => {
    if (!build.name) issues.push("有坐标缺少建筑名。");
    ["x", "y", "z"].forEach((axis) => {
      if (!Number.isFinite(Number(build[axis]))) {
        issues.push(`坐标「${build.name}」的 ${axis.toUpperCase()} 值不是数字。`);
      }
    });
    if (buildIds.has(build.id)) issues.push(`坐标 ID 重复：${build.id}`);
    buildIds.add(build.id);
  });

  collectionItems("news").forEach((item) => {
    if (!item.title) issues.push("有日志缺少标题。");
  });

  return issues;
}

async function connect({ silent = false } = {}) {
  if (state.busy) return;
  state.busy = true;
  state.error = "";
  state.notice = null;
  setConnection(silent ? "正在验证…" : "正在连接…", true);

  try {
    if (!state.owner || !state.repo || !state.token) {
      throw new GitHubError("请填写仓库所有者、仓库名和访问令牌。", 0);
    }
    if (!state.branch) state.branch = "main";

    const repoInfo = await github(repoApiPath());
    if (repoInfo.permissions && repoInfo.permissions.push === false) {
      throw new GitHubError("这个令牌可以读取仓库，但没有写入权限。请给予 Contents 读写权限。", 403);
    }
    await github(`${repoApiPath()}/branches/${branchPath()}`);
    const docs = await fetchAllDocs();

    state.repoFullName = repoInfo.full_name || `${state.owner}/${state.repo}`;
    state.docs = docs;
    state.initialDocs = deepClone(docs);
    state.pendingImages = {};
    state.connected = true;
    state.busy = false;

    saveSettings();
    persistToken();
    renderStudio();
    setConnection(`${state.repoFullName} · ${state.branch}`, false);
    showToast(silent ? "已用保存的令牌自动连接。" : "已连接 GitHub，可以开始编辑。");
  } catch (error) {
    state.busy = false;
    state.connected = false;
    state.docs = null;
    state.initialDocs = null;
    state.error =
      error instanceof GitHubError
        ? error.message
        : `连接失败：${error?.message || "未知错误"}`;
    clearStoredToken();
    state.token = "";
    renderLogin();
    setConnection("未连接", false);
    showToast(state.error, "error");
  }
}

/* --------------------------------------------------------------------------
   Shared render helpers
   -------------------------------------------------------------------------- */

function setConnection(text, busy = false) {
  if (!connection) return;
  connection.hidden = !state.connected;
  connection.classList.toggle("is-busy", busy);
  if (connectionText) connectionText.textContent = text;
}

function showToast(message, type = "success") {
  if (!toastRoot) return;
  const item = document.createElement("div");
  item.className = `admin-toast__item${type === "error" ? " admin-toast__item--error" : ""}`;
  item.innerHTML = `${icon(type === "error" ? "alert" : "check", 15)}<span>${escapeHTML(message)}</span>`;
  toastRoot.append(item);
  requestAnimationFrame(() => item.classList.add("is-visible"));
  window.setTimeout(() => {
    item.classList.remove("is-visible");
    window.setTimeout(() => item.remove(), 220);
  }, 3400);
}

function updateTopbarForLogin() {
  if (logoutButton) logoutButton.hidden = true;
  if (connection) connection.hidden = true;
}

function updateTopbarForStudio() {
  if (logoutButton) logoutButton.hidden = false;
  if (connection) connection.hidden = false;
}

function renderLogin() {
  updateTopbarForLogin();
  state.connected = false;
  document.title = "站点管理｜神州";
  document.body.classList.remove("studio-open");

  const inferred = inferGitHubRepo();
  const owner = state.owner || inferred.owner || "";
  const repo = state.repo || inferred.repo || "";
  const branch = state.branch || inferred.branch || "main";

  app.innerHTML = `
    <section class="login-page">
      <div class="login-hero">
        <p class="eyebrow"><span class="eyebrow__index">S</span>SHENZHOU CONTENT STUDIO</p>
        <h1>写下一块砖，<br><em>再把它放进山河。</em></h1>
        <p class="login-hero__lead">
          这里是神州网站的编辑后台。修改成员、工程与坐标，预览后发布到 GitHub。
          前台是大家的神州，后台只属于你。
        </p>
        <ul class="login-points">
          <li>${icon("shield-check", 16)} 只有拥有仓库写权限的账号，才能发布更改</li>
          <li>${icon("eye", 16)} 未发布的修改可以先在本机预览，不会影响公开站点</li>
          <li>${icon("github", 16)} 每次发布都会形成一个可回溯的 GitHub 提交</li>
        </ul>
        <div class="login-hero__island" aria-hidden="true"><span></span><span></span><span></span></div>
        <span class="login-hero__stamp" aria-hidden="true">筑</span>
      </div>

      <div class="login-panel">
        <div class="login-card">
          <span class="login-card__badge">${icon("lock", 12)} OWNER ONLY</span>
          <h2>连接 GitHub</h2>
          <p class="login-card__lead">
            使用一枚拥有仓库 Contents 读写权限的 Personal Access Token 登录。令牌只保存在你的浏览器里。
          </p>
          ${state.error ? `<p class="login-error">${escapeHTML(state.error)}</p>` : ""}
          <form class="login-form" id="login-form" novalidate>
            <div class="login-form__row">
              <label class="afield">
                <span>仓库所有者</span>
                <input class="afield__control" name="owner" value="${escapeHTML(owner)}" placeholder="GitHub 用户名" autocomplete="username" required />
              </label>
              <label class="afield">
                <span>仓库名</span>
                <input class="afield__control" name="repo" value="${escapeHTML(repo)}" placeholder="shenzhou-site" autocomplete="off" required />
              </label>
            </div>
            <div class="login-form__row">
              <label class="afield">
                <span>分支</span>
                <input class="afield__control" name="branch" value="${escapeHTML(branch)}" placeholder="main" autocomplete="off" required />
              </label>
              <div class="afield">
                <span>连接方式</span>
                <input class="afield__control" value="Fine-grained PAT" disabled />
              </div>
            </div>
            <label class="afield">
              <span>Personal Access Token</span>
              <div class="token-field">
                <input class="afield__control" id="github-token" name="token" type="password" placeholder="github_pat_…" autocomplete="off" spellcheck="false" required />
                <button class="token-field__toggle" type="button" data-action="toggle-token" aria-label="显示或隐藏令牌">${icon("eye", 16)}</button>
              </div>
              <small>建议使用 Fine-grained token，只授权这一个仓库的 Contents 读写权限。</small>
            </label>
            <label class="login-form__check">
              <input type="checkbox" name="remember" ${state.remember ? "checked" : ""} />
              <span>在这台设备上记住令牌（保存到 localStorage，公共电脑请勿勾选）</span>
            </label>
            <button class="admin-btn admin-btn--primary" type="submit" data-login-submit style="min-height:42px; justify-content:center;">
              ${icon("github", 15)} 连接并读取内容
            </button>
          </form>

          <details class="login-help">
            <summary>如何创建这枚令牌？</summary>
            <ol>
              <li>打开 GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens。</li>
              <li>Repository access 选择 <code>Only select repositories</code>，只勾选这个网站仓库。</li>
              <li>Repository permissions 找到 <code>Contents</code>，设为 <code>Read and write</code>。</li>
              <li>生成后复制 <code>github_pat_…</code> 令牌，粘贴到上方。</li>
            </ol>
            <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">打开 GitHub 令牌页面 ${icon("arrow-up-right", 12)}</a>
          </details>
          <p class="login-security">${icon("shield-check", 13)}<span>令牌不会经过本站服务器，只会直接发送给 api.github.com。若使用公共电脑，离开前请点击退出并清除浏览器数据。</span></p>
        </div>
      </div>
    </section>`;
}

function renderStudio() {
  updateTopbarForStudio();
  document.body.classList.add("studio-open");
  const active = TABS.find((tab) => tab.id === state.activeTab) || TABS[0];

  app.innerHTML = `
    <div class="admin-studio">
      <aside class="studio-sidebar">
        <div class="repo-card">
          <p class="repo-card__label">${icon("github", 11)} CONNECTED REPOSITORY</p>
          <strong title="${escapeHTML(state.repoFullName)}">${escapeHTML(state.repoFullName)}</strong>
          <div class="repo-card__meta">
            <span>${icon("git-branch", 11)} ${escapeHTML(state.branch)}</span>
            <a href="https://github.com/${escapeHTML(state.owner)}/${escapeHTML(state.repo)}" target="_blank" rel="noopener noreferrer" aria-label="在 GitHub 查看仓库">${icon("external", 12)}</a>
          </div>
        </div>
        <nav class="studio-nav" aria-label="内容分类">
          <span class="studio-nav__label">EDIT CONTENT</span>
          ${TABS.map(
            (tab) => `
            <button type="button" class="studio-tab ${tab.id === active.id ? "is-active" : ""}" data-action="switch-tab" data-tab="${tab.id}" aria-current="${tab.id === active.id ? "page" : "false"}">
              ${icon(tab.icon, 15)}<span>${tab.label}</span>
              ${tab.collection ? `<span class="studio-tab__count" data-tab-count="${tab.collection}">${collectionItems(tab.collection).length}</span>` : ""}
            </button>`
          ).join("")}
        </nav>
        <div class="studio-sidebar__foot">
          <p>${icon("shield-check", 13)}<span>仅站长拥有发布权限。<br>所有修改先进入本地草稿，发布后公开。</span></p>
        </div>
      </aside>

      <div class="studio-main">
        <div class="studio-toolbar">
          <div>
            <p class="studio-toolbar__eyebrow">CONTENT STUDIO / <span id="studio-eyebrow">${escapeHTML(active.eyebrow || "STYLE GUIDE")}</span></p>
            <h1 id="studio-title">${active.label}</h1>
          </div>
          <div class="studio-toolbar__actions">
            <span class="publish-state" id="publish-state"><span class="publish-state__dot"></span><span>所有更改已发布</span></span>
            <button class="admin-btn" type="button" data-action="refresh" title="从 GitHub 重新读取">${icon("refresh", 14)} 刷新</button>
            <button class="admin-btn" type="button" data-action="preview">${icon("eye", 14)} 预览</button>
            <button class="admin-btn admin-btn--primary" type="button" data-action="publish" disabled>${icon("save", 14)} 发布更新</button>
          </div>
        </div>
        <div id="admin-content"></div>
      </div>
    </div>`;

  renderActiveTab();
  updateDirtyUI();
  setConnection(`${state.repoFullName} · ${state.branch}`, false);
}

function noticeHTML() {
  if (!state.notice) return "";
  const success = state.notice.type === "success";
  return `
    <div class="admin-notice ${success ? "admin-notice--success" : "admin-notice--error"}">
      ${icon(success ? "check" : "alert", 15)}
      <div>${state.notice.html}</div>
      <button class="admin-icon-btn" type="button" data-action="dismiss-notice" aria-label="关闭提示" style="margin-left:auto; flex:none;">${icon("close", 14)}</button>
    </div>`;
}

function renderActiveTab() {
  const content = document.querySelector("#admin-content");
  if (!content) return;
  const tab = TABS.find((item) => item.id === state.activeTab) || TABS[0];
  document.querySelectorAll(".studio-tab").forEach((button) => {
    const isActive = button.dataset.tab === tab.id;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
  const title = document.querySelector("#studio-title");
  const eyebrow = document.querySelector("#studio-eyebrow");
  if (title) title.textContent = tab.label;
  if (eyebrow) eyebrow.textContent = tab.collection ? COLLECTION_META[tab.collection].eyebrow : "SITE SETTINGS";

  const body = tab.id === "site" ? renderSiteTab() : renderCollectionTab(tab.id);
  content.innerHTML = noticeHTML() + body;
  updateSidebarCounts();
  updateDirtyUI();
}

function updateSidebarCounts() {
  if (!state.docs) return;
  document.querySelectorAll("[data-tab-count]").forEach((element) => {
    const key = element.dataset.tabCount;
    if (COLLECTION_META[key]) {
      element.textContent = String(collectionItems(key).length);
    }
  });
}

function updateDirtyUI() {
  if (!state.docs) return;
  const keys = dirtyKeys();
  const dirty = keys.length > 0;
  const publishState = document.querySelector("#publish-state");
  if (publishState) {
    publishState.classList.toggle("is-dirty", dirty);
    const label = publishState.querySelector("span:last-child");
    if (label) {
      label.textContent = state.busy
        ? "正在写入 GitHub…"
        : dirty
          ? `${keys.length} 个文件有未发布修改`
          : "所有更改已发布";
    }
  }
  const publishButton = document.querySelector('[data-action="publish"]');
  if (publishButton) {
    publishButton.disabled = !dirty || state.busy;
    publishButton.innerHTML = state.busy
      ? '<span class="spinner"></span> 发布中…'
      : `${icon("save", 14)} 发布更新${dirty ? ` <span style="font-family:var(--font-mono); font-size:8px; opacity:.65;">${keys.length}</span>` : ""}`;
  }
  const previewButton = document.querySelector('[data-action="preview"]');
  if (previewButton) previewButton.disabled = state.busy;
  const refreshButton = document.querySelector('[data-action="refresh"]');
  if (refreshButton) refreshButton.disabled = state.busy;
  document.title = `${dirty ? "● " : ""}站点管理｜神州`;
}

/* --------------------------------------------------------------------------
   Site settings
   -------------------------------------------------------------------------- */

function adminField({
  label,
  value = "",
  type = "text",
  placeholder = "",
  help = "",
  wide = false,
  required = false,
  rows = 4,
  min,
  max,
  step,
  code = false,
  options,
  name = "",
  path = "",
  parse = ""
}) {
  const attrs = [
    name ? `name="${escapeHTML(name)}"` : "",
    path ? `data-path="${escapeHTML(path)}"` : "",
    parse ? `data-parse="${escapeHTML(parse)}"` : "",
    required ? "required" : "",
    type === "number" && min !== undefined ? `min="${min}"` : "",
    type === "number" && max !== undefined ? `max="${max}"` : "",
    type === "number" && step !== undefined ? `step="${step}"` : "",
    placeholder ? `placeholder="${escapeHTML(placeholder)}"` : ""
  ]
    .filter(Boolean)
    .join(" ");
  let control = "";
  if (type === "textarea") {
    control = `<textarea class="afield__control${code ? " afield__control--code" : ""}" rows="${rows}" ${attrs}>${escapeHTML(value)}</textarea>`;
  } else if (type === "select") {
    control = `<select class="afield__control" ${attrs}>${(options || [])
      .map((option) => {
        const optionValue = typeof option === "string" ? option : option.value;
        const optionLabel = typeof option === "string" ? option : option.label;
        return `<option value="${escapeHTML(optionValue)}" ${String(value) === String(optionValue) ? "selected" : ""}>${escapeHTML(optionLabel)}</option>`;
      })
      .join("")}</select>`;
  } else {
    control = `<input class="afield__control" type="${escapeHTML(type)}" value="${escapeHTML(value)}" ${attrs} />`;
  }
  return `
    <label class="afield ${wide ? "afield--wide" : ""}">
      <span>${escapeHTML(label)}${required ? ' <b class="afield__required">*</b>' : ""}</span>
      ${control}
      ${help ? `<small>${escapeHTML(help)}</small>` : ""}
    </label>`;
}

function siteField(path, label, options = {}) {
  return adminField({
    label,
    value: getPath(state.docs.site, path) ?? "",
    path,
    ...options
  });
}

function siteToggle(path, label, description) {
  const checked = Boolean(getPath(state.docs.site, path));
  return `
    <div class="afield afield--wide afield--inline">
      <span><strong>${escapeHTML(label)}</strong><small>${escapeHTML(description)}</small></span>
      <label class="aswitch">
        <input type="checkbox" data-path="${escapeHTML(path)}" ${checked ? "checked" : ""} />
        <span class="aswitch__track"></span>
      </label>
    </div>`;
}

function settingsSection(number, title, description, body) {
  return `
    <section class="settings-section">
      <div class="settings-section__head">
        <span class="settings-section__num">${number}</span>
        <div><h2>${escapeHTML(title)}</h2><p>${escapeHTML(description)}</p></div>
      </div>
      <div class="settings-section__body">${body}</div>
    </section>`;
}

function heroImageField() {
  const current = String(getPath(state.docs.site, "hero.artImage") || "");
  const hasImage = Boolean(current);
  return `
    <div class="afield afield--wide aimg-field">
      <span><strong>首页主视觉图片</strong><small>上传后替换右侧内置插画</small></span>
      <div class="aimg">
        <div class="aimg__preview${hasImage ? " has-image" : ""}">
          ${
            hasImage
              ? `<img src="${escapeHTML(current)}" alt="主视觉图片预览" />`
              : `<span class="aimg__empty">${icon("image", 22)}<small>当前使用内置插画</small></span>`
          }
        </div>
        <div class="aimg__actions">
          <label class="admin-btn aimg__upload">
            ${icon("upload", 13)} 上传图片
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-upload="hero" hidden />
          </label>
          <button class="admin-btn aimg__clear" type="button" data-action="clear-hero-image" ${hasImage ? "" : "disabled"}>
            ${icon("trash", 13)} 恢复内置插画
          </button>
        </div>
        <small>支持 PNG / JPG / WebP / GIF（GIF 取第一帧）。图片会在预览中立即生效，并随「发布更新」写入仓库 assets/img/ 目录；边长超过 1600px 会自动压缩。建议使用 4:3 或接近方形的横向截图。</small>
      </div>
    </div>`;
}

function renderSiteTab() {
  const site = state.docs.site;
  const about = site.about || {};
  const join = site.join || {};
  return `
    <div class="settings-intro">
      ${icon("info", 15)}
      <span>这里的修改会先保存在当前页面的草稿中，不会立即出现在公开网站。点击右上角「发布更新」后，会以一个 GitHub 提交写入仓库，GitHub Pages 通常需要 1–2 分钟更新。</span>
    </div>

    <div class="settings-form" id="site-settings">
      ${settingsSection(
        "01",
        "公会身份",
        "出现在页头、页脚和首页基础信息中。",
        `<div class="form-grid">
          ${siteField("guild.name", "公会名", { required: true, placeholder: "神州" })}
          ${siteField("guild.nameEn", "英文名", { placeholder: "SHENZHOU" })}
          ${siteField("guild.server", "服务器名", { required: true, placeholder: "OrangeMC" })}
          ${siteField("guild.edition", "版本 / 玩法说明", { placeholder: "Java Edition · 长期生存" })}
          ${siteField("guild.mainCity", "主城名称", { placeholder: "太虚山", help: "首页主视觉标签、加入页碰头地点等会引用这个名字。" })}
          ${siteField("guild.founded", "成立日期", { type: "date" })}
          ${siteField("guild.recruitNote", "招新状态文案", { placeholder: "2026 秋季招新进行中" })}
          ${siteToggle("guild.recruiting", "开放招新", "关闭后，页头按钮与首页招新区块会切换为「暂未开放」。")}
        </div>`
      )}

      ${settingsSection(
        "02",
        "首页与公告",
        "控制首页主视觉、按钮和顶部公告条。",
        `<div class="form-grid">
          ${siteToggle("announcement.enabled", "显示公告条", "关闭后首页的公告条会隐藏。")}
          ${siteField("announcement.label", "公告标签", { placeholder: "公会动态" })}
          ${siteField("announcement.text", "公告内容", { type: "textarea", wide: true, rows: 2 })}
          ${siteField("announcement.linkLabel", "公告按钮文字", { placeholder: "查看工程" })}
          ${siteField("announcement.link", "公告按钮链接", { placeholder: "#/projects" })}
          ${siteField("hero.kicker", "首页眉题", { wide: true, placeholder: "OrangeMC · 华人建筑公会" })}
          ${siteField("hero.titleTop", "主标题第一行", { placeholder: "此间山河，" })}
          ${siteField("hero.titleBottom", "主标题第二行", { placeholder: "共筑神州。" })}
          ${siteField("hero.lead", "主标题下的介绍", { type: "textarea", wide: true })}
          ${siteField("hero.note", "主视觉下方小字", { wide: true })}
          ${siteField("hero.primaryLabel", "主按钮文字", { placeholder: "申请加入" })}
          ${siteField("hero.primaryLink", "主按钮链接", { placeholder: "#/join" })}
          ${siteField("hero.secondaryLabel", "次按钮文字", { placeholder: "浏览工程" })}
          ${siteField("hero.secondaryLink", "次按钮链接", { placeholder: "#/projects" })}
          ${heroImageField()}
          ${siteField("hero.artLabel", "主视觉标签", { placeholder: "太虚山 · 主城", help: "显示在图片下方第一行；留空时自动显示「主城名称 · 主城」。" })}
          ${siteField("hero.artTag", "主视觉角标", { placeholder: "概念图", help: "显示在图片下方第二行。" })}
          ${siteField("hero.artImageAlt", "图片替代文字", { placeholder: "太虚山主城截图", help: "图片加载失败或读屏软件朗读时使用。" })}
        </div>`
      )}

      ${settingsSection(
        "03",
        "关于神州",
        "首页「关于」区块的内容。",
        `<div class="form-grid">
          ${siteField("about.title", "关于标题", { wide: true })}
          ${siteField("about.paragraphs", "正文段落", {
            type: "textarea",
            wide: true,
            rows: 6,
            value: serializeParagraphs(about.paragraphs),
            parse: "paragraphs",
            help: "段落之间空一行。"
          })}
          ${siteField("about.quote", "引用句", { type: "textarea", wide: true, rows: 2 })}
          ${siteField("about.values", "三条价值观", {
            type: "textarea",
            wide: true,
            rows: 4,
            value: serializePipeValues(about.values),
            parse: "values",
            help: "每行一条，格式：标题 | 描述。编号会自动生成。"
          })}
        </div>`
      )}

      ${settingsSection(
        "04",
        "招新与联络",
        "「加入我们」页面及页脚联络方式。",
        `<div class="form-grid">
          ${siteField("guild.contactNote", "联络说明", { type: "textarea", wide: true, rows: 2 })}
          ${siteField("guild.serverAddress", "服务器地址", { placeholder: "可留空；填写后会显示复制按钮" })}
          ${siteField("guild.qqGroup", "QQ 群", { placeholder: "可留空" })}
          ${siteField("guild.github", "GitHub 链接", { wide: true, placeholder: "https://github.com/..." })}
          ${siteField("join.title", "招新页标题", { placeholder: "加入我们" })}
          ${siteField("join.lead", "招新页引导语", { type: "textarea", wide: true, rows: 3 })}
          ${siteField("join.requirements", "加入条件", {
            type: "textarea",
            wide: true,
            rows: 5,
            value: (join.requirements || []).join("\n"),
            parse: "lines",
            help: "每行一条。"
          })}
          ${siteField("join.steps", "加入流程", {
            type: "textarea",
            wide: true,
            rows: 6,
            value: serializePipeValues(join.steps),
            parse: "steps",
            help: "每行一步，格式：标题 | 说明。"
          })}
          ${siteField("join.faq", "常见问题", {
            type: "textarea",
            wide: true,
            rows: 8,
            value: join.faq ? join.faq.map((item) => `${item.q} | ${item.a}`).join("\n") : "",
            parse: "faq",
            help: "每行一条，格式：问题 | 答案。"
          })}
          ${siteField("join.template", "申请模板", {
            type: "textarea",
            wide: true,
            rows: 8,
            code: true,
            help: "会在加入页和复制按钮中使用，可按行编辑。"
          })}
        </div>`
      )}

      ${settingsSection(
        "05",
        "页脚文案",
        "页面最底部的落款与说明。",
        `<div class="form-grid">
          ${siteField("footer.slogan", "页脚口号", { wide: true, placeholder: "山河为卷，同行为笔。" })}
          ${siteField("footer.note", "页脚说明", { type: "textarea", wide: true, rows: 3 })}
        </div>`
      )}

      <div class="settings-actions">
        <span>修改仅保存在当前页面草稿中。刷新页面会丢失未发布的修改。</span>
        <span>发布前建议先点「预览」检查。</span>
      </div>
    </div>`;
}

function handleSiteInput(event) {
  const uploadControl = event.target.closest("[data-upload]");
  if (uploadControl) {
    handleHeroImageUpload(uploadControl);
    return;
  }
  const control = event.target.closest("[data-path]");
  if (!control || !control.closest("#site-settings")) return;
  const path = control.dataset.path;
  let value;
  if (control.type === "checkbox") {
    value = control.checked;
  } else {
    switch (control.dataset.parse) {
      case "paragraphs":
        value = parseParagraphs(control.value);
        break;
      case "values":
        value = parsePipeValues(control.value);
        break;
      case "steps":
        value = parseSteps(control.value);
        break;
      case "faq":
        value = parseFaq(control.value);
        break;
      case "lines":
        value = splitLines(control.value);
        break;
      default:
        value = control.value;
    }
  }
  setPath(state.docs.site, path, value);
  state.notice = null;
  updateDirtyUI();
}

function processHeroImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        let width = image.naturalWidth || 1;
        let height = image.naturalHeight || 1;
        const maxSide = 1600;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);
        const photo = /jpe?g|webp/i.test(file.type || "");
        const dataURL = photo
          ? canvas.toDataURL("image/jpeg", 0.88)
          : canvas.toDataURL("image/png");
        resolve({ dataURL, ext: photo ? "jpg" : "png" });
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法解析这张图片"));
    };
    image.src = url;
  });
}

function handleHeroImageUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type || "")) {
    showToast("请选择 PNG、JPG、WebP 或 GIF 图片。", "error");
    input.value = "";
    return;
  }
  if (file.size > 12 * 1024 * 1024) {
    showToast("图片超过 12MB，请先压缩后再上传。", "error");
    input.value = "";
    return;
  }
  processHeroImage(file)
    .then(({ dataURL, ext }) => {
      setPath(state.docs.site, "hero.artImage", dataURL);
      state.pendingImages.hero = { dataURL, ext, path: `assets/img/hero-upload.${ext}` };
      markDirty();
      renderActiveTab();
      showToast("主视觉图片已加入草稿：预览立即可见，发布后公开生效。");
    })
    .catch(() => {
      showToast("图片处理失败，请换一张图片重试。", "error");
    })
    .finally(() => {
      input.value = "";
    });
}

/* --------------------------------------------------------------------------
   Collection lists
   -------------------------------------------------------------------------- */

function renderCollectionTab(key) {
  const meta = COLLECTION_META[key];
  const items = collectionItems(key);
  const addActions = {
    members: "add-member",
    projects: "add-project",
    builds: "add-build",
    news: "add-news"
  };
  const head = `
    <div class="entity-head">
      <div class="entity-head__copy">
        <h2>${items.length} ${meta.plural}</h2>
        <p>${meta.description}</p>
      </div>
      <button class="admin-btn admin-btn--primary" type="button" data-action="${addActions[key]}">
        ${icon("plus", 14)} ${meta.addLabel}
      </button>
    </div>`;

  let list = "";
  if (key === "members") {
    list = items.length
      ? `
      <div class="entity-list entity-list--members">
        <div class="entity-list__head"><span>成员</span><span>职位</span><span>状态</span><span>标签</span><span style="text-align:right">操作</span></div>
        ${items
          .map(
            (member) => `
          <div class="entity-row">
            <div class="entity-name">
              ${avatar(member.name, "xs")}
              <div class="entity-name__txt"><strong>${escapeHTML(member.name)}</strong><small>${escapeHTML(member.joined || "")}</small></div>
            </div>
            <span class="entity-col">${escapeHTML(member.role)}</span>
            <span class="entity-col">${statusBadge(member.status, "member")}</span>
            <div class="entity-tags">${(member.tags || []).slice(0, 3).map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}</div>
            <div class="entity-row__actions">
              <button class="admin-icon-btn" type="button" data-action="edit-member" data-id="${escapeHTML(member.id)}" aria-label="编辑 ${escapeHTML(member.name)}" title="编辑">${icon("edit", 14)}</button>
              <button class="admin-icon-btn admin-icon-btn--danger" type="button" data-action="delete-member" data-id="${escapeHTML(member.id)}" aria-label="删除 ${escapeHTML(member.name)}" title="删除">${icon("trash", 14)}</button>
            </div>
          </div>`
          )
          .join("")}
      </div>`
      : entityEmpty("还没有成员", "添加第一位成员，让名册开始成形。", "users");
  } else if (key === "projects") {
    list = items.length
      ? `
      <div class="entity-list entity-list--projects">
        <div class="entity-list__head"><span>工程</span><span>状态</span><span>进度</span><span>负责人</span><span style="text-align:right">操作</span></div>
        ${items
          .map(
            (project) => `
          <div class="entity-row">
            <div class="entity-name">
              <div class="entity-name__txt"><strong>${escapeHTML(project.name)}</strong><small>${escapeHTML(project.category || "")} · ${escapeHTML(project.subtitle || "")}</small></div>
            </div>
            <span class="entity-col">${statusBadge(project.status)}</span>
            <div class="entity-progress"><div class="progress"><span style="width:${clamp(project.progress, 0, 100)}%"></span></div><span>${clamp(project.progress, 0, 100)}%</span></div>
            <span class="entity-col">${escapeHTML(project.lead || "—")}</span>
            <div class="entity-row__actions">
              <button class="admin-icon-btn" type="button" data-action="edit-project" data-id="${escapeHTML(project.id)}" aria-label="编辑 ${escapeHTML(project.name)}" title="编辑">${icon("edit", 14)}</button>
              <button class="admin-icon-btn admin-icon-btn--danger" type="button" data-action="delete-project" data-id="${escapeHTML(project.id)}" aria-label="删除 ${escapeHTML(project.name)}" title="删除">${icon("trash", 14)}</button>
            </div>
          </div>`
          )
          .join("")}
      </div>`
      : entityEmpty("还没有工程", "新建一项工程，记录它从草图到完工的进度。", "hammer");
  } else if (key === "builds") {
    list = items.length
      ? `
      <div class="entity-list entity-list--builds">
        <div class="entity-list__head"><span>建筑</span><span>分类</span><span>维度</span><span>坐标</span><span style="text-align:right">操作</span></div>
        ${items
          .map(
            (build) => `
          <div class="entity-row">
            <div class="entity-name">
              <div class="entity-name__txt"><strong>${escapeHTML(build.name)}</strong><small>${escapeHTML(build.builder || "")}${build.public === false ? " · 未公开" : ""}</small></div>
            </div>
            <span class="entity-col">${escapeHTML(build.category || "—")}</span>
            <span class="entity-col">${escapeHTML(build.dimension || "—")}</span>
            <span class="entity-col entity-col--muted">X ${escapeHTML(build.x)} · Y ${escapeHTML(build.y)} · Z ${escapeHTML(build.z)}</span>
            <div class="entity-row__actions">
              <button class="admin-icon-btn" type="button" data-action="edit-build" data-id="${escapeHTML(build.id)}" aria-label="编辑 ${escapeHTML(build.name)}" title="编辑">${icon("edit", 14)}</button>
              <button class="admin-icon-btn admin-icon-btn--danger" type="button" data-action="delete-build" data-id="${escapeHTML(build.id)}" aria-label="删除 ${escapeHTML(build.name)}" title="删除">${icon("trash", 14)}</button>
            </div>
          </div>`
          )
          .join("")}
      </div>`
      : entityEmpty("还没有坐标", "公开一处值得去看的建筑，让成员可以出发。", "pin");
  } else {
    list = items.length
      ? `
      <div class="entity-list entity-list--news">
        <div class="entity-list__head"><span>日期</span><span>标签</span><span>标题</span><span style="text-align:right">操作</span></div>
        ${items
          .map(
            (item) => `
          <div class="entity-row">
            <span class="entity-col entity-col--muted">${formatDate(item.date, "未标注")}</span>
            <span class="entity-col">${escapeHTML(item.tag || "—")}</span>
            <div class="entity-name">
              <div class="entity-name__txt"><strong>${escapeHTML(item.title)}${item.pinned ? " · 置顶" : ""}</strong><small>${escapeHTML(item.summary || "")}</small></div>
            </div>
            <div class="entity-row__actions">
              <button class="admin-icon-btn" type="button" data-action="edit-news" data-id="${escapeHTML(item.id)}" aria-label="编辑 ${escapeHTML(item.title)}" title="编辑">${icon("edit", 14)}</button>
              <button class="admin-icon-btn admin-icon-btn--danger" type="button" data-action="delete-news" data-id="${escapeHTML(item.id)}" aria-label="删除 ${escapeHTML(item.title)}" title="删除">${icon("trash", 14)}</button>
            </div>
          </div>`
          )
          .join("")}
      </div>`
      : entityEmpty("还没有日志", "写下第一条动态，让成员知道最近发生了什么。", "clipboard");
  }

  return `${head}${list}
    <div class="entity-footer">
      <span>修改会先进入草稿，发布后才会更新公开站点。</span>
      <span>共 ${items.length} ${meta.singular}</span>
    </div>`;
}

function entityEmpty(title, description, iconName) {
  return `
    <div class="entity-empty">
      ${icon(iconName, 24)}
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(description)}</p>
    </div>`;
}

function markDirty() {
  state.notice = null;
  updateDirtyUI();
}

/* --------------------------------------------------------------------------
   Editor dialogs
   -------------------------------------------------------------------------- */

function editorField(name, label, value, options = {}) {
  return adminField({ name, label, value: value ?? "", ...options });
}

function editorCheck(name, label, checked, help = "") {
  return `
    <label class="afield afield--wide afield--inline">
      <span><strong>${escapeHTML(label)}</strong>${help ? `<small>${escapeHTML(help)}</small>` : ""}</span>
      <span class="aswitch">
        <input type="checkbox" name="${escapeHTML(name)}" ${checked ? "checked" : ""} />
        <span class="aswitch__track"></span>
      </span>
    </label>`;
}

function showEditorDialog({ title, subtitle, eyebrow, formHTML, saveLabel, onSave }) {
  document.querySelector("dialog.editor-dialog")?.remove();
  document.body.classList.add("dialog-open");

  const dialog = document.createElement("dialog");
  dialog.className = "editor-dialog";
  dialog.innerHTML = `
    <div class="editor-panel">
      <div class="editor-head">
        <p class="editor-head__eyebrow">${escapeHTML(eyebrow)}</p>
        <h2>${escapeHTML(title)}</h2>
        <p>${escapeHTML(subtitle)}</p>
        <button class="editor-close" type="button" data-editor-close aria-label="关闭">${icon("close", 16)}</button>
      </div>
      <form class="editor-form">
        <div class="editor-body">
          ${formHTML}
          <p class="editor-error" data-editor-error></p>
        </div>
        <div class="editor-foot">
          <span class="editor-foot__meta">保存后会进入草稿，仍需发布。</span>
          <button class="admin-btn" type="button" data-editor-close>取消</button>
          <button class="admin-btn admin-btn--primary" type="submit">${escapeHTML(saveLabel)}</button>
        </div>
      </form>
    </div>`;
  document.body.append(dialog);
  dialog.showModal();

  const form = dialog.querySelector("form");
  const errorBox = dialog.querySelector("[data-editor-error]");
  const close = () => dialog.close();

  dialog.querySelectorAll("[data-editor-close]").forEach((button) =>
    button.addEventListener("click", close)
  );
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("close", () => {
    dialog.remove();
    if (!document.querySelector("dialog.editor-dialog")) {
      document.body.classList.remove("dialog-open");
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorBox.classList.remove("is-visible");
    try {
      const formData = new FormData(form);
      const message = onSave(formData, form);
      close();
      markDirty();
      renderActiveTab();
      showToast(message || "已保存到草稿。");
    } catch (error) {
      errorBox.textContent = error?.message || "保存失败，请检查填写内容。";
      errorBox.classList.add("is-visible");
    }
  });

  window.setTimeout(() => {
    dialog.querySelector("input:not([type=hidden]), textarea, select")?.focus();
  }, 20);
}

function openMemberEditor(id = "") {
  const existing = collectionItems("members").find((member) => member.id === id);
  const member = existing || {
    name: "",
    role: "成员",
    title: "",
    joined: today(),
    status: "活跃",
    contributions: "",
    bio: "",
    tags: [],
    favoriteBlock: ""
  };
  const formHTML = `
    <div class="form-grid">
      ${editorField("name", "成员名", member.name, { required: true, placeholder: "游戏 ID 或常用称呼" })}
      ${editorField("role", "职位", member.role, { required: true, placeholder: "建筑师 / 红石工程师 / 成员" })}
      ${editorField("status", "状态", member.status, { type: "select", options: ["活跃", "暂离"] })}
      ${editorField("joined", "加入日期", member.joined, { type: "date" })}
      ${editorField("title", "一句话称号", member.title, { wide: true, placeholder: "例如：把山搬进存档的人" })}
      ${editorField("contributions", "最近在做", member.contributions, { wide: true, placeholder: "主城规划 / 太虚山城墙" })}
      ${editorField("tags", "标签", (member.tags || []).join("、"), { wide: true, help: "用逗号或顿号分隔，例如：建筑、地形、红石。" })}
      ${editorField("favoriteBlock", "最喜欢的方块", member.favoriteBlock, { placeholder: "云杉木" })}
      ${editorField("bio", "成员简介", member.bio, { type: "textarea", wide: true, rows: 5, placeholder: "一两件关于 TA 的小事，会显示在成员详情里。" })}
    </div>`;
  showEditorDialog({
    title: existing ? `编辑成员 · ${member.name}` : "添加成员",
    subtitle: existing ? "修改会先保存到本地草稿，发布后才会更新网站。" : "把一位同行者写进神州的名册。",
    eyebrow: "MEMBER PROFILE",
    formHTML,
    saveLabel: existing ? "保存修改" : "添加到草稿",
    onSave(formData, form) {
      const name = String(formData.get("name") || "").trim();
      const role = String(formData.get("role") || "").trim();
      if (!name || !role) throw new Error("成员名和职位不能为空。");
      const next = {
        ...member,
        id: existing?.id || uid("m"),
        name,
        role,
        status: String(formData.get("status") || "活跃"),
        joined: String(formData.get("joined") || ""),
        title: String(formData.get("title") || "").trim(),
        contributions: String(formData.get("contributions") || "").trim(),
        tags: splitComma(String(formData.get("tags") || "")),
        favoriteBlock: String(formData.get("favoriteBlock") || "").trim(),
        bio: String(formData.get("bio") || "").trim()
      };
      saveCollectionItem("members", next, existing);
      return `成员「${name}」已${existing ? "更新" : "添加"}到草稿。`;
    }
  });
}

function openProjectEditor(id = "") {
  const existing = collectionItems("projects").find((project) => project.id === id);
  const project = existing || {
    name: "",
    subtitle: "",
    category: "建筑",
    status: "进行中",
    progress: 0,
    featured: false,
    lead: "",
    team: [],
    start: today(),
    target: "",
    description: "",
    milestones: [],
    updates: []
  };
  const formHTML = `
    <div class="form-grid">
      ${editorField("name", "工程名", project.name, { required: true, wide: true, placeholder: "例如：太虚山 · 主城" })}
      ${editorField("subtitle", "一句话介绍", project.subtitle, { wide: true, placeholder: "依山而建的第一座城" })}
      ${editorField("category", "分类", project.category, { required: true, placeholder: "建筑 / 交通 / 红石 / 景观 / 公共设施" })}
      ${editorField("status", "状态", project.status, { type: "select", options: ["规划中", "进行中", "收尾中", "已完工", "暂停"] })}
      ${editorField("progress", "进度", clamp(project.progress, 0, 100), { type: "number", min: 0, max: 100, step: 1 })}
      ${editorField("lead", "负责人", project.lead, { placeholder: "云舟" })}
      ${editorField("team", "参与成员", (project.team || []).join("、"), { wide: true, help: "用逗号或顿号分隔。" })}
      ${editorField("start", "开始日期", project.start, { type: "date" })}
      ${editorField("target", "目标日期", project.target, { type: "date" })}
      ${editorField("description", "工程简介", project.description, { type: "textarea", wide: true, rows: 4 })}
      ${editorField("milestones", "里程碑", serializeMilestones(project.milestones), {
        type: "textarea",
        wide: true,
        rows: 6,
        code: true,
        help: "每行一条：[x] 已完成标题 | 日期；[ ] 未完成标题 | 日期。"
      })}
      ${editorField("updates", "更新记录", serializeUpdates(project.updates), {
        type: "textarea",
        wide: true,
        rows: 5,
        code: true,
        help: "每行一条：日期 | 内容。最近一条请写在最上面。"
      })}
      ${editorCheck("featured", "在首页精选工程中展示", Boolean(project.featured), "首页最多展示 3 项精选工程。")}
    </div>`;
  showEditorDialog({
    title: existing ? `编辑工程 · ${project.name}` : "添加工程",
    subtitle: "更新当前进度、里程碑或最近一次工地动态。",
    eyebrow: "BUILD LOG",
    formHTML,
    saveLabel: existing ? "保存修改" : "添加到草稿",
    onSave(formData, form) {
      const name = String(formData.get("name") || "").trim();
      if (!name) throw new Error("工程名不能为空。");
      const next = {
        ...project,
        id: existing?.id || uid("p"),
        name,
        subtitle: String(formData.get("subtitle") || "").trim(),
        category: String(formData.get("category") || "").trim() || "建筑",
        status: String(formData.get("status") || "进行中"),
        progress: clamp(formData.get("progress"), 0, 100),
        featured: Boolean(form.elements.featured?.checked),
        lead: String(formData.get("lead") || "").trim(),
        team: splitComma(String(formData.get("team") || "")),
        start: String(formData.get("start") || ""),
        target: String(formData.get("target") || ""),
        description: String(formData.get("description") || "").trim(),
        milestones: parseMilestones(String(formData.get("milestones") || "")),
        updates: parseUpdates(String(formData.get("updates") || ""))
      };
      saveCollectionItem("projects", next, existing);
      return `工程「${name}」已${existing ? "更新" : "添加"}到草稿。`;
    }
  });
}

function openBuildEditor(id = "") {
  const existing = collectionItems("builds").find((build) => build.id === id);
  const build = existing || {
    name: "",
    category: "地标",
    dimension: "主世界",
    x: 0,
    y: 64,
    z: 0,
    builder: "",
    date: today(),
    description: "",
    tags: [],
    public: true
  };
  const formHTML = `
    <div class="form-grid">
      ${editorField("name", "建筑名", build.name, { required: true, wide: true, placeholder: "例如：太虚山 · 南门" })}
      ${editorField("category", "分类", build.category, { required: true, placeholder: "地标 / 公共设施 / 交通 / 景观 / 农场" })}
      ${editorField("dimension", "维度", build.dimension, { type: "select", options: ["主世界", "下界", "末地"] })}
      ${editorField("x", "X", build.x, { type: "number", required: true })}
      ${editorField("y", "Y", build.y, { type: "number", required: true })}
      ${editorField("z", "Z", build.z, { type: "number", required: true })}
      ${editorField("builder", "建造者", build.builder, { placeholder: "云舟" })}
      ${editorField("date", "记录日期", build.date, { type: "date" })}
      ${editorField("tags", "标签", (build.tags || []).join("、"), { wide: true, help: "用逗号或顿号分隔。" })}
      ${editorField("description", "简介与参观提示", build.description, { type: "textarea", wide: true, rows: 4 })}
      ${editorCheck("public", "对访客公开", build.public !== false, "关闭后，这个坐标不会出现在前台的建筑坐标页。")}
    </div>`;
  showEditorDialog({
    title: existing ? `编辑坐标 · ${build.name}` : "添加坐标",
    subtitle: "坐标用于成员参观和公共地点导航。",
    eyebrow: "LANDMARK",
    formHTML,
    saveLabel: existing ? "保存修改" : "添加到草稿",
    onSave(formData, form) {
      const name = String(formData.get("name") || "").trim();
      if (!name) throw new Error("建筑名不能为空。");
      const next = {
        ...build,
        id: existing?.id || uid("b"),
        name,
        category: String(formData.get("category") || "").trim() || "地标",
        dimension: String(formData.get("dimension") || "主世界"),
        x: Math.round(Number(formData.get("x") || 0)),
        y: Math.round(Number(formData.get("y") || 0)),
        z: Math.round(Number(formData.get("z") || 0)),
        builder: String(formData.get("builder") || "").trim(),
        date: String(formData.get("date") || ""),
        tags: splitComma(String(formData.get("tags") || "")),
        description: String(formData.get("description") || "").trim(),
        public: Boolean(form.elements.public?.checked)
      };
      saveCollectionItem("builds", next, existing);
      return `坐标「${name}」已${existing ? "更新" : "添加"}到草稿。`;
    }
  });
}

function openNewsEditor(id = "") {
  const existing = collectionItems("news").find((item) => item.id === id);
  const item = existing || {
    date: today(),
    tag: "动态",
    title: "",
    summary: "",
    link: "",
    pinned: false
  };
  const formHTML = `
    <div class="form-grid">
      ${editorField("date", "日期", item.date, { type: "date", required: true })}
      ${editorField("tag", "标签", item.tag, { placeholder: "工程 / 招新 / 活动 / 规则" })}
      ${editorField("title", "标题", item.title, { required: true, wide: true })}
      ${editorField("summary", "摘要", item.summary, { type: "textarea", wide: true, rows: 4 })}
      ${editorField("link", "相关链接", item.link, { wide: true, placeholder: "#/projects 或 https://…", help: "可留空。站内页面使用 #/members 这样的格式。" })}
      ${editorCheck("pinned", "置顶这条日志", Boolean(item.pinned), "置顶日志会排在首页日志列表最前面。")}
    </div>`;
  showEditorDialog({
    title: existing ? "编辑日志" : "添加日志",
    subtitle: "记录工程节点、招新、活动或规则更新。",
    eyebrow: "GUILD JOURNAL",
    formHTML,
    saveLabel: existing ? "保存修改" : "添加到草稿",
    onSave(formData, form) {
      const title = String(formData.get("title") || "").trim();
      if (!title) throw new Error("标题不能为空。");
      const next = {
        ...item,
        id: existing?.id || uid("n"),
        date: String(formData.get("date") || today()),
        tag: String(formData.get("tag") || "动态").trim(),
        title,
        summary: String(formData.get("summary") || "").trim(),
        link: String(formData.get("link") || "").trim(),
        pinned: Boolean(form.elements.pinned?.checked)
      };
      saveCollectionItem("news", next, existing);
      return `日志「${title}」已${existing ? "更新" : "添加"}到草稿。`;
    }
  });
}

function saveCollectionItem(key, item, existing) {
  const listKey = COLLECTION_META[key].listKey;
  const list = collectionItems(key);
  const index = existing ? list.findIndex((entry) => entry.id === existing.id) : -1;
  if (index >= 0) list[index] = item;
  else if (key === "news") list.unshift(item);
  else list.push(item);
}

/* --------------------------------------------------------------------------
   Delete, refresh, preview, publish
   -------------------------------------------------------------------------- */

function deleteEntity(key, id) {
  const list = collectionItems(key);
  const item = list.find((entry) => entry.id === id);
  if (!item) return;
  const label = item.name || item.title || "这条内容";
  if (!window.confirm(`确定从草稿中删除「${label}」吗？\n\n发布后才会真正从公开网站移除。`)) return;
  const index = list.findIndex((entry) => entry.id === id);
  list.splice(index, 1);
  markDirty();
  renderActiveTab();
  showToast(`已从草稿中删除「${label}」。`);
}

async function refreshFromRepo() {
  if (state.busy) return;
  if (isDirty() && !window.confirm("刷新会丢弃当前所有未发布的修改，确定继续吗？")) return;
  state.busy = true;
  state.notice = null;
  updateDirtyUI();
  setConnection("正在重新读取…", true);
  try {
    const docs = await fetchAllDocs();
    state.docs = docs;
    state.initialDocs = deepClone(docs);
    state.pendingImages = {};
    state.busy = false;
    renderStudio();
    showToast("已从 GitHub 重新读取内容。");
  } catch (error) {
    state.busy = false;
    updateDirtyUI();
    setConnection(`${state.repoFullName} · ${state.branch}`, false);
    state.notice = { type: "error", html: escapeHTML(error?.message || "刷新失败。") };
    renderActiveTab();
    showToast(error?.message || "刷新失败。", "error");
  }
}

function previewDraft() {
  if (!state.docs) return;
  const bundle = {
    site: state.docs.site,
    members: state.docs.members,
    projects: state.docs.projects,
    builds: state.docs.builds,
    news: state.docs.news
  };
  try {
    window.localStorage.setItem(CONFIG.preview.storageKey, JSON.stringify(bundle));
    const url = new URL("index.html?preview=1", window.location.href);
    const opened = window.open(url.href, "_blank");
    if (!opened) {
      showToast("浏览器拦截了新标签页。请允许弹窗后重试。", "error");
    } else {
      try {
        opened.opener = null;
      } catch {
        /* Cross-origin safety. */
      }
      showToast("预览已在新标签页打开，只有当前浏览器能看到这些内容。");
    }
  } catch {
    showToast("无法写入预览数据，可能是浏览器存储空间不足。", "error");
  }
}

async function publishChanges() {
  if (state.busy || !state.docs) return;
  const keys = dirtyKeys();
  if (!keys.length) {
    showToast("没有需要发布的修改。");
    return;
  }
  const issues = validateDocs();
  if (issues.length) {
    state.notice = {
      type: "error",
      html: `<strong>有 ${issues.length} 个内容问题需要先修复：</strong><br>${issues
        .slice(0, 5)
        .map((issue) => escapeHTML(issue))
        .join("<br>")}`
    };
    renderActiveTab();
    showToast("发布前请先修复内容问题。", "error");
    return;
  }
  const heroImage = state.pendingImages.hero;
  const publishesImage = Boolean(
    heroImage &&
      keys.includes("site") &&
      String(state.docs.site?.hero?.artImage || "").startsWith("data:image/")
  );
  if (
    !window.confirm(
      `将发布 ${keys.length} 个数据文件${publishesImage ? "和 1 张主视觉图片" : ""}到 ${state.repoFullName} 的 ${state.branch} 分支。\n\n每次发布会生成一个 GitHub 提交，公开站点通常会在 1–2 分钟后更新。确定继续吗？`
    )
  ) {
    return;
  }

  state.busy = true;
  state.notice = null;
  updateDirtyUI();
  setConnection("正在写入 GitHub…", true);

  try {
    const now = new Date().toISOString();
    keys.forEach((key) => {
      state.docs[key].updatedAt = now;
    });
    if (publishesImage) {
      state.docs.site.hero.artImage = heroImage.path;
    }

    const ref = await github(`${repoApiPath()}/git/ref/heads/${branchPath()}`);
    const parentSha = ref.object.sha;
    const parentCommit = await github(`${repoApiPath()}/git/commits/${parentSha}`);
    const baseTree = parentCommit.tree.sha;

    const tree = [];
    for (const key of keys) {
      const blob = await github(`${repoApiPath()}/git/blobs`, {
        method: "POST",
        body: { content: serializeDoc(key), encoding: "utf-8" }
      });
      tree.push({
        path: CONFIG.dataFiles[key],
        mode: "100644",
        type: "blob",
        sha: blob.sha
      });
    }
    if (publishesImage) {
      const imageBlob = await github(`${repoApiPath()}/git/blobs`, {
        method: "POST",
        body: { content: heroImage.dataURL.split(",")[1], encoding: "base64" }
      });
      tree.push({
        path: heroImage.path,
        mode: "100644",
        type: "blob",
        sha: imageBlob.sha
      });
    }

    const newTree = await github(`${repoApiPath()}/git/trees`, {
      method: "POST",
      body: { base_tree: baseTree, tree }
    });
    const message = `站点内容更新（${keys.length} 个文件）\n\n通过神州内容工作台发布。`;
    const commit = await github(`${repoApiPath()}/git/commits`, {
      method: "POST",
      body: { message, tree: newTree.sha, parents: [parentSha] }
    });
    await github(`${repoApiPath()}/git/refs/heads/${branchPath()}`, {
      method: "PATCH",
      body: { sha: commit.sha, force: false }
    });

    state.initialDocs = deepClone(state.docs);
    state.pendingImages = {};
    state.busy = false;
    state.notice = {
      type: "success",
      html: `发布成功。GitHub 提交：<a href="${escapeHTML(
        commit.html_url || `https://github.com/${state.owner}/${state.repo}/commit/${commit.sha}`
      )}" target="_blank" rel="noopener noreferrer">${escapeHTML(String(commit.sha).slice(0, 7))}</a>。GitHub Pages 通常会在 1–2 分钟内完成更新。`
    };
    updateDirtyUI();
    renderActiveTab();
    setConnection(`${state.repoFullName} · ${state.branch}`, false);
    showToast("发布成功，等待 GitHub Pages 更新。");
  } catch (error) {
    state.busy = false;
    updateDirtyUI();
    setConnection(`${state.repoFullName} · ${state.branch}`, false);
    state.notice = {
      type: "error",
      html: `发布失败：${escapeHTML(error?.message || "未知错误")}<br>你的修改仍保留在当前草稿中，可以稍后重试。`
    };
    renderActiveTab();
    showToast(error?.message || "发布失败。", "error");
  }
}

/* --------------------------------------------------------------------------
   Events
   -------------------------------------------------------------------------- */

async function handleLoginSubmit(event) {
  event.preventDefault();
  if (state.busy) return;
  const form = event.target;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const formData = new FormData(form);
  state.owner = String(formData.get("owner") || "").trim();
  state.repo = String(formData.get("repo") || "").trim();
  state.branch = String(formData.get("branch") || "main").trim() || "main";
  state.token = String(formData.get("token") || "").trim();
  state.remember = Boolean(form.elements.remember?.checked);
  state.error = "";
  const button = form.querySelector("[data-login-submit]");
  if (button) {
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> 正在验证并读取…';
  }
  await connect();
}

function handleClick(event) {
  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;

  if (action === "toggle-token") {
    const input = document.querySelector("#github-token");
    if (!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    actionEl.innerHTML = icon(show ? "eye-off" : "eye", 16);
    actionEl.setAttribute("aria-label", show ? "隐藏令牌" : "显示令牌");
    return;
  }

  if (action === "switch-tab") {
    state.activeTab = actionEl.dataset.tab;
    state.notice = null;
    renderActiveTab();
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  if (action === "clear-hero-image") {
    setPath(state.docs.site, "hero.artImage", "");
    delete state.pendingImages.hero;
    markDirty();
    renderActiveTab();
    showToast("已恢复内置插画，发布后生效。");
    return;
  }

  if (action === "add-member") openMemberEditor();
  if (action === "edit-member") openMemberEditor(actionEl.dataset.id);
  if (action === "delete-member") deleteEntity("members", actionEl.dataset.id);
  if (action === "add-project") openProjectEditor();
  if (action === "edit-project") openProjectEditor(actionEl.dataset.id);
  if (action === "delete-project") deleteEntity("projects", actionEl.dataset.id);
  if (action === "add-build") openBuildEditor();
  if (action === "edit-build") openBuildEditor(actionEl.dataset.id);
  if (action === "delete-build") deleteEntity("builds", actionEl.dataset.id);
  if (action === "add-news") openNewsEditor();
  if (action === "edit-news") openNewsEditor(actionEl.dataset.id);
  if (action === "delete-news") deleteEntity("news", actionEl.dataset.id);
  if (action === "dismiss-notice") {
    state.notice = null;
    renderActiveTab();
  }
  if (action === "refresh") refreshFromRepo();
  if (action === "preview") previewDraft();
  if (action === "publish") publishChanges();
}

function handleInput(event) {
  if (!event.target.closest("#site-settings")) return;
  handleSiteInput(event);
}

function handleLogoutClick() {
  if (isDirty() && !window.confirm("还有未发布的修改，确定退出吗？未发布的修改会丢失。")) return;
  clearStoredToken();
  state.token = "";
  state.docs = null;
  state.initialDocs = null;
  state.connected = false;
  state.notice = null;
  state.error = "";
  state.busy = false;
  updateTopbarForLogin();
  renderLogin();
  showToast("已退出内容工作台。");
}

function setupEvents() {
  app.addEventListener("submit", (event) => {
    if (event.target.id === "login-form") handleLoginSubmit(event);
  });
  app.addEventListener("click", handleClick);
  app.addEventListener("input", handleInput);
  app.addEventListener("change", handleInput);
  logoutButton?.addEventListener("click", handleLogoutClick);
  window.addEventListener("beforeunload", (event) => {
    if (!isDirty()) return;
    event.preventDefault();
    event.returnValue = "";
  });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */

async function boot() {
  setupEvents();
  const saved = loadSavedSettings();
  const inferred = inferGitHubRepo();
  state.owner = saved.owner || inferred.owner || "";
  state.repo = saved.repo || inferred.repo || "";
  state.branch = saved.branch || inferred.branch || "main";
  state.remember =
    window.localStorage.getItem(CONFIG.admin.rememberKey) === "true";

  const token = readStoredToken();
  if (!token) {
    renderLogin();
    return;
  }

  state.token = token;
  app.innerHTML = `
    <div class="admin-loading" role="status" aria-live="polite">
      <div class="admin-loading__bar"><span></span></div>
      <p>正在用保存的令牌连接 GitHub…</p>
    </div>`;
  await connect({ silent: true });
}

boot();
