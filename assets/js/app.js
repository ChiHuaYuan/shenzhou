import { CONFIG, isPreviewMode } from "./config.js";
import { loadData } from "./data.js";
import {
  openBuildDialog,
  openMemberDialog,
  openProjectDialog
} from "./details.js";
import { icon } from "./icons.js";
import { buildsPage } from "./pages/builds.js";
import { homePage } from "./pages/home.js";
import { joinPage } from "./pages/join.js";
import { membersPage } from "./pages/members.js";
import { projectsPage } from "./pages/projects.js";
import { toast } from "./ui.js";
import {
  copyText,
  escapeHTML,
  formatDate,
  isSafeExternalLink,
  prefersReducedMotion,
  safeUrl
} from "./utils.js";

const ROUTES = {
  home: { render: homePage, nav: "home" },
  members: { render: membersPage, nav: "members" },
  projects: { render: projectsPage, nav: "projects" },
  builds: { render: buildsPage, nav: "builds" },
  join: { render: joinPage, nav: "join" }
};

const app = document.querySelector("#app");
let bundle = null;
let currentRoute = null;
let currentCleanup = null;
let revealObserver = null;
let menuController = null;

function hashToPath(hash = window.location.hash) {
  if (!hash || hash === "#" || hash === "#/") return "";
  if (!hash.startsWith("#/")) return null;
  return hash.slice(2).replace(/^\/+|\/+$/g, "");
}

function setMeta(name, value, property = false) {
  const attribute = property ? "property" : "name";
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.append(element);
  }
  element.setAttribute("content", value);
}

function updateMeta(page) {
  document.title = page.title;
  setMeta("description", page.description || "");
  setMeta("og:title", page.title, true);
  setMeta("og:description", page.description || "", true);
}

function updateChrome(data) {
  const guild = data.site.guild || {};
  const footer = data.site.footer || {};
  const name = guild.name || "神州";
  const server = guild.server || "OrangeMC";

  document.querySelectorAll("[data-site-name]").forEach((element) => {
    element.textContent = name;
  });
  document.querySelectorAll("[data-site-name-en]").forEach((element) => {
    element.textContent = guild.nameEn || "SHENZHOU";
  });
  document.querySelectorAll("[data-server]").forEach((element) => {
    element.textContent = server;
  });
  document.querySelectorAll("[data-footer-slogan]").forEach((element) => {
    element.textContent = footer.slogan || guild.tagline || "";
  });
  document.querySelectorAll("[data-footer-note]").forEach((element) => {
    element.textContent = footer.note || "";
  });

  const ctaLabel = document.querySelector("[data-header-cta-label]");
  if (ctaLabel) {
    ctaLabel.textContent = guild.recruiting ? "申请加入" : "了解招新";
  }
  document.querySelector(".header-cta")?.classList.toggle(
    "header-cta--paused",
    !guild.recruiting
  );

  const footerContact = document.querySelector("#footer-contact");
  if (footerContact) {
    const items = [];
    if (guild.qqGroup) {
      items.push(`
        <span class="footer-contact__item">
          <span>QQ 群</span><strong>${escapeHTML(guild.qqGroup)}</strong>
          <button type="button" class="mini-icon-btn mini-icon-btn--ghost" data-copy="${escapeHTML(guild.qqGroup)}" data-copy-label="QQ 群号已复制" aria-label="复制 QQ 群号">${icon("copy", 13)}</button>
        </span>`);
    }
    if (guild.serverAddress) {
      items.push(`
        <span class="footer-contact__item">
          <span>地址</span><strong>${escapeHTML(guild.serverAddress)}</strong>
          <button type="button" class="mini-icon-btn mini-icon-btn--ghost" data-copy="${escapeHTML(guild.serverAddress)}" data-copy-label="服务器地址已复制" aria-label="复制服务器地址">${icon("copy", 13)}</button>
        </span>`);
    }
    if (isSafeExternalLink(guild.github)) {
      items.push(`
        <a class="footer-contact__item footer-contact__item--link" href="${escapeHTML(safeUrl(guild.github, "#"))}" target="_blank" rel="noopener noreferrer">
          <span>GitHub</span><strong>查看仓库</strong>${icon("arrow-up-right", 13)}
        </a>`);
    }
    footerContact.innerHTML = items.length
      ? items.join("")
      : `<p class="footer-contact__empty">在 ${escapeHTML(server)} 中联系任意神州成员，或前往「加入我们」查看方式。</p>`;
  }

  const year = document.querySelector("#footer-year");
  if (year) year.textContent = String(new Date().getFullYear());

  const updated = document.querySelector("#footer-updated");
  if (updated) {
    const date = String(data.site.updatedAt || "").slice(0, 10);
    updated.textContent = date ? `内容更新于 ${formatDate(date)}` : "";
  }

  const serverPill = document.querySelector("[data-server-pill]");
  if (serverPill) serverPill.textContent = `${server} · ${guild.edition || "Java Edition"}`;
}

