(() => {
  "use strict";

  const header = document.querySelector(".site-header");
  const nav = header?.querySelector(".nav");
  if (!header || !nav) return;

  const menuLabel = nav.getAttribute("aria-label")?.trim() || "Menu";
  const toggle = document.createElement("button");
  const icon = document.createElement("span");
  const label = document.createElement("span");
  const navId = nav.id || "site-navigation";

  nav.id = navId;
  icon.className = "nav-toggle-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "☰";
  label.textContent = menuLabel;
  toggle.type = "button";
  toggle.className = "nav-toggle";
  toggle.setAttribute("aria-controls", navId);
  toggle.setAttribute("aria-expanded", "false");
  toggle.append(icon, label);
  header.classList.add("nav-enhanced");
  header.insertBefore(toggle, nav);

  const media = window.matchMedia("(max-width: 620px)");
  const setOpen = (open, moveFocus = false) => {
    toggle.setAttribute("aria-expanded", String(open));
    icon.textContent = open ? "×" : "☰";
    if (media.matches) nav.hidden = !open;
    else nav.hidden = false;
    if (moveFocus && !open) toggle.focus();
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  nav.addEventListener("click", (event) => {
    if (media.matches && event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false, true);
    }
  });

  media.addEventListener?.("change", () => setOpen(false));
  setOpen(false);
})();
