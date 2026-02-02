// Home page script
// - Subtitle clock (minute-synced)
// - Search bar auto-focus + same-tab navigation
// - Weather (Open-Meteo) + custom city via Settings
// - Links grid rendered from localStorage (editable via Settings)
// - Checklist with archive modal
// - Service worker registration

const STORE_KEY = "home.state.v1";      // checklist state
const LINKS_KEY = "home.links.v1";      // links grid
const WEATHER_KEY = "home.weather.v1";  // custom city (lat/lon/tz/name)

// ---------- Small utils ----------
const $ = (sel) => document.querySelector(sel);

function uuid() {
  return (
    crypto?.randomUUID?.() ||
    `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  );
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function focusInputByTaskId(id) {
  const inp = document.querySelector(`input[data-task-id="${id}"]`);
  if (!inp) return;
  inp.focus({ preventScroll: true });
  const v = inp.value || "";
  try {
    inp.setSelectionRange(v.length, v.length);
  } catch {}
}

// ---------- Subtitle clock ----------
function setSubtitle() {
  const el = $("#subtitle");
  if (!el) return;

  const prefs = getWeatherPrefs(); // uses WEATHER_KEY + defaultWeatherPrefs()
  const tz = prefs?.tz || "America/New_York";

  el.textContent = new Date().toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
    timeZoneName: "short",
  });
}

function startSubtitleClock() {
  setSubtitle();
  const now = new Date();
  const msUntilNextMinute =
    (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  setTimeout(() => {
    setSubtitle();
    setInterval(setSubtitle, 60 * 1000);
  }, msUntilNextMinute);
}

// ---------- Search ----------
function isLikelyUrl(text) {
  const s = text.trim();
  if (/^https?:\/\//i.test(s)) return true;
  return !/\s/.test(s) && /\.[a-z]{2,}([/:?#]|$)/i.test(s);
}

function normalizeUrl(text) {
  const s = text.trim();
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function googleSearchUrl(q) {
  return `https://www.google.com/search?q=${encodeURIComponent(q.trim())}`;
}

function initSearch() {
  const form = $("#searchForm");
  const input = $("#searchInput");
  if (!form || !input) return;

  const focusSearch = () => {
    input.focus({ preventScroll: true });
    const v = input.value || "";
    try {
      input.setSelectionRange(v.length, v.length);
    } catch {}
  };

  requestAnimationFrame(focusSearch);
  window.addEventListener("load", focusSearch, { once: true });

  // "/" focuses search unless typing in another field
  window.addEventListener("keydown", (e) => {
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    const typing = tag === "input" || tag === "textarea";
    if (e.key === "/" && !typing) {
      e.preventDefault();
      focusSearch();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = (input.value || "").trim();
    if (!text) return;

    window.location.href = isLikelyUrl(text)
      ? normalizeUrl(text)
      : googleSearchUrl(text);
  });
}

// ---------- Links Grid ----------
function defaultLinks() {
  // Used only if no links exist yet.
  return [
    {
    id: uuid(),
    title: "Netflix",
    url: "https://www.netflix.com",
    icon: "tv",
  },
  {
    id: uuid(),
    title: "Google Drive",
    url: "https://drive.google.com",
    icon: "folder",
  },
  {
    id: uuid(),
    title: "Instagram",
    url: "https://www.instagram.com",
    icon: "camera",
  },
  {
    id: uuid(),
    title: "HBO Max",
    url: "https://www.max.com",
    icon: "play",
  },
  {
    id: uuid(),
    title: "Outlook",
    url: "https://outlook.live.com",
    icon: "mail",
  },
  {
    id: uuid(),
    title: "Zillow",
    url: "https://www.zillow.com",
    icon: "home",
  },
  ];
}

function getLinks() {
  const links = loadJSON(LINKS_KEY, null);
  if (Array.isArray(links) && links.length) return links;

  const seeded = defaultLinks();
  saveJSON(LINKS_KEY, seeded);
  return seeded;
}

function iconSvg(kind) {
  const list = window.ICONS || [];
  const icon = list.find((i) => i.id === kind) || list.find((i) => i.id === "link");
  const path = icon?.path || "";
  return `
    <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      ${path}
    </svg>
  `;
}

function renderLinksGrid() {
  const root = document.getElementById("linksGrid");
  if (!root) return;

  const links = getLinks();
  root.innerHTML = "";

  if (!links.length) {
    root.innerHTML = `<a class="card" href="/settings">
      <div class="card-top">
        <span class="icon" aria-hidden="true">${iconSvg("link")}</span>
        <div class="card-title">Add links in Settings</div>
      </div>
    </a>`;
    return;
  }

  links.forEach((l) => {
    const title = (l.title || "").trim() || "Untitled";
    let url = (l.url || "").trim();

    // If it's blank, send them to Settings so it doesn't feel dead.
    if (!url) url = "/settings";

    // If user omitted scheme but it looks like a domain, fix it.
    if (url !== "/settings" && !/^https?:\/\//i.test(url) && url.includes(".")) {
    url = "https://" + url;
    }

    const a = document.createElement("a");
    a.className = "card";
    a.href = url;

    a.innerHTML = `
      <div class="card-top">
        <span class="icon" aria-hidden="true">${iconSvg(l.icon || "link")}</span>
        <div class="card-title">${escapeHtml(title)}</div>
      </div>
    `;

    root.appendChild(a);
  });
}

// ---------- Checklist State ----------
function defaultState() {
  const now = Date.now();
  return {
    active: [
      { id: uuid(), text: "Do laundry", created: now, checked: false, pendingArchiveAt: null },
      { id: uuid(), text: "Go grocery shopping", created: now, checked: false, pendingArchiveAt: null },
      { id: uuid(), text: "Buy valentines gift", created: now, checked: false, pendingArchiveAt: null },
      { id: uuid(), text: "Walk dog", created: now, checked: false, pendingArchiveAt: null },
    ],
    archived: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      active: Array.isArray(parsed.active) ? parsed.active : defaultState().active,
      archived: Array.isArray(parsed.archived) ? parsed.archived : [],
    };
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {}
}

// ---------- Checklist render ----------
function renderActive(state) {
  const root = $("#todo");
  if (!root) return;
  root.innerHTML = "";

  state.active.forEach((t, idx) => {
    const row = document.createElement("div");
    row.className = "todo-item" + (t.checked ? " done" : "");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!t.checked;

    cb.addEventListener("change", () => {
      t.checked = cb.checked;
      t.pendingArchiveAt = t.checked ? Date.now() + 5000 : null;
      saveState(state);
      renderActive(state);
      renderArchive(state);
    });

    const textWrap = document.createElement("div");
    textWrap.className = "todo-text";

    const input = document.createElement("input");
    input.type = "text";
    input.value = t.text ?? "";
    input.placeholder = "New task…";
    input.setAttribute("data-task-id", t.id);

    input.addEventListener("input", () => {
      t.text = input.value;
      saveState(state);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const newTask = { id: uuid(), text: "", created: Date.now(), checked: false, pendingArchiveAt: null };
        state.active.splice(idx + 1, 0, newTask);
        saveState(state);
        renderActive(state);
        requestAnimationFrame(() => focusInputByTaskId(newTask.id));
        return;
      }

      if (e.key === "Backspace" && (input.value || "").length === 0) {
        if (state.active.length === 1) return;
        e.preventDefault();
        state.active.splice(idx, 1);
        saveState(state);
        renderActive(state);
        const target = state.active[Math.max(0, idx - 1)] || state.active[0];
        requestAnimationFrame(() => focusInputByTaskId(target.id));
        return;
      }

      if (e.key === "ArrowUp") {
        const prev = state.active[idx - 1];
        if (prev) {
          e.preventDefault();
          focusInputByTaskId(prev.id);
        }
      }

      if (e.key === "ArrowDown") {
        const next = state.active[idx + 1];
        if (next) {
          e.preventDefault();
          focusInputByTaskId(next.id);
        }
      }
    });

    textWrap.appendChild(input);
    row.appendChild(cb);
    row.appendChild(textWrap);
    root.appendChild(row);
  });
}

function renderArchive(state) {
  const list = $("#archiveList");
  if (!list) return;

  if (!state.archived.length) {
    list.innerHTML = `<div class="archive-row">
      <div class="archive-text" style="text-decoration:none;opacity:.55;">No completed tasks yet.</div>
    </div>`;
    return;
  }

  list.innerHTML = "";
  state.archived
    .slice()
    .sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0))
    .forEach((t) => {
      const row = document.createElement("div");
      row.className = "archive-row";

      const text = document.createElement("div");
      text.className = "archive-text";
      text.textContent = t.text || "(empty)";

      const restore = document.createElement("button");
      restore.className = "archive-btn";
      restore.type = "button";
      restore.textContent = "Restore";
      restore.addEventListener("click", () => {
        state.archived = state.archived.filter((x) => x.id !== t.id);
        state.active.unshift({
          id: t.id,
          text: t.text,
          created: t.created || Date.now(),
          checked: false,
          pendingArchiveAt: null,
        });
        saveState(state);
        renderArchive(state);
        renderActive(state);
        requestAnimationFrame(() => focusInputByTaskId(t.id));
      });

      const del = document.createElement("button");
      del.className = "archive-btn";
      del.type = "button";
      del.textContent = "Delete";
      del.addEventListener("click", () => {
        state.archived = state.archived.filter((x) => x.id !== t.id);
        saveState(state);
        renderArchive(state);
      });

      row.appendChild(text);
      row.appendChild(restore);
      row.appendChild(del);
      list.appendChild(row);
    });
}

