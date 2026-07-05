import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { useLocation, useNavigationType } from "react-router";
import { setThemeColor } from "./pwa";

const ROUTE_THEME: Array<[RegExp, string]> = [
  [/\/espace-client\/carte/, "#0E1320"],
];
function themeForPath(path: string): string {
  for (const [re, color] of ROUTE_THEME) if (re.test(path)) return color;
  return "#FFFFFF";
}

/**
 * Native-style stack transitions:
 *   - PUSH (new route)        : new screen slides in from the right
 *   - POP (back/forward)      : current screen slides out to the right
 *   - REPLACE                 : crossfade
 * Also wires an edge-swipe gesture on the left 24px to trigger history.back().
 *
 * Renders the current route children. Wrap your <Outlet/> with this.
 */

const TRANSITION_CSS = `
.ippoo-stack {
  position: relative;
  min-height: 100%;
  width: 100%;
  isolation: isolate;
}
.ippoo-stack-page {
  position: relative;
  width: 100%;
  will-change: transform, opacity;
  transform: translateZ(0);
}
.ippoo-stack-page[data-anim="push-in"] {
  animation: ippoo-push-in var(--dur-base, 260ms) var(--ease-emphasized, cubic-bezier(0.3,0,0,1)) both;
}
.ippoo-stack-page[data-anim="pop-in"] {
  animation: ippoo-pop-in var(--dur-base, 220ms) var(--ease-emphasized, cubic-bezier(0.3,0,0,1)) both;
}
.ippoo-stack-page[data-anim="fade-in"] {
  animation: ippoo-fade-in var(--dur-base, 200ms) var(--ease-standard, ease) both;
}
@keyframes ippoo-push-in {
  from { transform: translate3d(24px, 0, 0); opacity: 0; }
  to   { transform: translate3d(0, 0, 0);    opacity: 1; }
}
@keyframes ippoo-pop-in {
  from { transform: translate3d(-16px, 0, 0); opacity: 0; }
  to   { transform: translate3d(0, 0, 0);     opacity: 1; }
}
@keyframes ippoo-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .ippoo-stack-page[data-anim] { animation: none !important; }
}
`;

export function RouteTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navType = useNavigationType(); // "PUSH" | "POP" | "REPLACE"
  const [animKey, setAnimKey] = useState(location.key);
  const [anim, setAnim] = useState<"push-in" | "pop-in" | "fade-in">("fade-in");

  useEffect(() => {
    setAnim(navType === "POP" ? "pop-in" : navType === "REPLACE" ? "fade-in" : "push-in");
    setAnimKey(location.key);
    setThemeColor(themeForPath(location.pathname));
  }, [location.key, location.pathname, navType]);

  // Edge-swipe back
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse") return;
    if (e.clientX > 24) return; // only from left edge
    startX.current = e.clientX;
    startY.current = e.clientY;
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (startX.current == null || startY.current == null) return;
    const dx = e.clientX - startX.current;
    const dy = Math.abs(e.clientY - startY.current);
    if (dx > 80 && dy < 40) {
      startX.current = null;
      startY.current = null;
      window.history.back();
    }
  }
  function onPointerEnd() {
    startX.current = null;
    startY.current = null;
  }

  return (
    <div
      className="ippoo-stack"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <style>{TRANSITION_CSS}</style>
      <div key={animKey} className="ippoo-stack-page" data-anim={anim}>
        {children}
      </div>
    </div>
  );
}
