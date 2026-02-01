// theme.js — theme editor with paired Light/Dark themes + scheme preview

const THEME_KEY = "home.theme.v1";
const $ = (s) => document.querySelector(s);
const root = document.documentElement;

const FIELD_GROUPS = [
  {
    title: "Core",
    hint: "Most of the vibe lives here.",
    fields: [
      { var: "--text", label: "Text", help: "Main text color (rgba ok).", pick: true },
      { var: "--muted", label: "Muted", help: "Secondary text.", pick: true },
      { var: "--card", label: "Card", help: "Surface top tint (rgba best).", pick: true },
      { var: "--card2", label: "Card 2", help: "Surface bottom tint.", pick: true },
      { var: "--stroke", label: "Stroke", help: "Borders.", pick: true },
      { var: "--stroke-strong", label: "Stroke strong", help: "Hover/focus borders.", pick: true },
      { var: "--radius", label: "Radius", help: "e.g. 22px", pick: false },
    ],
  },
  {
    title: "Background",
    hint: "Gradient + overlay glow. This is the ‘atmosphere’.",
    fields: [
      { var: "--bg-a", label: "BG A", help: "Gradient start.", pick: true },
      { var: "--bg-b", label: "BG B", help: "Gradient middle.", pick: true },
      { var: "--bg-c", label: "BG C", help: "Gradient end.", pick: true },
      { var: "--bg-glow", label: "BG glow", help: "Radial highlight (rgba).", pick: true },
      { var: "--ov-a", label: "Overlay glow", help: "Overlay highlight (rgba).", pick: true },
      { var: "--ov-b", label: "Overlay shade", help: "Overlay shade (rgba).", pick: true },
    ],
  },
  {
    title: "Advanced",
    hint: "Tweak if you’re being insane (compliment).",
    fields: [
      { var: "--shadow", label: "Shadow", help: "CSS shadow string.", pick: false },
      { var: "--icon-size", label: "Icon size", help: "e.g. 20px", pick: false },
      { var: "--icon-stroke", label: "Icon stroke", help: "e.g. 1.45", pick: false },
    ],
  },
];

