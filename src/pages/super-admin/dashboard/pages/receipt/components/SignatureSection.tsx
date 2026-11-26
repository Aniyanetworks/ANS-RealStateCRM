// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import toast from "react-hot-toast";
import { UseFormSetValue, UseFormRegister, FieldErrors } from "react-hook-form";
import type { DataType } from "../types";

interface SignatureSectionProps {
  signatureRef: React.RefObject<any>;
  uploadSignatureImage: string;
  setUploadSignatureImage: (value: string) => void;
  setValue: UseFormSetValue<DataType>;
  register: UseFormRegister<DataType>;
  errors: FieldErrors<DataType>;
  onSignatureChange: (file: File) => Promise<void>;
  onSignatureRemove: () => void;
  onClearSignature: () => void;
  onSaveSignature: () => void;
}

const SignatureSection = ({
  signatureRef,
  uploadSignatureImage,
  setUploadSignatureImage,
  setValue,
  register,
  errors,
  onSignatureChange,
  onSignatureRemove,
  onClearSignature,
  onSaveSignature,
}: SignatureSectionProps) => {
  const handleChangeSignatureImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await onSignatureChange(file);
    }
  };

  return (
    <>
      {/* Signature Draw */}
      <div className="flex flex-col gap-2">
        <label>Signature Draw</label>
        <div className="border border-gray-400 rounded p-2 w-full max-w-[300px] h-[40vh] sm:h-[200px]">
          <SignatureCanvas
            ref={signatureRef}
            penColor="black"
            canvasProps={{
              width: 300,
              height: 200,
              className: "w-full max-w-[300px] h-[40vh] sm:h-[200px]",
            }}
          />
        </div>
        {errors.signature && (
          <p className="text-red-500 text-sm">{errors.signature.message}</p>
        )}
        <div className="flex gap-5">
          <button
            type="button"
            onClick={onClearSignature}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Clear
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={onSaveSignature}
          >
            Save Signature
          </button>
        </div>
      </div>

      {/* Signature Upload */}
      <div>
        <p className="mb-2">Signature Upload</p>
        <label className="flex justify-center items-center py-2 border border-dashed border-gray-400 rounded-md gap-2 hover:border-blue-500 cursor-pointer w-[300px]">
          <input
            type="file"
            className="hidden"
            onChange={handleChangeSignatureImage}
            accept="image/*"
          />
          <span>Upload files</span>
        </label>

        {uploadSignatureImage && (
          <div className="mt-4">
            <div>
              <img
                src={uploadSignatureImage}
                alt="Signature preview"
                className="max-w-[300px] h-auto"
              />
              <button
                type="button"
                onClick={onSignatureRemove}
                className="bg-red-500 mt-3 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                ✖ Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SignatureSection;

