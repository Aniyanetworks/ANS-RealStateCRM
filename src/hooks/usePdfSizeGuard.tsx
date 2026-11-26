import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import PdfSizeReductionModal from "../components/ui/PdfSizeReductionModal";
import { isPdfFile, formatFileSize } from "../utils/pdfCompression";

export function usePdfSizeGuard(maxSize: number) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const resolverRef = useRef<((file: File | null) => void) | null>(null);

  const guardFile = useCallback(
    (file: File): Promise<File | null> => {
      if (file.size <= maxSize) return Promise.resolve(file);

      if (!isPdfFile(file)) {
        toast.error(`File size should not exceed ${formatFileSize(maxSize)}`);
        return Promise.resolve(null);
      }

      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setPendingFile(file);
      });
    },
    [maxSize]
  );

  const settle = (file: File | null) => {
    resolverRef.current?.(file);
    resolverRef.current = null;
    setPendingFile(null);
  };

  const modal = pendingFile ? (
    <PdfSizeReductionModal
      file={pendingFile}
      maxSize={maxSize}
      onConfirm={(f) => settle(f)}
      onCancel={() => settle(null)}
    />
  ) : null;

  return { guardFile, modal };
}
