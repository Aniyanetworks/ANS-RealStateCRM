/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { useGetSpacificTradeSheetListDataQuery } from "../../redux/api/agent/trade-sheet/tradeSheetSlice";
import capitalizeFirstLetter from "../../utils/capitalizeFirstLetter";
import moment from "moment";
import ButtonLoader from "../loader/buttonLoader";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import html2pdf from "html2pdf.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useForm } from "react-hook-form";
import { useSendBuyerCommissionInvoiceMutation } from "../../redux/api/accounting/tradeAccountingSlice";
import toast from "react-hot-toast";
import { formatNumberWithCommasAndDecimals } from "../../utils/formatNumberWithCommasAndDecimals";
import { useAppSelector } from "../../redux/hooks";
import { baseUrl, getFileUrl } from "../../utils/constant";

const SellerCommissionInvoice = ({ uuid, onInvoiceSent }) => {
  const [activeTab, setActiveTab] = useState("sendInvoice");
  const [selectedRepresentation, setSelectedRepresentation] = useState("buyer");
  const [representatioOptions, setRepresentatioOptions] = useState([]);
  const [tradeSheetData, setTradeSheetData] = useState([]);
  const [isEmailSend, setIsEmailSend] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const { data, isLoading } = useGetSpacificTradeSheetListDataQuery(uuid);
  const { user } = useAppSelector((state) => state.user);
  const sectionRef = useRef();
  const defaultsInitialized = useRef(false);
  const {
    register,
    formState: { errors },
    getValues,
    setValue,
    watch,
  } = useForm<DataType>({});

  const resetForm = () => {
    setValue("recipients", "");
    setValue("subject", "");
    setValue("data", "");
    setValue("attachments", "");
    defaultsInitialized.current = false;
  };

  useEffect(() => {
    setTradeSheetData(data?.data?.tradeSheetData);
  }, [data, tradeSheetData]);

  const soldPrice = (tradeSheetData) =>
    tradeSheetData?.representationType === "multiple" || tradeSheetData?.representation === "seller" || tradeSheetData?.representation === "landlord"
      ? tradeSheetData?.properties?.[0]?.salesPrice || 0.0
      : tradeSheetData?.properties?.[0]?.soldPrice || 0.0


  const sellingCommissionCalculation = () => {
    const isBuyerOrTenant = selectedRepresentation === "buyer" || selectedRepresentation === "tenant";

    const commissionType = isBuyerOrTenant
      ? tradeSheetData?.agentDetails?.[0]?.sellerCommissionType || "percentage"
      : tradeSheetData?.agentDetails?.[0]?.buyerCommissionType || "percentage";

    const amount = soldPrice(tradeSheetData);

    if (commissionType === "amount") {
      const commissionAmount = isBuyerOrTenant
        ? tradeSheetData?.agentDetails?.[0]?.sellerCommissionAmount || 0.0
        : tradeSheetData?.agentDetails?.[0]?.buyerCommissionAmount || 0.0;
      return commissionAmount;
    } else {
      const commissionRate = isBuyerOrTenant
        ? tradeSheetData?.agentDetails?.[0]?.sellerCommission || 0.0
        : tradeSheetData?.agentDetails?.[0]?.buyerCommission || 0.0;
      return (commissionRate / 100) * amount;
    }
  };

  const getCommissionDisplayValue = () => {
    const isBuyerOrTenant = selectedRepresentation === "buyer" || selectedRepresentation === "tenant";

    const commissionType = isBuyerOrTenant
      ? tradeSheetData?.agentDetails?.[0]?.sellerCommissionType || "percentage"
      : tradeSheetData?.agentDetails?.[0]?.buyerCommissionType || "percentage";

    if (commissionType === "amount") {
      const commissionAmount = isBuyerOrTenant
        ? tradeSheetData?.agentDetails?.[0]?.sellerCommissionAmount || 0.0
        : tradeSheetData?.agentDetails?.[0]?.buyerCommissionAmount || 0.0;
      return `$${formatNumberWithCommasAndDecimals(commissionAmount)}`;
    } else {
      const commissionRate = isBuyerOrTenant
        ? tradeSheetData?.agentDetails?.[0]?.sellerCommission || 0.0
        : tradeSheetData?.agentDetails?.[0]?.buyerCommission || 0.0;
      return `${commissionRate}%`;
    }
  };


  const getTotalCommissionAmountForInvoice = () => {
    if (hasCommercial && commercialCommissionData?.length) {
      if (commercialCommissionType === "percentage") {
        return commercialCommissionData.reduce((sum, item) => {
          const rent = parseFloat(String(item.yearlyRent || 0)) || 0;
          const commission = parseFloat(String(item.commission || 0)) || 0;
          return sum + (commission / 100) * rent;
        }, 0);
      }
      return commercialCommissionData.reduce(
        (sum, item) => sum + (parseFloat(String(item.commission || 0)) || 0),
        0
      );
    }
    return sellingCommissionCalculation();
  };

  const gstCalculation = (
    commissionRate = 13,
    amount = getTotalCommissionAmountForInvoice()
  ) => {
    return (commissionRate / 100) * amount;
  };

  const sharedUsersCommissionCalculation = () => {
    const isBuyerOrTenant = selectedRepresentation === "buyer" || selectedRepresentation === "tenant";
    const representationType = isBuyerOrTenant ? "buyer" : "seller";

    if (!tradeSheetData?.sharedUsers || tradeSheetData.sharedUsers.length === 0) {
      return 0;
    }

    const filteredSharedUsers = tradeSheetData.sharedUsers.filter(
      (user) => user.representationType === representationType
    );

    if (filteredSharedUsers.length === 0) {
      return 0;
    }

    const totalCommission = sellingCommissionCalculation();
    let totalSharedCommission = 0;

    filteredSharedUsers.forEach((user) => {
      if (user.commissionType === "amount") {
        totalSharedCommission += parseFloat(user.commission || 0);
      } else {
        const commissionRate = parseFloat(user.commission || 0);
        totalSharedCommission += (commissionRate / 100) * totalCommission;
      }
    });

    return totalSharedCommission;
  };

  const primaryAgentCommissionCalculation = () => {
    const totalCommission = sellingCommissionCalculation();
    const sharedCommission = sharedUsersCommissionCalculation();
    return totalCommission - sharedCommission;
  };

  const getPrimaryAgentCommissionDisplayValue = () => {
    const isBuyerOrTenant = selectedRepresentation === "buyer" || selectedRepresentation === "tenant";
    const representationType = isBuyerOrTenant ? "buyer" : "seller";

    const commissionType = isBuyerOrTenant
      ? tradeSheetData?.agentDetails?.[0]?.buyerCommissionType || "percentage"
      : tradeSheetData?.agentDetails?.[0]?.sellerCommissionType || "percentage";

    const filteredSharedUsers = tradeSheetData?.sharedUsers?.filter(
      (user) => user.representationType === representationType
    ) || [];

    if (commissionType === "amount") {
      const totalCommissionAmount = isBuyerOrTenant
        ? tradeSheetData?.agentDetails?.[0]?.buyerCommissionAmount || 0.0
        : tradeSheetData?.agentDetails?.[0]?.sellerCommissionAmount || 0.0;
      const sharedCommissionAmount = sharedUsersCommissionCalculation();
      const primaryCommissionAmount = totalCommissionAmount - sharedCommissionAmount;
      return `$${formatNumberWithCommasAndDecimals(primaryCommissionAmount)}`;
    } else {
      let totalSharedPercentage = 0;
      filteredSharedUsers.forEach((user) => {
        if (user.commissionType === "percentage") {
          totalSharedPercentage += parseFloat(user.commission || 0);
        }
      });

      const primaryAgentPercentage = 100 - totalSharedPercentage;
      return `${primaryAgentPercentage}%`;
    }
  };

  const getPrimaryAgentName = () => {
    const isBuyerOrTenant = selectedRepresentation === "buyer" || selectedRepresentation === "tenant";
    if (isBuyerOrTenant) {
      return `${tradeSheetData?.agentDetails?.[0]?.buyerFirstName || ""} ${tradeSheetData?.agentDetails?.[0]?.buyerLastName || ""}`.trim() || "N/A";
    } else {
      return `${tradeSheetData?.agentDetails?.[0]?.sellerFirstName || ""} ${tradeSheetData?.agentDetails?.[0]?.sellerLastName || ""}`.trim() || "N/A";
    }
  };

  const calculateIndividualSharedUserCommission = (user) => {
    const totalCommission = sellingCommissionCalculation();

    if (user.commissionType === "amount") {
      return parseFloat(user.commission || 0);
    } else {
      const commissionRate = parseFloat(user.commission || 0);
      return (commissionRate / 100) * totalCommission;
    }
  };

  const getIndividualSharedUserCommissionDisplay = (user) => {
    if (user.commissionType === "amount") {
      return `$${formatNumberWithCommasAndDecimals(parseFloat(user.commission || 0))}`;
    } else {
      return `${user.commission}%`;
    }
  };

  const getFilteredSharedUsers = () => {
    const isBuyerOrTenant = selectedRepresentation === "buyer" || selectedRepresentation === "tenant";
    const representationType = isBuyerOrTenant ? "buyer" : "seller";

    if (!tradeSheetData?.sharedUsers || tradeSheetData.sharedUsers.length === 0) {
      return [];
    }

    return tradeSheetData.sharedUsers.filter(
      (user) => user.representationType === representationType
    );
  };

  const totalSellingCommissionCalculation = () => {
    const commissionAmount = getTotalCommissionAmountForInvoice();
    const gst = gstCalculation(13, commissionAmount);
    return Number(commissionAmount) + Number(gst);
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  };

  const formatPercentage = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0.00%';
    return `${numValue.toFixed(2)}%`;
  };

  const calculateCommercialCommissionTotals = (commissionData: Array<any> | undefined) => {
    if (!commissionData || !Array.isArray(commissionData) || commissionData.length === 0) {
      return { totalYearlyRent: 0, totalCommission: 0 };
    }

    const totalYearlyRent = commissionData.reduce((sum, item) => {
      const rent = parseFloat(String(item.yearlyRent || 0)) || 0;
      return sum + rent;
    }, 0);

    const totalCommission = commissionData.reduce((sum, item) => {
      const commission = parseFloat(String(item.commission || 0)) || 0;
      return sum + commission;
    }, 0);

    return { totalYearlyRent, totalCommission };
  };

  const hasCommercialCommission = (commissionData: Array<any> | undefined) => {
    return commissionData && Array.isArray(commissionData) && commissionData.length > 0 &&
      commissionData.some(item => (item.yearlyRent && parseFloat(String(item.yearlyRent)) > 0) ||
        (item.commission && parseFloat(String(item.commission)) > 0));
  };

  const getCommercialCommissionData = () => {
    const isBuyerOrTenant = selectedRepresentation === "buyer" || selectedRepresentation === "tenant";
    if (isBuyerOrTenant) {
      return tradeSheetData?.agentDetails?.[0]?.sellerCommercialCommission || [];
    } else {
      return tradeSheetData?.agentDetails?.[0]?.buyerCommercialCommission || [];
    }
  };

  const getCommercialCommissionType = () => {
    const isBuyerOrTenant = selectedRepresentation === "buyer" || selectedRepresentation === "tenant";
    if (isBuyerOrTenant) {
      return tradeSheetData?.agentDetails?.[0]?.sellerCommissionType || 'percentage';
    } else {
      return tradeSheetData?.agentDetails?.[0]?.buyerCommissionType || 'percentage';
    }
  };

  const commercialCommissionData = getCommercialCommissionData();
  const commercialCommissionType = getCommercialCommissionType();
  const hasCommercial = hasCommercialCommission(commercialCommissionData);
  const commercialTotals = calculateCommercialCommissionTotals(commercialCommissionData);

  const [sendBuyerCommissionInvoice] = useSendBuyerCommissionInvoiceMutation();

  const onSubmitEmail = async () => {
    setIsEmailSend(true);

    try {
      await new Promise((resolve, reject) => {
        const input = sectionRef.current;
        html2canvas(input, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        })
          .then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
              position -= pdfHeight;
              pdf.addPage();
              pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
              heightLeft -= pdfHeight;
            }

            const pdfBlob = pdf.output("blob");
            const pdfFile = new File([pdfBlob], "Commission-Invoice.pdf", {
              type: "application/pdf",
            });

            setValue("attachments", pdfFile);
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });

      const data = getValues();
      const formDataEmail = new FormData();
      formDataEmail.append(
        "salePrice",
        tradeSheetData?.properties?.[0]?.salesPrice
      );
      formDataEmail.append("sellingCommission", getTotalCommissionAmountForInvoice());
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

      const recipientsArray = data.recipients
        .split(",")
        .map((email) => email.trim());
      formDataEmail.append("recipients", recipientsArray);

      for (const key in data) {
        if (data.hasOwnProperty(key) && key !== "recipients") {
          formDataEmail.append(key, data[key]);
        }
      }

      const response = await sendBuyerCommissionInvoice({
        data: formDataEmail,
      }).unwrap();

      toast.success(`${response?.message}`);
      if (typeof onInvoiceSent === "function") {
        onInvoiceSent();
      }
      resetForm();
    } catch (error) {
      toast.error(`Error: ${error?.message || "Something went wrong"}`);
    } finally {
      setIsEmailSend(false);
    }
  };

  const emailBody = watch("data");

  const handleChange = (value: any) => {
    setValue("data", value, { shouldValidate: true, shouldDirty: true });
  };

  const handleChangeRepresentation = (value: any) => {
    setSelectedRepresentation(value);
  };

  useEffect(() => {
    if (tradeSheetData) {
      let newRepresentationOptions = [];
      let defaultRepresentation = selectedRepresentation;

      if (tradeSheetData?.representationType === "single") {
        if (tradeSheetData?.representation === "buyer" || tradeSheetData?.representation === "seller") {
          newRepresentationOptions = [
            { value: "buyer", label: "Buyer" },
            { value: "seller", label: "Seller" },
          ];
          defaultRepresentation = tradeSheetData?.representation;
        } else if (tradeSheetData?.representation === "tenant" || tradeSheetData?.representation === "landlord") {
          newRepresentationOptions = [
            { value: "tenant", label: "Tenant" },
            { value: "landlord", label: "Landlord" },
          ];
          defaultRepresentation = tradeSheetData?.representation;
        }
      } else if (tradeSheetData?.representationType != "single") {
        if (tradeSheetData?.multipleRepresentation === "buyer,seller" || tradeSheetData?.multipleRepresentation === "seller,buyer") {
          newRepresentationOptions = [
            { value: "buyer", label: "Buyer" },
            { value: "seller", label: "Seller" },
          ];
          defaultRepresentation = "buyer";
        } else if (tradeSheetData?.multipleRepresentation === "tenant,landlord" || tradeSheetData?.multipleRepresentation === "landlord,tenant") {
          newRepresentationOptions = [
            { value: "tenant", label: "Tenant" },
            { value: "landlord", label: "Landlord" },
          ];
          defaultRepresentation = "tenant";
        }
      }

      setRepresentatioOptions(newRepresentationOptions);
      if (defaultRepresentation !== selectedRepresentation) {
        setSelectedRepresentation(defaultRepresentation);
      }
    }
  }, [tradeSheetData]);

  useEffect(() => {
    if (tradeSheetData && tradeSheetData?.properties?.[0]?.propertyAddress && !defaultsInitialized.current) {
      const propertyAddress = capitalizeFirstLetter(
        tradeSheetData?.properties?.[0]?.propertyAddress || ""
      );

      const closingDate = tradeSheetData?.properties?.[0]?.closingDate
        ? moment.utc(tradeSheetData?.properties?.[0]?.closingDate).format("MMMM DD, YYYY")
        : "";

      const representationForEmail =
        tradeSheetData?.representationType === "single"
          ? tradeSheetData?.representation
          : selectedRepresentation;
      const isBuyerOrTenant =
        representationForEmail === "buyer" ||
        representationForEmail === "tenant";

      const otherAgentFirstName = isBuyerOrTenant
        ? tradeSheetData?.agentDetails?.[0]?.sellerFirstName || ""
        : tradeSheetData?.agentDetails?.[0]?.buyerFirstName || "";
      const otherAgentLastName = isBuyerOrTenant
        ? tradeSheetData?.agentDetails?.[0]?.sellerLastName || ""
        : tradeSheetData?.agentDetails?.[0]?.buyerLastName || "";
      const agentsText = `${otherAgentFirstName} ${otherAgentLastName}`.trim() || "N/A";

      const defaultSubject = `Buyer Commission Invoice - ${propertyAddress} - ${closingDate}`;
      setValue("subject", defaultSubject, { shouldValidate: false, shouldDirty: false });

      const defaultBody = `<p>Please find attached the commission statement for ${propertyAddress}, scheduled to close on ${closingDate}.</p><p>Your Agents for this transaction: ${agentsText}.</p><p>Kindly confirm receipt of this email at your earliest convenience.</p><p>Thank you.</p><p>Deal Administrator</p><p>Tel: 416-951-9929, Ext. 1002</p><p>Email: admin@dvrealty.ca</p>`;
      setValue("data", defaultBody, { shouldValidate: false, shouldDirty: false });

      defaultsInitialized.current = true;
    }
  }, [tradeSheetData, selectedRepresentation, setValue]);

  const loadAndConvertImages = async (element: HTMLElement): Promise<void> => {
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
  };

  const downloadPDF = async () => {
    setIsDownloading(true);

    try {
      if (!sectionRef.current) {
        throw new Error("Content not available for PDF generation");
      }

      await loadAndConvertImages(sectionRef.current);

      const options = {
        margin: 0,
        filename: "Seller-Commission-Invoice.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: true,
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
    const printStyle = document.createElement("style");
    printStyle.innerHTML = `
      @media print {
        @page { margin: 0; size: A4; }
        body * { visibility: hidden; }
        #invoice-print-section, #invoice-print-section * { visibility: visible; }
        #invoice-print-section { position: fixed; top: 0; left: 0; width: 100%; }
      }
    `;
    document.head.appendChild(printStyle);
    sectionRef.current.id = "invoice-print-section";

    window.print();

    sectionRef.current.id = "";
    document.head.removeChild(printStyle);
  };

  return (
    <div className="max-w-3xl mx-auto p-6  bg-white shadow-md border border-gray-200">
      <div className="flex gap-3 items-center absolute top-3 right-16 ">

        <select
          value={selectedRepresentation}
          onChange={(e) => handleChangeRepresentation(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1"
        >
          {representatioOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

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
      <div className="mt-6 border-b flex mb-2">
        <button
          className={`px-4 py-2 ${activeTab === "sendInvoice"
            ? "border-b-2 border-blue-600 text-blue-600"
            : "text-gray-600"
            }`}
          onClick={() => setActiveTab("sendInvoice")}
        >
          Send Invoice
        </button>
      </div>
      {activeTab === "sendInvoice" && (
        <div>
          <div ref={sectionRef} className="bg-[#0f766e] min-h-[1122px] flex flex-col">
            <div className="ml-5 pl-10 pr-10 py-10 border-[#0b3331] border-y-8 bg-white flex-1 text-[13px] leading-6">
              <div className="flex gap-10 items-start border-b pb-4">
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
                <div className="text-right text-[12px] leading-5 bg-gray-700 w-[50%] px-5 py-2">
                  <p className="text-white">885 Progress Ave, Suite 109</p>
                  <p className="text-white">Toronto, ON M1H 3C3</p>
                  <p className="text-white">O: 416-951-9929, F: 647-946-2959</p>
                  <p className="text-white">info@dvrealty.ca</p>
                  <p className="text-white">www.dreamvalleyrealty.ca</p>
                </div>
              </div>

              {selectedRepresentation === "seller" || selectedRepresentation === "landlord" ? (
                <div className="mt-1">
                  <p className="pb-3">Date: {moment().format("MMMM DD, YYYY")}</p>
                  <p>{tradeSheetData?.agentDetails?.[0]?.sellerBrokerage?.brokerageName || ""}</p>
                  <p>
                    {[tradeSheetData?.agentDetails?.[0]?.sellerBrokerage?.address, tradeSheetData?.agentDetails?.[0]?.sellerBrokerage?.streetAddress].filter(Boolean).join(" ")}
                  </p>
                  <p>
                    {tradeSheetData?.agentDetails?.[0]?.sellerBrokerage?.city?.name || ""}{tradeSheetData?.agentDetails?.[0]?.sellerBrokerage?.state?.name ? `, ${tradeSheetData?.agentDetails?.[0]?.sellerBrokerage?.state?.name}` : ""}{tradeSheetData?.agentDetails?.[0]?.sellerBrokerage?.postalZipCode ? ` ${tradeSheetData?.agentDetails?.[0]?.sellerBrokerage?.postalZipCode}` : ""}
                  </p>
                </div>
              ) : (
                <div className="mt-1">
                  <p className="pb-3">Date: {moment().format("MMMM DD, YYYY")}</p>
                  <p>{tradeSheetData?.agentDetails?.[0]?.buyerBrokerage?.brokerageName || ""}</p>
                  <p>
                    {[tradeSheetData?.agentDetails?.[0]?.buyerBrokerage?.address, tradeSheetData?.agentDetails?.[0]?.buyerBrokerage?.streetAddress].filter(Boolean).join(" ")}
                  </p>
                  <p>
                    {tradeSheetData?.agentDetails?.[0]?.buyerBrokerage?.city?.name || ""}{tradeSheetData?.agentDetails?.[0]?.buyerBrokerage?.state?.name ? `, ${tradeSheetData?.agentDetails?.[0]?.buyerBrokerage?.state?.name}` : ""}{tradeSheetData?.agentDetails?.[0]?.buyerBrokerage?.postalZipCode ? ` ${tradeSheetData?.agentDetails?.[0]?.buyerBrokerage?.postalZipCode}` : ""}
                  </p>
                </div>
              )}


              <div className="mt-2">
                <h3 className="font-bold underline">STATEMENT OF ACCOUNT</h3>
                <p>
                  <strong>Re:</strong>{" "}
                  {capitalizeFirstLetter(
                    tradeSheetData?.properties?.[0]?.propertyAddress
                  )}
                </p>
                <p>
                  <strong>MLS #:</strong>{" "}
                  {tradeSheetData?.properties?.[0]?.mlsNumber ??
                    tradeSheetData?.propertyListing?.mlsNumber ??
                    "N/A"}
                </p>

                <p>
                  <strong>Closing Date:</strong>{" "}
                  {tradeSheetData?.properties?.[0]?.closingDate
                    ? moment.utc(tradeSheetData?.properties?.[0]?.closingDate).format("MMMM DD, YYYY")
                    : ""}
                </p>
                <p>
                  <strong>{representatioOptions[1]?.label}:</strong>{" "}
                  {(() => {
                    const primaryNames = (tradeSheetData?.sellerInformations || [])
                      .map((p) => `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim())
                      .filter(Boolean);
                    const all = [...primaryNames];
                    return all.length > 0 ? all.join(", ") : "N/A";
                  })()}
                </p>
                <p>
                  <strong>{representatioOptions[0]?.label}:</strong>{" "}
                  {(() => {
                    const primaryNames = (tradeSheetData?.buyerInformations || [])
                      .map((p) => `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim())
                      .filter(Boolean);
                    const all = [...primaryNames];
                    return all.length > 0 ? all.join(", ") : "N/A";
                  })()}
                </p>
              </div>

              <div className="mt-4">
                <table className="w-full">
                  <colgroup>
                    <col style={{ width: "100%" }} />
                    <col style={{ width: "2rem" }} />
                    <col style={{ width: "8rem" }} />
                  </colgroup>
                  <tbody>
                    {!hasCommercial && (
                      <>
                        <tr>
                          <td>Sale Price</td>
                          <td className="text-right pr-2">$</td>
                          <td className="text-right">{formatNumberWithCommasAndDecimals(soldPrice(tradeSheetData))}</td>
                        </tr>
                        <tr>
                          <td>Selling Commission: {getCommissionDisplayValue()}</td>
                          <td className="text-right pr-2">$</td>
                          <td className="text-right">{formatNumberWithCommasAndDecimals(sellingCommissionCalculation())}</td>
                        </tr>
                      </>
                    )}
                    {hasCommercial && (
                      <>
                        {commercialCommissionData.map((item: any, index: number) => (
                          <tr key={index}>
                            <td>
                              Year {item.year || index + 1} - Yearly Rent: {formatCurrency(item.yearlyRent || 0)} - Commission ({commercialCommissionType === 'percentage' ? formatPercentage(item.commission || 0) : formatCurrency(item.commission || 0)})
                            </td>
                            <td className="text-right pr-2">$</td>
                            <td className="text-right">
                              {commercialCommissionType === 'percentage'
                                ? formatNumberWithCommasAndDecimals((parseFloat(String(item.commission || 0)) / 100) * parseFloat(String(item.yearlyRent || 0)))
                                : formatNumberWithCommasAndDecimals(item.commission || 0)}
                            </td>
                          </tr>
                        ))}
                        <tr className="font-semibold">
                          <td>Total Yearly Rent</td>
                          <td className="text-right pr-2">$</td>
                          <td className="text-right">{formatNumberWithCommasAndDecimals(commercialTotals.totalYearlyRent)}</td>
                        </tr>
                        <tr className="font-semibold">
                          <td>Total Commercial Commission</td>
                          <td className="text-right pr-2">$</td>
                          <td className="text-right">
                            {commercialCommissionType === 'percentage'
                              ? formatNumberWithCommasAndDecimals(
                                commercialCommissionData.reduce((sum, item) => {
                                  const rent = parseFloat(String(item.yearlyRent || 0)) || 0;
                                  const commission = parseFloat(String(item.commission || 0)) || 0;
                                  return sum + ((commission / 100) * rent);
                                }, 0)
                              )
                              : formatNumberWithCommasAndDecimals(commercialTotals.totalCommission)}
                          </td>
                        </tr>
                      </>
                    )}
                    <tr>
                      <td>Goods & Services Tax # 771957610</td>
                      <td className="text-right pr-2">$</td>
                      <td className="text-right">{formatNumberWithCommasAndDecimals(gstCalculation())}</td>
                    </tr>
                    <tr>
                      <td colSpan={3}><hr className="border-gray-500 my-1" /></td>
                    </tr>
                    <tr className="font-bold text-[14px]">
                      <td>Balance due to ANS RealStateCRM Inc.:</td>
                      <td className="text-right pr-2">$</td>
                      <td className="text-right">{formatNumberWithCommasAndDecimals(totalSellingCommissionCalculation())}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <p>
                  Please make cheque payable to{" "}
                  <strong>ANS RealStateCRM Inc.</strong>
                </p>
                <p>
                  Our trade reference number is{" "}
                  <strong>{tradeSheetData?.tradeSheetTypeId || "N/A"}.</strong>
                </p>
              </div>

              <div className="mt-2">
                <h3 className="font-bold underline">
                  Electronic Fund Transfer (EFT) Details:
                </h3>
                <p>TD CANADA TRUST</p>
                <p>Transit # 17902, Branch # 004, Account # 5278840</p>
              </div>

              {selectedRepresentation === "seller" && (
                <div className="mt-2">
                  <h3 className="font-bold underline">Buyer's Solicitor:</h3>
                  <p>
                    {[tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer?.name, tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer?.lawyerFirmName].filter(Boolean).join(", ")}
                  </p>
                  <p>
                    {[tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer?.address, tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer?.streetAddress].filter(Boolean).join(", ")}
                  </p>
                  <p>
                    {[
                      tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer?.phoneNumber && `Tel: ${tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer?.phoneNumber}`,
                      tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer?.faxNumber && `Fax: ${tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer?.faxNumber}`,
                      tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer?.email && `Email: ${tradeSheetData?.lawyerDetails?.[0]?.buyerLawyer?.email}`,
                    ].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
              {selectedRepresentation === "buyer" && (
                <div className="mt-2">
                  <h3 className="font-bold underline">Seller's Solicitor:</h3>
                  <p>
                    {[tradeSheetData?.lawyerDetails?.[0]?.sellerLawyer?.name, tradeSheetData?.lawyerDetails?.[0]?.sellerLawyer?.lawyerFirmName].filter(Boolean).join(", ")}
                  </p>
                  <p>
                    {[tradeSheetData?.lawyerDetails?.[0]?.sellerLawyer?.address, tradeSheetData?.lawyerDetails?.[0]?.sellerLawyer?.streetAddress].filter(Boolean).join(", ")}
                  </p>
                  <p>
                    {[
                      tradeSheetData?.lawyerDetails?.[0]?.sellerLawyer?.phoneNumber && `Tel: ${tradeSheetData?.lawyerDetails?.[0]?.sellerLawyer?.phoneNumber}`,
                      tradeSheetData?.lawyerDetails?.[0]?.sellerLawyer?.faxNumber && `Fax: ${tradeSheetData?.lawyerDetails?.[0]?.sellerLawyer?.faxNumber}`,
                      tradeSheetData?.lawyerDetails?.[0]?.sellerLawyer?.email && `Email: ${tradeSheetData?.lawyerDetails?.[0]?.sellerLawyer?.email}`,
                    ].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}


              <div className="mt-6 text-gray-700">
                <p>Thank you and feel free to reach out to us any time if you have any questions.</p>
                <p className="mt-4">Sincerely,</p>
                {user?.signature ? (
                  <img
                    src={getFileUrl(user.signature)}
                    alt="Signature"
                    style={{ maxHeight: 80 }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <p className="italic text-sm text-gray-600">[No signature on file]</p>
                )}
                <p className="font-bold mt-2">{user.name}</p>
                <p>ANS RealStateCRM Inc.</p>
                <p>Tel: 416-951-9929, Ext. 1002</p>
                <div className="flex items-center gap-4 mt-1">
                  <p className="whitespace-nowrap">www.dreamvalleyrealty.ca</p>
                  <div className="bg-[#0f766e] h-[20px] flex-1"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-5">
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
                {errors.recipients && (
                  <span className="text-red-500">
                    {errors.recipients.message}
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

                {errors.subject && (
                  <span className="text-red-500">{errors.subject.message}</span>
                )}
              </div>

              <div className="mb-4">
                <label className="font-bold">Email Body:</label>
                <ReactQuill
                  value={emailBody || ""}
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
              <div>
                <button
                  className="bg-[#0f766e] text-white p-2 rounded-md flex gap-2 items-center"
                  onClick={onSubmitEmail}
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
        <div className="mt-2">
          <h3 className="text-lg font-bold">Upload Invoice</h3>
          <p className="text-sm text-gray-600">
            Upload a copy of the invoice for reference.
          </p>
          <input
            type="file"
            className="mt-4 block w-full border border-gray-300 p-2 rounded"
          />
        </div>
      )}
    </div>
  );
};

export default SellerCommissionInvoice;
