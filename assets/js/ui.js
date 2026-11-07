import { icon } from "./icons.js";
import {
  clamp,
  escapeHTML,
  formatDate,
  hashString
} from "./utils.js";

const AVATAR_PALETTES = [
  { bg: "#f0a55a", skin: "#e8bb8f", shade: "#d29b6f", hair: "#3b2920", hairDark: "#271b16", extra: "#f6d48a", shirt: "#6e3f2a" },
  { bg: "#8fc4a7", skin: "#f0c9a0", shade: "#d8ac84", hair: "#25211d", hairDark: "#171411", extra: "#f1d18a", shirt: "#38584a" },
  { bg: "#dd8067", skin: "#d9a06f", shade: "#bd8154", hair: "#5c3425", hairDark: "#3d2118", extra: "#f3c7a1", shirt: "#59362e" },
  { bg: "#ddc17c", skin: "#f4d3b3", shade: "#dfb994", hair: "#92704c", hairDark: "#6b4f35", extra: "#faf1d9", shirt: "#5d4b32" },
  { bg: "#91acd2", skin: "#c98b62", shade: "#aa704b", hair: "#1f1b2e", hairDark: "#12101c", extra: "#c9dcf3", shirt: "#2e3b54" },
  { bg: "#d999ab", skin: "#efc59d", shade: "#d5a77e", hair: "#5a2d2b", hairDark: "#3f1f1e", extra: "#f5d9c2", shirt: "#5c3440" }
];

export function avatar(name = "?", size = "md") {
  const h = hashString(name);
  const palette = AVATAR_PALETTES[h % AVATAR_PALETTES.length];
  const hairStyle = (h >> 3) % 4;
  const accessory = (h >> 6) % 5;
  const eyeY = 7;
  let hair = "";
  let extra = "";

  if (hairStyle === 0) {
    hair = `
      <rect x="2" y="2" width="12" height="3" fill="${palette.hair}"/>
      <rect x="2" y="5" width="3" height="4" fill="${palette.hair}"/>
      <rect x="11" y="5" width="3" height="4" fill="${palette.hair}"/>
      <rect x="3" y="2" width="10" height="1" fill="${palette.hairDark}"/>`;
  } else if (hairStyle === 1) {
    hair = `
      <rect x="2" y="2" width="12" height="2" fill="${palette.hair}"/>
      <rect x="2" y="4" width="4" height="3" fill="${palette.hair}"/>
      <rect x="10" y="4" width="4" height="2" fill="${palette.hair}"/>
      <rect x="4" y="4" width="3" height="1" fill="${palette.hairDark}"/>`;
  } else if (hairStyle === 2) {
    hair = `
      <rect x="2" y="2" width="12" height="3" fill="${palette.hair}"/>
      <rect x="2" y="4" width="2" height="5" fill="${palette.hair}"/>
      <rect x="12" y="4" width="2" height="3" fill="${palette.hair}"/>
      <rect x="6" y="5" width="4" height="1" fill="${palette.hairDark}"/>`;
  } else {
    hair = `
      <rect x="2" y="2" width="12" height="4" fill="${palette.hair}"/>
      <rect x="2" y="5" width="2" height="3" fill="${palette.hair}"/>
      <rect x="12" y="5" width="2" height="2" fill="${palette.hair}"/>
      <rect x="6" y="4" width="4" height="1" fill="${palette.hairDark}"/>`;
  }

  if (accessory === 1) {
    extra = `<rect x="2" y="5" width="12" height="1" fill="${palette.extra}"/>`;
  } else if (accessory === 2) {
    extra = `
      <rect x="12" y="3" width="2" height="2" fill="${palette.extra}"/>
      <rect x="13" y="4" width="1" height="1" fill="#f7e7c6"/>`;
  } else if (accessory === 3) {
    extra = `
      <rect x="3" y="6" width="6" height="2" fill="${palette.hairDark}"/>
      <rect x="8" y="6" width="6" height="2" fill="${palette.hairDark}"/>
      <rect x="4" y="6" width="4" height="1" fill="${palette.extra}"/>
      <rect x="9" y="6" width="4" height="1" fill="${palette.extra}"/>`;
  } else if (accessory === 4) {
    extra = `<rect x="5" y="5" width="6" height="1" fill="${palette.extra}" opacity=".9"/>`;
  }

  return `
    <span class="avatar avatar--${escapeHTML(size)}" aria-hidden="true">
      <svg viewBox="0 0 16 16" shape-rendering="crispEdges" focusable="false">
        <rect width="16" height="16" fill="${palette.bg}"/>
        <rect x="2" y="2" width="12" height="12" fill="${palette.skin}"/>
        <rect x="2" y="12" width="12" height="2" fill="${palette.shade}"/>
        <rect x="3" y="14" width="10" height="2" fill="${palette.shirt}"/>
        ${hair}
        <rect x="4" y="${eyeY}" width="2" height="2" fill="#f7f1e3"/>
        <rect x="10" y="${eyeY}" width="2" height="2" fill="#f7f1e3"/>
        <rect x="5" y="${eyeY}" width="1" height="2" fill="${palette.hairDark}"/>
        <rect x="11" y="${eyeY}" width="1" height="2" fill="${palette.hairDark}"/>
        <rect x="8" y="10" width="2" height="1" fill="${palette.hairDark}" opacity=".75"/>
        <rect x="7" y="11" width="1" height="1" fill="${palette.shade}"/>
        <rect x="9" y="11" width="1" height="1" fill="${palette.shade}"/>
        ${extra}
      </svg>
    </span>`;
}

