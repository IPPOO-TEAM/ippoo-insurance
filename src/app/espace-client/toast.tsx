import { useEffect } from "react";
import { useNavigate } from "react-router";
import { toast as sonnerToast, type ExternalToast } from "sonner";

type NavFn = (to: string) => void;
let appNavigate: NavFn | null = null;

export function ToastNavigator() {
  const navigate = useNavigate();
  useEffect(() => {
    appNavigate = (to: string) => navigate(to);
    return () => { appNavigate = null; };
  }, [navigate]);
  return null;
}

type IppooToastOptions = ExternalToast & {
  /** Route to push when the toast body is tapped. */
  to?: string;
  /** Action button rendered on the right of the toast. */
  action?: { label: string; to?: string; onClick?: () => void };
};

function withRouting(opts: IppooToastOptions = {}): ExternalToast {
  const { to, action, onAutoClose, ...rest } = opts;
  const navigate = (path: string) => {
    if (appNavigate) appNavigate(path);
    else if (typeof window !== "undefined") window.location.assign(path);
  };

  const out: ExternalToast = { ...rest };

  if (to) {
    const prevDismiss = (rest as ExternalToast).onDismiss;
    out.onDismiss = (t) => {
      prevDismiss?.(t);
    };
    out.className = `${rest.className ?? ""} ippoo-toast-clickable`.trim();
    out.onAutoClose = onAutoClose;
    // Sonner doesn't expose onClick for the whole toast directly; we wrap title via action.
    // Fallback: provide an "Ouvrir" action when none was given.
    if (!action) {
      out.action = {
        label: "Ouvrir",
        onClick: () => navigate(to),
      };
    }
  }
  if (action) {
    out.action = {
      label: action.label,
      onClick: () => {
        if (action.to) navigate(action.to);
        action.onClick?.();
      },
    };
  }
  return out;
}

export const appToast = {
  success: (message: string, opts?: IppooToastOptions) => sonnerToast.success(message, withRouting(opts)),
  error:   (message: string, opts?: IppooToastOptions) => sonnerToast.error(message,   withRouting(opts)),
  warning: (message: string, opts?: IppooToastOptions) => sonnerToast.warning(message, withRouting(opts)),
  info:    (message: string, opts?: IppooToastOptions) => sonnerToast.info(message,    withRouting(opts)),
  message: (message: string, opts?: IppooToastOptions) => sonnerToast(message,         withRouting(opts)),
  dismiss: sonnerToast.dismiss,
};
