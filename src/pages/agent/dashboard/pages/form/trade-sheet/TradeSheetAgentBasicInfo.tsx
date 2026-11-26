/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import {
  useEffect,
  useState,
} from 'react';

import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  useDispatch,
  useSelector,
} from 'react-redux';
import {
  useNavigate,
  useParams,
} from 'react-router-dom';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

import ButtonLoader from '../../../../../../components/loader/buttonLoader';
import TableLoader from '../../../../../../components/loader/TableLoader';
import TradeSheetSteps
  from '../../../../../../components/Stepper/TradeSheetSteps';
import {
  useCreateUpdateAgentBasicInfoMutation,
  useGetAgentLeadsForTradeSheetQuery,
  useGetSpacificTradeSheetListDataQuery,
} from '../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice';
import {
  useGetAgentListDataQuery,
} from '../../../../../../redux/api/superadmin/agent/agentManagementSlice';
import {
  useGetActiveBranchListDataQuery,
} from '../../../../../../redux/api/superadmin/branch/Branchmanagementslice';
import {
  useGetPropertyListingQuery,
} from '../../../../../../redux/api/superadmin/propertyListingDataSlice';
import {
  setTradeSheetData,
  setTradeSheetRepresentation,
  setTradeSheetRepresentationType,
} from '../../../../../../redux/slices/userSlice';

// Reusable Text Input Component
const TextInput = ({
  label,
  register,
  required,
  name,
  errors,
  type = "text",
  placeholder = "",
  readonly = false, // Add readonly prop with default value as false
}: any) => (
  <div className="flex flex-col gap-2">
    <label>
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>

    <input
      {...register(name, { required })}
      type={type}
      placeholder={placeholder}
      className={`border p-2 rounded ${
        readonly
          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
          : "border-gray-300"
      }`} // Conditionally change styles based on readonly
      readOnly={readonly} // Add readonly attribute
    />

    {errors[name] && (
      <p className="text-red-500 text-sm">{`${label} is required`}</p>
    )}
  </div>
);

