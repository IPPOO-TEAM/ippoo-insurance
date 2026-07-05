import { Outlet } from "react-router";
import { Component, type ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";
import { CookieConsent } from "./CookieConsent";
import { ScrollToTop } from "./ScrollToTop";
import { usePageMeta, useOrganizationLD } from "../lib/usePageMeta";

class RouteErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: unknown) { console.error("Render error:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }} className="mb-3">Une erreur est survenue</h1>
          <p className="text-muted-foreground mb-4" style={{ fontSize: "0.875rem" }}>
            Détail technique (console pour la stack complète) :
          </p>
          <pre className="bg-[#0d1117] text-white p-4 rounded-xl overflow-auto" style={{ fontSize: "0.75rem" }}>
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Layout() {
  // Default meta overridden per page by usePageMeta
  usePageMeta({
    title: "Micro-assurance & assistance pour l'informel en Afrique",
    description:
      "IPPOO ASSURANCE accompagne les actifs de l'informel avec des solutions de micro-assurance simples, accessibles et adaptées : santé, marchandises, transport, maternité, retraite, juridique et plus.",
  });
  useOrganizationLD();

  return (
    <div className="min-h-screen flex flex-col ippoo-page-bg">
      {/* Skip link (a11y) */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-ippoo-green focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-lg"
        style={{ fontSize: "0.8125rem", fontWeight: 700 }}
      >
        Aller au contenu principal
      </a>
      <ScrollToTop />
      <Header />
      <main id="main" className="flex-1" tabIndex={-1}>
        <RouteErrorBoundary>
          <Outlet />
        </RouteErrorBoundary>
      </main>
      <Footer />
      <WhatsAppButton />
      <CookieConsent />
    </div>
  );
}
