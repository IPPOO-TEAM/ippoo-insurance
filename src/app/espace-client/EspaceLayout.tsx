import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth, isAgentUser } from "./AuthContext";
import { BottomBar } from "./BottomBar";
import { PullToRefresh } from "./PullToRefresh";
import { RouteTransition } from "./RouteTransition";
import { AppLock } from "./AppLock";
import { queryClient } from "./queryClient";
import { ThemeProvider } from "./ThemeContext";
import { I18nProvider } from "./i18n";
import { setupPWA, canInstallPWA, onInstallAvailable, promptInstallPWA } from "./pwa";
import { Toaster } from "sonner";
import { SkeletonStyles } from "./Skeleton";
import { Header } from "../components/Header";
import { ScrollToTop } from "../components/ScrollToTop";
import { ToastNavigator } from "./toast";
import { NotificationsRealtime } from "./NotificationsRealtime";
import { OfflineBanner } from "./components/OfflineBanner";
import { ReConsentGate } from "./ReConsentGate";
import { WhatsAppButton } from "../components/WhatsAppButton";
import installIcon from "../../imports/INSURANCE.png";

function InstallBanner() {
  const [show, setShow] = useState(canInstallPWA());
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("ippoo:pwa:dismissed") === "1"; } catch { return false; }
  });
  useEffect(() => onInstallAvailable(setShow), []);
  if (!show || dismissed) return null;
  return (
    <div style={{ padding: "12px 16px 0" }}>
      <div
        className="flex items-center"
        style={{
          gap: "12px",
          padding: "12px",
          background: "var(--surface-card)",
          border: "1px solid var(--line-hairline)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <div
          className="flex items-center justify-center shrink-0 overflow-hidden"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "var(--radius-sm)",
            background: "#FFFFFF",
            border: "1px solid var(--line-hairline)",
          }}
        >
          <img src={installIcon} alt="IPPOO Insurance" className="w-full h-full object-contain" />
        </div>
        <p className="flex-1" style={{ fontSize: "14px", fontWeight: 500, color: "var(--ippoo-text)", lineHeight: 1.35 }}>
          Installer IPPOO pour un accès rapide.
        </p>
        <button
          onClick={async () => { await promptInstallPWA(); }}
          className="active:opacity-80"
          style={{
            padding: "8px 14px",
            borderRadius: "var(--radius-sm)",
            background: "var(--accent-primary)",
            color: "var(--accent-on-primary)",
            fontSize: "13px",
            fontWeight: 600,
            minHeight: "36px",
          }}
        >
          Installer
        </button>
        <button
          onClick={() => { setDismissed(true); try { localStorage.setItem("ippoo:pwa:dismissed", "1"); } catch {} }}
          className="active:opacity-60"
          style={{
            padding: "8px",
            color: "var(--ippoo-text-muted)",
            fontSize: "13px",
            fontWeight: 500,
            minHeight: "36px",
          }}
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}

function ProtectedShell() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { setupPWA(); }, []);
  const userName = (user?.user_metadata?.name as string | undefined) ?? user?.email ?? "";
  const onLogout = async () => { await signOut(); navigate("/espace-client/connexion"); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]">
        <div className="w-10 h-10 border-4 border-[#FF3B57] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/espace-client/connexion" replace />;
  // Agents must never appear in the espace client. If somehow a conseiller
  // session has been minted (legacy, manual creation), redirect to /agent.
  if (isAgentUser(user)) return <Navigate to="/agent" replace />;

  return (
    <AppLock>

    <div
      className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden pt-[calc(env(safe-area-inset-top,0px)+64px)] lg:pt-[calc(env(safe-area-inset-top,0px)+76px)]"
      style={{ background: "var(--surface-app)" }}
    >
      <ScrollToTop />
      <ToastNavigator />
      <NotificationsRealtime />
      <OfflineBanner />
      <ReConsentGate />
      <Header appMode userName={userName} onLogout={onLogout} />
      <InstallBanner />
      <main className="flex-1 min-w-0 overflow-x-hidden px-2 sm:px-3 lg:px-4 pt-[6px] lg:pt-4 pb-[calc(var(--nav-bottom-h)+env(safe-area-inset-bottom,0px)+16px)]">
        <PullToRefresh>
          <RouteTransition>
            <Outlet />
          </RouteTransition>
        </PullToRefresh>
      </main>
      <BottomBar />
      <WhatsAppButton appMode />
      <Toaster
        position="top-center"
        expand={false}
        gap={8}
        offset={16}
        visibleToasts={3}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: "ippoo-toast",
            title: "ippoo-toast-title",
            description: "ippoo-toast-desc",
            icon: "ippoo-toast-icon",
            closeButton: "ippoo-toast-close",
            actionButton: "ippoo-toast-action",
          },
        }}
      />
      <style>{`
        :where([data-sonner-toaster]) { --width: 360px; }
        .ippoo-toast {
          display: flex; align-items: flex-start; gap: 12px;
          width: 100%;
          padding: 12px 14px;
          background: #ffffff;
          color: #0E1320;
          border-radius: 18px;
          border: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 12px 30px -12px rgba(0,0,0,0.18), 0 2px 6px -2px rgba(0,0,0,0.08);
          font-family: inherit;
        }
        .ippoo-toast-icon {
          width: 28px; height: 28px; border-radius: 9999px;
          background: rgba(0,0,0,0.04);
          display: inline-flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ippoo-toast-icon svg { width: 16px; height: 16px; }
        [data-sonner-toast][data-type="success"] .ippoo-toast-icon svg { color: #0F7A47; }
        [data-sonner-toast][data-type="error"]   .ippoo-toast-icon svg { color: #C0263A; }
        [data-sonner-toast][data-type="warning"] .ippoo-toast-icon svg { color: #B85400; }
        [data-sonner-toast][data-type="info"]    .ippoo-toast-icon svg { color: #2A6BFF; }
        .ippoo-toast-title { font-size: 0.92rem; font-weight: 700; letter-spacing: -0.005em; line-height: 1.2; }
        .ippoo-toast-desc  { font-size: 0.82rem; color: #555; margin-top: 2px; line-height: 1.35; }
        .ippoo-toast-close {
          position: absolute; top: 8px; right: 8px;
          width: 22px; height: 22px; border-radius: 9999px;
          background: rgba(0,0,0,0.05); color: #555;
          display: inline-flex; align-items: center; justify-content: center;
          border: none; cursor: pointer;
        }
        .ippoo-toast-close:hover { background: rgba(0,0,0,0.08); color: #0E1320; }
        .ippoo-toast-action {
          margin-left: auto;
          padding: 6px 12px;
          border-radius: 9999px;
          background: #0E1320;
          color: #fff;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: -0.005em;
          border: none;
          cursor: pointer;
          flex-shrink: 0;
        }
        .ippoo-toast-action:hover { background: #1a1f2e; }
        .ippoo-toast-action:active { transform: scale(0.97); }
        [data-sonner-toast][data-type="success"] .ippoo-toast-action { background: #0F7A47; }
        [data-sonner-toast][data-type="error"]   .ippoo-toast-action { background: #C0263A; }
        [data-sonner-toast][data-type="warning"] .ippoo-toast-action { background: #B85400; }
        [data-sonner-toast][data-type="info"]    .ippoo-toast-action { background: #2A6BFF; }
      `}</style>
      <SkeletonStyles />
    </div>
    </AppLock>
  );
}

export function EspaceLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <ProtectedShell />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export function EspacePublicLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <ScrollToTop />
            <Outlet />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
