import { useMemo, useState } from "react";
import { useTcGetQuery } from "../../../redux/api/common/dvTimeClockSlice";
import { useCan, useTcAction, useTimeClock } from "../TimeClockContext";
import { tcConfirm } from "../tcDialog";

type Message = { uuid: string; senderId: number; recipientId: number; subject: string | null; body: string; replyToUuid: string | null; readAt: string | null; createdAt: string };
type Tab = "new" | "inbox" | "outstanding" | "completed" | "sent";
const TABS: Tab[] = ["new", "inbox", "outstanding", "completed", "sent"];

const storeKey = (id: number) => `dv-msg-status-${id}`;
const readStore = (id: number): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(storeKey(id)) || "{}"); } catch { return {}; }
};

function rootOf(m: Message, byId: Map<string, Message>) {
  let x = m;
  const seen = new Set<string>();
  while (x.replyToUuid && byId.has(x.replyToUuid) && !seen.has(x.uuid)) {
    seen.add(x.uuid);
    x = byId.get(x.replyToUuid)!;
  }
  return x.uuid;
}

function NewMessageForm() {
  const { me, members, toast, closeModal } = useTimeClock();
  const act = useTcAction();
  const people = members.filter((p) => p.userId !== me.userId && p.active !== false);
  const [to, setTo] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const send = async () => {
    if (!to.length || !body.trim()) return toast("Select at least one recipient and enter a message.");
    try {
      await act("/messages", "POST", { senderId: me.userId, recipientIds: to.map(Number), subject: subject.trim(), body: body.trim() });
      closeModal();
      toast(`Message sent to ${to.length} recipient${to.length === 1 ? "" : "s"}.`);
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <>
      <div className="field"><label>Recipients (select one or more)</label>
        <select multiple size={8} style={{ minHeight: 180 }} value={to} onChange={(e) => setTo([...e.target.selectedOptions].map((o) => o.value))}>
          {people.map((p) => <option key={p.userId} value={p.userId}>{p.fullName || p.email || "User"} — {p.role || "employee"}</option>)}
        </select>
        <small className="muted">Use Ctrl (Windows) or Command (Mac) to select multiple recipients. Each recipient receives an individual copy.</small>
      </div>
      {!people.length && <p className="notice">No recipients are available yet.</p>}
      <div className="field"><label>Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
      <div className="field"><label>Message</label><textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} /></div>
      <button onClick={send}>Send</button>
    </>
  );
}

function ReplyForm({ parent, recipientId, subject, label }: { parent: Message; recipientId: number; subject: string; label: string }) {
  const { me, toast, closeModal } = useTimeClock();
  const act = useTcAction();
  const [body, setBody] = useState("");
  const send = async () => {
    if (!body.trim()) return toast("Enter a message before sending.");
    try {
      await act("/messages", "POST", { senderId: me.userId, recipientIds: [recipientId], subject, body: body.trim(), replyToUuid: parent.uuid });
      closeModal();
      toast("Reply sent.");
    } catch (e) {
      toast(`Reply could not be sent: ${(e as Error).message}`);
    }
  };
  return (
    <>
      <div className="field"><label>Replying to</label><p>{label}</p></div>
      <div className="field"><label>Message</label><textarea rows={5} placeholder="Write your reply..." value={body} onChange={(e) => setBody(e.target.value)} /></div>
      <div className="actions"><button type="button" onClick={send}>Send Reply</button><button type="button" className="secondary" onClick={closeModal}>Cancel</button></div>
    </>
  );
}

function ThreadView({ rootId, all }: { rootId: string; all: Message[] }) {
  const { me, members, toast, openModal, closeModal } = useTimeClock();
  const can = useCan();
  const act = useTcAction();
  const byId = new Map(all.map((m) => [m.uuid, m]));
  const thread = all.filter((m) => rootOf(m, byId) === rootId).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const root = byId.get(rootId);
  const nameOf = (id: number) => members.find((p) => p.userId === id)?.fullName || members.find((p) => p.userId === id)?.email || "User";
  const canDelete = me.role === "superadmin" || can("messages.delete");
  if (!thread.length || !root) return <p className="muted">This thread has no messages.</p>;
  const last = thread[thread.length - 1];
  const reply = () => {
    const recipientId = last.senderId !== me.userId ? last.senderId : root.senderId === me.userId ? root.recipientId : root.senderId;
    if (!recipientId) return toast("Could not determine the recipient for this reply.");
    openModal("Reply to Thread", <ReplyForm parent={last} recipientId={recipientId} subject={root.subject || last.subject || "Message"} label={nameOf(last.senderId)} />);
  };
  const remove = async (m: Message) => {
    if (!(await tcConfirm("Delete only this message from the thread? Replies and other messages will remain.", { title: "Delete message", confirmText: "Delete", danger: true }))) return;
    try {
      await act("/messages", "DELETE", { uuids: [m.uuid] });
      closeModal();
      toast("Message deleted from thread.");
    } catch (e) {
      toast(`Message deletion failed: ${(e as Error).message}`);
    }
  };
  return (
    <>
      <div style={{ maxHeight: "55vh", overflow: "auto" }}>
        {thread.map((m) => (
          <div key={m.uuid} className="open-item" style={{ display: "block", marginBottom: 10 }}>
            <div className="actions" style={{ justifyContent: "space-between" }}>
              <b>{nameOf(m.senderId)}</b>
              {canDelete && <button className="danger" style={{ fontSize: 12, padding: "5px 9px" }} onClick={() => remove(m)}>Delete Message</button>}
            </div>
            <div className="muted"><small>{new Date(m.createdAt).toLocaleString()}</small></div>
            <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", marginTop: 8 }}>{m.body}</div>
          </div>
        ))}
      </div>
      <div className="actions" style={{ marginTop: 14 }}>
        <button onClick={reply}>Reply to Thread</button>
        <button className="secondary" onClick={closeModal}>Back to Messages</button>
      </div>
    </>
  );
}

