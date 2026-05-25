(() => {
  const key = "metatecno_cookie_consent_v1";
  const banner = document.querySelector("[data-cookie-banner]");
  if (!banner) return;
  const saved = localStorage.getItem(key);
  if (!saved) banner.hidden = false;
  const setChoice = (choice) => {
    localStorage.setItem(key, JSON.stringify({ choice, time: new Date().toISOString() }));
    banner.hidden = true;
    window.dispatchEvent(new CustomEvent("metatecno-cookie-consent", { detail: { choice } }));
  };
  banner.querySelector("[data-cookie-accept]")?.addEventListener("click", () => setChoice("all"));
  banner.querySelector("[data-cookie-reject]")?.addEventListener("click", () => setChoice("essential"));
})();