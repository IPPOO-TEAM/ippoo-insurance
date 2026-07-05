import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

/* =====================================================================
   Native primitives — flat, 8pt grid, 44px min touch targets, no gradients.
   All colors / radii / spacing reference CSS variables from theme.css.
   ===================================================================== */

/* --------------------------- Card --------------------------- */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  inset?: boolean; // remove inner padding (for lists)
  elevated?: boolean; // shadow instead of hairline border
}
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { inset, elevated, style, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={className}
      style={{
        background: "var(--surface-card)",
        borderRadius: "var(--radius-md)",
        border: elevated ? "none" : "1px solid var(--line-hairline)",
        boxShadow: elevated ? "var(--elev-1)" : "var(--elev-0)",
        padding: inset ? 0 : "var(--space-4)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
});

/* --------------------------- Section --------------------------- */
/** Inset-grouped section — title + footer like iOS Settings. */
export function Section({
  title,
  footer,
  children,
  className,
}: {
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className} style={{ marginBottom: "var(--space-6)" }}>
      {title && (
        <p
          className="t-caption-em t-subtle"
          style={{ padding: "0 var(--space-4)", marginBottom: "var(--space-2)" }}
        >
          {title}
        </p>
      )}
      {children}
      {footer && (
        <p
          className="t-footnote t-muted"
          style={{ padding: "var(--space-2) var(--space-4) 0", lineHeight: 1.4 }}
        >
          {footer}
        </p>
      )}
    </div>
  );
}

/* --------------------------- ListGroup / Row --------------------------- */
export function ListGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: "var(--surface-card)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--line-hairline)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

export interface RowProps {
  icon?: ReactNode;
  iconBg?: string;
  iconFg?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  to?: string;
  onClick?: () => void;
  destructive?: boolean;
  chevron?: boolean;
}
export function Row({
  icon,
  iconBg = "var(--surface-sunken)",
  iconFg = "var(--ippoo-text)",
  title,
  subtitle,
  trailing,
  to,
  onClick,
  destructive,
  chevron,
}: RowProps) {
  const interactive = !!to || !!onClick;
  const showChevron = chevron ?? interactive;
  const content = (
    <div
      className="flex items-center"
      style={{
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-4)",
        minHeight: "52px",
      }}
    >
      {icon && (
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "var(--radius-xs)",
            background: iconBg,
            color: iconFg,
          }}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div
          className="t-body truncate"
          style={{ color: destructive ? "var(--state-danger)" : "var(--ippoo-text)", fontWeight: 500 }}
        >
          {title}
        </div>
        {subtitle && (
          <div className="t-footnote t-muted truncate" style={{ marginTop: "2px" }}>
            {subtitle}
          </div>
        )}
      </div>
      {trailing && <div className="shrink-0 t-subhead t-muted">{trailing}</div>}
      {showChevron && (
        <ChevronRight className="shrink-0 w-[16px] h-[16px]" style={{ color: "var(--ippoo-text-subtle)" }} />
      )}
    </div>
  );
  const baseStyle: CSSProperties = { display: "block", borderTop: "1px solid var(--line-hairline)" };
  // First-child border handled by CSS pseudo? We rely on natural overlap inside ListGroup using :first-child negative margin.
  if (to) {
    return (
      <Link to={to} className="active:bg-[var(--surface-sunken)] transition-colors" style={baseStyle}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left active:bg-[var(--surface-sunken)] transition-colors" style={baseStyle}>
        {content}
      </button>
    );
  }
  return <div style={baseStyle}>{content}</div>;
}

/* --------------------------- Button --------------------------- */
type Variant = "primary" | "secondary" | "tinted" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

const VARIANT_STYLE: Record<Variant, CSSProperties> = {
  primary: { background: "var(--accent-primary)", color: "var(--accent-on-primary)" },
  secondary: { background: "var(--surface-card)", color: "var(--ippoo-text)", border: "1px solid var(--line-strong)" },
  tinted: { background: "var(--ippoo-red-light)", color: "var(--accent-primary)" },
  ghost: { background: "transparent", color: "var(--accent-primary)" },
  destructive: { background: "var(--state-danger)", color: "#fff" },
};
const SIZE_STYLE: Record<Size, CSSProperties> = {
  sm: { minHeight: "36px", padding: "0 var(--space-3)", fontSize: "var(--type-subhead)", borderRadius: "var(--radius-xs)" },
  md: { minHeight: "44px", padding: "0 var(--space-4)", fontSize: "var(--type-callout)", borderRadius: "var(--radius-sm)" },
  lg: { minHeight: "50px", padding: "0 var(--space-5)", fontSize: "var(--type-headline)", borderRadius: "var(--radius-sm)" },
};

