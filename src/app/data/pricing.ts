// =========================================================================
// Couche de tarification & catalogue unifiée.
//
// Les offres (catalogue produits), tarifs des formules et fiches de
// renseignement sont définis statiquement (productCatalog.ts /
// productDetails.ts) mais entièrement SURCHARGEABLES et EXTENSIBLES depuis le
// back office (clé KV `system:pricing`). On peut :
//   • éditer les champs d'une offre (nom, catégorie, prix, image, perks…)
//   • éditer formules + fiche de renseignement (garanties)
//   • masquer une offre (hidden)
//   • AJOUTER de nouvelles offres (id hors catalogue statique, added=true)
// Ce module récupère les overrides une fois, les met en cache, et fusionne le
// tout pour que TOUTE la plateforme lise les mêmes valeurs.
// =========================================================================
import { useEffect, useReducer } from "react";
import {
  Heart, Package, Wrench, Truck, Baby, GraduationCap, Landmark, Shield,
  Scale, Calculator, FileText, Sparkles, Star, Briefcase, Home, Car,
  HeartPulse, Wallet, Umbrella, type LucideIcon,
} from "lucide-react";
import { PRODUCTS, type CatalogProduct } from "./productCatalog";
import { productDetails, type ProductDetails } from "./productDetails";
import { api, type PricingMap, type ProductPricing } from "../espace-client/api";

// ---- Résolution d'icônes (nom -> composant) pour les offres éditées/ajoutées
export const PRODUCT_ICONS: Record<string, LucideIcon> = {
  Heart, Package, Wrench, Truck, Baby, GraduationCap, Landmark, Shield,
  Scale, Calculator, FileText, Sparkles, Star, Briefcase, Home, Car,
  HeartPulse, Wallet, Umbrella,
};
export const PRODUCT_ICON_NAMES = Object.keys(PRODUCT_ICONS);
function iconByName(name?: string): LucideIcon {
  return (name && PRODUCT_ICONS[name]) || Shield;
}
// Retrouve le nom d'icône d'un produit statique (pour pré-remplir l'éditeur).
function iconNameOf(p: CatalogProduct): string {
  const hit = PRODUCT_ICON_NAMES.find((n) => PRODUCT_ICONS[n] === p.icon);
  return hit ?? "Shield";
}

// ---- Store module (singleton, partagé entre arbres de routes) ----
let cache: PricingMap = {};
let loaded = false;
let inflight: Promise<void> | null = null;
const subscribers = new Set<() => void>();

export function loadPricing(force = false): Promise<void> {
  if (inflight && !force) return inflight;
  if (loaded && !force) return Promise.resolve();
  inflight = (async () => {
    try {
      const { pricing } = await api.pricing();
      cache = pricing && typeof pricing === "object" ? pricing : {};
    } catch {
      // Réseau indisponible : on garde les valeurs statiques par défaut.
    } finally {
      loaded = true;
      inflight = null;
      subscribers.forEach((fn) => fn());
    }
  })();
  return inflight;
}

/** Met à jour le cache localement (après une diffusion depuis l'admin). */
export function setPricingCache(next: PricingMap) {
  cache = next && typeof next === "object" ? next : {};
  loaded = true;
  subscribers.forEach((fn) => fn());
}

// ---- Construit un CatalogProduct depuis un override (offre ajoutée) ----
function overrideToCatalog(id: string, o: ProductPricing): CatalogProduct {
  return {
    id,
    name: o.name || id,
    icon: iconByName(o.icon),
    color: o.color || "#2A6BFF",
    soft: o.soft || "#DDE7FF",
    category: o.category || "assurance",
    premium: typeof o.premium === "number" ? o.premium : 15500,
    frequency: o.frequency || "mensuel",
    desc: o.desc || "",
    perks: Array.isArray(o.perks) ? o.perks : [],
    image: o.image || "",
  };
}

