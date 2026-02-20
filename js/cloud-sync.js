// /js/cloud-sync.js
(() => {
  const API = "https://api.buk1t.com";
  const LOGIN = "https://login.buk1t.com";

  const HOME_PREFIX = "home.";
  const MAX_KEYS = 80;

  const state = {
    me: null,
    pulling: false,
    pushing: false,
    pushTimer: null,
    lastPushAt: 0,
  };

  const $ = (sel) => document.querySelector(sel);

  function now() {
    return Date.now();
  }

  function loginUrl() {
    return `${LOGIN}/?return_to=${encodeURIComponent(location.href)}`;
  }

  async function apiJson(path, opts = {}) {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
    });
    // If CORS fails, this throws before here. We just let it bubble.
    if (!res.ok) {
      let msg = "";
      try {
        msg = await res.text();
      } catch {}
      throw new Error(`API ${path} failed: ${res.status} ${msg}`);
    }
    return res.json();
  }

  async function getMe() {
    try {
      const data = await apiJson("/api/me");
      state.me = data?.ok ? data : null;
      return state.me;
    } catch {
      state.me = null;
      return null;
    }
  }

  function collectHomeSettings() {
    const out = {};
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(HOME_PREFIX)) continue;
      const v = localStorage.getItem(k);
      if (typeof v !== "string") continue;
      out[k] = v;
      count++;
      if (count >= MAX_KEYS) break;
    }
    return out;
  }

  function applyHomeSettings(map) {
    if (!map || typeof map !== "object") return;
    for (const [k, v] of Object.entries(map)) {
      if (!String(k).startsWith(HOME_PREFIX)) continue;
      if (typeof v !== "string") continue;
      localStorage.setItem(k, v);
    }
  }

  function setSyncPill(text) {
    const el = $("#syncPill");
    if (!el) return;
    el.textContent = text || "";
    el.style.display = text ? "inline-flex" : "none";
  }

  function renderAccount() {
    const slot = $("#accountSlot");
    if (!slot) return;

    const me = state.me;

    if (!me?.ok) {
      slot.innerHTML = `
        <a class="acct" href="${loginUrl()}" title="Sign in">
          <span class="acct-dot" aria-hidden="true"></span>
        </a>
      `;
      return;
    }

    const avatar = me?.user?.avatar_url || me?.user?.avatar || "";
    const email = me?.user?.email || me?.user?.login || "account";

    slot.innerHTML = `
      <button class="acct" id="acctBtn" type="button" title="${escapeHtml(email)}">
        ${
          avatar
            ? `<img class="acct-img" src="${escapeAttr(avatar)}" alt="" />`
            : `<span class="acct-dot" aria-hidden="true"></span>`
        }
      </button>
      <div class="acct-menu" id="acctMenu" hidden>
        <div class="acct-meta">
          <div class="acct-email">${escapeHtml(email)}</div>
          <div class="acct-sub">${escapeHtml(me?.user?.name || "")}</div>
        </div>
        <a class="acct-link" href="${LOGIN}/settings">Account settings</a>
        <a class="acct-link" href="${API}/api/logout?return_to=${encodeURIComponent(
          location.href
        )}">Log out</a>
      </div>
    `;

    const btn = $("#acctBtn");
    const menu = $("#acctMenu");

    function close() {
      if (!menu) return;
      menu.hidden = true;
      btn?.setAttribute("aria-expanded", "false");
    }
    function toggle() {
      if (!menu) return;
      const open = menu.hidden;
      menu.hidden = !open;
      btn?.setAttribute("aria-expanded", open ? "true" : "false");
    }

    btn?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle();
    });

    window.addEventListener("click", close);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  // small helpers (no libs)
  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function escapeAttr(s) {
    return escapeHtml(s).replaceAll("`", "&#096;");
  }

  async function pullFromCloud() {
    if (state.pulling) return;
    state.pulling = true;
    try {
      const me = state.me || (await getMe());
      if (!me?.ok) {
        setSyncPill("Not signed in");
        return;
      }

      setSyncPill("Syncing…");
      const data = await apiJson("/api/home/settings");
      if (data?.ok && data.settings) {
        applyHomeSettings(data.settings);
        setSyncPill("Synced ✅");
      } else {
        setSyncPill("No cloud settings yet");
      }
    } catch {
      setSyncPill("Sync failed");
    } finally {
      state.pulling = false;
    }
  }

  async function pushToCloud() {
    if (state.pushing) return;
    state.pushing = true;
    try {
      const me = state.me || (await getMe());
      if (!me?.ok) return;

      const payload = collectHomeSettings();
      await apiJson("/api/home/settings", {
        method: "PATCH",
        body: JSON.stringify({ settings: payload }),
      });

      state.lastPushAt = now();
      setSyncPill("Synced ✅");
    } catch {
      // don’t spam errors
      setSyncPill("Sync failed");
    } finally {
      state.pushing = false;
    }
  }

  function schedulePush() {
    // debounce — if someone is typing, don’t PATCH 50 times
    clearTimeout(state.pushTimer);
    state.pushTimer = setTimeout(() => pushToCloud(), 600);
  }

  function patchLocalStorage() {
    const _set = localStorage.setItem.bind(localStorage);
    const _remove = localStorage.removeItem.bind(localStorage);

    localStorage.setItem = (k, v) => {
      _set(k, v);
      if (String(k).startsWith(HOME_PREFIX)) schedulePush();
    };

    localStorage.removeItem = (k) => {
      _remove(k);
      if (String(k).startsWith(HOME_PREFIX)) schedulePush();
    };
  }

  async function init() {
    patchLocalStorage();
    await getMe();
    renderAccount();

    // Pull first so the rest of your existing scripts read the newest values
    await pullFromCloud();
  }

  // expose tiny API if you want it later
  window.BUK1T_CLOUD = {
    init,
    pull: pullFromCloud,
    push: pushToCloud,
    get me() {
      return state.me;
    },
  };

  // start ASAP
  document.addEventListener("DOMContentLoaded", init, { once: true });
})();