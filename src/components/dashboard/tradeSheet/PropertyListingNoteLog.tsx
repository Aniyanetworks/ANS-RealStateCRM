import React, { useState } from 'react';
import { FaHistory, FaMinus, FaPlus, FaRegClock } from 'react-icons/fa';
import moment from 'moment';
import { useGetPropertyListingNoteQuery } from '../../../redux/api/superadmin/propertyListingDataSlice';

interface PropertyListingNoteLogProps {
  propertyListingId: number;
}

interface Note {
  uuid: string;
  note: string;
  createdAt: string;
  owner?: {
    name?: string;
  };
}

const PropertyListingNoteLog: React.FC<PropertyListingNoteLogProps> = ({ propertyListingId }) => {
  const { data } = useGetPropertyListingNoteQuery({ propertyListingId });
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState('');

  const notes: Note[] = (data?.data?.NoteData || [])
    .filter((note: Note) => note.note?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mb-6">
      <h3
        className="border-t border-gray-400 bg-[#243451] text-white border-x text-center text-sm font-bold py-1 cursor-pointer flex justify-between items-center px-4"
        onClick={() => setIsExpanded(e => !e)}
      >
        <span>PROPERTY LISTING NOTES LOG</span>
        {isExpanded ? <FaMinus className="text-white" /> : <FaPlus className="text-white" />}
      </h3>
      {isExpanded && (
        <div className="max-h-[400px] overflow-y-auto">
          <div className="p-2 bg-gray-100 border border-gray-400 mb-4">
            <input
              type="text"
              placeholder="Search Notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <table className="w-full text-xs border-collapse border border-gray-400">
            <colgroup>
              <col className="w-3/4" />
              <col className="w-1/4" />
            </colgroup>
            <thead>
              <tr>
                <th className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold text-left">Details</th>
                <th className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {notes.length > 0 ? notes
                .slice()
                .sort((a: Note, b: Note) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((note: Note) => (
                  <tr key={note.uuid} className="hover:bg-gray-50 transition duration-150">
                    <td className="border border-gray-400 px-2 py-1 text-left">
                      <span className="flex items-center gap-2 flex-nowrap">
                        <FaHistory className="inline mr-1 flex-shrink-0" />
                        <span className="font-semibold text-gray-700 mr-2 whitespace-nowrap flex-shrink-0">{note.owner?.name || 'N/A'}</span>
                      </span>
                      <span className="text-gray-800" dangerouslySetInnerHTML={{ __html: note.note }} />
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-left whitespace-nowrap">
                      <FaRegClock className="inline mr-1" />
                      {moment.utc(note.createdAt).format('D MMMM YYYY [at] h:mm A')}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={2} className="border border-gray-400 px-2 py-1 text-center text-gray-500">
                      No notes found
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PropertyListingNoteLog; 