// ----- Presets (paired Light + Dark) -----
const PRESETS = [
  // 1
  {
    name: "Ocean Glass",
    light: {
      "--text": "rgba(20, 24, 30, 0.92)",
      "--muted": "rgba(20, 24, 30, 0.58)",
      "--card": "rgba(246, 250, 255, 0.84)",
      "--card2": "rgba(232, 242, 252, 0.70)",
      "--stroke": "rgba(20, 24, 30, 0.12)",
      "--stroke-strong": "rgba(20, 24, 30, 0.22)",
      "--shadow": "0 18px 46px rgba(0, 0, 0, 0.12)",
      "--radius": "24px",
      "--bg-a": "#d7ebff",
      "--bg-b": "#dff3f1",
      "--bg-c": "#d7e7ff",
      "--bg-glow": "rgba(255, 255, 255, 0.55)",
      "--ov-a": "rgba(255, 255, 255, 0.14)",
      "--ov-b": "rgba(0, 0, 0, 0.07)",
    },
    dark: {
      "--text": "rgba(245, 246, 250, 0.92)",
      "--muted": "rgba(245, 246, 250, 0.62)",
      "--card": "rgba(12, 16, 24, 0.78)",
      "--card2": "rgba(12, 16, 24, 0.56)",
      "--stroke": "rgba(255, 255, 255, 0.12)",
      "--stroke-strong": "rgba(255, 255, 255, 0.22)",
      "--shadow": "0 22px 70px rgba(0, 0, 0, 0.44)",
      "--radius": "24px",
      "--bg-a": "#030817",
      "--bg-b": "#071a2d",
      "--bg-c": "#052029",
      "--bg-glow": "rgba(90, 200, 250, 0.16)",
      "--ov-a": "rgba(90, 200, 250, 0.07)",
      "--ov-b": "rgba(0, 0, 0, 0.55)",
    },
  },

  // 2
  {
    name: "Beachy",
    light: {
      "--text": "rgba(24, 24, 22, 0.92)",
      "--muted": "rgba(24, 24, 22, 0.58)",
      "--card": "rgba(255, 252, 245, 0.86)",
      "--card2": "rgba(244, 238, 228, 0.72)",
      "--stroke": "rgba(24, 24, 22, 0.12)",
      "--stroke-strong": "rgba(24, 24, 22, 0.22)",
      "--shadow": "0 18px 46px rgba(0, 0, 0, 0.12)",
      "--radius": "24px",
      "--bg-a": "#f7efe0",
      "--bg-b": "#e9f3ff",
      "--bg-c": "#f1ead8",
      "--bg-glow": "rgba(255, 255, 255, 0.55)",
      "--ov-a": "rgba(255, 255, 255, 0.14)",
      "--ov-b": "rgba(0, 0, 0, 0.07)",
    },
    dark: {
      "--text": "rgba(245, 246, 250, 0.92)",
      "--muted": "rgba(245, 246, 250, 0.62)",
      "--card": "rgba(18, 18, 22, 0.76)",
      "--card2": "rgba(18, 18, 22, 0.54)",
      "--stroke": "rgba(255, 255, 255, 0.12)",
      "--stroke-strong": "rgba(255, 255, 255, 0.22)",
      "--shadow": "0 24px 80px rgba(0, 0, 0, 0.50)",
      "--radius": "24px",
      "--bg-a": "#090a10",
      "--bg-b": "#11131b",
      "--bg-c": "#101a1e",
      "--bg-glow": "rgba(255, 220, 160, 0.10)",
      "--ov-a": "rgba(255, 220, 160, 0.06)",
      "--ov-b": "rgba(0, 0, 0, 0.60)",
    },
  },

  // 3
  {
    name: "Warm Latte",
    light: {
      "--text": "rgba(28, 22, 18, 0.92)",
      "--muted": "rgba(28, 22, 18, 0.58)",
      "--card": "rgba(251, 244, 234, 0.86)",
      "--card2": "rgba(236, 223, 206, 0.72)",
      "--stroke": "rgba(40, 28, 20, 0.14)",
      "--stroke-strong": "rgba(40, 28, 20, 0.25)",
      "--shadow": "0 18px 46px rgba(0, 0, 0, 0.13)",
      "--radius": "22px",
      "--bg-a": "#e9dbc9",
      "--bg-b": "#efe6da",
      "--bg-c": "#dfc8ae",
      "--bg-glow": "rgba(255, 255, 255, 0.40)",
      "--ov-a": "rgba(255, 255, 255, 0.11)",
      "--ov-b": "rgba(0, 0, 0, 0.09)",
    },
    dark: {
      "--text": "rgba(245, 246, 250, 0.92)",
      "--muted": "rgba(245, 246, 250, 0.62)",
      "--card": "rgba(18, 14, 12, 0.78)",
      "--card2": "rgba(18, 14, 12, 0.56)",
      "--stroke": "rgba(255, 255, 255, 0.12)",
      "--stroke-strong": "rgba(255, 255, 255, 0.22)",
      "--shadow": "0 24px 88px rgba(0, 0, 0, 0.55)",
      "--radius": "22px",
      "--bg-a": "#0c0706",
      "--bg-b": "#15100f",
      "--bg-c": "#141915",
      "--bg-glow": "rgba(255, 190, 120, 0.11)",
      "--ov-a": "rgba(255, 190, 120, 0.06)",
      "--ov-b": "rgba(0, 0, 0, 0.62)",
    },
  },

  // 4
  {
    name: "Nord Slate",
    light: {
      "--text": "rgba(18, 22, 30, 0.92)",
      "--muted": "rgba(18, 22, 30, 0.58)",
      "--card": "rgba(246, 248, 252, 0.86)",
      "--card2": "rgba(230, 236, 246, 0.72)",
      "--stroke": "rgba(18, 22, 30, 0.12)",
      "--stroke-strong": "rgba(18, 22, 30, 0.22)",
      "--shadow": "0 18px 46px rgba(0, 0, 0, 0.12)",
      "--radius": "22px",
      "--bg-a": "#dbe4f0",
      "--bg-b": "#e3edf7",
      "--bg-c": "#d7dee9",
      "--bg-glow": "rgba(255, 255, 255, 0.48)",
      "--ov-a": "rgba(255, 255, 255, 0.12)",
      "--ov-b": "rgba(0, 0, 0, 0.07)",
    },
    dark: {
      "--text": "rgba(245, 246, 250, 0.92)",
      "--muted": "rgba(245, 246, 250, 0.62)",
      "--card": "rgba(14, 18, 26, 0.78)",
      "--card2": "rgba(14, 18, 26, 0.56)",
      "--stroke": "rgba(255, 255, 255, 0.12)",
      "--stroke-strong": "rgba(255, 255, 255, 0.22)",
      "--shadow": "0 24px 84px rgba(0, 0, 0, 0.52)",
      "--radius": "22px",
      "--bg-a": "#050812",
      "--bg-b": "#0b1223",
      "--bg-c": "#0b1b22",
      "--bg-glow": "rgba(130, 170, 255, 0.12)",
      "--ov-a": "rgba(130, 170, 255, 0.06)",
      "--ov-b": "rgba(0, 0, 0, 0.60)",
    },
  },

  // 5
  {
    name: "Lavender Haze",
    light: {
      "--text": "rgba(20, 16, 26, 0.92)",
      "--muted": "rgba(20, 16, 26, 0.58)",
      "--card": "rgba(252, 248, 255, 0.86)",
      "--card2": "rgba(236, 228, 248, 0.72)",
      "--stroke": "rgba(20, 16, 26, 0.12)",
      "--stroke-strong": "rgba(20, 16, 26, 0.22)",
      "--shadow": "0 18px 46px rgba(0, 0, 0, 0.12)",
      "--radius": "24px",
      "--bg-a": "#efe7ff",
      "--bg-b": "#e7f0ff",
      "--bg-c": "#f5e7ff",
      "--bg-glow": "rgba(255, 255, 255, 0.55)",
      "--ov-a": "rgba(255, 255, 255, 0.14)",
      "--ov-b": "rgba(0, 0, 0, 0.07)",
    },
    dark: {
      "--text": "rgba(245, 246, 250, 0.92)",
      "--muted": "rgba(245, 246, 250, 0.62)",
      "--card": "rgba(16, 12, 22, 0.78)",
      "--card2": "rgba(16, 12, 22, 0.56)",
      "--stroke": "rgba(255, 255, 255, 0.12)",
      "--stroke-strong": "rgba(255, 255, 255, 0.22)",
      "--shadow": "0 26px 92px rgba(0, 0, 0, 0.58)",
      "--radius": "24px",
      "--bg-a": "#070511",
      "--bg-b": "#120a1f",
      "--bg-c": "#0b1a24",
      "--bg-glow": "rgba(200, 140, 255, 0.12)",
      "--ov-a": "rgba(200, 140, 255, 0.06)",
      "--ov-b": "rgba(0, 0, 0, 0.62)",
    },
  },

  // 6
  {
    name: "Forest",
    light: {
      "--text": "rgba(18, 24, 20, 0.92)",
      "--muted": "rgba(18, 24, 20, 0.58)",
      "--card": "rgba(246, 250, 246, 0.84)",
      "--card2": "rgba(226, 238, 228, 0.72)",
      "--stroke": "rgba(18, 24, 20, 0.12)",
      "--stroke-strong": "rgba(18, 24, 20, 0.22)",
      "--shadow": "0 18px 46px rgba(0, 0, 0, 0.12)",
      "--radius": "22px",
      "--bg-a": "#d9efe0",
      "--bg-b": "#e7f3e7",
      "--bg-c": "#d7e7db",
      "--bg-glow": "rgba(255, 255, 255, 0.50)",
      "--ov-a": "rgba(255, 255, 255, 0.13)",
      "--ov-b": "rgba(0, 0, 0, 0.07)",
    },
    dark: {
      "--text": "rgba(245, 246, 250, 0.92)",
      "--muted": "rgba(245, 246, 250, 0.62)",
      "--card": "rgba(10, 16, 12, 0.78)",
      "--card2": "rgba(10, 16, 12, 0.56)",
      "--stroke": "rgba(255, 255, 255, 0.12)",
      "--stroke-strong": "rgba(255, 255, 255, 0.22)",
      "--shadow": "0 26px 92px rgba(0, 0, 0, 0.58)",
      "--radius": "22px",
      "--bg-a": "#030b07",
      "--bg-b": "#061612",
      "--bg-c": "#06201a",
      "--bg-glow": "rgba(0, 255, 170, 0.10)",
      "--ov-a": "rgba(0, 255, 170, 0.06)",
      "--ov-b": "rgba(0, 0, 0, 0.62)",
    },
  },

  // 7
  {
    name: "Cherry Soda",
    light: {
      "--text": "rgba(26, 16, 18, 0.92)",
      "--muted": "rgba(26, 16, 18, 0.58)",
      "--card": "rgba(255, 248, 250, 0.86)",
      "--card2": "rgba(248, 232, 238, 0.72)",
      "--stroke": "rgba(26, 16, 18, 0.12)",
      "--stroke-strong": "rgba(26, 16, 18, 0.22)",
      "--shadow": "0 18px 46px rgba(0, 0, 0, 0.12)",
      "--radius": "24px",
      "--bg-a": "#ffe1ea",
      "--bg-b": "#fff0f4",
      "--bg-c": "#f7e0ff",
      "--bg-glow": "rgba(255, 255, 255, 0.55)",
      "--ov-a": "rgba(255, 255, 255, 0.14)",
      "--ov-b": "rgba(0, 0, 0, 0.07)",
    },
    dark: {
      "--text": "rgba(245, 246, 250, 0.92)",
      "--muted": "rgba(245, 246, 250, 0.62)",
      "--card": "rgba(20, 10, 14, 0.78)",
      "--card2": "rgba(20, 10, 14, 0.56)",
      "--stroke": "rgba(255, 255, 255, 0.12)",
      "--stroke-strong": "rgba(255, 255, 255, 0.22)",
      "--shadow": "0 26px 92px rgba(0, 0, 0, 0.60)",
      "--radius": "24px",
      "--bg-a": "#0b0507",
      "--bg-b": "#1a0a10",
      "--bg-c": "#101a22",
      "--bg-glow": "rgba(255, 90, 140, 0.10)",
      "--ov-a": "rgba(255, 90, 140, 0.06)",
      "--ov-b": "rgba(0, 0, 0, 0.64)",
    },
  },

  // 8
  {
    name: "Classic (Your Current)",
    light: {}, // empty means “use current defaults”
    dark: {},  // empty means “use current defaults”
  },
];

