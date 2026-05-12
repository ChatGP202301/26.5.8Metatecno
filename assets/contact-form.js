(() => {
  const dial = {
    "1":["US",10,10,"United States / Canada"],"7":["RU",10,10,"Russia / Kazakhstan"],"20":["EG",8,10],"27":["ZA",9,9],"30":["GR",10,10],"31":["NL",9,9],"32":["BE",8,9],"33":["FR",9,9],"34":["ES",9,9],"36":["HU",8,9],"39":["IT",6,11],"40":["RO",9,9],"41":["CH",9,9],"43":["AT",10,13],"44":["GB",10,10],"45":["DK",8,8],"46":["SE",7,13],"47":["NO",8,8],"48":["PL",9,9],"49":["DE",7,12],"51":["PE",8,9],"52":["MX",10,10],"53":["CU",6,8],"54":["AR",10,10],"55":["BR",10,11],"56":["CL",8,9],"57":["CO",10,10],"58":["VE",10,10],"60":["MY",8,10],"61":["AU",9,9],"62":["ID",8,12],"63":["PH",10,10],"64":["NZ",8,10],"65":["SG",8,8],"66":["TH",8,9],"81":["JP",9,10],"82":["KR",9,10],"84":["VN",9,10],"86":["CN",11,11],"90":["TR",10,10],"91":["IN",10,10],"92":["PK",10,10],"93":["AF",9,9],"94":["LK",9,9],"95":["MM",7,11],"98":["IR",10,10],"212":["MA",9,9],"213":["DZ",8,9],"216":["TN",8,8],"218":["LY",8,9],"220":["GM",7,7],"221":["SN",9,9],"222":["MR",8,8],"223":["ML",8,8],"224":["GN",9,9],"225":["CI",8,10],"226":["BF",8,8],"227":["NE",8,8],"228":["TG",8,8],"229":["BJ",8,8],"230":["MU",7,8],"231":["LR",7,8],"232":["SL",8,8],"233":["GH",9,9],"234":["NG",7,10],"235":["TD",8,8],"236":["CF",8,8],"237":["CM",8,9],"238":["CV",7,7],"239":["ST",7,7],"240":["GQ",9,9],"241":["GA",7,8],"242":["CG",9,9],"243":["CD",9,9],"244":["AO",9,9],"245":["GW",7,7],"248":["SC",7,7],"249":["SD",9,9],"250":["RW",9,9],"251":["ET",9,9],"252":["SO",8,9],"253":["DJ",8,8],"254":["KE",9,9],"255":["TZ",9,9],"256":["UG",9,9],"257":["BI",8,8],"258":["MZ",8,9],"260":["ZM",9,9],"261":["MG",9,9],"263":["ZW",9,9],"264":["NA",9,9],"265":["MW",9,9],"266":["LS",8,8],"267":["BW",7,8],"268":["SZ",8,8],"269":["KM",7,7],"290":["SH",4,4],"291":["ER",7,7],"297":["AW",7,7],"298":["FO",6,6],"299":["GL",6,6],"350":["GI",8,8],"351":["PT",9,9],"352":["LU",6,11],"353":["IE",7,10],"354":["IS",7,7],"355":["AL",8,9],"356":["MT",8,8],"357":["CY",8,8],"358":["FI",5,12],"359":["BG",8,9],"370":["LT",8,8],"371":["LV",8,8],"372":["EE",7,8],"373":["MD",8,8],"374":["AM",8,8],"375":["BY",9,9],"376":["AD",6,6],"377":["MC",5,9],"378":["SM",6,10],"380":["UA",9,9],"381":["RS",8,9],"382":["ME",8,9],"383":["XK",8,9],"385":["HR",8,9],"386":["SI",8,8],"387":["BA",8,8],"389":["MK",8,8],"420":["CZ",9,9],"421":["SK",9,9],"423":["LI",7,9],"852":["HK",8,8],"853":["MO",8,8],"855":["KH",8,9],"856":["LA",8,10],"880":["BD",10,10],"886":["TW",8,9],"960":["MV",7,7],"961":["LB",7,8],"962":["JO",8,9],"963":["SY",8,9],"964":["IQ",8,10],"965":["KW",8,8],"966":["SA",9,9],"967":["YE",8,9],"968":["OM",8,8],"970":["PS",8,9],"971":["AE",9,9],"972":["IL",8,9],"973":["BH",8,8],"974":["QA",8,8],"975":["BT",7,8],"976":["MN",8,8],"977":["NP",10,10],"992":["TJ",9,9],"993":["TM",8,8],"994":["AZ",9,9],"995":["GE",9,9],"996":["KG",9,9],"998":["UZ",9,9]
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
  document.querySelectorAll("[data-contact-form]").forEach((form) => {
    const phone = form.querySelector("[data-phone-input]");
    const countryStatus = form.querySelector("[data-country-status]");
    const formStatus = form.querySelector("[data-form-status]");
    const updatePhone = () => {
      const result = detectPhone(phone.value);
      phone.setCustomValidity(result.valid ? "" : result.message);
      countryStatus.textContent = phone.value.trim() ? result.message : "Enter an international phone number with country code.";
      countryStatus.style.color = result.valid ? "#0b8f8d" : "#b33";
      return result.valid;
    };
    phone.addEventListener("input", updatePhone);
    form.addEventListener("submit", (event) => {
      if (!updatePhone() || !form.checkValidity()) {
        event.preventDefault();
        form.reportValidity();
        return;
      }
      const subjectInput = form.querySelector("input[name='_subject']");
      if (subjectInput) subjectInput.value = "Metatecno website inquiry from " + (new FormData(form).get("Name") || "website visitor");
      formStatus.textContent = "Validation passed. Sending...";
    });
  });
})();