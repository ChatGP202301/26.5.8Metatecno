#!/usr/bin/env node
import { readFile, readdir, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

const ROOT = process.cwd();
const MODE = process.argv.includes("--write") ? "write" : "check";
const ORIGIN = "https://www.metatecnocq.com";
const SKIP = new Set([".git", "_site", "node_modules", "seo", "tools", "worker", "de"]);
const RTL = new Set(["ar", "fa", "he"]);
const LANG_ATTRIBUTE = { es: "es-419", pt: "pt-BR", ar: "ar", en: "en", fr: "fr", ru: "ru", it: "it" };
async function loadJson(path, fallback) {
  try { return JSON.parse(await readFile(resolve(ROOT, path), "utf8")); }
  catch { return fallback; }
}
const CONTENT_EVIDENCE = await loadJson("seo/content-evidence.json", { pages: [] });
const INDEXING_DECISIONS = await loadJson("seo/indexing-decisions.generated.json", { status: "blocked", decisions: [] });
const CONTENT_STATUS_BY_PATH = new Map((CONTENT_EVIDENCE.pages || []).map((page) => [page.path, page.status]));
const INDEXING_DECISION_BY_PATH = new Map(
  INDEXING_DECISIONS.status === "ready"
    ? (INDEXING_DECISIONS.decisions || []).map((decision) => [decision.path, decision.action])
    : []
);
const GOVERNED_ACTION_BY_PATH = new Map(INDEXING_DECISION_BY_PATH);
for (const [path, status] of CONTENT_STATUS_BY_PATH) GOVERNED_ACTION_BY_PATH.set(path, status === "approved" ? "preserve" : "noindex_follow");
const SKIP_LABEL = {
  en: "Skip to main content", es: "Saltar al contenido principal", pt: "Ir para o conteúdo principal",
  fr: "Aller au contenu principal", ru: "Перейти к основному содержанию", ar: "الانتقال إلى المحتوى الرئيسي",
  it: "Vai al contenuto principale"
};
const PRODUCT_DISCLAIMER = {
  en: "Model and brand names identify compatibility requirements only. Metatecno is an independent manufacturer and does not claim affiliation with or authorization from the original equipment manufacturer unless expressly documented.",
  es: "Los nombres de modelos y marcas se utilizan únicamente para identificar requisitos de compatibilidad. Metatecno es un fabricante independiente y no afirma afiliación ni autorización del fabricante original salvo que se documente expresamente.",
  pt: "Nomes de modelos e marcas identificam apenas requisitos de compatibilidade. A Metatecno é um fabricante independente e não declara afiliação ou autorização do fabricante original, salvo quando expressamente documentado.",
  fr: "Les noms de modèles et de marques servent uniquement à identifier les exigences de compatibilité. Metatecno est un fabricant indépendant et ne revendique aucune affiliation ni autorisation du fabricant d'origine, sauf preuve expresse.",
  ru: "Названия моделей и марок используются только для описания требований совместимости. Metatecno — независимый производитель и не заявляет о связи или авторизации со стороны OEM без прямого документального подтверждения.",
  ar: "تُستخدم أسماء الطرازات والعلامات لتحديد متطلبات التوافق فقط. Metatecno شركة مصنّعة مستقلة ولا تدّعي الانتساب إلى المصنّع الأصلي أو الحصول على تفويض منه ما لم يُوثق ذلك صراحة.",
  it: "I nomi di modelli e marchi identificano esclusivamente requisiti di compatibilità. Metatecno è un produttore indipendente e non dichiara affiliazione o autorizzazione del produttore originale salvo espressa documentazione."
};
const PRIVACY_DETAILS = {
  en: { h: "How we handle inquiry and analytics data", controller: "Controller and contact", controllerText: "Metatecno is responsible for the website inquiry data described here. Privacy requests can be sent to info@metatecnocq.com.", purpose: "Data, purposes and legal grounds", purposeText: "We use the name, company, business contact details, requested product, operating conditions and message you submit to review the request, prepare a quotation, prevent abuse and keep business correspondence. The grounds are steps requested before a contract, legitimate interests in responding to business inquiries and securing the service, and legal obligations where applicable. Optional analytics relies on consent.", processors: "Processors and international transfers", processorsText: "Cloudflare provides security, form processing, delivery metadata and email sending; Google provides Gmail delivery and consent-based Analytics. These providers may process data outside your country under their contractual and legal transfer safeguards.", retention: "Retention and disclosure", retentionText: "Operational delivery metadata excludes form content and is deleted after 90 days. Inquiry emails are normally retained for up to 24 months, or longer when they become part of a customer record or a legal obligation applies. We do not sell personal data.", rights: "Your choices and rights", rightsText: "Depending on applicable law, you may request access, correction, deletion, restriction or objection, and may withdraw analytics consent at any time through Cookie settings. You may also complain to the competent data protection authority." },
  es: { h: "Cómo tratamos los datos de consultas y analítica", controller: "Responsable y contacto", controllerText: "Metatecno es responsable de los datos de consultas del sitio descritos aquí. Las solicitudes de privacidad pueden enviarse a info@metatecnocq.com.", purpose: "Datos, fines y bases jurídicas", purposeText: "Usamos nombre, empresa, datos profesionales de contacto, producto solicitado, condiciones operativas y mensaje para revisar la solicitud, preparar una cotización, evitar abusos y conservar la correspondencia comercial. Las bases son las medidas precontractuales solicitadas, el interés legítimo en responder y proteger el servicio, y las obligaciones legales aplicables. La analítica opcional se basa en el consentimiento.", processors: "Encargados y transferencias internacionales", processorsText: "Cloudflare presta seguridad, tratamiento del formulario, metadatos de entrega y envío de correo; Google presta Gmail y Analytics con consentimiento. Estos proveedores pueden tratar datos fuera de su país conforme a sus garantías contractuales y legales.", retention: "Conservación y comunicación", retentionText: "Los metadatos operativos no contienen el formulario y se eliminan a los 90 días. Los correos de consulta se conservan normalmente hasta 24 meses, o más si forman parte de un registro de cliente o existe obligación legal. No vendemos datos personales.", rights: "Sus opciones y derechos", rightsText: "Según la ley aplicable, puede solicitar acceso, rectificación, supresión, limitación u oposición y retirar el consentimiento de Analytics desde la configuración de cookies. También puede reclamar ante la autoridad competente." },
  pt: { h: "Como tratamos dados de consultas e análise", controller: "Controlador e contato", controllerText: "A Metatecno é responsável pelos dados de consultas do site descritos aqui. Solicitações de privacidade podem ser enviadas para info@metatecnocq.com.", purpose: "Dados, finalidades e bases legais", purposeText: "Usamos nome, empresa, contatos profissionais, produto solicitado, condições operacionais e mensagem para analisar a solicitação, preparar cotação, prevenir abuso e manter correspondência comercial. As bases são medidas pré-contratuais solicitadas, interesses legítimos em responder e proteger o serviço e obrigações legais aplicáveis. A análise opcional depende de consentimento.", processors: "Operadores e transferências internacionais", processorsText: "A Cloudflare fornece segurança, processamento do formulário, metadados de entrega e envio de e-mail; o Google fornece Gmail e Analytics consentido. Esses provedores podem processar dados fora do seu país conforme salvaguardas contratuais e legais.", retention: "Retenção e compartilhamento", retentionText: "Metadados operacionais não incluem o conteúdo do formulário e são excluídos após 90 dias. E-mails de consulta são normalmente mantidos por até 24 meses, ou mais quando integram um registro de cliente ou há obrigação legal. Não vendemos dados pessoais.", rights: "Suas escolhas e direitos", rightsText: "Conforme a lei aplicável, você pode solicitar acesso, correção, exclusão, restrição ou oposição e retirar o consentimento de Analytics nas configurações de cookies. Também pode reclamar à autoridade competente." },
  fr: { h: "Traitement des demandes et des données d'analyse", controller: "Responsable et contact", controllerText: "Metatecno est responsable des données de demande décrites ici. Les demandes relatives à la vie privée peuvent être envoyées à info@metatecnocq.com.", purpose: "Données, finalités et bases juridiques", purposeText: "Nous utilisons le nom, la société, les coordonnées professionnelles, le produit demandé, les conditions de service et le message pour étudier la demande, préparer un devis, prévenir les abus et conserver la correspondance commerciale. Les bases sont les mesures précontractuelles demandées, l'intérêt légitime à répondre et sécuriser le service, ainsi que les obligations légales. L'analyse optionnelle repose sur le consentement.", processors: "Sous-traitants et transferts internationaux", processorsText: "Cloudflare fournit la sécurité, le traitement du formulaire, les métadonnées de livraison et l'envoi d'e-mails ; Google fournit Gmail et Analytics avec consentement. Ces fournisseurs peuvent traiter des données hors de votre pays selon leurs garanties contractuelles et légales.", retention: "Conservation et communication", retentionText: "Les métadonnées opérationnelles excluent le contenu du formulaire et sont supprimées après 90 jours. Les e-mails de demande sont normalement conservés jusqu'à 24 mois, ou plus s'ils intègrent un dossier client ou si la loi l'exige. Nous ne vendons pas de données personnelles.", rights: "Vos choix et droits", rightsText: "Selon la loi applicable, vous pouvez demander l'accès, la rectification, l'effacement, la limitation ou l'opposition et retirer le consentement Analytics via les paramètres des cookies. Vous pouvez aussi saisir l'autorité compétente." },
  ru: { h: "Обработка данных запросов и аналитики", controller: "Оператор и контакт", controllerText: "Metatecno отвечает за описанные здесь данные запросов. Запросы о конфиденциальности можно направить на info@metatecnocq.com.", purpose: "Данные, цели и основания", purposeText: "Мы используем имя, компанию, деловые контакты, продукт, условия эксплуатации и сообщение для анализа запроса, подготовки предложения, защиты от злоупотреблений и деловой переписки. Основания: преддоговорные меры, законные интересы и обязанности. Аналитика основана на согласии.", processors: "Обработчики и международная передача", processorsText: "Cloudflare обеспечивает защиту, обработку формы, метаданны доставки и отправку писем; Google — Gmail и Analytics после согласия. Они могут обрабатывать данны за пределами вашей страны с применением договорных и правовых гарантий.", retention: "Сроки и раскрытие", retentionText: "Технические метаданны не содержат текст формы и удаляются через 90 дней. Письма с запросами обычно хранятся до 24 месяцев или дольше, если они становятся частью клиентского досье или этого требует закон. Мы не продаем персональные данные.", rights: "Ваш выбор и права", rightsText: "В зависимости от закона вы можете запросить доступ, исправление, удаление, ограничение или возразить против обработки, а также отозвать согласие Analytics в настройках cookie. Вы также можете обратиться в компетентный орган." },
  it: { h: "Trattamento dei dati delle richieste e di analisi", controller: "Titolare e contatto", controllerText: "Metatecno è responsabile dei dati delle richieste descritti qui. Le richieste privacy possono essere inviate a info@metatecnocq.com.", purpose: "Dati, finalità e basi giuridiche", purposeText: "Utilizziamo nome, azienda, contatti professionali, prodotto richiesto, condizioni operative e messaggio per esaminare la richiesta, preparare un'offerta, prevenire abusi e conservare la corrispondenza commerciale. Le basi sono misure precontrattuali richieste, legittimi interessi nel rispondere e proteggere il servizio e obblighi di legge. L'analisi facoltativa si basa sul consenso.", processors: "Responsabili e trasferimenti internazionali", processorsText: "Cloudflare fornisce sicurezza, gestione del modulo, metadati di consegna e invio e-mail; Google fornisce Gmail e Analytics con consenso. Tali fornitori possono trattare dati fuori dal suo Paese con garanzie contrattuali e legali.", retention: "Conservazione e comunicazione", retentionText: "I metadati operativi non includono il contenuto del modulo e vengono eliminati dopo 90 giorni. Le e-mail di richiesta sono normalmente conservate fino a 24 mesi, o più a lungo se entrano nel fascicolo cliente o lo richiede la legge. Non vendiamo dati personali.", rights: "Scelte e diritti", rightsText: "Secondo la legge applicabile, può chiedere accesso, rettifica, cancellazione, limitazione od opposizione e revocare il consenso Analytics tramite le impostazioni cookie. Può inoltre rivolgersi all'autorità competente." }
};
const TERMS_DETAILS = {
  en: { h: "Website and quotation terms", p1: "Website content is general information and does not replace the drawing, material specification, inspection scope, quotation or signed order applicable to a product.", p2: "A quotation becomes binding only under its stated validity, scope, price, delivery and acceptance terms. Customers remain responsible for supplying accurate equipment, medium and operating-condition information and for approving final drawings and specifications.", p3: "Third-party model and brand names identify compatibility requirements only. They do not imply affiliation, endorsement or OEM authorization unless expressly documented." },
  es: { h: "Condiciones del sitio y de las cotizaciones", p1: "El contenido del sitio es información general y no sustituye el plano, especificación de material, alcance de inspección, cotización o pedido firmado aplicable al producto.", p2: "Una cotización solo es vinculante conforme a su vigencia, alcance, precio, entrega y aceptación. El cliente debe facilitar datos exactos del equipo, medio y condiciones operativas y aprobar planos y especificaciones finales.", p3: "Los nombres de modelos y marcas de terceros solo identifican compatibilidad y no implican afiliación, respaldo o autorización OEM salvo documento expreso." },
  pt: { h: "Termos do site e da cotação", p1: "O conteúdo do site é informativo e não substitui desenho, especificação de material, escopo de inspeção, cotação ou pedido assinado aplicável ao produto.", p2: "A cotação só é vinculante segundo sua validade, escopo, preço, entrega e aceitação. O cliente deve fornecer dados corretos do equipamento, meio e condições operacionais e aprovar desenhos e especificações finais.", p3: "Nomes de modelos e marcas de terceiros apenas identificam compatibilidade e não implicam afiliação, endosso ou autorização OEM sem documento expresso." },
  fr: { h: "Conditions du site et des devis", p1: "Le contenu du site est une information générale et ne remplace pas le plan, la spécification matière, le périmètre d'inspection, le devis ou la commande signée applicable au produit.", p2: "Un devis n'est contraignant que selon sa validité, son périmètre, son prix, sa livraison et son acceptation. Le client doit fournir des données exactes sur l'équipement, le fluide et les conditions de service et approuver les plans et spécifications finaux.", p3: "Les noms de modèles et marques de tiers indiquent seulement la compatibilité et n'impliquent ni affiliation, ni approbation, ni autorisation OEM sans document exprès." },
  ru: { h: "Условия сайта и коммерческих предложений", p1: "Материалы сайта носят общий характер и не заменяют чертеж, спецификацию материала, объем контроля, предложение или подписанный заказ.", p2: "Предложение обязательно только в пределах указанных срока, объема, цены, поставки и приемки. Клиент должен предоставить точные данные оборудования и условий и утвердить финальные чертежи и спецификации.", p3: "Модели и марки третьих лиц указывают только на совместимость и не означают связь, одобрение или OEM-авторизацию без прямого документа." },
  it: { h: "Condizioni del sito e delle offerte", p1: "Il contenuto del sito è informativo e non sostituisce disegno, specifica del materiale, piano di controllo, offerta o ordine firmato applicabile al prodotto.", p2: "L'offerta è vincolante solo secondo validità, ambito, prezzo, consegna e accettazione indicati. Il cliente deve fornire dati accurati su apparecchiatura, fluido e condizioni operative e approvare disegni e specifiche finali.", p3: "Nomi di modelli e marchi di terzi indicano solo compatibilità e non implicano affiliazione, approvazione o autorizzazione OEM senza espressa documentazione." }
};

async function htmlFiles(directory) {
  const files = [];
  async function visit(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith("audit-") || SKIP.has(entry.name) || entry.isSymbolicLink()) continue;
      const path = resolve(current, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html") && entry.name !== "404.html") files.push(path);
    }
  }
  await visit(directory);
  return files.sort();
}

