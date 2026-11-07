import { icon } from "../icons.js";
import { buildRow, dimensionClass, emptyState, pageHeader } from "../ui.js";
import {
  debounce,
  escapeHTML,
  normalizeText
} from "../utils.js";

const DIMENSIONS = ["主世界", "下界", "末地"];

export function buildsPage(data) {
  const builds = data.builds.filter((build) => build.public !== false);
  const categories = [...new Set(builds.map((build) => build.category))];
  const activeDimensions = DIMENSIONS.filter((dimension) =>
    builds.some((build) => build.dimension === dimension)
  );

  const html = `
    ${pageHeader({
      index: "03",
      english: "LANDMARKS & COORDINATES",
      title: '建筑坐标<span class="title-dot">.</span>',
      description:
        "把值得一看的地方标在山河之间。所有坐标均经过建造者同意后公开；复制坐标或传送指令，就可以出发。",
      children: `
        <div class="page-header__metrics">
          <span><strong>${builds.length}</strong> 处公开地点</span>
          <span><strong>${activeDimensions.length}</strong> 个维度</span>
          <span><strong>${categories.length}</strong> 种类型</span>
        </div>`
    })}

    <section class="section section--builds">
      <div class="container">
        <div class="coordinate-note reveal">
          <span class="coordinate-note__icon">${icon("pin", 20)}</span>
          <div>
            <strong>坐标由建造者主动公开</strong>
            <p>请勿在他人基地内翻找物资或随意改建。传送前请确认 Y 轴高度，避免卡在方块里。</p>
          </div>
          <span class="coordinate-note__format">X / Y / Z</span>
        </div>

        <div class="directory-toolbar reveal">
          <label class="search-field" for="build-search">
            <span class="search-field__icon">${icon("search", 18)}</span>
            <span class="sr-only">搜索建筑</span>
            <input id="build-search" type="search" placeholder="搜索建筑、建造者或标签…" autocomplete="off" />
            <button class="search-field__clear" type="button" data-clear-search aria-label="清空搜索" hidden>${icon("close", 15)}</button>
          </label>
          <label class="select-field">
            <span class="sr-only">按类型筛选</span>
            <select id="build-category">
              <option value="全部">全部类型</option>
              ${categories.map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join("")}
            </select>
            ${icon("chevron-down", 15)}
          </label>
          <button type="button" class="filter-reset" id="build-reset" hidden>重置 ${icon("refresh", 14)}</button>
        </div>

        <div class="filter-row reveal">
          <span class="filter-row__label">${icon("globe", 15)} 维度</span>
          <div class="chip-row" id="build-dimensions" role="group" aria-label="按维度筛选">
            <button type="button" class="chip is-active" data-dimension="全部" aria-pressed="true">全部 <span>${builds.length}</span></button>
            ${activeDimensions
              .map((dimension) => {
                const count = builds.filter((build) => build.dimension === dimension).length;
                return `<button type="button" class="chip" data-dimension="${escapeHTML(dimension)}" aria-pressed="false"><span class="dimension__dot dimension__dot--${dimensionClass(dimension)}"></span>${escapeHTML(dimension)} <span>${count}</span></button>`;
              })
              .join("")}
          </div>
        </div>

        <div class="result-bar reveal">
          <p id="build-count" aria-live="polite">共 ${builds.length} 处公开地点</p>
          <span class="result-bar__hint">${icon("copy", 14)} 点击「坐标」复制 X / Y / Z，点击指南针复制 /tp 指令</span>
        </div>

        <h2 class="sr-only">公开坐标列表</h2>
        <div class="build-table reveal">
          <div class="build-table__head" aria-hidden="true">
            <span>建筑 / 简介</span>
            <span>类型</span>
            <span>维度</span>
            <span>建造者</span>
            <span>坐标</span>
            <span class="build-table__action-head">操作</span>
          </div>
          <div id="build-rows">
            ${
              builds.length
                ? builds.map((build) => buildRow(build)).join("")
                : emptyState("还没有公开坐标", "可以在后台添加第一处公开地点。", "map")
            }
          </div>
        </div>
      </div>
    </section>
  `;

  return {
    title: `建筑坐标｜神州 ${data.site.guild?.server || "OrangeMC"}`,
    description: "神州公会公开建筑坐标查询，支持复制坐标与传送指令。",
    html,
    mount(root) {
      const search = root.querySelector("#build-search");
      const category = root.querySelector("#build-category");
      const reset = root.querySelector("#build-reset");
      const dimensionRow = root.querySelector("#build-dimensions");
      const rows = root.querySelector("#build-rows");
      const count = root.querySelector("#build-count");
      let activeDimension = "全部";

      const updateReset = () => {
        const hasFilters =
          Boolean(search.value.trim()) ||
          activeDimension !== "全部" ||
          category.value !== "全部";
        reset.hidden = !hasFilters;
        root.querySelector("[data-clear-search]").hidden = !search.value;
      };

      const render = () => {
        const query = normalizeText(search.value);
        const filtered = builds.filter((build) => {
          if (activeDimension !== "全部" && build.dimension !== activeDimension) return false;
          if (category.value !== "全部" && build.category !== category.value) return false;
          if (!query) return true;
          return normalizeText(
            [
              build.name,
              build.category,
              build.dimension,
              build.builder,
              build.description,
              ...(build.tags || [])
            ].join(" ")
          ).includes(query);
        });

        rows.innerHTML = filtered.length
          ? filtered.map((build) => buildRow(build)).join("")
          : emptyState(
              "这片区域还没有坐标",
              "换一个关键词，或者把搜索范围放宽一点。",
              "map"
            );
        count.textContent =
          filtered.length === builds.length
            ? `共 ${builds.length} 处公开地点`
            : `找到 ${filtered.length} 处公开地点`;
        updateReset();
      };

      const setDimension = (dimension) => {
        activeDimension = dimension;
        dimensionRow.querySelectorAll("[data-dimension]").forEach((button) => {
          const isActive = button.dataset.dimension === dimension;
          button.classList.toggle("is-active", isActive);
          button.setAttribute("aria-pressed", String(isActive));
        });
        render();
      };

      dimensionRow.addEventListener("click", (event) => {
        const button = event.target.closest("[data-dimension]");
        if (button) setDimension(button.dataset.dimension);
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
        setDimension("全部");
        search.focus();
      });

      updateReset();
    }
  };
}