// ----- helpers -----
function isSystemDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getSaved() {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSaved(obj) {
  localStorage.setItem(THEME_KEY, JSON.stringify(obj));
}

function updateStatus(text) {
  const pill = $("#statusPill");
  if (pill) pill.textContent = text;
}

function getEditingValue(varName) {
  const saved = getSaved();
  const bucket = state.editingScheme === "dark" ? saved?.dark?.vars : saved?.light?.vars;
  const fromSaved = bucket?.[varName];
  return (fromSaved && String(fromSaved).trim() !== "") ? String(fromSaved).trim() : safeGetVar(varName);
}

function applyVars(vars) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (String(v).trim() !== "") root.style.setProperty(k, String(v));
  }
}

function clearManagedVars() {
  FIELD_GROUPS.flatMap(g => g.fields).forEach(f => root.style.removeProperty(f.var));
}

function toHexish(color) {
  const c = String(color || "").trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)) {
    return c.length === 4 ? "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c;
  }
  const m = c.match(/rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i);
  if (m) {
    const r = Math.max(0, Math.min(255, Math.round(Number(m[1]))));
    const g = Math.max(0, Math.min(255, Math.round(Number(m[2]))));
    const b = Math.max(0, Math.min(255, Math.round(Number(m[3]))));
    const hex = (n) => n.toString(16).padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  }
  return "#777777";
}

