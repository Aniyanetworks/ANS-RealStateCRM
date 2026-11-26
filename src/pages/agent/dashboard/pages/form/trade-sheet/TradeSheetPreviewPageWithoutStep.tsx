import { useEffect, useState } from "react";
import { useParams} from "react-router-dom";
import { useGetSpacificTradeSheetListDataQuery } from "../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice";
import TableLoader from "../../../../../../components/loader/TableLoader";
import moment from "moment";
import capitalizeFirstLetter from '../../../../../../utils/capitalizeFirstLetter';
import { formatNumberWithCommasAndDecimals } from '../../../../../../utils/formatNumberWithCommasAndDecimals';
import { FaHistory, FaPlus, FaRegClock } from "react-icons/fa";
import { FaMinus } from "react-icons/fa6";
import { useAppSelector } from "../../../../../../redux/hooks";

const DataDisplay = ({ label, value }: { label: string; value: any }) => (
  <div className="flex justify-between border-b border-gray-300 py-2">
    <span className="text-sm">{label}:</span>
    <span className="text-sm">{value || "N/A"}</span>
  </div>
);

const TradeSheetPreviewPageWithoutStep = () => {
  const { user } = useAppSelector((state: any) => state.user);
  const { uuid } = useParams<{ uuid?: string }>(); // uuid is optional
  const { data, isLoading } = useGetSpacificTradeSheetListDataQuery(uuid);
  // State to track whether the section is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(false);
  // Toggle the expanded/collapsed state
  const toggleExpand = () => setIsExpanded(!isExpanded);

  const agentBasicInfoData = data?.data?.tradeSheetData || {};
  const propertieDetailsData = data?.data?.tradeSheetData?.properties[0] || {};
  const sellerInformationsData =
    data?.data?.tradeSheetData?.sellerInformations || [];
  const buyerInformationsData =
    data?.data?.tradeSheetData?.buyerInformations || [];
  const agentDetailsData = data?.data?.tradeSheetData?.agentDetails[0] || {};
  const lawyerDetailsData = data?.data?.tradeSheetData?.lawyerDetails[0] || {};

  useEffect(() => {}, [data]);

  return (
    <div>
      <h2 className="uppercase text-center bg-[#c9c1c13d] py-5">
        {data?.data?.tradeSheetData?.tradeSheetTypeId || "N/A"}-{data?.data?.propertieDetailsData?.propertyAddress || data?.data?.properties?.[0]?.propertyAddress|| "N/A"}
      </h2>

      {isLoading ? (
        <TableLoader />
      ) : (
        <div className="max-w-full mt-8 p-8 border border-gray-300/30 rounded-md">
          <div className="space-y-4">
            {/* Agent's Basic Info */}
            <div className="flex space-x-4">
              <div className="bg-[#c9c1c13d] p-6 rounded-lg shadow-md flex-1">
                <h3 className="py-2 font-semibold">Agent's Basic Info</h3>
                <DataDisplay
                  label="First Name"
                  value={agentBasicInfoData?.firstName}
                />
                <DataDisplay
                  label="Last Name"
                  value={agentBasicInfoData?.lastName}
                />
                <DataDisplay
                  label="Representation"
                  value={capitalizeFirstLetter(
                    agentBasicInfoData?.representation
                  )}
                />
              </div>

              {/* Property Details */}
              <div className="bg-[#c9c1c13d] p-6 rounded-lg shadow-md flex-1">
                <h3 className="py-2 font-semibold">Property Details</h3>
                <DataDisplay
                  label="MLS Number"
                  value={propertieDetailsData?.mlsNumber}
                />
                <DataDisplay
                  label="Property Address"
                  value={propertieDetailsData?.propertyAddress}
                />
                <DataDisplay
                  label="Sold Price"
                  value={(() => {
                    const price = propertieDetailsData?.soldPrice || propertieDetailsData?.salesPrice || propertieDetailsData?.listingPrice;
                    if (!price) return "N/A";
                    const formattedPrice = formatNumberWithCommasAndDecimals(price);
                    // Use listing price unit/type for sales price (sales price shares listing type/unit)
                    const unitLabel = propertieDetailsData?.listingPriceUnit === "perSquareFoot" ? "Per Square Foot" 
                      : propertieDetailsData?.listingPriceUnit === "monthlyRent" ? "Monthly Rent"
                      : propertieDetailsData?.salesPriceUnit === "perSquareFoot" ? "Per Square Foot"
                      : propertieDetailsData?.salesPriceUnit === "monthlyRent" ? "Monthly Rent" : "";
                    const typeLabel = propertieDetailsData?.listingPriceType === "net" ? "Net Price"
                      : propertieDetailsData?.listingPriceType === "gross" ? "Gross Price"
                      : propertieDetailsData?.salesPriceType === "net" ? "Net Price"
                      : propertieDetailsData?.salesPriceType === "gross" ? "Gross Price" : "";
                    if (unitLabel && typeLabel) {
                      return `$${formattedPrice} ${unitLabel} (${typeLabel})`;
                    } else if (unitLabel) {
                      return `$${formattedPrice} ${unitLabel}`;
                    } else if (typeLabel) {
                      return `$${formattedPrice} (${typeLabel})`;
                    }
                    return `$${formattedPrice}`;
                  })()}
                />
                <DataDisplay
                  label="Closing Date"
                  value={moment(propertieDetailsData.closingDate).format(
                    "MMMM D, yyyy"
                  )}
                />
                <DataDisplay
                  label="Conditional"
                  value={capitalizeFirstLetter(
                    propertieDetailsData?.conditional
                  )}
                />
                <DataDisplay
                  label="Firm Date"
                  value={moment(propertieDetailsData.firmDate).format(
                    "MMMM D, yyyy"
                  )}
                />
                <DataDisplay
                  label="Continue Showings"
                  value={capitalizeFirstLetter(
                    propertieDetailsData?.continueShowings
                  )}
                />
                <DataDisplay
                  label="Deposit Amount"
                  value={"$ " + propertieDetailsData?.depositAmount}
                />
                <DataDisplay
                  label="Deposit Date"
                  value={moment(propertieDetailsData.depositDate).format(
                    "MMMM D, yyyy"
                  )}
                />
                <DataDisplay
                  label="Update MLS Status"
                  value={propertieDetailsData?.updateMLSStatus}
                />
              </div>
            </div>

            <div className="flex space-x-4">
              {/* Seller Informations */}
              <div className="bg-[#c9c1c13d] p-6 rounded-lg shadow-md flex-1">
                <h3 className="py-2 font-semibold">Seller Informations</h3>
                {sellerInformationsData.map((seller: any, index: any) => (
                  <div key={seller.id} className="py-2">
                    <h4 className="font-semibold">Seller {index + 1}</h4>
                    <DataDisplay label="First Name" value={seller?.firstName} />
                    <DataDisplay label="Last Name" value={seller?.lastName} />
                  </div>
                ))}
              </div>

              {/* Buyer Informations */}
              <div className="bg-[#c9c1c13d] p-6 rounded-lg shadow-md flex-1">
                <h3 className="py-2 font-semibold">Buyer Informations</h3>
                {buyerInformationsData.map((buyer: any, index: any) => (
                  <div key={buyer.id} className="py-2">
                    <h4 className="font-semibold">Buyer {index + 1}</h4>
                    <DataDisplay label="First Name" value={buyer?.firstName} />
                    <DataDisplay label="Last Name" value={buyer?.lastName} />
                  </div>
                ))}
              </div>
            </div>

            {/* Agent's and Lawyer's Details */}
            <div className="bg-[#c9c1c13d] p-6 rounded-lg shadow-md">
              <h3 className="py-2 font-semibold">
                Agent's and Lawyer's Details
              </h3>
              <div className="flex space-x-6">
                <div className="flex-1">
                  <h6 className="font-semibold">Seller's Agent</h6>
                  <DataDisplay
                    label="First Name"
                    value={agentDetailsData?.sellerFirstName}
                  />
                  <DataDisplay
                    label="Last Name"
                    value={agentDetailsData?.sellerLastName}
                  />
                  <DataDisplay
                    label="Brokerage's Name"
                    value={agentDetailsData.sellerBrokerage?.brokerageName}
                  />
                  <DataDisplay
                    label="Brokerage's Address"
                    value={agentDetailsData?.sellerBrokerage?.address}
                  />
                  <DataDisplay
                    label="Street Address"
                    value={agentDetailsData?.sellerBrokerage?.streetAddress}
                  />
                  <DataDisplay
                    label="Country"
                    value={
                      agentDetailsData?.sellerBrokerage?.country?.countryName
                    }
                  />
                  <DataDisplay
                    label="City"
                    value={agentDetailsData?.sellerBrokerage?.city?.name}
                  />
                  <DataDisplay
                    label="State / Province"
                    value={agentDetailsData?.sellerBrokerage?.state?.name}
                  />
                  <DataDisplay
                    label="Postal / Zip Code"
                    value={agentDetailsData?.sellerBrokerage?.postalZipCode}
                  />
                  <DataDisplay
                    label="Phone Number"
                    value={agentDetailsData?.sellerBrokerage?.phoneNumber}
                  />
                  <DataDisplay
                    label="Email"
                    value={agentDetailsData?.sellerBrokerage?.email}
                  />
                </div>
                {data?.data?.tradeSheetData.representation !== "buyer" && (
                  <div className="flex-1">
                    {/* Repeat for Buyer's Agent and Lawyer's details */}
                    <h6 className="font-semibold">Buyer's Agent</h6>
                    <DataDisplay
                      label="First Name"
                      value={agentDetailsData?.buyerFirstName}
                    />
                    <DataDisplay
                      label="Last Name"
                      value={agentDetailsData?.buyerLastName}
                    />
                    <DataDisplay
                      label="Brokerage's Name"
                      value={agentDetailsData?.buyerBrokerage?.brokerageName}
                    />
                    <DataDisplay
                      label="Brokerage's Address"
                      value={agentDetailsData?.buyerBrokerage?.address}
                    />
                    <DataDisplay
                      label="Street Address"
                      value={agentDetailsData?.buyerBrokerage?.streetAddress}
                    />
                    <DataDisplay
                      label="Country"
                      value={
                        agentDetailsData?.buyerBrokerage?.country?.countryName
                      }
                    />
                    <DataDisplay
                      label="City"
                      value={agentDetailsData?.buyerBrokerage?.city?.name}
                    />
                    <DataDisplay
                      label="State / Province"
                      value={agentDetailsData?.buyerBrokerage?.state?.name}
                    />
                    <DataDisplay
                      label="Postal / Zip Code"
                      value={agentDetailsData?.buyerBrokerage?.postalZipCode}
                    />
                    <DataDisplay
                      label="Phone Number"
                      value={agentDetailsData?.buyerBrokerage?.phoneNumber}
                    />
                    <DataDisplay
                      label="Email"
                      value={agentDetailsData?.buyerBrokerage?.email}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Lawyer's Details */}
            <div className="bg-[#c9c1c13d] p-6 rounded-lg shadow-md">
              <h3 className="py-2 font-semibold">Lawyer's Details</h3>
              <div className="flex space-x-6">
                <div className="flex-1">
                  <h6 className="font-semibold">Seller's Lawyer</h6>
                  <DataDisplay
                    label="First Name"
                    value={lawyerDetailsData?.sellerLawyer?.firstName}
                  />
                  <DataDisplay
                    label="Last Name"
                    value={lawyerDetailsData?.sellerLawyer?.lastName}
                  />
                  <DataDisplay
                    label="Law Firm's Name"
                    value={lawyerDetailsData?.sellerLawyer?.lawyerFirmName}
                  />
                  <DataDisplay
                    label="Address"
                    value={lawyerDetailsData?.sellerLawyer?.address}
                  />
                  <DataDisplay
                    label="Country"
                    value={
                      lawyerDetailsData?.sellerLawyer?.country?.countryName
                    }
                  />
                  <DataDisplay
                    label="City"
                    value={lawyerDetailsData?.sellerLawyer?.city?.name}
                  />
                  <DataDisplay
                    label="State / Province"
                    value={lawyerDetailsData?.sellerLawyer?.state?.name}
                  />
                  <DataDisplay
                    label="Postal / Zip Code"
                    value={lawyerDetailsData?.sellerLawyer?.postalZipCode}
                  />
                  <DataDisplay
                    label="Phone Number"
                    value={lawyerDetailsData?.sellerLawyer?.phoneNumber}
                  />
                  <DataDisplay
                    label="Fax Number"
                    value={lawyerDetailsData?.sellerLawyer?.firm?.faxNumber}
                  />
                  <DataDisplay
                    label="Email"
                    value={lawyerDetailsData?.sellerLawyer?.email}
                  />
                </div>
                {data?.data?.tradeSheetData?.representation !== "buyer" && (
                  <div className="flex-1">
                    {/* Repeat for Buyer's Lawyer */}
                    <h6 className="font-semibold">Buyer's Lawyer</h6>
                    <DataDisplay
                      label="First Name"
                      value={lawyerDetailsData?.buyerLawyer?.firstName}
                    />
                    <DataDisplay
                      label="Last Name"
                      value={lawyerDetailsData?.buyerLawyer?.lastName}
                    />
                    <DataDisplay
                      label="Law Firm's Name"
                      value={lawyerDetailsData?.buyerLawyer?.lawyerFirmName}
                    />
                    <DataDisplay
                      label="Address"
                      value={lawyerDetailsData?.buyerLawyer?.address}
                    />
                    <DataDisplay
                      label="Country"
                      value={
                        lawyerDetailsData?.buyerLawyer?.country?.countryName
                      }
                    />
                    <DataDisplay
                      label="City"
                      value={lawyerDetailsData?.buyerLawyer?.city?.name}
                    />
                    <DataDisplay
                      label="State / Province"
                      value={lawyerDetailsData?.buyerLawyer?.state?.name}
                    />
                    <DataDisplay
                      label="Postal / Zip Code"
                      value={lawyerDetailsData?.buyerLawyer?.postalZipCode}
                    />
                    <DataDisplay
                      label="Phone Number"
                      value={lawyerDetailsData?.buyerLawyer?.phoneNumber}
                    />
                    <DataDisplay
                      label="Fax Number"
                      value={lawyerDetailsData?.buyerLawyer?.firm?.faxNumber}
                    />
                    <DataDisplay
                      label="Email"
                      value={lawyerDetailsData?.buyerLawyer?.email}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h6 className="text-base font-bold text-gray-800 border-b-4 border-gray-500 pb-2 mb-4 tracking-wide">
                Uploaded Paperwork Attachment:
              </h6>
              {/* Loop through each file in the attachment list */}
              {data?.data?.tradeSheetData?.paperWorkAttachmentFiles?.map(
                (file: any, index: any) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-[#c9c1c13d] p-4 rounded-lg shadow-md hover:shadow-xl transition duration-300 ease-in-out"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Serial Number */}
                      <span className="text-sm">{index + 1}.</span>

                      {/* File name with tooltip */}
                      <span className="text-sm">
                        {file?.uploadFileName?.name}
                      </span>
                    </div>

                    {/* Upload Status */}
                    <span className="text-white px-3 py-1 rounded-full bg-green-500 text-sm">
                      Uploaded
                    </span>
                  </div>
                )
              )}
              <h6 className="text-base font-bold text-gray-800 border-b-4 border-gray-500 pb-2 mb-4 tracking-wide">
                Others Paperwork Attachment:
              </h6>
              {data?.data?.tradeSheetData?.paperWorkOtherAttachments.map(
                (file: any, index: any) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-[#c9c1c13d] p-4 rounded-lg shadow-md hover:shadow-xl transition duration-300 ease-in-out"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Serial Number */}
                      <span className="text-sm">{index + 1}.</span>

                      {/* File name with tooltip */}
                      <span className="text-sm">
                        {file?.filePath
                          ?.split(/[/\\]/) // Split by both forward slashes (/) and backslashes (\)
                          .pop()}{" "}
                      </span>
                    </div>

                    {/* Upload Status */}
                    <span className="text-white px-3 py-1 rounded-full bg-green-500 text-sm">
                      Uploaded
                    </span>
                  </div>
                )
              )}
            </div>
            {user?.userType == "superAdmin" && (
              <div className="space-y-4">
                <h5 className="text-base font-bold text-gray-800 border-b-4 border-gray-500 pb-2 mb-4 tracking-wide flex justify-between items-center">
                  <span>Activity Log:</span>
                  {/* Button to toggle expand/collapse with icons */}
                  <button
                    className="text-blue-500 hover:text-blue-700 flex items-center"
                    onClick={toggleExpand}
                  >
                    {isExpanded ? (
                      <FaMinus className="mr-2 inline text-red-600 text-xl font-semibold" />
                    ) : (
                      <FaPlus className="mr-2 inline text-[#082624] text-xl font-semibold blinking" />
                    )}
                  </button>
                </h5>

                {/* Conditionally render activity logs based on expansion state */}
                {isExpanded && (
                  <div className="max-h-[400px] overflow-y-auto space-y-3">
                    {data?.data?.tradeSheetData?.activityLog?.map(
                      (log: any, index: any) => {
                        return (
                          <div
                            key={log.id}
                            className={`flex items-center justify-between p-3 rounded-lg shadow-md transition duration-300 ease-in-out ${
                              index % 2 === 0 ? "bg-[#f9f9f9]" : "bg-[#e2e2e2]"
                            } hover:shadow-xl`}
                          >
                            <div className="flex flex-col w-[70%] mr-5">
                              <div className="text-sm">
                                <span className="font-semibold text-sm">
                                  <FaHistory className="inline" /> Details:
                                </span>{" "}
                                {log.historyText}
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">
                                <FaRegClock className="inline mr-2" />{" "}
                                {moment(log.createdAt).format(
                                  "D MMMM YYYY [at] h:mm A"
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeSheetPreviewPageWithoutStep;
