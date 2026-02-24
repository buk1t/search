// /js/script.js
// Home page logic: links grid + checklist (auto-archive) + weather + subtitle clock + search (uses search engine pref)

const STORE_KEY = "home.state.v1";
const LINKS_KEY = "home.links.v1";
const WEATHER_KEY = "home.weather.v1";
const SEARCH_KEY = "home.search.v1";

const $ = (sel) => document.querySelector(sel);

// ---------- utils ----------
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

function isLikelyUrl(text) {
  const s = String(text || "").trim();
  if (!s) return false;
  if (/^https?:\/\//i.test(s)) return true;
  return !/\s/.test(s) && /\.[a-z]{2,}([/:?#]|$)/i.test(s);
}

function normalizeUrl(text) {
  const s = String(text || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

// ---------- Search engine prefs (read-only on Home) ----------
function defaultSearchPrefs() {
  return {
    engine: "google",
    customTemplate: "https://www.google.com/search?q={q}",
  };
}

function getSearchPrefs() {
  const prefs = loadJSON(SEARCH_KEY, null);
  if (!prefs || typeof prefs !== "object") return defaultSearchPrefs();

  const engine = String(prefs.engine || "").trim().toLowerCase() || "google";
  const customTemplate =
    String(prefs.customTemplate || "").trim() || defaultSearchPrefs().customTemplate;

  return { engine, customTemplate };
}

function engineToTemplate(engine, customTemplate) {
  switch (engine) {
    case "ddg":
      return "https://duckduckgo.com/?q={q}";
    case "brave":
      return "https://search.brave.com/search?q={q}";
    case "bing":
      return "https://www.bing.com/search?q={q}";
    case "kagi":
      return "https://kagi.com/search?q={q}";
    case "perplexity":
      return "https://www.perplexity.ai/search?q={q}";
    case "custom":
      return customTemplate || defaultSearchPrefs().customTemplate;
    case "google":
    default:
      return "https://www.google.com/search?q={q}";
  }
}

function buildSearchUrl(q) {
  const prefs = getSearchPrefs();
  const template = engineToTemplate(prefs.engine, prefs.customTemplate);

  // must include {q}; if not, fall back to google
  if (!template.includes("{q}")) {
    return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  }
  return template.replaceAll("{q}", encodeURIComponent(q));
}

// ---------- Subtitle clock ----------
function setSubtitle() {
  const el = $("#subtitle");
  if (!el) return;

  const prefs = getWeatherPrefs();
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

// ---------- Search bar ----------
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

  // "/" focuses search
  window.addEventListener("keydown", (e) => {
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    const typing = tag === "input" || tag === "textarea" || tag === "select";
    if (e.key === "/" && !typing) {
      e.preventDefault();
      focusSearch();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = (input.value || "").trim();
    if (!text) return;

    // URL goes directly; otherwise use preferred engine
    window.location.href = isLikelyUrl(text) ? normalizeUrl(text) : buildSearchUrl(text);
  });
}

// ---------- Links grid ----------
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

function getLinks() {
  const links = loadJSON(LINKS_KEY, []);
  return Array.isArray(links) ? links : [];
}

function renderLinksGrid() {
  const root = $("#linksGrid");
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
    const icon = l.icon || "link";
    let url = (l.url || "").trim() || "";

    // normalize
    if (!url) url = "/settings";
    if (url !== "/settings" && !/^https?:\/\//i.test(url) && url.includes(".")) {
      url = "https://" + url;
    }

    const a = document.createElement("a");
    a.className = "card";
    a.href = url;

    a.innerHTML = `
      <div class="card-top">
        <span class="icon" aria-hidden="true">${iconSvg(icon)}</span>
        <div class="card-title">${escapeHtml(title)}</div>
      </div>
    `;

    root.appendChild(a);
  });
}

// ---------- Checklist ----------
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
  const st = loadJSON(STORE_KEY, null);
  if (!st || typeof st !== "object") return defaultState();
  return {
    active: Array.isArray(st.active) ? st.active : defaultState().active,
    archived: Array.isArray(st.archived) ? st.archived : [],
  };
}

function saveState(state) {
  saveJSON(STORE_KEY, state);
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
  }
}

// ---------- Weather ----------
function defaultWeatherPrefs() {
  return { name: "Seattle, WA, United States", lat: 47.6062, lon: -122.3321, tz: "America/Los_Angeles" };
}

function getWeatherPrefs() {
  const prefs = loadJSON(WEATHER_KEY, null);
  if (prefs && typeof prefs === "object" && typeof prefs.lat === "number" && typeof prefs.lon === "number") {
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
  const cityPill = $("#weatherCity");
  if (cityPill) {
    const label = (prefs.name || "Weather").split(",")[0].trim();
    cityPill.textContent = label || "Weather";
  }

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${prefs.lat}&longitude=${prefs.lon}` +
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

// ---------- init ----------
(function init() {
  startSubtitleClock();
  initSearch();
  renderLinksGrid();

  const state = loadState();
  saveState(state);
  renderActive(state);
  setInterval(() => tickArchive(state), 500);

  loadWeather();
  setInterval(loadWeather, 20 * 60 * 1000);
})();