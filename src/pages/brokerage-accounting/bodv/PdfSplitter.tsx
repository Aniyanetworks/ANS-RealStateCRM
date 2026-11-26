// PDF File Splitter — the original DV Accounting screen: page previews, select and reorder pages, then split
// (one per page, custom ranges, groups) or combine selected pages into one PDF. Runs in the browser only.
// Pages are rendered with pdf.js and rebuilt with jsPDF (image-based output at 2× resolution).
import { useState } from "react";
import jsPDF from "jspdf";
import { pdfjs } from "react-pdf";
import { PageHead } from "./ui";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

type Doc = Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;
type Output = { name: string; blob: Blob; pages: number[] };
const MODES: [string, string][] = [["each", "One PDF per selected page"], ["ranges", "Custom page ranges"], ["groups", "Split into groups"], ["extract", "Combine selected pages into one PDF"]];

async function pagesToPdf(doc: Doc, pages: number[]) {
  let out: jsPDF | null = null;
  for (const n of pages) {
    const page = await doc.getPage(n);
    const base = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
    const orientation = base.width > base.height ? "landscape" : "portrait";
    if (!out) out = new jsPDF({ orientation, unit: "pt", format: [base.width, base.height] });
    else out.addPage([base.width, base.height], orientation);
    out.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, base.width, base.height);
  }
  return out!.output("blob");
}

