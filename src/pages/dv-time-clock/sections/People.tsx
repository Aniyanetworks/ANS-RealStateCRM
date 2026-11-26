import { useEffect, useState } from "react";
import { useCan, useTcAction, useTimeClock, Me } from "../TimeClockContext";
import { Branch, Holiday, Member, fmtDate, money } from "../tcUtils";


function AddEmployeeForm() {
  const { branches, toast, closeModal, me } = useTimeClock();
  const act = useTcAction();
  const [f, setF] = useState({ fullName: "", email: "", phone: "", password: "", employeeCode: "", username: "", branchId: "", payType: "hourly", hourlyRate: "", monthlySalary: "", yearlySalary: "" });
  const save = async () => {
    if (!f.fullName.trim() || !f.email.trim() || !f.phone.trim() || !f.password || !f.employeeCode.trim()) return toast("Full name, email, phone number, password and Employee ID are required.");
    if (f.password.length < 8) return toast("Temporary password must be at least 8 characters.");
    if (!["superadmin", "admin", "management"].includes(me.role)) return toast("Management access required.");
    try {
      await act("/members", "POST", {
        fullName: f.fullName.trim(), email: f.email.trim().toLowerCase(), phone: f.phone.trim(), password: f.password, employeeCode: f.employeeCode.trim(), username: f.username.trim() || null,
        branchId: f.branchId || null, payType: f.payType, hourlyRate: Number(f.hourlyRate) || null, monthlySalary: Number(f.monthlySalary) || null, yearlySalary: Number(f.yearlySalary) || null,
      });
      closeModal();
      toast("Employee account created successfully.");
    } catch (e) {
      toast((e as Error).message || "Unable to create employee.");
    }
  };
  const field = (label: string, key: keyof typeof f, props: Record<string, unknown> = {}) => (
    <div className="field"><label>{label}</label><input value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} {...props} /></div>
  );
  return (
    <>
      <div className="notice">Create the employee account directly here. Assign a branch so GPS geofencing can be used for clock-in. If the email already has an ANS RealStateCRM login, that login is added as an employee and keeps its password.</div>
      <div className="formgrid">
        {field("Full Name *", "fullName", { autoComplete: "name" })}
        {field("Email *", "email", { type: "email", autoComplete: "email" })}
        {field("Phone Number *", "phone", { type: "tel", autoComplete: "tel", placeholder: "e.g. 416-555-1234" })}
        <div className="field"><label>Temporary Password *</label><input type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /><small className="muted">Minimum 8 characters.</small></div>
        {field("Employee ID *", "employeeCode")}
        {field("Username", "username", { autoComplete: "username" })}
        <div className="field"><label>Branch</label>
          <select value={f.branchId} onChange={(e) => setF({ ...f, branchId: e.target.value })}>
            <option value="">No branch assigned</option>
            {branches.filter((b) => b.active !== false).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Pay Type</label>
          <select value={f.payType} onChange={(e) => setF({ ...f, payType: e.target.value })}>
            <option value="hourly">Hourly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
          </select>
        </div>
        {field("Hourly Rate", "hourlyRate", { type: "number", step: "0.01" })}
        {field("Monthly Salary", "monthlySalary", { type: "number", step: "0.01" })}
        {field("Yearly Salary", "yearlySalary", { type: "number", step: "0.01" })}
      </div>
      <button onClick={save}>Create Employee</button>
    </>
  );
}

