// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React from "react";
import { AiOutlineDoubleRight } from "react-icons/ai";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
interface TradeSheetStepsProps {
  active: any; // Current active step
  uuid: any; // UUID as a string
}

const TradeSheetSteps: React.FC<TradeSheetStepsProps> = ({ active, uuid }) => {
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

  // Define your steps
  const steps = [
    {
      label: "Agent's Basic Info",
      path: `/dashboard/agent/pages/form/trade-sheet/agent-basic-info/${uuid}`,
    },
    // Conditionally add "Property Details" step based on tradeSheetRepresentationData
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
      ? [] // If representation is tenant or landlord, do not include the lawyer's details
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

  // Seller / landlord trades: the property address is locked to the selected listing, so show the listing's
  // address (the saved Property Details copy can be older, e.g. after the listing was changed or edited).
  const listingAddress =
    tradeSheetData?.representationType === "single" &&
    (tradeSheetData?.representation === "seller" || tradeSheetData?.representation === "landlord")
      ? tradeSheetData?.propertyListing?.propertyAddress
      : null;
  const headerAddress = listingAddress || tradeSheetData?.properties?.[0]?.propertyAddress;

  return (
    <div>
        <h3 className="text-center bg-[#c9c1c13d] py-5">
          {tradeSheetData && `${tradeSheetData?.tradeSheetTypeId}`}
          {headerAddress && ` - ${headerAddress}`}
        </h3>

        <div className="flex items-center justify-center pt-10 px-5 w-full">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <Link
                to={step.path}
                className="router-link-active-stepper-steps relative "
              >
                <span className="hidden xl:block text-xs absolute top-[-20px] left-[-25px] text-nowrap">
                  {step?.label}
                </span>
                <div className="flex items-center rounded-2xl  xl:border xl:border-r-0">
                  <div className="flex size-8 items-center justify-center rounded-full border-2 border-[#0f766e]">
                    {active === index + 1 ? (
                      <div className="flex size-6 flex-shrink-0 bg-[#0f766e]  items-center justify-center rounded-full font-medium text-white">
                        <AiOutlineDoubleRight
                          name="fe:check"
                          className="text-lg text-[#fff] "
                        />
                      </div>
                    ) : active > index + 1 ? (
                      <div className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-[#0f766e] font-medium text-white">
                        <AiOutlineDoubleRight
                          name="fe:check"
                          className="text-lg "
                        />
                      </div>
                    ) : (
                      <div className="flex size-5 flex-shrink-0 items-center justify-center rounded-full  font-medium text-white "></div>
                    )}
                  </div>
                </div>
              </Link>

              {index < steps.length - 1 && (
                <hr
                  className={`${
                    active >= index + 2 ? "border-[#0f766e] " : "border-[#ffffff] "
                  }  border-2 w-full `}
                />
              )}
            </React.Fragment>
          ))}
        </div>
    </div>
  );
};

export default TradeSheetSteps;
