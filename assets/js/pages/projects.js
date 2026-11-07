import { icon } from "../icons.js";
import {
  emptyState,
  pageHeader,
  projectCard
} from "../ui.js";
import {
  debounce,
  escapeHTML,
  formatDate,
  normalizeText
} from "../utils.js";

const STATUS_ORDER = ["进行中", "收尾中", "规划中", "已完工", "暂停"];

export function projectsPage(data) {
  const projects = data.projects;
  const active = projects.filter((project) =>
    ["进行中", "收尾中"].includes(project.status)
  );
  const completed = projects.filter((project) => project.status === "已完工");
  const average = projects.length
    ? Math.round(
        projects.reduce((sum, project) => sum + Number(project.progress || 0), 0) /
          projects.length
      )
    : 0;
  const statuses = [...new Set(projects.map((project) => project.status))].sort(
    (a, b) => {
      const ai = STATUS_ORDER.indexOf(a);
      const bi = STATUS_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    }
  );
  const categories = [...new Set(projects.map((project) => project.category))];

  const recentUpdates = projects
    .flatMap((project) =>
      (project.updates || []).map((update) => ({
        ...update,
        projectName: project.name,
        projectId: project.id,
        status: project.status
      }))
    )
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 5);

  const html = `
    ${pageHeader({
      index: "02",
      english: "BUILD LOG",
      title: '工程进度<span class="title-dot">.</span>',
      description:
        "每一座城都是从第一块石头开始的。这里记录神州公共工程的当前进度、负责成员与最近一次更新。数据由站长维护。",
      children: `
        <div class="page-header__metrics">
          <span><strong>${active.length}</strong> 项正在推进</span>
          <span><strong>${completed.length}</strong> 项已完工</span>
          <span><strong>${average}%</strong> 平均进度</span>
        </div>`
    })}

    <section class="section section--projects">
      <div class="container">
        <div class="directory-toolbar reveal">
          <label class="search-field" for="project-search">
            <span class="search-field__icon">${icon("search", 18)}</span>
            <span class="sr-only">搜索工程</span>
            <input id="project-search" type="search" placeholder="搜索工程、负责人或分类…" autocomplete="off" />
            <button class="search-field__clear" type="button" data-clear-search aria-label="清空搜索" hidden>${icon("close", 15)}</button>
          </label>
          <label class="select-field">
            <span class="sr-only">按分类筛选</span>
            <select id="project-category">
              <option value="全部">全部分类</option>
              ${categories.map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join("")}
            </select>
            ${icon("chevron-down", 15)}
          </label>
          <button type="button" class="filter-reset" id="project-reset" hidden>重置 ${icon("refresh", 14)}</button>
        </div>

        <div class="filter-row reveal">
          <span class="filter-row__label">${icon("filter", 15)} 状态</span>
          <div class="chip-row" id="project-status" role="group" aria-label="按工程状态筛选">
            <button type="button" class="chip is-active" data-status="全部" aria-pressed="true">全部 <span>${projects.length}</span></button>
            ${statuses
              .map((status) => {
                const count = projects.filter((project) => project.status === status).length;
                return `<button type="button" class="chip" data-status="${escapeHTML(status)}" aria-pressed="false">${escapeHTML(status)} <span>${count}</span></button>`;
              })
              .join("")}
          </div>
        </div>

        <div class="result-bar reveal">
          <p id="project-count" aria-live="polite">共 ${projects.length} 项工程</p>
          <span class="result-bar__hint">${icon("info", 14)} 点击工程卡片查看里程碑与更新记录</span>
        </div>

        <h2 class="sr-only">工程列表</h2>
        <div class="project-grid" id="project-grid">
          ${
            projects.length
              ? projects.map((project) => projectCard(project)).join("")
              : emptyState("还没有工程", "可以在后台记录第一项公共工程。", "hammer")
          }
        </div>

        ${
          recentUpdates.length
            ? `
          <div class="build-log reveal">
            <div class="build-log__head">
              <div>
                <p class="eyebrow"><span class="eyebrow__index">LOG</span>SITE UPDATES</p>
                <h2>最近工地动态</h2>
              </div>
              <span class="build-log__note">来自各工程的更新记录</span>
            </div>
            <ol class="update-timeline">
              ${recentUpdates
                .map(
                  (update) => `
                <li>
                  <time datetime="${escapeHTML(update.date)}">${formatDate(update.date)}</time>
                  <span class="update-timeline__dot"></span>
                  <div>
                    <button type="button" class="link-reset update-timeline__project" data-open-project="${escapeHTML(update.projectId)}">${escapeHTML(update.projectName)}</button>
                    <p>${escapeHTML(update.text)}</p>
                  </div>
                </li>`
                )
                .join("")}
            </ol>
          </div>`
            : ""
        }
      </div>
    </section>
  `;

  return {
    title: `工程进度｜神州 ${data.site.guild?.server || "OrangeMC"}`,
    description: "查看神州公会公共建筑的工程进度、里程碑与最新动态。",
    html,
    mount(root) {
      const search = root.querySelector("#project-search");
      const category = root.querySelector("#project-category");
      const reset = root.querySelector("#project-reset");
      const statusRow = root.querySelector("#project-status");
      const grid = root.querySelector("#project-grid");
      const count = root.querySelector("#project-count");
      let activeStatus = "全部";

      const updateReset = () => {
        const hasFilters =
          Boolean(search.value.trim()) ||
          activeStatus !== "全部" ||
          category.value !== "全部";
        reset.hidden = !hasFilters;
        root.querySelector("[data-clear-search]").hidden = !search.value;
      };

      const render = () => {
        const query = normalizeText(search.value);
        const filtered = projects.filter((project) => {
          if (activeStatus !== "全部" && project.status !== activeStatus) return false;
          if (category.value !== "全部" && project.category !== category.value) return false;
          if (!query) return true;
          return normalizeText(
            [
              project.name,
              project.subtitle,
              project.category,
              project.lead,
              project.description,
              ...(project.team || [])
            ].join(" ")
          ).includes(query);
        });

        grid.innerHTML = filtered.length
          ? filtered.map((project) => projectCard(project)).join("")
          : emptyState(
              "没有符合条件的工程",
              "换一个关键词，或者看看其他状态的工程。",
              "hammer"
            );
        count.textContent =
          filtered.length === projects.length
            ? `共 ${projects.length} 项工程`
            : `找到 ${filtered.length} 项工程`;
        updateReset();
      };

      const setStatus = (status) => {
        activeStatus = status;
        statusRow.querySelectorAll("[data-status]").forEach((button) => {
          const isActive = button.dataset.status === status;
          button.classList.toggle("is-active", isActive);
          button.setAttribute("aria-pressed", String(isActive));
        });
        render();
      };

      statusRow.addEventListener("click", (event) => {
        const button = event.target.closest("[data-status]");
        if (button) setStatus(button.dataset.status);
      });
      search.addEventListener(
        "input",
        debounce(() => render(), 110)
      );
      search.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          search.value = "";
          render();
          search.blur();
        }
      });
      category.addEventListener("change", render);
      root.querySelector("[data-clear-search]").addEventListener("click", () => {
        search.value = "";
        render();
        search.focus();
      });
      reset.addEventListener("click", () => {
        search.value = "";
        category.value = "全部";
        setStatus("全部");
        search.focus();
      });

      updateReset();
    }
  };
}