// ----- scheme state -----
// schemePreview: "auto" | "light" | "dark"
// editingScheme: "light" | "dark"
const state = {
  schemePreview: "auto",
  editingScheme: isSystemDark() ? "dark" : "light",
};

function setPreviewScheme(scheme) {
  const root = document.documentElement;

  // your system: auto/light/dark
  if (scheme === "auto") {
    delete root.dataset.scheme;
    root.style.removeProperty("color-scheme");
  } else {
    root.dataset.scheme = scheme;           // drives :root[data-scheme="dark"]
    root.style.setProperty("color-scheme", scheme); // fixes Safari input text, etc.
  }
}

function setSchemePreview(mode) {
  state.schemePreview = mode;

  // actually force the scheme (and Safari form behavior)
  setPreviewScheme(mode);

  updateStatus(mode === "auto" ? "Auto" : `Preview: ${mode}`);

  // editing scheme should match what you're previewing
  state.editingScheme =
    mode === "auto" ? (isSystemDark() ? "dark" : "light") : mode;

  // IMPORTANT: re-apply the right saved vars for whatever is now being previewed
  clearManagedVars();
  const saved = getSaved();
  if (saved) applySavedToPage(saved);

  renderControls();
}

function themeObjectFromUI() {
  const light = {};
  const dark = {};
  document.querySelectorAll("[data-var][data-scope]").forEach((inp) => {
    const k = inp.getAttribute("data-var");
    const scope = inp.getAttribute("data-scope"); // light/dark
    const v = (inp.value || "").trim();
    if (!k || !scope || !v) return;
    (scope === "dark" ? dark : light)[k] = v;
  });

  return {
    mode: "auto",
    light: { vars: light },
    dark: { vars: dark },
  };
}

