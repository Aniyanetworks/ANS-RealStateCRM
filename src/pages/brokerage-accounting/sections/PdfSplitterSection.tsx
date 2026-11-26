// @ts-nocheck
// PDF File Splitter (merged from ANS Accounting): split a PDF into page ranges or single pages,
// or extract selected pages into one file. Runs entirely in the browser — nothing is uploaded.
// Pages are re-rendered with pdf.js and rebuilt with jsPDF (image-based output at 2× resolution).
import React, { useState } from "react";
import { Alert, Input, Progress, Radio, Space, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

/** "1-3, 5, 8-9" → [[1,3],[5,5],[8,9]] (validated against page count). */
function parseRanges(text, numPages) {
  const ranges = [];
  for (const part of String(text || "").split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!m) throw new Error(`"${part}" is not a valid page or range.`);
    const a = Number(m[1]);
    const b = Number(m[2] || m[1]);
    if (a < 1 || b > numPages || a > b) throw new Error(`Range ${part} is outside 1–${numPages}.`);
    ranges.push([a, b]);
  }
  if (!ranges.length) throw new Error("Enter at least one page or range.");
  return ranges;
}

async function renderPagesToPdf(doc, pages, onProgress) {
  let out = null;
  for (let i = 0; i < pages.length; i++) {
    const page = await doc.getPage(pages[i]);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    const orientation = base.width > base.height ? "landscape" : "portrait";
    if (!out) out = new jsPDF({ orientation, unit: "pt", format: [base.width, base.height] });
    else out.addPage([base.width, base.height], orientation);
    out.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, base.width, base.height);
    onProgress?.();
  }
  return out;
}

const PdfSplitterSection = () => {
  const [file, setFile] = useState(null);
  const [doc, setDoc] = useState(null);
  const [mode, setMode] = useState("ranges");
  const [ranges, setRanges] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const load = async (f) => {
    try {
      const data = new Uint8Array(await f.arrayBuffer());
      const pdf = await pdfjs.getDocument({ data }).promise;
      setFile(f);
      setDoc(pdf);
      setRanges(`1-${pdf.numPages}`);
    } catch (e) {
      toast.error("Could not open this PDF. It may be encrypted or damaged.");
    }
    return false;
  };

  const baseName = file ? file.name.replace(/\.pdf$/i, "") : "document";

  const run = async () => {
    if (!doc) return;
    try {
      let groups;
      if (mode === "single") groups = Array.from({ length: doc.numPages }, (_, i) => [i + 1, i + 1]);
      else groups = parseRanges(ranges, doc.numPages);
      setBusy(true);
      setProgress(0);
      const total = mode === "extract" ? groups.reduce((n, [a, b]) => n + b - a + 1, 0) : groups.reduce((n, [a, b]) => n + b - a + 1, 0);
      let done = 0;
      const tick = () => setProgress(Math.round((++done / total) * 100));
      if (mode === "extract") {
        const pages = groups.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i));
        const out = await renderPagesToPdf(doc, pages, tick);
        out.save(`${baseName}-extracted.pdf`);
      } else {
        for (const [a, b] of groups) {
          const out = await renderPagesToPdf(doc, Array.from({ length: b - a + 1 }, (_, i) => a + i), tick);
          out.save(`${baseName}-p${a}${b !== a ? `-${b}` : ""}.pdf`);
        }
      }
      toast.success("Done — check your downloads.");
    } catch (e) {
      toast.error(e.message || "Split failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <Alert type="info" showIcon message="Files are processed in your browser and never uploaded. Output pages are high-resolution images, so text in the new files is not selectable." />
      <Upload.Dragger accept="application/pdf" maxCount={1} showUploadList={false} beforeUpload={load}>
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p>{file ? `${file.name} · ${doc?.numPages || 0} pages` : "Click or drop a PDF here"}</p>
      </Upload.Dragger>
      {doc && (
        <>
          <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
            <Space direction="vertical">
              <Radio value="ranges">Split into one file per range</Radio>
              <Radio value="single">Split every page into its own file</Radio>
              <Radio value="extract">Extract selected pages into one combined file</Radio>
            </Space>
          </Radio.Group>
          {mode !== "single" && <Input value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder="e.g. 1-3, 4, 5-9" addonBefore="Pages" />}
          {busy && <Progress percent={progress} />}
          <button type="button" className="primary-btn" disabled={busy} onClick={run}>{busy ? "Working…" : "Split PDF"}</button>
        </>
      )}
    </div>
  );
};

export default PdfSplitterSection;