export default function PdfSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState("each");
  const [ranges, setRanges] = useState("");
  const [group, setGroup] = useState("5");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [thumbs, setThumbs] = useState<{ page: number; url: string }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  const reset = () => { setFile(null); setDoc(null); setCount(0); setThumbs([]); setOutputs([]); setError(""); setSelected([]); };
  const choose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    reset();
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) { setError("Please choose a PDF file."); e.target.value = ""; return; }
    try {
      const d = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
      setFile(f); setDoc(d); setCount(d.numPages); setRanges(d.numPages > 1 ? `1-${d.numPages}` : "1");
      setSelected(Array.from({ length: d.numPages }, (_, i) => i + 1));
      const t: { page: number; url: string }[] = [];
      for (let p = 1; p <= Math.min(d.numPages, 12); p++) {
        const page = await d.getPage(p), vp = page.getViewport({ scale: 0.28 });
        const c = document.createElement("canvas");
        c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
        await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
        t.push({ page: p, url: c.toDataURL("image/jpeg", 0.72) });
      }
      setThumbs(t);
    } catch {
      setError("Could not read this PDF. It may be damaged or password-protected.");
    }
  };
  const parseRanges = () => {
    const seen = new Set<number>();
    return ranges.split(",").map((part) => {
      const m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!m) throw new Error(`Invalid range "${part.trim()}". Use formats like 1-3, 4, 5-7.`);
      const a = Number(m[1]), b = Number(m[2] || m[1]);
      if (a < 1 || b < a || b > count) throw new Error(`Page ranges must be between 1 and ${count}, with the start page before the end page.`);
      const pages = Array.from({ length: b - a + 1 }, (_, i) => a + i);
      pages.forEach((p) => { if (seen.has(p)) throw new Error(`Page ${p} appears in more than one range.`); seen.add(p); });
      return pages;
    });
  };
  const create = async () => {
    if (!file || !doc) return;
    setBusy(true); setError(""); setOutputs([]);
    try {
      let sets: number[][] = [];
      if (mode === "each") sets = selected.map((p) => [p]);
      else if (mode === "ranges") sets = parseRanges();
      else if (mode === "groups") {
        const g = Number(group);
        if (!Number.isInteger(g) || g < 1 || g > count) throw new Error(`Choose a group size from 1 to ${count}.`);
        for (let i = 1; i <= count; i += g) sets.push(Array.from({ length: Math.min(g, count - i + 1) }, (_, k) => i + k));
      } else sets = [selected];
      if (!sets.length || sets.some((x) => !x.length)) throw new Error("Select at least one page to split.");
      const base = file.name.replace(/\.pdf$/i, "");
      const out: Output[] = [];
      for (let i = 0; i < sets.length; i++) {
        const pages = sets[i];
        const suffix = mode === "each" ? `page-${pages[0]}` : mode === "groups" ? `group-${i + 1}` : mode === "extract" ? "custom-order-pages" : `pages-${pages[0]}${pages.length > 1 ? `-${pages[pages.length - 1]}` : ""}`;
        out.push({ name: `${base}-${suffix}.pdf`, blob: await pagesToPdf(doc, pages), pages });
      }
      setOutputs(out);
    } catch (e) {
      setError((e as Error).message || "Unable to split this PDF.");
    } finally {
      setBusy(false);
    }
  };
  const download = (o: Output) => {
    const url = URL.createObjectURL(o.blob), a = document.createElement("a");
    a.href = url; a.download = o.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const toggle = (p: number) => setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  const move = (p: number, d: number) => setSelected((s) => {
    const i = s.indexOf(p), j = i + d;
    if (i < 0 || j < 0 || j >= s.length) return s;
    const n = [...s];
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });

  return (
    <div>
      <PageHead title="PDF File Splitter" desc="Select pages from the preview, arrange their order, then combine them into one PDF or split them into separate files." />
      <section className="panel" style={{ maxWidth: 1150 }}>
        <div style={{ padding: 18, border: "1px dashed #9e8556", borderRadius: 12 }}>
          <strong>Choose a PDF file</strong>
          <p className="muted" style={{ margin: "6px 0 14px" }}>Your file is processed locally in this browser. It is not uploaded to or saved on the server.</p>
          <input type="file" accept="application/pdf,.pdf" onChange={choose} />
          {file && (
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <strong>{file.name}</strong><span className="muted">· {count} pages</span>
              <button className="secondary" onClick={reset}>Remove file</button>
            </div>
          )}
        </div>
        {file && (
          <div style={{ marginTop: 20 }}>
            <strong>Split options</strong>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "12px 0" }}>
              {MODES.map(([v, l]) => <label key={v} style={{ display: "flex", gap: 7, alignItems: "center" }}><input type="radio" name="pdf-split-mode" checked={mode === v} onChange={() => setMode(v)} />{l}</label>)}
            </div>
            {mode === "ranges" && (
              <div style={{ maxWidth: 650 }}>
                <label>Page ranges</label>
                <input style={{ width: "100%", marginTop: 6 }} value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder="Example: 1-3, 4, 5-7" />
                <small className="muted">Comma-separated ranges. Pages may not overlap.</small>
              </div>
            )}
            {mode === "groups" && (
              <div style={{ maxWidth: 350 }}>
                <label>Pages per PDF</label>
                <input type="number" min={1} max={count} value={group} onChange={(e) => setGroup(e.target.value)} style={{ width: "100%", marginTop: 6 }} />
                <small className="muted">For example, 5 creates PDFs with pages 1–5, 6–10, and so on.</small>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <button className="secondary" onClick={() => setShowPreview((v) => !v)}>{showPreview ? "Hide page preview" : "Show page preview"}</button>
              <button className="secondary" onClick={() => setSelected(Array.from({ length: count }, (_, i) => i + 1))}>Select all pages</button>
              <button className="secondary" onClick={() => setSelected([])}>Clear selection</button>
            </div>
            {showPreview && (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <strong>Page preview and selection</strong>
                  <span className="muted">{selected.length} of {count} selected · previews show up to 12 pages</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(135px,1fr))", gap: 12, marginTop: 12 }}>
                  {thumbs.map((t) => {
                    const pos = selected.indexOf(t.page);
                    return (
                      <div key={t.page} style={{ padding: 8, borderRadius: 10, border: pos >= 0 ? "2px solid #9e8556" : "1px solid #d0d5dd", background: pos >= 0 ? "#fbf8f2" : "#fff" }}>
                        <button type="button" onClick={() => toggle(t.page)} style={{ display: "block", width: "100%", padding: 0, border: 0, background: "transparent", textAlign: "left", cursor: "pointer" }}>
                          <img src={t.url} alt={`Preview of page ${t.page}`} style={{ width: "100%", height: 145, objectFit: "contain", background: "#f3f4f6", borderRadius: 4 }} />
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4, marginTop: 8 }}><strong>Original page {t.page}</strong><span>{pos >= 0 ? "✓" : "○"}</span></div>
                        </button>
                        {pos >= 0 && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, marginTop: 7, fontSize: 12 }}>
                            <span>Output position: {pos + 1}</span>
                            <span style={{ display: "flex", gap: 4 }}>
                              <button className="secondary" type="button" disabled={pos === 0} onClick={() => move(t.page, -1)} aria-label={`Move page ${t.page} earlier`}>↑</button>
                              <button className="secondary" type="button" disabled={pos === selected.length - 1} onClick={() => move(t.page, 1)} aria-label={`Move page ${t.page} later`}>↓</button>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {count > 12 && <p className="muted" style={{ marginTop: 10 }}>This PDF has more than 12 pages. Use custom ranges to work with pages beyond the preview.</p>}
              </div>
            )}
            <div style={{ marginTop: 18 }}>
              {mode === "extract" && <p className="muted">The combined PDF will follow the output positions shown on the selected page cards. Use ↑ and ↓ to arrange pages before creating it.</p>}
              <button className="primary" onClick={create} disabled={busy || (!selected.length && mode !== "ranges" && mode !== "groups")}>{busy ? "Creating PDFs…" : mode === "extract" ? "Create one PDF in this order" : "Create split PDFs"}</button>
            </div>
          </div>
        )}
        {error && <div role="alert" style={{ marginTop: 16, color: "#b42318" }}>{error}</div>}
      </section>
      {outputs.length > 0 && (
        <section className="panel" style={{ maxWidth: 1150, marginTop: 18 }}>
          <h2 style={{ margin: "0 0 4px" }}>Your PDFs are ready</h2>
          <p className="muted" style={{ margin: "0 0 14px" }}>{outputs.length} file{outputs.length === 1 ? "" : "s"} created locally. Download any file below.</p>
          <div style={{ display: "grid", gap: 10 }}>
            {outputs.map((o) => (
              <div key={o.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 0", borderTop: "1px solid #e4e7ec" }}>
                <div><strong>{o.name}</strong><div className="muted" style={{ fontSize: 13 }}>Pages {o.pages.join(", ")}</div></div>
                <button className="secondary" onClick={() => download(o)}>Download PDF</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