function applySavedToPage(saved) {
  if (!saved) return;

  // always follow auto on normal pages; editor can force via data-scheme
  const scheme = isSystemDark() ? "dark" : "light";
  const vars = (scheme === "dark" ? saved.dark?.vars : saved.light?.vars) || {};
  applyVars(vars);
}

function buildSchemeRow() {
  // insert a scheme row at top of the controls panel area
  const controls = $("#controls");
  if (!controls) return;

  const row = document.createElement("div");
  row.className = "scheme-row";

  const label = document.createElement("div");
  label.className = "panel-sub";
  label.style.marginTop = "0";
  label.textContent = "Preview scheme:";

  const mkBtn = (name, mode) => {
    const b = document.createElement("button");
    b.className = "ghostbtn";
    b.type = "button";
    b.textContent = name;
    b.addEventListener("click", () => setSchemePreview(mode));
    return b;
  };

  row.appendChild(label);
  row.appendChild(mkBtn("Auto", "auto"));
  row.appendChild(mkBtn("Light", "light"));
  row.appendChild(mkBtn("Dark", "dark"));

  controls.appendChild(row);
}

// ✅ CHANGED: default collapsed
function makeSection(title, hint, expandedByDefault = false) {
  const sec = document.createElement("div");
  sec.className = "theme-section";
  sec.setAttribute("aria-expanded", expandedByDefault ? "true" : "false");

  sec.innerHTML = `
    <div class="theme-section-head" role="button" tabindex="0">
      <div class="theme-section-title">
        <div class="name">${title}</div>
        <div class="hint">${hint}</div>
      </div>
      <div class="theme-caret" aria-hidden="true">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      </div>
    </div>
    <div class="theme-section-body"></div>
  `;

  const head = sec.querySelector(".theme-section-head");
  const toggle = () => {
    const on = sec.getAttribute("aria-expanded") === "true";
    sec.setAttribute("aria-expanded", on ? "false" : "true");
  };

  head.addEventListener("click", toggle);
  head.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });

  return sec;
}

