// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import { NavLink } from 'react-router-dom';
import ButtonLoader from '../../../../../components/loader/buttonLoader';
import { baseUrl } from '../../../../../utils/constant';
import { useUploadRefundReceiptAndMutualReleaseFileMangeMutation } from '../../../../../redux/api/superadmin/receiptManageDataSlice';
import { Button, Modal } from 'antd';
import toast from 'react-hot-toast';

interface RefundSectionProps {
  receiptModalData: any;
  handleCancel: () => void;
}

const RefundSection: React.FC<RefundSectionProps> = ({ receiptModalData, handleCancel}) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [uploadMutualRelease, setUploadMutualRelease] = useState<string>("");
  const [uploadRefundReceip, setUploadRefundReceipt] = useState<string>("");
  const [uploadRefundReceiptAndMutualReleaseFileMange] =  useUploadRefundReceiptAndMutualReleaseFileMangeMutation();

  useEffect(() => {
    setUploadRefundReceipt(receiptModalData?.refundreceiptPath || "");
    setUploadMutualRelease(receiptModalData?.mutualReleaseFormPath || "");
  }, [receiptModalData,uploadMutualRelease,uploadRefundReceip]);

  const handleRefundReceiptAndMutualReleaseChange = async ( e: React.ChangeEvent<HTMLInputElement>, fileType: string, uuid: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("refundReceiptAndMutualReleaseFile", file);
    formData.append("fileType", fileType);
    setIsUploading(fileType);

    try {
      const response = await uploadRefundReceiptAndMutualReleaseFileMange({
        uuid,
        data: formData,
      }).unwrap();

      if (fileType === "refundReceipt") {
        setUploadRefundReceipt(response?.data?.receiptData?.refundreceiptPath || "");
      } else {
        setUploadMutualRelease(response?.data?.receiptData?.mutualReleaseFormPath || "");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Modal
      title="Refund Section"
      visible={true}
      onCancel={handleCancel}
      width={1100}
      footer={[
        <Button key="cancel" onClick={()=>handleCancel()}>
          Close
        </Button>,
      ]}
    >
      <span className="ml-2 text-sm text-red-500">
        * After upload a Mutual release form then status will be Refund Process
      </span>
      <br />
      <span className="ml-2 text-sm text-red-500">
        * After upload a cheque receiver ID or business card then status will be Refund Completed
      </span>
      <br />
      <div className="flex space-x-8 pt-5">
        <div className="w-1/2">
          <p className="mb-2">Mutual release form</p>
          <label className="flex justify-center items-center py-2 border border-dashed border-gray-400 rounded-md gap-2 hover:border-blue-500 cursor-pointer w-full">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(event) =>
                handleRefundReceiptAndMutualReleaseChange(
                  event,
                  "mutualRelease",
                  receiptModalData.uuid
                )
              }
              accept="*/*"
            />
            {isUploading === "mutualRelease" && <ButtonLoader />}
            <span>Upload files</span>
          </label>

          {uploadMutualRelease && (
            <div className="mt-4">
              <div className="flex items-center">
                <NavLink
                  to={`${baseUrl + uploadMutualRelease}`}
                  className="text-blue-600"
                  target="_blank"
                >
                  <span>
                    {uploadMutualRelease.split(/[/\\]/).pop()}{" "}
                  </span>
                </NavLink>
              </div>
            </div>
          )}
        </div>

        <div className="w-1/2">
          <p className="mb-2">Cheque Receiver ID or Business Card</p>
          <label className="flex justify-center items-center py-2 border border-dashed border-gray-400 rounded-md gap-2 hover:border-blue-500 cursor-pointer w-full">
            <input
              type="file"
              className="hidden"
              onChange={(event) =>
                handleRefundReceiptAndMutualReleaseChange(
                  event,
                  "refundReceipt",
                  receiptModalData.uuid
                )
              }
              accept="application/pdf"
            />
            {isUploading === "refundReceipt" && <ButtonLoader />}
            <span>Upload files</span>
          </label>

          {uploadRefundReceip && (
            <div className="mt-4">
              <div className="flex items-center">
                <NavLink
                  to={`${baseUrl + uploadRefundReceip}`}
                  className="text-blue-600"
                  target="_blank"
                >
                  <span>
                    {uploadRefundReceip.split(/[/\\]/).pop()}{" "}
                  </span>
                </NavLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default RefundSection;