export function statusBadge(status, kind = "project") {
  const normalized = String(status || "未知");
  const slug = PROJECT_STATUS_CLASS[normalized] || MEMBER_STATUS_CLASS[normalized] || "neutral";
  return `<span class="status status--${slug}"><span class="status-dot"></span>${escapeHTML(normalized)}</span>`;
}

const PROJECT_STATUS_CLASS = {
  规划中: "planned",
  进行中: "active",
  收尾中: "finishing",
  已完工: "done",
  暂停: "paused"
};

const MEMBER_STATUS_CLASS = {
  活跃: "active",
  暂离: "away",
  休假: "away"
};

export function dimensionClass(dimension = "") {
  if (dimension === "下界") return "nether";
  if (dimension === "末地") return "end";
  return "overworld";
}

export function categoryIcon(category = "") {
  const map = {
    建筑: "building",
    交通: "train",
    红石: "zap",
    景观: "leaf",
    公共设施: "pin",
    农场: "leaf",
    地标: "pin",
    摄影: "sparkles"
  };
  return map[category] || "hammer";
}

export function progressBar(progress, label = "工程进度") {
  const value = clamp(progress, 0, 100);
  return `
    <div class="progress" role="progressbar" aria-label="${escapeHTML(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}">
      <span class="progress__fill" style="width:${value}%"></span>
    </div>`;
}

export function projectCard(project) {
  const progress = clamp(project.progress, 0, 100);
  const team = Array.isArray(project.team) ? project.team : [];
  return `
    <article class="project-card reveal" data-project-card="${escapeHTML(project.id)}" data-project-status="${escapeHTML(project.status)}">
      <div class="project-card__top">
        <span class="eyebrow-tag">${icon(categoryIcon(project.category), 15)}${escapeHTML(project.category)}</span>
        ${statusBadge(project.status)}
      </div>
      <h3 class="project-card__title">
        <button type="button" class="link-reset" data-open-project="${escapeHTML(project.id)}">${escapeHTML(project.name)}</button>
      </h3>
      <p class="project-card__subtitle">${escapeHTML(project.subtitle || "")}</p>
      <p class="project-card__desc">${escapeHTML(project.description || "")}</p>
      <div class="project-card__progress">
        <div class="progress-label">
          <span>当前进度</span>
          <strong>${progress}<small>%</small></strong>
        </div>
        ${progressBar(progress, `${project.name} 工程进度`)}
      </div>
      <div class="project-card__meta">
        <span>${icon("users", 15)}${escapeHTML(project.lead || "待定")} 负责</span>
        <span>${icon("calendar", 15)}目标 ${formatDate(project.target, "待定")}</span>
      </div>
      <div class="project-card__foot">
        <div class="avatar-stack" aria-label="参与成员">
          ${team.slice(0, 3).map((member) => avatar(member, "xs")).join("")}
          ${team.length > 3 ? `<span class="avatar-more">+${team.length - 3}</span>` : ""}
        </div>
        <button type="button" class="text-link" data-open-project="${escapeHTML(project.id)}">
          工程详情 ${icon("arrow-right", 16)}
        </button>
      </div>
    </article>`;
}

export function memberCard(member) {
  const tags = Array.isArray(member.tags) ? member.tags : [];
  return `
    <article class="member-card reveal">
      <button type="button" class="member-card__hit" data-open-member="${escapeHTML(member.id)}" aria-label="查看 ${escapeHTML(member.name)} 的成员资料"></button>
      <div class="member-card__top">
        ${avatar(member.name, "md")}
        <div class="member-card__identity">
          <h3>${escapeHTML(member.name)}</h3>
          <p>${escapeHTML(member.role)}</p>
        </div>
        ${statusBadge(member.status, "member")}
      </div>
      <p class="member-card__title">“${escapeHTML(member.title || "神州的一员")}”</p>
      <div class="tag-row">
        ${tags.slice(0, 3).map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}
      </div>
      <p class="member-card__now">
        <span>最近</span>${escapeHTML(member.contributions || "在自己的小基地里慢慢来")}
      </p>
      <div class="member-card__foot">
        <span>${icon("calendar", 14)}${formatDate(member.joined)} 加入</span>
        <span class="member-card__arrow">${icon("arrow-up-right", 16)}</span>
      </div>
    </article>`;
}

