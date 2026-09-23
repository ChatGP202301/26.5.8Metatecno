#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = process.cwd();
const ORIGIN = "https://www.metatecnocq.com";
const trust = {
  en: { title: "Technical Assurance and Quotation Evidence", intro: "A practical evidence checklist for electrolyzer gasket, cell repair and fluoroplastic sealing quotations.", h1: "Technical assurance before quotation", body: ["Metatecno reviews the sealing position, drawing or sample, equipment model, medium, temperature, pressure and quantity before confirming a proposal.", "Dimensions, tolerances, material grade, inspection documents and test scope are confirmed for the specific order. Published model names describe compatibility only and do not imply OEM authorization.", "Ask the sales engineer for the documents applicable to your order. Do not rely on a general web page as the final engineering specification."] },
  es: { title: "Garantía técnica y evidencia para cotización", intro: "Lista de evidencias para juntas de electrolizadores, reparación de celdas y sellado fluoroplástico.", h1: "Garantía técnica antes de cotizar", body: ["Metatecno revisa la posición de sellado, el plano o muestra, el modelo del equipo, el medio, la temperatura, la presión y la cantidad antes de confirmar una propuesta.", "Las dimensiones, tolerancias, grado del material, documentos de inspección y alcance de pruebas se confirman para cada pedido.", "Solicite al ingeniero comercial los documentos aplicables. Una página web general no sustituye la especificación final de ingeniería."] },
  pt: { title: "Garantia técnica e evidências para cotação", intro: "Lista de evidências para juntas de eletrolisadores, reparo de células e vedação fluoroplástica.", h1: "Garantia técnica antes da cotação", body: ["A Metatecno analisa a posição de vedação, desenho ou amostra, modelo do equipamento, meio, temperatura, pressão e quantidade antes de confirmar uma proposta.", "Dimensões, tolerâncias, classe do material, documentos de inspeção e escopo de testes são confirmados para cada pedido.", "Solicite ao engenheiro comercial os documentos aplicáveis. Uma página geral do site não substitui a especificação final de engenharia."] },
  fr: { title: "Assurance technique et preuves de devis", intro: "Liste de preuves pour joints d'électrolyseurs, réparation de cellules et étanchéité fluoroplastique.", h1: "Assurance technique avant devis", body: ["Metatecno examine la position d'étanchéité, le plan ou l'échantillon, le modèle d'équipement, le fluide, la température, la pression et la quantité avant de confirmer une proposition.", "Les dimensions, tolérances, qualités de matériaux, documents d'inspection et essais sont confirmés pour chaque commande.", "Demandez à l'ingénieur commercial les documents applicables. Une page web générale ne remplace pas la spécification d'ingénierie finale."] },
  ru: { title: "Техническое подтверждение для коммерческого предложения", intro: "Перечень исходных данных для прокладок электролизеров, ремонта ячеек и фторопластовых уплотнений.", h1: "Техническая проверка до расчета", body: ["Metatecno проверяет место уплотнения, чертеж или образец, модель оборудования, среду, температуру, давление и количество до подтверждения предложения.", "Размеры, допуски, марка материала, контрольные документы и объем испытаний согласуются для конкретного заказа.", "Запросите у инженера документы для вашего заказа. Общая веб-страница не заменяет окончательную техническую спецификацию."] },
  it: { title: "Garanzia tecnica e documentazione per l'offerta", intro: "Elenco delle evidenze per guarnizioni di elettrolizzatori, riparazione delle celle e tenute fluoroplastiche.", h1: "Verifica tecnica prima dell'offerta", body: ["Metatecno esamina la posizione di tenuta, il disegno o campione, il modello dell'apparecchiatura, il fluido, la temperatura, la pressione e la quantità prima di confermare una proposta.", "Dimensioni, tolleranze, grado del materiale, documenti di ispezione e prove vengono confermati per lo specifico ordine.", "Richiedere all'ingegnere commerciale i documenti applicabili. Una pagina web generale non sostituisce la specifica tecnica finale."] },
  ar: { title: "الضمان التقني وأدلة عرض السعر", intro: "قائمة بيانات لحشيات أجهزة التحليل الكهربائي وإصلاح الخلايا ومواد العزل الفلوروبلاستيكية.", h1: "التحقق التقني قبل عرض السعر", body: ["تراجع Metatecno موضع الإحكام والرسم أو العينة وطراز المعدات والوسط ودرجة الحرارة والضغط والكمية قبل تأكيد الاقتراح.", "تُؤكد الأبعاد والتسامحات ودرجة المادة ومستندات الفحص ونطاق الاختبار لكل طلب.", "اطلب من مهندس المبيعات المستندات المطبقة. لا تحل صفحة ويب عامة محل المواصفة الهندسية النهائية."] }
};

const labels = {
  en: ["Home", "Products", "Technology", "Contact"], es: ["Inicio", "Productos", "Tecnología", "Contacto"],
  pt: ["Início", "Produtos", "Tecnologia", "Contato"], fr: ["Accueil", "Produits", "Technologie", "Contact"],
  ru: ["Главная", "Продукция", "Технология", "Контакты"], it: ["Home", "Prodotti", "Tecnologia", "Contatti"],
  ar: ["الرئيسية", "المنتجات", "التقنية", "الاتصال"]
};

