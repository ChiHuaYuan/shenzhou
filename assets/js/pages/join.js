import { icon } from "../icons.js";
import { pageHeader } from "../ui.js";
import {
  escapeHTML,
  isSafeExternalLink,
  safeUrl
} from "../utils.js";

export function joinPage(data) {
  const { site } = data;
  const guild = site.guild || {};
  const join = site.join || {};
  const requirements = join.requirements || [];
  const steps = join.steps || [];
  const faq = join.faq || [];
  const template = String(join.template || "").trim();
  const github = isSafeExternalLink(guild.github) ? safeUrl(guild.github, "") : "";
  const rawJoinTitle = String(join.title || "加入我们").trim();
  const meetSpot = guild.mainCity ? `${guild.mainCity} · 南门` : "主城 · 南门";
  const joinTitle = /[。！？!?]$/.test(rawJoinTitle)
    ? escapeHTML(rawJoinTitle)
    : `${escapeHTML(rawJoinTitle)}<span class="title-dot">.</span>`;

  const contactItems = [];
  if (guild.qqGroup) {
    contactItems.push(`
      <div class="contact-chip">
        <span class="contact-chip__icon">${icon("users", 18)}</span>
        <span><small>QQ 群</small><strong>${escapeHTML(guild.qqGroup)}</strong></span>
        <button type="button" class="mini-icon-btn" data-copy="${escapeHTML(guild.qqGroup)}" data-copy-label="QQ 群号已复制" aria-label="复制 QQ 群号">${icon("copy", 15)}</button>
      </div>`);
  }
  if (guild.serverAddress) {
    contactItems.push(`
      <div class="contact-chip">
        <span class="contact-chip__icon">${icon("globe", 18)}</span>
        <span><small>服务器地址</small><strong>${escapeHTML(guild.serverAddress)}</strong></span>
        <button type="button" class="mini-icon-btn" data-copy="${escapeHTML(guild.serverAddress)}" data-copy-label="服务器地址已复制" aria-label="复制服务器地址">${icon("copy", 15)}</button>
      </div>`);
  }
  if (github) {
    contactItems.push(`
      <a class="contact-chip contact-chip--link" href="${escapeHTML(github)}" target="_blank" rel="noopener noreferrer">
        <span class="contact-chip__icon">${icon("github", 18)}</span>
        <span><small>GitHub</small><strong>查看我们的仓库</strong></span>
        ${icon("arrow-up-right", 16)}
      </a>`);
  }

  const html = `
    ${pageHeader({
      index: "04",
      english: "JOIN SHENZHOU",
      title: joinTitle,
      description: escapeHTML(
        join.lead ||
          "我们长期欢迎愿意一起把世界建得更好的人。你不需要是建筑大佬，也不需要每天在线。"
      ),
      children: `
        <div class="page-header__metrics">
          <span class="status ${guild.recruiting ? "status--active" : "status--paused"}"><span class="status-dot"></span>${guild.recruiting ? "开放招新" : "暂未开放"}</span>
          <span>长期同行 · 不设打卡</span>
        </div>`
    })}

    <section class="section section--join">
      <div class="container">
        <div class="join-grid">
          <div class="join-manifesto reveal">
            <p class="eyebrow"><span class="eyebrow__index">A</span>WHAT WE LOOK FOR</p>
            <h2>不需要完美，<br>只需要愿意一起完成。</h2>
            <p class="join-manifesto__lead">${escapeHTML(join.lead || "")}</p>
            <ul class="check-list">
              ${requirements
                .map(
                  (requirement) => `
                <li>
                  <span class="check-list__mark">${icon("check", 14)}</span>
                  <span>${escapeHTML(requirement)}</span>
                </li>`
                )
                .join("")}
            </ul>
            <div class="join-manifesto__note">
              <span class="seal-mini" aria-hidden="true">合</span>
              <p>合拍比履历重要。我们更想看见你愿意怎样与别人一起完成一件事。</p>
            </div>
          </div>

          <aside class="contact-card reveal" style="--delay:.08s">
            <div class="contact-card__top">
              <span class="status ${guild.recruiting ? "status--active" : "status--paused"}"><span class="status-dot"></span>${guild.recruiting ? escapeHTML(guild.recruitNote || "招新中") : "暂未开放"}</span>
              <span class="contact-card__server">${escapeHTML(guild.server || "OrangeMC")}</span>
            </div>
            <h3>找到我们</h3>
            <p class="contact-card__note">${escapeHTML(guild.contactNote || "在游戏内联系任意成员。")}</p>
            <div class="contact-list">
              ${contactItems.join("")}
              <div class="contact-chip contact-chip--static">
                <span class="contact-chip__icon">${icon("compass", 18)}</span>
                <span><small>碰头地点</small><strong>${escapeHTML(meetSpot)}</strong></span>
                <a href="#/builds" class="mini-icon-btn" aria-label="查看${escapeHTML(meetSpot)}坐标" title="查看坐标">${icon("pin", 15)}</a>
              </div>
            </div>
            ${
              template
                ? `<button type="button" class="btn btn--primary contact-card__copy" data-copy="${escapeHTML(template)}" data-copy-label="申请模板已复制">
                    ${icon("clipboard", 18)} 复制申请模板
                  </button>`
                : ""
            }
            <p class="contact-card__hint">先聊一聊，不用有压力。我们通常会在 1–3 天内回复。</p>
          </aside>
        </div>

        <div class="join-process">
          <div class="section-bar reveal">
            <div>
              <p class="eyebrow"><span class="eyebrow__index">B</span>HOW IT WORKS</p>
              <h2>从打个招呼开始。</h2>
            </div>
            <p class="section-bar__note">没有考试，也没有面试题。<br>只有一次双向的、慢慢靠近。</p>
          </div>
          <ol class="step-grid">
            ${steps
              .map(
                (step, index) => `
              <li class="step-card reveal" style="--delay:${index * 0.05}s">
                <span class="step-card__number">${String(index + 1).padStart(2, "0")}</span>
                <h3>${escapeHTML(step.title)}</h3>
                <p>${escapeHTML(step.desc)}</p>
                <span class="step-card__line" aria-hidden="true"></span>
              </li>`
              )
              .join("")}
          </ol>
        </div>

        <div class="join-bottom">
          ${
            template
              ? `
            <div class="apply-template reveal">
              <div class="apply-template__head">
                <div>
                  <p class="eyebrow eyebrow--dark">APPLICATION NOTE</p>
                  <h2>申请模板</h2>
                </div>
                <button type="button" class="icon-btn icon-btn--dark" data-copy="${escapeHTML(template)}" data-copy-label="申请模板已复制" aria-label="复制申请模板">${icon("copy", 17)}</button>
              </div>
              <pre>${escapeHTML(template)}</pre>
              <p class="apply-template__note">复制后填好，发给在游戏里遇到的神州成员即可。不必写得很正式。</p>
            </div>`
              : ""
          }

          <div class="faq reveal">
            <p class="eyebrow"><span class="eyebrow__index">C</span>FAQ</p>
            <h2>你可能还想问</h2>
            <div class="faq-list">
              ${faq
                .map(
                  (item) => `
                <details class="faq-item">
                  <summary>${escapeHTML(item.q)}<span class="faq-item__plus">${icon("plus", 16)}</span></summary>
                  <div class="faq-item__answer"><p>${escapeHTML(item.a)}</p></div>
                </details>`
                )
                .join("")}
            </div>
          </div>
        </div>

        <div class="join-outro reveal">
          <p>如果节奏合适，我们就在南门见。</p>
          <a class="text-link" href="#/builds">先去看看神州的坐标 ${icon("arrow-right", 16)}</a>
        </div>
      </div>
    </section>
  `;

  return {
    title: `加入神州｜${data.site.guild?.server || "OrangeMC"} 公会`,
    description:
      data.site.join?.lead || "神州公会长期招新，欢迎建筑师、红石玩家与长期生存玩家。",
    html,
    mount() {}
  };
}