// Reusable Select Input Component
const SelectInput = ({ label, register, required, name, errors, options = [] }: any) => (
  <div className="flex flex-col gap-2">
    <label>
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <select
      {...register(name, { required })}
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

const TradeSheetAgentBasicInfo = () => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid?: string }>(); // uuid is optional
  const { data, isLoading } = useGetSpacificTradeSheetListDataQuery(uuid);
  const { data: agentList } = useGetAgentListDataQuery("");
  const { tradeSheetRepresentationTypeData } = useSelector(
    (state: any) => state.user
  );
  const { tradeSheetRepresentationData } = useSelector(
    (state: any) => state.user
  );
  const { data: propertyListingData } = useGetPropertyListingQuery("");
  const [leadSource, setLeadSource] = useState("myLead");
  const [selectedLead, setSelectedLead] = useState<{ value: any; label: string } | null>(null);
  const [isAgentChange, setIsAgentChange] = useState(false);
  const [agentEmail, setAgentEmail] = useState("");
  const [propertyListingSelectd, setPropertyListingSelectd] = useState("");
  const [selectedRepresentation, setSelectedRepresentation] =
    useState("single");
  const [multipleRepresentation, setMultipleRepresentation] = useState([
    { value: "buyer", label: "Buyer" },
    { value: "seller", label: "Seller" },
    { value: "tenant", label: "Tenant" },
    { value: "landlord", label: "Landlord" },
  ]);
  const [selectedMultipleRepresentation, setSelectedMultipleRepresentation] =
    useState<{ value: string; label: string }[]>([]);
  const [selectedShareAgent, setSelectedShareAgent] = useState<
    { value: string; label: string }[]
  >([]);

  const isListingUsable = (item: any) =>
    (item.status === "approved" || item.status === "pendingMls") &&
    item.listingStatus !== "terminated" &&
    item.listingStatus !== "sold" &&
    item.listingStatus !== "expired" &&
    item.listingStatus !== "suspended";

  // A live trade sheet already using this listing's MLS number. Archived, deleted, DFT (deal fell through) or
  // Deal Terminated ones no longer hold the listing, so it can be sold again on a new trade sheet.
  const RELEASED_TRADE_STATUSES = ["dft", "dealterminated"];
  const blockingTradeSheet = (item: any) =>
    item.mlsNumber
      ? item.tradeSheet?.find(
          (ts: any) =>
            ts.status !== "archive" &&
            !ts.deletedAt &&
            !RELEASED_TRADE_STATUSES.includes(String(ts.tradeStatus || "").toLowerCase()) &&
            ts.properties?.some((pd: any) => pd.mlsNumber === item.mlsNumber)
        )
      : null;

  // Typed search that matches a listing hidden by a live trade sheet: say why it isn't in the list.
  const [listingSearch, setListingSearch] = useState("");
  const heldListing =
    listingSearch.trim().length >= 3
      ? propertyListingData?.data?.propertyListingData?.find((item: any) => {
          const q = listingSearch.trim().toLowerCase();
          return (
            isListingUsable(item) &&
            blockingTradeSheet(item) &&
            item.id !== data?.data?.tradeSheetData?.propertyListingId &&
            (String(item.propertyAddress || "").toLowerCase().includes(q) ||
              String(item.mlsNumber || "").toLowerCase().includes(q))
          );
        })
      : null;

  const propertyListingOptions =
    propertyListingData?.data?.propertyListingData
      ?.filter((item: any) => {
        const isMatchingTradeSheet =
          item.id === data?.data?.tradeSheetData?.propertyListingId;

        // Include items that are approved or pending MLS, not in terminated/closed/expired/suspended,
        // and without a live trade sheet using the same MLS number
        return (
          (isListingUsable(item) && !blockingTradeSheet(item)) ||
          isMatchingTradeSheet
        );
      })
      .map((item: any) => ({
        value: item.id,
        label: item.propertyAddress,
        sharedUsers: item.sharedUsers,
      })) || [];

  const [representation, setRepresentation] = useState("");

  const handleRepresentationChange = (event: any) => {
    setRepresentation(event.target.value);
    setValue("representation", event.target.value);
    if (event.target.value) {
      dispatch(setTradeSheetRepresentation(event.target.value));
    }
  };

  const handleRepresentationTypeChange = (event: any) => {
    //  alert(event.target.value)
    setSelectedRepresentation(event.target.value);

    if (event.target.value) {
      dispatch(setTradeSheetRepresentationType(event.target.value));
    }

    if (event.target.value == "single") {
      setSelectedShareAgent("");
      setValue("sharedUsers", "");
    }
    if (event.target.value == "multiple") {
      setRepresentation("");
      setValue("representation", "");
      if (event.target.value) {
        dispatch(setTradeSheetRepresentation(""));
      }
    }

    // setRepresentation(event.target.value);
    // setValue("representation", event.target.value);
    // if (event.target.value) {
    //   dispatch(setTradeSheetRepresentation(event.target.value));
    // }
  };

  // Handle loading and error states
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    setError,
    clearErrors,
    getValues,
    watch,
  } = useForm();
  const selectedAgentId = watch("agent_id");
  const { data: leadsData } = useGetAgentLeadsForTradeSheetQuery(selectedAgentId || undefined);
  const [btnLoading, setBtnLoading] = useState("");
  const { user } = useSelector((state: any) => state.user);
  const dispatch = useDispatch();
  const isSuperAdmin = user?.roleId == 1;
  const isBranchAdmin = user?.roleId == 12;
  
  // Fetch active branches for super admin
  const { data: activeBranches } = useGetActiveBranchListDataQuery("", {
    skip: !(isSuperAdmin || isBranchAdmin),
  });

  const handlePropertyListingChange = (selectedOption: any) => {
    // console.log("propertyListingId", selectedOption?.value);
    if (selectedOption) {
      console.log("selectedOption", selectedOption);
      setPropertyListingSelectd(selectedOption?.value);
      setValue("propertyListingId", selectedOption?.value);
      clearErrors("propertyListingId");
      if (
        selectedOption?.sharedUsers &&
        selectedOption?.sharedUsers.length > 0
      ) {
        const multipleShareAgentValues = selectedOption?.sharedUsers; // Array of user objects (with sharedUserId)

        // Use .map to find the corresponding objects in 'multipleRepresentation'
        const selectedShareAgent = multipleShareAgentValues
          .map((value) => {
            // Find the corresponding object for each value in the original 'agentOptions'
            const matchedAgent = agentOptions.find(
              (item) => item.value === value.email
            );
            // If no matching item is found, return undefined
            return matchedAgent || undefined;
          })
          // Filter out items where value matches agentEmail (exclude them)
          .filter((item) => item !== undefined && item.value !== agentEmail);

        setSelectedShareAgent(selectedShareAgent);
      } else {
        setSelectedShareAgent();
      }
    }
  };

  const agentOptions =
    agentList?.data?.userData?.filter((agent: any) => agent.status === "approved" && (agent?.brokerageId === 24 || agent?.brokerageId === '24')).map((agent: any) => ({
      value: agent.email,
      id: agent.id,
      userId: agent.userId,
      email: agent.email,
      name: agent.name,
      firstName: agent.firstName,
      lastName: agent.lastName,
      label: `${agent.name} (${agent.email})`,
    })) || [];

  

  useEffect(() => {
    setValue("representationType", "single");
    setValue("leadSource", "myLead");
    dispatch(setTradeSheetRepresentationType("single"));
    if (data?.data?.tradeSheetData) {
      if (data?.data?.tradeSheetData?.representation) {
        dispatch(
          setTradeSheetRepresentation(
            data?.data?.tradeSheetData?.representation
          )
        );
      }
      if (data?.data?.tradeSheetData?.multipleRepresentation) {
        dispatch(
          setTradeSheetRepresentation(
            data?.data?.tradeSheetData?.multipleRepresentation
          )
        );
      }
      dispatch(setTradeSheetData(data?.data?.tradeSheetData));
      dispatch(
        setTradeSheetRepresentationType(
          data?.data?.tradeSheetData?.representationType
        )
      );
      reset(data?.data?.tradeSheetData);
      setSelectedRepresentation(data?.data?.tradeSheetData?.representationType);

      if (data?.data?.tradeSheetData?.multipleRepresentation) {
        const multipleRepresentationString =
          data?.data?.tradeSheetData?.multipleRepresentation;
        const selectedMultipleRepresentation = multipleRepresentationString
          .split(",") // Split the string by commas to get the individual values
          .map((value) => {
            // Find the corresponding object for each value in the original array
            return multipleRepresentation.find((item) => item.value === value);
          })
          .filter((item) => item !== undefined);
        setSelectedMultipleRepresentation(selectedMultipleRepresentation);
      }

      

      if(data?.data?.tradeSheetData?.representationType != "designation") {
        // Only set agent_id if agentOptions are loaded
        if(agentOptions && agentOptions.length > 0) {
          if(data?.data?.tradeSheetData?.representation === "seller" || data?.data?.tradeSheetData?.representation === "landlord") {
            const selectedOption = agentOptions.find(
              (option: any) => String(option.id) === String(data?.data?.tradeSheetData?.seller_landlord_agent_id)
            );
            if(selectedOption) {
              setValue("agent_id", selectedOption.id)
            }
          } else if(data?.data?.tradeSheetData?.representation === "buyer" || data?.data?.tradeSheetData?.representation === "tenant") {
            const selectedOption = agentOptions.find(
              (option: any) => String(option.id) === String(data?.data?.tradeSheetData?.buyer_tenant_agent_id)
            );
            if(selectedOption) {
              setValue("agent_id", selectedOption.id)
            }
          } else {
            const selectedBuyerTenantOption = agentOptions.find(
              (option: any) => String(option.id) === String(data?.data?.tradeSheetData?.buyer_tenant_agent_id)
            );

            const selectedSellerLandlordOption = agentOptions.find(
              (option: any) => String(option.id) === String(data?.data?.tradeSheetData?.seller_landlord_agent_id)
            );

            if(selectedSellerLandlordOption){
              setValue("agent_id", selectedSellerLandlordOption.id)
            }else if(selectedBuyerTenantOption){
              setValue("agent_id", selectedBuyerTenantOption.id)
            }else{
              const selectedOption = agentOptions.find(
                (option: any) => option.name == data?.data?.tradeSheetData?.name
              );
              if(selectedOption) {
                setValue("agent_id", selectedOption.id)
              }
            }
          }
        }
      }

      setRepresentation(data?.data?.tradeSheetData?.representation);
      setAgentEmail(data?.data?.tradeSheetData?.email);
      setPropertyListingSelectd(data?.data?.tradeSheetData?.propertyListingId);
      setLeadSource(data?.data?.tradeSheetData?.leadSource || "myLead");
      if (!data?.data?.tradeSheetData?.leadSource) {
        setValue("leadSource", "myLead");
      }
      if (data?.data?.tradeSheetData?.leadId) {
        setValue("leadId", data.data.tradeSheetData.leadId);
        const matchedLead = leadsData?.data?.leads?.find(
          (l: any) => String(l.id) === String(data.data.tradeSheetData.leadId)
        );
        if (matchedLead) {
          setSelectedLead({
            value: matchedLead.id,
            label: `${matchedLead.name || "Unknown"} — ${matchedLead.campaign?.name || "No Campaign"}${matchedLead.phone ? " (" + matchedLead.phone + ")" : ""}`,
          });
        }
      }
      
      // Set branchId if it exists in the trade sheet data
      if (data?.data?.tradeSheetData?.branchId) {
        setValue("branchId", data?.data?.tradeSheetData?.branchId);
      } else if (!(isSuperAdmin || isBranchAdmin) && user?.branchId) {
        // If no branchId in trade sheet and user is neither super admin nor branch admin, use their own branch
        setValue("branchId", user.branchId);
      }
    } else {
      // For new trade sheets, set branchId for non-super / non-branch-admin users
      if (!(isSuperAdmin || isBranchAdmin) && user?.branchId) {
        setValue("branchId", user.branchId);
      }
    }
    if (user && user.userType === "agent") {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        representation: data?.data?.tradeSheetData?.representation,
      });
    }
    if (!uuid) {
      dispatch(setTradeSheetRepresentation(""));
      dispatch(setTradeSheetData(""));
    }
  }, [data, user, reset, agentList, setValue]);

  // Pre-select the lead once leadsData is available (runs separately from main useEffect)
  useEffect(() => {
    const leadId = data?.data?.tradeSheetData?.leadId;
    if (!leadId || !leadsData?.data?.leads?.length) return;
    const matchedLead = leadsData.data.leads.find(
      (l: any) => String(l.id) === String(leadId)
    );
    if (matchedLead) {
      setSelectedLead({
        value: matchedLead.id,
        label: `${matchedLead.name || "Unknown"} — ${matchedLead.campaign?.name || "No Campaign"}${matchedLead.phone ? " (" + matchedLead.phone + ")" : ""}`,
      });
      setValue("leadId", matchedLead.id);
    }
  }, [leadsData, data?.data?.tradeSheetData?.leadId, setValue]);

  const [createUpdateAgentBasicInfo] = useCreateUpdateAgentBasicInfoMutation();

  const onSubmit = async (data: any) => {
    setBtnLoading(data.saveBtn); // Set loading state based on the button clicked
    try {
      const isDraft = data.saveBtn === "save-draft";
      const requestData = isDraft ? { ...data, status: "draft" } : data;

      // Property listing is required for seller, landlord, and multiple representation
      if (!isDraft) {
        const needsPropertyListing =
          data.representationType === "multiple" ||
          data.representation === "seller" ||
          data.representation === "landlord";
        if (needsPropertyListing && !data.propertyListingId) {
          setError("propertyListingId", { type: "required", message: "Select Property Listing is required" });
          setBtnLoading("");
          return;
        }
      }


      if (requestData?.representation) {
        dispatch(setTradeSheetRepresentation(requestData?.representation));
      }
      if (requestData?.multipleRepresentation) {
        dispatch(setTradeSheetRepresentation( Array.isArray(requestData.multipleRepresentation) 
        ? requestData.multipleRepresentation.join(',') 
        : requestData.multipleRepresentation));
      }
      dispatch(setTradeSheetRepresentationType(requestData?.representationType))
      const processed_tradesheet = requestData;
      if(processed_tradesheet.multipleRepresentation){
        processed_tradesheet.multipleRepresentation = Array.isArray(requestData.multipleRepresentation) 
        ? requestData.multipleRepresentation.join(',') 
        : requestData.multipleRepresentation;
      }
      
      // Keep the loaded trade's details (property details, linked listing) and point the listing at the one
      // just selected, so the step header keeps showing the right address after saving.
      const loadedTrade = data?.data?.tradeSheetData || {};
      const selectedListingOption = propertyListingOptions.find(
        (o: any) => String(o.value) === String(processed_tradesheet?.propertyListingId)
      );
      dispatch(
        setTradeSheetData({
          ...loadedTrade,
          ...processed_tradesheet,
          propertyListing: selectedListingOption
            ? { ...(String(loadedTrade?.propertyListing?.id) === String(selectedListingOption.value) ? loadedTrade.propertyListing : {}), id: selectedListingOption.value, propertyAddress: selectedListingOption.label }
            : processed_tradesheet?.propertyListingId ? loadedTrade?.propertyListing : null,
        })
      );

      const response = await createUpdateAgentBasicInfo({
        data: requestData,
        uuid,
      }).unwrap();

      toast.success(`${response?.message}`);

      let navigatePath = "";
      switch (data.saveBtn) {
        case "save-next":
          if (tradeSheetRepresentationTypeData == "multiple") {
            navigatePath = `/dashboard/agent/pages/form/trade-sheet/property-details-multiple-representation/${response?.data?.agentBasicInfoData?.uuid}`;
          } else if (
            tradeSheetRepresentationData == "seller" ||
            tradeSheetRepresentationData == "landlord"
          ) {
            navigatePath = `/dashboard/agent/pages/form/trade-sheet/property-details-seller/${response?.data?.agentBasicInfoData?.uuid}`;
          } else {
            navigatePath = `/dashboard/agent/pages/form/trade-sheet/property-details/${response?.data?.agentBasicInfoData?.uuid}`;
          }
          break;
        case "save-exit":
        case "save-draft":
          navigatePath = `/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list`;
          break;
        default:
          break;
      }

      if (navigatePath) {
        navigate(navigatePath, { replace: true });
      }
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    } finally {
      setBtnLoading(""); // Reset loading state in the finally block
    }
  };

  const cancelSubmit = () => {
    toast.error("You are canceling the creation of the trade sheet!");
    navigate(
      `/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list`,
      { replace: true }
    );
  };

  const resetForm = () => {
    reset({
      firstName: "",
      lastName: "",
      email: "",
    });
    toast.success("Successfully Reset!");
  };

  const saveAndNextFunction = () => {
    setValue("saveBtn", "save-next");
  };

  const handleAgentChange = (selectedOption: any) => {
    if (selectedOption) {
      setIsAgentChange(true);
      setValue("agent_id", selectedOption?.id || "")
      setValue(`firstName`, selectedOption?.firstName);
      setValue(`lastName`, selectedOption?.lastName);
      setValue(`email`, selectedOption?.email);
    } else {
      setIsAgentChange(false);
      setValue(`firstName`, "");
      setValue(`lastName`, "");
      setValue(`email`, "");
    }
  };

  const handleMultipleRepresentationChange = (selectedOptions: any) => {
    setSelectedMultipleRepresentation(selectedOptions);
    setValue(
      "multipleRepresentation",
      selectedOptions.map((option: any) => option.value)
    );

    if (
      selectedOptions.some(
        (opt) => opt.value === "buyer" || opt.value === "seller"
      )
    ) {
      setMultipleRepresentation([
        { value: "buyer", label: "Buyer", disabled: true },
        { value: "seller", label: "Seller", disabled: true },
      ]);
    } else if (
      selectedOptions.some(
        (opt) => opt.value === "tenant" || opt.value === "landlord"
      )
    ) {
      setMultipleRepresentation([
        { value: "tenant", label: "Tenant", disabled: true },
        { value: "landlord", label: "Landlord", disabled: true },
      ]);
    } else {
      setMultipleRepresentation([
        { value: "buyer", label: "Buyer" },
        { value: "seller", label: "Seller" },
        { value: "tenant", label: "Tenant" },
        { value: "landlord", label: "Landlord" },
      ]);
    }
  };

  

  return (
    <div>
      {/* <h2 className="uppercase text-center bg-[#c9c1c13d] py-5">Trade Sheet</h2> */}
      <TradeSheetSteps active={1} uuid={uuid} />

      {/* Form */}
      {isLoading ? (
        <TableLoader />
      ) : (
        <div className="max-w-full mt-8 p-8 border border-gray-300/30 rounded-md  border-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Agent's Basic Info: */}
            <div className="max-FULL  p-6 bg-[#c9c1c13d] rounded-lg shadow-md"> 
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">

                {/* Representation */}
                <div className="flex flex-col gap-2">
                  <label>
                    Representation Type{" "}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        {...register("representationType", { required: true })}
                        type="radio"
                        value="single"
                        className="mr-2"
                        onChange={handleRepresentationTypeChange}
                      />
                      Single
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register("representationType", { required: true })}
                        type="radio"
                        value="multiple"
                        className="mr-2"
                        onChange={handleRepresentationTypeChange}
                      />
                      Multiple
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register("representationType", { required: true })}
                        type="radio"
                        value="designation"
                        className="mr-2"
                        onChange={handleRepresentationTypeChange}
                      />
                      Designation
                    </label>
                  </div>
                  {errors.representation && (
                    <p className="text-red-500 text-sm">
                      Please select an option
                    </p>
                  )}
                </div>

                {/* Representation */}
                {selectedRepresentation == "single" && (
                  <div className="flex flex-col gap-2">
                    <label>
                      Representation{" "}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center">
                        <input
                          {...register("representation", { required: true })}
                          type="radio"
                          value="seller"
                          className="mr-2"
                          onChange={handleRepresentationChange}
                        />
                        Seller
                      </label>
                      <label className="flex items-center">
                        <input
                          {...register("representation", { required: true })}
                          type="radio"
                          value="buyer"
                          className="mr-2"
                          onChange={handleRepresentationChange}
                        />
                        Buyer
                      </label>
                      <label className="flex items-center">
                        <input
                          {...register("representation", { required: true })}
                          type="radio"
                          value="tenant"
                          className="mr-2"
                          onChange={handleRepresentationChange}
                        />
                        Tenant
                      </label>
                      <label className="flex items-center">
                        <input
                          {...register("representation", { required: true })}
                          type="radio"
                          value="landlord"
                          className="mr-2"
                          onChange={handleRepresentationChange}
                        />
                        Landlord
                      </label>
                    </div>
                    {errors.representation && (
                      <p className="text-red-500 text-sm">
                        Please select an option
                      </p>
                    )}
                  </div>
                )}

                {(selectedRepresentation == "multiple" || selectedRepresentation == "designation") && (
                  <div className="flex flex-col gap-2">
                    <label>
                      Multiple Representation{" "}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Select
                      {...register("multipleRepresentation", {
                        required: "Multiple Representation is required",
                      })}
                      options={multipleRepresentation}
                      isMulti
                      value={selectedMultipleRepresentation}
                      onChange={handleMultipleRepresentationChange}
                      classNamePrefix="react-select"
                    />
                    {errors.subcategories && (
                      <p className="text-red-500 text-sm">
                        {errors.subcategories.message}
                      </p>
                    )}
                  </div>


                )}
                {selectedMultipleRepresentation.length > 0 && selectedRepresentation == "designation" ? (
                  <>
                    <div className="flex flex-col gap-2 mb-4">
                      <label htmlFor="">
                        {selectedMultipleRepresentation.some((opt: any) => opt.value === "seller") 
                          ? "Seller Agent" 
                          : "Landlord Agent"
                        } <span className="text-red-500 ml-1">*</span>
                      </label>
                      <Select
                        {...register("seller_landlord_agent_id", { 
                          required: true 
                        })}
                        options={agentOptions}
                        classNamePrefix="select"
                        className={`react-select ${
                          errors.seller_landlord_agent_id ? "border-red-500" : ""
                        }`}
                        onChange={(selectedOption: any) => 
                          setValue("seller_landlord_agent_id", selectedOption?.id || "")
                        }
                        value={agentOptions.find(
                          (option: any) => String(option.id) === String(watch("seller_landlord_agent_id"))
                        )}
                        isClearable
                      />
                      {errors.seller_landlord_agent_id && (
                        <p className="text-red-500 text-sm">
                          {selectedMultipleRepresentation.some((opt: any) => opt.value === "seller") 
                            ? "Seller Agent is required" 
                            : "Landlord Agent is required"
                          }
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 mb-4">
                      <label htmlFor="">
                        {selectedMultipleRepresentation.some((opt: any) => opt.value === "buyer") 
                          ? "Buyer Agent" 
                          : "Tenant Agent"
                        } <span className="text-red-500 ml-1">*</span>
                      </label>
                      <Select
                        {...register("buyer_tenant_agent_id", { 
                          required: true 
                        })}
                        options={agentOptions}
                        classNamePrefix="select"
                        className={`react-select ${
                          errors.buyer_tenant_agent_id ? "border-red-500" : ""
                        }`}
                        onChange={(selectedOption: any) => 
                          setValue("buyer_tenant_agent_id", selectedOption?.id || "")
                        }
                        value={agentOptions.find(
                          (option: any) => String(option.id) === String(watch("buyer_tenant_agent_id"))
                        )}
                        isClearable
                      />
                      {errors.buyer_tenant_agent_id && (
                        <p className="text-red-500 text-sm">
                          {selectedMultipleRepresentation.some((opt: any) => opt.value === "buyer") 
                            ? "Buyer Agent is required" 
                            : "Tenant Agent is required"
                          }
                        </p>
                      )}
                    </div>
                  </>
                ): (
                  <div>
                    {user?.userType === "superAdmin" && (
                      <div className="flex flex-col gap-2 mb-4">
                        <label htmlFor="">Select Agent From Existing One</label>
                        <Select
                          {...register("agent_id", { required: false })}
                          options={agentOptions}
                          classNamePrefix="select"
                          className={`react-select ${
                            errors.agent_id ? "border-red-500" : ""
                          }`}
                          onChange={(selectedOption) =>
                            handleAgentChange(selectedOption)
                          }
                          value={agentOptions.find(
                            (option: any) => String(option.id) === String(watch("agent_id"))
                          )}
                          isClearable 
                        />
                      </div>
                    )} 
                  </div>
                )}
              </div>

              {/* Property Listing Address  */}
              {((representation === "seller" || representation === "landlord") ||
                selectedRepresentation == "multiple") && (
                <div className="flex flex-col gap-2 mt-2">
                  <label>
                    Select Property Listing{" "}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <p className="text-xs text-gray-500">
                    Note: Only approved property listings are available for
                    selection. <br />
                    Please be aware that once a trade sheet is created for a
                    property, it will be marked as closed and will no longer be
                    available for further use.
                  </p>
                  <CreatableSelect
                    options={propertyListingOptions}
                    classNamePrefix="select"
                    className={`react-select ${
                      errors.propertyListingId ? "border-red-500" : ""
                    }`}
                    onChange={(selectedOption) =>
                      handlePropertyListingChange(selectedOption)
                    }
                    onInputChange={(value) => setListingSearch(value)}
                    value={propertyListingOptions.find(
                      (option: any) => option.value == propertyListingSelectd
                    )}
                    isClearable
                    styles={{
                      menuList: (base) => ({
                        ...base,
                        maxHeight: "240px",
                        overflowY: "auto",
                      }),
                    }}
                  />
                  {heldListing && (
                    <p className="text-amber-700 text-sm mt-1">
                      {heldListing.propertyAddress} isn't available: it already has trade sheet{" "}
                      {blockingTradeSheet(heldListing)?.tradeSheetTypeId || "on file"} (
                      {blockingTradeSheet(heldListing)?.status || "status unknown"}) with MLS{" "}
                      {heldListing.mlsNumber}. Mark that trade sheet DFT or Deal Terminated, or archive it, to use this listing again.
                    </p>
                  )}
                  {errors.propertyListingId && (
                    <p className="text-red-500 text-sm">
                      Select Property Listing is required
                    </p>
                  )}
                </div>
              )}

              {/* List Type */}
              <div className="flex flex-col gap-2 mt-2">
                <SelectInput
                  label="List type"
                  required
                  register={register}
                  name="listType"
                  errors={errors}
                  options={[
                    { value: "Commercial", label: "Commercial" },
                    { value: "Residential", label: "Residential" },
                  ]}
                />

                {/* Branch Selection - Super Admin & Branch Admin */}
              {isSuperAdmin || isBranchAdmin ? (
                <div className="mt-3">
                  <label>Assign to Branch:</label>
                  <select
                    {...register("branchId")}
                    onChange={(e) => setValue("branchId", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  >
                    {activeBranches?.data?.branchData?.map((branch: any) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <input
                    type="hidden"
                    {...register("branchId")}
                    value={user?.branchId ?? 1}
                    readOnly
                  />
                  <div className="">
                    <label>Branch Name:</label>
                    <input
                      type="text"
                      value={user?.branch?.name || "No Branch Assigned"}
                      disabled
                      className="border rounded p-2 w-full bg-gray-100"
                    />
                  <p className="text-xs text-gray-500 mt-1">
                    Trade sheet will be assigned to your branch automatically
                  </p>
                  </div>
                </>
              )}
              </div>

              

              {/* Show user's branch (read-only) for branch users */}
              {/* {!isSuperAdmin && user?.branch && (
                <div className="mt-3">
                  <label>Branch:</label>
                  <input
                    type="text"
                    value={user.branch.name}
                    disabled
                    className="border rounded p-2 w-full bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Trade sheet will be assigned to your branch automatically
                  </p>
                </div>
              )} */}
            </div>

            {/* Lead Source */}
            <div className="mt-4 p-4 border border-gray-200 rounded-lg flex flex-col gap-3">
              <label className="font-medium">Lead Source <span className="text-gray-400 text-sm font-normal">(Optional)</span></label>
              <div className="flex items-center gap-6">
                
                <label className="flex items-center cursor-pointer">
                  <input
                    {...register("leadSource")}
                    type="radio"
                    value="dvrLead"
                    className="mr-2"
                    onChange={() => setLeadSource("dvrLead")}
                  />
                  DVR Lead
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    {...register("leadSource")}
                    type="radio"
                    value="myLead"
                    className="mr-2"
                    onChange={() => { setLeadSource("myLead"); setValue("leadId", ""); setSelectedLead(null); }}
                  />
                  Non DVR Lead
                </label>
              </div>

              {leadSource === "dvrLead" && (
                <div className="flex flex-col gap-2">
                  <label>Select Lead</label>
                  <Select
                    options={
                      leadsData?.data?.leads?.map((lead: any) => ({
                        value: lead.id,
                        label: `${lead.name || "Unknown"} — ${lead.campaign?.name || "No Campaign"}${lead.phone ? " (" + lead.phone + ")" : ""}`,
                      })) || []
                    }
                    value={selectedLead}
                    onChange={(opt: any) => {
                      setSelectedLead(opt || null);
                      setValue("leadId", opt?.value || "");
                    }}
                    isClearable
                    placeholder="Search and select a lead..."
                    classNamePrefix="react-select"
                  />
                  <input type="hidden" {...register("leadId")} />
                </div>
              )}
            </div>

            <div className="flex justify-between my-15 mx-5">
              {/* Save and Next Button */}

              <button
                type="submit"
                onClick={saveAndNextFunction}
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading == "save-next" ? <ButtonLoader /> : "Save and Next"}
              </button>

              {/* Save and Exit Button */}

              <button
                type="submit"
                onClick={() => setValue("saveBtn", "save-exit")}
                {...register("saveBtn")}
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading == "save-exit" ? <ButtonLoader /> : "Save and Exit"}
              </button>

              {/* Save as Draft Button */}
              <button
                type="submit"
                onClick={() => setValue("saveBtn", "save-draft")}
                {...register("saveBtn")}
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading == "save-draft" ? (
                  <ButtonLoader />
                ) : (
                  "Save as Draft"
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading === "reset" ? <ButtonLoader /> : "Rest Form"}
              </button>

              {/* Cancel Button */}
              <button
                onClick={cancelSubmit}
                type="button"
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading === "cancel" ? <ButtonLoader /> : "Cancel"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TradeSheetAgentBasicInfo;
