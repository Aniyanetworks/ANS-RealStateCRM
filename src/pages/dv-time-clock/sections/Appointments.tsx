// Appointments Calendar: month view of appointments, office events, unavailable-time blocks and holidays.
import { useState } from "react";
import { useTcGetQuery } from "../../../redux/api/common/dvTimeClockSlice";
import { useTcAction, useTimeClock } from "../TimeClockContext";
import { addMonths, builtinHolidayName, localInputDateTime, monthName, thisMonth } from "../tcUtils";
import { tcConfirm } from "../tcDialog";

type Appointment = { uuid: string; title: string; startAt: string; endAt: string; calendarOwnerId: number | null; branchId: number | null; location: string | null; notes: string | null; eventType: string };

function AppointmentForm({ a, rows }: { a: Appointment | null; rows: Appointment[] }) {
  const { me, members, branches, acting, toast, closeModal } = useTimeClock();
  const act = useTcAction();
  const canManage = ["superadmin", "admin", "management"].includes(me.role) && acting !== "employee";
  const owners = members.filter((p) => p.active !== false);
  const [f, setF] = useState({
    title: a?.title || "", start: a ? localInputDateTime(a.startAt) : "", end: a ? localInputDateTime(a.endAt) : "", owner: String(a?.calendarOwnerId || me.userId),
    branchId: a?.branchId ? String(a.branchId) : "", location: a?.location || "", type: a?.eventType === "block" ? "block" : "appointment", notes: a?.notes || "",
  });
  const save = async () => {
    if (a && !canManage) return toast("Only management can edit appointments.");
    if (!f.title.trim() || !f.start || !f.end || new Date(f.end) <= new Date(f.start)) return toast("Enter a title and valid start/end times.");
    if (f.type === "block" && !canManage) return toast("Only management can block unavailable time.");
    const startIso = new Date(f.start).toISOString(), endIso = new Date(f.end).toISOString();
    const conflict = rows.find((x) => x.uuid !== a?.uuid && String(x.calendarOwnerId) === f.owner && x.eventType === "block" && new Date(x.startAt) < new Date(endIso) && new Date(x.endAt) > new Date(startIso));
    if (f.type !== "block" && conflict) return toast("This calendar owner is unavailable during that time.");
    const body = { title: f.title.trim(), startAt: startIso, endAt: endIso, calendarOwnerId: Number(f.owner), branchId: f.branchId ? Number(f.branchId) : null, location: f.location.trim() || null, notes: f.notes.trim() || null, eventType: f.type };
    try {
      await act(a ? `/appointments/${a.uuid}` : "/appointments", a ? "PATCH" : "POST", body);
      closeModal();
      toast("Appointment saved.");
    } catch (e) {
      toast(`Could not save appointment: ${(e as Error).message}`);
    }
  };
  const remove = async () => {
    if (!a || !canManage) return toast("Only management can delete appointments.");
    if (!(await tcConfirm("Delete this appointment?", { title: "Delete appointment", confirmText: "Delete", danger: true }))) return;
    try {
      await act(`/appointments/${a.uuid}`, "DELETE");
      closeModal();
      toast("Appointment deleted.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <>
      <div className="formgrid">
        <div className="field span3"><label>Title</label><input maxLength={150} placeholder="Client meeting, office event..." value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div className="field"><label>Start</label><input type="datetime-local" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
        <div className="field"><label>End</label><input type="datetime-local" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></div>
        <div className="field"><label>Calendar owner</label>
          <select value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })}>
            {owners.map((p) => <option key={p.userId} value={p.userId}>{p.fullName}{p.userId === me.userId ? " (My calendar)" : ""}</option>)}
          </select>
        </div>
        <div className="field"><label>Branch (optional)</label>
          <select value={f.branchId} onChange={(e) => setF({ ...f, branchId: e.target.value })}>
            <option value="">Office-wide / personal</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Location</label><input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
        <div className="field"><label>Type</label>
          <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
            <option value="appointment">Appointment / Event</option>
            {canManage && <option value="block">Unavailable time block</option>}
          </select>
        </div>
        <div className="field span3"><label>Notes</label><textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
      </div>
      <div className="actions">
        <button onClick={save}>Save</button>
        {a && canManage && <button className="danger" onClick={remove}>Delete</button>}
        <button className="ghost" onClick={closeModal}>Cancel</button>
      </div>
    </>
  );
}

