export type LocaleCode =
  | "fr" | "en"
  | "fon" | "yor" | "wol" | "hau" | "ibo" | "lin" | "bam" | "ful" | "dyu" | "sef" | "dje";

export interface LocaleDef {
  code: LocaleCode;
  name: string;
  french: string;
  country: string;
  hello: string;
  welcome: string;
  thanks: string;
}

export const locales: LocaleDef[] = [
  { code: "fr",  name: "Français",     french: "Français",     country: "🇧🇯 / 🇫🇷", hello: "Bonjour",      welcome: "Bienvenue",      thanks: "Merci" },
  { code: "en",  name: "English",      french: "Anglais",      country: "🇬🇧 / 🇺🇸", hello: "Hello",        welcome: "Welcome",        thanks: "Thank you" },
  { code: "fon", name: "Fɔngbè",       french: "Fon",          country: "🇧🇯",       hello: "A fɔn ganji",  welcome: "Mi kú àbɔ̀",     thanks: "Awǎnú" },
  { code: "yor", name: "Yorùbá",       french: "Yoruba",       country: "🇧🇯 / 🇳🇬", hello: "Ẹ n lẹ́",      welcome: "Ẹ káàbọ̀",       thanks: "Ẹ ṣé" },
  { code: "wol", name: "Wolof",        french: "Wolof",        country: "🇸🇳",       hello: "Salaam aleekum", welcome: "Dalal ak diam", thanks: "Jërejëf" },
  { code: "hau", name: "Hausa",        french: "Haoussa",      country: "🇳🇬 / 🇳🇪", hello: "Sannu",        welcome: "Barka da zuwa",  thanks: "Na gode" },
  { code: "ibo", name: "Igbo",         french: "Igbo",         country: "🇳🇬",       hello: "Ndewo",        welcome: "Nnọọ",           thanks: "Daalụ" },
  { code: "lin", name: "Lingála",      french: "Lingala",      country: "🇨🇩 / 🇨🇬", hello: "Mbote",        welcome: "Boyei bolamu",   thanks: "Matondi" },
  { code: "bam", name: "Bamanankan",   french: "Bambara",      country: "🇲🇱",       hello: "I ni ce",      welcome: "I bisimila",     thanks: "I ni ce" },
  { code: "ful", name: "Fulfulde",     french: "Peul",         country: "🌍",        hello: "Jam tan",      welcome: "Bisimilla",      thanks: "A jaaraama" },
  { code: "dyu", name: "Julakan",      french: "Dioula",       country: "🇨🇮 / 🇧🇫", hello: "I ni sɔgɔma",  welcome: "I bisimila",     thanks: "I ni ce" },
  { code: "sef", name: "Sɛnara",       french: "Sénoufo",      country: "🇨🇮 / 🇲🇱", hello: "Foo",          welcome: "Ka nyɛɛ",        thanks: "Foo" },
  { code: "dje", name: "Zarma",        french: "Djerma",       country: "🇳🇪",       hello: "Foofo",         welcome: "Kala da bismilla", thanks: "Fofo" },
];

