import { heroArt } from "../hero-art.js";
import { icon } from "../icons.js";
import { emptyState, projectCard } from "../ui.js";
import {
  daysSince,
  escapeHTML,
  formatDate,
  safeUrl
} from "../utils.js";

function heroImageUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^data:image\/(png|jpe?g|webp|gif);/i.test(raw)) return raw;
  return safeUrl(raw, "");
}

function countUp(root) {
  const elements = root.querySelectorAll("[data-count]");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  elements.forEach((element) => {
    const target = Number(element.dataset.count || 0);
    if (reduced) {
      element.textContent = String(target);
      return;
    }
    const start = performance.now();
    const duration = 900 + Math.random() * 350;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function newsRow(item) {
  const href = safeUrl(item.link, "");
  const content = `
    <div class="journal-row__date">
      <time datetime="${escapeHTML(item.date)}">${formatDate(item.date)}</time>
      <span class="journal-row__tag">${escapeHTML(item.tag)}</span>
    </div>
    <div class="journal-row__content">
      <h3>${escapeHTML(item.title)}${item.pinned ? '<span class="pin-mark">置顶</span>' : ""}</h3>
      <p>${escapeHTML(item.summary)}</p>
    </div>
    <span class="journal-row__arrow">${icon("arrow-up-right", 18)}</span>`;
  if (!href) {
    return `<article class="journal-row journal-row--static">${content}</article>`;
  }
  return `<a class="journal-row" href="${escapeHTML(href)}">${content}</a>`;
}

export function homePage(data) {
  const { site, members, projects, builds, news } = data;
  const guild = site.guild || {};
  const hero = site.hero || {};
  const about = site.about || {};
  const announcement = site.announcement || {};

  const publicBuilds = builds.filter((build) => build.public !== false);
  const activeProjects = projects.filter((project) =>
    ["进行中", "收尾中"].includes(project.status)
  );
  const sortedNews = [...news].sort((a, b) => {
    if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? 1 : -1;
    return String(b.date).localeCompare(String(a.date));
  });
  const latestNews = sortedNews.slice(0, 3);
  let featured = projects.filter((project) => project.featured);
  if (featured.length < 3) {
    featured = [
      ...featured,
      ...projects.filter((project) => !project.featured)
    ].slice(0, 3);
  } else {
    featured = featured.slice(0, 3);
  }

  const foundingDays = daysSince(guild.founded);
  const announcementLink = safeUrl(announcement.link, "#/projects");

  const artSrc = heroImageUrl(hero.artImage);
  const artLabel = hero.artLabel || (guild.mainCity ? `${guild.mainCity} · 主城` : "神州 · 主城");
  const artTag = hero.artTag || "概念图";
  const artHtml = artSrc
    ? `<div class="hero__art hero__art--image">
        <img class="hero__img" src="${escapeHTML(artSrc)}" alt="${escapeHTML(hero.artImageAlt || artLabel)}" loading="eager" decoding="async" />
      </div>`
    : `<div class="hero__art">${heroArt()}</div>`;

  const html = `
    <section class="hero">
      <div class="hero__backdrop" aria-hidden="true">
        <span class="hero__halo"></span>
        <span class="hero__scanlines"></span>
      </div>
      <div class="container hero__inner">
        <div class="hero__copy">
          <p class="eyebrow hero__eyebrow reveal">
            <span class="live-dot"></span>${escapeHTML(hero.kicker || `${guild.server || "OrangeMC"} · 华人建筑公会`)}
          </p>
          <h1 class="hero__title reveal" style="--delay:.06s">
            <span>${escapeHTML(hero.titleTop || "此间山河，")}</span>
            <span class="hero__title-accent">${escapeHTML(hero.titleBottom || "共筑神州。")}</span>
          </h1>
          <p class="hero__lead reveal" style="--delay:.12s">${escapeHTML(hero.lead || "")}</p>
          <div class="hero__actions reveal" style="--delay:.18s">
            <a class="btn btn--primary" href="${escapeHTML(safeUrl(hero.primaryLink, "#/join"))}">
              ${escapeHTML(hero.primaryLabel || "申请加入")} ${icon("arrow-right", 18)}
            </a>
            <a class="btn btn--ghost" href="${escapeHTML(safeUrl(hero.secondaryLink, "#/projects"))}">
              ${escapeHTML(hero.secondaryLabel || "浏览工程")}
            </a>
          </div>
          <p class="hero__note reveal" style="--delay:.24s">
            ${guild.recruiting ? `<span class="recruit-dot"></span><span>${escapeHTML(guild.recruitNote || "正在招新")}</span><span class="hero__note-divider"></span>` : ""}
            <span>${escapeHTML(hero.note || "")}</span>
          </p>
        </div>
        <div class="hero__art-wrap reveal" style="--delay:.1s">
          <div class="hero__art-aura" aria-hidden="true"></div>
          ${artHtml}
          <div class="hero__art-label">
            <span>${icon("pin", 13)} ${escapeHTML(artLabel)}</span>
            <span>${escapeHTML(artTag)}</span>
          </div>
        </div>
      </div>

      <div class="container hero__foot">
        <div class="hero__stats">
          <div class="hero-stat">
            <strong><span data-count="${members.length}">${members.length}</span><small>位</small></strong>
            <span>同行者</span>
          </div>
          <div class="hero-stat">
            <strong><span data-count="${activeProjects.length}">${activeProjects.length}</span><small>项</small></strong>
            <span>工程推进中</span>
          </div>
          <div class="hero-stat">
            <strong><span data-count="${publicBuilds.length}">${publicBuilds.length}</span><small>处</small></strong>
            <span>坐标已公开</span>
          </div>
          <div class="hero-stat">
            <strong><span data-count="${foundingDays}">${foundingDays}</span><small>天</small></strong>
            <span>并肩而行</span>
          </div>
        </div>
        <button class="hero__scroll" type="button" data-scroll="#about" aria-label="向下查看关于神州">
          <span>向下</span>${icon("chevron-down", 16)}
        </button>
      </div>
    </section>

    ${
      announcement.enabled && announcement.text
        ? `
      <section class="notice-bar" aria-label="公会公告">
        <div class="container notice-bar__inner">
          <span class="notice-bar__label"><span class="live-dot"></span>${escapeHTML(announcement.label || "公会动态")}</span>
          <p>${escapeHTML(announcement.text)}</p>
          ${
            announcement.linkLabel
              ? `<a href="${escapeHTML(announcementLink)}">${escapeHTML(announcement.linkLabel)} ${icon("arrow-right", 15)}</a>`
              : ""
          }
        </div>
      </section>`
        : ""
    }

    <section class="section section--about" id="about">
      <div class="container">
        <div class="section-head reveal">
          <p class="eyebrow"><span class="eyebrow__index">01</span>ABOUT SHENZHOU</p>
          <h2>${escapeHTML(about.title || "我们把「一起玩」，当成一件正经事。")}</h2>
        </div>
        <div class="about-layout">
          <div class="about-copy reveal">
            ${(about.paragraphs || []).map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("")}
            <blockquote>
              <span class="quote-mark" aria-hidden="true">“</span>
              <p>${escapeHTML(about.quote || "")}</p>
            </blockquote>
          </div>
          <aside class="about-plaque reveal" style="--delay:.08s" aria-label="公会信息">
            <div class="about-plaque__top">
              <span class="about-plaque__seal">神</span>
              <span class="about-plaque__vertical">山河共筑</span>
            </div>
            <dl class="about-plaque__facts">
              <div><dt>成立</dt><dd>${formatDate(guild.founded, "待补充")}</dd></div>
              <div><dt>所在</dt><dd>${escapeHTML(guild.server || "OrangeMC")}</dd></div>
              <div><dt>版本</dt><dd>${escapeHTML(guild.edition || "Java Edition")}</dd></div>
              <div><dt>气质</dt><dd>建筑 · 生存 · 长期主义</dd></div>
            </dl>
            <span class="about-plaque__code">EST. ${formatDate(guild.founded, "----").slice(0, 4)} / SHENZHOU</span>
          </aside>
        </div>
        <div class="values-grid">
          ${(about.values || [])
            .map(
              (value, index) => `
            <article class="value-card reveal" style="--delay:${index * 0.06}s">
              <span class="value-card__number">${escapeHTML(value.number || String(index + 1).padStart(2, "0"))}</span>
              <h3>${escapeHTML(value.title)}</h3>
              <p>${escapeHTML(value.desc)}</p>
              <span class="value-card__line" aria-hidden="true"></span>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="section section--explore">
      <div class="container">
        <div class="section-bar reveal">
          <div>
            <p class="eyebrow"><span class="eyebrow__index">02</span>EXPLORE</p>
            <h2>在这里，找到你想看的。</h2>
          </div>
          <p class="section-bar__note">名册、图纸与坐标，都在同一个地方。<br>不用再翻聊天记录。</p>
        </div>
        <div class="explore-grid">
          <a class="explore-card reveal" href="#/members">
            <div class="explore-card__head">
              <span class="explore-card__num">01</span>
              <span class="explore-card__icon">${icon("users", 22)}</span>
            </div>
            <div class="explore-card__body">
              <h3>成员名录</h3>
              <p>谁在这里，谁在忙什么，谁最近暂时离开了山谷。</p>
            </div>
            <div class="explore-card__foot">
              <span>${members.length} 位伙伴</span>
              <span class="circle-arrow">${icon("arrow-up-right", 17)}</span>
            </div>
            <span class="explore-card__watermark" aria-hidden="true">人</span>
          </a>
          <a class="explore-card reveal" href="#/projects" style="--delay:.06s">
            <div class="explore-card__head">
              <span class="explore-card__num">02</span>
              <span class="explore-card__icon">${icon("hammer", 22)}</span>
            </div>
            <div class="explore-card__body">
              <h3>工程进度</h3>
              <p>从一张草图，到可以走进去的城。每个节点都算数。</p>
            </div>
            <div class="explore-card__foot">
              <span>${activeProjects.length} 项正在推进</span>
              <span class="circle-arrow">${icon("arrow-up-right", 17)}</span>
            </div>
            <span class="explore-card__watermark" aria-hidden="true">筑</span>
          </a>
          <a class="explore-card reveal" href="#/builds" style="--delay:.12s">
            <div class="explore-card__head">
              <span class="explore-card__num">03</span>
              <span class="explore-card__icon">${icon("map", 22)}</span>
            </div>
            <div class="explore-card__body">
              <h3>建筑坐标</h3>
              <p>把值得一看的地方标在山河之间，复制坐标就能出发。</p>
            </div>
            <div class="explore-card__foot">
              <span>${publicBuilds.length} 处公开地点</span>
              <span class="circle-arrow">${icon("arrow-up-right", 17)}</span>
            </div>
            <span class="explore-card__watermark" aria-hidden="true">境</span>
          </a>
        </div>
      </div>
    </section>

    <section class="section section--projects-preview">
      <div class="container">
        <div class="section-bar reveal">
          <div>
            <p class="eyebrow"><span class="eyebrow__index">03</span>IN PROGRESS</p>
            <h2>此刻，我们正在建。</h2>
          </div>
          <a class="text-link section-bar__link" href="#/projects">全部工程 ${icon("arrow-right", 16)}</a>
        </div>
        <div class="project-grid project-grid--featured">
          ${
            featured.length
              ? featured.map((project) => projectCard(project)).join("")
              : emptyState("工程正在画图", "第一项公共工程很快就会出现在这里。", "hammer")
          }
        </div>
      </div>
    </section>

    <section class="section section--journal">
      <div class="container journal-layout">
        <aside class="journal-aside reveal">
          <p class="eyebrow"><span class="eyebrow__index">04</span>GUILD JOURNAL</p>
          <h2>公会日志</h2>
          <p>封顶、点亮、第一次通车。记录那些让一个存档变成「家」的小事。</p>
          <span class="journal-aside__stamp" aria-hidden="true">记</span>
        </aside>
        <div class="journal-list">
          ${latestNews.map((item) => newsRow(item)).join("")}
          ${
            latestNews.length === 0
              ? '<p class="journal-empty">还没有日志，等第一条好消息。</p>'
              : ""
          }
        </div>
      </div>
    </section>

    <section class="section section--join-cta">
      <div class="container">
        <div class="join-cta reveal">
          <div class="join-cta__decor" aria-hidden="true">
            <span class="iso-block iso-block--1"></span>
            <span class="iso-block iso-block--2"></span>
            <span class="iso-block iso-block--3"></span>
            <span class="join-cta__grid"></span>
          </div>
          <div class="join-cta__main">
            <p class="eyebrow eyebrow--dark">RECRUITING · ${guild.recruiting ? "OPEN" : "PAUSED"}</p>
            <h2>下一块砖，<br>等你来放。</h2>
            <p>带上一点耐心、一点分享欲，剩下的我们慢慢一起学。</p>
          </div>
          <div class="join-cta__side">
            <p class="join-cta__status">
              <span class="live-dot live-dot--dark"></span>
              ${escapeHTML(guild.recruiting ? guild.recruitNote || "长期招新中" : "暂未开放招新")}
            </p>
            <a class="btn btn--dark" href="#/join">
              ${guild.recruiting ? "看看怎么加入" : "了解加入方式"} ${icon("arrow-right", 18)}
            </a>
            <span class="join-cta__hint">不需要作品集 · 不需要每天在线</span>
          </div>
        </div>
      </div>
    </section>
  `;

  return {
    title: `${guild.name || "神州"} ${guild.nameEn || "SHENZHOU"}｜${guild.server || "OrangeMC"} 公会`,
    description: hero.lead || guild.tagline || "神州公会官方网站",
    html,
    mount(root) {
      countUp(root);
    }
  };
}