// ---- Fusion defaults + overrides + offres ajoutées ----
export function mergeCatalog(over: PricingMap = cache): CatalogProduct[] {
  // 1) Offres statiques surchargées (et masquables)
  const staticIds = new Set(PRODUCTS.map((p) => p.id));
  const merged: CatalogProduct[] = [];
  for (const p of PRODUCTS) {
    const o = over[p.id];
    if (o?.hidden) continue;
    merged.push(
      o
        ? {
            ...p,
            name: o.name || p.name,
            category: o.category || p.category,
            icon: o.icon ? iconByName(o.icon) : p.icon,
            color: o.color || p.color,
            soft: o.soft || p.soft,
            image: o.image || p.image,
            desc: o.desc || p.desc,
            perks: o.perks && o.perks.length ? o.perks : p.perks,
            premium: typeof o.premium === "number" ? o.premium : p.premium,
            frequency: o.frequency || p.frequency,
          }
        : p,
    );
  }
  // 2) Offres AJOUTÉES depuis l'admin (id hors catalogue statique)
  for (const [id, o] of Object.entries(over)) {
    if (staticIds.has(id) || o?.hidden) continue;
    if (o?.added || o?.name) merged.push(overrideToCatalog(id, o));
  }
  return merged;
}

const EMPTY_DETAILS: ProductDetails = {
  garanties: [], exclusions: [], delaiCarence: "", formules: [],
  exempleSinistre: { profil: "", histoire: "", indemnisation: "", delai: "" },
};

export function mergeDetails(over: PricingMap = cache): Record<string, ProductDetails> {
  const out: Record<string, ProductDetails> = {};
  // Statiques (surchargés)
  for (const [id, d] of Object.entries(productDetails)) {
    const o = over[id];
    out[id] = o
      ? {
          ...d,
          formules: o.formules && o.formules.length ? o.formules : d.formules,
          garanties: o.garanties && o.garanties.length ? o.garanties : d.garanties,
          delaiCarence: o.delaiCarence || d.delaiCarence,
        }
      : d;
  }
  // Offres ajoutées : on synthétise une fiche depuis l'override.
  for (const [id, o] of Object.entries(over)) {
    if (out[id]) continue;
    if (o?.added || o?.formules || o?.garanties) {
      out[id] = {
        ...EMPTY_DETAILS,
        delaiCarence: o.delaiCarence || "",
        formules: o.formules ?? [],
        garanties: o.garanties ?? [],
      };
    }
  }
  return out;
}

export function mergedCatalog(): CatalogProduct[] {
  return mergeCatalog(cache);
}
export function mergedDetails(): Record<string, ProductDetails> {
  return mergeDetails(cache);
}
export function mergedProductById(id: string): CatalogProduct | null {
  return mergeCatalog(cache).find((p) => p.id === id) ?? null;
}
export function mergedProductByName(name: string): CatalogProduct | null {
  if (!name) return null;
  const list = mergeCatalog(cache);
  const exact = list.find((p) => p.name === name);
  if (exact) return exact;
  const lc = name.toLowerCase();
  return list.find((p) => lc.includes(p.id) || p.name.toLowerCase().includes(lc)) ?? null;
}

export function rawPricing(): PricingMap {
  return cache;
}

// ---- Hook React ----
export interface UsePricing {
  catalog: CatalogProduct[];
  details: Record<string, ProductDetails>;
  byId: (id: string) => CatalogProduct | null;
  byName: (name: string) => CatalogProduct | null;
  loaded: boolean;
}

export function usePricing(): UsePricing {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    subscribers.add(force);
    void loadPricing();
    return () => {
      subscribers.delete(force);
    };
  }, []);
  return {
    catalog: mergeCatalog(cache),
    details: mergeDetails(cache),
    byId: mergedProductById,
    byName: mergedProductByName,
    loaded,
  };
}

// ---- Aide à l'éditeur admin ----
// Brouillon éditable complet (valeurs effectives) : offres statiques + offres
// ajoutées, avec tous les champs d'offre + formules + garanties.
export interface PricingDraftRow {
  id: string;
  name: string;
  shortName: string;
  category: CatalogProduct["category"];
  icon: string;
  color: string;
  soft: string;
  image: string;
  desc: string;
  perks: string[];
  premium: number;
  frequency: string;
  delaiCarence: string;
  hidden: boolean;
  added: boolean;
  formules: ProductDetails["formules"];
  garanties: ProductDetails["garanties"];
}

