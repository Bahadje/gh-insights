// content.js — GitHub Repo Insights Pro
// يبني بطاقة تحليلات عائمة عند تصفح أي صفحة مستودع على GitHub.

(() => {
  const RESERVED_SEGMENTS = new Set([
    "settings", "notifications", "marketplace", "sponsors", "orgs",
    "new", "explore", "topics", "trending", "collections", "events",
    "codespaces", "account", "login", "join", "about", "pricing",
    "features", "apps", "search", "dashboard", "organizations",
    "issues", "pulls", "watching", "stars", "gist",
  ]);

  const ICONS = {
    star: '<path d="M8 .5l2.24 4.54 5.01.73-3.63 3.53.86 4.98L8 12.9l-4.48 2.38.86-4.98L.75 5.77l5.01-.73L8 .5z"/>',
    fork: '<path d="M4 1.5a1.5 1.5 0 113 0 1.5 1.5 0 01-.75 1.3v2.2a2 2 0 01-2 2H6v1.2a1.5 1.5 0 11-1 0V7h-.25a2 2 0 01-2-2V2.8A1.5 1.5 0 011 1.5a1.5 1.5 0 113 0 1.5 1.5 0 01-.75 1.3v2.2c0 .28.22.5.5.5h3.5a.5.5 0 00.5-.5V2.8A1.5 1.5 0 014 1.5z"/>',
    issue: '<circle cx="8" cy="8" r="6.5"/><path d="M8 4.5v4M8 11h.01" stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none"/>',
    license: '<path d="M8 1v2M4 3h8l1.5 5a3.5 3.5 0 11-7 0L8 3M8 3L6.5 8a3.5 3.5 0 11-7 0L1 3h3M2 15h12" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    clock: '<circle cx="8" cy="8" r="6.5" fill="none" stroke-width="1.2"/><path d="M8 4.5V8l2.5 1.5" fill="none" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>',
    code: '<path d="M5 4L1.5 8 5 12M11 4l3.5 4L11 12" fill="none" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>',
    tag: '<path d="M2.5 7.775V2.75a.25.25 0 01.25-.25h5.025a.25.25 0 01.177.073l6.25 6.25a.25.25 0 010 .354l-5.025 5.025a.25.25 0 01-.354 0l-6.25-6.25a.25.25 0 01-.073-.177zm-1.5 0V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 010 2.474l-5.026 5.026a1.75 1.75 0 01-2.474 0l-6.25-6.25A1.75 1.75 0 011 7.775zM6 5a1 1 0 100 2 1 1 0 000-2z" fill-rule="evenodd"/>',
    copy: '<path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"></path>',
  };

  function svgIcon(name, extraClass = "") {
    return `<svg class="ghip-icon ${extraClass}" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">${ICONS[name]}</svg>`;
  }

  function parseRepoFromPath() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const [owner, repo] = parts;
    if (RESERVED_SEGMENTS.has(owner.toLowerCase())) return null;
    if (RESERVED_SEGMENTS.has(repo.toLowerCase())) return null;
    // مسارات المستخدم نفسه مثل /owner فقط تم استبعادها أعلاه بشرط length<2
    return { owner, repo: repo.replace(/\.git$/, "") };
  }

  function formatArabicRelative(dateStr) {
    if (!dateStr) return "غير معروف";
    const then = new Date(dateStr).getTime();
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - then) / 1000));
    const units = [
      ["سنة", "سنوات", 31536000],
      ["شهر", "أشهر", 2592000],
      ["أسبوع", "أسابيع", 604800],
      ["يوم", "أيام", 86400],
      ["ساعة", "ساعات", 3600],
      ["دقيقة", "دقائق", 60],
    ];
    for (const [singular, plural, secs] of units) {
      const val = Math.floor(diffSec / secs);
      if (val >= 1) {
        const label = val === 1 ? singular : val === 2 ? `${singular}ين` : plural;
        return `قبل ${val} ${label}`;
      }
    }
    return "الآن";
  }

  function formatCompactNumber(n) {
    if (n === null || n === undefined) return "—";
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  function computeHealth(data) {
    const now = Date.now();
    const pushed = data.pushedAt ? new Date(data.pushedAt).getTime() : 0;
    const daysSince = pushed ? (now - pushed) / 86400000 : 9999;

    let activity;
    if (daysSince < 7) activity = 40;
    else if (daysSince < 30) activity = 32;
    else if (daysSince < 90) activity = 22;
    else if (daysSince < 365) activity = 12;
    else activity = 2;

    let community = 0;
    if (data.license) community += 10;
    if (data.hasDescription) community += 5;
    if (data.topics && data.topics.length > 0) community += 5;

    const popularity = (data.stars || 0) + (data.forks || 0);
    const engagement = Math.min(20, Math.log10(popularity + 1) * 8);

    const ratio = (data.openIssues || 0) / ((data.stars || 0) + 10);
    const maintenance = Math.max(0, Math.min(20, 20 - ratio * 40));

    let total = Math.round(activity + community + engagement + maintenance);
    if (data.archived) total = Math.min(total, 35);
    total = Math.max(0, Math.min(100, total));

    let tier, tierLabel;
    if (total >= 75) { tier = "high"; tierLabel = "ممتاز"; }
    else if (total >= 50) { tier = "mid"; tierLabel = "جيد"; }
    else { tier = "low"; tierLabel = "يحتاج متابعة"; }

    return { score: total, tier, tierLabel };
  }

  function el(tag, className, html) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  class InsightsPanel {
    constructor() {
      this.root = el("div", "ghip-panel ghip-hidden");
      this.root.setAttribute("dir", "rtl");
      document.documentElement.appendChild(this.root);
      this.currentKey = null;
    }

    async setRepo(owner, repo, collapsed) {
      this.currentKey = `${owner}/${repo}`;
      this.root.classList.remove("ghip-hidden");
      this.showLoading(owner, repo);
      this.setCollapsed(collapsed);

      let response;
      try {
        response = await chrome.runtime.sendMessage({
          type: "FETCH_REPO_INSIGHTS",
          owner,
          repo,
        });
      } catch (e) {
        this.showError("تعذّر الاتصال بالإضافة. جرّب تحديث الصفحة.");
        return;
      }

      if (this.currentKey !== `${owner}/${repo}`) return; // تغيّرت الصفحة أثناء الجلب

      if (!response || !response.ok) {
        this.showError("حدث خطأ غير متوقع.");
        return;
      }
      const data = response.data;
      if (data.notFound) {
        this.hide();
        return;
      }
      if (data.rateLimited) {
        this.showError("تم تجاوز حد GitHub API المجاني مؤقتًا. حاول لاحقًا.");
        return;
      }
      if (data.error) {
        this.showError("تعذّر تحميل بيانات المستودع.");
        return;
      }
      this.showData(data);
    }

    hide() {
      this.root.classList.add("ghip-hidden");
    }

    setCollapsed(collapsed) {
      this.root.classList.toggle("ghip-collapsed", !!collapsed);
    }

    showLoading(owner, repo) {
      this.root.innerHTML = this.shell(`
        <div class="ghip-skeleton">
          <div class="ghip-sk-ring"></div>
          <div class="ghip-sk-lines">
            <div class="ghip-sk-line" style="width:70%"></div>
            <div class="ghip-sk-line" style="width:45%"></div>
          </div>
        </div>
      `, `${owner}/${repo}`);
      this.bindChrome();
    }

    showError(msg) {
      this.root.innerHTML = this.shell(
        `<div class="ghip-error">${msg}</div>`,
        this.currentKey || ""
      );
      this.bindChrome();
    }

    showData(data) {
      this.currentData = data;
      const health = computeHealth(data);

      let langHtml = "";
      if (data.languages && Object.keys(data.languages).length > 0) {
        const totalBytes = Object.values(data.languages).reduce((a, b) => a + b, 0);
        let segments = "";
        let labels = "";
        const colors = ["#f1e05a", "#3178c6", "#b07219", "#e34c26", "#563d7c", "#89e051", "#4F5D95"];
        let idx = 0;
        for (const [lang, bytes] of Object.entries(data.languages)) {
          const pct = ((bytes / totalBytes) * 100).toFixed(1);
          if (pct < 1 && Object.keys(data.languages).length > 3) continue;
          const color = colors[idx % colors.length];
          segments += `<div class="ghip-lang-segment" style="width:${pct}%; background:${color};"></div>`;
          labels += `<div class="ghip-lang-label"><div class="ghip-lang-dot" style="background:${color}"></div>${lang} ${pct}%</div>`;
          idx++;
        }
        langHtml = `
          <div class="ghip-lang-wrap">
            <div class="ghip-lang-bar">${segments}</div>
            <div class="ghip-lang-labels">${labels}</div>
          </div>
        `;
      } else {
        langHtml = this.statItem("code", data.language || "—", "اللغة الأساسية");
      }

      const statsHtml = `
        <div class="ghip-stats-grid">
          ${this.statItem("star", formatCompactNumber(data.stars), "نجمة")}
          ${this.statItem("fork", formatCompactNumber(data.forks), "فرع")}
          ${this.statItem("issue", formatCompactNumber(data.openIssues), "مشكلة مفتوحة")}
          ${this.statItem("license", data.license || "بدون رخصة", "الرخصة")}
          ${data.latestRelease ? this.statItem("tag", data.latestRelease, "أحدث إصدار") : this.statItem("clock", formatArabicRelative(data.pushedAt), "آخر تحديث")}
        </div>
      `;

      const avatars = (data.contributors || [])
        .slice(0, 5)
        .map(
          (c) =>
            `<a href="${c.html_url}" target="_blank" rel="noopener" class="ghip-avatar" title="${c.login} · ${c.contributions} مساهمة">
               <img src="${c.avatar_url}&s=64" alt="${c.login}" />
             </a>`
        )
        .join("");

      const extra =
        data.contributorsTotal && data.contributorsTotal > 5
          ? `<span class="ghip-avatar-more">+${data.contributorsTotal - 5}</span>`
          : "";

      const archivedBadge = data.archived
        ? `<span class="ghip-archived-badge">مؤرشف</span>`
        : "";

      const body = `
        <div class="ghip-score-row">
          <div class="ghip-ring ghip-tier-${health.tier}" style="--score:${health.score}">
            <div class="ghip-ring-inner">
              <span class="ghip-score-num">${health.score}</span>
            </div>
          </div>
          <div class="ghip-score-meta">
            <div class="ghip-score-label">نقاط صحة المستودع</div>
            <div class="ghip-score-sub ghip-tier-text-${health.tier}">${health.tierLabel}${archivedBadge}</div>
          </div>
        </div>
        ${langHtml}
        ${statsHtml}
        <div class="ghip-contributors">
          <div class="ghip-avatar-stack">${avatars}${extra}</div>
          <span class="ghip-contrib-label">المساهمون</span>
        </div>
      `;

      const footer = `<a class="ghip-footer-link" href="https://github.com/${data.fullName}/graphs/contributors" target="_blank" rel="noopener">عرض كل المساهمين ←</a>`;

      this.root.innerHTML = this.shell(body, data.fullName, footer);
      this.bindChrome();
    }

    statItem(icon, value, label) {
      return `
        <div class="ghip-stat">
          ${svgIcon(icon)}
          <div class="ghip-stat-text">
            <span class="ghip-stat-value">${value}</span>
            <span class="ghip-stat-label">${label}</span>
          </div>
        </div>
      `;
    }

    shell(bodyHtml, title, footerHtml = "") {
      return `
        <button type="button" class="ghip-tab" aria-label="فتح بطاقة تحليلات GitHub">
          ${svgIcon("star", "ghip-tab-icon")}
        </button>
        <div class="ghip-card">
          <header class="ghip-header">
            <div class="ghip-header-text">
              <span class="ghip-eyebrow">GITHUB INSIGHTS</span>
              <span class="ghip-title">${title}</span>
            </div>
            <div class="ghip-header-actions">
              <button type="button" class="ghip-copy" aria-label="نسخ الملخص" title="نسخ الملخص">
                ${svgIcon("copy")}
              </button>
              <button type="button" class="ghip-close" aria-label="طي البطاقة">−</button>
            </div>
          </header>
          <div class="ghip-body">${bodyHtml}</div>
          ${footerHtml ? `<footer class="ghip-footer">${footerHtml}</footer>` : ""}
        </div>
      `;
    }

    bindChrome() {
      const closeBtn = this.root.querySelector(".ghip-close");
      const tabBtn = this.root.querySelector(".ghip-tab");
      const copyBtn = this.root.querySelector(".ghip-copy");

      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const text = `⭐ ${formatCompactNumber(this.currentData?.stars)} | 🍴 ${formatCompactNumber(this.currentData?.forks)} | ❗ ${this.currentData?.openIssues || 0} Issues | 📜 ${this.currentData?.license || "بدون رخصة"}\n🔗 https://github.com/${this.currentKey}`;
          navigator.clipboard.writeText(text).then(() => {
            copyBtn.classList.add("copied");
            setTimeout(() => copyBtn.classList.remove("copied"), 1500);
          });
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          this.setCollapsed(true);
          chrome.storage.sync.set({ ghip_collapsed: true });
        });
      }
      if (tabBtn) {
        tabBtn.addEventListener("click", () => {
          this.setCollapsed(false);
          chrome.storage.sync.set({ ghip_collapsed: false });
        });
      }
    }
  }

  let panel = null;
  let lastKey = null;

  async function evaluateRoute() {
    const settings = await chrome.storage.sync.get({
      ghip_enabled: true,
      ghip_collapsed: false,
    });
    if (!settings.ghip_enabled) {
      if (panel) panel.hide();
      lastKey = null;
      return;
    }

    const repoInfo = parseRepoFromPath();
    if (!repoInfo) {
      if (panel) panel.hide();
      lastKey = null;
      return;
    }

    const key = `${repoInfo.owner}/${repoInfo.repo}`;
    if (key === lastKey) return;
    lastKey = key;

    if (!panel) panel = new InsightsPanel();
    panel.setRepo(repoInfo.owner, repoInfo.repo, settings.ghip_collapsed);
  }

  // GitHub SPA (Turbo) navigation
  document.addEventListener("turbo:load", evaluateRoute);
  document.addEventListener("turbo:render", evaluateRoute);
  // احتياط: بعض الإصدارات القديمة تستخدم pjax
  document.addEventListener("pjax:end", evaluateRoute);

  // احتياط إضافي: مراقبة تغيّر الرابط لأي سبب آخر
  let lastHref = location.href;
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      evaluateRoute();
    }
  }, 700);

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.ghip_enabled) {
      lastKey = null;
      evaluateRoute();
    }
  });

  evaluateRoute();
})();
