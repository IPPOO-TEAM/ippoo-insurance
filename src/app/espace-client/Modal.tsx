import { useEffect, useId, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Native bottom-sheet modal — drag-to-dismiss on mobile, centered card on
 * desktop. Preserves the legacy `Modal` API so existing pages keep working.
 */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  dismissable?: boolean;
  hideHeader?: boolean;
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const SHEET_CSS = `
.ippoo-sheet-backdrop {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: flex-end; justify-content: center;
  background: rgba(14,19,32,0);
  transition: background var(--dur-base, 220ms) var(--ease-standard, ease);
}
.ippoo-sheet-backdrop[data-visible="1"] { background: rgba(14,19,32,0.5); }
.ippoo-sheet {
  width: 100%;
  background: var(--surface-card);
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
  box-shadow: 0 -10px 40px -8px rgba(14,19,32,0.25);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  transform: translateY(100%);
  transition: transform var(--dur-base, 240ms) var(--ease-emphasized, cubic-bezier(0.3,0,0,1));
  max-height: 92vh;
  display: flex; flex-direction: column;
}
.ippoo-sheet[data-visible="1"] { transform: translateY(0); }
.ippoo-sheet[data-dragging="1"] { transition: none; }
@media (min-width: 640px) {
  .ippoo-sheet-backdrop { align-items: center; }
  .ippoo-sheet {
    width: auto;
    border-radius: var(--radius-lg);
    padding-bottom: 0;
    transform: scale(0.96);
    opacity: 0;
    transition: transform var(--dur-base, 220ms) var(--ease-emphasized), opacity var(--dur-base, 220ms) var(--ease-standard);
    max-height: 88vh;
  }
  .ippoo-sheet[data-visible="1"] { transform: scale(1); opacity: 1; }
  .ippoo-sheet-grabber { display: none !important; }
}
.ippoo-sheet-grabber {
  display: flex; align-items: center; justify-content: center;
  padding: 8px 0 4px;
  touch-action: none; cursor: grab;
}
.ippoo-sheet-grabber > span {
  width: 36px; height: 5px; border-radius: 9999px;
  background: var(--line-strong);
}
`;

export function Modal({ open, onClose, title, description, children, size = "md", dismissable = true, hideHeader = false }: ModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();
  const descId = useId();

  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<{ y: number; t: number } | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else if (mounted) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 260);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  // Keep callbacks in refs so the focus-trap effect can depend on `open`
  // ALONE. Listing `onClose` / `dismissable` in the deps array re-fires the
  // cleanup on EVERY parent re-render — which sent focus back to the opener
  // button on every keystroke and dismissed the mobile keyboard.
  const onCloseRef = useRef(onClose);
  const dismissableRef = useRef(dismissable);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { dismissableRef.current = dismissable; }, [dismissable]);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = setTimeout(() => {
      const first = sheetRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }, 120);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && dismissableRef.current) {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab" && sheetRef.current) {
        const nodes = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (n) => !n.hasAttribute("disabled") && n.offsetParent !== null,
        );
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, [open]);

  function onGrabberDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dismissable) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = { y: e.clientY, t: Date.now() };
  }
  function onGrabberMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const dy = Math.max(0, e.clientY - dragStart.current.y);
    setDragY(dy);
  }
  function onGrabberUp() {
    if (!dragStart.current) return;
    const elapsed = Date.now() - dragStart.current.t;
    const velocity = dragY / Math.max(elapsed, 1);
    const shouldClose = dragY > 120 || velocity > 0.6;
    dragStart.current = null;
    setDragY(0);
    if (shouldClose) onClose();
  }

  if (!mounted) return null;
  const maxW = size === "sm" ? 380 : size === "lg" ? 720 : 480;
  const dragging = !!dragStart.current && dragY > 0;

  return createPortal(
    <>
      <style>{SHEET_CSS}</style>
      <div
        className="ippoo-sheet-backdrop"
        data-visible={visible ? "1" : "0"}
        onClick={(e) => { if (dismissable && e.target === e.currentTarget) onClose(); }}
        role="presentation"
      >
        <div
          ref={sheetRef}
          className="ippoo-sheet"
          data-visible={visible ? "1" : "0"}
          data-dragging={dragging ? "1" : "0"}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          style={{
            maxWidth: `${maxW}px`,
            transform: dragging ? `translateY(${dragY}px)` : undefined,
          }}
        >
          {dismissable && (
            <div
              className="ippoo-sheet-grabber"
              onPointerDown={onGrabberDown}
              onPointerMove={onGrabberMove}
              onPointerUp={onGrabberUp}
              onPointerCancel={onGrabberUp}
              aria-hidden="true"
            >
              <span />
            </div>
          )}
          {!hideHeader && (
            <div
              className="flex items-center justify-between"
              style={{ padding: "8px var(--space-5) 12px" }}
            >
              <h2 id={titleId} className="t-headline" style={{ color: "var(--ippoo-text)" }}>{title}</h2>
              {dismissable && (
                <button
                  type="button"
                  aria-label="Fermer"
                  onClick={onClose}
                  className="flex items-center justify-center active:opacity-60"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "var(--radius-pill)",
                    background: "var(--surface-sunken)",
                    color: "var(--ippoo-text-muted)",
                  }}
                >
                  <X className="w-[16px] h-[16px]" />
                </button>
              )}
            </div>
          )}
          {description && <p id={descId} className="sr-only">{description}</p>}
          <div style={{ padding: "0 var(--space-5) var(--space-5)", overflowY: "auto", flex: 1 }}>
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