function tickArchive(state) {
  const now = Date.now();
  let moved = false;

  const remaining = [];
  for (const t of state.active) {
    if (t.checked && t.pendingArchiveAt && now >= t.pendingArchiveAt) {
      state.archived.push({ id: t.id, text: t.text, created: t.created, archivedAt: now });
      moved = true;
    } else {
      remaining.push(t);
    }
  }

  if (moved) {
    state.active =
      remaining.length
        ? remaining
        : [{ id: uuid(), text: "", created: Date.now(), checked: false, pendingArchiveAt: null }];

    saveState(state);
    renderActive(state);
    renderArchive(state);
  }
}

// ---------- Modal ----------
function openArchive() {
  $("#archiveModal")?.setAttribute("aria-hidden", "false");
}
function closeArchive() {
  $("#archiveModal")?.setAttribute("aria-hidden", "true");
}

// ---------- Weather ----------
function defaultWeatherPrefs() {
  // DEFAULT: Seattle
  return {
    name: "Seattle, WA, United States",
    lat: 47.6062,
    lon: -122.3321,
    tz: "America/Los_Angeles",
  };
}

function getWeatherPrefs() {
  const prefs = loadJSON(WEATHER_KEY, null);
  if (
    prefs &&
    typeof prefs === "object" &&
    typeof prefs.lat === "number" &&
    typeof prefs.lon === "number"
  ) {
    return {
      name: prefs.name || defaultWeatherPrefs().name,
      lat: prefs.lat,
      lon: prefs.lon,
      tz: prefs.tz || defaultWeatherPrefs().tz,
    };
  }
  return defaultWeatherPrefs();
}

