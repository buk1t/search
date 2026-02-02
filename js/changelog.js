// changelog.js — render major updates

const ENTRIES = [
  {
    version: "v5.0.0",
    title: "Added changelog",
    date: "02/01/26", // optional
    bullets: ["Added a changelog page so users can understand updates.", "Fixed styling aspects.", "Restructured internals."],
  },
  {
    version: "v4.0.0",
    title: "Themes editor",
    date: "01/23/26",
    bullets: ["Created themes page and allowed the user to make custom themes.", "Added 404 page."],
  },
  {
    version: "v3.0.0",
    title: "Settings + customization",
    date: "01/18/26",
    bullets: ["Created settings page.", "Allowed the user to customize links and cities."],
  },
  {
    version: "v2.0.0",
    title: "Dark + light mode",
    date: "01/12/26",
    bullets: ["Added dark and light mode.", "Added custom fonts."],
  },
  {
    version: "v1.0.0",
    title: "First non-beta online version",
    date: "12/23/25",
    bullets: ["First non-beta online version."],
  },
];

function el(tag, cls) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

(function init() {
  // show version pill / link
  window.renderVersionBadge?.();

  const list = document.getElementById("changelogList");
  const note = document.getElementById("updatedNote");
  if (!list) return;

  list.innerHTML = "";

  const latest = ENTRIES[0]?.version || "";
  if (note) note.textContent = latest ? `Latest: ${latest}` : "Latest: —";

  ENTRIES.forEach((e, idx) => {
    const card = el("article", "entry");

    const top = el("div", "entry-top");

    const left = el("div", "entry-ver");
    left.textContent = e.version;

    const badge = el("span", "badge");
    badge.textContent = idx === 0 ? "latest" : "major";
    left.appendChild(badge);

    const date = el("div", "entry-date");
    date.textContent = e.date || "";

    top.appendChild(left);
    top.appendChild(date);

    const body = el("div", "entry-body");
    body.innerHTML = `<div>${e.title}</div>`;

    if (Array.isArray(e.bullets) && e.bullets.length) {
      const ul = el("ul");
      e.bullets.forEach((b) => {
        const li = el("li");
        li.textContent = b;
        ul.appendChild(li);
      });
      body.appendChild(ul);
    }

    card.appendChild(top);
    card.appendChild(body);

    list.appendChild(card);
  });
})();