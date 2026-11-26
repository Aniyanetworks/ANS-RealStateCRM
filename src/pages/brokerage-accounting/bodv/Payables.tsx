// Expenses & A/P — the original ANS Accounting screen: vendor invoices with HST split, document upload and
// PDF invoice scan, approval → posting, payments (company bank or paid personally), cheque printing,
// voids and recurring invoice schedules. Backed by the CRM's acct_bills / acct_vendors / acct_recurring_bills.
import { useMemo, useState } from "react";
import { pdfjs } from "react-pdf";
import { useAcct, useAcctAction } from "../acctShared";
import { LuCamera, LuCircleAlert, LuPlus, LuSave, LuUpload } from "./icons";
import { Modal, MoneyInput, Notice, PageHead, Stat, fr, todayYmd } from "./ui";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

type Payment = { uuid: string; paymentDate: string; amount: number; method: string; bankAccountId: number | null; chequeNumber: string | null; reference: string | null; payeeName: string | null; voidedAt: string | null };
type Bill = {
  uuid: string; billNumber: string; vendorId: number; vendor?: { id: number; name: string }; invoiceNumber: string | null; billDate: string; dueDate: string | null;
  glAccountId: number; glAccount?: { code: string; name: string } | null; branchId: number | null; description: string | null; amount: number; hstRate: number; hstAmount: number;
  total: number; amountPaid: number; approvalStatus: string; status: string; paymentStatus: string; postedAt: string | null; attachmentUrl: string | null; attachmentName: string | null;
  payments: Payment[]; balanceDue: number; recurringTemplateId?: number | null;
};
type Recurring = { id: number; uuid: string; vendorId: number; vendor?: { name: string }; description: string | null; glAccountId: number; invoiceTotal: number; hstRate: number; frequency: string; startDate: string; nextInvoiceDate: string; dueDays: number; active: boolean };
type Vendor = { id: number; name: string; active: boolean };
type Gl = { id: number; code: string; name: string; accountType: string; active: boolean };
type Bank = { id: number; name: string; accountCategory?: string; status?: string };
type Employee = { id: number; name: string; active?: boolean };
type Branch = { id: number; name: string };

const d10 = (v?: string | null) => (v ? String(v).slice(0, 10) : "");
const n = (v: unknown) => Number(v || 0);
const r2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const norm = (v: unknown) => String(v || "").toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
const HST_RATES = [
  ["13", "13% — Ontario HST"], ["14", "14% — HST"], ["15", "15% — HST"], ["12", "12% — HST"], ["5", "5% — GST"], ["0", "0% — No HST/GST charged"],
];
const FREQ_LABEL: Record<string, string> = { WEEKLY: "Weekly", MONTHLY: "Monthly", QUARTERLY: "Quarterly", YEARLY: "Yearly" };
const SOURCE_METHOD: Record<string, string> = { EMPLOYEE: "PAID_BY_EMPLOYEE", SHAREHOLDER: "PAID_BY_SHAREHOLDER", OTHER: "PAID_BY_OTHER" };
const fieldhint: React.CSSProperties = { display: "block", color: "#7d8797", fontSize: 11, fontWeight: 400, marginTop: 4 };
const fileLabel: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, cursor: "pointer" };

/** Inclusive total → pre-tax amount + HST at the given rate. */
function split(total: unknown, rate: unknown) {
  const t = n(total), base = r2(t / (1 + n(rate) / 100));
  return { amount: base, hst: r2(t - base) };
}

function paidBy(p: Payment, banks: Bank[]) {
  if (p.method === "PAID_BY_EMPLOYEE") return "Employee paid personally";
  if (p.method === "PAID_BY_SHAREHOLDER") return "Director/shareholder paid personally";
  if (p.method === "PAID_BY_OTHER") return "Other individual paid personally";
  return banks.find((b) => b.id === p.bankAccountId)?.name || "Operating account";
}

function amountInWords(value: number) {
  const v = Math.max(0, Number(value) || 0), dollars = Math.floor(v + 1e-6), cents = Math.round(v * 100) % 100;
  const ones = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const hundreds = (x: number) => {
    const out: string[] = [];
    if (x >= 100) { out.push(ones[Math.floor(x / 100)], "Hundred"); x %= 100; }
    if (x >= 20) { out.push(tens[Math.floor(x / 10)]); if (x % 10) out.push(ones[x % 10]); } else if (x > 0) out.push(ones[x]);
    return out.join(" ");
  };
  const words = (x: number) => {
    if (x === 0) return "Zero";
    const out: string[] = [];
    for (const [unit, name] of [[1e9, "Billion"], [1e6, "Million"], [1e3, "Thousand"], [1, ""]] as [number, string][]) {
      if (x >= unit) { out.push(hundreds(Math.floor(x / unit)) + (name ? " " + name : "")); x %= unit; }
    }
    return out.join(" ");
  };
  return `${words(dollars)} ${dollars === 1 ? "Dollar" : "Dollars"} and ${words(cents)} ${cents === 1 ? "Cent" : "Cents"} Only`;
}

function printCheque(p: Payment, bill: Bill) {
  if (p.method !== "CHEQUE") return alert("This payment is not recorded as a cheque.");
  const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
  const amt = n(p.amount);
  const fields: [number, number, string, string][] = [
    [6.4, 0.45, d10(p.paymentDate), "date"],
    [6.5, 1.15, amt.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), "amount"],
    [0.7, 1.65, amountInWords(amt), "words"],
    [0.7, 1.15, bill.vendor?.name || "", "payee"],
    [0.7, 2.6, bill.description || bill.invoiceNumber || "Vendor invoice", "memo"],
    [7.1, 0.25, p.chequeNumber || "", "number"],
  ];
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return alert("Please allow pop-ups to print the cheque.");
  w.document.write(
    `<!doctype html><html><head><title>Cheque ${esc(p.chequeNumber)}</title><style>@page{size:8.5in 11in;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}.cheque{position:relative;width:8.5in;height:11in;overflow:hidden}.cheque>div{position:absolute;font-size:11pt;white-space:pre-wrap}.amount{font-weight:bold}.words{width:5.5in}.payee{width:5in}.memo{font-size:9pt}</style></head><body><main class="cheque">` +
      fields.map(([x, y, text, cls]) => `<div class="${cls}" style="left:${x}in;top:${y}in">${esc(text)}</div>`).join("") +
      `</main><script>window.onload=()=>{window.focus();window.print()}<\/script></body></html>`
  );
  w.document.close();
}