function EditEmployeeForm({ e }: { e: Member }) {
  const { branches, toast, closeModal } = useTimeClock();
  const can = useCan();
  const act = useTcAction();
  const [f, setF] = useState({ phone: e.phone || "", employeeCode: e.employeeCode || "", username: e.username || "", branchId: e.branchId ? String(e.branchId) : "", payType: e.payType || "hourly", hourlyRate: e.hourlyRate ? String(e.hourlyRate) : "", monthlySalary: e.monthlySalary ? String(e.monthlySalary) : "", yearlySalary: e.yearlySalary ? String(e.yearlySalary) : "" });
  const [assigned, setAssigned] = useState<string[]>(() => [...new Set([...(e.branchIds || []), ...(e.branchId ? [e.branchId] : [])])].map(String));
  const showPay = can("payroll.view_salary");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const branchIds = [...new Set([...assigned, ...(f.branchId ? [f.branchId] : [])])].map(Number);
    setBusy(true);
    try {
      await act(`/members/${e.userId}`, "PATCH", {
        phone: f.phone.trim() || null, employeeCode: f.employeeCode.trim(), username: f.username.trim() || null, branchId: f.branchId || null, branchIds,
        ...(showPay ? { payType: f.payType, hourlyRate: Number(f.hourlyRate) || null, monthlySalary: Number(f.monthlySalary) || null, yearlySalary: Number(f.yearlySalary) || null } : {}),
      });
      closeModal();
      toast("Employee and branch assignments updated.");
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const initials = (e.fullName || e.email || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const toggleBranch = (id: string) => setAssigned((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const payField = f.payType === "monthly"
    ? { key: "monthlySalary" as const, label: "Monthly Salary" }
    : f.payType === "yearly" ? { key: "yearlySalary" as const, label: "Yearly Salary" } : { key: "hourlyRate" as const, label: "Hourly Rate" };
  const section = (title: string) => <div className="span3" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--muted)", borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 2 }}>{title}</div>;
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, border: "1px solid var(--line)", borderRadius: 12, background: "#f8f9fb", marginBottom: 16 }}>
        <span style={{ display: "grid", placeItems: "center", width: 42, height: 42, borderRadius: "50%", background: "var(--navy)", color: "#fff", fontWeight: 800, flex: "0 0 auto" }}>{initials}</span>
        <div style={{ minWidth: 0 }}>
          <b style={{ display: "block", color: "var(--navy)" }}>{e.fullName || "—"}</b>
          <span className="muted" style={{ fontSize: 12, overflowWrap: "anywhere" }}>{e.email || "No email"} · {e.role === "employee" ? "Employee" : e.role}</span>
        </div>
        <span className={`pill ${e.active ? "green" : ""}`} style={{ marginLeft: "auto" }}>{e.active ? "Active" : "Inactive"}</span>
      </div>
      <div className="formgrid">
        {section("Contact & ID")}
        <div className="field"><label>Phone Number</label><input type="tel" placeholder="Not on file in ANS RealStateCRM" value={f.phone} onChange={(x) => setF({ ...f, phone: x.target.value })} /></div>
        <div className="field"><label>Employee ID</label><input value={f.employeeCode} onChange={(x) => setF({ ...f, employeeCode: x.target.value })} /></div>
        <div className="field"><label>Username <span style={{ fontWeight: 500 }}>(optional)</span></label><input autoComplete="off" name="tc-employee-username" placeholder="Not set" value={f.username} onChange={(x) => setF({ ...f, username: x.target.value })} /></div>

        {section("Branches")}
        <div className="field"><label>Primary Branch</label>
          <select value={f.branchId} onChange={(x) => setF({ ...f, branchId: x.target.value })}>
            <option value="">No primary branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field span3"><label>Also works at</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {branches.map((b) => {
              const id = String(b.id), primary = id === f.branchId, on = primary || assigned.includes(id);
              return (
                <label key={b.id} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 12px", border: `1px solid ${on ? "var(--gold)" : "var(--line)"}`, borderRadius: 9, background: on ? "#faf6ef" : "#fff", fontSize: 13, fontWeight: 600, color: "var(--navy)", cursor: primary ? "default" : "pointer", margin: 0 }}>
                  <input type="checkbox" checked={on} disabled={primary} onChange={() => toggleBranch(id)} style={{ width: "auto", margin: 0 }} />
                  {b.name}{primary && <small className="muted">(primary)</small>}
                </label>
              );
            })}
          </div>
        </div>

        {showPay && (
          <>
            {section("Pay")}
            <div className="field"><label>Pay Type</label>
              <select value={f.payType} onChange={(x) => setF({ ...f, payType: x.target.value })}>
                <option value="hourly">Hourly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="field"><label>{payField.label}</label><input type="number" min="0" step="0.01" placeholder="Not set" value={f[payField.key]} onChange={(x) => setF({ ...f, [payField.key]: x.target.value })} /></div>
          </>
        )}
      </div>
      <div className="actions" style={{ justifyContent: "flex-end", borderTop: "1px solid var(--line)", paddingTop: 14, marginTop: 6 }}>
        <button className="ghost" onClick={closeModal}>Cancel</button>
        <button disabled={busy} onClick={save}>{busy ? "Saving…" : "Save Employee"}</button>
      </div>
    </>
  );
}

