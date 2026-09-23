(() => {
  "use strict";

  const MEASUREMENT_ID = document.querySelector('meta[name="metatecno-ga4-id"]')?.content || "";
  const CONSENT_KEY = "metatecno_cookie_consent_v1";
  const LEAD_PENDING_KEY = "metatecno_lead_pending_v1";
  const isLocalDebug = ["localhost", "127.0.0.1"].includes(location.hostname);
  const isConfigured = /^G-[A-Z0-9]{8,}$/.test(MEASUREMENT_ID) && !MEASUREMENT_ID.includes("REPLACE");
  let tagLoaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  const deniedConsent = {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  };

  window.gtag("consent", "default", deniedConsent);
  window.gtag("set", "ads_data_redaction", true);

  function savedChoice() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
      return saved && (saved.choice === "all" || saved.choice === "essential") ? saved.choice : "";
    } catch (_) {
      return "";
    }
  }

  function pageType() {
    const path = location.pathname.replace(/\/index\.html$/, "/");
    if (/\/thank-you\/$/.test(path)) return "thank_you";
    if (/\/contact\/$/.test(path)) return "contact";
    if (/\/knowledge\//.test(path)) return "knowledge";
    if (/\/services\//.test(path)) return "service";
    if (/\/products\//.test(path)) return path.endsWith("/products/") ? "product_hub" : "product";
    if (/\/technology\/$/.test(path)) return "technology";
    if (/\/about\/$/.test(path)) return "about";
    return path.split("/").filter(Boolean).length <= 1 ? "home" : "other";
  }

  function baseParameters(extra = {}) {
    return {
      content_language: document.documentElement.lang || "en",
      content_group: pageType(),
      page_path: location.pathname,
      ...extra
    };
  }

  function clearAnalyticsCookies() {
    const names = document.cookie
      .split(";")
      .map((item) => item.split("=")[0].trim())
      .filter((name) => name === "_ga" || name.startsWith("_ga_"));
    const domains = ["", location.hostname, `.${location.hostname.replace(/^www\./, "")}`];
    for (const name of names) {
      for (const domain of domains) {
        const domainPart = domain ? `; Domain=${domain}` : "";
        document.cookie = `${name}=; Max-Age=0; Path=/${domainPart}; SameSite=Lax`;
      }
    }
  }

  function readPendingLead() {
    try {
      return JSON.parse(sessionStorage.getItem(LEAD_PENDING_KEY) || "null");
    } catch (_) {
      return null;
    }
  }

  function clearPendingLead() {
    try {
      sessionStorage.removeItem(LEAD_PENDING_KEY);
    } catch (_) {}
  }

  function maybeGenerateLead() {
    if (!/\/thank-you(?:\/|\/index\.html)$/.test(location.pathname)) return;
    const pending = readPendingLead();
    if (!pending || !pending.path || pending.accepted !== true || !pending.leadId) return;
    const reference = document.createElement("p");
    reference.className = "lead-reference";
    reference.textContent = `Inquiry reference: ${String(pending.leadId).slice(0, 40)}`;
    document.querySelector("main")?.appendChild(reference);
    window.gtag("event", "generate_lead", baseParameters({
      lead_source_path: String(pending.path).slice(0, 160),
      transport_type: "beacon"
    }));
    clearPendingLead();
  }

  function loadGoogleTag() {
    if (tagLoaded || savedChoice() !== "all") return;
    if (!isConfigured) {
      window.dispatchEvent(new CustomEvent("metatecno-analytics-unconfigured"));
      return;
    }
    tagLoaded = true;
    window.gtag("consent", "update", {
      ...deniedConsent,
      analytics_storage: "granted"
    });
    window.gtag("js", new Date());
    window.gtag("config", MEASUREMENT_ID, {
      anonymize_ip: true,
      debug_mode: isLocalDebug,
      send_page_view: true,
      transport_type: "beacon"
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
    script.dataset.metatecnoAnalytics = "true";
    document.head.appendChild(script);
    maybeGenerateLead();
  }

  function sendAuxiliaryEvent(name, parameters) {
    if (savedChoice() !== "all" || !isConfigured) return;
    loadGoogleTag();
    window.gtag("event", name, baseParameters({
      ...parameters,
      transport_type: "beacon"
    }));
  }

  window.metatecnoAnalytics = Object.freeze({
    track(name, parameters = {}) {
      const allowed = new Set(["form_start", "form_error", "contact_whatsapp", "contact_email"]);
      if (!allowed.has(name)) return;
      sendAuxiliaryEvent(name, parameters);
    }
  });

  window.addEventListener("metatecno-cookie-consent", (event) => {
    if (event.detail?.choice === "all") {
      loadGoogleTag();
      return;
    }
    window.gtag("consent", "update", deniedConsent);
    clearAnalyticsCookies();
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    if (/^https:\/\/(?:api\.)?wa\.me\//i.test(href)) {
      sendAuxiliaryEvent("contact_whatsapp", {
        contact_method: "whatsapp",
        cta_location: link.classList.contains("whatsapp-float") ? "floating" : "content"
      });
    } else if (/^mailto:/i.test(href)) {
      sendAuxiliaryEvent("contact_email", {
        contact_method: "email",
        cta_location: link.closest("footer") ? "footer" : "content"
      });
    }
  });

  if (savedChoice() === "all") loadGoogleTag();
})();
