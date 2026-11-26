// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import html2pdf from "html2pdf.js";
import jsPDF from "jspdf";
import { pdf } from "@react-pdf/renderer";
import logo from "/logo.svg";
import moment from "moment-timezone";
import { useForm } from "react-hook-form";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import ButtonLoader from "../../../../../components/loader/buttonLoader";
import ModalMain from "../../../../../components/ui/Modal";
import { useSendDepositReceiptInvoiceEmailMutation } from "../../../../../redux/api/superadmin/receiptManageDataSlice";
import { baseUrl } from "../../../../../utils/constant";
import { formatNumberWithCommasAndDecimals } from "../../../../../utils/formatNumberWithCommasAndDecimals";
import numberToWords from "../../../../../utils/numberToWords";
import { formatStringCamelCasecapitalize } from "../../../../../utils/stringUtils";
import EmailPDF from "./EmailPDF";
import { Button, Modal, Skeleton } from "antd";
import toast from "react-hot-toast";
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

async function pdfToImages(dataUrl: string, maxPages = 10, scale = 1.6): Promise<string[]> {
  const bytes = Uint8Array.from(atob(dataUrl.split(",")[1] || ""), (c) => c.charCodeAt(0));
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const images: string[] = [];
  for (let n = 1; n <= Math.min(doc.numPages, maxPages); n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
    images.push(canvas.toDataURL("image/png"));
  }
  return images;
}