function updateNav(routeName) {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const isActive = link.dataset.nav === routeName;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function observeReveals(root) {
  if (!revealObserver) return;
  root.querySelectorAll(".reveal:not(.is-visible)").forEach((element) => {
    if (element.dataset.revealObserved) return;
    element.dataset.revealObserved = "1";
    revealObserver.observe(element);
  });
}

function setupReveals() {
  const reduced = prefersReducedMotion();
  if (!("IntersectionObserver" in window) || reduced) {
    app.querySelectorAll(".reveal").forEach((element) => {
      element.classList.add("is-visible");
    });
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.08 }
    );
    const mutation = new MutationObserver(() => observeReveals(app));
    mutation.observe(app, { childList: true, subtree: true });
  }
  observeReveals(app);
}

function setupHeader() {
  const header = document.querySelector("#site-header");
  const onScroll = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = document.querySelector("#menu-toggle");
  const menu = document.querySelector("#mobile-menu");
  if (!toggle || !menu) return;

  let isOpen = false;
  const focusables = () =>
    [
      ...menu.querySelectorAll(
        ".mobile-menu__panel a[href], .mobile-menu__panel button:not([disabled])"
      )
    ].filter((element) => element.offsetParent !== null);

  const closeMenu = (restoreFocus = false) => {
    if (!isOpen) return;
    isOpen = false;
    menu.hidden = true;
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "打开菜单");
    if (restoreFocus) toggle.focus();
  };

  const openMenu = () => {
    isOpen = true;
    menu.hidden = false;
    document.body.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "关闭菜单");
    window.requestAnimationFrame(() => focusables()[0]?.focus());
  };

  toggle.addEventListener("click", () => {
    if (isOpen) closeMenu(true);
    else openMenu();
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a[href]") || event.target.closest("[data-menu-close]")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!isOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) closeMenu();
  });

  menuController = { close: closeMenu };
}

function setupGlobalInteractions() {
  document.addEventListener("click", async (event) => {
    const target = event.target.closest?.(
      "[data-copy], [data-open-project], [data-open-member], [data-open-build], [data-scroll]"
    );
    if (!target) return;

    if (target.matches("[data-copy]")) {
      event.preventDefault();
      const ok = await copyText(target.dataset.copy || "");
      if (ok) {
        toast(target.dataset.copyLabel || "已复制");
        target.classList.add("is-copied");
        window.setTimeout(() => target.classList.remove("is-copied"), 1100);
      } else {
        toast("复制失败，请手动选择文本", "error");
      }
      return;
    }

    if (target.matches("[data-open-project]")) {
      event.preventDefault();
      openProjectDialog(bundle, target.dataset.openProject);
      return;
    }
    if (target.matches("[data-open-member]")) {
      event.preventDefault();
      openMemberDialog(bundle, target.dataset.openMember);
      return;
    }
    if (target.matches("[data-open-build]")) {
      event.preventDefault();
      openBuildDialog(bundle, target.dataset.openBuild);
      return;
    }
    if (target.matches("[data-scroll]")) {
      const selector = target.dataset.scroll;
      const destination = document.querySelector(selector);
      if (destination) {
        event.preventDefault();
        destination.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start"
        });
      }
    }
  });
}

function notFoundPage() {
  return {
    title: "坐标不存在｜神州",
    description: "你走到了一片尚未生成的地形。",
    html: `
      <section class="not-found">
        <div class="container">
          <p class="eyebrow"><span class="eyebrow__index">404</span>LOST IN THE WILD</p>
          <h1>这条坐标<br><span>不存在。</span></h1>
          <p>可能是一段被移除的传送门，也可能是地址写错了。别担心，主城还亮着灯。</p>
          <div class="not-found__actions">
            <a class="btn btn--primary" href="#/">回到主城 ${icon("arrow-right", 18)}</a>
            <a class="btn btn--ghost" href="#/builds">看看建筑坐标</a>
          </div>
          <span class="not-found__watermark" aria-hidden="true">迷路</span>
        </div>
      </section>`
  };
}

