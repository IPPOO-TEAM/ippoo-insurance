/**
 * Centralized image registry — single source of truth for every remote asset
 * (Unsplash hero, product, decorative) used across the platform.
 *
 * Why: avoid scattering raw URLs across components/data files. Consumers
 * import named constants from here; replacing or pre-bundling an image
 * becomes a one-line change instead of a grep-and-replace.
 *
 * How to use:
 *   import { productImageSante } from "../lib/images";
 *   <ImageWithFallback src={productImageSante} alt="…" />
 */

// ─── Hero / décor public site ─────────────────────────────────────────────
export const heroAboutTeam =
  "https://images.unsplash.com/photo-1663250934966-916a88f543e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwYnVzaW5lc3MlMjB0ZWFtJTIwb2ZmaWNlJTIwYWJpZGphbnxlbnwxfHx8fDE3Nzk1NjcxNjd8MA&ixlib=rb-4.1.0&q=80&w=1080";

export const heroHomeStackA =
  "https://images.unsplash.com/photo-1611432579402-7037e3e2c1e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80";

export const shellHeaderTexture =
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=60";

// ─── Catalogue produit (espace client - cartes compactes 1080w) ───────────
export const productImageSante =
  "https://images.unsplash.com/photo-1643297654416-05795d62e39c?auto=format&fit=crop&w=1080&q=80";
export const productImageMarchandises =
  "https://images.unsplash.com/photo-1655682614757-a9a33fa45c93?auto=format&fit=crop&w=1080&q=80";
export const productImageEquipement =
  "https://images.unsplash.com/photo-1687422810663-c316494f725a?auto=format&fit=crop&w=1080&q=80";
export const productImageTransport =
  "https://images.unsplash.com/photo-1536139414673-1b479272ea38?auto=format&fit=crop&w=1080&q=80";
export const productImageMaternite =
  "https://images.unsplash.com/photo-1681934518600-537956d6efee?auto=format&fit=crop&w=1080&q=80";
export const productImageEducation =
  "https://images.unsplash.com/photo-1627423896085-e3e694d88e40?auto=format&fit=crop&w=1080&q=80";
export const productImageRetraite =
  "https://images.unsplash.com/photo-1666885181643-0d486b2aa013?auto=format&fit=crop&w=1080&q=80";
export const productImageSociale =
  "https://images.unsplash.com/photo-1694286066814-193f5674ba98?auto=format&fit=crop&w=1080&q=80";
export const productImageJuridique =
  "https://images.unsplash.com/photo-1604783125462-37d81c7385e6?auto=format&fit=crop&w=1080&q=80";
export const productImageComptable =
  "https://images.unsplash.com/photo-1687422811062-a966b55cb217?auto=format&fit=crop&w=1080&q=80";
export const productImageAdministrative =
  "https://images.unsplash.com/photo-1573496528298-f0e9d3c7ce55?auto=format&fit=crop&w=1080&q=80";

// ─── Catalogue produit (site public - fiches détaillées 1080w riches) ─────
export const productHeroSante =
  "https://images.unsplash.com/photo-1576669801945-7a346954da5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwbWVkaWNhbCUyMGNvbnN1bHRhdGlvbiUyMGhlYWx0aGNhcmV8ZW58MXx8fHwxNzcxMjY5MTYyfDA&ixlib=rb-4.1.0&q=80&w=1080";
export const productHeroMarchandises =
  "https://images.unsplash.com/photo-1760726743536-019e9e2b06b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwbWFya2V0JTIwc3RhbGwlMjBtZXJjaGFuZGlzZSUyMGdvb2RzfGVufDF8fHx8MTc3MTI2OTE2Mnww&ixlib=rb-4.1.0&q=80&w=1080";
export const productHeroEquipement =
  "https://images.unsplash.com/photo-1721508490084-1b1de5b230d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwYXJ0aXNhbiUyMGNyYWZ0c21hbiUyMHdvcmtzaG9wJTIwdG9vbHN8ZW58MXx8fHwxNzcxMjY5MTYzfDA&ixlib=rb-4.1.0&q=80&w=1080";
export const productHeroTransport =
  "https://images.unsplash.com/photo-1766087124181-0677409b73eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3RvcmN5Y2xlJTIwdGF4aSUyMHRyYW5zcG9ydCUyMGFmcmljYXxlbnwxfHx8fDE3NzEyNjkxNjN8MA&ixlib=rb-4.1.0&q=80&w=1080";
export const productHeroMaternite =
  "https://images.unsplash.com/photo-1644222736030-f2ee4b799d36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwcHJlZ25hbnQlMjB3b21hbiUyMG1hdGVybml0eXxlbnwxfHx8fDE3NzEyNjc3OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080";
export const productHeroEducation =
  "https://images.unsplash.com/photo-1666281269793-da06484657e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwc2Nob29sJTIwY2hpbGRyZW4lMjBlZHVjYXRpb258ZW58MXx8fHwxNzcxMjIyMDYyfDA&ixlib=rb-4.1.0&q=80&w=1080";
export const productHeroRetraite =
  "https://images.unsplash.com/photo-1718010588689-9806ce642d39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwc2VuaW9yJTIwZWxkZXJseSUyMHJldGlyZW1lbnR8ZW58MXx8fHwxNzcxMjY5MTY0fDA&ixlib=rb-4.1.0&q=80&w=1080";
export const productHeroSociale =
  "https://images.unsplash.com/photo-1728957422037-eafc47af6f18?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmFtaWx5JTIwY29tbXVuaXR5JTIwc29saWRhcml0eXxlbnwxfHx8fDE3NzEyNjkxNjV8MA&ixlib=rb-4.1.0&q=80&w=1080";
export const productHeroJuridique =
  "https://images.unsplash.com/photo-1759493701876-216808395fa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWdhbCUyMGp1c3RpY2UlMjBjb25zdWx0YXRpb24lMjBhZnJpY2F8ZW58MXx8fHwxNzcxMjY5MTY1fDA&ixlib=rb-4.1.0&q=80&w=1080";
export const productHeroComptable =
  "https://images.unsplash.com/photo-1579940905965-a397bd496fd5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY2NvdW50aW5nJTIwYm9va2tlZXBpbmclMjBzbWFsbCUyMGJ1c2luZXNzJTIwYWZyaWNhfGVufDF8fHx8MTc3MTI2OTE2Nnww&ixlib=rb-4.1.0&q=80&w=1080";
export const productHeroAdministrative =
  "https://images.unsplash.com/photo-1768875820800-1c2a6f2e8280?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZG1pbmlzdHJhdGl2ZSUyMGRvY3VtZW50cyUyMHBhcGVyd29yayUyMG9mZmljZXxlbnwxfHx8fDE3NzEyNjkxNjZ8MA&ixlib=rb-4.1.0&q=80&w=1080";
