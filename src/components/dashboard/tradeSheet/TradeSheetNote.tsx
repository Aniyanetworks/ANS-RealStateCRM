import React, { useEffect, useRef, useState } from 'react';
import { Avatar, Tooltip } from 'antd';
import { FaRegEdit, FaPaperPlane } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import toast from 'react-hot-toast';
import moment from 'moment';
import {
  useGetTradeSheetNoteQuery,
  useCreateUpdateTradeSheetNoteMutation,
  useDeleteTradeSheetNoteMutation,
} from '../../../redux/api/agent/trade-sheet/tradeSheetSlice';
import { baseUrl } from '../../../utils/constant';
import { useAppSelector } from '../../../redux/hooks';

interface TradeSheetNoteProps {
  tradeSheetId: number;
}
interface NoteData {
  uuid: string;
  note: string;
  tradeSheetId: number;
  createdBy: number;
  createdAt: string;
  owner?: { id: number; name: string; profilePicture?: string };
}

const getInitials = (name?: string) =>
  name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

const getAvatarSrc = (pic?: string) => {
  if (!pic || pic === '') return null;
  return pic.startsWith('http')
    ? pic.replace(/\\/g, '/')
    : `${baseUrl}${pic.replace(/^[\\/]/, '').replace(/\\/g, '/')}`;
};

