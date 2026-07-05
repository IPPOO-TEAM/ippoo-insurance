import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Briefcase, Shield, Users, Upload, KeyRound, Check, ArrowRight, ArrowLeft,
  Sparkles, Plus, Trash2, Store, ChevronDown, Loader2,
  GraduationCap, Building2, Heart, Wheat, Factory, Truck, ShoppingBag, Wrench, type LucideIcon,
} from "lucide-react";
import { usePageMeta } from "../lib/usePageMeta";
import { useLang } from "../lib/LanguageContext";
import { markRegistered } from "../lib/auth";
import { PhoneInput } from "../espace-client/PhoneInput";
import { DEFAULT_COUNTRY, isValidPhone, fullPhone, type AfricanCountry } from "../espace-client/africanCountries";
import { apiFetch, getSupabase } from "../espace-client/supabaseClient";
import { api } from "../espace-client/api";

// Version courante des CGU/Confidentialité/Traitement. À incrémenter à chaque
// révision majeure pour forcer un re-consentement et tracer qui a accepté
// quelle version.
import { CONSENT_VERSION } from "../lib/consents";
import inscriptionHeroBg from "../../imports/photo_6_2026-05-25_15-34-44-1.jpg";

type ProfileKey = "informel" | "particulier" | "salarie";

interface Beneficiaire { nom: string; age: string; lien: string; }

interface FormState {
  profile: ProfileKey | "";
  classView: "secteurs" | "flux";
  selectedSector: string;
  selectedGroup: string;
  sousProfil: string[];
  // 1
  nom: string; dateNaissance: string; genre: string; nationalite: string;
  telephone: string; email: string; adresse: string;
  // 2
  activite: string; activiteAutre: string; secteur: string; secteurAutre: string; entreprise: string; statutPro: string; statutAutre: string;
  // 3
  couverture: string[]; couvertureAutre: string; formule: string;
  // 4
  beneficiaires: Beneficiaire[];
  // 5
  documents: string[]; documentAutre: string;
  // 6
  loginEmail: string; password: string; passwordConfirm: string;
  // 7
  consentCGU: boolean; consentConfid: boolean; consentTraitement: boolean;
  // Parrainage (optionnel)
  referralCode: string;
}

const initial: FormState = {
  profile: "", classView: "secteurs", selectedSector: "", selectedGroup: "", sousProfil: [],
  nom: "", dateNaissance: "", genre: "", nationalite: "Béninoise",
  telephone: "", email: "", adresse: "",
  activite: "", activiteAutre: "", secteur: "", secteurAutre: "", entreprise: "", statutPro: "", statutAutre: "",
  couverture: [], couvertureAutre: "", formule: "",
  beneficiaires: [{ nom: "", age: "", lien: "" }],
  documents: [], documentAutre: "",
  loginEmail: "", password: "", passwordConfirm: "",
  consentCGU: false, consentConfid: false, consentTraitement: false,
  referralCode: "",
};

interface SectorGroup { label: string; icon?: LucideIcon; items: string[] }
interface Sector { key: string; label: string; Icon: LucideIcon; tagline: string; color: string; groups: SectorGroup[] }
interface ProfileDef {
  key: ProfileKey;
  title: string;
  short: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  soft: string;
  sectionTitle: string;
  groups: SectorGroup[];
  sectors?: Sector[];
  flux?: Sector[];
  besoins: string[];
}

