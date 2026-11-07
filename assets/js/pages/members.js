import { icon } from "../icons.js";
import { emptyState, memberCard, pageHeader } from "../ui.js";
import {
  debounce,
  escapeHTML,
  normalizeText
} from "../utils.js";

const ROLE_ORDER = [
  "会长",
  "副会长",
  "建筑师",
  "红石工程师",
  "景观设计",
  "开发者",
  "摄影师",
  "成员",
  "新成员"
];

function roleRank(role) {
  const index = ROLE_ORDER.indexOf(role);
  return index === -1 ? ROLE_ORDER.length : index;
}

export function membersPage(data) {
  const members = data.members;
  const roles = [...new Set(members.map((member) => member.role))].sort(
    (a, b) => roleRank(a) - roleRank(b)
  );
  const statuses = [...new Set(members.map((member) => member.status))];
  const activeCount = members.filter((member) => member.status === "活跃").length;

  const html = `
    ${pageHeader({
      index: "01",
      english: "MEMBER DIRECTORY",
      title: '成员名录<span class="title-dot">.</span>',
      description:
        "名册记录每一位同行者。这里没有等级表，只有谁在负责什么、最近在忙哪一块。点击卡片，可以认识得更多一点。",
      children: `
        <div class="page-header__metrics">
          <span><strong>${members.length}</strong> 位伙伴</span>
          <span><strong>${activeCount}</strong> 位近期活跃</span>
          <span><strong>${roles.length}</strong> 种分工</span>
        </div>`
    })}

    <section class="section section--directory">
      <div class="container">
        <div class="directory-toolbar reveal">
          <label class="search-field" for="member-search">
            <span class="search-field__icon">${icon("search", 18)}</span>
            <span class="sr-only">搜索成员</span>
            <input id="member-search" type="search" placeholder="搜索名字、职位或标签…" autocomplete="off" />
            <button class="search-field__clear" type="button" data-clear-search aria-label="清空搜索" hidden>${icon("close", 15)}</button>
            <kbd class="search-field__kbd">/</kbd>
          </label>
          <label class="select-field">
            <span class="sr-only">按状态筛选</span>
            <select id="member-status">
              <option value="全部">全部状态</option>
              ${statuses.map((status) => `<option value="${escapeHTML(status)}">${escapeHTML(status)}</option>`).join("")}
            </select>
            ${icon("chevron-down", 15)}
          </label>
          <label class="select-field">
            <span class="sr-only">排序方式</span>
            <select id="member-sort">
              <option value="default">默认排序</option>
              <option value="joined">最近加入</option>
              <option value="name">按名字</option>
              <option value="role">按职位</option>
            </select>
            ${icon("chevron-down", 15)}
          </label>
          <button type="button" class="filter-reset" id="member-reset" hidden>重置 ${icon("refresh", 14)}</button>
        </div>

        <div class="filter-row reveal">
          <span class="filter-row__label">${icon("filter", 15)} 职位</span>
          <div class="chip-row" id="member-roles" role="group" aria-label="按职位筛选">
            <button type="button" class="chip is-active" data-role="全部" aria-pressed="true">全部 <span>${members.length}</span></button>
            ${roles
              .map((role) => {
                const count = members.filter((member) => member.role === role).length;
                return `<button type="button" class="chip" data-role="${escapeHTML(role)}" aria-pressed="false">${escapeHTML(role)} <span>${count}</span></button>`;
              })
              .join("")}
          </div>
        </div>

        <div class="result-bar reveal">
          <p id="member-count" aria-live="polite">共 ${members.length} 位伙伴</p>
          <span class="result-bar__hint">${icon("info", 14)} 点击卡片查看成员资料</span>
        </div>

        <h2 class="sr-only">成员列表</h2>
        <div class="member-grid" id="member-grid">
          ${
            members.length
              ? members.map((member) => memberCard(member)).join("")
              : emptyState("名册还是空的", "可以在后台添加第一位成员。", "users")
          }
        </div>
      </div>
    </section>
  `;

  return {
    title: `成员名录｜神州 ${data.site.guild?.server || "OrangeMC"}`,
    description: "神州公会成员名录，可按职位、状态查询。",
    html,
    mount(root) {
      const search = root.querySelector("#member-search");
      const status = root.querySelector("#member-status");
      const sort = root.querySelector("#member-sort");
      const clearSearch = root.querySelector("[data-clear-search]");
      const reset = root.querySelector("#member-reset");
      const roleRow = root.querySelector("#member-roles");
      const grid = root.querySelector("#member-grid");
      const count = root.querySelector("#member-count");

      let activeRole = "全部";

      const updateReset = () => {
        const hasFilters =
          Boolean(search.value.trim()) ||
          activeRole !== "全部" ||
          status.value !== "全部" ||
          sort.value !== "default";
        reset.hidden = !hasFilters;
        clearSearch.hidden = !search.value;
      };

      const render = () => {
        const query = normalizeText(search.value);
        let filtered = members.filter((member) => {
          if (activeRole !== "全部" && member.role !== activeRole) return false;
          if (status.value !== "全部" && member.status !== status.value) return false;
          if (!query) return true;
          const haystack = normalizeText(
            [
              member.name,
              member.role,
              member.title,
              member.contributions,
              member.favoriteBlock,
              ...(member.tags || [])
            ].join(" ")
          );
          return haystack.includes(query);
        });

        if (sort.value === "joined") {
          filtered = [...filtered].sort((a, b) =>
            String(b.joined).localeCompare(String(a.joined))
          );
        } else if (sort.value === "name") {
          filtered = [...filtered].sort((a, b) =>
            String(a.name).localeCompare(String(b.name), "zh-Hans-CN")
          );
        } else if (sort.value === "role") {
          filtered = [...filtered].sort(
            (a, b) =>
              roleRank(a.role) - roleRank(b.role) ||
              String(a.joined).localeCompare(String(b.joined))
          );
        }

        grid.innerHTML = filtered.length
          ? filtered.map((member) => memberCard(member)).join("")
          : emptyState(
              "没有找到这位伙伴",
              "换一个关键词，或者把筛选条件放宽一点。",
              "users"
            );

        count.textContent =
          filtered.length === members.length
            ? `共 ${members.length} 位伙伴`
            : `找到 ${filtered.length} 位伙伴`;
        updateReset();
      };

      const setRole = (role) => {
        activeRole = role;
        roleRow.querySelectorAll("[data-role]").forEach((button) => {
          const isActive = button.dataset.role === role;
          button.classList.toggle("is-active", isActive);
          button.setAttribute("aria-pressed", String(isActive));
        });
        render();
      };

      roleRow.addEventListener("click", (event) => {
        const button = event.target.closest("[data-role]");
        if (button) setRole(button.dataset.role);
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
      status.addEventListener("change", render);
      sort.addEventListener("change", render);
      clearSearch.addEventListener("click", () => {
        search.value = "";
        render();
        search.focus();
      });
      reset.addEventListener("click", () => {
        search.value = "";
        status.value = "全部";
        sort.value = "default";
        setRole("全部");
        search.focus();
      });

      // 在页面内按 / 快速搜索；输入框内不拦截。
      const onKeydown = (event) => {
        if (
          event.key === "/" &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey &&
          !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
        ) {
          event.preventDefault();
          search.focus();
        }
      };
      document.addEventListener("keydown", onKeydown);

      updateReset();
      return () => document.removeEventListener("keydown", onKeydown);
    }
  };
}
