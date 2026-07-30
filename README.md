# GitHub Repo Insights Pro

<div align="center">

<img src="icons/icon128.png" width="100" />

**A floating analytics card that appears automatically while browsing any GitHub repository.**

[![Version](https://img.shields.io/badge/version-1.0.0-00FF00?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Bahadje/gh-insights)
[![Manifest](https://img.shields.io/badge/Manifest-V3-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)](LICENSE)
[![Stars](https://img.shields.io/github/stars/Bahadje/gh-insights?style=for-the-badge&color=yellow)](https://github.com/Bahadje/gh-insights/stargazers)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏥 **Repository Health Score** | Calculates a health score (0–100) with tier label (Excellent / Good / Average / Poor) |
| 🌐 **Language Breakdown** | Colorful progress bar showing all languages used with exact percentages |
| 🏷️ **Latest Release Tag** | Fetches and displays the latest published release version |
| 👥 **Top Contributors** | Displays avatar stack of top contributors with click-to-profile links |
| 🔑 **GitHub PAT Support** | Add your Personal Access Token to bypass the 60 req/hr API limit |
| 📋 **Copy Summary** | One-click copy of repo summary (stars, forks, issues, license + link) |
| 🌙 **Dark Mode Native** | Designed natively for GitHub's dark theme |
| ⚡ **Smart Caching** | Results cached for 5 minutes to minimize API calls |
| 🚀 **SPA Navigation** | Automatically detects GitHub's SPA navigation and updates the card |

---

## 🚀 Installation

### Load Unpacked (Developer Mode)

1. **Clone the repo:**
   ```bash
   git clone https://github.com/Bahadje/gh-insights.git
   ```

2. **Open Chrome Extensions page:**
   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode** (toggle in top-right corner).

4. Click **"Load unpacked"** and select the cloned `gh-insights` folder.

5. Navigate to any GitHub repository — the card appears automatically! 🎉

---

## 🔑 Using a GitHub Token (Recommended)

Without a token, GitHub API allows **60 requests/hour**.
With a token, the limit increases to **5,000 requests/hour**.

1. Generate a **[Personal Access Token](https://github.com/settings/tokens/new)** (no scopes needed for public repos).
2. Click the extension icon in your browser toolbar.
3. Paste your token in the **GitHub Token** field and click **Save**.

---

## 🏗️ Architecture

```
gh-insights/
├── manifest.json       # Chrome Extension Manifest V3 config
├── background.js       # Service Worker — GitHub API proxy with caching
├── content.js          # Content Script — floating UI panel injection
├── content.css         # Panel styles (dark theme, animations)
├── popup.html          # Extension popup — settings UI
├── popup.js            # Popup logic — token save/load
├── popup.css           # Popup styles
└── icons/              # Extension icons (16px, 48px, 128px)
```

**Data flow:**
```
GitHub Page (content.js)
    ↓  chrome.runtime.sendMessage({ type: "FETCH_REPO", ... })
background.js (Service Worker)
    ↓  fetch GitHub API (with optional PAT, 5-min cache)
content.js  ←  response with { stars, forks, languages, release, ... }
    ↓
Renders floating InsightsPanel card
```

---

## 📊 Health Score Formula

```js
score += stars > 1000 ? 25 : (stars / 1000) * 25    // Popularity
score += forks > 200  ? 20 : (forks / 200)  * 20    // Community
score += openIssues < 10 ? 15 : (10/openIssues)*10  // Maintenance
score += hasLicense  ? 15 : 0                         // License
score += recentActivity ? 15 : 0                      // Recency
score += hasDescription ? 10 : 0                      // Documentation
```

| Score | Tier |
|-------|------|
| 80–100 | ✦ Excellent 🟢 |
| 60–79  | ● Good 🔵 |
| 40–59  | ▲ Average 🟡 |
| 0–39   | ✕ Poor 🔴 |

---

## 🤝 Contributing

1. Fork the project
2. Create your branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a **Pull Request**

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Made with ❤️ by **[Bahadje](https://github.com/Bahadje)**

⭐ **Star this repo if you find it useful!**

</div>

إضافة كروم تعرض **بطاقة تحليلات احترافية عائمة** فوق أي صفحة مستودع على GitHub — تلقائيًا وأنت بتتصفح.

## المميزات
- **نقاط صحة المستودع**: مؤشر دائري (0–100) محسوب من نشاط آخر تحديث، وجود رخصة ووصف، شعبية المستودع، ونسبة المشاكل المفتوحة.
- **إحصائيات سريعة**: النجوم، الفروع، المشاكل المفتوحة، الرخصة، لغة البرمجة، وآخر تحديث (بالعربي: "قبل 3 أيام"...).
- **المساهمون**: صور أفاتار لأبرز 5 مساهمين + رابط لعرض الكل.
- بطاقة **قابلة للطي**، وتتبع تنقلك بين المستودعات تلقائيًا (متوافقة مع Turbo الخاص بـ GitHub) بدون إعادة تحميل الصفحة.
- زر تفعيل/تعطيل من الـ popup الخاص بالإضافة.

## التثبيت (وضع المطور)
1. افتح `chrome://extensions` في متصفح كروم.
2. فعّل **وضع المطور (Developer mode)** من الأعلى يمينًا.
3. اضغط **تحميل غير مضغوطة (Load unpacked)**.
4. اختر مجلد `gh-insights` (الموجود بجانب هذا الملف).
5. افتح أي مستودع على GitHub، مثلاً: `https://github.com/facebook/react` — هتظهر البطاقة أسفل يسار الصفحة.

## كيف تشتغل تقنيًا
- سكربت المحتوى (`content.js`) يكتشف مسار `owner/repo` من الرابط، ويطلب البيانات من الـ Service Worker (`background.js`).
- `background.js` يجلب البيانات من واجهة GitHub العامة (`api.github.com`) بدون الحاجة لتسجيل دخول أو مفتاح API، مع كاش داخلي 5 دقائق لتقليل الطلبات.
- بما إن واجهة GitHub غير موثّقة (بدون مصادقة) محدودة بـ 60 طلب/ساعة لكل IP، لو ظهرت رسالة "تم تجاوز الحد" انتظر شوية أو استخدم الإضافة باعتدال.

## الخصوصية
الإضافة لا ترسل أي بيانات لأي خادم تابع لطرف ثالث غير `api.github.com` نفسها، ولا تجمع أي معلومات شخصية.

## هيكل الملفات
```
gh-insights/
├── manifest.json
├── background.js       # جلب البيانات من GitHub API
├── content.js           # منطق اكتشاف الصفحة وبناء البطاقة
├── content.css           # تصميم البطاقة
├── popup.html/.js/.css  # نافذة إعدادات بسيطة
└── icons/                # أيقونات الإضافة
```