const informelSectors: Sector[] = [
  {
    key: "primaire",
    label: "Secteur primaire",
    Icon: Wheat,
    tagline: "Agriculture, élevage, pêche, exploitation naturelle",
    color: "#16B26A",
    groups: [
      { label: "Cultures vivrières", items: ["Cultivateur de maïs", "Cultivateur de riz", "Cultivateur de sorgho", "Cultivateur de mil", "Cultivateur de niébé", "Cultivateur de soja", "Cultivateur d'arachide", "Producteur de manioc", "Producteur d'igname", "Producteur de patate douce", "Producteur de taro", "Producteur de banane plantain", "Jardinier vivrier", "Producteur de légumes locaux"] },
      { label: "Maraîchage", items: ["Producteur de tomate", "Producteur de piment", "Producteur de poivron", "Producteur d'oignon", "Producteur d'ail", "Producteur de laitue", "Producteur de concombre", "Producteur de choux", "Producteur de carotte", "Producteur d'aubergine africaine", "Producteur de feuilles (gboma, amarante, basilic, menthe)"] },
      { label: "Fruits", items: ["Producteur d'ananas", "Producteur de mangue", "Producteur d'orange", "Producteur de citron", "Producteur de goyave", "Producteur de papaye", "Producteur de pastèque", "Producteur de banane douce", "Producteur de noix de coco"] },
      { label: "Cultures industrielles", items: ["Producteur de coton", "Producteur de noix de cajou", "Producteur de palmier à huile", "Producteur de cacao", "Producteur de café", "Producteur de tabac", "Producteur de soja industriel"] },
      { label: "Élevage traditionnel", items: ["Éleveur bovin", "Éleveur ovin", "Éleveur caprin", "Éleveur porcin", "Éleveur de chevaux", "Éleveur d'ânes"] },
      { label: "Aviculture", items: ["Éleveur poulets de chair", "Éleveur pondeuses", "Éleveur pintades", "Éleveur cailles", "Éleveur canards", "Éleveur dindons", "Producteur d'œufs"] },
      { label: "Autres élevages", items: ["Apiculteur", "Héliciculteur (escargots)", "Cuniculture (lapins)", "Éleveur de poissons (aquaculture)"] },
      { label: "Pêche", items: ["Pêcheur artisanal", "Pêcheur lagunaire", "Pêcheur de rivière", "Pêcheur maritime (barques)", "Poseur de nasses", "Fabricant de filets", "Mareyeur", "Fumeur de poisson", "Sécheur de poisson", "Vendeur de poisson frais", "Vendeur de crustacés", "Producteur d'écrevisses"] },
      { label: "Ressources naturelles", items: ["Charbonnier (charbon de bois)", "Collecteur de bois de chauffe", "Exploitant de sable", "Exploitant de latérite", "Exploitant de gravier", "Cueilleur de plantes médicinales", "Collecteur de feuilles (palme, rônier)", "Exploitant de fibres naturelles (raphia, bambou)", "Producteur d'argile"] },
    ],
  },
  {
    key: "secondaire",
    label: "Secteur secondaire",
    Icon: Factory,
    tagline: "Transformation, artisanat, fabrication",
    color: "#2A6BFF",
    groups: [
      { label: "Produits du manioc", items: ["Transformateur de gari", "Transformateur de tapioca", "Transformateur de cossettes", "Producteur d'attiéké", "Vente de pâte de manioc"] },
      { label: "Produits céréaliers", items: ["Meunier", "Transformateur de farine de maïs", "Transformateur de farine de riz", "Fabricant d'akassa / pâte", "Fabricant de bouillies locales"] },
      { label: "Huiles", items: ["Producteur d'huile rouge", "Producteur d'huile palmiste", "Producteur d'huile d'arachide", "Producteur d'huile de soja"] },
      { label: "Produits animaux", items: ["Boucherie artisanale", "Abattage informel", "Charcutier traditionnel"] },
      { label: "Produits laitiers", items: ["Producteur de fromage peulh", "Producteur de yaourt artisanal", "Producteur de lait caillé"] },
      { label: "Produits sucrés", items: ["Fabricant de jus locaux (gingembre, bissap, zobo)", "Fabricant de sirops", "Fabricant de confitures"] },
      { label: "Boulangerie / Pâtisserie", items: ["Boulanger traditionnel", "Fabricant de beignets", "Fabricant de gâteaux locaux", "Fabricant de galettes"] },
      { label: "Métal & Mécanique", items: ["Soudeur", "Métallier", "Forgeron", "Fabricant de portails", "Fabricant d'outils agricoles", "Réparateur auto", "Réparateur moto", "Réparateur de vélos", "Bobineur", "Tôlier"] },
      { label: "Bois", items: ["Menuisier bois", "Charpentier", "Fabricant de meubles", "Fabricant de lits", "Fabricant de tables", "Fabricant de portes"] },
      { label: "Textile & Mode", items: ["Couturier", "Styliste", "Brodeur", "Tisserand", "Fabricant de pagnes tissés", "Fabricant de sacs artisanaux", "Fabricant de sandales en pagne", "Teinturière / batik"] },
      { label: "Cuir & Accessoires", items: ["Cordonnier", "Fabricant de chaussures", "Fabricant de ceintures", "Fabricant de sacs en cuir"] },
      { label: "Cosmétiques", items: ["Savonnier (savon noir, savon de toilette)", "Fabricant d'huiles naturelles (coco, karité, neem)", "Fabricant de pommades naturelles", "Fabricant de parfums artisanaux"] },
      { label: "Matériaux", items: ["Fabricant de briques en terre", "Fabricant de briques ciment", "Fabricant de carreaux artisanaux", "Fabricant de peintures locales"] },
      { label: "Artisanat divers", items: ["Sculpteur", "Peintre sur toile", "Fabricant de bijoux", "Fabricant d'objets décoratifs", "Fabricant d'ustensiles traditionnels", "Fabricant de balais", "Fabricant de paniers"] },
    ],
  },
  {
    key: "tertiaire",
    label: "Secteur tertiaire",
    Icon: Store,
    tagline: "Commerce, distribution, services",
    color: "#FF7A00",
    groups: [
      { label: "Distribution alimentaire", items: ["Grossiste céréales", "Semi-grossiste céréales", "Grossiste tubercules", "Grossiste volailles", "Grossiste poissons", "Dépôt d'œufs", "Dépôt de boissons", "Dépôt d'eau minérale", "Grossiste jus", "Grossiste fruits et légumes"] },
      { label: "Distribution non alimentaire", items: ["Grossiste produits cosmétiques", "Grossiste produits ménagers", "Grossiste chaussures", "Grossiste vêtements", "Grossiste sacs", "Grossiste pièces détachées moto", "Grossiste pièces détachées auto", "Grossiste matériaux de construction"] },
      { label: "Commerce alimentaire", items: ["Revendeur vivriers", "Revendeur légumes frais", "Revendeur poissons frais", "Revendeur poissons fumés", "Revendeur viandes", "Revendeur volailles", "Revendeur épices", "Revendeur huiles alimentaires", "Revendeur pains", "Revendeur boissons", "Marchande de beignets", "Marchande de bouillies", "Marchande de fruits"] },
      { label: "Commerce non alimentaire", items: ["Vendeur de vêtements", "Vendeur de friperie", "Vendeur d'articles pour bébés", "Vendeur de sacs", "Vendeur de téléphones", "Vendeur de coques & accessoires", "Vendeur d'appareils électroménagers", "Vendeur d'ustensiles de cuisine", "Vendeur de meubles d'occasion", "Vendeur de tapis", "Vendeur de chaussures"] },
      { label: "Transport", items: ["Conducteur de taxi-moto", "Conducteur taxi tricycle", "Conducteur taxi-bus", "Transporteur de marchandises", "Transporteur à tricycle cargo"] },
      { label: "Services personnels", items: ["Coiffeuse", "Coiffeur", "Tresseuse", "Esthéticienne", "Maquilleuse", "Barbier", "Lavandière"] },
      { label: "Réparation & Maintenance", items: ["Réparateur téléphone", "Réparateur ordinateurs", "Réparateur électroménagers", "Réparateur télévision", "Réparateur ventilateurs", "Réparateur groupes électrogènes", "Réparateur panneaux solaires"] },
      { label: "Restauration & Boissons", items: ["Restauratrice de rue", "Vendeur de grillades", "Vendeur de brochettes", "Vendeur de sandwichs", "Vendeur de café / thé", "Gérant de maquis", "Gérant de bar local"] },
      { label: "Services divers", items: ["Photographe", "Vidéaste", "Imprimeur de rue", "Agent de nettoyage", "Agent de gardiennage", "Laveur de vitres", "Laveur de motos", "Laveur de voitures", "Dépanneur rapide", "Changeur de monnaie (informel)"] },
    ],
  },
];

