// Home page script
// - Subtitle clock (minute-synced)
// - Search bar auto-focus + same-tab navigation
// - Weather (Open-Meteo)
// - Checklist with archive modal

const STORE_KEY = "home_tasks_v4";

// ---------- Small utils ----------
const $ = (sel) => document.querySelector(sel);

function uuid() {
  return (crypto?.randomUUID?.() || `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
}

function focusInputByTaskId(id) {
  const inp = document.querySelector(`input[data-task-id="${id}"]`);
  if (!inp) return;
  inp.focus();
  const v = inp.value || "";
  try { inp.setSelectionRange(v.length, v.length); } catch {}
}

// ---------- Subtitle clock ----------
function setSubtitle() {
  const el = $("#subtitle");
  if (!el) return;
  el.textContent = new Date().toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function startSubtitleClock() {
  setSubtitle();
  const now = new Date();
  const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
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

  // Auto-focus on load (your request)
  const focusSearch = () => {
    input.focus({ preventScroll: true });
    const v = input.value || "";
    try { input.setSelectionRange(v.length, v.length); } catch {}
  };
  requestAnimationFrame(focusSearch);
  window.addEventListener("load", focusSearch, { once: true });

  // "/" focuses search unless you're typing in another field
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

    // Same-tab navigation (your request)
    window.location.href = isLikelyUrl(text) ? normalizeUrl(text) : googleSearchUrl(text);
  });
}

// ---------- State ----------
function defaultState() {
  const now = Date.now();
  return {
    active: [
      { id: uuid(), text: "Math homework", created: now, checked: false, pendingArchiveAt: null },
      { id: uuid(), text: "Schoology check", created: now, checked: false, pendingArchiveAt: null },
      { id: uuid(), text: "Study (SAT/AP)", created: now, checked: false, pendingArchiveAt: null },
      { id: uuid(), text: "Pack / prep for tomorrow", created: now, checked: false, pendingArchiveAt: null },
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
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {}
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
        if (prev) { e.preventDefault(); focusInputByTaskId(prev.id); }
      }

      if (e.key === "ArrowDown") {
        const next = state.active[idx + 1];
        if (next) { e.preventDefault(); focusInputByTaskId(next.id); }
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
        state.active.unshift({ id: t.id, text: t.text, created: t.created || Date.now(), checked: false, pendingArchiveAt: null });
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
    state.active = remaining.length ? remaining : [{ id: uuid(), text: "", created: Date.now(), checked: false, pendingArchiveAt: null }];
    saveState(state);
    renderActive(state);
    renderArchive(state);
  }
}

// ---------- Modal ----------
function openArchive() { $("#archiveModal")?.setAttribute("aria-hidden", "false"); }
function closeArchive() { $("#archiveModal")?.setAttribute("aria-hidden", "true"); }

// ---------- Weather ----------
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
  const lat = 40.4406;
  const lon = -79.9959;

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph` +
    `&timezone=America%2FNew_York`;

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

// ---------- Link cards (same-tab) ----------
function forceCardsSameTab() {
  document.querySelectorAll("a.card").forEach((a) => {
    a.removeAttribute("target");
    a.removeAttribute("rel");
  });
}

// ---------- Init ----------
(function init() {
  startSubtitleClock();
  initSearch();
  forceCardsSameTab();

  const state = loadState();
  saveState(state);

  renderActive(state);
  renderArchive(state);

  $("#archiveBtn")?.addEventListener("click", openArchive);
  $("#archiveClose")?.addEventListener("click", closeArchive);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeArchive(); });

  setInterval(() => tickArchive(state), 300);

  loadWeather();
  setInterval(loadWeather, 20 * 60 * 1000);
})();

// Service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}