function renderRoute(routeName, { initial = false } = {}) {
  const definition = ROUTES[routeName];
  const page = definition ? definition.render(bundle) : notFoundPage();

  if (typeof currentCleanup === "function") {
    try {
      currentCleanup();
    } catch (error) {
      console.warn("页面清理失败：", error);
    }
  }
  currentCleanup = null;
  document.querySelector("dialog.detail-dialog")?.close();
  menuController?.close();
  revealObserver?.disconnect();

  app.innerHTML = page.html;
  if (typeof page.mount === "function") {
    currentCleanup = page.mount(app) || null;
  }

  currentRoute = routeName;
  updateNav(definition?.nav || routeName);
  updateMeta(page);
  setupReveals();

  app.classList.remove("page-enter");
  void app.offsetWidth;
  app.classList.add("page-enter");

  const announcer = document.querySelector("#route-announcer");
  if (announcer) announcer.textContent = page.title;

  if (!initial) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    app.focus({ preventScroll: true });
  }

  return page;
}

function routeFromHash() {
  const path = hashToPath();
  if (path === null) return null;
  if (!path) return "home";
  return Object.prototype.hasOwnProperty.call(ROUTES, path) ? path : "404";
}

function setupRouting() {
  window.addEventListener("hashchange", () => {
    const hashPath = hashToPath();

    if (hashPath === null) {
      const anchordId = decodeURIComponent(window.location.hash.slice(1));
      if (currentRoute === "home") {
        document
          .getElementById(anchordId)
          ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
        return;
      }
      renderRoute("home");
      window.requestAnimationFrame(() => {
        document
          .getElementById(anchordId)
          ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
      });
      return;
    }

    const nextRoute = routeFromHash();
    if (nextRoute === currentRoute) return;
    renderRoute(nextRoute);
  });
}

function setupPreviewBanner(data) {
  if (!data.preview || !isPreviewMode()) return;
  const url = new URL(window.location.href);
  url.searchParams.delete(CONFIG.preview.queryKey);
  const banner = document.createElement("div");
  banner.className = "preview-banner";
  banner.innerHTML = `
    <span class="preview-banner__dot"></span>
    <span><strong>预览模式</strong> · 这些内容还没有发布，只有你能在当前浏览器看到。</span>
    <a href="${escapeHTML(url.href)}">退出预览</a>`;
  document.body.append(banner);
  document.body.classList.add("has-preview");
}

function showFatalError(error) {
  const isFile = window.location.protocol === "file:";
  document.body.classList.add("has-error");
  app.innerHTML = `
    <section class="load-error">
      <div class="container">
        <p class="eyebrow"><span class="eyebrow__index">!</span>DATA NOT FOUND</p>
        <h1>存档没有读出来。</h1>
        <p class="load-error__message">${escapeHTML(error?.message || "未知错误")}</p>
        <p>${
          isFile
            ? "你正在直接用文件方式打开页面。浏览器会阻止本地 JSON 读取，请通过本地 HTTP 服务器或 GitHub Pages 访问。"
            : "请检查 data 目录中的 JSON 文件是否存在，或稍后刷新再试。"
        }</p>
        <button type="button" class="btn btn--primary" onclick="location.reload()">重新加载 ${icon("refresh", 17)}</button>
      </div>
    </section>`;
}

async function boot() {
  try {
    bundle = await loadData();
    document.documentElement.classList.add("site-ready");
    updateChrome(bundle);
    setupHeader();
    setupGlobalInteractions();
    setupRouting();
    setupPreviewBanner(bundle);

    const route = routeFromHash();
    renderRoute(route, { initial: true });

    const initialHash = window.location.hash;
    if (initialHash && !initialHash.startsWith("#/")) {
      window.requestAnimationFrame(() => {
        document
          .getElementById(decodeURIComponent(initialHash.slice(1)))
          ?.scrollIntoView({ behavior: "auto" });
      });
    }
  } catch (error) {
    console.error(error);
    showFatalError(error);
  }
}

boot();