const informelFlux: Sector[] = [
  {
    key: "producteurs",
    label: "Flux 1 Producteurs",
    Icon: Wheat,
    tagline: "Ceux qui extraient, cultivent ou fabriquent la matière première",
    color: "#16B26A",
    groups: [
      { label: "Producteurs agricoles", items: ["Producteur de maïs", "Producteur de riz", "Producteur de sorgho", "Producteur de mil", "Producteur de manioc", "Producteur d'igname", "Producteur de patate douce", "Producteur de soja", "Producteur d'arachide", "Producteur de haricots", "Producteur de banane plantain", "Producteur de légumes (tomate, oignon, piment, aubergine, choux, laitue…)", "Producteur d'ananas", "Producteur de mangue", "Producteur d'agrumes (orange, citron, pamplemousse)", "Producteur de noix de coco", "Producteur de noix de cajou", "Producteur de coton", "Producteur de palmier à huile", "Producteur de cacao", "Producteur de café"] },
      { label: "Éleveurs", items: ["Éleveur bovin", "Éleveur ovin", "Éleveur caprin", "Éleveur porcin", "Aviculteur (poulets de chair, pondeuses, pintades, cailles)", "Producteur d'œufs", "Éleveur de lapins", "Apiculteur", "Héliciculteur (escargots)", "Éleveur de poissons (aquaculture)"] },
      { label: "Pêche", items: ["Pêcheur artisanal", "Pêcheur lagunaire", "Pêcheur de rivière", "Pêcheur maritime", "Poseur de nasses", "Collecteur de produits halieutiques"] },
      { label: "Exploitants naturels", items: ["Producteur de charbon de bois", "Exploitant forestier (bois de chauffe)", "Producteur de sable", "Producteur de graviers", "Collecteur de plantes médicinales", "Cueilleur d'herbes, feuilles, racines"] },
    ],
  },
  {
    key: "transformateurs",
    label: "Flux 2 Transformateurs",
    Icon: Factory,
    tagline: "Ceux qui transforment un produit brut en produit fini ou semi-fini",
    color: "#FF7A00",
    groups: [
      { label: "Agro-alimentaires", items: ["Meunier (moulin à manioc, maïs)", "Transformateur de gari", "Transformateur de tapioca", "Producteur d'huile rouge", "Producteur d'huile d'arachide / soja", "Fabricant d'akpan / dèguè", "Fabricant de fromage peuhl", "Fumeur/sécheur de poisson", "Boucher traditionnel", "Charcutier artisanal", "Boulanger artisanal", "Pâtissier artisanal", "Producteur d'eau en sachet", "Brasseur artisanal (boissons locales)"] },
      { label: "Non alimentaires", items: ["Savonnier (savons traditionnels & naturels)", "Fabricant de pommades, crèmes, huiles", "Fabricant d'alcool local (gel, usage technique)", "Tisserand", "Couturier / tailleur", "Cordonniers fabricants", "Menuisier bois", "Menuisier métal (soudeur)", "Forgeron", "Fabricant de briques", "Fabricant de meubles artisanaux", "Recycleur de plastiques", "Recycleur de textiles", "Fabricant de produits d'artisanat (perles, bijoux, décoration)"] },
    ],
  },
  {
    key: "distributeurs",
    label: "Flux 3 Distributeurs",
    Icon: Truck,
    tagline: "Ceux qui transportent ou acheminent les produits vers les marchés",
    color: "#2A6BFF",
    groups: [
      { label: "Semi-grossistes / Grossistes", items: ["Grossiste de céréales", "Grossiste de tubercules", "Grossiste de fruits", "Grossiste de légumes", "Grossiste de noix de cajou", "Grossiste d'huile végétale", "Grossiste de boissons (locales et industrielles)", "Grossiste de produits laitiers", "Grossiste de viande", "Grossiste de poissons fumés / séchés / frais"] },
      { label: "Collecteurs / Mareyeurs", items: ["Collecteur de maïs", "Collecteur de manioc", "Collecteur d'igname", "Collecteur d'ananas", "Mareyeur (collecteur de poissons)", "Collecteur de bois", "Collecteur de charbon", "Collecteur de sable", "Intermédiaires de filières (coton, anacarde, soja)"] },
      { label: "Transporteurs / Logisticiens", items: ["Transporteur routier", "Transporteur moto-tricycle", "Transporteur \"keke\"", "Transporteur fluvial", "Transporteur de bétail", "Chauffeur-livreur"] },
    ],
  },
  {
    key: "detaillants",
    label: "Flux 4 Détaillants",
    Icon: ShoppingBag,
    tagline: "Ceux qui vendent au consommateur final",
    color: "#FF4FAE",
    groups: [
      { label: "Commerçants alimentaires", items: ["Revendeur de céréales (détaillant)", "Revendeur de gari, tapioca", "Revendeur de légumes", "Revendeur de fruits", "Revendeur de poisson frais", "Revendeur de poisson fumé", "Revendeur de viande", "Revendeur d'œufs", "Revendeur de pains", "Revendeur de produits laitiers", "Vendeur de plats cuisinés (cantinière, vendeur ambulant)", "Vendeur de grillades", "Vendeur d'igname pilé / pâte / riz"] },
      { label: "Commerçants non alimentaires", items: ["Revendeur de vêtements", "Revendeur de tissus", "Revendeur de chaussures", "Revendeur de produits cosmétiques", "Revendeur de parfums", "Revendeur de produits artisanaux", "Revendeur d'ustensiles de cuisine", "Revendeur de meubles", "Revendeur d'accessoires téléphones", "Revendeur de pièces détachées", "Revendeur de matériaux de construction (petit vendeur)"] },
      { label: "Micro-commerçants / ambulants", items: ["Vendeur ambulant de fruits (banane, orange, ananas)", "Vendeur ambulant de cacahuètes", "Vendeur ambulant de beignets", "Vendeur ambulant de sachets d'eau", "Vendeur ambulant d'accessoires", "Vendeur à étal mobile", "Vendeur au porte-à-porte"] },
      { label: "Restaurants & Points de restauration", items: ["Restaurateur de rue", "Maquisier", "Gérant de buvette", "Tenancier de bar local", "Vendeur de café/tisanes", "Vendeur de bouillie", "Vendeur d'akpan/dèguè"] },
    ],
  },
  {
    key: "services",
    label: "Flux transversal Services aux filières",
    Icon: Wrench,
    tagline: "Métiers transversaux qui appuient toutes les filières",
    color: "#8A4BFF",
    groups: [
      { label: "Services techniques", items: ["Mécanicien (moto, auto)", "Électricien", "Plombier", "Soudeur", "Menuisier", "Technicien froid & clim", "Réparateur téléphone", "Réparateur TV"] },
      { label: "Services commerciaux", items: ["Promoteur de marché", "Commissionnaire", "Intermédiaire libre", "Agent mobile money", "Agent digital (vente en ligne)"] },
    ],
  },
];

const profiles: ProfileDef[] = [
  {
    key: "informel",
    title: "Informel",
    short: "Travailleurs indépendants",
    desc: "Commerçants, artisans, conducteurs, vendeurs, prestataires sans statut formel.",
    icon: Store,
    color: "#FF7A00",
    soft: "#FFE8D1",
    sectionTitle: "Votre secteur d'activité",
    groups: [],
    sectors: informelSectors,
    flux: informelFlux,
    besoins: [
      "Micro-Assurance Santé et Maladie",
      "Micro-Assurance Marchandises",
      "Micro-Assurance Équipement et Outillage",
      "Micro-Assurance Transport",
      "Micro-Assurance Sociale et Responsabilité Civile",
      "Micro-Assurance Retraite et Prévoyance",
    ],
  },
  {
    key: "particulier",
    title: "Particulier",
    short: "Couverture personnelle & familiale",
    desc: "Personne physique recherchant une couverture personnelle, familiale ou patrimoniale.",
    icon: Heart,
    color: "#FF4FAE",
    soft: "#FFDCEE",
    sectionTitle: "Votre situation",
    groups: [
      { label: "Statut social", items: ["Étudiant", "Jeune actif", "Parent / famille", "Personne âgée", "Couple sans enfants"] },
      { label: "Niveau économique", items: ["Bas revenu", "Revenu intermédiaire", "Revenu élevé", "Très haut revenu"] },
      { label: "Mode de vie", items: ["Urbain", "Semi-urbain", "Rural"] },
      { label: "Responsabilités familiales", items: ["Sans personne à charge", "1–2 enfants", "Famille nombreuse", "Personne dépendante (âgée ou handicapée)"] },
    ],
    besoins: [
      "Micro-Assurance Santé et Maladie",
      "Micro-Assurance Maternité",
      "Micro-Assurance Éducation",
      "Micro-Assurance Sociale et Responsabilité Civile",
      "Micro-Assurance Retraite et Prévoyance",
      "Micro-Assurance Juridique",
    ],
  },
  {
    key: "salarie",
    title: "Salarié",
    short: "Public ou privé, revenu stable",
    desc: "Employé du secteur public ou privé bénéficiant d'un revenu stable.",
    icon: GraduationCap,
    color: "#2A6BFF",
    soft: "#DDE7FF",
    sectionTitle: "Votre statut",
    groups: [
      { label: "Secteur privé", icon: Building2, items: ["Employé administratif", "Technicien", "Cadre moyen", "Cadre supérieur", "Employé temporaire / contractuel"] },
      { label: "Secteur public", icon: Shield, items: ["Fonctionnaire", "Contractuel de l'État", "Agent communautaire", "Policier / militaire / forces de l'ordre"] },
      { label: "Entreprise / Institution", icon: Briefcase, items: ["Grande entreprise", "PME", "Startup", "ONG / Association", "Institution internationale"] },
      { label: "Type de contrat", items: ["CDI", "CDD", "Contrat journalier", "Stagiaire rémunéré"] },
      { label: "Niveau de salaire", items: ["Bas salaire", "Salaire intermédiaire", "Salaire cadre", "Haut salaire"] },
    ],
    besoins: [
      "Micro-Assurance Santé et Maladie",
      "Micro-Assurance Sociale et Responsabilité Civile",
      "Micro-Assurance Retraite et Prévoyance",
      "Micro-Assurance Éducation",
      "Micro-Assurance Comptable et Fiscale",
      "Micro-Assurance Administrative",
    ],
  },
];

