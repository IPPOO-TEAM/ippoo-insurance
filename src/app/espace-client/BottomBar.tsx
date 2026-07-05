import { NavLink, Link } from "react-router";
import { LayoutDashboard, CreditCard, MessageCircle, User, Bell, Search } from "lucide-react";
import { useCommandPalette } from "./CommandPalette";
import { hapticTap } from "./native";

const ITEMS = [
  { to: "/espace-client", end: true, label: "Accueil", icon: LayoutDashboard },
  { to: "/espace-client/carte", label: "Carte", icon: CreditCard },
  { to: "/espace-client/messagerie", label: "Messages", icon: MessageCircle },
  { to: "/espace-client/profil", label: "Profil", icon: User },
];

export function BottomBar() {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "var(--surface-card)",
        borderTop: "1px solid var(--line-hairline)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Navigation principale"
    >
      <ul className="flex items-stretch justify-around" style={{ height: "var(--nav-bottom-h)" }}>
        {ITEMS.map(({ to, end, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              onClick={() => hapticTap()}
              className="h-full w-full flex flex-col items-center justify-center gap-[2px] active:opacity-60 transition-opacity"
              style={{ minHeight: "44px" }}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="w-[22px] h-[22px]"
                    strokeWidth={isActive ? 2.4 : 1.8}
                    style={{ color: isActive ? "var(--accent-primary)" : "var(--ippoo-text-muted)" }}
                  />
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: isActive ? 600 : 500,
                      letterSpacing: "0.01em",
                      color: isActive ? "var(--accent-primary)" : "var(--ippoo-text-muted)",
                    }}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Native-style mobile top bar — flat, no gradients, hairline border. */
export function MobileTopBar({ unread = 0 }: { unread?: number }) {
  const cmd = useCommandPalette();
  return (
    <div
      className="lg:hidden sticky top-0 z-30"
      style={{
        background: "var(--surface-card)",
        borderBottom: "1px solid var(--line-hairline)",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div className="flex items-center gap-3 px-4" style={{ height: "var(--nav-top-h)" }}>
        <Link to="/espace-client" className="flex items-center" aria-label="IPPOO">
          <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--accent-primary)" }}>
            IPPOO
          </span>
        </Link>
        <button
          onClick={() => cmd.setOpen(true)}
          className="flex-1 flex items-center gap-2 px-3 active:opacity-60 transition-opacity"
          style={{
            height: "36px",
            background: "var(--surface-sunken)",
            borderRadius: "var(--radius-sm)",
            color: "var(--ippoo-text-subtle)",
            fontSize: "14px",
            fontWeight: 500,
          }}
          aria-label="Rechercher"
        >
          <Search className="w-[16px] h-[16px]" />
          Rechercher
        </button>
        <Link
          to="/espace-client/notifications"
          className="relative flex items-center justify-center active:opacity-60 transition-opacity"
          style={{ width: "36px", height: "36px" }}
          aria-label={unread > 0 ? `${unread} notifications` : "Notifications"}
        >
          <Bell className="w-[20px] h-[20px]" strokeWidth={1.8} style={{ color: "var(--ippoo-text)" }} />
          {unread > 0 && (
            <span
              className="absolute flex items-center justify-center"
              style={{
                top: "4px",
                right: "4px",
                minWidth: "16px",
                height: "16px",
                padding: "0 4px",
                borderRadius: "var(--radius-pill)",
                background: "var(--accent-primary)",
                color: "var(--accent-on-primary)",
                fontSize: "10px",
                fontWeight: 700,
                border: "2px solid var(--surface-card)",
              }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
