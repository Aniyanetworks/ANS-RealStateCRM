/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useEffect, useState } from "react";
import { format, set } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import ButtonLoader from "../../../../../components/loader/buttonLoader";
import { useAppSelector } from "../../../../../redux/hooks";
import TableLoader from "../../../../../components/loader/TableLoader";
import {
  useGetSpacificTradeSheetListDataQuery,
  useCreateUpdatePropertyDetailsMutation,
} from "../../../../../redux/api/agent/trade-sheet/tradeSheetSlice";
import {
  useGetCitiesQuery,
  useGetStatesQuery,
} from "../../../../../redux/api/common/countryStateCitySlice";
import {
  useChangePropertyListingStatusMutation,
  useCreateUpdateFullPropertyListingDataMutation,
  useGetSpacificPropertyListingQuery,
} from "../../../../../redux/api/superadmin/propertyListingDataSlice";
import { getFileUrl } from "../../../../../utils/constant";
import { useGetAgentListDataQuery } from "../../../../../redux/api/superadmin/agent/agentManagementSlice";
import { useSelector } from "react-redux";
import Select from "react-select";
import uploadIcon from "./../../../../../assets/upload2.svg";
import { Button } from "antd";
import { PlusCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";
import PropertyListingSteps from "../../../../../components/Stepper/PropertyListingSteps";
import { formatPhoneNumber, formatPostalCode } from "../../../../../utils/format";
import moment from 'moment';
// Reusable Text Input Component
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

// Reusable Date Input Component
const DateInput = ({ label, control, name, errors, required }: any) => (
  <div className="flex flex-col gap-2">
    <label>
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <Controller
      name={name}
      control={control}
      defaultValue=""
      rules={{ required: required ? `${label} is required` : false }} // Add validation rules conditionally
      render={({ field }) => (
        <input {...field} type="date" className="border rounded p-2 w-full" />
      )}
    />
    {errors[name] && (
      <p className="text-red-500 text-sm">{`${label} is required`}</p>
    )}
  </div>
);

// Reusable Select Input Component
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
// const formatDate = (isoDate: any) => {
//   if(isoDate)
//   {
//     return format(new Date(isoDate), "yyyy-MM-dd");
//   }
//   else
//   {
//     return "";
//   }
  
// };

const formatDate = (isoDate: any) => {
  if (isoDate) {
    return moment.utc(isoDate).format('YYYY-MM-DD');
  } else {
    return '';
  }
};

const CreateUpdatePropertyListing = () => {
  const { data: agentList } = useGetAgentListDataQuery("");
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [agentIdSet, setAgentIdSet] = useState(null);
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid?: string }>(); // uuid is optional
  const [btnLoading, setBtnLoading] = useState("");
  const [propertiesData, setPropertiesData] = useState([]);
  const { data, isLoading } = useGetSpacificPropertyListingQuery(uuid);
  const { tradeSheetRepresentationData } = useAppSelector(
    (state: any) => state.user
  );
  const [selectedShareAgent, setSelectedShareAgent] = useState<{ value: string; label: string }[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<{ value: string; label: string }[]>([]);
  const [sellers, setSellers] = useState([{ id: Date.now() }]); // Initial seller state
  const { user } = useSelector((state: any) => state.user);
  const [isUploadLoading, setIsUploadLoading] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState({
    firstPicture: "",
    listingAgreement: "",
    mlsDataSheet: "",
    recoGuide: "",
  });
  // Handle loading and error states
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues,
  } = useForm();

  const selectedCountry = 39;
  const selectedState = watch("stateId");
  const selectedCity = watch("cityId");
  const selectedPostalCode = watch("postalCode");
  const selectedAddress = watch("address");
  const selectedPropertyType = watch("propertyType");

  // seleted files
  const firstPictureFile = watch("firstPicture");
  const listingAgreementFile = watch("listingAgreement");
  const mlsDataSheetFile = watch("mlsDataSheet");
  const recoGuideFile = watch("recoGuide");

  const [defaultAddressValue, setDefaultAddressValue] = useState([]); // Store the address suggestions
  const [suggestions, setSuggestions] = useState([]); // Store the address suggestions
  const [query, setQuery] = useState(''); // Store the search query input

  useEffect(() => {
    if (query.length > 0) {
      // Fetch the suggestions from the API based on the user's input (query)
      fetch(`https://ws1.postescanada-canadapost.ca/Capture/Interactive/Find/v1.00/json3ex.ws?Key=TF36-KU97-AB94-ZC85&Text=${query}&Container=&Origin=CAN&Countries=&Datasets=&Limit=7&Filter=&Language=en&$block=true&$cache=true&SOURCE=PCA-SCRIPT&SESSION=ebb3da4f-a6ab-56cc-2b04-a54c42bb58a2`)
        .then(response => response.json())
        .then(data => {
          // Format the fetched data into a format suitable for react-select
          const formattedSuggestions = data.Items.map(item => ({
            label: item.Text,
            value: item.Text,
            description: item.Description,
            id: item.Id,
          }));
          setSuggestions(formattedSuggestions);
        })
        .catch(error => console.error('Error fetching address suggestions:', error));
    } else {
      setSuggestions([]); // Clear suggestions if input is empty
    }
  }, [query]); // Trigger fetch when query changes

  const handleSelectionChange = (selectedOption) => {
    // You can set the selected address here if needed
    setQuery(selectedOption?.value || ''); // Update the input with selected address
    fetchAddressDetails(selectedOption.id); // Call the second API to fetch address details
    // console.log('selectedOption',selectedOption)
  };

  const fetchAddressDetails = (addressId) => {
    // Make the second API call with the selected address Id
    fetch(`https://ws1.postescanada-canadapost.ca/Capture/Interactive/Retrieve/v1.00/json3ex.ws?Key=TF36-KU97-AB94-ZC85&Id=${addressId}&Source=&$cache=true&SOURCE=PCA-SCRIPT&SESSION=392d4c2e-6cf0-a3de-259c-d62903ad50c5`)
      .then(response => response.json())
      .then(data => {
        if (data.Items && data.Items.length > 0) {
          const firstItem = data.Items[0];
        
          // Directly access and format the suggestion without using map
          const formattedSuggestions = [{
            label: firstItem.Label,  // Use the 'Label' property for label
            value: firstItem.Label,   // Set the same value for value
            postalCode:firstItem.PostalCode, 
            provinceName:firstItem.ProvinceName, 
            cityName:firstItem.City, 
          }];
          
          setDefaultAddressValue(formattedSuggestions); // Set the suggestions in state
          setValue("postalCode", formattedSuggestions?.[0]?.postalCode)
          const provinceName = formattedSuggestions?.[0]?.provinceName
          const cityName = formattedSuggestions?.[0]?.cityName
          // const selectedState = states?.data?.states?.find(item.name ==provinceName).id;
          const selectedState = states?.data?.states?.find((state) => state.name == provinceName)?.id
          const selectedCity = cities?.data?.cities?.find((city) => city.name == cityName)?.id
          setSelectedCityId(selectedCity)
          setValue('stateId',selectedState);
          // console.log('selectedCity', selectedCity); // Log the formatted suggestions
          // console.log('selectedState', selectedState); // Log the formatted suggestions
          // console.log('provinceName', provinceName); // Log the formatted suggestions
          // console.log('formattedSuggestions', formattedSuggestions?.postalCode); // Log the formatted suggestions
        }
      })
      .catch(error => console.error('Error fetching address details:', error));
  };


  // Fetch states based on selected country
  const { data: states = [] } = useGetStatesQuery(selectedCountry, {
    skip: !selectedCountry, // Skip if no country is selected
  });

  // Fetch cities based on selected state
  const { data: cities = [], isLoading: isCityLoading } = useGetCitiesQuery(
    selectedState,
    {
      skip: !selectedState, // Skip if no state is selected
    }
  );
  
  const citiesOption = cities?.data?.cities?.map((city: { id: string | number, name: string }) => ({
    value: city.id,
    label: city.name,
  })) || [];
  
  
  const agentOptions =
    agentList?.data?.userData?.map((agent: any) => ({
      value: agent.userId,
      userId: agent.userId,
      email: agent.email,
      firstName: agent.firstName,
      lastName: agent.lastName,
      label: `${agent.name} (${agent.email})`,
    })) || [];

  const updatedAgentOptions = agentOptions.map((option) => {
    // Disable the option if the email matches the specified agentEmail
    if (option?.value === selectedAgentId) {
      return { ...option, isDisabled: true }; // Disable this option
    }
    if (option?.value === user?.id) {
      return { ...option, isDisabled: true }; // Disable this option
    }
    return option; // Leave other options unchanged
  });

  // Watch the value of 'conditional' field
  const conditionalValue = watch("conditional");
  const conditionalOptionValue = watch("conditionalOption");

  useEffect(() => {
    const properties = data?.data?.propertyListingData;
    if (data?.data?.propertyListingData) {
      setPropertiesData(properties);
    }

    if (data?.data?.propertyListingData) {
      setSelectedAgentId(data?.data?.propertyListingData?.createdBy);
      setValue("agentId", data?.data?.propertyListingData?.createdBy);

      setSelectedCityId(data?.data?.propertyListingData?.cityId)
      const processedProperty = {
        ...properties,
        contractDate: formatDate(properties?.contractDate),
        expiryDate: formatDate(properties?.expiryDate),
        offerDate: formatDate(properties?.offerDate),
        addressTwo: properties?.addressTwo || "",
        lockbox: properties?.lockbox || "",
      };
      reset(processedProperty);
      // console.log('data?.data?.propertyListingData?.sellersInfo',JSON.parse(data?.data?.propertyListingData?.sellersInfo)?.sellersInfo);
      
      //  setSellers(JSON.parse(data?.data?.propertyListingData?.sellersInfo)?.sellersInfo);

       if (data?.data?.propertyListingData?.sellersInfo) {
         try {
           const sellersInfo = JSON.parse(
             data.data.propertyListingData.sellersInfo
           )?.sellersInfo;
           if (sellersInfo?.length > 0) {
             sellersInfo.forEach((seller, index) => {
               setValue(`seller${index + 1}FirstName`, seller.firstName);
               setValue(`seller${index + 1}LastName`, seller.lastName);
               setValue(`seller${index + 1}Email`, seller.email);
               setValue(`seller${index + 1}PhoneNumber`, seller.phoneNumber);
             });
             setSellers(sellersInfo);
           }
         } catch (e) {
           console.error("Error parsing seller data:", e);
         }
       }
       if (data?.data?.propertyListingData?.sharedUsers && data?.data?.propertyListingData?.sharedUsers.length > 0) {
        const multipleShareAgentValues = data?.data?.propertyListingData?.sharedUsers;  // Array of user objects (with sharedUserId)
        // Use .map to find the corresponding objects in 'multipleRepresentation'
        const selectedShareAgent = multipleShareAgentValues
        .map((value) => {
          // Find the corresponding object for each value in the original array
          return agentOptions.find((item) => item.value === value.sharedUserId);
        })
        .filter((item) => item !== undefined);
    
        setSelectedShareAgent(selectedShareAgent);
      }
      

    }
    
  }, [data, reset, propertiesData, setPropertiesData, setSelectedAgentId]);

  useEffect(() => {
    setValue("countryId", 39); //by defult set county canada
    setSelectedAgentId(propertiesData.createdBy);
    setValue("agentId", propertiesData.createdBy);
    if(uuid)
    {
      setAgentIdSet(propertiesData.createdBy);
    }
   
    // Recompute the property address whenever any field changes
    const stateName =
      states?.data?.states?.find((state) => state.id == selectedState)?.name ||
      "";
    const cityName =
      cities?.data?.cities?.find((city) => city.id == selectedCity)?.name || "";
          // const formattedAddress = `${selectedAddress}, ${selectedPostalCode}, ${cityName}, ${stateName}, Canada`;
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

  const [createUpdateFullPropertyListingData] =
    useCreateUpdateFullPropertyListingDataMutation();
  const [changePropertyListingStatus] =
    useChangePropertyListingStatusMutation();

  if (isCityLoading || isLoading) {
    return <TableLoader />;
  }
  if (!propertiesData) {
    return <TableLoader />;
  }

  const onSubmit = async (data: any) => {
    console.log('agentIdSet',agentIdSet);
    setIsUploadLoading(true);
    // Initialize the FormData object to hold the data
    const sellersInfo = sellers.map((seller, index) => ({
      firstName: data[`seller${index + 1}FirstName`],
      lastName: data[`seller${index + 1}LastName`],
      email: data[`seller${index + 1}Email`],
      phoneNumber: data[`seller${index + 1}PhoneNumber`],
    }));
  
    // Structure the data as a JSON object to be set in the form state
    const jsonData = {
      sellersInfo: sellersInfo
    };

    setValue("sellersInfo", jsonData);
    setValue("agentId", agentIdSet);

    const dataData = getValues(); // Get all form values (can include files)
    console.log(dataData);
    const formData = new FormData();

    for (const key in dataData) {
      if (dataData.hasOwnProperty(key)) {
        const value = dataData[key];

        // Check if the value is a File (single file)
        if (value instanceof File) {
          formData.append(key, value); // Append the file directly

          // Check if the value is a FileList (multiple files)
        } else if (value instanceof FileList) {
          Array.from(value).forEach((file) => {
            formData.append(key, file); // Append each file in the FileList
          });

          // Handle other non-file values (e.g., text fields)
        } 
        else if (key === "sellersInfo") {
          // Explicitly stringify the sellersInfo array
          formData.append(key, JSON.stringify(value)); // stringify sellersInfo array
        }
        else if (key === "sharedAgent") {
          formData.append(key, JSON.stringify(value)); // stringify sellersInfo array
        }
        else if (key === "listingType") {
          // Skip appending listingType here, will set it below
          continue;
        }
        else {
          
          formData.append(key, value); // Append text or other non-file data
        }
      }
    }

    formData.set('listingType', 'mere_listing');


    // setBtnLoading(data.saveBtn); // Start loading state

    try {
      const isDraft = data.saveBtn === "save-draft";
      const requestData = isDraft ? { ...data, status: "draft" } : data;

      const response = await createUpdateFullPropertyListingData({
        data: formData,
        uuid,
      }).unwrap();
      let responseUuid=response?.data?.propertyListingData?.uuid;

      // Show success message
      toast.success(`${response?.message}`);
      setIsUploadLoading(false);

      let navigatePath = "";
      switch (data.saveBtn) {
        case "save-next":
          navigatePath = `/dashboard/super-admin/property-listing/paperwork-attachment-upload/${response?.data?.propertyListingData?.uuid}`;
          break;
        case "save-exit":
          await changePropertyListingStatus({
            data: {
              status:propertiesData?.status || 'draft',
            },
            uuid: responseUuid,
          }).unwrap();
          navigatePath = `/dashboard/super-admin/property-mere-listing`;
          break;
        case "save-draft":
          await changePropertyListingStatus({
            data: {
              status:'draft',
            },
            uuid: responseUuid,
          }).unwrap();
          navigatePath = `/dashboard/super-admin/property-mere-listing`;
          break;
        default:
          break;
      }

      // Navigate to the determined path
      if (navigatePath) {
        navigate(navigatePath, { replace: true });
      }
    } catch (error: any) {
      // Handle error
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
      setIsUploadLoading(false);
    }

    // // Reset loading state
    // setBtnLoading("");
  };

  const resetForm = () => {
    reset();
    toast.success("Successfully Reset!");
  };

  const cancelSubmit = () => {
    toast.error("You are canceling the creation of the trade sheet!");
    navigate(`/dashboard/super-admin/property-mere-listing`, { replace: true });
  };

  const handleAgentChange = (selectedOption: any) => {
    // console.log('selectedOption',selectedOption)
    if (selectedOption) {
      setSelectedAgentId(selectedOption?.value);
      setValue("agentId", selectedOption?.value);
      // setAgentIdSet(selectedOption?.value);
    }
  };
  const handleSharedAgentChange = (selectedOptions: any) => {
    setSelectedShareAgent(selectedOptions);
    setValue("sharedAgent",selectedOptions.map((option: any) => option));
    // console.log('getValues',getValues('sharedAgent'));
  };

  const saveAndNextFunction = () => {
    setValue("saveBtn", "save-next");
  };

  // Handler for file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0]; // Selected file
    if (file) {
      setValue("firstPicture", file); // Update react-hook-form state manually
    }
  };
  const handleFileChangeListingAgreement = (e) => {
    const file = e.target.files[0]; // Selected file
    if (file) {
      setValue("listingAgreement", file); // Update react-hook-form state manually
    }
  };
  const handleFileChangeMls = (e) => {
    const file = e.target.files[0]; // Selected file
    if (file) {
      setValue("mlsDataSheet", file); // Update react-hook-form state manually
    }
  };
  const handleFileChangeReco = (e) => {
    const file = e.target.files[0]; // Selected file
    if (file) {
      setValue("recoGuide", file); // Update react-hook-form state manually
    }
  };

  const handleCityChange = (selectedOptions: any) => {
    setSelectedCityId(selectedOptions.value);
    setValue("cityId",selectedOptions.value);
    // console.log('getValues',getValues('sharedAgent'));
  };
  

  const addSeller = () => {
    setSellers([...sellers, { id: Date.now() }]);
  };

  const removeSeller = (id: number) => {
    setSellers(sellers.filter((seller) => seller.id !== id));
  };

  return (
    <div>
      <h2 className="uppercase text-center bg-[#c9c1c13d] py-5">
        PROPERTY LISTING
      </h2>
      <PropertyListingSteps active={1} uuid={uuid} />

      <div className="max-w-full mt-0 p-2 border border-gray-300/30  rounded-md  border-2 mb-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Property Details: */}
          <div className="max-FULL  p-6 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <h3 className="py-2 font-bold">Property Details:</h3>
              <Link
                to="/dashboard/super-admin/property-mere-listing"
                className="primary-btn mx-3 mt-2"
              >
                Go Back
              </Link>
            </div>
            {user?.userType === "superAdmin" && (
              <div className="flex flex-col gap-2 mb-4">
                <label htmlFor="">Select Listing Agent</label>
                <Select
                  {...register("agentId", { required: false })}
                  options={agentOptions}
                  classNamePrefix="select"
                  className={`react-select ${
                    errors.agentId ? "border-red-500" : ""
                  }`}
                  onChange={(selectedOption) =>
                    {
                      handleAgentChange(selectedOption)
                      setAgentIdSet(selectedOption?.value)
                    }
                  }
                  value={agentOptions.find(
                    (option: any) => option.value === selectedAgentId
                  )}
                  isClearable // Allow clearing the selection
                />
              </div>
            )}
            <div className="flex flex-col gap-2 mb-2">
              <label>
                Share multiple Agent from list:{" "}
                <span className="text-xs text-gray-500">
                  (Note: If you share an agent in the property listing, they
                  will also be able to view the property listing. Please ensure
                  this is intentional.)
                </span>
              </label>

              <Select
                // {...register("sharedAgent", {
                //   required: "Multiple Representation is required",
                // })}
                options={updatedAgentOptions}
                isMulti
                value={selectedShareAgent}
                onChange={handleSharedAgentChange}
                classNamePrefix="react-select"
                // isDisabled={!selectedMainCategory}
              />
              {errors.subcategories && (
                <p className="text-red-500 text-sm">
                  {errors.subcategories.message}
                </p>
              )}
            </div>
            <div className="max-FULL mb-2">
              <h3 className="py-2">Seller's Information:</h3>
              <div className="flex flex-col gap-2">
                {sellers.map((seller, index) => (
                  <div key={seller.id} className="flex flex-col gap-4">
                    <h3 className="text-sm font-semibold">
                      Seller {index + 1}
                    </h3>
                    <div className="flex items-end gap-4">
                      <div className="w-full flex gap-5">
                        <div className="w-full">
                          <TextInput
                            label="First Name"
                            register={register}
                            required={index === 0}
                            name={`seller${index + 1}FirstName`}
                            errors={errors}
                          />
                        </div>
                        <div className=" w-full">
                          <TextInput
                            label="Last Name"
                            register={register}
                            required={index === 0}
                            name={`seller${index + 1}LastName`}
                            errors={errors}
                          />
                        </div>
                        <div className=" w-full">
                          <TextInput
                            label="Email"
                            register={register}
                            required={false}
                            name={`seller${index + 1}Email`}
                            errors={errors}
                          />
                        </div>
                        <div className="w-full">
                          {/* <TextInput
                            label="Phone Number"
                            register={register}
                            required={index === 0}
                            name={`seller${index + 1}PhoneNumber`}
                            errors={errors}
                          /> */}

                          <label>
                            Phone Number
                          </label>
                          <input
                            {...register(`seller${index + 1}PhoneNumber`)}
                            type="text"
                            placeholder="+1 (XXX) XXX-XXXX"
                            className="border border-gray-300 p-2 rounded"
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              const formattedPhoneNumber = formatPhoneNumber(
                                e.target.value
                              );
                              setValue(
                                `seller${index + 1}PhoneNumber`,
                                formattedPhoneNumber
                              );
                            }}
                          />

                          {errors[`seller${index + 1}PhoneNumber`] && (
                            <p className="text-red-500 text-sm">{`Buyer Phone Number is required`}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        {sellers.length > 1 && (
                          <Button
                            type="link"
                            icon={<MinusCircleOutlined />}
                            className="text-red-500"
                            onClick={() => removeSeller(seller.id)}
                          ></Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button
                    type="dashed"
                    icon={<PlusCircleOutlined />}
                    onClick={addSeller}
                  >
                    Add Another Seller
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
              {/* MLS # */}
              <TextInput
                label="MLS #"
                register={register}
                required={false}
                name="mlsNumber"
                errors={errors}
              />
              <div className="flex flex-col gap-2">
                <label>
                  Listing Type <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      {...register("propertyListingType", {
                        required: "Listing Type is required",
                      })}
                      type="radio"
                      value="For sale"
                      className="mr-2"
                    />
                    For sale
                  </label>
                  <label className="flex items-center">
                    <input
                      {...register("propertyListingType", {
                        required: "Listing Type is required",
                      })}
                      type="radio"
                      value="For rent"
                      className="mr-2"
                    />
                    For rent
                  </label>
                </div>
                {errors.propertyListingType && (
                  <p className="text-red-500 text-sm">
                    Please select an option
                  </p>
                )}
              </div>
              <div>
                <label>
                  Province <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  {...register("stateId", {
                    required: "Province is required",
                  })}
                >
                  <option value="">Select Province</option>
                  {states?.data?.states?.map((state: any) => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </select>
                {/* Error message for Province */}
                {errors.stateId && (
                  <p className="text-red-500">{errors.stateId.message}</p>
                )}
              </div>

              <div>
                <label>
                  City <span className="text-red-500 ml-1">*</span>
                </label>
                {/* <select
                  {...register("cityId", { required: "City is required" })}
                >
                  <option value="">Select City</option>
                  {cities?.data?.cities?.map((city: any) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select> */}
                <Controller
                  name="cityId"
                  control={control}
                  rules={{ required: "City is required" }}
                  render={({ field, fieldState }) => (
                    <>
                      <Select
                        {...field}
                        options={citiesOption}
                        placeholder="Select City"
                        value={citiesOption.find(
                          (option: any) => option.value === selectedCityId
                        )}
                        onChange={handleCityChange}
                        isClearable
                      />
                      {fieldState?.error && (
                        <p className="text-red-500">
                          {fieldState.error.message}
                        </p>
                      )}
                    </>
                  )}
                />
                {/* Error message for City */}
                {/* {errors.cityId && (
                  <p className="text-red-500">{errors.cityId.message}</p>
                )} */}
              </div>

              <div className="w-full">
                <label htmlFor="fname">
                  Postal Code <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  {...register("postalCode", {
                    required: "Postal code is required",
                  })}
                  defaultValue={propertiesData?.postalCode}
                  placeholder="XXX XXX"
                  type="text"
                  id="fname"
                  className="w-full"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setValue("postalCode", formatPostalCode(e.target.value));
                  }}
                />
                {/* Error message for Postal Code */}
                {errors.postalCode && (
                  <p className="text-red-500">{errors.postalCode.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="address">
                  Address <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  {...register("address", {
                    required: "Address is required",
                  })}
                  defaultValue={propertiesData?.address}
                  type="text"
                  id="address"
                  className="w-full"
                />
                {errors.address && (
                  <p className="text-red-500">{errors.address.message}</p>
                )}
              </div>

              {/* <div>
                <label htmlFor="address">
                  Address <span className="text-red-500 ml-1">*</span>
                </label>

                <Select
                  inputId="address-select"
                  options={suggestions}
                  onInputChange={(newQuery) => setQuery(newQuery)} // Update query state on input change
                  onChange={handleSelectionChange} // Handle selection change
                  value={
                     defaultAddressValue
                  } // Set the current selected address value
                  getOptionLabel={(e) => (
                    <>
                      <div>{e.label}</div>
                      <small>{e.description}</small>
                    </>
                  )}
                  placeholder="Start typing an address..."
                  noOptionsMessage={() => "No suggestions available"}
                  isSearchable
                  isClearable
                  classNamePrefix="react-select"
                />

                {errors.address && (
                  <p className="text-red-500">{errors.address.message}</p>
                )}
              </div> */}

              <div>
                <label htmlFor="addressTwo">Address 2</label>
                <input
                  {...register("addressTwo")}
                  defaultValue={propertiesData?.addressTwo}
                  type="text"
                  id="addressTwo"
                  className="w-full"
                />
              </div>

              {/* Sold Price */}
              <TextInput
                label="Lockbox"
                register={register}
                name="lockbox"
                errors={errors}
              />

              {/* <TextInput
                label="Seller’s name"
                register={register}
                name="sellerName"
                errors={errors}
              />

              <TextInput
                label="Seller’s phone number"
                register={register}
                name="sellerPhoneNumber"
                errors={errors}
              /> */}
              <TextInput
                label="Listing Price"
                register={register}
                required
                name="listingPrice"
                errors={errors}
                type="number"
              />

              <DateInput
                label="Contract date"
                required={false} // This will make the field optional
                control={control}
                name="contractDate"
                errors={errors}
              />

              <DateInput
                label="Expiry date"
                required
                control={control}
                name="expiryDate"
                errors={errors}
              />

              <DateInput
                label="Offer date (if any)"
                required={false} // This will make the field optional
                control={control}
                name="offerDate"
                errors={errors}
              />

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

              <SelectInput
                label="Property type"
                required
                register={register}
                name="propertyType"
                errors={errors}
                // options={[
                //   { value: "Bungalow", label: "Bungalow" },
                //   { value: "2 Storey", label: "2 Storey" },
                //   { value: "Freehold Townhome", label: "Freehold Townhome" },
                //   { value: "Condo Apt", label: "Condo Apt" },
                //   { value: "Condo Townhome", label: "Condo Townhome" },
                //   { value: "Other", label: "Other" },
                // ]}
                options={[
                  { value: "Detached", label: "Detached" },
                  { value: "Semi Detached", label: "Semi Detached" },
                  { value: "Freehold Townhome", label: "Freehold Townhome" },
                  { value: "Condo Apt", label: "Condo Apt" },
                  { value: "Condo Townhome", label: "Condo Townhome" },
                  { value: "Other", label: "Other" },
                ]}
              />

              {selectedPropertyType === "Other" && (
                <TextInput
                  label="Write other property type"
                  register={register}
                  name="otherPropertyType"
                  errors={errors}
                />
              )}

              <SelectInput
                label="Listing Status"
                required
                register={register}
                name="listingStatus"
                errors={errors}
                // options={[
                //   { value: "Available", label: "Available" },
                //   { value: "Cond.sale/Pending", label: "Cond.sale/Pending" },
                //   { value: "Expired", label: "Expired" },
                //   { value: "Firm sale/Pending", label: "Firm sale/Pending" },
                //   { value: "Off Market", label: "Off Market" },
                //   { value: "Rented/Leased", label: "Rented/Leased" },
                //   { value: "Sold/Closed", label: "Sold/Closed" },
                //   { value: "Withdrawn", label: "Withdrawn" },
                // ]}
                options={[
                  { value: "listed", label: "Listed" },
                  { value: "sold", label: "Sold" },
                  { value: "leased", label: "Leased" },
                  { value: "terminated", label: "Terminated" },
                  { value: "suspended", label: "Suspended" },
                  { value: "extended", label: "Extended" },
                  { value: "expired", label: "Expired" },
                  { value: "dft", label: "DFT" },
                  // { value: "closed", label: "Closed" },
                  { value: "exclusive", label: "Exclusive" },
                ]}
              />
            </div>
            <div className=" mt-5 border-x rounded-lg">
              <div className="w-full py-2 border-t hover:bg-[#f8f8f8e3] px-3 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <p>
                      Upload: At least one picture (should show on the list)
                    </p>
                    {propertiesData.firstPicturePath && (
                      <p>
                        <a
                          href={getFileUrl(propertiesData.firstPicturePath)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline hover:text-blue-700"
                        >
                          {propertiesData.firstPicturePath.split(/[/\\]/).pop()}
                        </a>
                      </p>
                    )}
                    {firstPictureFile?.[0]?.name && (
                      <p>{firstPictureFile[0].name}</p>
                    )}
                  </div>
                  <label htmlFor="upload">
                    <input
                      type="file"
                      id="upload"
                      name="firstPicture"
                      className="file-input hidden"
                      accept="image/*" // Restrict to image files only
                      onChange={handleFileChange}
                      {...register("firstPicture")}
                    />
                    <img className=" cursor-pointer" src={uploadIcon} alt="" />
                  </label>
                </div>
                {errors.picture && (
                  <p className="text-red-500 text-sm">
                    {errors.picture.message}
                  </p>
                )}
              </div>
            </div>
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
              {btnLoading == "save-draft" ? <ButtonLoader /> : "Save as Draft"}
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

      {/* Form */}
    </div>
  );
};

export default CreateUpdatePropertyListing;
