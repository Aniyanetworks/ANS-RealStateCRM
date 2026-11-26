/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import moment from "moment";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FaHistory, FaMinus, FaPlus, FaRegClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import TableLoader from "../../../../../components/loader/TableLoader";
import PropertyListingNote from '../../../../../components/dashboard/tradeSheet/PropertyListingNote';
import { useGetCitiesQuery, useGetStatesQuery } from "../../../../../redux/api/common/countryStateCitySlice";
import { useCreateUpdateFullPropertyListingDataMutation, useGetSpacificPropertyListingQuery } from "../../../../../redux/api/superadmin/propertyListingDataSlice";
import { useAppSelector } from "../../../../../redux/hooks";
import { getFileUrl } from "../../../../../utils/constant";
import { formatDateYYYYMMDD } from "../../../../../utils/formatDateUtils";
import { Tabs } from 'antd';
import PropertyListingNoteLog from '../../../../../components/dashboard/tradeSheet/PropertyListingNoteLog';
import { formatNumberWithCommasAndDecimals } from './../../../../../utils/formatNumberWithCommasAndDecimals';
import PropertyListingPaperworkFileManager from "./PropertyListingPaperworkFileManager";
const DataDisplay = ({ label, value }: { label: string; value: any }) => (
  <div className="flex justify-between border-b border-gray-300 py-2">
    <span className="text-sm">{label}:</span>
    <span className="text-sm">{value || "N/A"}</span>
  </div>
);
const TextInput = ({
  label,
  register,
  required,
  name,
  errors,
  type = "text",
  placeholder = "",
}: any) => (
  <div className="flex flex-col gap-2">
    <label>
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>

    <input
      {...register(name, { required })}
      type={type}
      placeholder={placeholder}
      className="border border-gray-300 p-2 rounded"
    />
    {errors[name] && (
      <p className="text-red-500 text-sm">{`${label} is required`}</p>
    )}
  </div>
);

const DateInput = ({ label, control, name, errors, required }: any) => (
  <div className="flex flex-col gap-2">
    <label>
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <Controller
      name={name}
      control={control}
      defaultValue=""
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field }) => (
        <input {...field} type="date" className="border rounded p-2 w-full" />
      )}
    />
    {errors[name] && (
      <p className="text-red-500 text-sm">{`${label} is required`}</p>
    )}
  </div>
);

