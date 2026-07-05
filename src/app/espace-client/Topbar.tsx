import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { Bell, Search, ChevronDown, LogOut, User as UserIcon, Settings as SettingsIcon, Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useAuth } from "./AuthContext";
import { useApiData, formatDate } from "./hooks";
import { api } from "./api";
import { CommandPalette, useCommandPalette } from "./CommandPalette";

export function Topbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const notifQ = useApiData((t) => api.notifications(t));
  const [openNotif, setOpenNotif] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const cmd = useCommandPalette();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setOpenNotif(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = (notifQ.data?.notifications ?? []).filter((n) => !n.read).length;
  const name = (user?.user_metadata?.name as string | undefined) ?? user?.email ?? "";
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "U";

  return (
    <header className="hidden lg:flex items-center justify-between gap-4 px-8 py-3.5 bg-white border-b border-black/5 sticky top-0 z-30">
      <button
        onClick={() => cmd.setOpen(true)}
        className="flex-1 max-w-md flex items-center gap-3 pl-4 pr-2 py-2.5 rounded-xl bg-[#F5F6FA] hover:bg-white hover:border-[#FF3B57] border border-transparent text-left text-[#888] transition-colors"
        style={{ fontSize: "0.85rem" }}
      >
        <Search className="w-4 h-4" />
        <span className="flex-1">Rechercher (contrat, sinistre, page...)</span>
        <kbd className="px-1.5 py-0.5 rounded bg-white border border-black/10 text-[#666]" style={{ fontSize: "0.7rem" }}>⌘K</kbd>
      </button>
      <CommandPalette open={cmd.open} onClose={() => cmd.setOpen(false)} />

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="p-2.5 rounded-xl hover:bg-[#F5F6FA] transition-colors"
          aria-label="Basculer le thème"
        >
          {theme === "dark" ? <Sun className="w-5 h-5 text-[#FFC54B]" /> : <Moon className="w-5 h-5 text-[#333]" />}
        </button>
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setOpenNotif((o) => !o); setOpenMenu(false); }}
            className="relative p-2.5 rounded-xl hover:bg-[#F5F6FA] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-[#333]" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[#FF3B57] text-white flex items-center justify-center" style={{ fontSize: "0.65rem", fontWeight: 800 }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          {openNotif && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-black/5 shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
                <p style={{ fontSize: "0.9rem", fontWeight: 800 }}>Notifications</p>
                <Link to="/espace-client/notifications" onClick={() => setOpenNotif(false)} className="text-[#FF3B57]" style={{ fontSize: "0.75rem", fontWeight: 700 }}>Tout voir</Link>
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {(notifQ.data?.notifications ?? []).slice(0, 5).map((n) => (
                  <li key={n.id} className="px-4 py-3 hover:bg-[#F9FAFC] border-b border-black/5 last:border-b-0">
                    <p style={{ fontSize: "0.85rem", fontWeight: 700 }}>{n.title}</p>
                    <p className="text-[#666] mt-0.5" style={{ fontSize: "0.75rem" }}>{n.body}</p>
                    <p className="text-[#999] mt-1" style={{ fontSize: "0.7rem" }}>{formatDate(n.createdAt)}</p>
                  </li>
                ))}
                {(notifQ.data?.notifications ?? []).length === 0 && (
                  <li className="px-4 py-6 text-center text-[#666]" style={{ fontSize: "0.85rem" }}>Aucune notification</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => { setOpenMenu((o) => !o); setOpenNotif(false); }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-[#F5F6FA] transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF3B57] to-[#FF7A00] text-white flex items-center justify-center" style={{ fontSize: "0.8rem", fontWeight: 800 }}>
              {initials}
            </div>
            <div className="text-left max-w-[10rem]">
              <p className="truncate" style={{ fontSize: "0.85rem", fontWeight: 700 }}>{name}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#888]" />
          </button>
          {openMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-black/5 shadow-xl overflow-hidden">
              <Link to="/espace-client/profil" onClick={() => setOpenMenu(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F9FAFC]" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                <UserIcon className="w-4 h-4" /> Mon profil
              </Link>
              <Link to="/espace-client/parametres" onClick={() => setOpenMenu(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F9FAFC]" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                <SettingsIcon className="w-4 h-4" /> Paramètres
              </Link>
              <button
                onClick={async () => { setOpenMenu(false); await signOut(); navigate("/espace-client/connexion"); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 border-t border-black/5"
                style={{ fontSize: "0.85rem", fontWeight: 600 }}
              >
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
