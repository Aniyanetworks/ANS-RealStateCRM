// Shared building blocks with the original ANS Accounting (bodv) markup, so screens use its exact styling
// (classes come from ../bodv.css, scoped to the .dvac page wrapper).
import { ReactNode } from "react";
import { LuCircleAlert, LuFile, LuX } from "./icons";

export const fr = (n: unknown) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayYmd = () => ymd(new Date());
export const shortDate = (v?: string | null) =>
  v ? new Date(String(v).slice(0, 10) + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : "—";

export function PageHead({ title, desc, children }: { title: string; desc?: ReactNode; children?: ReactNode }) {
  return (
    <div className="pagehead">
      <div>
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {children && <div className="actions">{children}</div>}
    </div>
  );
}

export function Panel({ title, hint, right, children, style }: { title: ReactNode; hint?: ReactNode; right?: ReactNode; children?: ReactNode; style?: React.CSSProperties }) {
  return (
    <section className="panel" style={style}>
      <div className="paneltitle">
        {hint ? <div><h2>{title}</h2><p className="panelhint">{hint}</p></div> : <h2>{title}</h2>}
        {right}
      </div>
      {children}
    </section>
  );
}

/** Stat card (the original's Pn). */
export function Stat({ title, value, sub, style }: { title: ReactNode; value: ReactNode; sub?: ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="card" style={style}>
      <div className="muted">{title}</div>
      <div className="metric">{value}</div>
      {sub !== undefined && <div className="sub">{sub}</div>}
    </div>
  );
}

/** Modal dialog (the original's Di). */
export function Modal({ title, onClose, children, wide = false }: { title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal"
        style={{ maxHeight: "94vh", overflow: wide ? "hidden" : "auto", ...(wide ? { width: "min(1400px,96vw)", maxWidth: "96vw", height: "94vh", display: "flex", flexDirection: "column" } : {}) }}
      >
        <div className="modalhead" style={wide ? { flex: "0 0 auto" } : undefined}>
          <h2>{title}</h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close"><LuX /></button>
        </div>
        {wide ? <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div> : children}
      </div>
    </div>
  );
}

/** Empty state (the original's Bl). */
export function Empty({ icon, title = "Nothing here yet", text = "Create your first record to get started." }: { icon?: ReactNode; title?: string; text?: string }) {
  return (
    <div className="empty">
      {icon || <LuFile />}
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

/** Info notice with the alert icon. */
export const Notice = ({ children, style }: { children: ReactNode; style?: React.CSSProperties }) => (
  <div className="notice" style={style}><LuCircleAlert />{children}</div>
);

/** Dollar amount input (the original's money input look). */
export function MoneyInput({ value, onChange, step = "0.01", min, required, disabled, prefix = "$" }: { value: string | number; onChange: (v: string) => void; step?: string; min?: number; required?: boolean; disabled?: boolean; prefix?: string }) {
  return (
    <div className="money-input-wrap" style={{ display: "flex", alignItems: "center", gap: 4, width: "100%", minHeight: 38, border: "1px solid #d0d5dd", borderRadius: 8, padding: "7px 10px", background: disabled ? "#f2f4f7" : "#fff", opacity: disabled ? 0.7 : 1 }}>
      <span className="money-input-prefix" aria-hidden="true" style={{ color: "#667085" }}>{prefix}</span>
      <input type="number" inputMode="decimal" step={step} min={min} required={required} disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} style={{ border: 0, outline: 0, padding: 0, minHeight: 0, width: "100%", background: "transparent", boxShadow: "none" }} />
    </div>
  );
}

/** Highlighted count row used at the top of dashboard panels. */
export const CountNotice = ({ label, count }: { label: string; count: number }) => (
  <div className="notice" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span>{label}</span>
    <strong style={{ fontSize: 18 }}>{count}</strong>
  </div>
);