const SelectInput = ({ label, register, name, errors, options = [] }: any) => (
  <div className="flex flex-col gap-2">
    <label>
      {label} {register && <span className="text-red-500 ml-1">*</span>}
    </label>
    <select
      {...register(name, { required: true })}
      className="border rounded p-2 w-full"
    >
      <option value="">Please Select</option>
      {options.map((option: any, index: number) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {errors[name] && (
      <p className="text-red-500 text-sm">{`${label} is required`}</p>
    )}
  </div>
);
const formatDate = (isoDate: any) => {
  if (isoDate) {
    return moment.utc(isoDate).format("YYYY-MM-DD");
  } else {
    return "";
  }
};

const ViewPropertyListing = ({ uuid }) => {
  const { user } = useAppSelector((state: any) => state.user);
  const navigate = useNavigate();
  const [propertiesData, setPropertiesData] = useState([]);
  const [sellersInfo, setSellersInfo] = useState([]);
  const { data, isLoading } = useGetSpacificPropertyListingQuery(uuid);
  const { tradeSheetRepresentationData } = useAppSelector(
    (state: any) => state.user
  );
  const [isInvoiceSendLogExpanded, setIsInvoiceSendLogExpanded] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);
  const toggleInvoiceSendLogExpand = () => {
    setIsInvoiceSendLogExpanded(prev => !prev);
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues
  } = useForm();

  const selectedCountry = 39;
  const selectedState = watch("stateId");
  const selectedCity = watch("cityId");
  const selectedPostalCode = watch("postalCode");
  const selectedAddress = watch("address");
  const selectedPropertyType = watch("propertyType");

  const { data: states = [] } = useGetStatesQuery(selectedCountry, {
    skip: !selectedCountry,
  });

  const { data: cities = [], isLoading: isCityLoading } = useGetCitiesQuery(
    selectedState,
    {
      skip: !selectedState,
    }
  );

  const conditionalValue = watch("conditional");
  const conditionalOptionValue = watch("conditionalOption");

  useEffect(() => {
    const properties = data?.data?.propertyListingData;
    if (properties) {
      setPropertiesData(properties);
      const processedProperty = {
        ...properties,
        contractDate: formatDate(properties?.contractDate),
        expiryDate: formatDate(properties?.expiryDate),
        offerDate: formatDate(properties?.offerDate)
      };
      reset(processedProperty);
    }
    setSellersInfo(JSON.parse(propertiesData?.sellersInfo || "[]"));
  }, [data, reset, propertiesData, setPropertiesData, sellersInfo]);

  useEffect(() => {
    setValue("countryId", 39);
    const stateName =
      states?.data?.states?.find((state) => state.id == selectedState)?.name ||
      "";
    const cityName =
      cities?.data?.cities?.find((city) => city.id == selectedCity)?.name || "";
    const formattedAddress = `${selectedAddress}, ${cityName}, ${stateName}, ${selectedPostalCode}`;
    setValue("propertyAddress", formattedAddress);
  }, [
    selectedState,
    selectedCity,
    selectedPostalCode,
    selectedAddress,
    cities,
    propertiesData,
  ]);

  const [createUpdateFullPropertyListingData] = useCreateUpdateFullPropertyListingDataMutation();

  if (isCityLoading || isLoading) {
    return <TableLoader />;
  }
  if (!propertiesData) {
    return <TableLoader />;
  }

  if (!propertiesData.id) {
    return <TableLoader />;
  }

  const tabItems = [
    {
      key: 'preview',
      label: 'Preview',
      children: (
        <>
          <div className="mb-6">
            <h3 className="border-t border-gray-400 bg-[#0f766e] text-white border-x text-center text-sm font-bold py-1">
              PROPERTY DETAILS
            </h3>
            <table className="w-full text-xs border-collapse border border-gray-400">
              <colgroup>
                <col className="w-1/6" />
                <col className="w-1/6" />
                <col className="w-1/6" />
                <col className="w-1/6" />
              </colgroup>
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">MLS #</td>
                  <td className="border border-gray-400 px-2 py-1">{propertiesData?.mlsNumber || "N/A"}</td>
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Province</td>
                  <td className="border border-gray-400 px-2 py-1">
                    {states?.data?.states?.find(
                      (state) => state.id === propertiesData?.stateId
                    )?.name || "N/A"}
                  </td>
                </tr>
                <tr>
                <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Listing Type</td>
                <td className="border border-gray-400 px-2 py-1">
  {propertiesData?.listType
    ? propertiesData.listType.charAt(0).toUpperCase() + propertiesData.listType.slice(1)
    : "N/A"}
</td>

                  
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">City</td>
                  <td className="border border-gray-400 px-2 py-1">
                    {cities?.data?.cities?.find(
                      (city) => city.id === propertiesData?.cityId
                    )?.name || "N/A"}
                  </td>
                </tr>
                <tr>
                  
                <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Property Type</td>
                <td className="border border-gray-400 px-2 py-1">{propertiesData?.propertyType || "N/A"}</td>
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Postal Code</td>
                  <td className="border border-gray-400 px-2 py-1">{propertiesData?.postalCode || "N/A"}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Listing Price</td>
                  <td className="border border-gray-400 px-2 py-1">${formatNumberWithCommasAndDecimals(propertiesData?.listingPrice) || "N/A"}</td>                  
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Address</td>
                  <td className="border border-gray-400 px-2 py-1">{propertiesData?.address || "N/A"}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Lockbox</td>
                  <td className="border border-gray-400 px-2 py-1">{propertiesData?.lockbox || "N/A"}</td>                  
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Address 2</td>
                  <td className="border border-gray-400 px-2 py-1">{propertiesData?.addressTwo || "N/A"}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Listing Status</td>
                  <td className="border border-gray-400 px-2 py-1" colSpan="3">
                    {propertiesData?.listingStatus.charAt(0).toUpperCase() + propertiesData.listingStatus.slice(1) || "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-6">
            <h3 className="border-t border-gray-400 bg-[#0f766e] text-white border-x text-center text-sm font-bold py-1">
              {propertiesData?.propertyListingType === "For rent"
                ? "LANDLORD INFORMATION"
                : "SELLER INFORMATION"}
            </h3>
            <table className="w-full text-xs border-collapse border border-gray-400">
              <colgroup>
                <col className="w-1/6" />
                {sellersInfo?.sellersInfo?.map((_, index) => (
                  <col key={index} className="w-1/6" />
                ))}
              </colgroup>
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Name</td>
                  {sellersInfo?.sellersInfo?.map((seller, index) => (
                    <td key={index} className="border border-gray-400 px-2 py-1">
                      {`${seller.firstName} ${seller.lastName}`}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Phone Number</td>
                  {sellersInfo?.sellersInfo?.map((seller, index) => (
                    <td key={index} className="border border-gray-400 px-2 py-1">
                      {seller.phoneNumber}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-6">
            <h3 className="border-t border-gray-400 bg-[#0f766e] text-white border-x text-center text-sm font-bold py-1">
              IMPORTANT DATES
            </h3>
            <table className="w-full text-xs border-collapse border border-gray-400">
              <colgroup>
                <col className="w-1/6" />
                <col className="w-1/6" />
                <col className="w-1/6" />
                <col className="w-1/6" />
              </colgroup>
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Contract Date</td>
                  <td className="border border-gray-400 px-2 py-1">
                    {propertiesData?.contractDate
                      ? formatDateYYYYMMDD(propertiesData?.contractDate)
                      : "N/A"}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Expiry Date</td>
                  <td className="border border-gray-400 px-2 py-1">
                    {propertiesData?.expiryDate
                      ? formatDateYYYYMMDD(propertiesData?.expiryDate)
                      : "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Offer Date</td>
                  <td className="border border-gray-400 px-2 py-1">
                    {propertiesData?.offerDate
                      ? new Date(propertiesData?.offerDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
                
              </tbody>
            </table>
          </div>

          {(user?.id == propertiesData?.createdBy || user?.userType == "superAdmin") && (
            <div className="mb-6">
            <h3 className="border-t border-gray-400 bg-[#0f766e] text-white border-x text-center text-sm font-bold py-1">
              ATTACHMENTS
            </h3>
            <table className="w-full text-xs border-collapse border border-gray-400">
              <colgroup>
                <col className="w-1/4" />
                <col className="w-3/4" />
              </colgroup>
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Property Picture</td>
                  <td className="border border-gray-400 px-2 py-1">
                    {propertiesData.firstPicturePath ? (
                      <a
                        href={getFileUrl(propertiesData.firstPicturePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline hover:text-blue-700"
                      >
                        View Picture
                      </a>
                    ) : (
                      "No picture uploaded"
                    )}
                  </td>
                </tr>
                {propertiesData.propertyListingAttachment &&
                  propertiesData.propertyListingAttachment.length > 0 ? (
                  propertiesData.propertyListingAttachment.map((attachment) => (
                    <tr key={attachment.id}>
                      <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                        {attachment.uploadFileName.name}
                      </td>
                      <td className="border border-gray-400 px-2 py-1">
                        {attachment.filePath ? (
                          <a
                            href={getFileUrl(attachment.filePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline hover:text-blue-700"
                          >
                            View {attachment.uploadFileName.name}
                          </a>
                        ) : (
                          `No ${attachment.uploadFileName.name} uploaded`
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border border-gray-400 px-2 py-1" colSpan="2">
                      No attachments available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
          

          <PropertyListingNoteLog propertyListingId={propertiesData.id} />

          {user?.userType == "superAdmin" && (
            <div className="mb-6">
              <h3
                className="border-t border-gray-400 bg-[#0b3b38] text-white border-x text-center text-sm font-bold py-1 cursor-pointer flex justify-between items-center px-4"
                onClick={toggleExpand}
              >
                <span>ACTIVITY LOG</span>
                {isExpanded ? (
                  <FaMinus className="text-white" />
                ) : (
                  <FaPlus className="text-white" />
                )}
              </h3>

              {isExpanded && (
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-xs border-collapse border border-gray-400">
                    <colgroup>
                      <col className="w-3/4" />
                      <col className="w-1/4" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Details</th>
                        <th className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.data?.propertyListingData?.activityLog
                        ?.slice()
                        .sort((a: any, b: any) => b.id - a.id)
                        .map((log: any) => (
                          <tr key={log.id}>
                            <td className="border border-gray-400 px-2 py-1">
                              <FaHistory className="inline mr-1" />
                              {log.historyText}
                            </td>
                            <td className="border border-gray-400 px-2 py-1">
                              <FaRegClock className="inline mr-1" />
                              {moment(log.createdAt).format("D MMMM YYYY [at] h:mm A")}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {user?.userType === "superAdmin" && (
            <div className="mb-6">
              <h3
                className="border-t border-gray-400 bg-[#0b3b38] text-white border-x text-center text-sm font-bold py-1 cursor-pointer flex justify-between items-center px-4"
                onClick={toggleInvoiceSendLogExpand}
              >
                <span>INVOICE SEND LOG</span>
                {isInvoiceSendLogExpanded ? (
                  < FaMinus className="text-white" />
                ) : (
                  <FaPlus className="text-white" />
                )}
              </h3>

              {isInvoiceSendLogExpanded && (
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-xs border-collapse border border-gray-400">
                    <colgroup>
                      <col className="w-3/5" />
                      <col className="w-2/5" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Details</th>
                        <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.data?.propertyListingData?.tradeCommissionInvoiceRecords?.map((record: any) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition duration-150">
                          <td className="border border-gray-400 px-3 py-1.5">
                            <div className="flex flex-col">
                              <div><span className="font-medium">Invoice ID:</span> {record.invoiceId || "N/A"}</div>
                              <div><span className="font-medium">Status:</span> {record.status}</div>
                              <div><span className="font-medium">Commission:</span> ${record.totalCommission} (GST: ${record.gstCommission})</div>
                              <div><span className="font-medium">Sale Price:</span> ${record.salePrice}</div>
                            </div>
                          </td>
                          <td className="border border-gray-400 px-3 py-1.5 whitespace-nowrap">
                            <FaRegClock className="inline mr-1" />
                            {moment(record.createdAt).format("D MMM YYYY [at] h:mm A")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      ),
    },
   
  ];

if (user?.id == propertiesData?.createdBy || user?.userType == "superAdmin") {
  tabItems.push(
    {
      key: 'notes',
      label: 'Notes',
      children: (
        <div className="mt-4">
          <PropertyListingNote propertyListingId={propertiesData.id} />
        </div>
      ),
    },
    {
      key: 'files',
      label: 'File Manager',
      children: (
        <div className="mt-4">
          <PropertyListingPaperworkFileManager uuid={uuid} showHeader={false} />
        </div>
      ),
    }
  );
}

  return (
    <div className="max-w-8xl mx-auto p-4">
      <h2 className="border-t border-gray-400 bg-[#0b3b38] text-white border-x text-center text-sm font-bold py-1 uppercase">
        {propertiesData?.propertyListingTypeId} - { propertiesData?.propertyAddress}
      </h2>
      <Tabs defaultActiveKey="preview" items={tabItems} />
    </div>
  );
};

export default ViewPropertyListing;