export function AppointmentsSection() {
  const { me, acting, settings, toast, openModal } = useTimeClock();
  const [month, setMonth] = useState(thisMonth());
  const [y, m] = month.split("-").map(Number);
  const monthStart = new Date(y, m - 1, 1, 0, 0, 0, 0), nextMonth = new Date(y, m, 1, 0, 0, 0, 0);
  const q = useTcGetQuery({ path: "/appointments", params: { from: monthStart.toISOString(), to: nextMonth.toISOString() } }, { pollingInterval: 30000 });
  const rows = (q.data || []) as Appointment[];
  const canManage = ["superadmin", "admin", "management"].includes(me.role) && acting !== "employee";
  const firstDay = monthStart.getDay(), daysInMonth = new Date(y, m, 0).getDate(), totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const optionalFor = (key: string) => [...new Set((settings.optionalHolidays || []).filter((h) => {
    const start = h.start_date || h.date, end = h.end_date || h.date || start;
    return !!start && key >= start && key <= (end as string);
  }).map((h) => h.name).filter(Boolean))];
  const edit = (a: Appointment) => {
    if (!canManage) return toast("Only management can edit appointments.");
    openModal("Edit Appointment", <AppointmentForm a={a} rows={rows} />);
  };
  const time = (v: string) => new Date(v).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div className="panel">
      <div className="actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div><h2>Appointments Calendar</h2><p className="muted">Monthly view · Appointments, office events, unavailable-time blocks, and holidays.</p></div>
        <button onClick={() => openModal("New Appointment", <AppointmentForm a={null} rows={rows} />)}>＋ Add Appointment</button>
      </div>
      <div className="calendar-nav">
        <button className="ghost" onClick={() => setMonth(addMonths(month, -1))}>‹ Previous</button>
        <b>{monthName(month)}</b>
        <button className="ghost" onClick={() => setMonth(addMonths(month, 1))}>Next ›</button>
      </div>
      <div className="legend">
        <span className="legend-item"><span className="dot branch" />Appointment / event</span>
        <span className="legend-item"><span className="dot open" />Unavailable time</span>
        <span className="legend-item"><span className="holiday-legend statutory" />Statutory / office holiday</span>
        <span className="legend-item"><span className="holiday-legend optional" />Optional office holiday</span>
      </div>
      <div className="calendar-head">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((x) => <div key={x}>{x}</div>)}</div>
      <div className="calendar-scroll">
        <div className="calendar appt-month-grid">
          {Array.from({ length: totalCells }, (_, cell) => {
            const dayNum = cell - firstDay + 1;
            if (dayNum < 1 || dayNum > daysInMonth) return <div className="day" aria-hidden="true" key={cell} />;
            const key = `${y}-${String(m).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const statutory = builtinHolidayName(key);
            const events = rows.filter((a) => {
              const d = new Date(a.startAt);
              return d.getFullYear() === y && d.getMonth() === m - 1 && d.getDate() === dayNum;
            });
            return (
              <div className="day" key={cell}>
                <div className="daynum">{dayNum}</div>
                {statutory && <div className="appt-holiday appt-holiday-statutory" title="Statutory / office holiday"><b>HOLIDAY</b><span>★ {statutory}</span></div>}
                {optionalFor(key).map((n) => <div key={n} className="appt-holiday appt-holiday-optional" title="Optional office holiday"><b>OPTIONAL HOLIDAY</b><span>★ {n}</span></div>)}
                {events.map((a) => (
                  <div
                    key={a.uuid}
                    className={a.eventType === "block" ? "appt-event appt-block" : "appt-event"}
                    {...(canManage ? { role: "button", tabIndex: 0, onClick: () => edit(a), onKeyDown: (e: React.KeyboardEvent) => e.key === "Enter" && edit(a) } : {})}
                    title={`${a.title} · ${time(a.startAt)}–${time(a.endAt)}`}
                  >
                    <b>{time(a.startAt)}–{time(a.endAt)}</b>
                    <span>{a.title}</span>
                    {a.eventType === "block" && <small>Unavailable</small>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
