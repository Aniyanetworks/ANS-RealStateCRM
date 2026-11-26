import React from "react";
import { FaFileAlt } from "react-icons/fa";

type SubmittedDocumentsProps = {
  documents?: { uploadFileName: { name: string } }[];
  otherDocuments?: { filePath: string }[];
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
    <span className="inline-block w-[3px] h-3.5 bg-[#9F8667] rounded-full flex-shrink-0" />
    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
  </div>
);

const SubmittedDocuments: React.FC<SubmittedDocumentsProps> = ({ documents, otherDocuments }) => {
  const allDocs = [
    ...(documents?.map((d) => d?.uploadFileName?.name).filter(Boolean) ?? []),
    ...(otherDocuments?.map((d) => d?.filePath?.split(/[/\\]/).pop()).filter(Boolean) ?? []),
  ];

  return (
    <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
      <SectionHeader title="Submitted Documents" />
      <div className="px-4 py-3">
        {allDocs.length === 0 ? (
          <span className="text-[11px] text-gray-400">No documents submitted</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allDocs.map((name, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 bg-gray-50 text-[11px] text-gray-600"
              >
                <FaFileAlt className="text-[#9F8667]" style={{ fontSize: 10 }} />
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmittedDocuments;