// Catalogue officiel IPPOO — strictement aligné avec src/app/data/products.ts.
// Toute couverture proposée dans le parcours d'inscription doit exister dans le catalogue du site.
const couvertureBase = [
  "Micro-Assurance Santé et Maladie",
  "Micro-Assurance Marchandises",
  "Micro-Assurance Équipement et Outillage",
  "Micro-Assurance Transport",
  "Micro-Assurance Maternité",
  "Micro-Assurance Éducation",
  "Micro-Assurance Retraite et Prévoyance",
  "Micro-Assurance Sociale et Responsabilité Civile",
  "Micro-Assurance Juridique",
  "Micro-Assurance Comptable et Fiscale",
  "Micro-Assurance Administrative",
];
const formules = ["Individuelle", "Famille", "Groupe (communauté, coopérative, association…)"];
const documentsList = ["Copie de la pièce d'identité", "Photo du bénéficiaire principal", "Justificatif d'activité (si exigé)"];
const statutsPro = ["Indépendant", "Salarié", "Entrepreneur", "Autre"];

const steps = [
  { key: "profil", label: "Profil", icon: Sparkles },
  { key: "categorie", label: "Catégorie", icon: Building2 },
  { key: "metier", label: "Métier", icon: Store },
  { key: "personnel", label: "Identité", icon: User },
  { key: "assurance", label: "Couverture", icon: Shield },
  { key: "beneficiaires", label: "Bénéficiaires", icon: Users },
  { key: "documents", label: "Documents", icon: Upload },
  { key: "compte", label: "Compte", icon: KeyRound },
  { key: "validation", label: "Validation", icon: Check },
];

