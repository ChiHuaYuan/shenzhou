import { icon } from "./icons.js";
import {
  avatar,
  dimensionClass,
  openDialog,
  progressBar,
  statusBadge
} from "./ui.js";
import {
  clamp,
  escapeHTML,
  formatDate
} from "./utils.js";

export function openProjectDialog(data, id) {
  const project = data.projects.find((item) => item.id === id);
  if (!project) return;

  const team = Array.isArray(project.team) ? project.team : [];
  const milestones = Array.isArray(project.milestones) ? project.milestones : [];
  const updates = Array.isArray(project.updates) ? project.updates : [];
  const progress = clamp(project.progress, 0, 100);

  const body = `
    <div class="detail-progress">
      <div class="detail-progress__head">
        <span>当前进度</span>
        <strong>${progress}<small>%</small></strong>
      </div>
      ${progressBar(progress, `${project.name} 工程进度`)}
    </div>

    <div class="detail-meta-grid">
      <div><span>负责人</span><strong>${escapeHTML(project.lead || "待定")}</strong></div>
      <div><span>开始时间</span><strong>${formatDate(project.start, "待定")}</strong></div>
      <div><span>目标节点</span><strong>${formatDate(project.target, "待定")}</strong></div>
      <div><span>工程分类</span><strong>${escapeHTML(project.category)}</strong></div>
    </div>

    <div class="detail-section">
      <h3>关于这项工程</h3>
      <p class="detail-description">${escapeHTML(project.description || "")}</p>
    </div>

    ${
      team.length
        ? `
      <div class="detail-section">
        <h3>参与成员</h3>
        <div class="detail-team">
          ${team
            .map(
              (member) => `
            <span class="detail-team__member">${avatar(member, "xs")}<span>${escapeHTML(member)}</span></span>`
            )
            .join("")}
        </div>
      </div>`
        : ""
    }

    ${
      milestones.length
        ? `
      <div class="detail-section">
        <h3>里程碑</h3>
        <ul class="milestone-list">
          ${milestones
            .map(
              (milestone) => `
            <li class="${milestone.done ? "is-done" : ""}">
              <span class="milestone-check">${milestone.done ? icon("check", 12) : ""}</span>
              <span class="milestone-title">${escapeHTML(milestone.title)}</span>
              <span class="milestone-date">${escapeHTML(milestone.date || "")}</span>
            </li>`
            )
            .join("")}
        </ul>
      </div>`
        : ""
    }

    ${
      updates.length
        ? `
      <div class="detail-section">
        <h3>更新记录</h3>
        <ol class="detail-updates">
          ${updates
            .map(
              (update) => `
            <li>
              <time datetime="${escapeHTML(update.date)}">${formatDate(update.date)}</time>
              <p>${escapeHTML(update.text)}</p>
            </li>`
            )
            .join("")}
        </ol>
      </div>`
        : ""
    }
  `;

  openDialog({
    eyebrow: `${icon("hammer", 14)} ${escapeHTML(project.category)} · ${statusBadge(project.status)}`,
    title: escapeHTML(project.name),
    subtitle: escapeHTML(project.subtitle || ""),
    body,
    foot: `<span>最后更新：${formatDate(project.updates?.[0]?.date || project.target, "尚未更新")}</span><button type="button" class="btn btn--ghost btn--sm" data-dialog-close>关闭</button>`
  });
}

export function openMemberDialog(data, id) {
  const member = data.members.find((item) => item.id === id);
  if (!member) return;
  const tags = Array.isArray(member.tags) ? member.tags : [];

  const body = `
    <div class="member-profile">
      <div class="member-profile__identity">
        ${avatar(member.name, "xl")}
        <div>
          <p class="member-profile__quote">“${escapeHTML(member.title || "神州的一员")}”</p>
          <div class="tag-row">
            ${tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}
          </div>
        </div>
      </div>
      <p class="detail-description">${escapeHTML(member.bio || "")}</p>
      <div class="detail-meta-grid detail-meta-grid--three">
        <div><span>职位</span><strong>${escapeHTML(member.role)}</strong></div>
        <div><span>加入时间</span><strong>${formatDate(member.joined)}</strong></div>
        <div><span>最近在忙</span><strong>${escapeHTML(member.contributions || "自己的小基地")}</strong></div>
      </div>
      <div class="favorite-block">
        <span class="favorite-block__icon">${icon("hammer", 16)}</span>
        <span>最喜欢的方块</span>
        <strong>${escapeHTML(member.favoriteBlock || "未公开")}</strong>
      </div>
    </div>
  `;

  openDialog({
    eyebrow: `${icon("users", 14)} MEMBER PROFILE`,
    title: `${escapeHTML(member.name)} ${statusBadge(member.status, "member")}`,
    subtitle: escapeHTML(member.role),
    body,
    foot: `<span>神州的第 ${data.members.findIndex((item) => item.id === id) + 1} 位记录成员</span><button type="button" class="btn btn--ghost btn--sm" data-dialog-close>关闭</button>`
  });
}

export function openBuildDialog(data, id) {
  const build = data.builds.find((item) => item.id === id);
  if (!build) return;
  const dim = dimensionClass(build.dimension);
  const coords = `X ${build.x} · Y ${build.y} · Z ${build.z}`;
  const command = `/tp @s ${build.x} ${build.y} ${build.z}`;
  const tags = Array.isArray(build.tags) ? build.tags : [];

  const body = `
    <div class="coordinate-display">
      <div class="coordinate-display__dimension">
        <span class="dimension dimension--${dim}"><span class="dimension__dot"></span>${escapeHTML(build.dimension)}</span>
        <span class="coordinate-display__category">${escapeHTML(build.category)}</span>
      </div>
      <div class="coordinate-display__values">
        <span><small>X</small><strong>${escapeHTML(build.x)}</strong></span>
        <span><small>Y</small><strong>${escapeHTML(build.y)}</strong></span>
        <span><small>Z</small><strong>${escapeHTML(build.z)}</strong></span>
      </div>
      <div class="coordinate-display__actions">
        <button type="button" class="btn btn--ghost btn--sm" data-copy="${escapeHTML(coords)}" data-copy-label="坐标已复制">${icon("copy", 15)} 复制坐标</button>
        <button type="button" class="btn btn--primary btn--sm" data-copy="${escapeHTML(command)}" data-copy-label="传送指令已复制">${icon("compass", 15)} 复制 /tp</button>
      </div>
    </div>

    <p class="detail-description">${escapeHTML(build.description || "")}</p>

    <div class="detail-meta-grid">
      <div><span>建造者</span><strong>${escapeHTML(build.builder || "未知")}</strong></div>
      <div><span>记录日期</span><strong>${formatDate(build.date, "未标注")}</strong></div>
      <div><span>分类</span><strong>${escapeHTML(build.category)}</strong></div>
      <div><span>传送指令</span><strong class="mono">${escapeHTML(command)}</strong></div>
    </div>

    ${
      tags.length
        ? `<div class="tag-row tag-row--spaced">${tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}</div>`
        : ""
    }

    <p class="detail-warning">${icon("info", 15)} 公开坐标仅用于参观。请勿擅自改动他人建筑或取走物资。</p>
  `;

  openDialog({
    eyebrow: `${icon("pin", 14)} COORDINATE`,
    title: escapeHTML(build.name),
    subtitle: "复制坐标，出发去看看。",
    body,
    foot: `<span>由 ${escapeHTML(build.builder || "成员")} 公开</span><button type="button" class="btn btn--ghost btn--sm" data-dialog-close>关闭</button>`
  });
}