function renderControls() {
  const rootEl = $("#controls");
  if (!rootEl) return;

  rootEl.innerHTML = "";

  // Scheme preview controls (keep yours)
  buildSchemeRow();

  // Build sections with compact grids
  FIELD_GROUPS.forEach((group) => {
    // ✅ CHANGED: always collapsed on first render
    const sec = makeSection(
      group.title,
      `${group.hint}  •  Editing: ${state.editingScheme}`
      // third arg omitted => collapsed by default
    );

    const body = sec.querySelector(".theme-section-body");
    const grid = document.createElement("div");
    grid.className = "theme-grid";

    group.fields.forEach((f) => {
      const tile = document.createElement("div");
      tile.className = "theme-tile";

      const currentVal = getEditingValue(f.var);

      tile.innerHTML = `
        <div class="theme-tile-top">
          <div class="theme-label">${f.label}</div>
          <div class="theme-var">${f.var}</div>
        </div>
        <div class="theme-inputrow">
          <input class="theme-text" type="text" data-var="${f.var}" data-scope="${state.editingScheme}" value="${currentVal}">
          ${
            f.pick
              ? `<input class="theme-color" type="color" value="${toHexish(currentVal)}">`
              : `<div style="height:44px;"></div>`
          }
        </div>
      `;

      const text = tile.querySelector(".theme-text");
      const picker = tile.querySelector(".theme-color");

      text.addEventListener("input", () => {
        root.style.setProperty(f.var, text.value.trim());
        updateStatus("Live");
        if (picker) picker.value = toHexish(text.value);
      });

      if (picker) {
        picker.addEventListener("input", () => {
          const current = text.value.trim();
          const a = current.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\s*\)/i);
          if (a) {
            const hex = picker.value;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            text.value = `rgba(${r}, ${g}, ${b}, ${a[1]})`;
          } else {
            text.value = picker.value;
          }
          root.style.setProperty(f.var, text.value.trim());
          updateStatus("Live");
        });
      }

      grid.appendChild(tile);
    });

    body.appendChild(grid);
    rootEl.appendChild(sec);
  });
}

function buildPresets() {
  const row = $("#presetRow");
  if (!row) return;

  row.innerHTML = "";
  PRESETS.forEach((p) => {
    const b = document.createElement("button");
    b.className = "ghostbtn";
    b.type = "button";
    b.textContent = p.name;
    b.addEventListener("click", () => {
      // Apply preset to both schemes (but allow empty to mean “no changes”)
      const saved = getSaved() || { mode: "auto", light: { vars: {} }, dark: { vars: {} } };
      saved.light = { vars: { ...(saved.light?.vars || {}), ...(p.light || {}) } };
      saved.dark = { vars: { ...(saved.dark?.vars || {}), ...(p.dark || {}) } };
      setSaved(saved);

      // Apply based on current scheme
      clearManagedVars();
      applySavedToPage(saved);
      renderControls();
      updateStatus("Preset applied");
    });
    row.appendChild(b);
  });
}

function saveTheme() {
  const obj = themeObjectFromUI();

  // merge with existing so you don't wipe the other scheme accidentally
  const existing = getSaved() || { mode: "auto", light: { vars: {} }, dark: { vars: {} } };
  existing.light = { vars: { ...(existing.light?.vars || {}), ...(obj.light?.vars || {}) } };
  existing.dark = { vars: { ...(existing.dark?.vars || {}), ...(obj.dark?.vars || {}) } };
  existing.mode = "auto";
  setSaved(existing);

  updateStatus("Saved");
}

function resetTheme() {
  const ok = confirm("Reset theme to defaults for this browser?");
  if (!ok) return;
  localStorage.removeItem(THEME_KEY);
  clearManagedVars();
  delete root.dataset.scheme;
  state.schemePreview = "auto";
  state.editingScheme = isSystemDark() ? "dark" : "light";
  renderControls();
  updateStatus("Default");
}

(function init() {
  window.renderVersionBadge?.();

  // Apply saved theme immediately
  const saved = getSaved();
  if (saved) applySavedToPage(saved);

  buildPresets();
  renderControls();

  // Wire buttons
  $("#saveBtn")?.addEventListener("click", saveTheme);
  $("#resetBtn")?.addEventListener("click", resetTheme);

  // Keep editor honest if system scheme flips while open
  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => {
      if (state.schemePreview === "auto") {
        clearManagedVars();
        const s = getSaved();
        if (s) applySavedToPage(s);
        state.editingScheme = isSystemDark() ? "dark" : "light";
        renderControls();
        updateStatus("Auto");
      }
    });
  } catch {}
})();