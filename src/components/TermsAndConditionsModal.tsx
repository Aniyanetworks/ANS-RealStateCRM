// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
"use client"

import { useState, useRef, useEffect } from "react";
import { Modal, Button, Space } from "antd";
import SignatureCanvas from "react-signature-canvas";
import { FaPrint, FaDownload, FaEye, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import { formatNumberWithCommasAndDecimals } from "../utils/formatNumberWithCommasAndDecimals";
import { formatDate, parseISO } from "date-fns";
import moment from "moment-timezone";
import html2pdf from 'html2pdf.js';
import logo from "/logo.svg";
import { baseUrl } from '../utils/constant';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: (signatureData: string, comment?: string, attachment?: string) => void;
  orderData?: any;
  isLoading?: boolean;
}

const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({
  isOpen,
  onClose,
  onAgree,
  orderData,
  isLoading = false
}) => {
  const [isAgreed, setIsAgreed] = useState(false);
  const [uploadSignatureImage, setUploadSignatureImage] = useState("");
  const [comment, setComment] = useState("");
  const [attachment, setAttachment] = useState("");
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const signatureRef = useRef<any>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen && orderData) {
      setComment(orderData.comment || "");
      
      if (orderData.signature) {
        if (orderData.signature.startsWith('http') || orderData.signature.startsWith('data:')) {
          setUploadSignatureImage(orderData.signature);
        } else {
          setUploadSignatureImage(`${baseUrl}${orderData.signature}`);
        }
      } else {
        setUploadSignatureImage("");
      }
      
      if (orderData.attatchment) {
        if (orderData.attatchment.startsWith('http') || orderData.attatchment.startsWith('data:')) {
          setAttachmentPreview(orderData.attatchment);
        } else {
          const fullAttachmentUrl = `${baseUrl}${orderData.attatchment}`;
          setAttachmentPreview(fullAttachmentUrl);
        }
      } else {
        setAttachmentPreview("");
      }
      
      setAttachment("");
    }
  }, [isOpen, orderData]);

  useEffect(() => {
    if (!isOpen) {
      setIsAgreed(false);
      setUploadSignatureImage("");
      setComment("");
      setAttachment("");
      setAttachmentPreview("");
      if (signatureRef.current) {
        signatureRef.current.clear();
      }
    }
  }, [isOpen]);

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
    setUploadSignatureImage("");
  };

  const saveSignature = () => {
    if (signatureRef.current.isEmpty()) {
      toast.error("Please provide a signature");
      return;
    }

    const signatureImage = signatureRef.current
      .getTrimmedCanvas()
      .toDataURL("image/png");

    setUploadSignatureImage(signatureImage);
    toast.success("Signature saved successfully");
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPEG, PNG, JPG images and PDF files are allowed");
        return;
      }

      try {
        const base64 = await convertFileToBase64(file);
        setAttachment(base64);
        setAttachmentPreview(base64);
        toast.success("Attachment uploaded successfully");
      } catch (error) {
        console.error("Error converting attachment to base64:", error);
        toast.error("Error processing attachment");
      }
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment("");
    setAttachmentPreview("");
  };

  const handleViewAttachment = () => {
    if (attachmentPreview) {
      setShowAttachmentModal(true);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAgree = () => {
    if (!isAgreed) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    if (!uploadSignatureImage) {
      toast.error("Please provide a signature");
      return;
    }

    let signatureData = uploadSignatureImage;
    if (uploadSignatureImage.startsWith('data:')) {
      signatureData = uploadSignatureImage.split(',')[1];
    } else if (uploadSignatureImage.startsWith(baseUrl)) {
      signatureData = 'existing';
    }

    let attachmentData = attachment;
    if (attachment && attachment.startsWith('data:')) {
      attachmentData = attachment.split(',')[1];
    } else if (!attachment && orderData?.attatchment) {
      attachmentData = 'existing';
    }

    onAgree(signatureData, comment, attachmentData);
  };

  const getPrintContent = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Borrow Agreement - ${orderData?.invoice_number || 'Order'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            
            body { 
              font-family: 'Inter', Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6;
              color: #1f2937;
              font-size: 14px;
            }
            
            .agreement-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
            }
            
            .header { 
              text-align: center; 
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 2px solid #1a365d;
            }
            
            .logo-section {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
              margin-bottom: 10px;
            }
            
            .logo-section img {
              height: 50px;
              width: auto;
            }
            
            .company-name {
              font-size: 20px;
              font-weight: 700;
              color: #0f766e;
              letter-spacing: 1.5px;
            }
            
            .agreement-title {
              font-size: 24px;
              font-weight: 700;
              color: #1a365d;
              margin: 10px 0;
            }
            
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 25px;
              font-size: 14px;
              background: #f8f9fa;
              padding: 15px;
              border-radius: 6px;
            }
            
            .terms-section { 
              margin: 25px 0; 
            }
            
            .terms-section h3 {
              color: #1a365d;
              border-bottom: 2px solid #d1d5db;
              padding-bottom: 8px;
              margin-bottom: 15px;
              font-size: 18px;
              font-weight: 600;
            }
            
            .terms-list {
              margin: 15px 0;
              padding-left: 20px;
            }
            
            .terms-list li {
              margin-bottom: 10px;
              font-size: 14px;
              line-height: 1.5;
            }
            
            .signature-section {
              margin: 25px 0;
              padding-top: 20px;
              border-top: 2px solid #1a365d;
            }
            
            .signature-image {
              max-width: 300px;
              max-height: 120px;
              border: 2px solid #d1d5db;
              margin: 8px 0;
              padding: 5px;
              background: white;
            }
            
            .footer { 
              margin-top: 10px; 
              text-align: center;
              font-size: 12px; 
              color: #6b7280;
              border-top: 1px solid #d1d5db;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="agreement-container">
            <div class="header">
              <div class="logo-section">
                <img src="${logo}" alt="ANS RealStateCRM" />
                <div class="company-name">ANS REALSTATECRM</div>
              </div>
              <h1 class="agreement-title">BORROW AGREEMENT</h1>
            </div>
            
            <div class="info-section">
              <div><strong>BA ID:</strong> ${orderData?.invoice_number || 'N/A'}</div>
              <div><strong>Date:</strong> ${orderData?.createdAt ? formatDate(parseISO(orderData.createdAt), "dd MMMM yyyy") : 'N/A'}</div>
              <div><strong>Agent:</strong> ${orderData?.agent?.name || 'N/A'}</div>
              <div><strong>Phone:</strong> ${orderData?.agent?.phoneNumber || 'N/A'}</div>
            </div>
            
            <div class="terms-section">
              <h3>Terms & Conditions</h3>
              <ul class="terms-list">
                <li>I agree to return the borrowed item(s) on or before the specified due date.</li>
                <li>I agree to inspect the item(s) upon receipt and report any damages within 24 hours.</li>
                <li>I am responsible for any loss or damage to the item(s) during the borrowing period.</li>
                <li>I understand that the item(s) must be returned in the same condition as when borrowed, accounting for normal wear and tear.</li>
                <li>I authorize the lender to charge my account for any repair or replacement costs if the item is damaged or not returned.</li>
                <li>I confirm that I have read and understood all the terms and conditions of this borrowing agreement.</li>
              </ul>
            </div>
            
            <div class="signature-section">
              <div class="signature-info">
                <div><strong>Signed By:</strong> ${orderData?.agent?.name || 'N/A'}</div>
              </div>
              ${orderData?.signature ? 
                `<img src="${baseUrl}${orderData.signature}" alt="Signature" class="signature-image" />` : 
                '<p style="color: #d92d20; font-style: italic;">Signature not provided</p>'
              }
            </div>
            
            <div class="footer">
              <p><strong>This agreement is electronically generated and legally binding. @ANS RealStateCRM Inc. - ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const downloadPDF = async () => {
    setIsDownloading(true);
    
    const content = getPrintContent();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const images = tempDiv.getElementsByTagName('img');
    const imageLoadPromises = Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = resolve;
          }
        })
    );

    try {
      await Promise.all(imageLoadPromises);
    } catch (error) {
    }

    const options = {
      margin: 10,
      filename: `borrow-agreement-${orderData?.invoice_number || 'order'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      },
    };

    try {
      await html2pdf().set(options).from(tempDiv).save();
      toast.success('Agreement PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating agreement PDF:', error);
      toast.error('Failed to download agreement PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const printContent = getPrintContent();
    const printWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes');
    
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      const style = printWindow.document.createElement('style');
      style.textContent = `
        @media print {
          body { 
            margin: 0 !important;
            padding: 15mm !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
          }
        }
      `;
      printWindow.document.head.appendChild(style);
      
      printWindow.focus();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      };
    } else {
      toast.error('Please allow popups to print');
    }
  };

  const termsAndConditions = [
    "I agree to return the borrowed item(s) on or before the specified due date.",
    "I agree to inspect the item(s) upon receipt and report any damages within 24 hours.",
    "I am responsible for any loss or damage to the item(s) during the borrowing period.",
    "I understand that the item(s) must be returned in the same condition as when borrowed, accounting for normal wear and tear.",
    "I authorize the lender to charge my account for any repair or replacement costs if the item is damaged or not returned.",
    "I confirm that I have read and understood all the terms and conditions of this borrowing agreement."
  ];

  const isImageAttachment = attachmentPreview && attachmentPreview.startsWith('data:image');
  const isPDFAttachment = attachmentPreview && attachmentPreview.startsWith('data:application/pdf');

  return (
    <Modal
      title="Borrow Agreement - Terms & Conditions"
      open={isOpen}
      onCancel={onClose}
      width={700}
      footer={null}
      style={{ top: 10 }}
      className="compact-modal"
    >
      <div ref={modalRef} className="space-y-4 text-sm">
        <div className="text-center border-b pb-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={logo} alt="ANS RealStateCRM" className="h-8 w-auto" />
            <span className="text-lg font-bold text-[#0f766e] tracking-wider">ANS REALSTATECRM</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800">BORROW AGREEMENT</h2>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div><strong>BA ID:</strong> {orderData?.invoice_number || 'N/A'}</div>
            <div><strong>Date:</strong> {moment.utc(orderData?.createdAt)
                  .tz("America/Toronto")
                  .format("DD MMMM YYYY")}</div>
            <div><strong>Agent:</strong> {orderData?.agent?.name || 'N/A'}</div>
            <div><strong>Phone:</strong> {orderData?.agent?.phoneNumber || 'N/A'}</div>
          </div>
        </div>

        <div className="terms-section">
          <h3 className="font-semibold mb-2 text-gray-800 border-b pb-1 text-sm">Terms & Conditions:</h3>
          <ul className="list-disc pl-4 space-y-1 text-xs">
            {termsAndConditions.map((term, index) => (
              <li key={index} className="leading-tight">{term}</li>
            ))}
          </ul>
        </div>

        <div className="comment-section">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Comments
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add any comments or notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <div className="signature-attachment-section grid grid-cols-2 gap-4 border-t pt-3">
          <div className="signature-section">
            <h3 className="font-semibold mb-2 text-sm">Signature</h3>
            
            {!uploadSignatureImage ? (
              <>
                <div className="border border-gray-300 rounded p-1 w-full h-[120px]">
                  <SignatureCanvas
                    ref={signatureRef}
                    penColor="black"
                    canvasProps={{
                      width: 280,
                      height: 120,
                      className: "w-full h-full",
                    }}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                    onClick={saveSignature}
                  >
                    Save Signature
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-2">
                <p className="mb-1 text-xs font-medium">Signature Preview:</p>
                <img
                  src={uploadSignatureImage}
                  alt="Signature preview"
                  className="max-w-[200px] h-16 border border-gray-300"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                  >
                    Clear & Redraw
                  </button>
                </div>
              </div>
            )}

            {orderData?.signature && !uploadSignatureImage && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-medium">Existing Signature:</p>
                <img
                  src={`${baseUrl}${orderData.signature}`}
                  alt="Existing signature"
                  className="max-w-[200px] h-16 border border-gray-300"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadSignatureImage("");
                      if (signatureRef.current) {
                        signatureRef.current.clear();
                      }
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                  >
                    Update Signature
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="attachment-section">
            <h3 className="font-semibold mb-2 text-sm">Attachment</h3>
            
            {!attachmentPreview ? (
              <div className="flex flex-col space-y-2">
                <label className="flex justify-center items-center py-2 px-3 border border-dashed border-gray-400 rounded text-xs hover:border-blue-500 cursor-pointer h-[120px]">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleAttachmentUpload}
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                  />
                  <div className="text-center">
                    <span>Choose file</span>
                    <div className="text-xs text-gray-500 mt-1">JPG, PNG, PDF</div>
                    <div className="text-xs text-gray-500">Max 5MB</div>
                  </div>
                </label>
              </div>
            ) : (
              <div className="border border-gray-300 rounded p-3 h-[120px] flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  {isImageAttachment ? (
                    <img 
                      src={attachmentPreview} 
                      alt="Attachment preview" 
                      className="max-h-16 max-w-full object-contain"
                    />
                  ) : isPDFAttachment ? (
                    <div className="text-center">
                      <div className="text-3xl text-red-500 mb-1">📄</div>
                      <span className="text-xs text-gray-600">PDF Document</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-3xl text-gray-500 mb-1">📎</div>
                      <span className="text-xs text-gray-600">File Attached</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <Button
                    icon={<FaEye />}
                    onClick={handleViewAttachment}
                    size="small"
                    type="text"
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    View
                  </Button>
                  <Button
                    icon={<FaTimes />}
                    onClick={handleRemoveAttachment}
                    size="small"
                    type="text"
                    danger
                    className="text-xs"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {orderData?.attatchment && !attachmentPreview && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-medium">Existing Attachment:</p>
                <div className="border border-gray-300 rounded p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-2xl mr-2">📎</div>
                      <span className="text-xs text-gray-600">Existing File</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        icon={<FaEye />}
                        onClick={() => {
                          const fullUrl = `${baseUrl}${orderData.attatchment}`;
                          setAttachmentPreview(fullUrl);
                          setShowAttachmentModal(true);
                        }}
                        size="small"
                        type="text"
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        View
                      </Button>
                      <Button
                        icon={<FaTimes />}
                        onClick={() => {
                          setAttachment("");
                          setAttachmentPreview("");
                        }}
                        size="small"
                        type="text"
                        danger
                        className="text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-3">
          <input
            type="checkbox"
            id="agreeTerms"
            checked={isAgreed}
            onChange={(e) => setIsAgreed(e.target.checked)}
            className="w-3 h-3"
          />
          <label htmlFor="agreeTerms" className="text-xs">
            I have read and agree to all the terms and conditions stated above
          </label>
        </div>

        <div className="flex justify-between items-center pt-3 border-t">
          <Space>
            <Button 
              icon={<FaPrint />} 
              onClick={handlePrint}
              disabled={ (!uploadSignatureImage && !orderData?.signature)}
              size="small"
            >
              Print Agreement
            </Button>
            <Button 
              icon={<FaDownload />} 
              onClick={downloadPDF}
              disabled={ (!uploadSignatureImage && !orderData?.signature)}
              loading={isDownloading}
              size="small"
            >
              Download Full Agreement
            </Button>
          </Space>
          
          <Space>
            <Button onClick={onClose} size="small">
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleAgree}
              disabled={ !uploadSignatureImage}
              loading={isLoading}
              size="small"
            >
              Confirm Borrow
            </Button>
          </Space>
        </div>

        <div className="text-center border-t pt-2 text-gray-500 text-xs">
          <p>This agreement is electronically generated and legally binding.</p>
          <p>ANS RealStateCRM Inc. - {new Date().getFullYear()}</p>
        </div>
      </div>

      <Modal
        open={showAttachmentModal}
        onCancel={() => setShowAttachmentModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowAttachmentModal(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Attachment Preview</h3>
          {attachmentPreview ? (
            <iframe 
              src={attachmentPreview} 
              width="100%" 
              height="500px" 
              title="PDF Preview"
              className="border rounded"
            />
          ) : (
            <div className="p-8 bg-gray-100 rounded-lg border">
              <div className="text-4xl text-gray-500 mb-2">📄</div>
              <p className="text-gray-600">Document Preview</p>
              <p className="text-sm text-gray-500 mt-2 mb-4">
                This file is attached to the agreement.
              </p>
              <Button 
                type="primary" 
                onClick={() => window.open(attachmentPreview, '_blank')}
              >
                View Full File
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <div style={{ display: 'none' }}>
        <div ref={printRef} id="print-template">
          {getPrintContent()}
        </div>
      </div>
    </Modal>
  );
};

export default TermsAndConditionsModal;