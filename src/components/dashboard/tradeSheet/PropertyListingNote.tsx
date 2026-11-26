import React, { useEffect, useRef, useState } from 'react';
import { Avatar, Button, Tooltip } from 'antd';
import { FaRegEdit } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import toast from 'react-hot-toast';
import moment from 'moment';
import {
  useGetPropertyListingNoteQuery,
  useCreateUpdatePropertyListingNoteMutation,
  useDeletePropertyListingNoteMutation
} from '../../../redux/api/superadmin/propertyListingDataSlice';
import { getFileUrl } from '../../../utils/constant';

interface PropertyListingNoteProps {
  propertyListingId: number;
}

interface NoteData {
  uuid: string;
  slug: string;
  note: string;
  propertyListingId: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: number;
    name: string;
    profilePicture?: string;
  };
}

const getInitials = (name?: string) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

const PropertyListingNote: React.FC<PropertyListingNoteProps> = ({ propertyListingId }) => {
  const [noteText, setNoteText] = useState('');
  const [selectedNoteUuid, setSelectedNoteUuid] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { data: notesData, refetch } = useGetPropertyListingNoteQuery({ propertyListingId });
  const [createUpdateNote] = useCreateUpdatePropertyListingNoteMutation();
  const [deleteNote] = useDeletePropertyListingNoteMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [notesData]);

  const handleSubmit = async () => {
    try {
      if (!noteText || noteText.replace(/<(.|\n)*?>/g, '').trim() === '') {
        toast.error('Note cannot be empty');
        return;
      }
      await createUpdateNote({
        uuid: selectedNoteUuid,
        data: {
          note: noteText,
          propertyListingId: propertyListingId,
        },
      }).unwrap();
      toast.success(isEditMode ? 'Note updated successfully' : 'Note added successfully');
      setNoteText('');
      setSelectedNoteUuid(null);
      setIsEditMode(false);
      refetch();
    } catch (error) {
      toast.error('Failed to save note');
      console.error('Note error:', error);
    }
  };

  const handleEdit = (note: NoteData) => {
    setNoteText(note.note);
    setSelectedNoteUuid(note.uuid);
    setIsEditMode(true);
  };

  const handleDelete = async (uuid: string) => {
    try {
      await deleteNote(uuid).unwrap();
      toast.success('Note deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete note');
      console.error('Delete error:', error);
    }
  };

  const handleCancel = () => {
    setNoteText('');
    setSelectedNoteUuid(null);
    setIsEditMode(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 28,
          background: '#f4f7fb',
          borderBottom: '1px solid #e5e7eb',
          minHeight: 0,
          maxHeight: 'calc(100% - 200px)',
        }}
      >
        {(notesData?.data?.NoteData || []).length === 0 && (
          <div style={{ color: '#b0b0b0', textAlign: 'center', marginTop: 40 }}>No notes yet.</div>
        )}
        {(notesData?.data?.NoteData || []).map((note: NoteData) => (
          <div
            key={note.uuid}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              marginBottom: 28,
              gap: 16,
              justifyContent: 'flex-start',
            }}
          >
            {note.owner?.profilePicture && note.owner.profilePicture !== '' ? (
              <img
                src={getFileUrl(note.owner.profilePicture)}
                alt="User Avatar"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                  marginBottom: 10,
                  background: '#0a2a28',
                }}
              />
            ) : (
              <Avatar
                size={46}
                alt="User Avatar"
                style={{
                  backgroundColor: '#0a2a28',
                  fontWeight: 700,
                  fontSize: 22,
                  marginBottom: 10,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                }}
              >
                {getInitials(note.owner?.name)}
              </Avatar>
            )}
            <div
              style={{
                background: '#fff',
                borderRadius: 18,
                padding: '18px 26px 14px 26px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                maxWidth: 800,
                minWidth: 140,
                position: 'relative',
                border: '1px solid #e5e7eb',
                wordBreak: 'break-word',
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  margin: 10,
                  color: '#222',
                }}
                dangerouslySetInnerHTML={{ __html: note.note }}
              />
              <div style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>
                {note.owner?.name || 'N/A'} &middot; {moment(note.createdAt).format('DD MMM YYYY, hh:mm A')}
              </div>
              <div style={{ position: 'absolute', top: 12, right: 16, display: 'flex', gap: 10 }}>
                <Tooltip title="Edit">
                  <Button
                    size="small"
                    type="text"
                    icon={<FaRegEdit style={{ color: '#1677ff', fontSize: 17 }} />}
                    onClick={() => handleEdit(note)}
                    style={{ padding: 0 }}
                  />
                </Tooltip>
                <Tooltip title="Delete">
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<MdDelete style={{ color: '#ff4d4f', fontSize: 18 }} />}
                    onClick={() => handleDelete(note.uuid)}
                    style={{ padding: 0 }}
                  />
                </Tooltip>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: 22, background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <ReactQuill
          value={noteText}
          onChange={setNoteText}
          placeholder="Type a note..."
          style={{ borderRadius: 10, background: '#f8fafc', height: 120, paddingBottom: 40 }}
          theme="snow"
          modules={{
            toolbar: [
              [{ header: '1' }, { header: '2' }, { font: [] }],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['bold', 'italic', 'underline'],
              [{ align: [] }],
              ['link', 'image'],
              [{ color: [] }],
            ],
          }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          {isEditMode && (
            <Button onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button className="primary-btn mx-3" onClick={handleSubmit}>
            {isEditMode ? 'Update Note' : 'Add Note'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PropertyListingNote; 