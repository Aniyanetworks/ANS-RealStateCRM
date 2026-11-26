/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { useGetSpacificTradeSheetListDataQuery } from "../../redux/api/agent/trade-sheet/tradeSheetSlice";
import { formatDateYYYYMMDD } from "../../utils/formatDateUtils";
import capitalizeFirstLetter from "../../utils/capitalizeFirstLetter";
import moment from "moment";
import ButtonLoader from "../loader/buttonLoader";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { pdf } from "@react-pdf/renderer";
import html2pdf from "html2pdf.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useForm } from "react-hook-form";
import {
  useBuyerCommissionInvoiceUploadMutation,
  useSendBuyerCommissionInvoiceMutation,
} from "../../redux/api/accounting/tradeAccountingSlice";
import toast from "react-hot-toast";
import uploadIcon from "./../../assets/upload2.svg";
import { baseUrl } from "../../utils/constant";
import { formatNumberWithCommasAndDecimals } from "../../utils/formatNumberWithCommasAndDecimals";
const BuyerCommissionInvoice = ({ uuid }) => {
  const [activeTab, setActiveTab] = useState("sendInvoice");
  const [tradeSheetData, setTradeSheetData] = useState([]);
  const [isEmailSend, setIsEmailSend] = useState<boolean>(false);
  const [otherDocumentName, setOtherDocumentName] = useState("");
  const [isUploading, setIsUploading] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const {
    data,
    isLoading,
    refetch: trdaeSheetRefetch,
  } = useGetSpacificTradeSheetListDataQuery(uuid);
  const sectionRef = useRef();
  const {
    register,
    reset,
    formState: { errors },
    getValues,
    setError,
    handleSubmit,
    setValue,
    watch,
    trigger,
  } = useForm<DataType>({});

  const resetForm = () => {
    setValue("recipients", "");
    setValue("subject", "");
    setValue("data", "");
    setValue("attachments", "");
  };

  useEffect(() => {
    setTradeSheetData(data?.data?.tradeSheetData);
  }, [data, tradeSheetData]);

  const sellingCommissionCalculation = (
    commissionRate = tradeSheetData?.agentDetails?.[0]?.buyerCommission || 2.5,
    amount = tradeSheetData?.properties?.[0]?.soldPrice
  ) => {
    return (commissionRate / 100) * amount;
  };

  const gstCalculation = (
    commissionRate = 13,
    amount = sellingCommissionCalculation()
  ) => {
    return (commissionRate / 100) * amount;
  };

  const totalSellingCommissionCalculation = () => {
    // Get the selling commission
    const sellingCommission = sellingCommissionCalculation();

    // Get the GST on the commission
    const gst = gstCalculation(13, sellingCommission); // Use the selling commission here

    // Return the total commission including GST
    return sellingCommission + gst;
  };

  const [sendBuyerCommissionInvoice] = useSendBuyerCommissionInvoiceMutation();
  const [buyerCommissionInvoiceUpload] =
    useBuyerCommissionInvoiceUploadMutation();

  const onSubmitEmail = async () => {
    setIsEmailSend(true);

    try {
      // Wait for the PDF to be generated first
      await new Promise((resolve, reject) => {
        const input = sectionRef.current;
        html2canvas(input, {
          scale: 2,
          useCORS: true, // Enable CORS for external images
          logging: true,
          allowTaint: true,
        })
          .then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");

            const pdfWidth = pdf.internal.pageSize.getWidth();

            // Fit image to page width and maintain aspect ratio
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasHeight / canvasWidth;
            const imgHeight = pdfWidth * ratio;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);

            const pdfBlob = pdf.output("blob");
            const pdfFile = new File(
              [pdfBlob],
              "Buyer-Commission-Invoice.pdf",
              {
                type: "application/pdf",
              }
            );

            // Set the generated PDF File to "attachments" form field using setValue
            setValue("attachments", pdfFile);
            resolve(); // Resolve the promise after PDF is generated
          })
          .catch((error) => {
            reject(error); // Reject the promise if there's an error generating the PDF
          });
      });

      // Get form values from React Hook Form after the PDF generation is complete
      const data = getValues();
      const formDataEmail = new FormData();
      formDataEmail.append(
        "salePrice",
        tradeSheetData?.properties?.[0]?.salesPrice
      );
      formDataEmail.append("sellingCommission", sellingCommissionCalculation());
      formDataEmail.append("gstCommission", gstCalculation());
      formDataEmail.append(
        "totalCommission",
        totalSellingCommissionCalculation()
      );
      formDataEmail.append("tradeSheetId", tradeSheetData?.id);
      formDataEmail.append(
        "propertyListingId",
        tradeSheetData?.propertyListingId
      );

      // Split recipients and append them to formData as an array of emails
      const recipientsArray = data.recipients
        .split(",")
        .map((email) => email.trim()); // Ensure emails are trimmed
      formDataEmail.append("recipients", recipientsArray); // Append recipients as a JSON string

      for (const key in data) {
        if (data.hasOwnProperty(key) && key !== "recipients") {
          // Skip recipients field here as we've already handled it
          formDataEmail.append(key, data[key]);
        }
      }

      // Send the email with the generated PDF as an attachment
      const response = await sendBuyerCommissionInvoice({
        data: formDataEmail,
      }).unwrap();

      toast.success(`${response?.message}`);
      resetForm();
    } catch (error) {
      console.log("Error:", error); // Log the error for debugging
      toast.error(`Error: ${error?.message || "Something went wrong"}`);
    } finally {
      setIsEmailSend(false);
    }
  };

  const handleChange = (value: any) => {
    setValue("data", value);
  };

  const handleUploadFile = async (e: any, uploadFileNameId: number) => {
    setIsUploading(true);

    const formData = new FormData();
    let file = e.target.files[0];
    formData.append("attachment", file);
    formData.append("tradeSheetId", tradeSheetData?.id);

    try {
      const response = await buyerCommissionInvoiceUpload({
        data: formData,
      }).unwrap();

      if (response.Status) {
        trdaeSheetRefetch();

        toast.success(response.message);
        setIsUploading(false);
      } else {
        toast.success(response.message);
        setIsUploading(false);
        trdaeSheetRefetch();
      }
    } catch (error: any) {
      setIsUploading(false);
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }

    if (file) {
      file = null;
    }
  };

  // Enhanced image loader with CORS handling
  const loadAndConvertImages = async (element: HTMLElement): Promise<void> => {
    const images = element.getElementsByTagName("img");
    const promises = Array.from(images).map((img) => {
      // Skip data URLs and local images
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
        // Add cache busting parameter
        proxyImg.src = img.src.includes("?")
          ? `${img.src}&t=${new Date().getTime()}`
          : `${img.src}?t=${new Date().getTime()}`;
      });
    });

    await Promise.all(promises);
  };

  const downloadPDF = async () => {
    setIsDownloading(true);

    try {
      if (!sectionRef.current) {
        throw new Error("Content not available for PDF generation");
      }

      await loadAndConvertImages(sectionRef.current);

      const options = {
        margin: 10,
        filename: "Buyer-Commisssion-Invoice.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: true,
          backgroundColor: "#ffffff",
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      const worker = html2pdf().set(options).from(sectionRef.current);
      await worker.save();
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

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md border border-gray-200">
      {/* Tabs */}
      <div className="mt-6 border-b flex mb-2">
        <button
          className={`px-4 py-2 ${
            activeTab === "sendInvoice"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("sendInvoice")}
        >
          Send Invoice
        </button>
        <button
          className={`px-4 py-2 ml-4 ${
            activeTab === "uploadInvoice"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("uploadInvoice")}
        >
          Upload Invoice
        </button>
      </div>
      {activeTab === "sendInvoice" && (
        <div>
          <div className="flex gap-3 items-center absolute top-3 right-16 ">
            <button className="primary-btn" onClick={printPdf}>
              Print
            </button>
            <button
              className="primary-btn flex gap-2 items-center"
              onClick={downloadPDF}
            >
              {isDownloading && <ButtonLoader />}Download
            </button>
          </div>
          <div ref={sectionRef} className="bg-[#0b3331] h-[1030px] ">
            <div className="ml-16 pl-10 py-10 border-[#0b3331] border-y-8 h-full  bg-white ">
              {/* Header */}
              <div className="flex gap-10 items-start  pb-4">
                <div className="flex gap-3 w-[50%] items-end">
                  <img
                    src="/logo.svg"
                    alt="ANS RealStateCRM"
                    className="h-24"
                  />
                  <div>
                    <h6 className="text-2xl leading-6 tracking-wider font-semibold">
                      ANS REALSTATECRM INC.
                    </h6>
                    <h6 className="text-lg leading-6 tracking-wider">
                      BROKERAGE
                    </h6>
                  </div>
                </div>
                <div className="text-right text-sm bg-gray-700 w-[50%] px-5 py-2 ">
                  <p className="text-white">885 Progress Ave, Suite 109</p>
                  <p className="text-white">Toronto, ON M1H 3C3</p>
                  <p className="text-white">O: 416-951-9929, F: 647-946-2959</p>
                  <p className="text-white">info@dvrealty.ca</p>
                </div>
              </div>

              {/* Invoice Info */}
              <div className="mt-4 text-sm">
                <p>Date: {moment().format("MMMM DD, YYYY")}</p>
                <p>
                  To:{" "}
                  {tradeSheetData?.agentDetails?.[0]?.sellerBrokerage
                    ?.brokerageName || ""}
                </p>
                <p>
                  {tradeSheetData?.agentDetails?.[0]?.sellerBrokerage
                    ?.address || ""}
                </p>
                <p>
                  {tradeSheetData?.agentDetails?.[0]?.sellerBrokerage
                    ?.streetAddress || ""}
                </p>
              </div>

              {/* Statement of Account */}
              <div className="mt-4">
                <h3 className="text-lg font-bold underline">
                  STATEMENT OF ACCOUNT
                </h3>
                <p>
                  <strong>Re:</strong>{" "}
                  {capitalizeFirstLetter(
                    tradeSheetData?.properties?.[0]?.propertyAddress
                  )}
                </p>
                <p>
                  <strong>MLS #:</strong> W11905863
                </p>
                <p>
                  <strong>Closing Date:</strong>{" "}
                  {tradeSheetData?.properties?.[0]?.closingDate
                    ? moment(
                        tradeSheetData?.properties?.[0]?.closingDate
                      ).format("MMMM DD, YYYY")
                    : ""}
                </p>
                <p>
                  <strong>Seller:</strong>{" "}
                  {tradeSheetData?.agentDetails?.[0]?.sellerFirstName +
                    " " +
                    tradeSheetData?.agentDetails?.[0]?.sellerLastName || "N/A"}
                </p>
                <p>
                  <strong>Buyer:</strong>{" "}
                  {tradeSheetData?.agentDetails?.[0]?.buyerFirstName +
                    " " +
                    tradeSheetData?.agentDetails?.[0]?.buyerLastName || "N/A"}
                </p>
              </div>

              {/* Financial Details */}
              <div className="mt-4">
                <div className="border-b border-gray-600 pb-2">
                  <p className=" grid grid-cols-2 gap-5">
                    <span>Sale Price:</span>{" "}
                    <span className="flex gap-5">
                      <span>$</span>
                      {formatNumberWithCommasAndDecimals(
                        tradeSheetData?.properties?.[0]?.soldPrice
                      )}
                    </span>
                  </p>
                  <p className=" grid grid-cols-2 gap-5">
                    <span>
                      Selling Commission (
                      {tradeSheetData?.agentDetails?.[0]?.buyerCommission ||
                        2.5}
                      %):
                    </span>{" "}
                    <span className="flex gap-5">
                      <span>$</span>
                      {formatNumberWithCommasAndDecimals(
                        sellingCommissionCalculation()
                      )}
                    </span>
                  </p>
                  <p className=" grid grid-cols-2 gap-5">
                    <span>GST (# 771957610):</span>{" "}
                    <span className="flex gap-5">
                      <span>$</span>
                      {formatNumberWithCommasAndDecimals(gstCalculation())}
                    </span>
                  </p>
                </div>

                <h3 className="mt-2 text-lg font-bold grid grid-cols-2 gap-5">
                  <span>Balance due to ANS RealStateCRM Inc.: </span>
                  <span className="flex gap-5">
                    <span>$</span>
                    {formatNumberWithCommasAndDecimals(
                      totalSellingCommissionCalculation()
                    )}
                  </span>
                </h3>
              </div>

              {/* Payment Instructions */}
              <div className="mt-4">
                <p>
                  Please make cheque payable to{" "}
                  <strong>ANS RealStateCRM Inc.</strong>
                </p>
                <p className="text-sm">
                  Our trade reference number is{" "}
                  {tradeSheetData?.tradeSheetTypeId || "N/A"}.
                </p>
              </div>

              {/* EFT Details */}
              <div className="mt-4">
                <h3 className="text-lg font-bold underline">
                  Electronic Fund Transfer (EFT) Details:
                </h3>
                <p>
                  <strong>Bank:</strong> TD CANADA TRUST
                </p>
                <p>
                  <strong>Transit #:</strong> 17902
                </p>
                <p>
                  <strong>Branch #:</strong> 004
                </p>
                <p>
                  <strong>Account #:</strong> 5278840
                </p>
              </div>

              {/* Buyer's Solicitor */}
              <div className="mt-4">
                <h3 className="text-lg font-bold underline">
                  Buyer's Solicitor:
                </h3>
                <p>
                  {tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer?.name ||
                    "N/A"}
                  ,{" "}
                  {tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer
                    ?.lawyerFirmName || ""}
                  .
                </p>
                <p>
                  {tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer?.address ||
                    ""}
                </p>
                <p>
                  {tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer
                    ?.streetAddress || ""}
                </p>
                <p>
                  Tel:{" "}
                  {tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer
                    ?.phoneNumber || ""}
                  , Fax:{" "}
                  {tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer?.faxNumber ||
                    ""}
                </p>
                <p>
                  Email:{" "}
                  {tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer?.email || ""}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-5 text-sm text-gray-700">
                <p>
                  Thank you and feel free to reach out to us anytime if you have
                  any questions.
                </p>
                <p className="font-bold  mt-5">Tamanna Khan</p>
                <p>Tamanna Khan, ANS RealStateCRM Inc.</p>
                <p>Tel: 416-951-9929, Ext. 1002</p>
                <div className="flex gap-32 mt-4">
                  <p>www.dreamvalleyrealty.ca</p>
                  <div className="bg-[#0f766e] h-[20px] w-full">.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-5">
            <div>
              <h5 className="mb-2 text-center font-bold">Send Email</h5>

              {/* Recipients Input */}
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
                {errors.recipients && (
                  <span className="text-red-500">
                    {errors.recipients.message}
                  </span>
                )}
              </div>

              {/* Subject Input (Text Area) */}
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

                {errors.subject && (
                  <span className="text-red-500">{errors.subject.message}</span>
                )}
              </div>

              {/* Data Input (Text Area) */}
              <div className="mb-4">
                <label className="font-bold">Email Body:</label>
                {/* <textarea
                  rows={5}
                  className="w-full p-2 border rounded"
                  placeholder="Email Body/Content"
                  {...register("data", { required: "Email body is required" })}
                /> */}
                <ReactQuill
                  value={getValues("data")}
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
                {errors.data && (
                  <span className="text-red-500">{errors.data.message}</span>
                )}
              </div>
              {/* Submit Button */}
              <div>
                <button
                  className="bg-[#072f2d] text-white p-2 rounded-md flex gap-2 items-center"
                  onClick={onSubmitEmail} // Hook form submit
                  disabled={isEmailSend}
                >
                  {isEmailSend && <ButtonLoader />}
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === "uploadInvoice" && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Upload Invoice
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            Upload a copy of the invoice for reference. Please ensure it's in
            PDF format.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center">
              <label
                htmlFor={document.name}
                className="cursor-pointer flex items-center space-x-2  text-black py-2 px-4 rounded-lg shadow-md  transition duration-200"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <ButtonLoader />
                    <span className="text-sm">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <img
                      src={uploadIcon}
                      alt="Upload Icon"
                      className="w-5 h-5"
                    />
                    <input
                      onChange={(e) => handleUploadFile(e)}
                      type="file"
                      className="hidden"
                      accept="image/*, .pdf"
                    />
                    <span className="text-sm">Choose a file</span>
                  </>
                )}
              </label>
            </div>

            {tradeSheetData?.tradeCommissionInvoice && (
              <div className="flex items-center space-x-2 mt-0">
                <span className="text-sm text-gray-700">Uploaded File: </span>
                <a
                  href={
                    baseUrl +
                    tradeSheetData?.tradeCommissionInvoice?.[0]?.invoicePath
                  }
                  target="_blank"
                  className="text-blue-500 underline text-sm"
                >
                  {tradeSheetData?.tradeCommissionInvoice?.[0]?.invoicePath
                    ?.split(/[/\\]/)
                    .pop()}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerCommissionInvoice;