export function buildPricingDraft(over: PricingMap = cache): PricingDraftRow[] {
  const rows: PricingDraftRow[] = [];
  const staticIds = new Set(PRODUCTS.map((p) => p.id));

  for (const p of PRODUCTS) {
    const o = over[p.id];
    const d = productDetails[p.id];
    rows.push({
      id: p.id,
      name: o?.name || p.name,
      shortName: o?.shortName || (p as any).shortName || p.name,
      category: o?.category || p.category,
      icon: o?.icon || iconNameOf(p),
      color: o?.color || p.color,
      soft: o?.soft || p.soft,
      image: o?.image || p.image,
      desc: o?.desc || p.desc,
      perks: (o?.perks && o.perks.length ? o.perks : p.perks).slice(),
      premium: typeof o?.premium === "number" ? o.premium : p.premium,
      frequency: o?.frequency || p.frequency,
      delaiCarence: o?.delaiCarence || d?.delaiCarence || "",
      hidden: !!o?.hidden,
      added: false,
      formules: (o?.formules && o.formules.length ? o.formules : d?.formules ?? []).map((f) => ({ ...f })),
      garanties: (o?.garanties && o.garanties.length ? o.garanties : d?.garanties ?? []).map((g) => ({ ...g })),
    });
  }

  // Offres ajoutées depuis l'admin
  for (const [id, o] of Object.entries(over)) {
    if (staticIds.has(id)) continue;
    if (!(o?.added || o?.name)) continue;
    rows.push({
      id,
      name: o.name || id,
      shortName: o.shortName || o.name || id,
      category: o.category || "assurance",
      icon: o.icon || "Shield",
      color: o.color || "#2A6BFF",
      soft: o.soft || "#DDE7FF",
      image: o.image || "",
      desc: o.desc || "",
      perks: Array.isArray(o.perks) ? o.perks.slice() : [],
      premium: typeof o.premium === "number" ? o.premium : 15500,
      frequency: o.frequency || "mensuel",
      delaiCarence: o.delaiCarence || "",
      hidden: !!o.hidden,
      added: true,
      formules: (o.formules ?? []).map((f) => ({ ...f })),
      garanties: (o.garanties ?? []).map((g) => ({ ...g })),
    });
  }

  return rows;
}

/** Transforme le brouillon de l'éditeur en carte d'overrides à diffuser. */
export function draftToPricingMap(rows: PricingDraftRow[]): PricingMap {
  const map: PricingMap = {};
  for (const r of rows) {
    const o: ProductPricing = {
      premium: r.premium,
      frequency: r.frequency,
      delaiCarence: r.delaiCarence,
      name: r.name,
      shortName: r.shortName,
      category: r.category,
      icon: r.icon,
      color: r.color,
      soft: r.soft,
      image: r.image,
      desc: r.desc,
      perks: r.perks,
      hidden: r.hidden,
      added: r.added,
      formules: r.formules.map((f) => ({
        nom: f.nom, cotisation: f.cotisation, description: f.description, highlight: !!f.highlight,
      })),
      garanties: r.garanties.map((g) => ({
        risque: g.risque, priseEnCharge: g.priseEnCharge, plafond: g.plafond, franchise: g.franchise,
      })),
    };
    map[r.id] = o;
  }
  return map;
}

/** Crée une ligne d'offre vierge (ajout depuis l'admin). */
export function blankOfferRow(id: string): PricingDraftRow {
  return {
    id,
    name: "Nouvelle offre",
    shortName: "Nouvelle offre",
    category: "assurance",
    icon: "Shield",
    color: "#2A6BFF",
    soft: "#DDE7FF",
    image: "",
    desc: "",
    perks: [],
    premium: 15500,
    frequency: "mensuel",
    delaiCarence: "",
    hidden: false,
    added: true,
    formules: [],
    garanties: [],
  };
}