function wxFromCode(code) {
  if (code === 0) return { e: "☀️", d: "Clear" };
  if (code === 1 || code === 2) return { e: "🌤️", d: "Partly cloudy" };
  if (code === 3) return { e: "☁️", d: "Cloudy" };
  if (code === 45 || code === 48) return { e: "🌫️", d: "Fog" };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { e: "🌧️", d: "Rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { e: "🌨️", d: "Snow" };
  if ([95, 96, 99].includes(code)) return { e: "⛈️", d: "Thunderstorms" };
  return { e: "⛅️", d: "Weather" };
}

async function loadWeather() {
  const prefs = getWeatherPrefs();
  const lat = prefs.lat;
  const lon = prefs.lon;

  const cityPill = $("#weatherCity");
  if (cityPill) {
  const label = (prefs.name || "Weather").split(",")[0].trim();
  cityPill.textContent = label || "Weather";
}

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph` +
    `&timezone=${encodeURIComponent(prefs.tz || "America/Los_Angeles")}`;

  const tempEl = $("#wxTemp");
  const descEl = $("#wxDesc");
  const emojiEl = $("#wxEmoji");
  const miniEl = $("#wxMini");

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    const cur = data.current;
    const daily = data.daily;

    const t = Math.round(cur.temperature_2m);
    const feels = Math.round(cur.apparent_temperature);
    const wind = Math.round(cur.wind_speed_10m);
    const wx = wxFromCode(cur.weather_code);

    const hi = Math.round(daily.temperature_2m_max?.[0]);
    const lo = Math.round(daily.temperature_2m_min?.[0]);

    if (tempEl) tempEl.textContent = `${t}°`;
    if (emojiEl) emojiEl.textContent = wx.e;
    if (descEl) descEl.textContent = `${wx.d} • Feels like ${feels}°`;

    if (miniEl) {
      miniEl.innerHTML = `
        <span class="weather-chip">H: ${hi}°</span>
        <span class="weather-chip">L: ${lo}°</span>
        <span class="weather-chip">Wind: ${wind} mph</span>
      `;
    }
  } catch {
    if (descEl) descEl.textContent = "Weather unavailable";
  }
}

// ---------- Init ----------
(function init() {
  window.renderVersionBadge?.();

  startSubtitleClock();
  initSearch();

  // links grid
  renderLinksGrid();

  // checklist
  const state = loadState();
  saveState(state);

  renderActive(state);
  renderArchive(state);

  $("#archiveBtn")?.addEventListener("click", openArchive);
  $("#archiveClose")?.addEventListener("click", closeArchive);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeArchive();
  });

  // 500ms is plenty and reduces churn vs 300ms
  setInterval(() => tickArchive(state), 500);

  // weather
  loadWeather();
  setInterval(loadWeather, 20 * 60 * 1000);
})();

// Service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}