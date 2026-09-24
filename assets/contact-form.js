(() => {
  const MIN_SUBMIT_MS = 3000;
  const MAX_SUBMIT_MS = 2 * 60 * 60 * 1000;
  const siteKey = document.querySelector('meta[name="metatecno-turnstile-sitekey"]')?.content || "";
  const messages = {
    en: { sending: "Sending securely…", invalid: "Please check the highlighted fields.", spam: "Please check the form content and try again.", verify: "Please complete the security check.", failed: "The inquiry was not sent. Please try again or contact us on WhatsApp.", accepted: "Inquiry accepted. Reference: " },
    es: { sending: "Enviando de forma segura…", invalid: "Revise los campos indicados.", spam: "Revise el contenido e inténtelo de nuevo.", verify: "Complete la verificación de seguridad.", failed: "La consulta no se envió. Inténtelo de nuevo o contáctenos por WhatsApp.", accepted: "Consulta aceptada. Referencia: " },
    pt: { sending: "Enviando com segurança…", invalid: "Verifique os campos indicados.", spam: "Revise o conteúdo e tente novamente.", verify: "Conclua a verificação de segurança.", failed: "A consulta não foi enviada. Tente novamente ou fale conosco pelo WhatsApp.", accepted: "Consulta aceita. Referência: " },
    fr: { sending: "Envoi sécurisé…", invalid: "Vérifiez les champs indiqués.", spam: "Vérifiez le contenu et réessayez.", verify: "Effectuez le contrôle de sécurité.", failed: "La demande n'a pas été envoyée. Réessayez ou contactez-nous sur WhatsApp.", accepted: "Demande acceptée. Référence : " },
    ru: { sending: "Безопасная отправка…", invalid: "Проверьте отмеченные поля.", spam: "Проверьте содержание и повторите попытку.", verify: "Пройдите проверку безопасности.", failed: "Запрос не отправлен. Повторите попытку или свяжитесь через WhatsApp.", accepted: "Запрос принят. Номер: " },
    ar: { sending: "جارٍ الإرسال بأمان…", invalid: "يرجى مراجعة الحقول المحددة.", spam: "يرجى مراجعة المحتوى والمحاولة مجددًا.", verify: "يرجى إكمال فحص الأمان.", failed: "لم يتم إرسال الطلب. حاول مرة أخرى أو تواصل عبر WhatsApp.", accepted: "تم قبول الطلب. الرقم المرجعي: " }
  };
  const dial = {
    "1":["US",10,10],"7":["RU",10,10],"20":["EG",8,10],"27":["ZA",9,9],"30":["GR",10,10],"31":["NL",9,9],"32":["BE",8,9],"33":["FR",9,9],"34":["ES",9,9],"36":["HU",8,9],"39":["IT",6,11],"40":["RO",9,9],"41":["CH",9,9],"43":["AT",10,13],"44":["GB",10,10],"45":["DK",8,8],"46":["SE",7,13],"47":["NO",8,8],"48":["PL",9,9],"49":["DE",7,12],"51":["PE",8,9],"52":["MX",10,10],"53":["CU",6,8],"54":["AR",10,10],"55":["BR",10,11],"56":["CL",8,9],"57":["CO",10,10],"58":["VE",10,10],"60":["MY",8,10],"61":["AU",9,9],"62":["ID",8,12],"63":["PH",10,10],"64":["NZ",8,10],"65":["SG",8,8],"66":["TH",8,9],"81":["JP",9,10],"82":["KR",9,10],"84":["VN",9,10],"86":["CN",11,11],"90":["TR",10,10],"91":["IN",10,10],"92":["PK",10,10],"93":["AF",9,9],"94":["LK",9,9],"95":["MM",7,11],"98":["IR",10,10],"212":["MA",9,9],"213":["DZ",8,9],"216":["TN",8,8],"218":["LY",8,9],"220":["GM",7,7],"221":["SN",9,9],"222":["MR",8,8],"223":["ML",8,8],"224":["GN",9,9],"225":["CI",8,10],"226":["BF",8,8],"227":["NE",8,8],"228":["TG",8,8],"229":["BJ",8,8],"230":["MU",7,8],"231":["LR",7,8],"232":["SL",8,8],"233":["GH",9,9],"234":["NG",7,10],"235":["TD",8,8],"236":["CF",8,8],"237":["CM",8,9],"238":["CV",7,7],"239":["ST",7,7],"240":["GQ",9,9],"241":["GA",7,8],"242":["CG",9,9],"243":["CD",9,9],"244":["AO",9,9],"245":["GW",7,7],"248":["SC",7,7],"249":["SD",9,9],"250":["RW",9,9],"251":["ET",9,9],"252":["SO",8,9],"253":["DJ",8,8],"254":["KE",9,9],"255":["TZ",9,9],"256":["UG",9,9],"257":["BI",8,8],"258":["MZ",8,9],"260":["ZM",9,9],"261":["MG",9,9],"263":["ZW",9,9],"264":["NA",9,9],"265":["MW",9,9],"266":["LS",8,8],"267":["BW",7,8],"268":["SZ",8,8],"269":["KM",7,7],"290":["SH",4,4],"291":["ER",7,7],"297":["AW",7,7],"298":["FO",6,6],"299":["GL",6,6],"350":["GI",8,8],"351":["PT",9,9],"352":["LU",6,11],"353":["IE",7,10],"354":["IS",7,7],"355":["AL",8,9],"356":["MT",8,8],"357":["CY",8,8],"358":["FI",5,12],"359":["BG",8,9],"370":["LT",8,8],"371":["LV",8,8],"372":["EE",7,8],"373":["MD",8,8],"374":["AM",8,8],"375":["BY",9,9],"376":["AD",6,6],"377":["MC",5,9],"378":["SM",6,10],"380":["UA",9,9],"381":["RS",8,9],"382":["ME",8,9],"383":["XK",8,9],"385":["HR",8,9],"386":["SI",8,8],"387":["BA",8,8],"389":["MK",8,8],"420":["CZ",9,9],"421":["SK",9,9],"423":["LI",7,9],"852":["HK",8,8],"853":["MO",8,8],"855":["KH",8,9],"856":["LA",8,10],"880":["BD",10,10],"886":["TW",8,9],"960":["MV",7,7],"961":["LB",7,8],"962":["JO",8,9],"963":["SY",8,9],"964":["IQ",8,10],"965":["KW",8,8],"966":["SA",9,9],"967":["YE",8,9],"968":["OM",8,8],"970":["PS",8,9],"971":["AE",9,9],"972":["IL",8,9],"973":["BH",8,8],"974":["QA",8,8],"975":["BT",7,8],"976":["MN",8,8],"977":["NP",10,10],"992":["TJ",9,9],"993":["TM",8,8],"994":["AZ",9,9],"995":["GE",9,9],"996":["KG",9,9],"998":["UZ",9,9]
  };
  const codes = Object.keys(dial).sort((a, b) => b.length - a.length);
  const displayNames = typeof Intl !== "undefined" && Intl.DisplayNames ? new Intl.DisplayNames([document.documentElement.lang || "en"], { type: "region" }) : null;
  function countryLabel(row) {
    if (row[3]) return row[3];
    if (displayNames) {
      try { return displayNames.of(row[0]) || row[0]; } catch (_) {}
    }
    return row[0];
  }
  function detectPhone(value) {
    const raw = value.trim();
    const digits = raw.replace(/\D/g, "");
    if (!raw) return { valid: false, message: "Phone is required." };
    if (!raw.startsWith("+")) return { valid: false, message: "Use international format with a country code." };
    if (digits.length < 8 || digits.length > 15) return { valid: false, message: "Phone number must contain 8 to 15 digits including country code." };
    const code = codes.find((item) => digits.startsWith(item));
    if (!code) return { valid: false, message: "Country code was not recognized." };
    const row = dial[code];
    const national = digits.slice(code.length);
    const country = countryLabel(row);
    if (national.length < row[1] || national.length > row[2]) return { valid: false, country, message: "Detected country: " + country + ". The local number length does not look valid." };
    if (/^(\d)\1{5,}$/.test(national)) return { valid: false, country, message: "Detected country: " + country + ". Please enter a real phone number, not repeated digits." };
    return { valid: true, country, message: "Detected country: " + country + ". Phone format looks valid." };
  }
  function markRequiredFields(form) {
    form.querySelectorAll("input[required], textarea[required], select[required]").forEach((field) => {
      const label = field.closest("label");
      if (!label || label.querySelector("[data-required-star]")) return;
      const star = document.createElement("span");
      star.dataset.requiredStar = "true";
      star.setAttribute("aria-hidden", "true");
      star.textContent = " *";
      star.style.color = "#b33";
      star.style.fontWeight = "900";
      const titleSpan = [...label.children].find((child) => child.tagName === "SPAN" && (child.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING));
      if (titleSpan) {
        titleSpan.appendChild(star);
      } else {
        const wrapper = document.createElement("span");
        while (label.firstChild && label.firstChild !== field) {
          wrapper.appendChild(label.firstChild);
        }
        wrapper.appendChild(star);
        label.insertBefore(wrapper, field);
      }
      field.setAttribute("aria-required", "true");
    });
  }
  function hasSpamSignals(form) {
    const data = new FormData(form);
    const message = String(data.get("Content") || data.get("message") || "");
    const linkCount = (message.match(/https?:\/\/|www\./gi) || []).length;
    if (linkCount > 2) return true;
    if (/(.)\1{12,}/.test(message)) return true;
    return false;
  }
  function languageMessages() {
    const language = (document.documentElement.lang || "en").toLowerCase().split("-")[0];
    return messages[language] || messages.en;
  }
  let turnstilePromise;
  function loadTurnstile() {
    if (!siteKey || siteKey.startsWith("__")) return Promise.reject(new Error("turnstile_unconfigured"));
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (turnstilePromise) return turnstilePromise;
    turnstilePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile_missing"));
      script.onerror = () => reject(new Error("turnstile_load_failed"));
      document.head.appendChild(script);
    });
    return turnstilePromise;
  }
  async function mountTurnstile(form) {
    const slot = form.querySelector("[data-turnstile-container]");
    if (!slot || slot.dataset.rendered) return;
    try {
      const turnstile = await loadTurnstile();
      const widgetId = turnstile.render(slot, {
        sitekey: siteKey,
        action: "contact_form",
        theme: "auto",
        size: "flexible",
        callback: (token) => { form.dataset.turnstileToken = token; },
        "expired-callback": () => { form.dataset.turnstileToken = ""; },
        "error-callback": () => { form.dataset.turnstileToken = ""; }
      });
      slot.dataset.rendered = "true";
      form.dataset.turnstileWidget = String(widgetId);
    } catch (_) {
      slot.textContent = languageMessages().verify;
    }
  }
  function field(data, ...names) {
    for (const name of names) {
      const value = data.get(name);
      if (value !== null && String(value).trim()) return String(value).trim();
    }
    return "";
  }
  function analytics(name, parameters = {}) {
    window.metatecnoAnalytics?.track?.(name, parameters);
  }
  document.querySelectorAll("[data-contact-form]").forEach((form) => {
    markRequiredFields(form);
    form.dataset.formStartedAt = String(Date.now());
    const phone = form.querySelector("[data-phone-input]");
    const countryStatus = form.querySelector("[data-country-status]");
    const formStatus = form.querySelector("[data-form-status]");
    const updatePhone = () => {
      if (!phone) return true;
      const result = detectPhone(phone.value);
      phone.setCustomValidity(result.valid ? "" : result.message);
      phone.dataset.country = result.country || "";
      if (countryStatus) {
        countryStatus.textContent = phone.value.trim() ? result.message : "Enter an international phone number with country code.";
        countryStatus.style.color = result.valid ? "#0b8f8d" : "#b33";
      }
      return result.valid;
    };
    let startedTracked = false;
    form.addEventListener("input", () => {
      if (startedTracked) return;
      startedTracked = true;
      analytics("form_start", { form_type: "rfq" });
    }, { once: true });
    if (phone) phone.addEventListener("input", updatePhone);
    form.addEventListener("submit", async (event) => {
      const text = languageMessages();
      if (!updatePhone() || !form.checkValidity()) {
        analytics("form_error", { reason_code: "validation" });
        if (formStatus) formStatus.textContent = text.invalid;
        form.reportValidity();
        return;
      }
      const traps = [...form.querySelectorAll("input[name='_honey'], input[name='website_url']")];
      if (traps.some((trap) => trap.value)) {
        analytics("form_error", { reason_code: "honeypot" });
        return;
      }
      const elapsed = Date.now() - Number(form.dataset.formStartedAt || 0);
      if (elapsed < MIN_SUBMIT_MS || elapsed > MAX_SUBMIT_MS || hasSpamSignals(form)) {
        analytics("form_error", { reason_code: "timing_or_content" });
        if (formStatus) formStatus.textContent = text.spam;
        return;
      }
      const countryInput = form.querySelector("[data-detected-country]");
      const pageInput = form.querySelector("[data-submitted-page]");
      if (countryInput) countryInput.value = phone ? phone.dataset.country || "" : "";
      if (pageInput) pageInput.value = location.href;
      const subjectInput = form.querySelector('input[name="_subject"]');
      if (subjectInput) subjectInput.value = "Metatecno website inquiry from " + (new FormData(form).get("Name") || "website visitor");
      if (new URL(form.action, location.href).hostname === "formsubmit.co") {
        if (formStatus) formStatus.textContent = "Validation passed. Sending...";
        analytics("form_submit", { form_type: "rfq" });
        return;
      }
      event.preventDefault();
      const token = form.dataset.turnstileToken || form.querySelector('input[name="cf-turnstile-response"]')?.value || "";
      if (!token) {
        analytics("form_error", { reason_code: "turnstile_missing" });
        if (formStatus) formStatus.textContent = text.verify;
        await mountTurnstile(form);
        return;
      }
      const data = new FormData(form);
      const payload = {
        locale: document.documentElement.lang || "en",
        sourcePath: location.pathname,
        name: field(data, "Name", "name"),
        company: field(data, "Company Name", "Company", "company"),
        email: field(data, "Email", "email"),
        phone: field(data, "Phone", "phone"),
        product: field(data, "Product", "Product / Model", "product", "model"),
        medium: field(data, "Medium", "medium"),
        temperature: field(data, "Temperature", "temperature"),
        pressure: field(data, "Pressure", "pressure"),
        quantity: field(data, "Quantity", "quantity"),
        message: field(data, "Content", "Message", "message"),
        detectedCountry: phone?.dataset.country || "",
        websiteUrl: field(data, "website_url", "_honey"),
        startedAt: Number(form.dataset.formStartedAt || 0),
        turnstileToken: token
      };
      const submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      if (formStatus) formStatus.textContent = text.sending;
      try {
        const response = await fetch(form.dataset.leadEndpoint || "/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.ok !== true || result.deliveryStatus !== "accepted" || !result.leadId) throw new Error(result.error || `http_${response.status}`);
        try {
          sessionStorage.setItem("metatecno_lead_pending_v1", JSON.stringify({
            path: location.pathname,
            language: document.documentElement.lang || "en",
            time: new Date().toISOString(),
            accepted: true,
            leadId: result.leadId
          }));
        } catch (_) {}
        if (formStatus) formStatus.textContent = text.accepted + result.leadId;
        const folder = location.pathname.split("/").filter(Boolean)[0];
        const thankYou = folder && folder !== "products" ? `/${folder}/thank-you/` : "/en/thank-you/";
        location.assign(`${thankYou}?lead=${encodeURIComponent(result.leadId)}`);
      } catch (_) {
        analytics("form_error", { reason_code: "delivery_failed" });
        if (formStatus) formStatus.textContent = text.failed;
        form.dataset.turnstileToken = "";
        if (window.turnstile && form.dataset.turnstileWidget) window.turnstile.reset(form.dataset.turnstileWidget);
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  });
})();