function shell(locale, slug, content, robots = "index,follow") {
  const lang = locale === "es" ? "es-419" : locale === "pt" ? "pt-BR" : locale;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const base = `/${locale}`;
  const canonical = `${ORIGIN}${base}/${slug ? `${slug}/` : ""}`;
  const nav = labels[locale];
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${content.title} | Metatecno</title><meta name="description" content="${content.intro}"><meta name="robots" content="${robots}"><link rel="canonical" href="${canonical}"><link rel="stylesheet" href="/assets/styles.css"><link rel="stylesheet" href="/assets/quality.css"></head><body${dir === "rtl" ? ' class="rtl-page"' : ""}><header class="site-header"><a class="brand" href="${locale === "en" ? "/" : `${base}/`}" aria-label="Metatecno"><img src="/assets/metatecno-logo.webp" width="1230" height="532" alt="Metatecno"></a><nav class="nav" aria-label="Menu"><a href="${locale === "en" ? "/" : `${base}/`}">${nav[0]}</a><a href="${base}/products/">${nav[1]}</a><a href="${base}/technology/">${nav[2]}</a><a href="${base}/contact/">${nav[3]}</a></nav></header><main><section class="page-hero"><div class="page-hero-content"><p>Metatecno</p><h1>${content.h1}</h1><span>${content.intro}</span></div></section><section class="section rich-text">${content.body.map((paragraph) => `<p>${paragraph}</p>`).join("")}<p><a class="button primary" href="${base}/contact/">${nav[3]}</a></p></section></main><footer class="site-footer"><div><strong>Metatecno</strong><span>Industrial sealing and electrolyzer engineering support.</span></div><nav><a href="${base}/privacy-policy/">Privacy Policy</a><a href="${base}/terms-of-service/">Terms of Service</a><a href="${base}/sitemap/">Sitemap</a></nav><small>© 2026 Metatecno.</small></footer><script src="/assets/cookie-consent.js" defer></script><script src="/assets/analytics.js" defer></script></body></html>\n`;
}

for (const [locale, content] of Object.entries(trust)) {
  const directory = resolve(ROOT, locale, "trust");
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, "index.html"), shell(locale, "trust", content, locale === "ar" ? "noindex,follow" : "index,follow"), "utf8");
}

const arabicPages = {
  "": { title: "حشيات وخلايا أجهزة التحليل الكهربائي", intro: "مسودة عربية للمراجعة الفنية من متحدث أصلي قبل الفهرسة.", h1: "حلول إحكام لأجهزة التحليل الكهربائي", body: ["نصنّع حشيات مطاطية وفلوروبلاستيكية وندعم مراجعة الرسوم وظروف التشغيل قبل عرض السعر."] },
  about: { title: "نبذة عن Metatecno", intro: "مسودة نبذة عن الشركة للمراجعة المحلية.", h1: "نبذة عن Metatecno", body: ["تدعم Metatecno مشاريع الكلور والقلويات بمنتجات الإحكام وإصلاح الخلايا وتجميعات خراطيم PTFE."] },
  products: { title: "منتجات الإحكام والتحليل الكهربائي", intro: "حشيات وخلايا ومنتجات فلوروبلاستيكية مصنّعة حسب الرسم والظروف.", h1: "منتجات Metatecno", body: ["يُحدد المنتج المناسب بعد مراجعة الطراز وموضع الإحكام والوسط ودرجة الحرارة والضغط."] },
  technology: { title: "التقنية والجودة", intro: "مراجعة المواد والأبعاد ونطاق الفحص لكل طلب.", h1: "المراجعة التقنية والجودة", body: ["تُؤكد معايير الفحص والوثائق والتسامحات في عرض السعر والطلب المعني."] },
  contact: { title: "طلب عرض سعر تقني", intro: "أرسل الطراز والوسط ودرجة الحرارة والضغط والكمية.", h1: "طلب عرض سعر تقني", body: ["استخدم نموذج الاتصال بعد اعتماد الترجمة العربية النهائية."] },
  "privacy-policy": { title: "سياسة الخصوصية", intro: "مسودة سياسة خصوصية للمراجعة القانونية واللغوية.", h1: "سياسة الخصوصية", body: ["نعالج بيانات الاتصال للرد على طلبات عروض الأسعار. لا يُفعّل التحليل الاختياري إلا بعد الموافقة.", "ينبغي اعتماد هذا النص من مراجع قانوني ومتحدث عربي أصلي قبل النشر المفهرس."] },
  "terms-of-service": { title: "شروط الاستخدام", intro: "مسودة شروط للمراجعة القانونية واللغوية.", h1: "شروط الاستخدام", body: ["المحتوى العام للموقع للإرشاد ولا يستبدل المواصفات الفنية وشروط العقد الخاصة بكل طلب."] },
  sitemap: { title: "خريطة الموقع", intro: "روابط الصفحات العربية الأساسية.", h1: "خريطة الموقع", body: ["هذه الصفحات مسودات غير مفهرسة حتى اكتمال المراجعة اللغوية والفنية."] },
  "thank-you": { title: "شكرًا لطلبك", intro: "سيظهر الرقم المرجعي بعد قبول رسالة البريد.", h1: "شكرًا", body: ["لا تعتبر الرسالة مرسلة إلا عند ظهور رقم مرجعي للطلب."] }
};

for (const [slug, content] of Object.entries(arabicPages)) {
  const directory = resolve(ROOT, "ar", slug);
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, "index.html"), shell("ar", slug, content, "noindex,follow"), "utf8");
}

console.log(`priority_pages_created=${Object.keys(trust).length + Object.keys(arabicPages).length}`);
