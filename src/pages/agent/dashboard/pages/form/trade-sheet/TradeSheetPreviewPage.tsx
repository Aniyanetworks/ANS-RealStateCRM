// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useState } from "react";
import TradeSheetSteps from "../../../../../../components/Stepper/TradeSheetSteps";
import { useParams, useNavigate } from "react-router-dom";
import {
  useChangeTradeAdminStatusMutation,
  useChangeTradeSheetStatusMutation,
  useGetSpacificTradeSheetListDataQuery,
} from "../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice";
import TableLoader from "../../../../../../components/loader/TableLoader";
import moment from "moment";
import capitalizeFirstLetter from "../../../../../../utils/capitalizeFirstLetter";
import toast from "react-hot-toast";
import { FaHistory, FaPlus, FaRegClock } from "react-icons/fa";
import { FaMinus } from "react-icons/fa6";
import { useAppSelector } from "../../../../../../redux/hooks";
import Propertydetails from "../../../../../../components/dashboard/tradeSheet/preview/Propertydetails";
import SellerAndBuyerInfo from "../../../../../../components/dashboard/tradeSheet/preview/SellerAndBuyerInfo";
import AgentDetails from "../../../../../../components/dashboard/tradeSheet/preview/AgentDetails";
import LayerDetails from "../../../../../../components/dashboard/tradeSheet/preview/LayerDetails";
import SubmittedDocuments from "../../../../../../components/dashboard/tradeSheet/preview/SubmittedDocuments";
import AgentBasicInfo from "../../../../../../components/dashboard/tradeSheet/preview/AgentBasicInfo";
import PropertydetailsSeller from "../../../../../../components/dashboard/tradeSheet/preview/PropertydetailsSeller";

const DataDisplay = ({ label, value }: { label: string; value: any }) => (
  <div className="flex justify-between border-b border-gray-300 py-2">
    <span className="text-sm">{label}:</span>
    <span className="text-sm">{value || "N/A"}</span>
  </div>
);

