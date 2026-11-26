// @ts-nocheck
import { useRef, useEffect, useState } from "react";
import ModalMain from "../../../../../../components/ui/Modal";
import ReceiptDisplay from "./ReceiptDisplay";
import EmailForm from "./EmailForm";
import type { DataType } from "./types";
import html2pdf from "html2pdf.js";
import { preprocessImages, generatePDFFromElement } from "./utils";

interface ReceiptViewModalProps {
  isModalOpen: boolean;
  handleCancel: () => void;
  receiptModalData: DataType;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDownloading: boolean;
  setIsDownloading: (loading: boolean) => void;
  register: any;
  errors: any;
  handleChange: (value: any) => void;
  onSubmitEmail: () => void;
  isEmailSend: boolean;
  data: string;
  setValue: (field: string, value: any) => void;
}

const ReceiptViewModal = ({
  isModalOpen,
  handleCancel,
  receiptModalData,
  activeTab,
  setActiveTab,
  isDownloading,
  setIsDownloading,
  register,
  errors,
  handleChange,
  onSubmitEmail,
  isEmailSend,
  data,
  setValue,
}: ReceiptViewModalProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const receiptSectionRef = useRef<HTMLDivElement>(null);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (isModalOpen) {
      setActiveTab("pickup");
      setRenderKey(prev => prev + 1);
    }
  }, [isModalOpen, setActiveTab, receiptModalData?.receiptId, receiptModalData?.uuid]);

  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [activeTab]);

  useEffect(() => {
    if (isModalOpen && activeTab === "email") {
      const generatePDF = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const printSection = document.getElementById("printSection");
        if (printSection) {
          try {
            await generatePDFFromElement(printSection, setValue);
          } catch (err) {
            console.error("Error generating PDF:", err);
          }
        }
      };
      generatePDF();
    }
  }, [isModalOpen, activeTab, setValue, receiptModalData]);

  const downloadPDF = async () => {
    setIsDownloading(true);
    const printSection = document.getElementById("printSection");
    if (!printSection) {
      setIsDownloading(false);
      return;
    }
    try {
      await preprocessImages(printSection);
      const images = printSection.getElementsByTagName("img");
      const imageLoadPromises = Array.from(images).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve(undefined);
            else img.onload = resolve;
          })
      );
      await Promise.all(imageLoadPromises);
      const options = {
        margin: 10,
        filename: "Pickup_Receipt.pdf",
        image: { type: "png", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      await html2pdf().from(printSection).set(options).save();
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const printPdf = async () => {
    const printSection = document.getElementById("printSection");
    if (!printSection) return;
    try {
      await preprocessImages(printSection);
      const printContents = printSection.outerHTML;
      const printStyle = `
        <style>
          @media print {
            body * { visibility: hidden; }
            #printSection, #printSection * { visibility: visible; }
            #printSection { position: absolute; top: 0; left: 0; }
          }
        </style>
      `;
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Pickup Receipt</title>
              <script src="https://cdn.tailwindcss.com"></script>
              ${printStyle}
            </head>
            <body>
              <div id="printSection" style="width:800px;margin:auto auto">
                ${printContents}
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
        newWindow.onload = () => {
          newWindow.print();
          newWindow.close();
        };
      }
    } catch (err) {
      console.error("Print error:", err);
    }
  };

  return (
    <ModalMain
      okBtnText={activeTab === "pickup" ? "Download" : undefined}
      printBtnText={activeTab === "pickup" ? "Print" : null}
      handleCancel={handleCancel}
      handlePrint={activeTab === "pickup" ? printPdf : undefined}
      handleOk={activeTab === "pickup" ? downloadPDF : undefined}
      isModalOpen={isModalOpen}
      isLoading={isDownloading}
      showOkButton={activeTab === "pickup"}
      modalClass={"!w-[750px] !z-[10000] mx-auto"}
      title={null}
    >
      <div className="flex justify-around mb-4">
        <button
          type="button"
          className={`py-2 px-4 ${
            activeTab === "pickup" ? "bg-[#0f766e] text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("pickup")}
        >
          Cheque Pickup Receipt
        </button>
        <button
          type="button"
          className={`py-2 px-4 ${
            activeTab === "email" ? "bg-[#0f766e] text-white" : "bg-gray-200"
          }`}
          onClick={() => {
            setActiveTab("email");
          }}
        >
          Send Email
        </button>
      </div>

      {activeTab === "pickup" && (
        <div
          ref={receiptSectionRef}
          key={`receipt-pickup-${receiptModalData?.receiptId || receiptModalData?.uuid || 'new'}-${activeTab}-${renderKey}`}
          className="max-h-[70vh] overflow-y-auto overflow-x-hidden"
        >
          <ReceiptDisplay 
            receiptData={receiptModalData} 
            isLoading={!receiptModalData || Object.keys(receiptModalData).length === 0}
          />
        </div>
      )}
      
      {activeTab === "email" && (
        <div
          key={`receipt-email-${receiptModalData?.receiptId || receiptModalData?.uuid || 'new'}-${activeTab}-${renderKey}`}
          style={{
            position: "absolute",
            left: "-9999px",
            top: "0",
            width: "750px",
            visibility: "visible",
            opacity: "1",
          }}
        >
          <ReceiptDisplay 
            receiptData={receiptModalData} 
            isLoading={!receiptModalData || Object.keys(receiptModalData).length === 0}
          />
        </div>
      )}

      {activeTab === "email" && (
        <div ref={sectionRef}>
          <EmailForm
            register={register}
            errors={errors}
            handleChange={handleChange}
            onSubmitEmail={onSubmitEmail}
            isEmailSend={isEmailSend}
            data={data}
          />
        </div>
      )}
    </ModalMain>
  );
};

export default ReceiptViewModal;