export interface TStrings {
  devis: string; sinistre: string;
  urgence: string; whatsapp: string; menuAide: string;
  baseline: string; switchLang: string;
  ctaDevisShort: string;
  fabUrgenceSub: string; fabSinistreSub: string; fabDevisSub: string; fabWhatsappSub: string;
  heroSlogan: string; heroDescription: string; heroCtaPrimary: string; heroCtaSecondary: string;
  devisBadge: string; devisTitle: string; devisSubtitle: string;
  nav: {
    home: string; carte: string; howItWorks: string; partners: string; about: string;
    sinistre: string; faq: string; products: string; allProducts: string; getQuote: string;
    seeAllProducts: string; findFormula: string; productsCount: string;
    microAssurance: string; assistance: string;
    signin: string; signup: string; signupCreate: string; memberArea: string;
    account: string; navigation: string; ourProducts: string;
    whatsappTitle: string; whatsappAction: string; callTitle: string; callAction: string;
    openMenu: string; closeMenu: string;
  };
  footer: {
    tagline: string; tags: string[]; followUs: string;
    productsTitle: string; navigationTitle: string; contactTitle: string; legalTitle: string;
    partnersCta: string;
    regulated: string; regulatedText: string;
    supervision: string; supervisionText: string;
    license: string; licenseText: string;
    copyright: string;
    mentions: string; privacy: string; cgu: string; mediation: string;
    navHome: string; navProducts: string; navCarte: string; navHowItWorks: string;
    navPartners: string; navFaq: string; navContact: string;
    privacyPolicy: string; conditions: string; mediationFull: string;
  };
  home: {
    heroBadge: string; heroTitleA: string; heroTitleAccent: string;
    ctaSolutions: string; badgeNoPaper: string; badgeMobileMoney: string; badge24h: string;
    sectionSolutionsBadge: string; sectionSolutionsTitleA: string; sectionSolutionsTitleAccent: string;
    sectionSolutionsLead: string;
    statBeneficiaries: string; statSolutions: string; statPartners: string; statSatisfaction: string;
    protectedLabel: string;
    categoryAssurance: string; categoryAssistance: string;
    whyEyebrow: string; whyTitleA: string; whyTitleAccent: string; whyTitleB: string;
    reasons: { title: string; desc: string }[];
    testimonialsEyebrow: string; testimonialsTitleA: string; testimonialsTitleAccent: string;
    testimonials: { name: string; role: string; quote: string }[];
    finalCtaTitle: string; finalCtaLead: string; finalCtaQuote: string; finalCtaCall: string;
  };
  common: {
    discover: string; back: string; loading: string; required: string; optional: string;
    submit: string; cancel: string; close: string; next: string; prev: string;
  };
  faq: {
    titleA: string; titleAccent: string; lead: string;
    seeAnswers: string; talkAdvisor: string;
    responseLabel: string; in24h: string;
    galleryTitle: string; gallerySubtitle: string; galleryEyebrow: string;
    ctaTitle: string; ctaLead: string; ctaContact: string; ctaPartners: string;
  };
  sinistrePage: {
    badge: string; titleA: string; titleAccent: string; lead: string;
    ctaDeclare: string; ctaCall: string;
  };
  contact: {
    badge: string; titleA: string; titleAccent: string; lead: string;
    formTitle: string; nameLabel: string; emailLabel: string; phoneLabel: string;
    messageLabel: string; submitBtn: string; successMsg: string;
    chooseChannel: string; phoneTitle: string; whatsappTitle: string; emailTitle: string; visitTitle: string;
  };
  about: {
    badge: string; titleA: string; titleAccent: string; lead: string;
    missionTitle: string; visionTitle: string; valuesTitle: string;
  };
  products: {
    badge: string; titleA: string; titleAccent: string; lead: string;
    filterAll: string; filterInsurance: string; filterAssistance: string;
    discoverBtn: string;
  };
  inscription: {
    badge: string; titleA: string; titleAccent: string; lead: string;
  };
  espace: {
    badge: string; titleA: string; titleAccent: string; lead: string;
  };
  carte: {
    badge: string; titleA: string; titleAccent: string; lead: string;
    perkPriority: string; perkPartners: string; perkCertified: string;
    ctaGetCard: string; ctaFindPoint: string;
    cardHolder: string; cardValid: string; cardName: string;
    galleryTitle: string; gallerySubtitle: string; galleryEyebrow: string;
    advantagesTitleA: string; advantagesTitleAccent: string; advantagesLead: string;
    adv1Title: string; adv1Desc: string;
    adv2Title: string; adv2Desc: string;
    adv3Title: string; adv3Desc: string;
    adv4Title: string; adv4Desc: string;
    finalCtaTitle: string; finalCtaLead: string;
    finalCtaContact: string; finalCtaPartners: string;
  };
  comment: {
    badge: string; titleA: string; titleAccent: string; lead: string;
  };
  partenaires: {
    badge: string; titleA: string; titleAccent: string; lead: string;
  };
}