const TradeSheetPreviewPage = () => {
  const { user } = useAppSelector((state: any) => state.user);
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid?: string }>(); // uuid is optional
  const { data, isLoading } = useGetSpacificTradeSheetListDataQuery(uuid);
  // State to track whether the section is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(false);
  // Toggle the expanded/collapsed state
  const toggleExpand = () => setIsExpanded(!isExpanded);

  const agentBasicInfoData = data?.data?.tradeSheetData || {};
  const propertieDetailsData = data?.data?.tradeSheetData?.properties[0] || {};
  const conditionsData = data?.data?.tradeSheetData?.conditions || [];
  const sellerInformationsData =
    data?.data?.tradeSheetData?.sellerInformations || [];
  const buyerInformationsData =
    data?.data?.tradeSheetData?.buyerInformations || [];
  const agentDetailsData = data?.data?.tradeSheetData?.agentDetails[0] || {};
  const lawyerDetailsData = data?.data?.tradeSheetData?.lawyerDetails[0] || {};

  useEffect(() => {}, [data]);

  const [changeTradeAdminStatus] = useChangeTradeAdminStatusMutation();
  const handleClickStatus = async (newStatus: string) => {
    if (newStatus === "cancel") {
      newStatus = data?.data?.tradeSheetData?.status;
      toast.error(`Tradesheet saving has been canceled.`);
      return navigate(
        "/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list"
      );
    }

    if (newStatus === "back") {
      return navigate(
        `/dashboard/agent/pages/form/trade-sheet/paperwork-attachment-upload/${uuid}`
      );
    }

    if (newStatus === "draft") {
      newStatus = "draft";
      toast.success(`Your tradesheet has been saved as a draft.`);
      try {
        await changeTradeAdminStatus({
          data: { status: newStatus },
          uuid,
        }).unwrap();
      } catch (error: any) {
        toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
      }

      return navigate(
        "/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list"
      );
    }

    if (data?.data?.tradeSheetData?.status === "draft") {
      newStatus = "underReview";
      toast.success(`Your tradesheet is now under review!`);
      navigate(
        "/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list"
      );
    } else if (data?.data?.tradeSheetData?.status === "rejected") {
      newStatus = "underReview";
      toast.success(`Your tradesheet is now under review!`);
      navigate(
        "/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list"
      );
    } else {
      newStatus = data?.data?.tradeSheetData?.status;
      toast.success(`Tradesheet updated successfully!`);
      navigate(
        "/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list"
      );
    }

    try {
      await changeTradeAdminStatus({
        data: { status: newStatus },
        uuid,
      }).unwrap();
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  console.log(propertieDetailsData);

  return (
    <div>
      {/* <h2 className="uppercase text-center bg-[#c9c1c13d] py-5">
        {data?.data?.tradeSheetData?.tradeSheetTypeId || "N/A"}-{propertieDetailsData?.propertyAddress|| "N/A"}
      </h2> */}
      <TradeSheetSteps active={9} uuid={uuid} />

      {/* Preview Section */}

      {isLoading ? (
        <TableLoader />
      ) : (
        <div className="max-w-full mt-2 p-2 border border-gray-300/30 rounded-md">
          <div className="max-w-[800px] mx-auto px-10">
            <div>
              <AgentBasicInfo basicInfo={agentBasicInfoData} />
              {(agentBasicInfoData?.representation === "buyer" || agentBasicInfoData?.representation === "tenant") ? (
                <Propertydetails propertyDetails={propertieDetailsData} conditions={conditionsData} />
              ) : (
                <PropertydetailsSeller
                  propertyDetails={propertieDetailsData}
                  conditions={conditionsData}
                  showPriceTypeUnit={agentBasicInfoData?.listType === "Commercial"}
                />
              )}
              <SellerAndBuyerInfo
                sellerInfo={sellerInformationsData}
                buyerInfo={buyerInformationsData}
              />
              <AgentDetails agentDetails={agentDetailsData} />
              {(agentBasicInfoData?.representation === "buyer" || agentBasicInfoData?.representation === "seller" || agentBasicInfoData?.multipleRepresentation === "seller,buyer" || agentBasicInfoData?.multipleRepresentation === "buyer,seller") && (
                <LayerDetails lawyerDetails={lawyerDetailsData} />
              )}
              <SubmittedDocuments
                documents={data?.data?.tradeSheetData?.paperWorkAttachmentFiles}
                otherDocuments={
                  data?.data?.tradeSheetData?.paperWorkOtherAttachments
                }
              />
            </div>

            <div className="mt-10">
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
                      {data?.data?.tradeSheetData?.activityLog
                      ?.slice() // create a shallow copy
                      .sort((a, b) => b.id - a.id) // sort by id descending
                      .map((log, index) => {
                        return (
                        <div
                          key={log.id}
                          className={`flex items-center justify-between p-3 rounded-lg shadow-md transition duration-300 ease-in-out ${
                          index % 2 === 0
                            ? "bg-[#f9f9f9]"
                            : "bg-[#e2e2e2]"
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
                            {moment.utc(log.createdAt).format(
                            "D MMMM YYYY [at] h:mm A"
                            )}
                          </span>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            {user?.userType === "superAdmin" && (
              <div className="mt-10 space-y-4">
                <h5 className="text-base font-bold text-gray-800 border-b-4 border-gray-500 pb-2 mb-4 tracking-wide">
                  Invoice Send Log:
                </h5>

                <div className="max-h-[400px] overflow-y-auto space-y-3">
                  {data?.data?.tradeSheetData?.tradeCommissionInvoiceRecords?.map(
                    (record: any, index: number) => (
                      <div
                        key={record.id}
                        className={`flex items-center justify-between p-3 rounded-lg shadow-md transition duration-300 ease-in-out ${
                          index % 2 === 0 ? "bg-[#f9f9f9]" : "bg-[#e2e2e2]"
                        } hover:shadow-xl`}
                      >
                        <div className="flex flex-col w-[70%] mr-5">
                          <div className="text-sm">
                            <span className="font-semibold">Invoice ID:</span>{" "}
                            {record.invoiceId ?? "N/A"}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Invoice Email Send Status:</span>{" "}
                            {record.status}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">
                              Selling Commission:
                            </span>{" "}
                            ${record.sellingCommission}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Sale Price:</span> $
                            {record.salePrice}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">
                              Total Commission:
                            </span>{" "}
                            ${record.totalCommission} (GST: $
                            {record.gstCommission})
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">
                            <FaRegClock className="inline mr-2" />
                            {moment.utc(record.createdAt).format(
                              "D MMM YYYY [at] h:mm A"
                            )}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
            {/* Action Buttons */}
            <div className="flex justify-between my-5 mx-5">
              <button
                type="button"
                className="primary-btn flex-1 mx-2 my-2"
                onClick={() => handleClickStatus("saveAndFinsh")}
              >
                Save and Finsh
              </button>
              <button
                type="button"
                className="primary-btn flex-1 mx-2 my-2"
                onClick={() => handleClickStatus("back")}
              >
                Back
              </button>
              <button
                type="button"
                className="primary-btn flex-1 mx-2 my-2"
                onClick={() => handleClickStatus("draft")}
              >
                Save as Draft
              </button>
              <button
                type="button"
                className="primary-btn flex-1 mx-2 my-2"
                onClick={() => handleClickStatus("cancel")}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeSheetPreviewPage;