export function buildRow(build) {
  const dim = dimensionClass(build.dimension);
  const coordsText = `X ${build.x} · Y ${build.y} · Z ${build.z}`;
  const tpCommand = `/tp @s ${build.x} ${build.y} ${build.z}`;
  return `
    <div class="build-row" data-build-row="${escapeHTML(build.id)}">
      <div class="build-row__main">
        <span class="build-row__icon">${icon(categoryIcon(build.category), 18)}</span>
        <div>
          <button type="button" class="link-reset build-row__name" data-open-build="${escapeHTML(build.id)}">${escapeHTML(build.name)}</button>
          <p>${escapeHTML(build.description || "")}</p>
        </div>
      </div>
      <div class="build-row__meta">
        <span class="build-row__cat" data-label="分类">${escapeHTML(build.category)}</span>
        <span class="dimension dimension--${dim}" data-label="维度"><span class="dimension__dot"></span>${escapeHTML(build.dimension)}</span>
        <span class="build-row__builder" data-label="建造者">${escapeHTML(build.builder)}</span>
      </div>
      <div class="coords" data-label="坐标">
        <span><b>X</b> ${escapeHTML(build.x)}</span>
        <span><b>Y</b> ${escapeHTML(build.y)}</span>
        <span><b>Z</b> ${escapeHTML(build.z)}</span>
      </div>
      <div class="build-row__actions">
        <button type="button" class="mini-btn" data-copy="${escapeHTML(coordsText)}" data-copy-label="坐标已复制">
          ${icon("copy", 14)}<span>坐标</span>
        </button>
        <button type="button" class="mini-icon-btn" data-copy="${escapeHTML(tpCommand)}" data-copy-label="传送指令已复制" aria-label="复制 ${escapeHTML(build.name)} 的传送指令" title="复制 /tp 指令">
          ${icon("compass", 15)}
        </button>
      </div>
    </div>`;
}

export function emptyState(title, description, iconName = "search") {
  return `
    <div class="empty-state">
      <span class="empty-state__icon">${icon(iconName, 28)}</span>
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(description)}</p>
    </div>`;
}

export function toast(message, type = "success") {
  const root = document.querySelector("#toast-root");
  if (!root) return;
  const item = document.createElement("div");
  item.className = `toast toast--${type}`;
  item.innerHTML = `${icon(type === "error" ? "alert" : "check", 17)}<span>${escapeHTML(message)}</span>`;
  root.append(item);
  requestAnimationFrame(() => item.classList.add("is-visible"));
  window.setTimeout(() => {
    item.classList.remove("is-visible");
    window.setTimeout(() => item.remove(), 220);
  }, 2600);
}

export function openDialog({ eyebrow = "", title, subtitle = "", body = "", foot = "" }) {
  document.querySelector("dialog.detail-dialog")?.close();

  const dialog = document.createElement("dialog");
  dialog.className = "detail-dialog";
  dialog.setAttribute("aria-labelledby", "dialog-title");
  dialog.innerHTML = `
    <div class="dialog-panel">
      <button type="button" class="dialog-close" data-dialog-close aria-label="关闭">${icon("close", 20)}</button>
      <div class="dialog-head">
        ${eyebrow ? `<p class="dialog-eyebrow">${eyebrow}</p>` : ""}
        <h2 id="dialog-title">${title}</h2>
        ${subtitle ? `<p class="dialog-subtitle">${subtitle}</p>` : ""}
      </div>
      <div class="dialog-body">${body}</div>
      ${foot ? `<div class="dialog-foot">${foot}</div>` : ""}
    </div>`;
  document.body.append(dialog);
  document.body.classList.add("dialog-open");
  dialog.showModal();

  const close = () => dialog.close();
  dialog.querySelectorAll("[data-dialog-close]").forEach((button) => {
    button.addEventListener("click", close);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    dialog.remove();
  });
  dialog.querySelector("[data-dialog-close]")?.focus({ preventScroll: true });
  return dialog;
}

export function metaRow(label, value, iconName = "") {
  return `
    <div class="meta-row">
      <span class="meta-row__label">${iconName ? icon(iconName, 15) : ""}${escapeHTML(label)}</span>
      <span class="meta-row__value">${value}</span>
    </div>`;
}

export function pageHeader({ index, english, title, description, children = "" }) {
  return `
    <section class="page-header">
      <div class="container">
        <div class="page-header__top">
          <p class="eyebrow"><span class="eyebrow__index">${escapeHTML(index)}</span>${escapeHTML(english)}</p>
          <span class="page-header__rule" aria-hidden="true"></span>
        </div>
        <div class="page-header__grid">
          <h1>${title}</h1>
          <div class="page-header__aside">
            <p>${description}</p>
            ${children}
          </div>
        </div>
      </div>
    </section>`;
}

export function statCard(value, label, note = "") {
  return `
    <div class="stat-card">
      <strong>${escapeHTML(value)}</strong>
      <span>${escapeHTML(label)}</span>
      ${note ? `<small>${escapeHTML(note)}</small>` : ""}
    </div>`;
}
