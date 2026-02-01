// version.js
// Single source of truth for app version + tiny helper to render it.

window.APP_VERSION = "4.0.0";

window.renderVersionBadge = function renderVersionBadge() {
  const el = document.getElementById("version");
  if (!el) return;

  // allow hiding on specific pages if needed later
  const v = window.APP_VERSION || "dev";
  el.textContent = `v${v}`;
};