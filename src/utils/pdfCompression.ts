import { pdfjs } from "react-pdf";
import jsPDF from "jspdf";

if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
}

export type CompressionLevel = "low" | "medium" | "high";

const LEVEL_SETTINGS: Record<CompressionLevel, { scale: number; quality: number }> = {
  low: { scale: 1.5, quality: 0.8 },
  medium: { scale: 1.15, quality: 0.55 },
  high: { scale: 0.85, quality: 0.35 },
};

export const isPdfFile = (file: File): boolean =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Rasterizes each page to a canvas at a reduced scale/JPEG quality and
// rebuilds a new PDF from the images. Trades text-selectability for size.
export const compressPdf = async (file: File, level: CompressionLevel): Promise<File> => {
  const { scale, quality } = LEVEL_SETTINGS[level];
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  let doc: jsPDF | null = null;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(viewport.width));
    canvas.height = Math.max(1, Math.ceil(viewport.height));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to get canvas context");

    await page.render({ canvasContext: context, viewport }).promise;
    const imageData = canvas.toDataURL("image/jpeg", quality);
    const orientation = canvas.width > canvas.height ? "l" : "p";

    if (!doc) {
      doc = new jsPDF({
        orientation,
        unit: "px",
        format: [canvas.width, canvas.height],
        compress: true,
      });
    } else {
      doc.addPage([canvas.width, canvas.height], orientation);
    }
    doc.addImage(imageData, "JPEG", 0, 0, canvas.width, canvas.height);

    canvas.width = 0;
    canvas.height = 0;
  }

  if (!doc) throw new Error("The PDF has no pages to compress.");

  const blob = doc.output("blob");
  const compressedName = file.name.replace(/\.pdf$/i, "") + "-compressed.pdf";
  return new File([blob], compressedName, { type: "application/pdf" });
};
