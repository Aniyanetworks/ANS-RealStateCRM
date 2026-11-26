// In-app confirm / prompt dialogs for DV Time Clock (replace the browser's window.confirm / window.prompt).
// Promise-based so callers keep the same flow:  if (!(await tcConfirm("Delete?"))) return;
// <TcDialogHost /> is mounted once inside the .dvtc page so the dialog uses the console's modal styles.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ConfirmOpts = { title?: string; confirmText?: string; cancelText?: string; danger?: boolean };
type PromptOpts = ConfirmOpts & { placeholder?: string; defaultValue?: string; inputType?: "text" | "password"; multiline?: boolean; required?: boolean; minLength?: number };
type Request =
  | ({ kind: "confirm"; message: string; resolve: (v: boolean) => void } & ConfirmOpts)
  | ({ kind: "prompt"; message: string; resolve: (v: string | null) => void } & PromptOpts);

let show: ((r: Request) => void) | null = null;

/** Ask the user to confirm. Resolves true for the confirm button, false for cancel / Esc / backdrop. */
export function tcConfirm(message: string, opts: ConfirmOpts = {}): Promise<boolean> {
  if (!show) return Promise.resolve(window.confirm(message)); // host not mounted (should not happen inside the console)
  return new Promise((resolve) => show!({ kind: "confirm", message, resolve, ...opts }));
}

/** Ask the user for text. Resolves the entered text, or null when cancelled. */
export function tcPrompt(message: string, opts: PromptOpts = {}): Promise<string | null> {
  if (!show) return Promise.resolve(window.prompt(message, opts.defaultValue));
  return new Promise((resolve) => show!({ kind: "prompt", message, resolve, ...opts }));
}

export function TcDialogHost() {
  const [req, setReq] = useState<Request | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    show = (r) => {
      setReq(r);
      setValue(r.kind === "prompt" ? r.defaultValue || "" : "");
      setError("");
    };
    return () => { show = null; };
  }, []);

  useEffect(() => {
    if (!req) return;
    const t = window.setTimeout(() => (req.kind === "prompt" ? inputRef.current?.focus() : okRef.current?.focus()), 30);
    return () => window.clearTimeout(t);
  }, [req]);

  if (!req) return null;

  const close = (result: boolean) => {
    if (req.kind === "confirm") {
      req.resolve(result);
    } else if (!result) {
      req.resolve(null);
    } else {
      const v = value;
      if (req.required && !v.trim()) return setError("This field is required.");
      if (req.minLength && v.length < req.minLength) return setError(`Enter at least ${req.minLength} characters.`);
      req.resolve(v);
    }
    setReq(null);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.stopPropagation(); close(false); }
    if (e.key === "Enter" && !(req.kind === "prompt" && req.multiline) && (e.target as HTMLElement).tagName !== "BUTTON") { e.preventDefault(); close(true); }
  };
  const title = req.title || (req.kind === "prompt" ? "Enter details" : req.danger ? "Please confirm" : "Confirm");

  // At <body> level (own .dvtc scope), above the console modal, the app sidebar and header.
  return createPortal(
    <div className="dvtc" style={{ height: 0, background: "transparent" }}>
    <div className="modal tc-dialog" style={{ zIndex: 3100 }} onMouseDown={(e) => e.target === e.currentTarget && close(false)} onKeyDown={onKey}>
      <div className="modalbox" role="alertdialog" aria-modal="true" aria-labelledby="tc-dialog-title" style={{ width: "min(460px,100%)" }}>
        <div className="modalhead" style={{ marginBottom: 10 }}>
          <h2 id="tc-dialog-title" style={{ margin: 0, fontSize: 18, display: "flex", alignItems: "center", gap: 10 }}>
            <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: "50%", fontSize: 15, fontWeight: 800, background: req.danger ? "#fdecea" : "#f1e9db", color: req.danger ? "#b42318" : "#8d7040" }}>
              {req.danger ? "!" : "?"}
            </span>
            {title}
          </h2>
        </div>
        <p style={{ margin: "0 0 16px", color: "#42506a", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-line" }}>{req.message}</p>
        {req.kind === "prompt" && (
          <div className="field">
            {req.multiline ? (
              <textarea ref={inputRef} rows={3} value={value} placeholder={req.placeholder} onChange={(e) => { setValue(e.target.value); setError(""); }} />
            ) : (
              <input ref={inputRef} type={req.inputType || "text"} value={value} placeholder={req.placeholder} onChange={(e) => { setValue(e.target.value); setError(""); }} />
            )}
            {error && <small style={{ color: "#b42318", display: "block", marginTop: 6 }}>{error}</small>}
          </div>
        )}
        <div className="actions" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="ghost" onClick={() => close(false)}>{req.cancelText || "Cancel"}</button>
          <button type="button" ref={okRef} className={req.danger ? "danger" : ""} onClick={() => close(true)}>{req.confirmText || (req.kind === "prompt" ? "Submit" : "Confirm")}</button>
        </div>
      </div>
    </div>
    </div>,
    document.body,
  );
}
