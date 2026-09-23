(() => {
  const key = "metatecno_cookie_consent_v1";
  const banner = document.querySelector("[data-cookie-banner]");
  if (!banner) return;
  const labels = {
    en: "Cookie settings",
    es: "Configuración de cookies",
    pt: "Configurações de cookies",
    fr: "Paramètres des cookies",
    ru: "Настройки cookie",
    ar: "إعدادات ملفات تعريف الارتباط",
    de: "Cookie-Einstellungen",
    it: "Impostazioni cookie"
  };
  const language = (document.documentElement.lang || "en").toLowerCase().split("-")[0];
  const readChoice = () => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value && (value.choice === "all" || value.choice === "essential") ? value.choice : "";
    } catch (_) {
      return "";
    }
  };
  const savedChoice = readChoice();
  banner.hidden = Boolean(savedChoice);
  const dispatchChoice = (choice) => {
    window.dispatchEvent(new CustomEvent("metatecno-cookie-consent", { detail: { choice } }));
  };
  const setChoice = (choice) => {
    const previous = readChoice();
    localStorage.setItem(key, JSON.stringify({ choice, time: new Date().toISOString() }));
    banner.hidden = true;
    dispatchChoice(choice);
    if (previous === "all" && choice === "essential") window.location.reload();
  };
  banner.querySelector("[data-cookie-accept]")?.addEventListener("click", () => setChoice("all"));
  banner.querySelector("[data-cookie-reject]")?.addEventListener("click", () => setChoice("essential"));
  const footerNav = document.querySelector(".site-footer nav");
  if (footerNav && !footerNav.querySelector("[data-cookie-settings]")) {
    const settings = document.createElement("button");
    settings.type = "button";
    settings.dataset.cookieSettings = "true";
    settings.textContent = labels[language] || labels.en;
    settings.style.cssText = "border:0;background:transparent;color:inherit;padding:0;font:inherit;text-decoration:underline;cursor:pointer";
    settings.addEventListener("click", () => {
      banner.hidden = false;
      banner.querySelector("[data-cookie-accept]")?.focus();
    });
    footerNav.appendChild(settings);
  }
  if (savedChoice) queueMicrotask(() => dispatchChoice(savedChoice));
})();
