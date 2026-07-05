import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router";

// Mémorise la position de défilement par entrée d'historique (clé de location).
// Persiste entre les changements de route car le module reste chargé.
const positions = new Map<string, number>();

// On gère nous-mêmes la restauration du scroll : on désactive celle du navigateur
// pour éviter les conflits (sauts visuels) dans cette SPA.
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

export function ScrollToTop() {
  const location = useLocation();
  const navType = useNavigationType();
  const key = location.key;

  // Suit en continu la position de la page courante pour pouvoir la restaurer
  // lors d'un retour arrière, et la sauvegarde au démontage (navigation sortante).
  useEffect(() => {
    const onScroll = () => positions.set(key, window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      positions.set(key, window.scrollY);
      window.removeEventListener("scroll", onScroll);
    };
  }, [key]);

  // À chaque navigation : retour/avance (POP) → on restaure la position
  // précédente ; nouvelle navigation (PUSH/REPLACE) → on revient en haut.
  useLayoutEffect(() => {
    if (navType === "POP") {
      const saved = positions.get(key);
      if (saved != null) {
        // Le contenu peut se peindre/charger après ce cycle : on tente la
        // restauration immédiatement puis sur les frames suivantes.
        const restore = () => window.scrollTo({ top: saved, left: 0, behavior: "auto" });
        restore();
        requestAnimationFrame(restore);
        const t = setTimeout(restore, 80);
        return () => clearTimeout(t);
      }
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [key, navType]);

  return null;
}
