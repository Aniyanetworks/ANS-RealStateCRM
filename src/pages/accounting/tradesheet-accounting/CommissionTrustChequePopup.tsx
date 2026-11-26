// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import { Tag } from 'antd';
import toast from 'react-hot-toast';
import { FaTimes } from 'react-icons/fa';

import sortArrow from '../../../assets/table-head-arrow.svg';
import uploadIcon from '../../../assets/upload2.svg';
import { getFileUrl } from '../../../utils/constant';

type FileKeys =
  | "nationalIdentity"
  | "recoLicence"
  | "agreementFile"
  | "previousRegistration"
  | "others";

type AgentDocumentProps = {
  agentAccount?: any;
  mode?: string;
};

const CommissionTrustChequePopup = ({ documentPath }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (documentPath) {
      setSelectedDocument(documentPath || null);
    }
  }, [documentPath]);

  const handleDocumentDownload = async (filePath) => {
    try {
      const response = await fetch(getFileUrl(filePath));
      if (!response.ok) throw new Error("Failed to fetch document");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filePath.split("/").pop() || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the document:", error);
      toast.error("Failed to download document");
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)]">
      <div className="flex-1 bg-white rounded-r-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h3 className="font-medium flex items-center gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                setPreviewCollapsed(!previewCollapsed);
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {selectedDocument ? selectedDocument.name : "Document Preview"}
          </h3>
          {selectedDocument && (
            <button
              onClick={() => handleDocumentDownload(selectedDocument.filePath)}
              className="px-4 py-2 bg-[#0f766e] text-white rounded hover:bg-[#0d6b64]"
            >
              Download
            </button>
          )}
        </div>

        {selectedDocument ? (
          <div className="h-[calc(100vh-12rem)]">
            {error && <p className="text-red-500">{error}</p>}
            <iframe
              src={`${selectedDocument}`}
              className="w-full h-full rounded-lg"
              title="Document Preview"
              onLoad={() => setLoading(false)}
              onError={() => setError("Failed to load document")}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">No active agreement file found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionTrustChequePopup;