export interface NativeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}
export const Button = forwardRef<HTMLButtonElement, NativeButtonProps>(function Button(
  { variant = "primary", size = "md", block, leading, trailing, children, style, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-50"
      style={{
        ...SIZE_STYLE[size],
        ...VARIANT_STYLE[variant],
        width: block ? "100%" : undefined,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        ...style,
      }}
      {...rest}
    >
      {leading}
      {children}
      {trailing}
    </button>
  );
});

/* --------------------------- Field (input) --------------------------- */
export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, leading, trailing, style, id, ...rest },
  ref,
) {
  const fid = id ?? rest.name;
  return (
    <div>
      {label && (
        <label htmlFor={fid} className="t-subhead" style={{ display: "block", marginBottom: "6px", color: "var(--ippoo-text)", fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div
        className="flex items-center"
        style={{
          gap: "var(--space-2)",
          minHeight: "44px",
          padding: "0 var(--space-3)",
          background: "var(--surface-sunken)",
          borderRadius: "var(--radius-sm)",
          border: `1px solid ${error ? "var(--state-danger)" : "transparent"}`,
          transition: "border-color var(--dur-fast) var(--ease-standard)",
        }}
      >
        {leading && <span className="shrink-0 t-muted">{leading}</span>}
        <input
          id={fid}
          ref={ref}
          className="flex-1 bg-transparent outline-none border-0"
          style={{
            fontSize: "var(--type-body)",
            color: "var(--ippoo-text)",
            ...style,
          }}
          {...rest}
        />
        {trailing && <span className="shrink-0 t-muted">{trailing}</span>}
      </div>
      {(hint || error) && (
        <p className="t-footnote" style={{ marginTop: "6px", color: error ? "var(--state-danger)" : "var(--ippoo-text-muted)" }}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});

/* --------------------------- SegmentedControl --------------------------- */
export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
}) {
  return (
    <div
      className="flex"
      role="tablist"
      style={{
        padding: "2px",
        background: "var(--surface-sunken)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className="flex-1 transition-all active:opacity-80"
            style={{
              minHeight: "32px",
              padding: "0 var(--space-3)",
              borderRadius: "calc(var(--radius-sm) - 2px)",
              background: active ? "var(--surface-card)" : "transparent",
              boxShadow: active ? "0 1px 2px rgba(14,19,32,0.08)" : "none",
              color: active ? "var(--ippoo-text)" : "var(--ippoo-text-muted)",
              fontSize: "var(--type-footnote)",
              fontWeight: active ? 600 : 500,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------- StatusPill --------------------------- */
type Tone = "success" | "warning" | "danger" | "info" | "neutral";
const TONE_STYLE: Record<Tone, CSSProperties> = {
  success: { background: "var(--state-success-bg)", color: "var(--state-success)" },
  warning: { background: "var(--state-warning-bg)", color: "var(--state-warning)" },
  danger: { background: "var(--state-danger-bg)", color: "var(--state-danger)" },
  info: { background: "var(--state-info-bg)", color: "var(--state-info)" },
  neutral: { background: "var(--surface-sunken)", color: "var(--ippoo-text-muted)" },
};
export function StatusPill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center"
      style={{
        ...TONE_STYLE[tone],
        padding: "3px 8px",
        borderRadius: "var(--radius-pill)",
        fontSize: "var(--type-caption1)",
        fontWeight: 600,
        lineHeight: 1.2,
      }}
    >
      {children}
    </span>
  );
}

/* --------------------------- ScreenHeader --------------------------- */
/** Page title block (large title style, iOS-like). */
export function ScreenHeader({
  title,
  subtitle,
  trailing,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <header
      className="flex items-end justify-between"
      style={{ gap: "var(--space-3)", marginBottom: "var(--space-5)" }}
    >
      <div className="min-w-0">
        <h1 className="t-largeTitle" style={{ color: "var(--ippoo-text)" }}>{title}</h1>
        {subtitle && <p className="t-subhead t-muted" style={{ marginTop: "4px" }}>{subtitle}</p>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </header>
  );
}