interface ReceiptModalProps {
  isReceiptModalOpen: boolean;
  handleCancel: () => void;
  receiptModalData: any;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isReceiptModalOpen,
  handleCancel,
  receiptModalData,
}) => {
  const sectionRef = useRef(null);
  const { register, errors, watch, setValue, getValues } = useForm();
  const [isEmailSend, setIsEmailSend] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("deposit");
  const [imagesLoading, setImagesLoading] = useState<boolean>(false);
  const [signatureBase64, setSignatureBase64] = useState<string>("");
  const [bankDraftBase64Images, setBankDraftBase64Images] = useState<string[]>([]);
  const [bankImagesLoading, setBankImagesLoading] = useState<boolean>(false);

  const [sendDepositReceiptInvoiceEmail] =
    useSendDepositReceiptInvoiceEmailMutation();

  const handleChange = (value: any) => {
    setValue("data", value);
  };

  useEffect(() => {
    if (!isReceiptModalOpen || !receiptModalData) return;
    let cancelled = false;

    setSignatureBase64(receiptModalData.signature || "");

    let sources: string[] = [];
    try {
      sources = receiptModalData.bankDraftImagePath ? JSON.parse(receiptModalData.bankDraftImagePath).filter(Boolean) : [];
    } catch {
      sources = [];
    }
    setBankDraftBase64Images(sources.filter((s) => !/^data:application\/pdf/i.test(s)));
    setBankImagesLoading(false);

    if (sources.some((s) => /^data:application\/pdf/i.test(s))) {
      setBankImagesLoading(true);
      (async () => {
        const out: string[] = [];
        for (const src of sources) {
          if (!/^data:application\/pdf/i.test(src)) {
            out.push(src);
            continue;
          }
          try {
            out.push(...(await pdfToImages(src)));
          } catch (error) {
            console.error("Could not render bank receipt PDF:", error);
          }
        }
        if (!cancelled) {
          setBankDraftBase64Images(out);
          setBankImagesLoading(false);
        }
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [isReceiptModalOpen, receiptModalData]);

  const generateReceiptEmailBody = (d: any): string => {
    const row = (label: string, value: string) => `
      <tr>
        <td style="padding:10px 16px;font-weight:700;color:#0b3b38;width:40%;border-bottom:1px solid #e8e8e8;vertical-align:top;white-space:nowrap;">${label}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #e8e8e8;vertical-align:top;color:#333;">${value}</td>
      </tr>`;

    const paymentMethod = d.paymentMethod === "bankDraft"
      ? `${formatStringCamelCasecapitalize(d.paymentMethod)}${d.bankDraftNumber ? ` — ${d.bankDraftNumber}` : ""}`
      : formatStringCamelCasecapitalize(d.paymentMethod);

    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;margin-top:8px;">
        <tr>
          <td colspan="2" style="background-color:#0b3b38;color:#fff;padding:12px 16px;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
            Deposit Receipt
          </td>
        </tr>
        ${row("Receipt No", d.receiptId ?? "—")}
        ${row("Date", moment.utc(d.date).tz("America/Toronto").format("DD MMMM YYYY, hh:mm A"))}
        ${row("Property Address", d.propertyAddress ?? "—")}
        ${row("Received From", `${d.receivedFrom ?? "—"} (${formatStringCamelCasecapitalize(d.representation ?? "")})`)}
        ${row("Type of Payment", formatStringCamelCasecapitalize(d.paymentType ?? "") || "—")}
        ${row("Payment Method", paymentMethod || "—")}
        ${row("Transaction Type", formatStringCamelCasecapitalize(d.transactionType ?? "") || "—")}
        ${row("Amount Received", `$${formatNumberWithCommasAndDecimals(d.amountReceived)}`)}
        ${row("Amount in Words", `${numberToWords(d.amountReceived)} Only`)}
        ${row("Received By", d.receivedBy ?? "—")}
      </table>`;
  };

  useEffect(() => {
    if (activeTab === "email" && receiptModalData) {
      const currentData = watch("data");
      if (!currentData || currentData === "<p><br></p>") {
        setValue("subject", `Deposit Receipt — ${receiptModalData.receiptId}`);
        setValue("data", generateReceiptEmailBody(receiptModalData));
      }
    }
  }, [activeTab]);

  const loadAndConvertImages = async (element: HTMLElement): Promise<void> => {
    setImagesLoading(true);
    const images = element.getElementsByTagName("img");
    const promises = Array.from(images).map((img) => {
      if (
        img.src.startsWith("data:") ||
        img.src.startsWith(window.location.origin)
      ) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const proxyImg = new Image();
        proxyImg.crossOrigin = "Anonymous";
        proxyImg.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = proxyImg.width;
            canvas.height = proxyImg.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(proxyImg, 0, 0);
              img.src = canvas.toDataURL("image/png");
            }
            resolve();
          } catch (error) {
            console.error("Error converting image:", error);
            resolve();
          }
        };
        proxyImg.onerror = () => {
          console.error("Failed to load image:", img.src);
          resolve();
        };
        proxyImg.src = img.src.includes("?")
          ? `${img.src}&t=${new Date().getTime()}`
          : `${img.src}?t=${new Date().getTime()}`;
      });
    });

    await Promise.all(promises);
    setImagesLoading(false);
  };

  useEffect(() => {
    if (!isReceiptModalOpen || activeTab !== "deposit" || !sectionRef.current) return;

    const signatureExpected = !!receiptModalData?.signature;
    let bankDraftExpected = false;
    if (receiptModalData?.bankDraftImagePath) {
      try {
        const parsed = JSON.parse(receiptModalData.bankDraftImagePath);
        bankDraftExpected = Array.isArray(parsed) && parsed.filter(Boolean).length > 0;
      } catch {
        bankDraftExpected = false;
      }
    }
    if (signatureExpected && !signatureBase64) return;
    if (bankDraftExpected && bankDraftBase64Images.length === 0) return;

    const generatePdf = async () => {
      try {
        await loadAndConvertImages(sectionRef.current!);

        const canvas = await html2canvas(sectionRef.current!, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pdfWidth, pdfHeight);

        setValue(
          "attachments",
          new File([pdf.output("blob")], "Deposit-Receipt.pdf", { type: "application/pdf" })
        );
      } catch (error) {
        console.error("PDF generation error:", error);
      }
    };

    generatePdf();
  }, [isReceiptModalOpen, activeTab, signatureBase64, bankDraftBase64Images, setValue]);

  const downloadPDF = async () => {
    setIsDownloading(true);
    try {
      if (!sectionRef.current) throw new Error("Content not available for PDF generation");

      await loadAndConvertImages(sectionRef.current);

      const options = {
        margin: 10,
        filename: "Deposit_Receipt.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: "#ffffff",
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      await html2pdf().set(options).from(sectionRef.current).save();
    } catch (error) {
      console.error("PDF download error:", error);
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const printPdf = () => {
    const printContents = sectionRef.current.outerHTML;
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
    newWindow.document.write(`
      <html>
        <head>
          <title>Deposit Receipt</title>
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
  };

  const printEmailPdf = async () => {
    const pdfInstance = pdf(
      <EmailPDF
        email={watch("recipients")}
        subject={watch("subject")}
        message={watch("data")}
      />
    );
    const blob = await pdfInstance.toBlob();

    const pdfURL = URL.createObjectURL(blob);
    const newWindow = window.open(pdfURL, "_blank");

    if (newWindow) {
      newWindow.addEventListener("load", () => {
        newWindow.print();
      });
    }
  };

  const handleEmailDownload = async () => {
    const pdfInstance = pdf(
      <EmailPDF
        email={watch("recipients")}
        subject={watch("subject")}
        message={watch("data")}
      />
    );
    const blob = await pdfInstance.toBlob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ApplicantData.pdf";

    link.click();

    URL.revokeObjectURL(link.href);
  };

  const onSubmitEmail = async () => {
    if (imagesLoading) {
      toast.error("Please wait for all images to load before sending the email.");
      return;
    }
    setIsEmailSend(true);
    const data = getValues();
    const formDataEmail = new FormData();
    const recipientsArray = data.recipients
      .split(",")
      .map((email) => email.trim());
    formDataEmail.append("recipients", recipientsArray);
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key) && key !== "recipients") {
        formDataEmail.append(key, data[key]);
      }
    }
    try {
      const response = await sendDepositReceiptInvoiceEmail({
        data: formDataEmail,
      }).unwrap();
      toast.success(`${response?.message}`);
    } catch (error: unknown) {
    } finally {
      setIsEmailSend(false);
    }
  };

  return (
    <Modal
      title=""
      open={isReceiptModalOpen}
      onCancel={handleCancel}
      width={750}
      footer={[
        <Button
          className="!bg-[#d51e1b] !text-white"
          key="cancel"
          onClick={() => handleCancel()}
        >
          Close
        </Button>,
        <Button
          key="cancel"
          className="!bg-[#0f766e] !text-white"
          onClick={() => printPdf()}
          disabled={bankImagesLoading}
        >
          Print
        </Button>,

        <Button
          key="cancel"
          className="!bg-[#0f766e] !text-white"
          onClick={() => downloadPDF()}
          disabled={bankImagesLoading}
        >
          {isDownloading ? <ButtonLoader /> : "Download"}
        </Button>,
      ]}
    >
      <div className="flex justify-around mb-4">
        <button
          className={`py-2 px-4 ${
            activeTab === "deposit" ? "bg-[#0f766e] text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("deposit")}
        >
          Deposit Receipt
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === "email" ? "bg-[#0f766e] text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("email")}
        >
          Email
        </button>
      </div>

      {activeTab === "deposit" && (
        <div className="space-y-1 pt-4" ref={sectionRef} id="printSection">
          <div className=" flex flex-col items-center gap-2  ">
            <img src={logo} alt="" className={`w-[50px]`} />
            <h2
              className={`tracking-widest text-base playfair-display-sc-bold text-[#0f766e]`}
            >
              ANS REALSTATECRM
            </h2>
          </div>

          <div className="text-center">
            <h2 className="font-semibold text-[#0b3b38] text-xl">
              DEPOSIT RECEIPT
            </h2>
          </div>
          <div className=" space-y-3 p-5">
            <div className="flex  gap-1">
              <label className="font-bold">Receipt No:</label>

              <p className="">{receiptModalData.receiptId}</p>
            </div>
            <div className="flex  gap-1">
              <label className="font-bold">Date:</label>

              <p className=" ">
                {moment
                  .utc(receiptModalData.date)
                  .tz("America/Toronto")
                  .format("DD MMMM YYYY, hh:mm A")}
              </p>
            </div>

            <div className="flex  gap-1 ">
              <label className="font-bold  ">
                Property Address:
              </label>
              <p className="  ">{receiptModalData.propertyAddress}</p>
            </div>

            <div className="flex   gap-1 ">
              <label className="font-bold">
                Received From:
              </label>
              <p className=" ">
                {receiptModalData.receivedFrom} (
                {formatStringCamelCasecapitalize(
                  receiptModalData?.representation
                )}
                )
              </p>
            </div>

            <div className="flex gap-5 ">
              <div className="flex gap-1 ">
                <label className="font-bold">
                  Type of Payment:
                </label>
                <div>
                  <p>
                    {formatStringCamelCasecapitalize(
                      receiptModalData.paymentType
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-1">
                <label className="font-bold">
                  Payment Method:
                </label>
                <div>
                  {receiptModalData.paymentMethod !== "bankDraft" ? (
                    <p>
                      {formatStringCamelCasecapitalize(
                        receiptModalData.paymentMethod
                      )}
                    </p>
                  ) : (
                    <p>
                      {formatStringCamelCasecapitalize(
                        receiptModalData.paymentMethod
                      )}{" "}
                      {formatStringCamelCasecapitalize(
                        receiptModalData?.bankDraftNumber
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-1">
              <div className="flex gap-1">
                <label className="font-bold">
                  Transaction Type:
                </label>
                <p>
                  {formatStringCamelCasecapitalize(
                    receiptModalData.transactionType
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-1">
              <label className="font-bold">
                Amount Received:
              </label>
              <p className=" ">
                ${" "}
                {formatNumberWithCommasAndDecimals(
                  receiptModalData.amountReceived
                )}
              </p>
            </div>
            <div className="flex gap-1">
              <label className="font-bold">
                Amount in Words:
              </label>
              <p className=" ">
                {numberToWords(receiptModalData.amountReceived)} Only
              </p>
            </div>

            <div className="flex items-start gap-1">
              <div className="flex w-1/2 gap-1">
                <label className="font-bold">
                  Received By:
                </label>
                <p className=" ">{receiptModalData.receivedBy}</p>
              </div>

              <div className="flex  w-1/2 gap-1">
                <label className="font-bold w-[100px]">Signature:</label>
                {signatureBase64 ? (
                  <img
                    className="max-w-[70px]"
                    src={signatureBase64}
                    alt="Signature"
                  />
                ) : receiptModalData?.signature ? (
                  <Skeleton.Input active size="small" style={{ width: 70, minWidth: 70, height: 28 }} />
                ) : null}
              </div>
            </div>

            <div className="!mt-5">
              {bankImagesLoading && (
                <div className="flex flex-col gap-2" data-html2canvas-ignore="true">
                  <Skeleton.Node active style={{ width: 480, maxWidth: "100%", height: 300 }}>
                    <span className="text-xs text-gray-400">Loading bank receipt…</span>
                  </Skeleton.Node>
                </div>
              )}
              {!bankImagesLoading && bankDraftBase64Images.length > 0 && (
                <div className="flex flex-col gap-4">
                  {bankDraftBase64Images.map((src, index) => (
                    <img
                      key={index}
                      src={src}
                      alt={`Bank draft image ${index + 1}`}
                      className="max-w-full border border-gray-200"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "email" && (
        <div className="space-y-3 pt-5" >
          <div>
            <h5 className="mb-2 text-center font-bold">Send Email</h5>

            <div className="mb-4">
              <label className="font-bold">Recipients Email:</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="Enter email addresses separated by commas"
                {...register("recipients", {
                  required: "Recipients are required",
                })}
              />
              {errors?.recipients && (
                <span className="text-red-500">
                  {errors?.recipients.message}
                </span>
              )}
            </div>

            <div className="mb-4">
              <label className="font-bold">Email Subject:</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="Subject"
                {...register("subject", {
                  required: "Subject is required",
                })}
              />

              {errors?.subject && (
                <span className="text-red-500">{errors?.subject?.message}</span>
              )}
            </div>

            <div className="mb-4">
              <label className="font-bold">Email Body:</label>
              <ReactQuill
                value={watch("data")}
                onChange={handleChange}
                modules={{
                  toolbar: [
                    [{ header: "1" }, { header: "2" }, { font: [] }],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["bold", "italic", "underline"],
                    [{ align: [] }],
                    ["link", "image"],
                    [{ color: [] }],
                  ],
                }}
                theme="snow"
                placeholder="Write your email body here..."
              />
              {errors?.data && (
                <span className="text-red-500">{errors?.data?.message}</span>
              )}
            </div>
            <div>
              <button
                className="bg-[#0f766e] text-white p-2 rounded-md flex gap-2 items-center"
                onClick={onSubmitEmail}
                disabled={isEmailSend || imagesLoading || bankImagesLoading}
              >
                {isEmailSend && <ButtonLoader />}
                {imagesLoading ? "Loading Deposit Receipt Please Wait..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ReceiptModal;