export function EmployeesSection() {
  const { members, branches, openModal, startImpersonation } = useTimeClock();
  const can = useCan();
  const rows = members.filter((m) => m.isEmployee);
  const showPay = can("payroll.view_salary");
  return (
    <div className="panel">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <div><h2>Employees</h2><p className="muted">Employee IDs are unique. Compensation is stored centrally.</p></div>
        <button onClick={() => openModal("Add Employee", <AddEmployeeForm />)}>Add Employee</button>
      </div>
      <div className="tablewrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Employee ID</th><th>Email</th><th>Phone</th>{showPay && <th>Pay</th>}<th>Branch</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.userId}>
                <td>{e.fullName}</td>
                <td>{e.employeeCode}</td>
                <td>{e.email}</td>
                <td>{e.phone || ""}</td>
                {showPay && <td>{e.payType}<br />{money(e.hourlyRate || e.monthlySalary || e.yearlySalary)}</td>}
                <td>{branches.find((b) => b.id === e.branchId)?.name || "Not Assigned"}</td>
                <td>{e.active ? <span className="pill green">Active</span> : "Inactive"}</td>
                <td>
                  <button className="ghost" onClick={() => openModal("Edit Employee", <EditEmployeeForm e={e} />)}>Edit</button>
                  {can("employee.impersonate") && (
                    <button className="ghost" onClick={() => startImpersonation({ ...(e as Me), isManager: ["superadmin", "admin", "management"].includes(e.role) }, ["superadmin", "admin", "management"].includes(e.role))}>Impersonate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function BranchForm({ b }: { b?: Branch }) {
  const { toast, closeModal } = useTimeClock();
  const act = useTcAction();
  const [f, setF] = useState({ name: b?.name || "", address: b?.address || "", latitude: b?.latitude != null ? String(b.latitude) : "", longitude: b?.longitude != null ? String(b.longitude) : "", radius: String(b?.radiusMeters || 100) });
  const save = async () => {
    if (!f.name.trim()) return toast("Branch name required.");
    try {
      await act(b ? `/branches/${b.id}` : "/branches", b ? "PATCH" : "POST", { name: f.name.trim(), address: f.address.trim(), latitude: Number(f.latitude) || null, longitude: Number(f.longitude) || null, radiusMeters: Number(f.radius) || 100 });
      closeModal();
      toast("Branch saved.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <>
      <div className="formgrid">
        <div className="field"><label>Name</label><input value={f.name} disabled={Boolean(b)} title={b ? "Branch names are managed in ANS RealStateCRM branch management." : undefined} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="field"><label>Address</label><input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
        <div className="field"><label>Latitude</label><input type="number" step="0.0000001" value={f.latitude} onChange={(e) => setF({ ...f, latitude: e.target.value })} /></div>
        <div className="field"><label>Longitude</label><input type="number" step="0.0000001" value={f.longitude} onChange={(e) => setF({ ...f, longitude: e.target.value })} /></div>
        <div className="field"><label>GPS Radius (m)</label><input type="number" value={f.radius} onChange={(e) => setF({ ...f, radius: e.target.value })} /></div>
      </div>
      <button onClick={save}>Save</button>
    </>
  );
}

export function BranchesSection() {
  const { branches, openModal } = useTimeClock();
  return (
    <div className="panel">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <h2>Branches &amp; GPS</h2>
        <button onClick={() => openModal("Branch", <BranchForm />)}>Add Branch</button>
      </div>
      <div className="tablewrap">
        <table className="table">
          <thead><tr><th>Branch</th><th>Address</th><th>GPS</th><th>Radius</th><th>Action</th></tr></thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.address || ""}</td>
                <td>{b.latitude ?? ""}, {b.longitude ?? ""}</td>
                <td>{b.radiusMeters}m</td>
                <td><button className="ghost" onClick={() => openModal("Branch", <BranchForm b={b} />)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export function AccessSection() {
  const { members, me, toast, realMe } = useTimeClock();
  const act = useTcAction();
  const groups = realMe.permissionGroups || [];
  const [userId, setUserId] = useState<string>(() => String(members[0]?.userId || ""));
  const person = members.find((m) => String(m.userId) === userId) || members[0];
  const [role, setRole] = useState(person?.role || "employee");
  const [active, setActive] = useState(person?.active !== false);
  const [perms, setPerms] = useState<Record<string, boolean>>(person?.permissions || {});
  useEffect(() => {
    if (!userId && members[0]) setUserId(String(members[0].userId));
  }, [members, userId]);
  useEffect(() => {
    if (!person) return;
    setRole(person.role);
    setActive(person.active !== false);
    setPerms(person.permissions || {});
  }, [person?.userId]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async () => {
    if (!person) return;
    if (role === "superadmin" && me.role !== "superadmin") return toast("Only a Superadmin can grant Superadmin access.");
    const permissions: Record<string, boolean> = {};
    for (const [, key] of groups) permissions[key] = perms[key] === true;
    try {
      await act(`/members/${person.userId}/access`, "PATCH", { role, active, permissions });
      toast("Management access updated.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <div className="panel">
      <h2>Management Access &amp; Permissions</h2>
      <p className="notice">Select an existing account, set its role, and choose exact permissions. Superadmin retains full access. ANS RealStateCRM Super Admins always have Superadmin access to the time clock.</p>
      <div className="formgrid">
        <div className="field"><label>Account</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            {members.map((p) => <option key={p.userId} value={p.userId}>{p.fullName} — {p.email} ({p.role})</option>)}
          </select>
        </div>
      </div>
      {person && (
        <>
          <div className="formgrid">
            <div className="field"><label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="employee">Employee</option><option value="management">Management</option><option value="admin">Admin</option><option value="superadmin">Superadmin</option>
              </select>
            </div>
            <div className="field"><label>Account status</label>
              <select value={String(active)} onChange={(e) => setActive(e.target.value === "true")}>
                <option value="true">Active</option><option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <h3>Permissions</h3>
          <div className="cards">
            {groups.map(([label, key]) => (
              <label key={key} className="card" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="checkbox" style={{ width: "auto" }} checked={perms[key] === true} onChange={(e) => setPerms({ ...perms, [key]: e.target.checked })} />
                {label}
              </label>
            ))}
          </div>
          <p className="muted">For newly configured accounts, unchecked permissions are denied in the app. Existing unconfigured management accounts retain current access until saved here.</p>
          <button onClick={save}>Save Access Settings</button>
        </>
      )}
    </div>
  );
}


export function SettingsSection() {
  const { settings, toast } = useTimeClock();
  const act = useTcAction();
  const [type, setType] = useState(settings.payPeriodType || "biweekly");
  const [anchor, setAnchor] = useState(settings.anchorDate || "2026-01-05");
  const [h, setH] = useState({ name: "", from: "", to: "" });
  const holidays = settings.optionalHolidays || [];
  useEffect(() => {
    setType(settings.payPeriodType || "biweekly");
    setAnchor(settings.anchorDate || "2026-01-05");
  }, [settings.payPeriodType, settings.anchorDate]);
  const savePeriod = async () => {
    if (["weekly", "biweekly"].includes(type) && !anchor) return toast("Choose an anchor date.");
    try {
      await act("/settings", "PATCH", { payPeriodType: type, anchorDate: anchor || null });
      toast("Pay period settings saved.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const persist = async (next: Holiday[], msg: string) => {
    try {
      const saved = await act<{ optionalHolidays: Holiday[] }>("/settings", "PATCH", { optionalHolidays: next });
      if (JSON.stringify(saved?.optionalHolidays || []) !== JSON.stringify(next)) {
        toast("Save completed, but the database did not return the same holiday list. Please try again.");
        return false;
      }
      toast(msg);
      return true;
    } catch (e) {
      toast(`Could not save optional holidays: ${(e as Error).message}`);
      return false;
    }
  };
  const addHoliday = async () => {
    const name = h.name.trim(), start = h.from, end = h.to || h.from;
    if (!name || !start) return toast("Enter a holiday name and start date.");
    if (end < start) return toast("To Date must be on or after From Date.");
    const overlaps = holidays.some((x) => {
      const a = x.start_date || x.date || "", b = x.end_date || x.date || a;
      return start <= b && end >= a;
    });
    if (overlaps) return toast("This date range overlaps an existing optional holiday. Remove or adjust the existing holiday first.");
    const next = [...holidays, { name, start_date: start, end_date: end }].sort((a, b) => String(a.start_date || a.date).localeCompare(String(b.start_date || b.date)));
    if (await persist(next, "Optional holiday saved and verified.")) setH({ name: "", from: "", to: "" });
  };
  const removeHoliday = (i: number) => {
    const next = holidays.slice();
    next.splice(i, 1);
    persist(next, "Optional holiday removed and verified.");
  };
  return (
    <>
      <div className="panel">
        <h2>General Settings — Pay Period</h2>
        <p className="muted">Set the pay period used for employee and management hour totals.</p>
        <div className="formgrid">
          <div className="field"><label>Pay period</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="weekly">Weekly</option><option value="biweekly">Bi-weekly</option><option value="semi-monthly">Semi-monthly (1–15 / 16–end)</option><option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="field"><label>Anchor/start date (weekly and bi-weekly)</label><input type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)} /></div>
        </div>
        <button onClick={savePeriod}>Save Pay Period</button>
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h2>Optional Office Holidays</h2>
        <p className="muted">Add one-off or additional closure dates. These dates will be labeled on the Scheduling calendar and blocked for shift creation unless management uses the holiday override.</p>
        <div className="formgrid">
          <div className="field"><label>Holiday name</label><input placeholder="e.g. Eid Holiday" value={h.name} onChange={(e) => setH({ ...h, name: e.target.value })} /></div>
          <div className="field"><label>From Date</label><input type="date" value={h.from} onChange={(e) => setH({ ...h, from: e.target.value })} /></div>
          <div className="field"><label>To Date (optional; same day if blank)</label><input type="date" value={h.to} onChange={(e) => setH({ ...h, to: e.target.value })} /></div>
        </div>
        <button onClick={addHoliday}>＋ Add Optional Holiday</button>
        <div style={{ marginTop: 12 }}>
          {holidays.length ? (
            <div className="tablewrap">
              <table className="table">
                <thead><tr><th>Holiday</th><th>From</th><th>To</th><th>Action</th></tr></thead>
                <tbody>
                  {holidays.map((x, i) => {
                    const from = x.start_date || x.date, to = x.end_date || x.date || from;
                    return <tr key={`${x.name}${from}`}><td>{x.name}</td><td>{fmtDate(from)}</td><td>{fmtDate(to)}</td><td><button className="danger" onClick={() => removeHoliday(i)}>Remove</button></td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          ) : <p className="muted">No optional holidays added.</p>}
        </div>
        <p className="muted" style={{ marginTop: 10 }}>Optional holidays are saved immediately when added or removed.</p>
      </div>
    </>
  );
}


export function AccountSection() {
  return (
    <>
      <div className="panel">
        <h2>Calendar Integration</h2>
        <p className="muted">Connect your own Google Calendar account. Your ANS Appointments Calendar continues to work independently.</p>
        <div className="notice">Not connected. Google Calendar sync isn't available in the ANS RealStateCRM time clock yet.</div>
        <div className="actions"><button className="secondary" disabled>Connect Google Calendar</button></div>
        <p className="muted">Google authorization is handled securely by the server. Never enter your Google password or client secret into ANS Time Clock.</p>
      </div>
    </>
  );
}

export function ProfileSection() {
  const { me, toast } = useTimeClock();
  const act = useTcAction();
  const [phone, setPhone] = useState(me.phone || "");
  useEffect(() => setPhone(me.phone || ""), [me.phone]);
  const save = async () => {
    try {
      await act("/me/profile", "PATCH", { userId: me.userId, phone: phone.trim() || null });
      toast("Profile updated.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <div className="panel">
      <h2>My Profile</h2>
      <div className="formgrid">
        <div className="field"><label>Full Name</label><input value={me.fullName || ""} disabled /></div>
        <div className="field"><label>Email</label><input value={me.email || ""} disabled /></div>
        <div className="field"><label>Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div className="field"><label>Employee ID</label><input value={me.employeeCode || ""} disabled /></div>
        <div className="field"><label>Username</label><input value={me.username || ""} disabled /></div>
      </div>
      <button onClick={save}>Save Phone Number</button>
    </div>
  );
}
