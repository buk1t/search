// version.js — version badge renderer (semver stored, short shown)

(() => {
  // Put your real semver here
  const CURRENT_VERSION = "v5.0.0";

  function shortVersion(v) {
    // "v5.0.0" -> "v5"
    const m = String(v || "").match(/^v?(\d+)/i);
    return m ? `v${m[1]}` : String(v || "");
  }

  function renderVersionBadge() {
    const host = document.getElementById("version");
    if (!host) return;

    // If changelog.html lives in the same folder as the current page:
    const href = "/changelog";

    // If you want it to open in same tab, keep as-is.
    host.innerHTML = `
      <a class="version-pill" href="${href}" title="Open changelog">
        <span class="v">${shortVersion(CURRENT_VERSION)}</span>
        <span class="dot">•</span>
        <span class="t">Changelog</span>
      </a>
    `;
  }

  // Expose for pages that call it
  window.renderVersionBadge = renderVersionBadge;

  // Render when DOM is ready (prevents “nothing happens” / missing element timing)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderVersionBadge);
  } else {
    renderVersionBadge();
  }
})();