export function InscriptionPage() {
  const { t } = useLang();
  usePageMeta({
    title: "Inscription Souscrire à IPPOO ASSURANCE",
    description: "Créez votre compte IPPOO et souscrivez à une couverture adaptée à votre profil.",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const stepKeyToIndex = useMemo(
    () => Object.fromEntries(steps.map((s, i) => [s.key, i])) as Record<string, number>,
    [],
  );
  const urlEtape = searchParams.get("etape") ?? "profil";
  const step = Math.max(0, Math.min(steps.length - 1, stepKeyToIndex[urlEtape] ?? 0));
  const setStep = (next: number | ((s: number) => number)) => {
    const n = typeof next === "function" ? (next as (s: number) => number)(step) : next;
    const clamped = Math.max(0, Math.min(steps.length - 1, n));
    const params = new URLSearchParams(searchParams);
    params.set("etape", steps[clamped].key);
    setSearchParams(params, { replace: false });
  };
  useEffect(() => {
    if (!searchParams.get("etape")) {
      const params = new URLSearchParams(searchParams);
      params.set("etape", "profil");
      setSearchParams(params, { replace: true });
    }
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [urlEtape]);
  const [form, setForm] = useState<FormState>(() => {
    const ref = searchParams.get("ref")?.toUpperCase().trim() ?? "";
    return ref ? { ...initial, referralCode: ref } : initial;
  });
  const [submitted, setSubmitted] = useState(false);
  const [country, setCountry] = useState<AfricanCountry>(DEFAULT_COUNTRY);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const currentProfile = useMemo(() => profiles.find((p) => p.key === form.profile), [form.profile]);
  const accent = currentProfile?.color || "#0B6E4F";
  const phoneValid = isValidPhone(country, phoneDigits);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const toggleArray = (k: "sousProfil" | "couverture" | "documents", v: string) => {
    setForm((f) => {
      const arr = f[k];
      return { ...f, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });
  };

  const addBeneficiaire = () => update("beneficiaires", [...form.beneficiaires, { nom: "", age: "", lien: "" }]);
  const removeBeneficiaire = (i: number) => update("beneficiaires", form.beneficiaires.filter((_, idx) => idx !== i));
  const updateBeneficiaire = (i: number, k: keyof Beneficiaire, v: string) =>
    update("beneficiaires", form.beneficiaires.map((b, idx) => (idx === i ? { ...b, [k]: v } : b)));

  const canNext = (): boolean => {
    switch (steps[step].key) {
      case "profil": return !!form.profile;
      case "categorie": return !!form.selectedSector || !!form.selectedGroup;
      case "metier": return true;
      case "personnel": return !!(form.nom && form.dateNaissance && phoneValid && form.email);
      case "assurance": return form.couverture.length > 0 && !!form.formule;
      case "beneficiaires": return form.formule === "Individuelle" || form.beneficiaires.every((b) => b.nom && b.age && b.lien);
      case "documents": return true;
      case "compte": return !!(form.loginEmail && form.password && form.password === form.passwordConfirm && form.password.length >= 6);
      case "validation": return form.consentCGU && form.consentConfid && form.consentTraitement;
      default: return false;
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const submit = async () => {
    if (submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const phoneE164 = fullPhone(country, phoneDigits);
      const email = (form.loginEmail || form.email).trim();
      // Lien d'invitation conseiller : /inscription?ref=IPPOO-A-XXXX. Si présent,
      // l'attribution du nouveau client à ce matricule est posée côté serveur.
      const enrollerMatricule = (searchParams.get("ref") ?? "").toUpperCase().trim() || undefined;
      await apiFetch("/signup", {
        method: "POST",
        body: {
          email,
          password: form.password,
          name: form.nom.trim(),
          phone: phoneE164,
          referralCode: form.referralCode.trim() || undefined,
          enrollerMatricule,
          profile: {
            type: form.profile,
            sousProfil: form.sousProfil,
            birthDate: form.dateNaissance,
            gender: form.genre,
            nationality: form.nationalite,
            address: form.adresse,
            country: country.code,
            countryDial: country.dial,
            activite: form.activite === "Autre" ? form.activiteAutre : form.activite,
            secteur: form.secteur === "Autre" ? form.secteurAutre : form.secteur,
            entreprise: form.entreprise,
            statutPro: form.statutPro === "Autre" ? form.statutAutre : form.statutPro,
            couverture: form.couverture,
            couvertureAutre: form.couvertureAutre,
            formule: form.formule,
            beneficiaires: form.beneficiaires.map((b) => ({
              name: b.nom,
              relation: b.lien,
              birthDate: b.age ? b.age : undefined,  // âge en années, conservé tel quel
            })),
            documents: form.documents,
            documentAutre: form.documentAutre,
          },
        },
      });
      const sb = getSupabase();
      const { data: signInData, error } = await sb.auth.signInWithPassword({ email, password: form.password });
      if (error) throw new Error(error.message);
      // P10 — Enregistrement horodaté des consentements CGU / confidentialité /
      // traitement données. On le fait juste après la connexion pour avoir un
      // jeton valide. Non bloquant : si l'enregistrement échoue, on log mais
      // on n'empêche pas l'utilisateur d'accéder à son espace.
      try {
        const token = signInData.session?.access_token;
        if (token) {
          await api.recordConsents(token, [
            { type: "cgu", version: CONSENT_VERSION, granted: !!form.consentCGU },
            { type: "confidentialite", version: CONSENT_VERSION, granted: !!form.consentConfid },
            { type: "traitement", version: CONSENT_VERSION, granted: !!form.consentTraitement },
          ]);
        }
      } catch (e) {
        console.warn("Consents recording failed during signup:", e);
      }
      markRegistered();
      setSubmitted(true);
      setTimeout(() => navigate("/espace-client"), 1800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'inscription";
      setSubmitError(/already been registered|already registered|user already exists|email_taken/i.test(msg)
        ? "Cet email est déjà associé à un compte IPPOO. Connectez-vous."
        : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return <SuccessScreen accent={accent} />;
  }

  return (
    <div className="overflow-hidden bg-[#FFF8F2] min-h-[80vh]">
      {/* HERO */}
      <section className="relative pt-6 sm:pt-14 pb-4 sm:pb-8 px-3 sm:px-6 lg:px-8 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${inscriptionHeroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.72) 60%, rgba(255,255,255,0.9) 100%)",
          }}
          aria-hidden
        />
        <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-[#FF4FAE]/25 blur-3xl" aria-hidden />
        <div className="absolute top-20 -right-10 w-80 h-80 rounded-full bg-[#FFC419]/35 blur-3xl" aria-hidden />

        <div className="relative max-w-4xl mx-auto text-center">
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white"
            style={{
              background: "linear-gradient(90deg,#FF3B57,#FF7A00)",
              fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em",
            }}
          >
            {t.inscription.badge.toUpperCase()}
          </span>
          <h1 className="mt-5 text-[#0E1320]" style={{ fontSize: "clamp(2rem, 6vw, 3.4rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            {t.inscription.titleA}
            <br />
            <span className="bg-gradient-to-r from-[#FF3B57] via-[#FF7A00] to-[#FFC419] bg-clip-text text-transparent">
              {t.inscription.titleAccent}
            </span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-[#3a3a3a]" style={{ fontSize: "1rem", lineHeight: 1.6 }}>
            {t.inscription.lead}
          </p>
          {searchParams.get("ref") && /^IPPOO-A-/i.test(searchParams.get("ref") ?? "") && (
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(255,59,87,0.10)", color: "#FF3B57", fontSize: "0.85rem", fontWeight: 800, letterSpacing: "0.01em" }}>
              <span aria-hidden>🎯</span>
              Invité par le conseiller <strong className="font-extrabold">{(searchParams.get("ref") ?? "").toUpperCase()}</strong>
            </div>
          )}
        </div>
      </section>

      {/* STEPPER */}
      <section className="px-2 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="sm:bg-white sm:rounded-3xl sm:p-5 sm:shadow-[0_18px_40px_-22px_rgba(0,0,0,0.18)] sm:border sm:border-black/[0.04]">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {steps.map((s, i) => {
                const Icon = s.icon;
                const done = i < step;
                const active = i === step;
                return (
                  <div key={s.key} className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => i < step && setStep(i)}
                      disabled={i > step}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                        active ? "text-white" : done ? "text-[#0B6E4F]" : "text-[#9a9489]"
                      }`}
                      style={{
                        background: active ? accent : done ? "#E8F8EF" : "transparent",
                        fontSize: "0.75rem", fontWeight: 700,
                      }}
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{
                          background: active ? "rgba(255,255,255,0.2)" : done ? "#0B6E4F" : "#F4F2EE",
                          color: active ? "#fff" : done ? "#fff" : "#9a9489",
                        }}
                      >
                        {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                      </span>
                      <span className="hidden sm:inline whitespace-nowrap">{s.label}</span>
                    </button>
                    {i < steps.length - 1 && <span className={`w-3 h-px ${i < step ? "bg-[#0B6E4F]" : "bg-[#E8E4DC]"}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* STEP CONTENT */}
      <section className="px-3 sm:px-6 lg:px-8 py-5 sm:py-10">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="sm:bg-white sm:rounded-3xl sm:p-8 sm:shadow-[0_22px_50px_-22px_rgba(0,0,0,0.18)] sm:border sm:border-black/[0.04]"
            >
              {steps[step].key === "profil" && (
                <ProfilStep
                  form={form}
                  setProfile={(p) => {
                    update("profile", p);
                    update("sousProfil", []);
                    update("selectedSector", "");
                    update("selectedGroup", "");
                    update("classView", "secteurs");
                  }}
                />
              )}
              {steps[step].key === "categorie" && (
                <CategorieStep form={form} update={update} accent={accent} />
              )}
              {steps[step].key === "metier" && (
                <MetierStep form={form} toggleSubProfil={(v) => toggleArray("sousProfil", v)} accent={accent} />
              )}
              {steps[step].key === "personnel" && (
                <IdentiteStep
                  form={form}
                  update={update}
                  accent={accent}
                  country={country}
                  setCountry={setCountry}
                  phoneDigits={phoneDigits}
                  setPhoneDigits={setPhoneDigits}
                />
              )}
              {steps[step].key === "assurance" && (
                <CouvertureStep
                  form={form}
                  update={update}
                  toggleCouverture={(v) => toggleArray("couverture", v)}
                  accent={accent}
                  besoins={currentProfile?.besoins || []}
                />
              )}
              {steps[step].key === "beneficiaires" && (
                <BeneficiairesStep
                  form={form}
                  add={addBeneficiaire}
                  remove={removeBeneficiaire}
                  updateB={updateBeneficiaire}
                  accent={accent}
                />
              )}
              {steps[step].key === "documents" && <DocumentsStep form={form} update={update} toggle={(v) => toggleArray("documents", v)} accent={accent} />}
              {steps[step].key === "compte" && <CompteStep form={form} update={update} accent={accent} />}
              {steps[step].key === "validation" && <ValidationStep form={form} update={update} accent={accent} currentProfile={currentProfile} phoneDisplay={phoneValid ? fullPhone(country, phoneDigits) : ""} submitError={submitError} />}
            </motion.div>
          </AnimatePresence>

          {/* NAV */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={prev}
              disabled={step === 0}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border-2 border-black/10 hover:border-black/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ fontSize: "0.875rem", fontWeight: 700 }}
            >
              <ArrowLeft className="w-4 h-4" /> Précédent
            </button>
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={next}
                disabled={!canNext()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white shadow-[0_14px_30px_-12px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-transform"
                style={{ background: `linear-gradient(90deg, ${accent}, ${accent}dd)`, fontSize: "0.875rem", fontWeight: 800 }}
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!canNext() || submitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white shadow-[0_14px_30px_-12px_rgba(11,110,79,0.55)] hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-transform"
                style={{ background: "linear-gradient(90deg,#0B6E4F,#0a5f45)", fontSize: "0.875rem", fontWeight: 800 }}
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Création...</> : <>Valider mon inscription <Check className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ====================== STEPS ====================== */

function StepTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <p className="text-[#FF7A00]" style={{ fontSize: "0.6875rem", fontWeight: 800, letterSpacing: "0.12em" }}>{eyebrow}</p>
      <h2 className="mt-1.5" style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1.15 }}>{title}</h2>
      {subtitle && <p className="mt-2 text-[#5a544c]" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>{subtitle}</p>}
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-[#1a1a1a]" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
        {label} {required && <span className="text-[#FF3B57]">*</span>}
      </span>
      {children}
    </label>
  );
}

function input(extra = "") {
  return `w-full px-4 py-3 bg-[#FAF7F2] border-2 border-transparent rounded-xl focus:outline-none focus:border-[#0B6E4F] focus:bg-white transition-all ${extra}`;
}

function SelectField({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={input("appearance-none pr-10 cursor-pointer")}
      >
        <option value="">{placeholder ?? "Choisir…"}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-[#5a544c] pointer-events-none" />
    </div>
  );
}

function MultiSelectDropdown({ items, selected, onToggle, color, placeholder }: { items: string[]; selected: string[]; onToggle: (v: string) => void; color: string; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const count = items.filter((i) => selected.includes(i)).length;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-black/10 hover:border-black/30 text-left"
        style={{ fontSize: "0.8125rem", fontWeight: 700 }}
      >
        <span className="flex-1 truncate text-[#3a3a3a]">
          {count > 0 ? `${count} sélectionné${count > 1 ? "s" : ""}` : (placeholder ?? "Sélectionner…")}
        </span>
        {count > 0 && (
          <span className="px-1.5 py-0.5 rounded-full text-white" style={{ background: color, fontSize: "0.625rem", fontWeight: 800 }}>{count}</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 left-0 right-0 max-h-72 overflow-auto rounded-xl bg-white shadow-lg border border-black/10">
          {items.map((it) => {
            const isActive = selected.includes(it);
            return (
              <button
                key={it}
                type="button"
                onClick={() => onToggle(it)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#FAF7F2]"
                style={{ fontSize: "0.8125rem" }}
              >
                <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${isActive ? "" : "border-2 border-black/15"}`} style={{ background: isActive ? color : "transparent" }}>
                  {isActive && <Check className="w-3 h-3 text-white" />}
                </span>
                <span className="flex-1">{it}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Check2({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
        checked ? "bg-[#0B6E4F]/8 border-[#0B6E4F]" : "bg-[#FAF7F2] border-transparent hover:border-black/15"
      }`}
    >
      <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${checked ? "bg-[#0B6E4F]" : "bg-white border-2 border-black/15"}`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </span>
      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{label}</span>
    </button>
  );
}

function ProfilStep({ form, setProfile }: { form: FormState; setProfile: (p: ProfileKey) => void }) {
  return (
    <div>
      <StepTitle eyebrow="ÉTAPE 1" title="Quel est votre profil ?" subtitle="Choisissez la catégorie qui vous correspond le mieux pour adapter votre parcours." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {profiles.map((p) => {
          const Icon = p.icon;
          const active = form.profile === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setProfile(p.key)}
              className={`relative text-left p-3.5 sm:p-5 rounded-2xl border-2 transition-all overflow-hidden ${
                active ? "shadow-[0_18px_40px_-18px_rgba(0,0,0,0.25)]" : "hover:-translate-y-0.5"
              }`}
              style={{
                borderColor: active ? p.color : "rgba(0,0,0,0.06)",
                background: active ? `linear-gradient(160deg, ${p.soft} 0%, #fff 70%)` : "#fff",
              }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: p.soft, color: p.color }}>
                <Icon className="w-5 h-5" />
              </div>
              <p style={{ fontSize: "1rem", fontWeight: 900 }}>{p.title}</p>
              <p className="mt-0.5" style={{ fontSize: "0.75rem", fontWeight: 700, color: p.color }}>{p.short}</p>
              <p className="mt-2 text-[#5a544c]" style={{ fontSize: "0.8125rem", lineHeight: 1.55 }}>{p.desc}</p>
              {active && (
                <span className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: p.color }}>
                  <Check className="w-3.5 h-3.5 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CategorieStep({ form, update, accent }: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  accent: string;
}) {
  const current = profiles.find((p) => p.key === form.profile);
  if (!current) {
    return (
      <div>
        <StepTitle eyebrow="ÉTAPE 2" title="Catégorie" subtitle="Veuillez d'abord choisir un profil à l'étape précédente." />
      </div>
    );
  }
  const showFlux = !!(current.sectors && current.flux);
  const sectorList = (form.classView === "flux" && current.flux) ? current.flux : (current.sectors ?? []);
  const useSectors = sectorList.length > 0;
  return (
    <div>
      <StepTitle
        eyebrow="ÉTAPE 2"
        title={useSectors ? "Votre secteur d'activité" : current.sectionTitle}
        subtitle="Sélectionnez la catégorie qui correspond à votre situation."
      />

      {showFlux && (
        <div className="mb-5 inline-flex p-1 rounded-full bg-[#FAF7F2]" style={{ border: `1px solid ${current.color}30` }}>
          {[
            { key: "secteurs" as const, label: "Par secteur d'activité" },
            { key: "flux" as const, label: "Par flux économique" },
          ].map((t) => {
            const isActive = form.classView === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => { update("classView", t.key); update("selectedSector", ""); update("selectedGroup", ""); update("sousProfil", []); }}
                className="px-4 py-2 rounded-full transition-all"
                style={{
                  background: isActive ? current.color : "transparent",
                  color: isActive ? "#fff" : current.color,
                  fontSize: "0.75rem", fontWeight: 800,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {useSectors ? (
        <Field label="Secteur" required>
          <SelectField
            value={form.selectedSector}
            onChange={(v) => { update("selectedSector", v); update("sousProfil", []); }}
            options={sectorList.map((s) => s.label)}
            placeholder="Choisir votre secteur"
          />
        </Field>
      ) : (
        <Field label="Catégorie" required>
          <SelectField
            value={form.selectedGroup}
            onChange={(v) => { update("selectedGroup", v); update("sousProfil", []); }}
            options={current.groups.map((g) => g.label)}
            placeholder="Choisir votre catégorie"
          />
        </Field>
      )}

      {(form.selectedSector || form.selectedGroup) && (
        <div className="mt-5 p-4 rounded-2xl" style={{ background: `${accent}0d`, border: `1px solid ${accent}30` }}>
          <p style={{ fontSize: "0.8125rem", color: accent, fontWeight: 700 }}>
            Étape suivante : choisissez vos métiers précis dans cette catégorie.
          </p>
        </div>
      )}
    </div>
  );
}

function MetierStep({ form, toggleSubProfil, accent }: {
  form: FormState;
  toggleSubProfil: (v: string) => void;
  accent: string;
}) {
  const current = profiles.find((p) => p.key === form.profile);
  if (!current) return <div><StepTitle eyebrow="ÉTAPE 3" title="Métier" /></div>;

  const sectorList = (form.classView === "flux" && current.flux) ? current.flux : (current.sectors ?? []);
  const sector = sectorList.find((s) => s.label === form.selectedSector);

  let groups: { label: string; items: string[]; color: string }[] = [];
  if (sector) {
    groups = sector.groups.map((g) => ({ label: g.label, items: g.items, color: sector.color }));
  } else if (form.selectedGroup) {
    const g = current.groups.find((x) => x.label === form.selectedGroup);
    if (g) groups = [{ label: g.label, items: g.items, color: current.color }];
  }

  if (groups.length === 0) {
    return (
      <div>
        <StepTitle eyebrow="ÉTAPE 3" title="Métier" subtitle="Veuillez d'abord choisir une catégorie à l'étape précédente." />
      </div>
    );
  }

  return (
    <div>
      <StepTitle
        eyebrow="ÉTAPE 3"
        title="Vos métiers"
        subtitle="Sélectionnez un ou plusieurs métiers dans la liste ci-dessous (facultatif pour mieux vous conseiller)."
      />

      <div className="space-y-4">
        {groups.map((g) => {
          const count = g.items.filter((it) => form.sousProfil.includes(it)).length;
          return (
            <div key={g.label}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>{g.label}</span>
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-white" style={{ background: g.color, fontSize: "0.625rem", fontWeight: 800 }}>{count}</span>
                )}
              </div>
              <MultiSelectDropdown
                items={g.items}
                selected={form.sousProfil}
                onToggle={toggleSubProfil}
                color={g.color}
                placeholder="Choisir un ou plusieurs métiers…"
              />
            </div>
          );
        })}
      </div>

      {form.sousProfil.length === 0 && (
        <p className="mt-5 text-[#5a544c]" style={{ fontSize: "0.8125rem" }}>
          Vous ne vous retrouvez pas dans cette liste ? Vous pourrez préciser votre activité manuellement à l'étape suivante.
        </p>
      )}
    </div>
  );
}


function IdentiteStep({ form, update, country, setCountry, phoneDigits, setPhoneDigits }: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  accent: string;
  country: AfricanCountry;
  setCountry: (c: AfricanCountry) => void;
  phoneDigits: string;
  setPhoneDigits: (d: string) => void;
}) {
  return (
    <div>
      <StepTitle eyebrow="ÉTAPE 4" title="Vos informations personnelles" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nom complet" required>
          <input className={input()} value={form.nom} onChange={(e) => update("nom", e.target.value)} placeholder="Aïcha N'Dah" />
        </Field>
        <Field label="Date de naissance" required>
          <input type="date" className={input()} value={form.dateNaissance} onChange={(e) => update("dateNaissance", e.target.value)} />
        </Field>
        <Field label="Genre">
          <SelectField value={form.genre} onChange={(v) => update("genre", v)} options={["Homme", "Femme", "Autre"]} placeholder="Choisir votre genre" />
        </Field>
        <Field label="Nationalité">
          <input className={input()} value={form.nationalite} onChange={(e) => update("nationalite", e.target.value)} placeholder="Béninoise" />
        </Field>
        <div className="sm:col-span-2">
          <PhoneInput
            label="Numéro de téléphone"
            required
            country={country}
            onCountryChange={setCountry}
            digits={phoneDigits}
            onDigitsChange={setPhoneDigits}
          />
        </div>
        <Field label="Adresse e-mail" required>
          <input type="email" className={input()} value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="vous@exemple.com" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Adresse de résidence (Bénin)">
            <input className={input()} value={form.adresse} onChange={(e) => update("adresse", e.target.value)} placeholder="Quartier, commune, département" />
          </Field>
        </div>
      </div>
    </div>
  );
}

function CouvertureStep({ form, update, toggleCouverture, accent, besoins }: {
  form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  toggleCouverture: (v: string) => void; accent: string; besoins: string[];
}) {
  return (
    <div>
      <StepTitle eyebrow="ÉTAPE 5" title="Type de couverture souhaitée" subtitle="Vous pouvez sélectionner plusieurs types de couverture." />

      {besoins.length > 0 && (
        <div className="mb-5 p-4 rounded-2xl" style={{ background: `${accent}12`, border: `1px solid ${accent}30` }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 800, color: accent, letterSpacing: "0.05em" }}>
            SUGGÉRÉ POUR VOTRE PROFIL
          </p>
          <p className="mt-1 text-[#3a3a3a]" style={{ fontSize: "0.8125rem", lineHeight: 1.55 }}>
            {besoins.join(" · ")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {couvertureBase.map((c) => (
          <Check2 key={c} checked={form.couverture.includes(c)} onChange={() => toggleCouverture(c)} label={c} />
        ))}
      </div>

      <div className="mt-4">
        <Field label="Autre type de couverture">
          <input className={input()} value={form.couvertureAutre} onChange={(e) => update("couvertureAutre", e.target.value)} placeholder="Précisez si nécessaire" />
        </Field>
      </div>

      <div className="mt-6">
        <p className="mb-2" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Formule choisie *</p>
        <SelectField value={form.formule} onChange={(v) => update("formule", v)} options={formules} placeholder="Choisir une formule" />
      </div>
    </div>
  );
}

function BeneficiairesStep({ form, add, remove, updateB, accent }: {
  form: FormState; add: () => void; remove: (i: number) => void;
  updateB: (i: number, k: keyof Beneficiaire, v: string) => void; accent: string;
}) {
  const needed = form.formule !== "Individuelle";
  return (
    <div>
      <StepTitle
        eyebrow="ÉTAPE 6"
        title={needed ? "Vos bénéficiaires" : "Pas de bénéficiaire à déclarer"}
        subtitle={needed ? "Renseignez les personnes couvertes par votre formule." : "Votre formule individuelle ne nécessite pas de bénéficiaire supplémentaire."}
      />
      {needed && (
        <div className="space-y-3">
          {form.beneficiaires.map((b, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_1fr_44px] gap-2 items-end py-3 border-b border-black/5 last:border-b-0">
              <Field label={`Bénéficiaire ${i + 1} Nom`} required>
                <input className={input()} value={b.nom} onChange={(e) => updateB(i, "nom", e.target.value)} />
              </Field>
              <Field label="Âge" required>
                <input type="number" className={input()} value={b.age} onChange={(e) => updateB(i, "age", e.target.value)} />
              </Field>
              <Field label="Lien" required>
                <input className={input()} value={b.lien} onChange={(e) => updateB(i, "lien", e.target.value)} placeholder="Conjoint, enfant…" />
              </Field>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={form.beneficiaires.length === 1}
                className="w-11 h-11 rounded-xl bg-white border-2 border-black/10 flex items-center justify-center hover:border-[#FF3B57] hover:text-[#FF3B57] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-dashed transition-colors"
            style={{ borderColor: `${accent}55`, color: accent, fontSize: "0.8125rem", fontWeight: 700 }}
          >
            <Plus className="w-4 h-4" /> Ajouter un bénéficiaire
          </button>
        </div>
      )}
    </div>
  );
}

function DocumentsStep({ form, update, toggle, accent }: {
  form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  toggle: (v: string) => void; accent: string;
}) {
  return (
    <div>
      <StepTitle eyebrow="ÉTAPE 7" title="Documents à fournir" subtitle="Cochez les documents que vous pourrez transmettre à votre conseiller IPPOO." />
      <div className="space-y-2">
        {documentsList.map((d) => (
          <Check2 key={d} checked={form.documents.includes(d)} onChange={() => toggle(d)} label={d} />
        ))}
      </div>
      <div className="mt-4">
        <Field label="Autres documents">
          <input className={input()} value={form.documentAutre} onChange={(e) => update("documentAutre", e.target.value)} placeholder="Précisez si nécessaire" />
        </Field>
      </div>
      <div className="mt-5 p-4 rounded-2xl flex items-start gap-3" style={{ background: `${accent}10`, border: `1px solid ${accent}30` }}>
        <Upload className="w-5 h-5 mt-0.5 shrink-0" style={{ color: accent }} />
        <p className="text-[#3a3a3a]" style={{ fontSize: "0.8125rem", lineHeight: 1.55 }}>
          Vous pourrez transmettre vos documents par WhatsApp, en agence ou via votre Espace assuré une fois votre compte créé.
        </p>
      </div>
    </div>
  );
}

function CompteStep({ form, update, accent }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void; accent: string }) {
  const mismatch = form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm;
  const tooShort = form.password.length > 0 && form.password.length < 6;
  return (
    <div>
      <StepTitle eyebrow="ÉTAPE 8" title="Vos identifiants de connexion" subtitle="Vous pourrez ensuite vous connecter à votre Espace assuré IPPOO." />
      <div className="grid grid-cols-1 gap-4">
        <Field label="E-mail (identifiant)" required>
          <input type="email" className={input()} value={form.loginEmail} onChange={(e) => update("loginEmail", e.target.value)} placeholder="vous@exemple.com" />
        </Field>
        <Field label="Mot de passe" required>
          <input type="password" className={input()} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="6 caractères minimum" />
        </Field>
        <Field label="Confirmer le mot de passe" required>
          <input type="password" className={input()} value={form.passwordConfirm} onChange={(e) => update("passwordConfirm", e.target.value)} />
        </Field>
        {tooShort && <p className="text-[#FF3B57]" style={{ fontSize: "0.75rem" }}>Le mot de passe doit comporter au moins 6 caractères.</p>}
        {mismatch && <p className="text-[#FF3B57]" style={{ fontSize: "0.75rem" }}>Les mots de passe ne correspondent pas.</p>}
      </div>
    </div>
  );
}

function ValidationStep({ form, update, accent, currentProfile, phoneDisplay, submitError }: {
  form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  accent: string; currentProfile: ProfileDef | undefined; phoneDisplay: string; submitError: string | null;
}) {
  return (
    <div>
      <StepTitle eyebrow="ÉTAPE 9" title="Récapitulatif & consentements" subtitle="Vérifiez vos informations et validez votre inscription." />

      <div className="rounded-2xl p-5 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ background: `${accent}0d`, border: `1px solid ${accent}25` }}>
        <SummaryRow label="Profil" value={currentProfile?.title || " "} />
        <SummaryRow label="Nom" value={form.nom || " "} />
        <SummaryRow label="Téléphone" value={phoneDisplay || " "} />
        <SummaryRow label="E-mail" value={form.email || " "} />
        <SummaryRow label="Activité" value={form.activite || " "} />
        <SummaryRow label="Formule" value={form.formule || " "} />
        <SummaryRow label="Couvertures" value={form.couverture.join(", ") || " "} />
        <SummaryRow label="Bénéficiaires" value={form.formule === "Individuelle" ? "Aucun" : String(form.beneficiaires.length)} />
      </div>

      <div className="mb-5">
        <Field label="Code parrain (optionnel)">
          <input
            className={input()}
            value={form.referralCode}
            onChange={(e) => update("referralCode", e.target.value.toUpperCase())}
            placeholder="Ex. AICH-XK29"
            style={{ letterSpacing: "0.08em", fontFamily: "ui-monospace, monospace" }}
          />
        </Field>
        <p className="mt-1.5 text-[#7a7468]" style={{ fontSize: "0.75rem" }}>
          Saisissez le code d'un membre IPPOO pour qu'il bénéficie du parrainage.
        </p>
      </div>

      <div className="space-y-2">
        <Check2 checked={form.consentCGU} onChange={() => update("consentCGU", !form.consentCGU)} label={
          <>J'accepte les <Link to="/conditions-generales" className="underline" style={{ color: accent }}>conditions générales d'utilisation</Link>.</>
        } />
        <Check2 checked={form.consentConfid} onChange={() => update("consentConfid", !form.consentConfid)} label={
          <>J'accepte la <Link to="/confidentialite" className="underline" style={{ color: accent }}>politique de confidentialité</Link>.</>
        } />
        <Check2 checked={form.consentTraitement} onChange={() => update("consentTraitement", !form.consentTraitement)} label="J'autorise IPPOO ASSURANCE à traiter mes données dans le cadre de ses services d'assurance." />
      </div>

      {submitError && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700" style={{ fontSize: "0.85rem" }}>
          {submitError}
        </div>
      )}
      <p className="mt-5 text-[#5a544c]" style={{ fontSize: "0.75rem", lineHeight: 1.6 }}>
        Signature numérique : la validation de ce formulaire vaut consentement éclairé conformément à la loi béninoise n° 2017-20 portant Code du Numérique.
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[#7a7468]" style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
      <p className="mt-0.5 text-[#1a1a1a]" style={{ fontSize: "0.875rem", fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function SuccessScreen({ accent }: { accent: string }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#FFF8F2]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center bg-white rounded-3xl p-8 sm:p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.2)]"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: `${accent}15` }}>
          <Check className="w-8 h-8" style={{ color: accent }} />
        </div>
        <h2 className="mt-5" style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.01em" }}>
          Bienvenue chez IPPOO !
        </h2>
        <p className="mt-3 text-[#5a544c]" style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}>
          Votre inscription a bien été enregistrée. Un conseiller vous contactera sous 48 h pour finaliser votre couverture.
        </p>
        <div className="mt-7 flex flex-col gap-2">
          <Link to="/espace-client" className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-white" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}cc)`, fontSize: "0.875rem", fontWeight: 800 }}>
            Accéder à mon Espace assuré <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/" className="inline-flex items-center justify-center px-5 py-3 rounded-2xl border-2 border-black/10 hover:border-black/30 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 700 }}>
            Retour à l'accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
