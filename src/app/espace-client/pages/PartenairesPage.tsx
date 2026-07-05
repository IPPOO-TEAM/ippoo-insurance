import { useEffect, useMemo, useState } from "react";
import { MapPin, Phone, Navigation, Stethoscope, Pill, Building2, Loader2, Search } from "lucide-react";
import { useApiData } from "../hooks";
import { api, type Partner } from "../api";
import { getCurrentPosition, distanceKm, openInMaps, hapticTap } from "../native";

type PartnerKind = Partner["kind"];

const KIND_META: Record<PartnerKind, { label: string; icon: any; color: string; bg: string }> = {
  clinique: { label: "Clinique", icon: Stethoscope, color: "#2A6BFF", bg: "#E0EBFF" },
  pharmacie: { label: "Pharmacie", icon: Pill, color: "#16B26A", bg: "#DBFBE7" },
  hopital: { label: "Hôpital", icon: Building2, color: "#FF3B57", bg: "#FFE2E7" },
};

export function PartenairesPage() {
  const meQ = useApiData((t) => api.me(t));
  const [partners, setPartners] = useState<Partner[]>([]);
  useEffect(() => { api.partners().then((r) => setPartners(r.partners ?? [])).catch(() => {}); }, []);
  const profile = meQ.data?.profile;
  const userCity = (profile?.city ?? "").trim();
  const userDept = (profile?.department ?? "").trim();

  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | PartnerKind>("all");
  const [query, setQuery] = useState("");
  const [queryTouched, setQueryTouched] = useState(false);

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (!queryTouched && userCity && !query) setQuery(userCity);
  }, [userCity, queryTouched, query]);

  async function requestLocation() {
    setLocating(true);
    setGeoError(null);
    try {
      const p = await getCurrentPosition();
      setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
    } catch (err: any) {
      setGeoError(err?.code === 1 ? "Autorisez la position pour voir les partenaires les plus proches." : (err?.message ?? "Position indisponible"));
    } finally {
      setLocating(false);
    }
  }

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchCity = (p: Partner) =>
      (userCity && p.city.toLowerCase().includes(userCity.toLowerCase())) ||
      (userDept && p.city.toLowerCase().includes(userDept.toLowerCase()));
    return partners
      .filter((p) => (filter === "all" ? true : p.kind === filter))
      .filter((p) => (q ? `${p.name} ${p.city} ${p.address}`.toLowerCase().includes(q) : true))
      .map((p) => ({ ...p, distance: pos ? distanceKm(pos, p) : null, nearProfile: matchCity(p) }))
      .sort((a, b) => {
        if (a.nearProfile !== b.nearProfile) return a.nearProfile ? -1 : 1;
        if (a.distance == null && b.distance == null) return a.name.localeCompare(b.name);
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });
  }, [pos, filter, query, userCity, userDept, partners]);

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="t-title1">Partenaires santé</h1>
        <p className="mt-1 text-[#666]" style={{ fontSize: "0.9rem" }}>
          Cliniques, pharmacies et hôpitaux du réseau IPPOO autour de vous.
          {userCity ? <> Centré sur <strong>{userCity}{userDept ? ` (${userDept})` : ""}</strong> selon votre profil.</> : null}
        </p>
      </header>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888]" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setQueryTouched(true); }}
            placeholder="Rechercher un partenaire ou une ville..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57]"
            style={{ fontSize: "0.85rem" }}
          />
        </div>
        <button
          onClick={requestLocation}
          disabled={locating}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white disabled:opacity-60"
          style={{ background: "#FF3B57", fontSize: "0.82rem", fontWeight: 800 }}
        >
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
          {pos ? "Actualiser ma position" : "Me localiser"}
        </button>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {([
          { id: "all", label: "Tous" },
          { id: "clinique", label: "Cliniques" },
          { id: "pharmacie", label: "Pharmacies" },
          { id: "hopital", label: "Hôpitaux" },
        ] as const).map((t) => {
          const active = filter === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as any)}
              className="px-4 py-2 rounded-full whitespace-nowrap transition-colors"
              style={{
                background: active ? "#0E1320" : "white",
                color: active ? "white" : "#0E1320",
                border: active ? "none" : "1px solid rgba(0,0,0,0.08)",
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {geoError && (
        <div className="mb-5 p-3 rounded-xl bg-[#FFF1D9] border border-[#FF7A00]/20 text-[#7A4500]" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
          {geoError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((p) => {
          const meta = KIND_META[p.kind];
          const Icon = meta.icon;
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
          const openNative = () => { hapticTap(); try { openInMaps(p.lat, p.lng, p.name); } catch { window.open(mapsUrl, "_blank", "noopener"); } };
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                  <Icon className="w-5 h-5" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate" style={{ fontSize: "1rem", fontWeight: 900 }}>{p.name}</p>
                    {p.distance != null && (
                      <span
                        className="shrink-0 px-2 py-0.5 rounded-full"
                        style={{ background: meta.bg, color: meta.color, fontSize: "0.7rem", fontWeight: 800 }}
                      >
                        {p.distance < 1 ? `${Math.round(p.distance * 1000)} m` : `${p.distance.toFixed(1)} km`}
                      </span>
                    )}
                  </div>
                  <p className="text-[#666] mt-0.5" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em" }}>
                    {meta.label.toUpperCase()} · {p.hours}
                  </p>
                </div>
              </div>
              <p className="text-[#444] flex items-start gap-2 mb-3" style={{ fontSize: "0.85rem" }}>
                <MapPin className="w-4 h-4 mt-0.5 text-[#888] shrink-0" />
                <span>{p.address}, {p.city}</span>
              </p>
              <div className="flex gap-2 mt-auto">
                <a
                  href={`tel:${p.phone.replace(/\s+/g, "")}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border-2 border-black/10 hover:border-[#FF3B57] hover:text-[#FF3B57]"
                  style={{ fontSize: "0.8rem", fontWeight: 700 }}
                >
                  <Phone className="w-3.5 h-3.5" /> Appeler
                </a>
                <button
                  type="button"
                  onClick={openNative}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-white active:opacity-80"
                  style={{ background: "#FF3B57", fontSize: "0.8rem", fontWeight: 800 }}
                >
                  <Navigation className="w-3.5 h-3.5" /> Itinéraire
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center border border-black/5">
          <p className="text-[#666]">Aucun partenaire ne correspond à votre recherche.</p>
        </div>
      )}
    </div>
  );
}
