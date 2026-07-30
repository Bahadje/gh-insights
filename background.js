// background.js — service worker
// يتولى كل نداءات GitHub API نيابةً عن سكربت المحتوى، مع كاش بسيط في الذاكرة
// لتقليل عدد الطلبات (GitHub API بدون مصادقة محدود بـ 60 طلب/ساعة).

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 دقائق
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.time > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  cache.set(key, { value, time: Date.now() });
}

async function fetchJson(url, token) {
  const headers = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  const remaining = res.headers.get("x-ratelimit-remaining");
  if (res.status === 404) {
    return { __notFound: true };
  }
  if (res.status === 403 && remaining === "0") {
    return { __rateLimited: true };
  }
  if (!res.ok) {
    return { __error: `HTTP ${res.status}` };
  }
  const contributorsLink = res.headers.get("link") || "";
  const data = await res.json();
  return { data, contributorsLink };
}

function parseLastPageFromLink(link) {
  // مثال: <...&page=2>; rel="next", <...&page=8>; rel="last"
  const match = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
  return match ? parseInt(match[1], 10) : null;
}

async function getRepoInsights(owner, repo) {
  const key = `${owner}/${repo}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const { gh_token } = await chrome.storage.sync.get({ gh_token: "" });

  const [repoRes, contribRes, langRes, releaseRes] = await Promise.all([
    fetchJson(`https://api.github.com/repos/${owner}/${repo}`, gh_token),
    fetchJson(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=5&anon=false`, gh_token
    ),
    fetchJson(`https://api.github.com/repos/${owner}/${repo}/languages`, gh_token),
    fetchJson(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, gh_token),
  ]);

  if (repoRes.__notFound) {
    const result = { notFound: true };
    cacheSet(key, result);
    return result;
  }
  if (repoRes.__rateLimited) {
    return { rateLimited: true };
  }
  if (repoRes.__error) {
    return { error: repoRes.__error };
  }

  const repoData = repoRes.data;
  let contributors = [];
  let contributorsTotal = null;

  if (contribRes.data && Array.isArray(contribRes.data)) {
    contributors = contribRes.data.map((c) => ({
      login: c.login,
      avatar_url: c.avatar_url,
      html_url: c.html_url,
      contributions: c.contributions,
    }));
    const lastPage = parseLastPageFromLink(contribRes.contributorsLink);
    contributorsTotal = lastPage
      ? (lastPage - 1) * 5 + contributors.length
      : contributors.length;
  }

  const result = {
    fullName: repoData.full_name,
    description: repoData.description,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    watchers: repoData.subscribers_count,
    openIssues: repoData.open_issues_count,
    language: repoData.language,
    license: repoData.license ? repoData.license.spdx_id || repoData.license.name : null,
    pushedAt: repoData.pushed_at,
    createdAt: repoData.created_at,
    archived: repoData.archived,
    topics: repoData.topics || [],
    hasDescription: Boolean(repoData.description),
    contributors,
    contributorsTotal,
    languages: langRes.data && !langRes.__error && !langRes.__notFound && !langRes.__rateLimited ? langRes.data : {},
    latestRelease: releaseRes.data && !releaseRes.__error && !releaseRes.__notFound && !releaseRes.__rateLimited ? releaseRes.data.tag_name : null,
  };

  cacheSet(key, result);
  return result;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "FETCH_REPO_INSIGHTS") {
    getRepoInsights(message.owner, message.repo)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // async response
  }
});
