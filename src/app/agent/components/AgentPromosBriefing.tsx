import { useEffect, useState } from "react";
import { Megaphone, ExternalLink } from "lucide-react";
import { api, type Promo } from "../../espace-client/api";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";

// Briefing campagnes en cours pour l'agent : reflète exactement les annonces
// publiées sur le carrousel public/dashboard client (même KV `system:promos`),
// afin que l'agent connaisse l'offre poussée au client à un instant donné.
export function AgentPromosBriefing() {
  const [items, setItems] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    api.promos()
      .then((r) => { if (!cancel) setItems((r.promos ?? []).filter((p) => p.active !== false && p.image)); })
      .catch(() => { /* silencieux : pas bloquant */ })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, []);

  if (loading) {
    return (
      <div className="mt-4 rounded-2xl p-3 animate-pulse" style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)", minHeight: 88 }} />
    );
  }
  if (!items.length) return null;

  return (
    <section className="mt-4">
      <header className="flex items-center gap-2 mb-2 px-1">
        <Megaphone className="w-4 h-4" style={{ color: "#FF3B57" }} />
        <h2 style={{ fontSize: "0.85rem", fontWeight: 800, letterSpacing: "-0.01em" }}>Campagnes en cours</h2>
        <span className="ml-auto" style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ippoo-text-muted)" }}>{items.length}</span>
      </header>
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 snap-x">
        {items.map((p) => (
          <article
            key={p.id}
            className="snap-start shrink-0 w-[260px] rounded-2xl overflow-hidden"
            style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}
          >
            <div className="aspect-[16/9] bg-black/5">
              <ImageWithFallback src={p.image} alt={p.alt || p.title || "Annonce"} className="w-full h-full object-cover block" />
            </div>
            <div className="p-3 space-y-1">
              <p className="line-clamp-2" style={{ fontSize: "0.82rem", fontWeight: 800, lineHeight: 1.25 }}>
                {p.title || p.alt}
              </p>
              {p.description && (
                <p className="line-clamp-2" style={{ fontSize: "0.74rem", color: "var(--ippoo-text-muted)", lineHeight: 1.35 }}>
                  {p.description}
                </p>
              )}
              {p.ctaLabel && p.to && (
                <div className="pt-1.5">
                  <a
                    href={p.to.startsWith("http") ? p.to : `${p.to}`}
                    target={p.to.startsWith("http") ? "_blank" : undefined}
                    rel={p.to.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
                    style={{ background: "#FF3B57", color: "#fff", fontSize: "0.72rem", fontWeight: 800 }}
                  >
                    {p.ctaLabel}
                    {p.to.startsWith("http") && <ExternalLink className="w-3 h-3" />}
                  </a>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
