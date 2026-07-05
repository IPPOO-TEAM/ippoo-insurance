import { Link } from "react-router";
import { motion } from "motion/react";
import { ChevronRight, FileText, Download } from "lucide-react";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

interface LegalPageProps {
  title: string;
  subtitle: string;
  lastUpdate: string;
  sections: LegalSection[];
  downloadLabel?: string;
}

export function LegalPage({ title, subtitle, lastUpdate, sections, downloadLabel }: LegalPageProps) {
  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0d1117] via-[#0d1117] to-[#0B6E4F]/30 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <nav className="flex items-center gap-1.5 text-white/40 mb-6" style={{ fontSize: "0.75rem" }}>
            <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/70">{title}</span>
          </nav>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full mb-4">
              <FileText className="w-3.5 h-3.5" />
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Information légale</span>
            </div>
            <h1 className="mb-3" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              {title}
            </h1>
            <p className="text-white/70 max-w-2xl" style={{ fontSize: "1rem", lineHeight: 1.6 }}>{subtitle}</p>
            <p className="text-white/40 mt-4" style={{ fontSize: "0.75rem" }}>Dernière mise à jour : {lastUpdate}</p>
          </motion.div>
        </div>
      </section>

      {/* Content with sticky TOC */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid lg:grid-cols-[260px_1fr] gap-10">
          {/* TOC */}
          <aside className="lg:sticky lg:top-32 self-start">
            <p className="mb-4 text-foreground/50" style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Sommaire
            </p>
            <ul className="space-y-1.5 border-l border-foreground/10 pl-4">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block py-1 text-foreground/60 hover:text-[#0B6E4F] transition-colors"
                    style={{ fontSize: "0.8125rem", lineHeight: 1.45 }}
                  >
                    <span className="text-foreground/30 mr-2">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
            {downloadLabel && (
              <button
                type="button"
                onClick={() => window.print()}
                className="mt-6 inline-flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                style={{ fontSize: "0.8125rem", fontWeight: 600 }}
              >
                <Download className="w-3.5 h-3.5" />
                {downloadLabel}
              </button>
            )}
          </aside>

          {/* Body */}
          <article className="bg-white rounded-3xl border border-foreground/[0.06] shadow-sm p-7 sm:p-10 lg:p-12 space-y-10">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-[#0B6E4F]/40" style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.1em" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, lineHeight: 1.3, letterSpacing: "-0.01em" }}>{s.title}</h2>
                </div>
                <div className="prose-legal text-foreground/75 space-y-4" style={{ fontSize: "0.9375rem", lineHeight: 1.75 }}>
                  {s.body}
                </div>
              </section>
            ))}

            <div className="pt-6 border-t border-foreground/[0.06] text-foreground/40 flex flex-wrap gap-x-6 gap-y-2" style={{ fontSize: "0.75rem" }}>
              <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
              <Link to="/confidentialite" className="hover:text-foreground transition-colors">Politique de confidentialité</Link>
              <Link to="/conditions-generales" className="hover:text-foreground transition-colors">Conditions générales</Link>
              <Link to="/mediateur" className="hover:text-foreground transition-colors">Médiation & réclamations</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Nous contacter</Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
