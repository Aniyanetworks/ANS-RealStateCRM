// @ts-nocheck
import { useState } from "react";
import { Modal, Radio, Button } from "antd";
import { Document, Page } from "react-pdf";
import toast from "react-hot-toast";
import { compressPdf, formatFileSize, CompressionLevel } from "../../utils/pdfCompression";

type Props = {
  file: File;
  maxSize: number;
  onConfirm: (file: File) => void;
  onCancel: () => void;
};

const PdfSizeReductionModal = ({ file, maxSize, onConfirm, onCancel }: Props) => {
  const [level, setLevel] = useState<CompressionLevel>("medium");
  const [compressing, setCompressing] = useState(false);
  const [result, setResult] = useState<File | null>(null);

  const handleCompress = async () => {
    setCompressing(true);
    setResult(null);
    try {
      const compressed = await compressPdf(file, level);
      setResult(compressed);
    } catch {
      toast.error("Could not reduce this PDF's size. Please try another file.");
    }
    setCompressing(false);
  };

  const stillTooBig = !!result && result.size > maxSize;

  return (
    <Modal
      title="Reduce PDF Size"
      open
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          disabled={!result || stillTooBig}
          onClick={() => result && onConfirm(result)}
        >
          Confirm &amp; Submit
        </Button>,
      ]}
    >
      <p>
        <strong>{file.name}</strong> is {formatFileSize(file.size)}, which is over the{" "}
        {formatFileSize(maxSize)} limit. Choose a compression level and reduce the file to
        continue.
      </p>

      <Radio.Group
        value={level}
        onChange={(e) => setLevel(e.target.value)}
        disabled={compressing}
        className="my-3"
      >
        <Radio.Button value="low">Low (best quality)</Radio.Button>
        <Radio.Button value="medium">Medium</Radio.Button>
        <Radio.Button value="high">High (smallest size)</Radio.Button>
      </Radio.Group>

      <div className="my-3">
        <Button onClick={handleCompress} loading={compressing}>
          {result ? "Reduce Again" : "Reduce Size"}
        </Button>
      </div>

      {result && (
        <div>
          <p className={stillTooBig ? "text-red-600" : "text-green-600"}>
            New size: {formatFileSize(result.size)}
            {stillTooBig
              ? " — still over the limit, try a stronger level"
              : " — ready to submit"}
          </p>
          <div className="border mt-2" style={{ maxHeight: 320, overflow: "auto" }}>
            <Document file={result}>
              <Page pageNumber={1} width={400} />
            </Document>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PdfSizeReductionModal;