/** Read text from the first pages of a PDF, one line per text row. */
async function pdfText(file: File) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  let text = "";
  for (let i = 1; i <= Math.min(doc.numPages, 3); i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    let lastY: number | null = null, line = "";
    for (const item of content.items as { str?: string; transform?: number[] }[]) {
      const y = Math.round(item.transform?.[5] || 0);
      if (lastY !== null && Math.abs(y - lastY) > 3) { text += line.trim() + "\n"; line = ""; }
      line += (item.str || "") + " ";
      lastY = y;
    }
    if (line.trim()) text += line.trim() + "\n";
  }
  return text;
}

const emptyForm = () => ({
  billDate: todayYmd(), vendor: "", invoiceNumber: "", dueDate: "", branchId: "", glAccountId: "", description: "",
  total: "", hstRate: "13", paymentStatus: "UNPAID", source: "BANK", bankAccountId: "", method: "CHEQUE", chequeNumber: "", reference: "",
  employeeId: "", payeeName: "", approveNow: false,
});
const emptyRecurring = () => ({ vendor: "", description: "", glAccountId: "", total: "", hstRate: "13", frequency: "MONTHLY", startDate: todayYmd(), nextInvoiceDate: todayYmd(), dueDays: "0" });

export default function Payables() {
  const billsQ = useAcct("/bills");
  const vendorsQ = useAcct("/vendors");
  const recurringQ = useAcct("/recurring-bills");
  const glQ = useAcct("/gl-accounts");
  const banksQ = useAcct("/bank-accounts");
  const employeesQ = useAcct("/employees");
  const branchesQ = useAcct("/ap-branches");
  const { run, loading } = useAcctAction();

  const bills = (billsQ.rows || []) as Bill[];
  const vendors = (vendorsQ.rows || []) as Vendor[];
  const recurring = (recurringQ.rows || []) as Recurring[];
  const expenseAccounts = ((glQ.rows || []) as Gl[]).filter((a) => a.active && a.accountType === "EXPENSE");
  const operatingBanks = ((banksQ.rows || []) as Bank[]).filter((b) => b.accountCategory === "OPERATING" && b.status !== "inactive");
  const banks = (banksQ.rows || []) as Bank[];
  const employees = ((employeesQ.rows || []) as Employee[]).filter((e) => e.active !== false);
  const branches = (branchesQ.rows || []) as Branch[];
  const glName = (id?: number | null) => { const g = expenseAccounts.find((a) => a.id === id) || ((glQ.rows || []) as Gl[]).find((a) => a.id === id); return g ? g.name : "—"; };

  const [branchFilter, setBranchFilter] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState<Bill | null>(null);
  const [voiding, setVoiding] = useState<Bill | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [paying, setPaying] = useState<Bill | null>(null);
  const [pay, setPay] = useState({ source: "BANK", bankAccountId: "", employeeId: "", payeeName: "", amount: "", paymentDate: todayYmd(), method: "CHEQUE", chequeNumber: "", reference: "" });
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [recurringEdit, setRecurringEdit] = useState<Recurring | null>(null);
  const [rform, setRform] = useState(emptyRecurring());

  const lockedEdit = !!editing && editing.status !== "DRAFT";
  const live = bills.filter((b) => b.status !== "VOID");
  const shown = bills.filter((b) => branchFilter === "ALL" || (branchFilter === "NONE" ? !b.branchId : String(b.branchId) === branchFilter));
  const balance = (b: Bill) => (b.status === "VOID" ? 0 : Math.max(0, r2(n(b.total) - n(b.amountPaid))));
  const today = todayYmd();
  const totals = useMemo(() => ({
    expenses: live.reduce((s, b) => s + n(b.amount), 0),
    hst: live.reduce((s, b) => s + n(b.hstAmount), 0),
    open: live.reduce((s, b) => s + balance(b), 0),
    paid: live.reduce((s, b) => s + Math.min(n(b.total), n(b.amountPaid)), 0),
    overdue: live.filter((b) => b.dueDate && d10(b.dueDate) < today && balance(b) > 0).length,
  }), [bills]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextCheque = (bankId: string) => {
    const nums = bills.flatMap((b) => b.payments || []).filter((p) => String(p.bankAccountId || "") === String(bankId || "") && p.method === "CHEQUE").map((p) => Number(p.chequeNumber)).filter((x) => Number.isFinite(x) && x > 0);
    return String(Math.max(0, ...nums) + 1);
  };
  const preview = split(form.total, form.hstRate);
  const setF = (patch: Partial<ReturnType<typeof emptyForm>>) => setForm((f) => ({ ...f, ...patch }));

  // ---------- vendor invoice form ----------
  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setFile(null);
    setScanMsg("");
    setFormOpen(true);
  };
  const openEdit = (b: Bill) => {
    setEditing(b);
    setForm({ ...emptyForm(), billDate: d10(b.billDate), vendor: b.vendor?.name || "", invoiceNumber: b.invoiceNumber || "", dueDate: d10(b.dueDate), branchId: b.branchId ? String(b.branchId) : "", glAccountId: String(b.glAccountId || ""), description: b.description || "", total: n(b.total).toFixed(2), hstRate: String(n(b.hstRate)) });
    setFile(null);
    setScanMsg("");
    setFormOpen(true);
  };

  /** Find the vendor by name (ignoring case/punctuation) or add it to the vendor list. */
  const resolveVendor = async (name: string) => {
    const found = vendors.find((v) => norm(v.name) === norm(name));
    if (found) return found.id;
    const created = (await run("/vendors", { name }, { silent: true })) as Vendor | null;
    return created?.id || null;
  };

  const scan = async (f: File) => {
    setFile(f);
    if (!(f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))) {
      setScanMsg("Photo attached as the invoice document. Automatic reading works on PDF invoices — enter the invoice fields from the photo.");
      return;
    }
    setScanning(true);
    setScanMsg("Reading invoice…");
    try {
      const text = await pdfText(f);
      if (!text.trim()) throw new Error("This PDF has no readable text (it may be a scanned image). Enter the fields manually.");
      let date = "";
      const iso = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
      const dmy = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
      if (iso) date = `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
      else if (dmy) {
        let y = Number(dmy[3]);
        if (y < 100) y += 2000;
        const m = Number(dmy[1]), d = Number(dmy[2]);
        if (m >= 1 && m <= 12 && d >= 1 && d <= 31) date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
      const num = (v: string) => Number(String(v || "").replace(/[$,\s]/g, ""));
      const invNo = text.match(/(?:invoice|inv)\s*(?:number|no\.?|#|:)?\s*([A-Z0-9][A-Z0-9-]{2,})/i);
      const totalM = text.match(/(?:total\s*(?:due|payable|including tax|incl\.?\s*tax)?|amount\s*due|balance\s*due|grand\s*total|invoice\s*total)\s*[:$ ]*([0-9,]+\.\d{2})/i);
      const hstM = text.match(/(?:HST|GST\/HST|GST)\s*(?:amount|tax)?\s*[:$ ]*([0-9,]+\.\d{2})/i);
      const rateM = text.match(/(?:HST|GST\/HST)\s*(?:@|rate)?\s*(5|12|13|14|15)\s*%/i);
      const total = totalM ? num(totalM[1]) : 0, hst = hstM ? num(hstM[1]) : 0;
      let rate = rateM ? rateM[1] : "13";
      if (total > 0 && hst > 0 && hst < total) {
        const implied = (hst / (total - hst)) * 100;
        rate = String([0, 5, 12, 13, 14, 15].reduce((best, r) => (Math.abs(r - implied) < Math.abs(best - implied) ? r : best), 13));
      }
      const vendorLine = text.split("\n").map((l) => l.trim()).filter(Boolean).find((l) => l.length > 2 && l.length < 90 && !/invoice|bill to|ship to|date|phone|fax|www\.|http|hst|gst|subtotal|total|amount due|tax|description|qty|quantity|price|terms|payment/i.test(l) && !/^[0-9\W]+$/.test(l));
      const hay = (text + " " + (vendorLine || "")).toLowerCase();
      const category = expenseAccounts.find((a) => hay.includes(String(a.name || "").toLowerCase()));
      setForm((cur) => {
        const next = { ...cur };
        if (date) next.billDate = date;
        if (invNo) next.invoiceNumber = invNo[1].replace(/[.,;:]$/, "");
        if (total > 0) { next.total = total.toFixed(2); next.hstRate = rate; }
        if (category) next.glAccountId = String(category.id);
        if (vendorLine && !cur.vendor) {
          const known = vendors.find((v) => v.name.toLowerCase() === vendorLine.toLowerCase() || vendorLine.toLowerCase().includes(v.name.toLowerCase()));
          next.vendor = known?.name || vendorLine;
        }
        return next;
      });
      setScanMsg("Scan complete. Please verify every extracted field against the original invoice before saving.");
    } catch (e) {
      setScanMsg("Could not read this invoice automatically: " + ((e as Error)?.message || "Try another PDF."));
    } finally {
      setScanning(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const vendorName = form.vendor.trim();
    if (!vendorName) return alert("Enter or select a vendor name.");
    if (!form.glAccountId) return alert("Select an expense category.");
    if (!lockedEdit && n(form.total) <= 0) return alert("Enter an invoice total greater than zero.");
    if (file && file.size > 20 * 1024 * 1024) return alert("Invoice files must be 20 MB or smaller.");
    const payNow = !editing && form.paymentStatus === "PAID";
    if (payNow) {
      if (form.source === "BANK" && !form.bankAccountId) return alert("Select an Operating bank account for payment.");
      if (form.source === "BANK" && form.method === "CHEQUE" && !form.chequeNumber.trim()) return alert("Enter a cheque number.");
      if (form.source === "BANK" && form.method === "EFT" && !form.reference.trim()) return alert("Enter the EFT reference / confirmation number.");
      if (form.source === "EMPLOYEE" && !form.employeeId) return alert("Select the employee who paid the invoice.");
      if ((form.source === "SHAREHOLDER" || form.source === "OTHER") && !form.payeeName.trim()) return alert("Enter the name of the person who paid the invoice.");
    }
    setSaving(true);
    try {
      const vendorId = lockedEdit ? editing!.vendorId : await resolveVendor(vendorName);
      if (!vendorId) return;
      const fd = new FormData();
      if (editing) fd.append("uuid", editing.uuid);
      fd.append("vendorId", String(vendorId));
      fd.append("glAccountId", lockedEdit ? String(editing!.glAccountId) : form.glAccountId);
      fd.append("billDate", lockedEdit ? d10(editing!.billDate) : form.billDate);
      fd.append("dueDate", form.dueDate);
      fd.append("invoiceNumber", form.invoiceNumber.trim());
      fd.append("description", form.description.trim());
      fd.append("branchId", form.branchId);
      fd.append("taxInclusive", "true");
      fd.append("total", String(n(form.total)));
      fd.append("hstRate", form.hstRate);
      if (file) fd.append("file", file);
      const saved = (await run("/bills", fd, { silent: !!(form.approveNow || payNow), success: editing ? "Invoice changes saved." : "Invoice saved." })) as Bill | null;
      if (!saved) return;
      if (!editing && (form.approveNow || payNow)) {
        if (!(await run(`/bills/${saved.uuid}/approve`, { decision: "APPROVED" }, { silent: true }))) return void billsQ.refetch();
        if (!(await run(`/bills/${saved.uuid}/post`, {}, { silent: !payNow, success: "Invoice approved and posted." }))) return void billsQ.refetch();
        if (payNow) {
          const emp = employees.find((x) => String(x.id) === form.employeeId);
          await run(`/bills/${saved.uuid}/pay`, {
            paymentDate: form.billDate,
            amount: n(form.total),
            method: form.source === "BANK" ? form.method : SOURCE_METHOD[form.source],
            bankAccountId: form.source === "BANK" ? Number(form.bankAccountId) : undefined,
            chequeNumber: form.source === "BANK" && form.method === "CHEQUE" ? form.chequeNumber.trim() : undefined,
            reference: form.source === "BANK" && form.method === "EFT" ? form.reference.trim() : form.invoiceNumber.trim() || undefined,
            payeeName: form.source === "EMPLOYEE" ? emp?.name : form.source === "BANK" ? undefined : form.payeeName.trim(),
          }, { success: "Invoice approved, posted and paid." });
        }
      }
      setFormOpen(false);
      setEditing(null);
      setFile(null);
    } finally {
      setSaving(false);
    }
  };

  // ---------- row actions ----------
  const approve = async (b: Bill, decision: "APPROVED" | "REJECTED") => {
    if (!(await run(`/bills/${b.uuid}/approve`, { decision }, { silent: decision === "APPROVED" }))) return;
    if (decision === "APPROVED") await run(`/bills/${b.uuid}/post`, {}, { success: "Invoice approved and posted to the general ledger." });
  };
  const post = (b: Bill) => run(`/bills/${b.uuid}/post`, {});
  const deleteDraft = async (b: Bill) => {
    if (!window.confirm(`Delete draft invoice ${b.invoiceNumber || b.billNumber}${b.vendor ? " — " + b.vendor.name : ""}? Draft invoices have no ledger entries. This cannot be undone.`)) return;
    await run(`/bills/${b.uuid}`, undefined, { method: "DELETE" });
  };
  const confirmVoid = async () => {
    if (!voiding || !voidReason.trim()) return;
    if (await run(`/bills/${voiding.uuid}/void`, { reason: voidReason.trim() }, { success: "Invoice voided and reversal journal entry created." })) {
      setVoiding(null);
      setVoidReason("");
    }
  };
  const voidPayment = async (p: Payment) => {
    if (!window.confirm(`Void the ${fr(p.amount)} payment dated ${d10(p.paymentDate)}? A reversing journal entry is created and the invoice balance is restored.`)) return;
    if (await run(`/bill-payments/${p.uuid}/void`, {})) setDetails(null);
  };
  const removeAttachment = async (b: Bill) => {
    const reason = window.prompt("Why are you deleting the stored vendor invoice attachment? The reason will be retained in the audit history.");
    if (reason === null) return;
    if (!reason.trim()) return alert("A deletion reason is required.");
    if (!window.confirm(`Delete the stored invoice attachment for ${b.invoiceNumber || b.vendor?.name || "this invoice"}? This does not delete the accounting invoice or payment records.`)) return;
    if (await run(`/bills/${b.uuid}/remove-attachment`, { reason: reason.trim() })) setDetails(null);
  };
  const openPay = (b: Bill) => {
    const bankId = operatingBanks[0] ? String(operatingBanks[0].id) : "";
    setPaying(b);
    setPay({ source: "BANK", bankAccountId: bankId, employeeId: "", payeeName: "", amount: balance(b).toFixed(2), paymentDate: todayYmd(), method: "CHEQUE", chequeNumber: nextCheque(bankId), reference: "" });
  };
  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paying) return;
    const amt = n(pay.amount), due = balance(paying);
    if (!(amt > 0) || amt > due + 0.001) return alert("Enter an amount greater than zero and no more than " + fr(due));
    if (pay.source === "BANK" && !pay.bankAccountId) return alert("Select an operating bank account.");
    if (pay.source === "EMPLOYEE" && !pay.employeeId) return alert("Select the employee who paid.");
    if ((pay.source === "SHAREHOLDER" || pay.source === "OTHER") && !pay.payeeName.trim()) return alert("Enter the name of the person who paid.");
    if (pay.source === "BANK" && pay.method === "CHEQUE" && !pay.chequeNumber.trim()) return alert("Enter a cheque number.");
    if (pay.source === "BANK" && pay.method === "EFT" && !pay.reference.trim()) return alert("Enter the EFT reference / confirmation number.");
    const emp = employees.find((x) => String(x.id) === pay.employeeId);
    const ok = await run(`/bills/${paying.uuid}/pay`, {
      paymentDate: pay.paymentDate,
      amount: amt,
      method: pay.source === "BANK" ? pay.method : SOURCE_METHOD[pay.source],
      bankAccountId: pay.source === "BANK" ? Number(pay.bankAccountId) : undefined,
      chequeNumber: pay.source === "BANK" && pay.method === "CHEQUE" ? pay.chequeNumber.trim() : undefined,
      reference: pay.reference.trim() || undefined,
      payeeName: pay.source === "EMPLOYEE" ? emp?.name : pay.source === "BANK" ? undefined : pay.payeeName.trim(),
    }, { success: "Payment recorded." });
    if (ok) setPaying(null);
  };

  // ---------- recurring schedules ----------
  const openRecurring = (t?: Recurring) => {
    setRecurringEdit(t || null);
    setRform(t
      ? { vendor: t.vendor?.name || "", description: t.description || "", glAccountId: String(t.glAccountId || ""), total: String(n(t.invoiceTotal)), hstRate: String(n(t.hstRate)), frequency: t.frequency, startDate: d10(t.startDate), nextInvoiceDate: d10(t.nextInvoiceDate), dueDays: String(t.dueDays ?? 0) }
      : emptyRecurring());
    setRecurringOpen(true);
  };
  const saveRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rform.vendor.trim() || n(rform.total) <= 0) return alert("Enter a vendor and invoice total greater than zero.");
    if (!rform.glAccountId) return alert("Select an expense category.");
    if (!rform.nextInvoiceDate) return alert("Choose the next invoice date.");
    setSaving(true);
    try {
      const vendorId = await resolveVendor(rform.vendor.trim());
      if (!vendorId) return;
      const ok = await run("/recurring-bills", {
        uuid: recurringEdit?.uuid, vendorId, description: rform.description.trim(), glAccountId: Number(rform.glAccountId), invoiceTotal: n(rform.total),
        hstRate: n(rform.hstRate), frequency: rform.frequency, startDate: recurringEdit ? rform.startDate : rform.nextInvoiceDate, nextInvoiceDate: rform.nextInvoiceDate,
        dueDays: Number(rform.dueDays || 0), active: recurringEdit ? recurringEdit.active : true,
      }, { success: recurringEdit ? "Recurring schedule updated." : "Recurring schedule saved." });
      if (ok) setRecurringOpen(false);
    } finally {
      setSaving(false);
    }
  };
  const toggleRecurring = (t: Recurring) =>
    run("/recurring-bills", { uuid: t.uuid, vendorId: t.vendorId, description: t.description, glAccountId: t.glAccountId, invoiceTotal: n(t.invoiceTotal), hstRate: n(t.hstRate), frequency: t.frequency, startDate: d10(t.startDate), nextInvoiceDate: d10(t.nextInvoiceDate), dueDays: t.dueDays, active: !t.active }, { success: t.active ? "Schedule paused." : "Schedule resumed." });
  const createFromRecurring = async (t: Recurring) => {
    const due = d10(t.nextInvoiceDate);
    if (due > todayYmd()) return alert("This invoice is not due to be generated until " + due + ".");
    if (!window.confirm(`Create a draft A/P invoice for ${t.vendor?.name || "this vendor"} dated ${due}? It will not be automatically approved or paid.`)) return;
    await run(`/recurring-bills/${t.uuid}/generate`, {});
  };
  const deleteRecurring = async (t: Recurring) => {
    const generated = bills.filter((b) => b.recurringTemplateId === t.id).length;
    if (!window.confirm(`Delete the recurring invoice schedule for ${t.vendor?.name || "this vendor"}? This stops future scheduled invoices. Invoices already generated${generated ? ` (${generated})` : ""} remain in Vendor Invoices & Expenses. This cannot be undone.`)) return;
    await run(`/recurring-bills/${t.uuid}`, undefined, { method: "DELETE", success: "Recurring invoice schedule deleted. Existing generated invoices were kept." });
  };

  const statusText = (b: Bill) => {
    if (b.status === "VOID") return "VOID";
    if (b.status === "DRAFT") return b.approvalStatus === "REJECTED" ? "REJECTED" : b.approvalStatus === "APPROVED" ? "APPROVED — NOT POSTED" : "PENDING APPROVAL";
    return b.paymentStatus;
  };
  const busy = loading || saving;
  const vendorOptions = <datalist id="dvac-vendors">{vendors.filter((v) => v.active).map((v) => <option key={v.id} value={v.name} />)}</datalist>;
  const categoryOptions = expenseAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>);

  return (
    <>
      <PageHead title="Expenses & A/P" desc="Enter vendor invoices, store the original documents securely, and track unpaid amounts through Accounts Payable.">
        <button className="primary" onClick={openNew}><LuPlus /> Add Vendor Invoice</button>
      </PageHead>
      <div className="grid4">
        <Stat title="Expenses" value={fr(totals.expenses)} sub="Before HST" />
        <Stat title="HST / ITCs" value={fr(totals.hst)} sub="Captured input tax" />
        <Stat title="Open A/P" value={fr(totals.open)} sub={`${totals.overdue} overdue invoice(s)`} />
        <Stat title="Paid" value={fr(totals.paid)} sub="Payments applied" />
      </div>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="paneltitle">
          <div>
            <h2>Recurring Invoices</h2>
            <p className="panelhint">For rent, utilities, software and other regular bills. Scheduled invoices are created as drafts for review, not automatically paid.</p>
          </div>
          <button className="primary" onClick={() => openRecurring()}><LuPlus /> Add Recurring Invoice</button>
        </div>
        {!recurring.length ? (
          <div className="empty small"><p>{recurringQ.isFetching ? "Loading recurring schedules…" : "No recurring invoice schedules yet."}</p></div>
        ) : (
          <div className="tablewrap">
            <table>
              <thead><tr><th>Vendor</th><th>Description</th><th>Frequency</th><th>Invoice Total</th><th>Next Invoice Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {recurring.map((t) => (
                  <tr key={t.uuid}>
                    <td>{t.vendor?.name}</td>
                    <td>{t.description || "—"}</td>
                    <td>{FREQ_LABEL[t.frequency] || t.frequency}</td>
                    <td>{fr(t.invoiceTotal)}</td>
                    <td>{d10(t.nextInvoiceDate)}</td>
                    <td><span className="status">{t.active ? "ACTIVE" : "PAUSED"}</span></td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {t.active && <button className="textbutton" disabled={busy} onClick={() => createFromRecurring(t)}>Create Invoice</button>}
                      <button className="textbutton" disabled={busy} onClick={() => toggleRecurring(t)}>{t.active ? "Pause" : "Resume"}</button>
                      <button className="textbutton" disabled={busy} onClick={() => openRecurring(t)}>Edit</button>
                      <button className="textbutton" style={{ color: "#a34e4e" }} disabled={busy} onClick={() => deleteRecurring(t)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel tablewrap">
        <div className="paneltitle" style={{ padding: 12 }}>
          <div>
            <h2>Vendor Invoices & Expenses</h2>
            <p className="panelhint">Filter and review expenses by branch.</p>
          </div>
          <label style={{ minWidth: 220 }}>Branch filter
            <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <option value="ALL">All branches</option>
              <option value="NONE">Company-wide / Head Office</option>
              {branches.map((b) => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </select>
          </label>
        </div>
        <table>
          <thead>
            <tr><th>Invoice Date</th><th>Vendor</th><th>Invoice #</th><th>Due Date</th><th>Category</th><th>Description</th><th>Amount</th><th>HST</th><th>Total</th><th>Paid</th><th>Balance Due</th><th>Status</th><th>Invoice File</th><th>Payment History</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {shown.length ? shown.map((b) => {
              const overdue = b.status === "POSTED" && b.dueDate && d10(b.dueDate) < today && balance(b) > 0;
              const activePayments = (b.payments || []).filter((p) => !p.voidedAt);
              return (
                <tr key={b.uuid} style={b.status === "VOID" ? { opacity: 0.55 } : undefined}>
                  <td><button className="textbutton" onClick={() => setDetails(b)} title="Click to view invoice details">{d10(b.billDate)}</button></td>
                  <td><button className="textbutton" onClick={() => setDetails(b)} title="Click to view invoice details">{b.vendor?.name}</button></td>
                  <td><button className="textbutton" onClick={() => setDetails(b)} title="Click to view invoice details">{b.invoiceNumber || "View invoice"}</button></td>
                  <td>{d10(b.dueDate) || "—"}</td>
                  <td>{b.glAccount?.name || glName(b.glAccountId)}</td>
                  <td>{b.description || "—"}</td>
                  <td>{fr(b.amount)}</td>
                  <td>{fr(b.hstAmount)}</td>
                  <td>{fr(b.total)}</td>
                  <td>{fr(b.amountPaid)}</td>
                  <td>{fr(balance(b))}</td>
                  <td>
                    <span className="status">{statusText(b)}</span>
                    {overdue && <> <span className="status" style={{ color: "#a34e4e" }}>OVERDUE</span></>}
                  </td>
                  <td>{b.attachmentUrl ? <a className="textbutton" href={b.attachmentUrl} target="_blank" rel="noreferrer">{b.attachmentName || "Open invoice"}</a> : "—"}</td>
                  <td><button className="textbutton" onClick={() => setDetails(b)}>View Details · {activePayments.length} payment(s)</button></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {b.status === "DRAFT" && b.approvalStatus !== "APPROVED" && <button className="textbutton" disabled={busy} onClick={() => approve(b, "APPROVED")}>Approve</button>}
                    {b.status === "DRAFT" && b.approvalStatus === "PENDING" && <button className="textbutton" disabled={busy} onClick={() => approve(b, "REJECTED")}>Reject</button>}
                    {b.status === "DRAFT" && b.approvalStatus === "APPROVED" && <button className="textbutton" disabled={busy} onClick={() => post(b)}>Post</button>}
                    {b.status !== "VOID" && <button className="textbutton" disabled={busy} onClick={() => openEdit(b)}>Edit Details</button>}
                    {b.status === "DRAFT" && <button className="textbutton" style={{ color: "#a34e4e" }} disabled={busy} onClick={() => deleteDraft(b)}>Delete Invoice</button>}
                    {b.status === "POSTED" && <button className="textbutton" disabled={busy} onClick={() => { setVoiding(b); setVoidReason(""); }}>Void / Reverse</button>}
                    {b.status === "POSTED" && balance(b) > 0 && <button className="textbutton" disabled={busy} onClick={() => openPay(b)}>Record Payment</button>}
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={15}>
                <div className="empty small">
                  <h3>{billsQ.isFetching ? "Loading vendor invoices…" : "No vendor invoices yet"}</h3>
                  <p>Add a supplier invoice and attach its PDF or image for secure storage.</p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </section>

      {voiding && (
        <Modal title={"Void / Reverse Invoice — " + (voiding.vendor?.name || "Vendor")} onClose={() => setVoiding(null)}>
          <Notice>Voiding creates a reversing journal entry for this invoice's expense, HST and A/P lines. {(voiding.payments || []).some((p) => !p.voidedAt) ? "This invoice has payments — void them first from View Details." : "The invoice stays in the list as VOID for audit history."}</Notice>
          <label>Reason for voiding
            <textarea value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Duplicate invoice, entered in error, etc." rows={3} />
          </label>
          <div className="modalactions">
            <button className="secondary" onClick={() => setVoiding(null)}>Cancel</button>
            <button className="primary" disabled={busy || !voidReason.trim()} onClick={confirmVoid}>{loading ? "Reversing…" : "Confirm Void / Reverse"}</button>
          </div>
        </Modal>
      )}

      {details && (
        <Modal title={"Invoice Details — " + (details.vendor?.name || "Vendor")} onClose={() => setDetails(null)}>
          <div className="formgrid">
            <label>Vendor<strong>{details.vendor?.name || "—"}</strong></label>
            <label>Invoice Number<strong>{details.invoiceNumber || "—"}</strong></label>
            <label>Invoice Date<strong>{d10(details.billDate) || "—"}</strong></label>
            <label>Due Date<strong>{d10(details.dueDate) || "—"}</strong></label>
            <label>Category<strong>{details.glAccount?.name || glName(details.glAccountId)}</strong></label>
            <label>Description<strong>{details.description || "—"}</strong></label>
            <label>Subtotal<strong>{fr(details.amount)}</strong></label>
            <label>HST ({n(details.hstRate)}%)<strong>{fr(details.hstAmount)}</strong></label>
            <label>Invoice Total<strong>{fr(details.total)}</strong></label>
            <label>Paid to Date<strong>{fr(details.amountPaid)}</strong></label>
            <label>Balance Due<strong>{fr(balance(details))}</strong></label>
            <label>Approval Status<strong>{details.approvalStatus}</strong></label>
            <label>Posting Status<strong>{details.status === "VOID" ? "Voided" : details.postedAt ? "Posted" : "Not posted"}</strong></label>
            <label>Bill Number<strong>{details.billNumber}</strong></label>
          </div>
          <h3 style={{ marginTop: 18 }}>Who Paid / Payment Records</h3>
          {(details.payments || []).length ? (details.payments || []).map((p) => (
            <div key={p.uuid} className="notice" style={{ display: "block", opacity: p.voidedAt ? 0.55 : 1 }}>
              <strong>{paidBy(p, banks)}{p.payeeName ? ` — ${p.payeeName}` : ""}{p.voidedAt ? " (voided)" : ""}</strong>
              <div>Date: {d10(p.paymentDate) || "—"} · Amount: {fr(p.amount)}</div>
              <div>Reference: {p.method === "CHEQUE" ? `Cheque #${p.chequeNumber || "—"}` : p.reference || "—"}{p.method === "CHEQUE" && p.reference ? ` · ${p.reference}` : ""}</div>
              {!p.voidedAt && (
                <div style={{ marginTop: 6 }}>
                  {p.method === "CHEQUE" && <button className="textbutton" onClick={() => printCheque(p, details)}>Print Cheque #{p.chequeNumber || ""}</button>}
                  <button className="textbutton" style={{ color: "#a34e4e" }} disabled={busy} onClick={() => voidPayment(p)}>Void Payment</button>
                </div>
              )}
            </div>
          )) : <p className="muted">No payment record is linked to this invoice yet.</p>}
          {details.attachmentUrl && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
              <span>Attached invoice: {details.attachmentName || "Invoice document"}</span>
              <a className="secondary" href={details.attachmentUrl} target="_blank" rel="noreferrer" style={{ padding: "7px 12px", borderRadius: 8 }}>Open attachment</a>
              <button className="textbutton" style={{ color: "#a34e4e" }} disabled={busy} onClick={() => removeAttachment(details)}>Delete attachment</button>
            </div>
          )}
          <div className="modalactions"><button className="secondary" onClick={() => setDetails(null)}>Close</button></div>
        </Modal>
      )}

      {recurringOpen && (
        <Modal title={recurringEdit ? "Edit Recurring Vendor Invoice" : "Set Up Recurring Vendor Invoice"} onClose={() => setRecurringOpen(false)}>
          <form onSubmit={saveRecurring}>
            <div className="formgrid">
              <label>Vendor / Landlord
                <input list="dvac-vendors" value={rform.vendor} onChange={(e) => setRform({ ...rform, vendor: e.target.value })} placeholder="Landlord or supplier" required />
              </label>
              <label>Description
                <input value={rform.description} onChange={(e) => setRform({ ...rform, description: e.target.value })} placeholder="Office rent — Progress Ave" />
              </label>
              <label>Expense Category
                <select value={rform.glAccountId} onChange={(e) => setRform({ ...rform, glAccountId: e.target.value })} required>
                  <option value="">Select category</option>
                  {categoryOptions}
                </select>
              </label>
              <label>Invoice Total (including HST)
                <MoneyInput value={rform.total} onChange={(v) => setRform({ ...rform, total: v })} min={0} required />
              </label>
              <label>HST Rate
                <select value={rform.hstRate} onChange={(e) => setRform({ ...rform, hstRate: e.target.value })}>
                  {HST_RATES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <small style={fieldhint}>Use the rate shown on the supplier invoice. Commercial rent may have HST; residential rent is generally exempt.</small>
              </label>
              <label>Frequency
                <select value={rform.frequency} onChange={(e) => setRform({ ...rform, frequency: e.target.value })}>
                  {Object.entries(FREQ_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label>First / Next Invoice Date
                <input type="date" value={rform.nextInvoiceDate} onChange={(e) => setRform({ ...rform, nextInvoiceDate: e.target.value })} required />
              </label>
              <label>Payment Due After (days)
                <input type="number" min={0} value={rform.dueDays} onChange={(e) => setRform({ ...rform, dueDays: e.target.value })} />
                <small style={fieldhint}>For example, 0 for due immediately or 30 for net 30.</small>
              </label>
            </div>
            {vendorOptions}
            <Notice>Each scheduled occurrence creates a new unpaid draft invoice. It is not automatically approved, posted or paid. Review the bill, attach the actual invoice if available, approve/post it, and record whether the company or someone personally paid it.</Notice>
            <div className="modalactions">
              <button type="button" className="secondary" onClick={() => setRecurringOpen(false)}>Cancel</button>
              <button className="primary" disabled={busy}><LuSave size={16} /> {saving ? "Saving schedule…" : recurringEdit ? "Save Changes" : "Save Recurring Schedule"}</button>
            </div>
          </form>
        </Modal>
      )}

      {formOpen && (
        <Modal title={editing ? (lockedEdit ? "Edit Posted Invoice Details" : "Edit Vendor Invoice") : "Add Vendor Invoice / Expense"} onClose={() => setFormOpen(false)}>
          <form onSubmit={save}>
            <div className="formgrid">
              {lockedEdit && (
                <div className="notice" style={{ gridColumn: "1 / -1", margin: 0 }}>
                  <LuCircleAlert /> This invoice is already posted or paid. You can correct the invoice number, description, due date and attachment here. Vendor, date, category and amounts are locked to protect the accounting ledger — void and re-enter to change them.
                </div>
              )}
              <label>Invoice Date
                <input type="date" value={form.billDate} onChange={(e) => setF({ billDate: e.target.value })} disabled={lockedEdit} required />
              </label>
              <label>Vendor / Supplier
                <input list="dvac-vendors" value={form.vendor} onChange={(e) => setF({ vendor: e.target.value })} placeholder="Select or type a new vendor" disabled={lockedEdit} required />
                <small style={fieldhint}>Choose an existing vendor or type a new name. New vendors are saved to the vendor list when you save this invoice.</small>
              </label>
              <label>Vendor Invoice Number
                <input value={form.invoiceNumber} onChange={(e) => setF({ invoiceNumber: e.target.value })} placeholder="Invoice number on vendor document" />
              </label>
              <label>Payment Due Date
                <input type="date" value={form.dueDate} onChange={(e) => setF({ dueDate: e.target.value })} />
              </label>
              <label>Branch
                <select value={form.branchId} onChange={(e) => setF({ branchId: e.target.value })} disabled={lockedEdit}>
                  <option value="">Company-wide / Head Office</option>
                  {branches.map((b) => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                </select>
                <small style={fieldhint}>Assign this expense to the branch that incurred it.</small>
              </label>
              <label>Expense Category
                <select value={form.glAccountId} onChange={(e) => setF({ glAccountId: e.target.value })} disabled={lockedEdit} required>
                  <option value="">Select expense category</option>
                  {categoryOptions}
                </select>
              </label>
              <label>Description
                <input value={form.description} onChange={(e) => setF({ description: e.target.value })} />
              </label>
              <label>Invoice Total (including HST)
                <MoneyInput value={form.total} onChange={(v) => setF({ total: v })} min={0} disabled={lockedEdit} required />
                <small style={fieldhint}>Enter the exact total printed on the vendor invoice.</small>
              </label>
              <label>HST Rate
                <select value={form.hstRate} onChange={(e) => setF({ hstRate: e.target.value })} disabled={lockedEdit}>
                  {HST_RATES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <div className="notice" style={{ gridColumn: "1 / -1", margin: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, width: "100%" }}>
                  <div><small>Expense before HST</small><strong style={{ display: "block" }}>{fr(preview.amount)}</strong></div>
                  <div><small>HST / potential ITC</small><strong style={{ display: "block" }}>{fr(preview.hst)}</strong></div>
                  <div><small>Total invoice</small><strong style={{ display: "block" }}>{fr(form.total)}</strong></div>
                </div>
              </div>
              {!lockedEdit && (
                <div className="notice" style={{ gridColumn: "1 / -1", margin: 0 }}>
                  <div>
                    <strong>Scan invoice from your phone</strong>
                    <p style={{ margin: "4px 0 10px" }}>Take a clear photo or upload a PDF. PDF invoices are read automatically to fill in the invoice fields. Check all fields before saving.</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <label className="secondary" style={fileLabel}>
                        <LuCamera size={16} /> {scanning ? "Reading…" : "Take Photo / Scan"}
                        <input type="file" accept="image/*" capture="environment" disabled={scanning} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) scan(f); }} />
                      </label>
                      <label className="secondary" style={fileLabel}>
                        <LuUpload size={16} /> Upload Photo / PDF
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" disabled={scanning} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) scan(f); }} />
                      </label>
                    </div>
                    {scanMsg && <p style={{ marginTop: 8 }}>{scanMsg}</p>}
                  </div>
                </div>
              )}
              <label>Invoice Document (PDF, JPG, PNG; max 20 MB)
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {file && <small style={fieldhint}>{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</small>}
                {!file && editing?.attachmentName && <small style={fieldhint}>Current: {editing.attachmentName}. Choose a file to replace it.</small>}
              </label>
              {!editing && (
                <label>Payment Status
                  <select value={form.paymentStatus} onChange={(e) => setF({ paymentStatus: e.target.value })}>
                    <option value="UNPAID">Unpaid — record payment later</option>
                    <option value="PAID">Paid in full — record payment now</option>
                  </select>
                </label>
              )}
              {!editing && form.paymentStatus === "PAID" && (
                <>
                  <label>Who Paid the Invoice?
                    <select value={form.source} onChange={(e) => setF({ source: e.target.value })}>
                      <option value="BANK">Company operating bank account</option>
                      <option value="EMPLOYEE">Employee paid personally</option>
                      <option value="SHAREHOLDER">Director / shareholder paid personally</option>
                      <option value="OTHER">Other individual paid personally</option>
                    </select>
                  </label>
                  {form.source === "BANK" && (
                    <>
                      <label>Operating Bank Account
                        <select value={form.bankAccountId} onChange={(e) => setF({ bankAccountId: e.target.value, chequeNumber: nextCheque(e.target.value) })}>
                          <option value="">Select operating bank account</option>
                          {operatingBanks.map((b) => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                        </select>
                      </label>
                      <label>Payment Method
                        <select value={form.method} onChange={(e) => setF({ method: e.target.value })}>
                          <option value="CHEQUE">Cheque</option>
                          <option value="EFT">Electronic Funds Transfer (EFT)</option>
                        </select>
                      </label>
                      {form.method === "CHEQUE" ? (
                        <label>Cheque Number<input value={form.chequeNumber} onChange={(e) => setF({ chequeNumber: e.target.value })} placeholder="Auto-numbered; edit if needed" /></label>
                      ) : (
                        <label>EFT Reference / Confirmation #<input value={form.reference} onChange={(e) => setF({ reference: e.target.value })} placeholder="Enter EFT confirmation number" /></label>
                      )}
                    </>
                  )}
                  {form.source === "EMPLOYEE" && (
                    <label>Employee Who Paid
                      <select value={form.employeeId} onChange={(e) => setF({ employeeId: e.target.value })}>
                        <option value="">Select employee</option>
                        {employees.map((x) => <option key={x.id} value={String(x.id)}>{x.name}</option>)}
                      </select>
                      <small style={fieldhint}>Credits Employee Reimbursements Payable; no company bank account is reduced.</small>
                    </label>
                  )}
                  {(form.source === "SHAREHOLDER" || form.source === "OTHER") && (
                    <label>{form.source === "SHAREHOLDER" ? "Director / Shareholder Who Paid" : "Other Person Who Paid"}
                      <input value={form.payeeName} onChange={(e) => setF({ payeeName: e.target.value })} placeholder="Full name" />
                      <small style={fieldhint}>{form.source === "SHAREHOLDER" ? "Credits Shareholder / Director Loan Payable." : "Credits Other Personal Reimbursements Payable."} No company bank account is reduced.</small>
                    </label>
                  )}
                </>
              )}
              {!editing && form.paymentStatus === "UNPAID" && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: "row" }}>
                  <input type="checkbox" checked={form.approveNow} onChange={(e) => setF({ approveNow: e.target.checked })} style={{ width: "auto" }} />
                  Approve and post this invoice now
                </label>
              )}
            </div>
            {vendorOptions}
            <Notice>The invoice file is stored privately with the bill. Approving posts the expense, HST/ITC and Accounts Payable to the general ledger; unpaid invoices remain in Accounts Payable. Trust accounts cannot be used for operating expenses.</Notice>
            <div className="modalactions">
              <button type="button" className="secondary" onClick={() => setFormOpen(false)}>Cancel</button>
              <button className="primary" disabled={busy || scanning}><LuSave size={16} /> {saving ? "Saving invoice…" : editing ? "Save Invoice Changes" : "Save Invoice"}</button>
            </div>
          </form>
        </Modal>
      )}

      {paying && (
        <Modal title={"Record Payment — " + (paying.vendor?.name || "Vendor Invoice")} onClose={() => setPaying(null)}>
          <form onSubmit={recordPayment}>
            <div className="formgrid">
              <div className="notice" style={{ gridColumn: "1 / -1", margin: 0, display: "block" }}>
                <strong>Remaining balance: {fr(balance(paying))}</strong>
                <p style={{ margin: "4px 0 0" }}>Choose who paid the vendor. Personal payments create a liability owed by the company and do not reduce the company bank balance.</p>
              </div>
              <label>Paid By / Payment Source
                <select value={pay.source} onChange={(e) => setPay({ ...pay, source: e.target.value })}>
                  <option value="BANK">Company operating bank account</option>
                  <option value="EMPLOYEE">Employee personal funds / card</option>
                  <option value="SHAREHOLDER">Director / shareholder personal funds / card</option>
                  <option value="OTHER">Other individual paid personally</option>
                </select>
              </label>
              {pay.source === "BANK" && (
                <>
                  <label>Operating Bank Account
                    <select value={pay.bankAccountId} onChange={(e) => setPay({ ...pay, bankAccountId: e.target.value, chequeNumber: nextCheque(e.target.value) })}>
                      <option value="">Select operating account</option>
                      {operatingBanks.map((b) => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                    </select>
                  </label>
                  <label>Payment Method
                    <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
                      <option value="CHEQUE">Cheque</option>
                      <option value="EFT">Electronic Funds Transfer (EFT)</option>
                    </select>
                  </label>
                  {pay.method === "CHEQUE" ? (
                    <label>Cheque Number
                      <input value={pay.chequeNumber} onChange={(e) => setPay({ ...pay, chequeNumber: e.target.value })} placeholder="Auto-numbered; edit if needed" />
                      <small style={fieldhint}>Automatically suggests the next number. You can override it manually.</small>
                    </label>
                  ) : (
                    <label>EFT Reference / Confirmation #
                      <input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} placeholder="Enter EFT confirmation number" />
                    </label>
                  )}
                </>
              )}
              {pay.source === "EMPLOYEE" && (
                <label>Employee
                  <select value={pay.employeeId} onChange={(e) => setPay({ ...pay, employeeId: e.target.value })}>
                    <option value="">Select employee</option>
                    {employees.map((x) => <option key={x.id} value={String(x.id)}>{x.name}</option>)}
                  </select>
                  <small style={fieldhint}>The amount will be credited to Employee Reimbursements Payable.</small>
                </label>
              )}
              {(pay.source === "SHAREHOLDER" || pay.source === "OTHER") && (
                <label>{pay.source === "SHAREHOLDER" ? "Director / Shareholder Name" : "Other Person Name"}
                  <input value={pay.payeeName} onChange={(e) => setPay({ ...pay, payeeName: e.target.value })} placeholder="Name of person who paid" />
                  <small style={fieldhint}>{pay.source === "SHAREHOLDER" ? "The amount will be credited to Shareholder / Director Loan Payable." : "The amount will be credited to Other Personal Reimbursements Payable."}</small>
                </label>
              )}
              <label>Payment Amount<MoneyInput value={pay.amount} onChange={(v) => setPay({ ...pay, amount: v })} min={0} required /></label>
              <label>Payment Date<input type="date" value={pay.paymentDate} onChange={(e) => setPay({ ...pay, paymentDate: e.target.value })} required /></label>
              {!(pay.source === "BANK" && pay.method === "EFT") && (
                <label>Reference / Notes<input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} placeholder="Receipt, card, or transaction reference" /></label>
              )}
            </div>
            <Notice>For personal payments, the invoice is marked paid against the vendor and the company liability to the employee or shareholder is recorded. Repaying that liability later should be recorded separately.</Notice>
            <div className="modalactions">
              <button type="button" className="secondary" onClick={() => setPaying(null)}>Cancel</button>
              <button className="primary" disabled={busy}>{loading ? "Recording…" : "Record Payment"}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