const fr: TStrings = {
  devis: "Devis gratuit", sinistre: "Déclarer un sinistre",
  urgence: "Urgence 24/7", whatsapp: "WhatsApp", menuAide: "Menu d'aide",
  baseline: "Main dans la main avec l'informel", switchLang: "Choisir ma langue",
  ctaDevisShort: "Devis gratuit",
  fabUrgenceSub: "Ligne d'assistance",
  fabSinistreSub: "Parcours guidé en ligne",
  fabDevisSub: "Estimation en 2 min",
  fabWhatsappSub: "Conseiller en ligne",
  heroSlogan: "L'assurance solidaire qui protège vraiment l'Afrique qui travaille.",
  heroDescription: "IPPOO ASSURANCE conçoit des micro-assurances assistances pensées pour les actifs de l'informel… Couverture santé, de vos marchandises, pour vos équipements, une couverture spécifique vieillesse, maternité, éducation, couverture chômage…, prise en charge rapide et entraide mutualiste, une protection digne, accessible et lisible, qui transforme l'imprévu en simple étape.",
  heroCtaPrimary: "Découvrir nos solutions",
  heroCtaSecondary: "Contacter IPPOO",
  devisBadge: "Estimation instantanée",
  devisTitle: "Calculez votre cotisation en quelques clics",
  devisSubtitle: "Choisissez votre produit, votre formule et votre rythme de paiement. Nous calculons une estimation indicative, puis un conseiller vous rappelle pour finaliser votre devis.",
  nav: {
    home: "Accueil", carte: "Carte IPPOO", howItWorks: "Comment ça marche", partners: "Points partenaires", about: "À propos",
    sinistre: "Sinistre", faq: "FAQ", products: "Nos produits", allProducts: "Voir tous les produits", getQuote: "Obtenir un devis",
    seeAllProducts: "Voir tous les produits", findFormula: "Trouvez la formule qui colle à votre métier", productsCount: "11 produits IPPOO, un devis en quelques minutes.",
    microAssurance: "MICRO-ASSURANCE", assistance: "ASSISTANCE",
    signin: "Se connecter", signup: "S'inscrire", signupCreate: "Créer un compte", memberArea: "Espace assuré",
    account: "MON COMPTE", navigation: "NAVIGATION", ourProducts: "NOS PRODUITS",
    whatsappTitle: "WHATSAPP", whatsappAction: "Discuter", callTitle: "APPELER", callAction: "24h/24",
    openMenu: "Ouvrir le menu", closeMenu: "Fermer le menu",
  },
  footer: {
    tagline: "Des solutions de micro-assurance simples, accessibles et pensées pour votre quotidien dans le secteur informel.",
    tags: ["Simple", "Accessible", "Rapide"],
    followUs: "Suivez-nous",
    productsTitle: "Nos Produits", navigationTitle: "Navigation", contactTitle: "Contact", legalTitle: "Informations légales",
    partnersCta: "Nos points partenaires",
    regulated: "Entreprise régulée",
    regulatedText: "Agréée selon le Code des Assurances applicable en République du Bénin.",
    supervision: "Tutelle",
    supervisionText: "Autorité de Régulation et de Surveillance des Compagnies d'assurances (ARSC) République du Bénin.",
    license: "N° agrément",
    licenseText: "XXXX/MEF/DGTCP/DA IPPOO ASSURANCE SA Capital 1 000 000 000 FCFA RCCM BJ-COT-2023-B-XXXXX.",
    copyright: "© 2026 IPPOO ASSURANCE SA. Tous droits réservés.",
    mentions: "Mentions légales", privacy: "Politique de confidentialité", cgu: "Conditions d'utilisation", mediation: "Médiation",
    navHome: "Accueil", navProducts: "Nos Produits", navCarte: "Carte IPPOO", navHowItWorks: "Comment ça marche",
    navPartners: "Points partenaires", navFaq: "FAQ", navContact: "Contact",
    privacyPolicy: "Politique de confidentialité", conditions: "Conditions d'utilisation", mediationFull: "Médiation & réclamations",
  },
  home: {
    heroBadge: "Micro-assurance & assistance",
    heroTitleA: "Protégez ce qui compte,",
    heroTitleAccent: "vivement.",
    ctaSolutions: "Nos solutions",
    badgeNoPaper: "Sans paperasse",
    badgeMobileMoney: "Paiement mobile money",
    badge24h: "Indemnisation 24h",
    sectionSolutionsBadge: "Nos solutions",
    sectionSolutionsTitleA: "11 protections,",
    sectionSolutionsTitleAccent: "pensées pour vous.",
    sectionSolutionsLead: "Choisissez la solution qui colle à votre quotidien : commerce, transport, famille, retraite.",
    statBeneficiaries: "Bénéficiaires", statSolutions: "Solutions", statPartners: "Partenaires", statSatisfaction: "Satisfaction",
    protectedLabel: "Protégés",
    categoryAssurance: "Assurance", categoryAssistance: "Assistance",
    whyEyebrow: "Pourquoi IPPOO",
    whyTitleA: "Une assurance", whyTitleAccent: "proche", whyTitleB: "et vivante.",
    reasons: [
      { title: "Simple & rapide", desc: "Souscription mobile en moins de 5 minutes" },
      { title: "Protection fiable", desc: "Garanties claires, sans paperasse" },
      { title: "Prise en charge 24h", desc: "Indemnisation rapide quand vous en avez besoin" },
      { title: "Solidarité", desc: "Inspirée des mutuelles traditionnelles" },
      { title: "Partenaires locaux", desc: "Des relais de confiance proches de vous" },
      { title: "Pensé pour l'informel", desc: "Sur-mesure pour marché, artisanat, transport" },
    ],
    testimonialsEyebrow: "Ils nous font confiance",
    testimonialsTitleA: "Des histoires", testimonialsTitleAccent: "vraies.",
    testimonials: [
      { name: "Aminata Koné", role: "Commerçante Marché de Dantokpa",
        quote: "Quand mes marchandises ont été endommagées, IPPOO a pris en charge mon dossier en 48h. J'ai pu reprendre sans m'endetter." },
      { name: "Ibrahim Diabaté", role: "Artisan menuisier",
        quote: "Mon outillage, c'est toute ma vie. Avec IPPOO je travaille l'esprit tranquille, et leur équipe est toujours à l'écoute." },
      { name: "Mariam Touré", role: "Transporteuse",
        quote: "Les démarches sont simples, le langage clair. C'est la première fois qu'une assurance me parle vraiment." },
    ],
    finalCtaTitle: "Prêt à protéger votre activité ?",
    finalCtaLead: "Un devis personnalisé en 2 minutes. Un conseiller vous rappelle gratuitement.",
    finalCtaQuote: "Devis gratuit", finalCtaCall: "Nous appeler",
  },
  common: {
    discover: "Découvrir", back: "Retour", loading: "Chargement…", required: "Obligatoire", optional: "Facultatif",
    submit: "Envoyer", cancel: "Annuler", close: "Fermer", next: "Suivant", prev: "Précédent",
  },
  faq: {
    titleA: "Questions", titleAccent: "fréquentes",
    lead: "Toutes vos réponses, en un seul endroit. Souscription, cotisations, sinistres, Carte IPPOO : on a fait le tri pour vous.",
    seeAnswers: "Voir les réponses", talkAdvisor: "Parler à un conseiller",
    responseLabel: "RÉPONSE", in24h: "en 24 h",
    galleryTitle: "Des réponses concrètes, pour des vies concrètes",
    gallerySubtitle: "Nos réponses s'inspirent des situations vécues par nos assurés sur le terrain.",
    galleryEyebrow: "DE VRAIES SITUATIONS",
    ctaTitle: "Une question précise ?",
    ctaLead: "Nos conseillers répondent par téléphone, WhatsApp ou dans le point partenaire le plus proche.",
    ctaContact: "Contacter IPPOO", ctaPartners: "Points partenaires",
  },
  sinistrePage: {
    badge: "Déclaration de sinistre",
    titleA: "Un imprévu ?", titleAccent: "On gère.",
    lead: "Déclarez votre sinistre en quelques minutes. Un conseiller IPPOO vous rappelle sous 24 h pour vous accompagner.",
    ctaDeclare: "Déclarer un sinistre", ctaCall: "Appeler IPPOO",
  },
  contact: {
    badge: "Contact",
    titleA: "Parlons", titleAccent: "directement.",
    lead: "Téléphone, WhatsApp, e-mail ou en point partenaire : choisissez le canal qui vous convient.",
    formTitle: "Écrivez-nous", nameLabel: "Nom complet", emailLabel: "E-mail",
    phoneLabel: "Téléphone", messageLabel: "Message",
    submitBtn: "Envoyer le message", successMsg: "Message envoyé. Nous vous répondons sous 24 h.",
    chooseChannel: "Choisissez votre canal",
    phoneTitle: "Téléphone", whatsappTitle: "WhatsApp", emailTitle: "E-mail", visitTitle: "Nous rendre visite",
  },
  about: {
    badge: "À propos",
    titleA: "Main dans la main", titleAccent: "avec l'informel.",
    lead: "IPPOO ASSURANCE conçoit des micro-protections accessibles aux travailleurs, familles et entreprises du secteur informel.",
    missionTitle: "Notre mission", visionTitle: "Notre vision", valuesTitle: "Nos valeurs",
  },
  products: {
    badge: "Nos solutions",
    titleA: "11 produits,", titleAccent: "un seul objectif.",
    lead: "Micro-assurance et assistance : trouvez la formule adaptée à votre activité et à votre famille.",
    filterAll: "Tous", filterInsurance: "Assurance", filterAssistance: "Assistance",
    discoverBtn: "Découvrir",
  },
  inscription: {
    badge: "Créer mon compte",
    titleA: "Rejoignez", titleAccent: "IPPOO.",
    lead: "Inscrivez-vous en quelques minutes pour souscrire, suivre vos cotisations et déclarer vos sinistres.",
  },
  espace: {
    badge: "Espace assuré",
    titleA: "Votre espace,", titleAccent: "à portée de main.",
    lead: "Connectez-vous pour consulter vos contrats, suivre vos cotisations et déclarer un sinistre.",
  },
  carte: {
    badge: "Carte IPPOO",
    titleA: "La Carte", titleAccent: "IPPOO",
    lead: "Votre clé d'accès à une protection simplifiée. Identité d'assuré, contrats actifs, accès au réseau partenaire : tout dans une seule carte, lisible et durable.",
    perkPriority: "Accès prioritaire", perkPartners: "Avantages partenaires", perkCertified: "Statut assuré certifié",
    ctaGetCard: "Obtenir ma carte", ctaFindPoint: "Trouver un point",
    cardHolder: "TITULAIRE", cardValid: "VALIDE", cardName: "NOM PRENOM",
    galleryTitle: "Une carte, mille parcours",
    gallerySubtitle: "Chaque carte IPPOO suit un métier, un foyer, une histoire partout en Afrique.",
    galleryEyebrow: "ILS L'UTILISENT AU QUOTIDIEN",
    advantagesTitleA: "Les avantages exclusifs",
    advantagesTitleAccent: "de la Carte IPPOO",
    advantagesLead: "Quatre avantages structurants pour transformer chaque interaction avec votre assurance en un geste simple.",
    adv1Title: "Une expérience plus simple",
    adv1Desc: "Une seule carte rassemble votre identité d'assuré, vos protections actives et vos accès aux services IPPOO. Tout est centralisé, lisible et utilisable au quotidien sans démarches complexes.",
    adv2Title: "Une orientation plus facile",
    adv2Desc: "Les conseillers et points de service partenaires reconnaissent immédiatement votre situation et vous orientent sans délai vers la bonne formule ou le bon partenaire santé.",
    adv3Title: "Un parcours plus clair",
    adv3Desc: "De la souscription à l'activation d'une prise en charge, chaque étape est balisée. Vous savez ce qui est couvert, comment l'activer et qui contacter, sans reconstituer un dossier.",
    adv4Title: "Accompagnement de proximité",
    adv4Desc: "La carte ouvre l'accès à un réseau de partenaires locaux de confiance qui partagent la même charte d'accueil et de réactivité, proche de votre lieu de vie et de travail.",
    finalCtaTitle: "Obtenez votre Carte IPPOO",
    finalCtaLead: "En quelques minutes, un conseiller vérifie votre situation, vous oriente vers la formule adaptée et déclenche l'émission de votre carte.",
    finalCtaContact: "Contacter IPPOO", finalCtaPartners: "Points partenaires",
  },
  comment: {
    badge: "Comment ça marche",
    titleA: "Souscrire,", titleAccent: "c'est simple.",
    lead: "Choisissez votre formule, payez par mobile money, recevez votre attestation. Trois étapes, c'est tout.",
  },
  partenaires: {
    badge: "Points partenaires",
    titleA: "Près de chez vous,", titleAccent: "près de votre cœur.",
    lead: "Plus de 10 points partenaires à travers l'Afrique pour vous accompagner au quotidien.",
  },
};