const TradeSheetNote: React.FC<TradeSheetNoteProps> = ({ tradeSheetId }) => {
  const { user } = useAppSelector((state: any) => state.user);
  const currentUserId = user?.id;

  const [noteText, setNoteText]                 = useState('');
  const [selectedNoteUuid, setSelectedNoteUuid] = useState<string | null>(null);
  const [isEditMode, setIsEditMode]             = useState(false);
  const [imgErrors, setImgErrors]               = useState<Record<string, boolean>>({});

  const { data: notesData, refetch }   = useGetTradeSheetNoteQuery({ tradeSheetId });
  const [createUpdateNote]             = useCreateUpdateTradeSheetNoteMutation();
  const [deleteNote]                   = useDeleteTradeSheetNoteMutation();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notesData]);

  const handleSubmit = async () => {
    if (!noteText || noteText.replace(/<(.|\n)*?>/g, '').trim() === '') {
      toast.error('Note cannot be empty');
      return;
    }
    try {
      await createUpdateNote({ uuid: selectedNoteUuid, data: { note: noteText, tradeSheetId } }).unwrap();
      toast.success(isEditMode ? 'Updated' : 'Sent');
      setNoteText(''); setSelectedNoteUuid(null); setIsEditMode(false);
      refetch();
    } catch { toast.error('Failed to save'); }
  };

  const handleEdit   = (note: NoteData) => { setNoteText(note.note); setSelectedNoteUuid(note.uuid); setIsEditMode(true); };
  const handleDelete = async (uuid: string) => { try { await deleteNote(uuid).unwrap(); toast.success('Deleted'); refetch(); } catch { toast.error('Failed'); } };
  const cancelEdit   = () => { setNoteText(''); setSelectedNoteUuid(null); setIsEditMode(false); };

  const notes: NoteData[] = notesData?.data?.NoteData || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff' }}>

      {/* ── Messages ── */}
      <div style={{ height: 300, overflowY: 'auto', background: '#fff', padding: '16px 20px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', justifyContent: 'flex-end', gap: 2 }}>

          {notes.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', gap: 10, paddingBottom: 20 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
              <span style={{ fontSize: 13 }}>No messages yet</span>
            </div>
          ) : (
            notes.map((note, idx) => {
              const isMine   = note.createdBy === currentUserId;
              const nextNote = notes[idx + 1];
              const isLastInGroup = !nextNote || nextNote.createdBy !== note.createdBy;

              // For own messages use the live Redux user profile picture; fallback to note owner pic
              const picSource = isMine
                ? (user?.profilePicture || note.owner?.profilePicture)
                : note.owner?.profilePicture;
              const src     = getAvatarSrc(picSource);
              const showImg = src && !imgErrors[note.uuid];

              const avatarEl = isLastInGroup ? (
                showImg ? (
                  <img
                    src={src} alt="av"
                    onError={() => setImgErrors(p => ({ ...p, [note.uuid]: true }))}
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <Avatar size={28} style={{ backgroundColor: isMine ? '#0f766e' : '#6b7280', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {getInitials(note.owner?.name)}
                  </Avatar>
                )
              ) : (
                <div style={{ width: 28, flexShrink: 0 }} />
              );

              return (
                <div
                  key={note.uuid}
                  style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 6, marginBottom: isLastInGroup ? 10 : 2 }}
                >
                  {avatarEl}

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%', gap: 1 }}>
                    {/* Sender name — first in group only */}
                    {!isMine && idx > 0 && notes[idx - 1].createdBy === note.createdBy ? null : (
                      !isMine && <span style={{ fontSize: 10, fontWeight: 600, color: '#0f766e', paddingLeft: 4, marginBottom: 1 }}>{note.owner?.name || 'Unknown'}</span>
                    )}

                    {/* Bubble */}
                    <div
                      style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}
                      className="note-bubble-wrap"
                    >
                      <div
                        className={isMine ? 'chat-bubble-mine' : undefined}
                        style={{
                          background: isMine ? '#0f766e' : '#f3f4f6',
                          color: isMine ? '#fff' : '#1f2937',
                          borderRadius: isMine
                            ? (isLastInGroup ? '18px 18px 4px 18px' : '18px 18px 18px 18px')
                            : (isLastInGroup ? '18px 18px 18px 4px' : '18px 18px 18px 18px'),
                          padding: '7px 12px',
                          fontSize: 12,
                          lineHeight: 1.55,
                          wordBreak: 'break-word',
                          minWidth: 40,
                        }}
                        dangerouslySetInnerHTML={{ __html: note.note }}
                      />

                      {/* Hover actions — inline sibling, no gap to lose hover over */}
                      <div
                        className="bubble-actions"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: 20,
                          padding: '2px 6px',
                          boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          opacity: 0,
                          pointerEvents: 'none',
                          transition: 'opacity 0.15s ease',
                        }}
                      >
                        <Tooltip title="Edit">
                          <button onClick={() => handleEdit(note)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f766e', display: 'flex', padding: 2 }}>
                            <FaRegEdit style={{ fontSize: 10 }} />
                          </button>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <button onClick={() => handleDelete(note.uuid)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', padding: 2 }}>
                            <MdDelete style={{ fontSize: 12 }} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Timestamp — last in group only */}
                    {isLastInGroup && (
                      <span style={{ fontSize: 10, color: '#9ca3af', padding: '0 4px', marginTop: 1 }}>
                        {moment(note.createdAt).format('DD MMM, hh:mm A')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Edit banner ── */}
      {isEditMode && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 16px', background: '#fef9c3', borderTop: '1px solid #fde68a', fontSize: 11, color: '#92400e' }}>
          <span>✏️ Editing message</span>
          <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#92400e', fontSize: 11 }}>✕ Cancel</button>
        </div>
      )}

      {/* ── Divider ── */}
      <div style={{ height: 1, background: '#f3f4f6' }} />

      {/* ── Composer ── */}
      <div style={{ background: '#fafafa', padding: '10px 14px 12px' }}>
        <ReactQuill
          value={noteText}
          onChange={setNoteText}
          placeholder="Write a message…"
          theme="snow"
          style={{ background: '#fff', borderRadius: 8, height: 72, paddingBottom: 30 }}
          modules={{
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link'],
            ],
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            className="primary-btn"
            onClick={handleSubmit}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FaPaperPlane style={{ fontSize: 10 }} />
            {isEditMode ? 'Update' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Inline style for hover actions */}
      <style>{`
        .note-bubble-wrap:hover .bubble-actions { opacity: 1 !important; pointer-events: auto !important; }
      `}</style>
    </div>
  );
};

export default TradeSheetNote;