export function MessagesSection({ management }: { management: boolean }) {
  const { me, members, openModal } = useTimeClock();
  const can = useCan();
  const act = useTcAction();
  const viewAll = management && (["superadmin", "admin", "management"].includes(me.role) || can("messages.view_all"));
  const q = useTcGetQuery({ path: "/messages", params: { userId: me.userId, all: viewAll ? 1 : undefined } }, { pollingInterval: 30000 });
  const all = useMemo(() => (q.data || []) as Message[], [q.data]);
  const [tab, setTab] = useState<Tab>("new");
  const [search, setSearch] = useState("");
  const [store, setStore] = useState(() => readStore(me.userId));
  const setStatus = (id: string, status: string | null) => {
    const next = { ...store };
    if (status) next[id] = status; else delete next[id];
    setStore(next);
    try { localStorage.setItem(storeKey(me.userId), JSON.stringify(next)); } catch { }
  };

  const byId = useMemo(() => new Map(all.map((m) => [m.uuid, m])), [all]);
  const groups = useMemo(() => {
    const g = new Map<string, Message[]>();
    for (const m of all) {
      const r = rootOf(m, byId);
      if (!g.has(r)) g.set(r, []);
      g.get(r)!.push(m);
    }
    return g;
  }, [all, byId]);
  const roots = [...groups.keys()].map((id) => byId.get(id)).filter(Boolean) as Message[];
  const state = (r: Message): Tab => {
    const t = groups.get(r.uuid) || [r];
    if (store[r.uuid] === "outstanding" || store[r.uuid] === "completed") return store[r.uuid] as Tab;
    const hasIncoming = t.some((x) => x.recipientId === me.userId);
    if (hasIncoming) return t.some((x) => x.recipientId === me.userId && !x.readAt) ? "new" : "inbox";
    return "sent";
  };
  const counts: Record<Tab, number> = { new: 0, inbox: 0, outstanding: 0, completed: 0, sent: 0 };
  roots.forEach((r) => counts[state(r)]++);
  const nameOf = (id: number) => members.find((p) => p.userId === id)?.fullName || members.find((p) => p.userId === id)?.email || "User";
  const visible = roots.filter((r) => state(r) === tab).filter((r) => {
    if (!search) return true;
    const t = groups.get(r.uuid) || [r];
    return [r.subject, ...t.map((x) => x.body), nameOf(r.senderId), nameOf(r.recipientId)].join(" ").toLowerCase().includes(search.toLowerCase());
  });

  const open = async (r: Message) => {
    openModal(r.subject || "Message Thread", <ThreadView rootId={r.uuid} all={all} />);
    const unread = (groups.get(r.uuid) || []).filter((m) => m.recipientId === me.userId && !m.readAt).map((m) => m.uuid);
    if (unread.length) await act("/messages/read", "POST", { userId: me.userId, uuids: unread }).catch(() => undefined);
  };

  return (
    <div className="panel message-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: "0 0 4px" }}>Messages</h2>
          <p className="muted" style={{ margin: 0 }}>Opening a message marks it read. Mark it Outstanding only when action is required.</p>
        </div>
        <button onClick={() => openModal("New Message", <NewMessageForm />)}>New Message</button>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <div className="tc-seg" role="tablist" aria-label="Message folders">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span className="tc-count">{counts[t]}</span>
            </button>
          ))}
        </div>
        <label className="tc-search">
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" aria-label="Search messages" placeholder="Search subject, message, sender…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
      </div>
      <div className="message-list">
        {visible.length ? visible.map((r) => {
          const t = groups.get(r.uuid) || [r], st = state(r);
          return (
            <div className="message-row" key={r.uuid}>
              <div className="message-main">
                <b>{r.subject || "Message"}</b>
                <div className="muted">{nameOf(r.senderId)} → {nameOf(r.recipientId)} · {new Date(r.createdAt).toLocaleString()}</div>
                <div className="message-preview">{(r.body || "").replace(/\s+/g, " ").slice(0, 180)}{r.body && r.body.length > 180 ? "…" : ""}</div>
                <small className="muted">{t.length} message{t.length === 1 ? "" : "s"} · {st === "new" ? "Unread" : st === "inbox" ? "Read" : ""}</small>
              </div>
              <div className="message-actions">
                <button className="secondary" onClick={() => open(r)}>Open</button>
                {(st === "new" || st === "inbox") && <button onClick={() => setStatus(r.uuid, "outstanding")}>Mark Outstanding</button>}
                {st === "outstanding" && <button onClick={() => setStatus(r.uuid, "completed")}>Mark Completed</button>}
                {st === "completed" && <button className="ghost" onClick={() => setStatus(r.uuid, null)}>Reopen</button>}
              </div>
            </div>
          );
        }) : (
          <div className="tc-empty">
            <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--navy)" }}>{search ? "No matching messages" : `No ${tab} messages`}</p>
            <p className="muted" style={{ margin: 0 }}>{search ? "Try a different search." : tab === "sent" ? "Messages you send will appear here." : "You're all caught up."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