const en: TStrings = {
  devis: "Free quote", sinistre: "File a claim",
  urgence: "24/7 emergency", whatsapp: "WhatsApp", menuAide: "Help menu",
  baseline: "Hand in hand with the informal sector", switchLang: "Choose my language",
  ctaDevisShort: "Free quote",
  fabUrgenceSub: "24/7 hotline",
  fabSinistreSub: "Guided online flow",
  fabDevisSub: "2-minute estimate",
  fabWhatsappSub: "Live advisor",
  heroSlogan: "The solidarity insurance that truly protects the Africa that works.",
  heroDescription: "IPPOO ASSURANCE designs micro-insurance and assistance plans for informal-sector workers… Health coverage, coverage for your goods and equipment, dedicated protection for old age, maternity, education, unemployment…, fast claim handling and mutual-aid solidarity dignified, affordable and clear protection that turns the unexpected into a simple step.",
  heroCtaPrimary: "Discover our solutions",
  heroCtaSecondary: "Contact IPPOO",
  devisBadge: "Instant estimate",
  devisTitle: "Calculate your premium in a few clicks",
  devisSubtitle: "Pick your product, your formula and your payment rhythm. We compute an indicative estimate, then an advisor calls you back to finalise your quote.",
  nav: {
    home: "Home", carte: "IPPOO Card", howItWorks: "How it works", partners: "Partner locations", about: "About",
    sinistre: "Claim", faq: "FAQ", products: "Our products", allProducts: "See all products", getQuote: "Get a quote",
    seeAllProducts: "See all products", findFormula: "Find the plan that fits your trade", productsCount: "11 IPPOO products, a quote in minutes.",
    microAssurance: "MICRO-INSURANCE", assistance: "ASSISTANCE",
    signin: "Sign in", signup: "Sign up", signupCreate: "Create account", memberArea: "Member area",
    account: "MY ACCOUNT", navigation: "NAVIGATION", ourProducts: "OUR PRODUCTS",
    whatsappTitle: "WHATSAPP", whatsappAction: "Chat now", callTitle: "CALL", callAction: "24/7",
    openMenu: "Open menu", closeMenu: "Close menu",
  },
  footer: {
    tagline: "Simple, accessible micro-insurance solutions designed for your everyday life in the informal sector.",
    tags: ["Simple", "Accessible", "Fast"],
    followUs: "Follow us",
    productsTitle: "Our Products", navigationTitle: "Navigation", contactTitle: "Contact", legalTitle: "Legal information",
    partnersCta: "Our partner locations",
    regulated: "Regulated company",
    regulatedText: "Licensed by CIMA Insurance Code in force across 14 West and Central African states.",
    supervision: "Supervisory authority",
    supervisionText: "Insurance Companies Regulation and Supervision Authority (ARSC) Republic of Bénin.",
    license: "License No.",
    licenseText: "XXXX/MEF/DGTCP/DA IPPOO ASSURANCE SA Capital XOF 1,000,000,000 RCCM BJ-COT-2023-B-XXXXX.",
    copyright: "© 2026 IPPOO ASSURANCE SA. All rights reserved.",
    mentions: "Legal notice", privacy: "Privacy policy", cgu: "Terms of use", mediation: "Mediation",
    navHome: "Home", navProducts: "Our Products", navCarte: "IPPOO Card", navHowItWorks: "How it works",
    navPartners: "Partner locations", navFaq: "FAQ", navContact: "Contact",
    privacyPolicy: "Privacy policy", conditions: "Terms of use", mediationFull: "Mediation & complaints",
  },
  home: {
    heroBadge: "Micro-insurance & assistance",
    heroTitleA: "Protect what matters,",
    heroTitleAccent: "boldly.",
    ctaSolutions: "Our solutions",
    badgeNoPaper: "No paperwork",
    badgeMobileMoney: "Mobile money payment",
    badge24h: "24-hour claims",
    sectionSolutionsBadge: "Our solutions",
    sectionSolutionsTitleA: "11 protections,",
    sectionSolutionsTitleAccent: "designed for you.",
    sectionSolutionsLead: "Pick the solution that fits your everyday life: trade, transport, family, retirement.",
    statBeneficiaries: "Beneficiaries", statSolutions: "Solutions", statPartners: "Partners", statSatisfaction: "Satisfaction",
    protectedLabel: "Protected",
    categoryAssurance: "Insurance", categoryAssistance: "Assistance",
    whyEyebrow: "Why IPPOO",
    whyTitleA: "Insurance that's", whyTitleAccent: "close", whyTitleB: "and alive.",
    reasons: [
      { title: "Simple & fast", desc: "Mobile sign-up in under 5 minutes" },
      { title: "Reliable protection", desc: "Clear coverage, no paperwork" },
      { title: "24h handling", desc: "Fast claim settlement when you need it" },
      { title: "Solidarity", desc: "Inspired by traditional mutual-aid funds" },
      { title: "Local partners", desc: "Trusted relays close to you" },
      { title: "Built for the informal sector", desc: "Tailored for markets, crafts, transport" },
    ],
    testimonialsEyebrow: "They trust us",
    testimonialsTitleA: "Real", testimonialsTitleAccent: "stories.",
    testimonials: [
      { name: "Aminata Koné", role: "Trader Dantokpa Market",
        quote: "When my goods were damaged, IPPOO handled my claim within 48 hours. I was able to restart without taking on debt." },
      { name: "Ibrahim Diabaté", role: "Carpenter",
        quote: "My tools are my whole life. With IPPOO I work with peace of mind, and their team is always there to listen." },
      { name: "Mariam Touré", role: "Transporter",
        quote: "The process is simple, the language is clear. It's the first time an insurer has truly spoken to me." },
    ],
    finalCtaTitle: "Ready to protect your business?",
    finalCtaLead: "A tailored quote in 2 minutes. An advisor calls you back for free.",
    finalCtaQuote: "Free quote", finalCtaCall: "Call us",
  },
  common: {
    discover: "Discover", back: "Back", loading: "Loading…", required: "Required", optional: "Optional",
    submit: "Send", cancel: "Cancel", close: "Close", next: "Next", prev: "Previous",
  },
  faq: {
    titleA: "Frequently", titleAccent: "asked",
    lead: "All your answers in one place. Sign-up, premiums, claims, IPPOO Card we've sorted it for you.",
    seeAnswers: "See answers", talkAdvisor: "Talk to an advisor",
    responseLabel: "REPLY", in24h: "within 24 h",
    galleryTitle: "Real answers for real lives",
    gallerySubtitle: "Our answers come from situations our policyholders actually live through.",
    galleryEyebrow: "REAL SITUATIONS",
    ctaTitle: "A specific question?",
    ctaLead: "Our advisors answer by phone, WhatsApp or at your nearest partner location.",
    ctaContact: "Contact IPPOO", ctaPartners: "Partner locations",
  },
  sinistrePage: {
    badge: "File a claim",
    titleA: "Something happened?", titleAccent: "We handle it.",
    lead: "File your claim in a few minutes. An IPPOO advisor calls you back within 24 h to guide you.",
    ctaDeclare: "File a claim", ctaCall: "Call IPPOO",
  },
  contact: {
    badge: "Contact",
    titleA: "Let's", titleAccent: "talk.",
    lead: "Phone, WhatsApp, email or in person at a partner: pick the channel that suits you.",
    formTitle: "Write to us", nameLabel: "Full name", emailLabel: "Email",
    phoneLabel: "Phone", messageLabel: "Message",
    submitBtn: "Send message", successMsg: "Message sent. We reply within 24 h.",
    chooseChannel: "Choose your channel",
    phoneTitle: "Phone", whatsappTitle: "WhatsApp", emailTitle: "Email", visitTitle: "Visit us",
  },
  about: {
    badge: "About",
    titleA: "Hand in hand", titleAccent: "with the informal sector.",
    lead: "IPPOO ASSURANCE builds affordable micro-protection for workers, families and businesses in the informal sector.",
    missionTitle: "Our mission", visionTitle: "Our vision", valuesTitle: "Our values",
  },
  products: {
    badge: "Our solutions",
    titleA: "11 products,", titleAccent: "one goal.",
    lead: "Micro-insurance and assistance: find the plan that fits your trade and your family.",
    filterAll: "All", filterInsurance: "Insurance", filterAssistance: "Assistance",
    discoverBtn: "Discover",
  },
  inscription: {
    badge: "Create my account",
    titleA: "Join", titleAccent: "IPPOO.",
    lead: "Sign up in a few minutes to subscribe, track your premiums and file claims.",
  },
  espace: {
    badge: "Member area",
    titleA: "Your space,", titleAccent: "in your pocket.",
    lead: "Sign in to view your policies, track premiums and file a claim.",
  },
  carte: {
    badge: "IPPOO Card",
    titleA: "The IPPOO", titleAccent: "Card",
    lead: "Your key to simplified protection. Insured identity, active contracts, access to the partner network: all in one card, readable and durable.",
    perkPriority: "Priority access", perkPartners: "Partner perks", perkCertified: "Certified insured status",
    ctaGetCard: "Get my card", ctaFindPoint: "Find a location",
    cardHolder: "HOLDER", cardValid: "VALID", cardName: "FIRST LAST",
    galleryTitle: "One card, a thousand journeys",
    gallerySubtitle: "Every IPPOO card follows a trade, a home, a story all across Africa.",
    galleryEyebrow: "THEY USE IT EVERY DAY",
    advantagesTitleA: "The exclusive benefits",
    advantagesTitleAccent: "of the IPPOO Card",
    advantagesLead: "Four structural benefits to turn every interaction with your insurance into a simple gesture.",
    adv1Title: "A simpler experience",
    adv1Desc: "A single card brings together your insured identity, your active protections and your access to IPPOO services. Everything is centralised, readable and usable day-to-day without complex paperwork.",
    adv2Title: "Easier guidance",
    adv2Desc: "Advisors and partner service points instantly recognise your situation and direct you without delay to the right plan or the right health partner.",
    adv3Title: "A clearer journey",
    adv3Desc: "From sign-up to activating a claim, every step is mapped. You know what's covered, how to activate it and who to contact, without rebuilding a file.",
    adv4Title: "Local support",
    adv4Desc: "The card opens access to a network of trusted local partners who share the same standards of welcome and responsiveness, close to where you live and work.",
    finalCtaTitle: "Get your IPPOO Card",
    finalCtaLead: "In a few minutes an advisor checks your situation, directs you to the right plan and triggers the issuance of your card.",
    finalCtaContact: "Contact IPPOO", finalCtaPartners: "Partner locations",
  },
  comment: {
    badge: "How it works",
    titleA: "Signing up", titleAccent: "is simple.",
    lead: "Pick your plan, pay by mobile money, get your certificate. Three steps, that's it.",
  },
  partenaires: {
    badge: "Partner locations",
    titleA: "Close to you,", titleAccent: "close to your heart.",
    lead: "More than 10 partner locations across Africa to support you every day.",
  },
};

// Local languages currently fall back to French content. Replace `fr` with the
// dedicated translation object when one becomes available.
export const tCommon: Record<LocaleCode, TStrings> = {
  fr, en,
  fon: fr, yor: fr, wol: fr, hau: fr, ibo: fr, lin: fr,
  bam: fr, ful: fr, dyu: fr, sef: fr, dje: fr,
};
