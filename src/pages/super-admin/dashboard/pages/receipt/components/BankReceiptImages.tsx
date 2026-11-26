// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import type { ImageItem } from "../types";

interface BankReceiptImagesProps {
  uploadBankReceiptImages: ImageItem[];
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: (index: number) => void;
}

const isPdf = (item: ImageItem) =>
  item.file?.type === "application/pdf" ||
  /^data:application\/pdf/i.test(item.preview || "") ||
  /\.pdf($|\?)/i.test(item.path || item.file?.name || "");

const fileName = (item: ImageItem) =>
  item.file?.name || decodeURIComponent(String(item.path || "").split(/[/\\?]/).filter(Boolean).pop() || "") || "Document";

const openFile = async (src: string) => {
  if (!src) return;
  let url = src;
  if (src.startsWith("data:")) {
    const blob = await (await fetch(src)).blob();
    url = URL.createObjectURL(blob);
  }
  window.open(url, "_blank", "noopener");
};

const BankReceiptImages = ({
  uploadBankReceiptImages,
  onImageChange,
  onImageRemove,
}: BankReceiptImagesProps) => {
  return (
    <div>
      <p className="mb-2">Bank Receipt Images / PDF</p>
      <label className="flex justify-center items-center py-2 border border-dashed border-gray-400 rounded-md gap-2 hover:border-blue-500 cursor-pointer w-[300px]">
        <input
          type="file"
          className="hidden"
          accept="image/*,application/pdf"
          multiple
          onChange={(e) => {
            onImageChange(e);
            e.target.value = "";
          }}
        />
        <span>Upload files</span>
      </label>
      <p className="text-xs text-gray-500 mt-1">Images or PDF. To replace a file, remove it and upload the new one.</p>

      {uploadBankReceiptImages.length > 0 && (
        <div className="mt-3 space-y-2">
          {uploadBankReceiptImages.map((image, index) => (
            <div key={index} className="flex items-center gap-2">
              {!image.preview ? (
                <span className="text-sm text-gray-500 border border-gray-200 rounded px-3 py-2">File unavailable</span>
              ) : isPdf(image) ? (
                <button
                  type="button"
                  onClick={() => openFile(image.preview)}
                  className="flex items-center gap-2 border border-gray-200 rounded px-3 py-2 text-left hover:border-blue-500"
                  title="Open PDF"
                >
                  <span className="text-[10px] font-bold text-white bg-red-600 rounded px-1.5 py-0.5">PDF</span>
                  <span className="text-sm text-blue-600 underline max-w-[180px] truncate">{fileName(image)}</span>
                </button>
              ) : (
                <img src={image.preview} alt="Bank receipt" className="h-16 object-cover rounded border border-gray-200" />
              )}
              <button type="button" onClick={() => onImageRemove(index)} className="text-red-500 text-sm">
                ✖ Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BankReceiptImages;
