import {
  Heart, Package, Wrench, Truck, Baby, GraduationCap, Landmark, Shield, Scale, Calculator, FileText,
} from "lucide-react";
import {
  productImageSante, productImageMarchandises, productImageEquipement, productImageTransport,
  productImageMaternite, productImageEducation, productImageRetraite, productImageSociale,
  productImageJuridique, productImageComptable, productImageAdministrative,
} from "../lib/images";

export type Category = "assurance" | "assistance";
export type CatalogProduct = {
  id: string;
  name: string;
  icon: typeof Heart;
  color: string;
  soft: string;
  category: Category;
  premium: number;
  frequency: string;
  desc: string;
  perks: string[];
  image: string;
};

// Reflète exactement le catalogue du site public (src/app/data/products.ts).
// Tarif unique IPPOO : 500 FCFA / jour × 31 jours = 15 500 FCFA / mois.
export const PRODUCTS: CatalogProduct[] = [
  {
    id: "sante", name: "Micro-Assurance Santé et Maladie", icon: Heart, color: "#FF3B57", soft: "#FFDDE2",
    category: "assurance", premium: 15500, frequency: "mensuel",
    desc: "Consultations, médicaments essentiels, hospitalisation et accompagnement préventif au quotidien.",
    perks: ["Consultations & médicaments", "Hospitalisation courante", "Suivi prévention & bien-être"],
    image: productImageSante,
  },
  {
    id: "marchandises", name: "Micro-Assurance Marchandises", icon: Package, color: "#FF7A00", soft: "#FFE8D1",
    category: "assurance", premium: 15500, frequency: "mensuel",
    desc: "Vol, incendie, inondations saisonnières et détérioration naturelle de votre stock.",
    perks: ["Vol sur le lieu de vente", "Incendie & inondation", "Reprise rapide d'activité"],
    image: productImageMarchandises,
  },
  {
    id: "equipement", name: "Micro-Assurance Équipement et Outillage", icon: Wrench, color: "#2A6BFF", soft: "#DDE7FF",
    category: "assurance", premium: 15500, frequency: "mensuel",
    desc: "Protégez vos outils contre le vol, la casse accidentelle et l'usure liée à un usage intensif.",
    perks: ["Vol & casse accidentelle", "Usure prématurée", "Réparation ou remplacement"],
    image: productImageEquipement,
  },
  {
    id: "transport", name: "Micro-Assurance Automobile", icon: Truck, color: "#2A6BFF", soft: "#DDE7FF",
    category: "assurance", premium: 15500, frequency: "mensuel",
    desc: "Voitures particulières et utilitaires : accidents, vol, pannes mécaniques et assistance routière.",
    perks: ["Accident & collision", "Vol & vandalisme", "Assistance dépannage 24/7"],
    image: productImageTransport,
  },
  {
    id: "maternite", name: "Micro-Assurance Maternité", icon: Baby, color: "#FF3B57", soft: "#FFDDE2",
    category: "assurance", premium: 15500, frequency: "mensuel",
    desc: "Suivi prénatal, accouchement sécurisé et accompagnement post-partum, kit bébé inclus.",
    perks: ["Consultations prénatales", "Accouchement en centre partenaire", "Kit bébé inclus"],
    image: productImageMaternite,
  },
  {
    id: "education", name: "Micro-Assurance Éducation", icon: GraduationCap, color: "#FF7A00", soft: "#FFE8D1",
    category: "assurance", premium: 15500, frequency: "mensuel",
    desc: "Fournitures, uniformes et frais d'inscription pour sécuriser la scolarité de vos enfants.",
    perks: ["Fournitures scolaires", "Uniformes", "Frais d'inscription"],
    image: productImageEducation,
  },
  {
    id: "retraite", name: "Micro-Assurance Retraite et Prévoyance", icon: Landmark, color: "#16B26A", soft: "#DBFBE7",
    category: "assurance", premium: 15500, frequency: "mensuel",
    desc: "Constituez un capital à votre rythme, transformé en revenu régulier au moment de la retraite.",
    perks: ["Épargne longue durée", "Capital évolutif", "Rente régulière"],
    image: productImageRetraite,
  },
  {
    id: "sociale", name: "Micro-Assurance Sociale et Responsabilité Civile", icon: Shield, color: "#16B26A", soft: "#DBFBE7",
    category: "assurance", premium: 15500, frequency: "mensuel",
    desc: "Indemnité funéraire mobilisable rapidement et responsabilité civile pour vos activités.",
    perks: ["Indemnité funéraire", "Invalidité", "Responsabilité civile"],
    image: productImageSociale,
  },
  {
    id: "juridique", name: "Micro-Assurance Juridique", icon: Scale, color: "#2A6BFF", soft: "#DDE7FF",
    category: "assistance", premium: 15500, frequency: "mensuel",
    desc: "Conseil juridique clair, orientation rapide et prise en charge des frais essentiels.",
    perks: ["Conseil avocat partenaire", "Médiation locale", "Frais juridiques essentiels"],
    image: productImageJuridique,
  },
  {
    id: "comptable", name: "Micro-Assurance Comptable et Fiscale", icon: Calculator, color: "#FF7A00", soft: "#FFE8D1",
    category: "assistance", premium: 15500, frequency: "mensuel",
    desc: "Suivi recettes/dépenses, conseils personnalisés et appui aux déclarations locales.",
    perks: ["Suivi recettes & dépenses", "Conseil fiscal", "Assistance déclarations"],
    image: productImageComptable,
  },
  {
    id: "administrative", name: "Micro-Assurance Administrative", icon: FileText, color: "#16B26A", soft: "#DBFBE7",
    category: "assistance", premium: 15500, frequency: "mensuel",
    desc: "Renouvellement de pièces, dossiers de domiciliation et autorisations professionnelles.",
    perks: ["Renouvellement de pièces", "Dossier domiciliation", "Autorisations pro"],
    image: productImageAdministrative,
  },
];

export function findProductByName(name: string): CatalogProduct | null {
  if (!name) return null;
  const exact = PRODUCTS.find((p) => p.name === name);
  if (exact) return exact;
  const lc = name.toLowerCase();
  return PRODUCTS.find((p) => lc.includes(p.id) || p.name.toLowerCase().includes(lc)) ?? null;
}
