// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React from "react";
import {
  AuditOutlined,
  CheckOutlined,
  EyeOutlined,
  HomeOutlined,
  IdcardOutlined,
  PaperClipOutlined,
  ShoppingOutlined,
  TagOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
interface TradeSheetStepsProps {
  active: any;
  uuid: any;
}

const stepIcon = (path: string) => {
  if (path.includes("agent-basic-info")) return <UserOutlined />;
  if (path.includes("property-details")) return <HomeOutlined />;
  if (path.includes("seller-information")) return <TagOutlined />;
  if (path.includes("buyer-information")) return <ShoppingOutlined />;
  if (path.includes("agent-details")) return <IdcardOutlined />;
  if (path.includes("lawyer-details")) return <AuditOutlined />;
  if (path.includes("attachment")) return <PaperClipOutlined />;
  return <EyeOutlined />;
};

const TradeSheetSteps: React.FC<TradeSheetStepsProps> = ({ active: activeProp, uuid }) => {
  const { tradeSheetData } = useSelector((state: any) => state.user);

  
  let sellerLabel = "Seller's Information";
  let buyerLabel = "Buyer's Information";

  if (tradeSheetData?.representation === "landlord" || tradeSheetData?.representation === "tenant") {
     sellerLabel = "Landlord's Information";
     buyerLabel = "Tenant Information";
  }else if (tradeSheetData?.representationType != "single") {
    if (tradeSheetData?.multipleRepresentation === "tenant,landlord" || tradeSheetData?.multipleRepresentation === "landlord,tenant") {
      sellerLabel = "Landlord's Information";
      buyerLabel = "Tenant Information";
    } else if (tradeSheetData?.multipleRepresentation === "buyer,seller" || tradeSheetData?.multipleRepresentation === "seller,buyer") {
      sellerLabel = "Seller's Information";
      buyerLabel = "Buyer's Information";
    }
  }

  const steps = [
    {
      label: "Agent's Basic Info",
      path: `/dashboard/agent/pages/form/trade-sheet/agent-basic-info/${uuid}`,
    },
    ...((tradeSheetData?.representation === "buyer" || tradeSheetData?.representation === "tenant") && tradeSheetData?.representationType=='single'
      ? [
          {
            label: "Property Details",
            path: `/dashboard/agent/pages/form/trade-sheet/property-details/${uuid}`,
          },
        ]
      : []),
    ...((tradeSheetData?.representation === "seller" || tradeSheetData?.representation === "landlord") && tradeSheetData?.representationType=='single'
      ? [
          {
            label: "Property Details",
            path: `/dashboard/agent/pages/form/trade-sheet/property-details-seller/${uuid}`,
          },
        ]
      : []),
      ...(tradeSheetData?.representationType!='single'
        ? [
            {
              label: "Property Details",
              path: `/dashboard/agent/pages/form/trade-sheet/property-details-multiple-representation/${uuid}`,
            },
          ]
        : []),
    {
      label: sellerLabel,
      path: `/dashboard/agent/pages/form/trade-sheet/seller-information/${uuid}`,
    },
    {
      label: buyerLabel,
      path: `/dashboard/agent/pages/form/trade-sheet/buyer-information/${uuid}`,
    },
    {
      label: "Agent's Details",
      path: `/dashboard/agent/pages/form/trade-sheet/agent-details/${uuid}`,
    },
    ...(tradeSheetData?.representation === "tenant" ||
    tradeSheetData?.representation === "landlord" || (tradeSheetData?.representationType != "single" && (tradeSheetData?.multipleRepresentation === "tenant,landlord" || tradeSheetData?.multipleRepresentation === "landlord,tenant"))
      ? []
      : [
          {
            label: "Lawyer's Details",
            path: `/dashboard/agent/pages/form/trade-sheet/lawyer-details/${uuid}`,
          },
        ]),
    
     ...(tradeSheetData?.representationType != "single"
      ? [] 
      : [
          {
            label: "Attachment",
            path: `/dashboard/agent/pages/form/trade-sheet/paperwork-attachment-upload/${uuid}`,
          },
        ]),

    ...( tradeSheetData?.representationType == "single"
      ? [] 
      : [
          {
            label: "Attachment",
            path: `/dashboard/agent/pages/form/trade-sheet/paperwork-attachment-upload-multiple-representation/${uuid}`,
          },
        ]),
    {
      label: "Preview Page",
      path: `/dashboard/agent/pages/form/trade-sheet/preview-page/${uuid}`,
    },
  ];

  const listingAddress =
    tradeSheetData?.representationType === "single" &&
    (tradeSheetData?.representation === "seller" || tradeSheetData?.representation === "landlord")
      ? tradeSheetData?.propertyListing?.propertyAddress
      : null;
  const headerAddress = listingAddress || tradeSheetData?.properties?.[0]?.propertyAddress;

  const title = tradeSheetData?.tradeSheetTypeId ? `${tradeSheetData.tradeSheetTypeId}${headerAddress ? " - " + headerAddress : ""}` : "New trade sheet";

  const active = Math.min(Number(activeProp) || 1, steps.length);
  const percent = Math.round(((active - 1) / Math.max(steps.length - 1, 1)) * 100);

  return (
    <div className="wizard-steps rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#0f766e]">Trade sheet</div>
          <h3 className="text-[16px] font-bold text-gray-800">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[12px] font-medium text-gray-500">
            Step <b className="text-gray-800">{active}</b> of {steps.length}
          </div>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-100">
            <div className="step-progress h-full rounded-full" style={{ width: `${Math.max(percent, 6)}%` }} />
          </div>
          <div className="w-9 text-right text-[12px] font-semibold text-[#0f766e]">{percent}%</div>
        </div>
      </div>

      <div className="mt-4 grid auto-cols-fr grid-flow-col gap-2.5 overflow-x-auto px-0.5 pb-2 pt-1">
        {steps.map((step, index) => {
          const done = active > index + 1;
          const current = active === index + 1;
          return (
            <Link
              key={index}
              to={step.path}
              title={`Step ${index + 1}: ${step?.label}`}
              style={{ animationDelay: `${index * 70}ms` }}
              className={`router-link-active-stepper-steps step-tab ${current ? "step-current" : done ? "step-done" : "step-todo"} flex min-w-[140px] items-center gap-3 rounded-xl border px-3 py-2.5 ${
                current
                  ? "border-[#0f766e] bg-teal-50"
                  : done
                  ? "border-teal-100 bg-white"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div
                className={`step-badge flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px] ${
                  current
                    ? "bg-gradient-to-br from-[#0f766e] to-[#14b8a6] text-white"
                    : done
                    ? "bg-[#0f766e] text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? <CheckOutlined className="step-check" /> : <div className="step-icon">{stepIcon(step.path)}</div>}
              </div>
              <div className="min-w-0">
                <div className={`text-[10px] font-semibold uppercase tracking-wide ${current ? "text-[#0f766e]" : "text-gray-400"}`}>
                  Step {index + 1}
                </div>
                <div className={`text-[12.5px] font-semibold leading-tight ${current ? "text-[#0f766e]" : done ? "text-gray-800" : "text-gray-500"}`}>
                  {step?.label}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default TradeSheetSteps;