function labelFor(file) { return relative(ROOT, file).split(sep).join("/"); }
function routeFor(label) { return label === "index.html" ? "/" : `/${label.slice(0, -"index.html".length)}`; }
function folderLocale(label) { return label === "index.html" ? "en" : label.split("/")[0]; }
function canonicalFrom(html, route) {
  return html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] || `${ORIGIN}${route}`;
}
function textFrom(html, regex) { return (html.match(regex)?.[1] || "").replace(/\s+/g, " ").trim(); }
function escapeAttribute(value) { return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
function governanceRobots(route) {
  const contentStatus = CONTENT_STATUS_BY_PATH.get(route);
  const indexingAction = INDEXING_DECISION_BY_PATH.get(route);
  if (contentStatus && contentStatus !== "approved") return "noindex,follow";
  if (indexingAction === "noindex_follow") return "noindex,follow";
  if (contentStatus === "approved" || indexingAction === "preserve") return "index,follow";
  return null;
}

function hreflangGroup(route) {
  if (route === "/") return "/";
  const parts = route.split("/").filter(Boolean);
  return parts.length <= 1 ? "/" : `/${parts.slice(1).join("/")}/`;
}

function hreflangForPath(path) {
  if (path === "/") return "en";
  const locale = path.split("/").filter(Boolean)[0];
  if (locale === "es") return "es-419";
  if (locale === "pt") return "pt-BR";
  if (locale === "ko-kp") return "ko-KP";
  return locale;
}

function reconcileGovernedHreflang(html, route) {
  html = html.replace(/\s*<link\s+rel=["']alternate["'][^>]*\shref=["']([^"']+)["'][^>]*>/gi, (tag, href) => {
    let path;
    try {
      const url = new URL(href, ORIGIN);
      if (url.origin !== ORIGIN) return tag;
      path = url.pathname;
    } catch { return tag; }
    return governanceRobots(path) === "noindex,follow" ? "" : tag;
  });
  if (governanceRobots(route) === "noindex,follow") return html;
  const group = hreflangGroup(route);
  const additions = [];
  for (const [targetPath, action] of GOVERNED_ACTION_BY_PATH) {
    if (action !== "preserve" || hreflangGroup(targetPath) !== group) continue;
    const hreflang = hreflangForPath(targetPath);
    const href = `${ORIGIN}${targetPath}`;
    const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`hreflang=["']${hreflang}["'][^>]*href=["']${escapedHref}["']`, "i").test(html)) {
      additions.push(`  <link rel="alternate" hreflang="${hreflang}" href="${href}">`);
    }
    if (hreflang === "en" && !/hreflang=["']x-default["']/i.test(html)) {
      additions.push(`  <link rel="alternate" hreflang="x-default" href="${href}">`);
    }
  }
  if (additions.length) html = html.replace(/\s*<\/head>/i, `\n${additions.join("\n")}\n</head>`);
  return html;
}

function normalizeInternalIndexLinks(html, route) {
  html = html.replace(/(<a\b[^>]*\shref\s*=\s*["'])(?:\.\/)?index\.html((?:[?#][^"']*)?)(["'][^>]*>)/gi, `$1${route}$2$3`);
  html = html.replace(/(<a\b[^>]*\shref\s*=\s*["'])([^"']*\/index\.html(?:[?#][^"']*)?)(["'][^>]*>)/gi, (all, start, href, end) => {
    let target;
    try { target = new URL(href, ORIGIN); } catch { return all; }
    if (target.origin !== ORIGIN || !target.pathname.endsWith("/index.html")) return all;
    return `${start}${target.pathname.slice(0, -"index.html".length)}${target.search}${target.hash}${end}`;
  });
  html = html.replace(/(<a\b[^>]*\shref\s*=\s*["'])\/en\/(["'][^>]*>)/gi, "$1/$2");
  html = html.replace(/\s*<a\b[^>]*\shref=["']\/de(?:\/[^"']*)?["'][^>]*>[\s\S]*?<\/a>/gi, "");
  return html;
}

function normalizeLocaleNavigation(html, label) {
  const locale = folderLocale(label);
  for (const section of ["about", "products", "electrolyzer-cells", "technology", "contact"]) {
    html = html.replace(
      new RegExp(`(<a\\b[^>]*\\shref\\s*=\\s*["'])/${section}/(["'][^>]*>)`, "gi"),
      `$1/${locale}/${section}/$2`
    );
  }
  return html;
}

function normalizeForms(html) {
  html = html.replace(/\sdata-email=["'][^"']*["']/gi, "");
  html = html.replace(/\sdata-lead-endpoint=["'][^"']*["']/gi, "");
  html = html.replace(/action=["']https:\/\/formsubmit\.co\/[^"']+["']/gi, 'action="/api/lead"');
  html = html.replace(/action=["']\/api\/lead["']/gi, 'action="/api/lead" data-lead-endpoint="/api/lead"');
  html = html.replace(/<input\b[^>]*\bname=["']_(?:subject|captcha|template|next|autoresponse)["'][^>]*>\s*/gi, "");
  html = html.replaceAll("expresswater025@gmail.com", "info@metatecnocq.com");
  html = html.replace(/(<form\b[^>]*data-contact-form[^>]*>)(?![\s\S]*?data-form-started)/gi, "$1");
  html = html.replace(/(<form\b[^>]*data-contact-form[\s\S]*?)(<button\b[^>]*type=["']submit["'])/gi, (all, before, button) => {
    if (before.includes("data-turnstile-container")) return all;
    return `${before}<div class="turnstile-slot" data-turnstile-container aria-live="polite"></div>\n  ${button}`;
  });
  return html;
}

function normalizeHead(html, label, route) {
  const locale = folderLocale(label);
  const documentLanguage = LANG_ATTRIBUTE[locale] || locale;
  const direction = RTL.has(locale) ? "rtl" : "ltr";
  html = html.replace(/<html\b[^>]*>/i, `<html lang="${documentLanguage}" dir="${direction}">`);
  html = html.replace(/hreflang=["']es["']/gi, 'hreflang="es-419"');
  html = html.replace(/hreflang=["']pt["']/gi, 'hreflang="pt-BR"');
  html = html.replace(/\s*<link\s+rel=["']alternate["']\s+hreflang=["']de["'][^>]*>/gi, "");
  html = reconcileGovernedHreflang(html, route);

  if (label === "index.html" || /^[^/]+\/index\.html$/.test(label)) {
    html = html.replace(/(<link\s+rel=["']alternate["']\s+hreflang=["']en["']\s+href=["'])[^"']+(["'])/i, `$1${ORIGIN}/$2`);
    html = html.replace(/(<link\s+rel=["']alternate["']\s+hreflang=["']x-default["']\s+href=["'])[^"']+(["'])/i, `$1${ORIGIN}/$2`);
  }
  if (label === "en/index.html") {
    html = html.replace(/(<link\s+rel=["']canonical["']\s+href=["'])[^"']+(["'])/i, `$1${ORIGIN}/$2`);
    html = html.replace(/<meta\s+name=["']robots["']\s+content=["'][^"']*["']>/i, '<meta name="robots" content="noindex,follow">');
  }
  const governedRobots = governanceRobots(route);
  if (governedRobots) {
    if (/<meta\s+name=["']robots["']/i.test(html)) {
      html = html.replace(/<meta\s+name=["']robots["']\s+content=["'][^"']*["']>/i, `<meta name="robots" content="${governedRobots}">`);
    } else {
      html = html.replace(/(<meta\s+name=["']description["'][^>]*>)/i, `$1\n  <meta name="robots" content="${governedRobots}">`);
    }
  }

  const canonical = canonicalFrom(html, route);
  const title = textFrom(html, /<title>([\s\S]*?)<\/title>/i);
  const description = textFrom(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  const mediaSrc = html.match(/<img\b[^>]*\bsrc=["']([^"']*assets\/media\/[^"']+)["']/i)?.[1];
  let imageUrl = `${ORIGIN}/assets/metatecno-logo.webp`;
  if (mediaSrc) {
    try { imageUrl = new URL(mediaSrc, canonical).href; } catch { /* use logo */ }
  }

  html = html.replace(/\s*<meta\b[^>]*(?:property=["']og:[^"']+["']|name=["']twitter:[^"']+["'])[^>]*>/gi, "");
  html = html.replace(/\s*<meta\s+name=["']metatecno-(?:turnstile-sitekey|ga4-id)["'][^>]*>/gi, "");
  html = html.replace(/\s*<link\s+rel=["']stylesheet["']\s+href=["'][^"']*assets\/quality\.css["'][^>]*>/gi, "");
  const social = `
  <meta name="metatecno-turnstile-sitekey" content="__TURNSTILE_SITE_KEY__">
  <meta name="metatecno-ga4-id" content="__GA4_MEASUREMENT_ID__">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Metatecno">
  <meta property="og:title" content="${escapeAttribute(title)}">
  <meta property="og:description" content="${escapeAttribute(description)}">
  <meta property="og:url" content="${escapeAttribute(canonical)}">
  <meta property="og:image" content="${escapeAttribute(imageUrl)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttribute(title)}">
  <meta name="twitter:description" content="${escapeAttribute(description)}">
  <meta name="twitter:image" content="${escapeAttribute(imageUrl)}">`;
  return html.replace(/\s*<\/head>/i, `${social}\n  <link rel="stylesheet" href="/assets/quality.css">\n</head>`);
}

function normalizeAccessibility(html, label) {
  const locale = folderLocale(label);
  const skipLabel = SKIP_LABEL[locale] || SKIP_LABEL.en;
  html = html.replace(/<body\b([^>]*)>/i, (tag, attributes) => {
    let next = attributes;
    if (RTL.has(locale) && !/class=["'][^"']*rtl-page/i.test(next)) {
      next = /class=["']([^"']*)["']/i.test(next)
        ? next.replace(/class=["']([^"']*)["']/i, (_all, classes) => `class="${classes} rtl-page"`)
        : `${next} class="rtl-page"`;
    }
    return `<body${next}>`;
  });
  if (!html.includes('class="skip-link"')) html = html.replace(/(<body\b[^>]*>)/i, `$1\n<a class="skip-link" href="#main-content">${skipLabel}</a>`);
  html = html.replace(/<main(?![^>]*\bid=)([^>]*)>/i, '<main id="main-content"$1>');
  return html;
}

function normalizeFooter(html, label) {
  const locale = folderLocale(label);
  const base = locale === "en" ? "/en" : `/${locale}`;
  return html.replace(/(<footer\b[\s\S]*?<nav\b[^>]*>)([\s\S]*?)(<\/nav>)/i, (all, start, nav, end) => {
    const items = [...nav.matchAll(/<(a|span)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => match[2].trim());
    const privacyText = items[0] || "Privacy Policy";
    const termsText = items[1] || "Terms of Service";
    const sitemapText = items[2] || "Sitemap";
    const trustHref = ["en", "es", "pt", "fr", "ru", "it", "ar"].includes(locale) ? `${base}/trust/` : "/en/trust/";
    const trustText = items[3] || "Technical assurance";
    const updated = `\n    <a href="${base}/privacy-policy/">${privacyText}</a>\n    <a href="${base}/terms-of-service/">${termsText}</a>\n    <a href="${base}/sitemap/">${sitemapText}</a>\n    <a href="${trustHref}">${trustText}</a>\n  `;
    return `${start}${updated}${end}`;
  });
}

function normalizeProductDisclaimer(html, label, route) {
  if (!/\/products\/[^/]+\/$/.test(route) || html.includes("data-compatibility-disclaimer")) return html;
  const locale = folderLocale(label);
  const disclaimer = PRODUCT_DISCLAIMER[locale] || PRODUCT_DISCLAIMER.en;
  const section = `\n<section class="section rich-text compatibility-disclaimer" data-compatibility-disclaimer><h2>Compatibility and trademark notice</h2><p>${disclaimer}</p></section>\n`;
  return html.replace(/\s*<\/main>/i, `${section}</main>`);
}

function normalizePriorityPrivacy(html, label, route) {
  if (!/\/privacy-policy\/$/.test(route) || html.includes("data-complete-privacy-notice")) return html;
  const locale = folderLocale(label);
  const copy = PRIVACY_DETAILS[locale];
  if (!copy) return html;
  html = html.replace(/\s*This notice describes the intended configuration and is not a guarantee of legal compliance in every jurisdiction\./i, "");
  html = html.replace(/\s*Esta información describe la configuración prevista y no garantiza el cumplimiento legal en todas las jurisdicciones\./i, "");
  html = html.replace(/\s*Cette notice décrit la configuration prévue et ne garantit pas la conformité juridique dans chaque juridiction\./i, "");
  html = html.replace(/\s*Это уведомление описывает планируемую конфигурацию и не является гарантией юридического соответствия во всех юрисдикциях\./i, "");
  html = html.replace(/\s*Questa informativa descrive la configurazione prevista e non garantisce la conformità legale in ogni giurisdizione\./i, "");
  const section = `<section class="section rich-text" data-complete-privacy-notice><h2>${copy.h}</h2><h3>${copy.controller}</h3><p>${copy.controllerText}</p><h3>${copy.purpose}</h3><p>${copy.purposeText}</p><h3>${copy.processors}</h3><p>${copy.processorsText}</p><h3>${copy.retention}</h3><p>${copy.retentionText}</p><h3>${copy.rights}</h3><p>${copy.rightsText}</p><p><small>Last updated: 14 August 2026.</small></p></section>`;
  return html.replace(/\s*<\/main>/i, `${section}</main>`);
}

function normalizePriorityTerms(html, label, route) {
  if (!/\/terms-of-service\/$/.test(route) || html.includes("data-complete-terms")) return html;
  const copy = TERMS_DETAILS[folderLocale(label)];
  if (!copy) return html;
  const section = `<section class="section rich-text" data-complete-terms><h2>${copy.h}</h2><p>${copy.p1}</p><p>${copy.p2}</p><p>${copy.p3}</p><p><small>Last updated: 14 August 2026.</small></p></section>`;
  return html.replace(/\s*<\/main>/i, `${section}</main>`);
}

function normalizeScripts(html) {
  html = html.replace(/\s*<script\s+src=["'][^"']*assets\/analytics\.js["'][^>]*><\/script>/gi, "");
  html = html.replace(/\s*<script\s+src=["'][^"']*assets\/navigation\.js["'][^>]*><\/script>/gi, "");
  return html.replace(/\s*<\/body>/i, '\n<script src="/assets/navigation.js" defer></script>\n<script src="/assets/analytics.js" defer></script>\n</body>');
}

async function main() {
  const files = await htmlFiles(ROOT);
  let changed = 0;
  const examples = [];
  for (const file of files) {
    const label = labelFor(file);
    const route = routeFor(label);
    const original = await readFile(file, "utf8");
    let html = normalizeInternalIndexLinks(original, route);
    html = normalizeLocaleNavigation(html, label);
    html = normalizeForms(html);
    html = normalizeHead(html, label, route);
    html = normalizeAccessibility(html, label);
    html = normalizeFooter(html, label);
    html = normalizeProductDisclaimer(html, label, route);
    html = normalizePriorityPrivacy(html, label, route);
    html = normalizePriorityTerms(html, label, route);
    html = normalizeScripts(html);
    if (html !== original) {
      changed += 1;
      if (examples.length < 25) examples.push(label);
      if (MODE === "write") await writeFile(file, html, "utf8");
    }
  }
  console.log(`mode=${MODE} html_files=${files.length} changed_files=${changed}`);
  if (examples.length) console.log(`examples=${examples.join(",")}`);
  if (MODE === "check" && changed) process.exit(1);
}

main().catch((error) => { console.error(error); process.exit(1); });
