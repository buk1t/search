// ============================================================
// Home page script (ONE file):
// - Subtitle clock (minute-synced, no drift)
// - Weather (Open-Meteo, no key)
// - Apple-Notes-ish checklist:
//    Enter => new row
//    Backspace on empty => delete row (and focus moves)
//    Check => auto-archive after 5s
//    Archive button => modal popup (click outside / Esc to close)
// ============================================================

const STORE_KEY = "home_tasks_v4";

// ---------- Utils ----------
function uuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return (
    "id-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10)
  );
}

function setSubtitle() {
  const el = document.getElementById("subtitle");
  if (!el) return;

  const now = new Date();
  el.textContent = now.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Minute-synced clock so it flips exactly at :00
let subtitleTimeout = null;
let subtitleInterval = null;

function startAccurateSubtitleClock() {
  setSubtitle();

  if (subtitleTimeout) clearTimeout(subtitleTimeout);
  if (subtitleInterval) clearInterval(subtitleInterval);

  const now = new Date();
  const msUntilNextMinute =
    (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  subtitleTimeout = setTimeout(() => {
    setSubtitle();
    subtitleInterval = setInterval(setSubtitle, 60 * 1000);
  }, msUntilNextMinute);
}

function focusInputById(id) {
  const inp = document.querySelector(`input[data-task-id="${id}"]`);
  if (inp) {
    inp.focus();
    const v = inp.value;
    try {
      inp.setSelectionRange(v.length, v.length);
    } catch {}
  }
}

// ---------- State ----------
function defaultState() {
  return {
    active: [
      { id: uuid(), text: "Math homework", created: Date.now(), checked: false, pendingArchiveAt: null },
      { id: uuid(), text: "Schoology check", created: Date.now(), checked: false, pendingArchiveAt: null },
      { id: uuid(), text: "Study (SAT/AP)", created: Date.now(), checked: false, pendingArchiveAt: null },
      { id: uuid(), text: "Pack / prep for tomorrow", created: Date.now(), checked: false, pendingArchiveAt: null },
    ],
    archived: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultState();
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
  const root = document.getElementById("todo");
  if (!root) return;
  root.innerHTML = "";

  state.active.forEach((t, idx) => {
    const row = document.createElement("div");
    row.className = "todo-item" + (t.checked ? " done" : "");

    // checkbox
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

    // text input
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
      // ENTER: new row below
      if (e.key === "Enter") {
        e.preventDefault();

        const newTask = {
          id: uuid(),
          text: "",
          created: Date.now(),
          checked: false,
          pendingArchiveAt: null,
        };

        state.active.splice(idx + 1, 0, newTask);
        saveState(state);
        renderActive(state);
        requestAnimationFrame(() => focusInputById(newTask.id));
        return;
      }

      // BACKSPACE on empty: delete row
      if (e.key === "Backspace") {
        const val = input.value || "";
        if (val.length === 0) {
          if (state.active.length === 1) return;

          e.preventDefault();
          state.active.splice(idx, 1);
          saveState(state);
          renderActive(state);

          const target = state.active[Math.max(0, idx - 1)] || state.active[0];
          requestAnimationFrame(() => focusInputById(target.id));
          return;
        }
      }

      // Up/Down arrows move between rows
      if (e.key === "ArrowUp") {
        const prev = state.active[idx - 1];
        if (prev) {
          e.preventDefault();
          focusInputById(prev.id);
        }
      }
      if (e.key === "ArrowDown") {
        const next = state.active[idx + 1];
        if (next) {
          e.preventDefault();
          focusInputById(next.id);
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
  const list = document.getElementById("archiveList");
  if (!list) return;

  if (!state.archived.length) {
    list.innerHTML = `
      <div class="archive-row">
        <div class="archive-text" style="text-decoration:none;opacity:.55;">No completed tasks yet.</div>
      </div>
    `;
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

        if (!state.active.length) {
          state.active = [{ id: uuid(), text: "", created: Date.now(), checked: false, pendingArchiveAt: null }];
        }

        saveState(state);
        renderArchive(state);
        renderActive(state);
        requestAnimationFrame(() => focusInputById(t.id));
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

// Move checked tasks to archive after 5 seconds
function tickArchive(state) {
  const now = Date.now();
  let moved = false;

  const remaining = [];
  for (const t of state.active) {
    if (t.checked && t.pendingArchiveAt && now >= t.pendingArchiveAt) {
      state.archived.push({
        id: t.id,
        text: t.text,
        created: t.created,
        archivedAt: now,
      });
      moved = true;
    } else {
      remaining.push(t);
    }
  }

  if (moved) {
    state.active = remaining.length
      ? remaining
      : [{ id: uuid(), text: "", created: Date.now(), checked: false, pendingArchiveAt: null }];

    saveState(state);
    renderActive(state);
    renderArchive(state);
  }
}

// ---------- Modal controls ----------
function openArchive() {
  const modal = document.getElementById("archiveModal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "false");
}

function closeArchive() {
  const modal = document.getElementById("archiveModal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
}

// ---------- Weather (Open-Meteo, no key) ----------
function wxFromCode(code) {
  if (code === 0) return { e: "☀️", d: "Clear" };
  if ([1, 2].includes(code)) return { e: "🌤️", d: "Partly cloudy" };
  if (code === 3) return { e: "☁️", d: "Cloudy" };
  if ([45, 48].includes(code)) return { e: "🌫️", d: "Fog" };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { e: "🌧️", d: "Rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { e: "🌨️", d: "Snow" };
  if ([95, 96, 99].includes(code)) return { e: "⛈️", d: "Thunderstorms" };
  return { e: "⛅️", d: "Weather" };
}

async function loadWeather() {
  // Pittsburgh default
  const lat = 40.4406;
  const lon = -79.9959;

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph` +
    `&timezone=America%2FNew_York`;

  const tempEl = document.getElementById("wxTemp");
  const descEl = document.getElementById("wxDesc");
  const emojiEl = document.getElementById("wxEmoji");
  const miniEl = document.getElementById("wxMini");

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    const cur = data.current;
    const daily = data.daily;

    const t = Math.round(cur.temperature_2m);
    const feels = Math.round(cur.apparent_temperature);
    const wind = Math.round(cur.wind_speed_10m);
    const code = cur.weather_code;

    const hi = Math.round(daily.temperature_2m_max?.[0]);
    const lo = Math.round(daily.temperature_2m_min?.[0]);

    const wx = wxFromCode(code);

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

// ---------- Init (ONE init) ----------
(function init() {
  startAccurateSubtitleClock();

  const state = loadState();
  saveState(state);

  renderActive(state);
  renderArchive(state);

  // Archive modal open/close (backdrop click + Esc)
  document.getElementById("archiveBtn")?.addEventListener("click", openArchive);
  document.getElementById("archiveClose")?.addEventListener("click", closeArchive);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeArchive();
  });

  // Archive ticking
  setInterval(() => tickArchive(state), 300);

  // Weather
  loadWeather();
  setInterval(loadWeather, 20 * 60 * 1000);
})();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}