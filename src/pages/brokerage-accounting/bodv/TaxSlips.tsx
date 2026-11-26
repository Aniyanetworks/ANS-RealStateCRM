// Tax Documents — the original ANS Accounting screen: per tax year and type (T4A agents / T4 employees),
// add recipient drafts, upload a PDF beside each recipient (releases it to their portal), replace or remove it.
import { useState } from "react";
import { useAcct, useAcctAction } from "../acctShared";
import { LuCircleAlert, LuFileText, LuPlus, LuRefreshCw, LuTrash2, LuUpload } from "./icons";
import { PageHead } from "./ui";

type Slip = { uuid: string; recipientName: string; status: string; fileUrl: string | null; originalFilename: string | null; fileSizeBytes: number | null; agentAccount?: { email?: string } | null; employee?: { email?: string } | null };

export default function TaxSlips() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear - 1);
  const [type, setType] = useState("T4A");
  const q = useAcct("/tax-slips", { taxYear: year, slipType: type });
  const rows = (q.rows || []) as Slip[];
  const { run, loading } = useAcctAction();
  const [message, setMessage] = useState("");
  const busy = loading || q.isFetching;

  const addRecipients = async () => {
    setMessage("");
    const res = (await run("/tax-slips/add-recipients", { taxYear: year, slipType: type }, { silent: true })) as { created?: number } | null;
    if (res) setMessage(`Added ${res.created || 0} recipient draft(s). Upload a PDF beside each recipient, then release it for portal download.`);
  };
  const upload = async (slip: Slip, file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return alert("Please select a PDF file.");
    if (file.size > 15 * 1024 * 1024) return alert("PDF must be 15 MB or smaller.");
    setMessage("");
    const fd = new FormData();
    fd.append("file", file);
    if (await run(`/tax-slips/${slip.uuid}/upload`, fd, { silent: true })) setMessage(`${file.name} uploaded and released for the assigned recipient.`);
  };
  const remove = async (slip: Slip) => {
    if (!window.confirm(`Remove the uploaded PDF for ${slip.recipientName || "this recipient"}?`)) return;
    setMessage("");
    if (await run(`/tax-slips/${slip.uuid}/remove-file`, {}, { silent: true })) setMessage("Uploaded document removed.");
  };

  return (
    <div className="page">
      <PageHead title="Tax Documents" desc="Upload prepared T4 and T4A PDFs. Recipients can download documents released to their portal.">
        <button className="secondary" onClick={() => q.refetch()} disabled={busy}><LuRefreshCw size={15} /> Refresh</button>
      </PageHead>
      <section className="panel">
        <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
          <label>Tax year
            <select value={year} onChange={(e) => { setYear(Number(e.target.value)); setMessage(""); }} style={{ display: "block", padding: 9, minWidth: 130 }}>
              {Array.from({ length: 8 }, (_, i) => thisYear - i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label>Document type
            <select value={type} onChange={(e) => { setType(e.target.value); setMessage(""); }} style={{ display: "block", padding: 9, minWidth: 200 }}>
              <option value="T4A">T4A — Agents / contractors</option>
              <option value="T4">T4 — Employees</option>
            </select>
          </label>
          <button className="primary" onClick={addRecipients} disabled={busy}><LuPlus size={15} /> Add missing recipients</button>
        </div>
        {message && <p role="status" style={{ marginTop: 12 }}>{message}</p>}
        <div style={{ marginTop: 16, padding: 12, background: "#f8f6f0", borderRadius: 8 }}>
          <strong>Manual PDF uploads</strong>
          <p className="muted" style={{ margin: "5px 0 0" }}>Upload the prepared official PDF for each person. Files are stored privately and become downloadable to that recipient when released. PDF only, maximum 15 MB.</p>
        </div>
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table className="table">
            <thead><tr><th>Recipient</th><th>Document</th><th>Status</th><th>Upload / actions</th></tr></thead>
            <tbody>
              {rows.length ? rows.map((s) => (
                <tr key={s.uuid}>
                  <td>{s.recipientName || "Unassigned"}<div className="muted">{s.agentAccount?.email || s.employee?.email || ""}</div></td>
                  <td>
                    {s.fileUrl ? (
                      <>
                        <a href={s.fileUrl} target="_blank" rel="noreferrer"><LuFileText size={15} style={{ verticalAlign: "middle", marginRight: 5 }} />{s.originalFilename || `${type} PDF`}</a>
                        <div className="muted">{s.fileSizeBytes ? `${Math.ceil(s.fileSizeBytes / 1024)} KB` : ""}</div>
                      </>
                    ) : "No PDF uploaded"}
                  </td>
                  <td>{s.fileUrl && s.status === "RELEASED" ? "Available to recipient" : s.status === "DRAFT" ? "Draft" : s.status}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <label className="secondary" style={{ display: "inline-flex", gap: 7, alignItems: "center", padding: "7px 10px", cursor: busy ? "wait" : "pointer", borderRadius: 6 }}>
                        <LuUpload size={15} />{s.fileUrl ? "Replace PDF" : "Upload PDF"}
                        <input type="file" accept="application/pdf,.pdf" disabled={busy} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(s, f); }} />
                      </label>
                      {s.fileUrl && <button className="secondary" disabled={busy} onClick={() => remove(s)}><LuTrash2 size={14} /> Remove</button>}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="muted">{busy ? "Loading tax documents…" : "No recipients listed for this year and document type. Use Add missing recipients to prepare the upload list."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 14 }}><LuCircleAlert size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />Admin upload controls. Uploading a PDF releases it to the assigned account. Verify the recipient before uploading.</p>
      </section>
    </div>
  );
}
