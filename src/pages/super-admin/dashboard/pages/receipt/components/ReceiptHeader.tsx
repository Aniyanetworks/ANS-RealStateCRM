// @ts-nocheck
import { FaSearch, FaTimes } from "react-icons/fa";

interface ReceiptHeaderProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  onCreateNew: () => void;
  onDeleteMultiple: () => void;
  hasPermissionForSlug: (slug: string) => boolean;
}

const ReceiptHeader = ({
  searchText,
  onSearchChange,
  onCreateNew,
  onDeleteMultiple,
  hasPermissionForSlug,
}: ReceiptHeaderProps) => {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
      <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Deposit Receipt Lists</h1>
      <div className="flex-1" />
      <div className="relative flex-shrink-0" style={{ width: 170 }}>
        <FaSearch className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: 10, left: 8 }} />
        <input
          type="text"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ paddingLeft: 26, paddingRight: 8, paddingTop: 4, paddingBottom: 4, width: "100%" }}
        />
        {searchText && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0"
            style={{ right: 6 }}
          >
            <FaTimes style={{ fontSize: 10 }} />
          </button>
        )}
      </div>
      {hasPermissionForSlug("create-deposit-receipt") && (
        <button onClick={onCreateNew} className="primary-btn">
          Add New
        </button>
      )}
      {hasPermissionForSlug("delete-deposit-receipt") && (
        <button onClick={onDeleteMultiple} className="cancel-btn">
          Delete Selected
        </button>
      )}
    </div>
  );
};

export default ReceiptHeader;
