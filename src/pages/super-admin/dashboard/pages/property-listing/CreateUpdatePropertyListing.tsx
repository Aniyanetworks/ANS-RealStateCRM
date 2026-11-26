/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import {
  useEffect,
  useState,
} from 'react';

import { Button } from 'antd';
import {
  format,
  set,
} from 'date-fns';
import moment from 'moment';
import {
  Controller,
  useForm,
} from 'react-hook-form';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';
import Select from 'react-select';

import {
  MinusCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';

import uploadIcon from '../../../../../assets/upload2.svg';
import ButtonLoader from '../../../../../components/loader/buttonLoader';
import TableLoader from '../../../../../components/loader/TableLoader';
import PropertyListingSteps
  from '../../../../../components/Stepper/PropertyListingSteps';
import {
  useCreateUpdatePropertyDetailsMutation,
  useGetSpacificTradeSheetListDataQuery,
} from '../../../../../redux/api/agent/trade-sheet/tradeSheetSlice';
import {
  useGetCitiesQuery,
  useGetStatesQuery,
} from '../../../../../redux/api/common/countryStateCitySlice';
import {
  useGetAgentListDataQuery,
} from '../../../../../redux/api/superadmin/agent/agentManagementSlice';
import {
  useGetActiveBranchListDataQuery,
} from '../../../../../redux/api/superadmin/branch/Branchmanagementslice';
import {
  useChangePropertyListingStatusMutation,
  useCreateUpdateFullPropertyListingDataMutation,
  useGetSpacificPropertyListingQuery,
} from '../../../../../redux/api/superadmin/propertyListingDataSlice';
import { useAppSelector } from '../../../../../redux/hooks';
import { getFileUrl } from '../../../../../utils/constant';
import {
  formatPhoneNumber,
  formatPostalCode,
} from '../../../../../utils/format';

const COMMERCIAL_PROPERTY_TYPES = [
  "Farm",
  "Industrial",
  "Investment",
  "Land",
  "Office",
  "Sale Of Business",
  "Store with Apt/Office",
];
const RESIDENTIAL_PROPERTY_TYPES = [
  "Detached",
  "Semi Detached",
  "Freehold Townhome",
  "Condo Apt",
  "Condo Townhome",
  "Residential Freehold",
  "Other",
];

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

const CreateUpdatePropertyListing = () => {
  const { data: agentList } = useGetAgentListDataQuery("");
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [agentIdSet, setAgentIdSet] = useState(null);
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid?: string }>();
  const [btnLoading, setBtnLoading] = useState("");
  const [propertiesData, setPropertiesData] = useState([]);
  const { data, isLoading } = useGetSpacificPropertyListingQuery(uuid);
  const { tradeSheetRepresentationData } = useAppSelector(
    (state: any) => state.user
  );
  const [selectedShareAgent, setSelectedShareAgent] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedCityId, setSelectedCityId] = useState<
    { value: string; label: string }[]
  >([]);
  const [sellers, setSellers] = useState([{ id: Date.now() }]);
  const { user } = useSelector((state: any) => state.user);
  const isSuperAdmin = user?.roleId == 1;

  const { data: activeBranches } = useGetActiveBranchListDataQuery("", {
    skip: !isSuperAdmin,
  });
  const [isUploadLoading, setIsUploadLoading] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState({
    firstPicture: "",
    listingAgreement: "",
    mlsDataSheet: "",
    recoGuide: "",
  });
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
  const selectedAddressTwo = watch("addressTwo");
  const selectedPropertyType = watch("propertyType");
  const propertyListingType = watch("propertyListingType");
  const listType = watch("listType");

  const firstPictureFile = watch("firstPicture");
  const listingAgreementFile = watch("listingAgreement");
  const mlsDataSheetFile = watch("mlsDataSheet");
  const recoGuideFile = watch("recoGuide");

  const [defaultAddressValue, setDefaultAddressValue] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (query.length > 0) {
      fetch(
        `https://ws1.postescanada-canadapost.ca/Capture/Interactive/Find/v1.00/json3ex.ws?Key=TF36-KU97-AB94-ZC85&Text=${query}&Container=&Origin=CAN&Countries=&Datasets=&Limit=7&Filter=&Language=en&$block=true&$cache=true&SOURCE=PCA-SCRIPT&SESSION=ebb3da4f-a6ab-56cc-2b04-a54c42bb58a2`
      )
        .then((response) => response.json())
        .then((data) => {
          const formattedSuggestions = data.Items.map((item) => ({
            label: item.Text,
            value: item.Text,
            description: item.Description,
            id: item.Id,
          }));
          setSuggestions(formattedSuggestions);
        })
        .catch((error) =>
          console.error("Error fetching address suggestions:", error)
        );
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSelectionChange = (selectedOption) => {
    setQuery(selectedOption?.value || "");
    fetchAddressDetails(selectedOption.id);
  };

  const fetchAddressDetails = (addressId) => {
    fetch(
      `https://ws1.postescanada-canadapost.ca/Capture/Interactive/Retrieve/v1.00/json3ex.ws?Key=TF36-KU97-AB94-ZC85&Id=${addressId}&Source=&$cache=true&SOURCE=PCA-SCRIPT&SESSION=392d4c2e-6cf0-a3de-259c-d62903ad50c5`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.Items && data.Items.length > 0) {
          const firstItem = data.Items[0];

          const formattedSuggestions = [
            {
              label: firstItem.Label,
              value: firstItem.Label,
              postalCode: firstItem.PostalCode,
              provinceName: firstItem.ProvinceName,
              cityName: firstItem.City,
            },
          ];

          setDefaultAddressValue(formattedSuggestions);
          setValue("postalCode", formattedSuggestions?.[0]?.postalCode);
          const provinceName = formattedSuggestions?.[0]?.provinceName;
          const cityName = formattedSuggestions?.[0]?.cityName;
          const selectedState = states?.data?.states?.find(
            (state) => state.name == provinceName
          )?.id;
          const selectedCity = cities?.data?.cities?.find(
            (city) => city.name == cityName
          )?.id;
          setSelectedCityId(selectedCity);
          setValue("stateId", selectedState);
        }
      })
      .catch((error) =>
        console.error("Error fetching address details:", error)
      );
  };

  const { data: states = [] } = useGetStatesQuery(selectedCountry, {
    skip: !selectedCountry,
  });

  const { data: cities = [], isLoading: isCityLoading } = useGetCitiesQuery(
    selectedState,
    {
      skip: !selectedState,
    }
  );

  const citiesOption =
    cities?.data?.cities?.map(
      (city: { id: string | number; name: string }) => ({
        value: city.id,
        label: city.name,
      })
    ) || [];

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
    if (option?.value === selectedAgentId) {
      return { ...option, isDisabled: true };
    }
    if (option?.value === user?.id) {
      return { ...option, isDisabled: true };
    }
    return option;
  });

  const conditionalValue = watch("conditional");
  const conditionalOptionValue = watch("conditionalOption");

  useEffect(() => {
    const current = getValues("propertyType");
    const validList =
      listType === "Commercial"
        ? COMMERCIAL_PROPERTY_TYPES
        : RESIDENTIAL_PROPERTY_TYPES;
    if (current && validList.length && !validList.includes(current)) {
      setValue("propertyType", "");
    }
  }, [listType, setValue, getValues]);

  useEffect(() => {
    const properties = data?.data?.propertyListingData;
    if (data?.data?.propertyListingData) {
      setPropertiesData(properties);
    }

    if (data?.data?.propertyListingData) {
      setSelectedAgentId(data?.data?.propertyListingData?.createdBy);
      setValue("agentId", data?.data?.propertyListingData?.createdBy);

      setSelectedCityId(data?.data?.propertyListingData?.cityId);

      const branchId = data?.data?.propertyListingData?.branchId ||
        (!isSuperAdmin && user?.branchId ? user.branchId : undefined);

      const processedProperty = {
        ...properties,
        contractDate: formatDate(properties?.contractDate),
        expiryDate: formatDate(properties?.expiryDate),
        offerDate: formatDate(properties?.offerDate),
        addressTwo: properties?.addressTwo || "",
        lockbox: properties?.lockbox || "",
        branchId: branchId,
      };
      reset(processedProperty);


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
      if (
        data?.data?.propertyListingData?.sharedUsers &&
        data?.data?.propertyListingData?.sharedUsers.length > 0
      ) {
        const multipleShareAgentValues =
          data?.data?.propertyListingData?.sharedUsers;
        const selectedShareAgent = multipleShareAgentValues
          .map((value) => {
            return agentOptions.find(
              (item) => item.value === value.sharedUserId
            );
          })
          .filter((item) => item !== undefined);

        setSelectedShareAgent(selectedShareAgent);
      }
    }
  }, [data, reset, propertiesData, setPropertiesData, setSelectedAgentId]);

  useEffect(() => {
    setValue("countryId", 39);
    setSelectedAgentId(propertiesData.createdBy);
    setValue("agentId", propertiesData.createdBy);
    if (uuid) {
      setAgentIdSet(propertiesData.createdBy);
    }

    if (!uuid && !isSuperAdmin && user?.branchId) {
      setValue("branchId", user.branchId);
    }

    const stateName =
      states?.data?.states?.find((state) => state.id == selectedState)?.name ||
      "";
    const cityName =
      cities?.data?.cities?.find((city) => city.id == selectedCity)?.name || "";
    const parts = [selectedAddress, selectedAddressTwo, cityName, stateName, selectedPostalCode].filter(Boolean);
    const formattedAddress = parts.join(", ");

    setValue("propertyAddress", formattedAddress);
  }, [
    selectedState,
    selectedCity,
    selectedPostalCode,
    selectedAddress,
    selectedAddressTwo,
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
    setIsUploadLoading(true);
    const sellersInfo = sellers.map((seller, index) => ({
      firstName: data[`seller${index + 1}FirstName`],
      lastName: data[`seller${index + 1}LastName`],
      email: data[`seller${index + 1}Email`],
      phoneNumber: data[`seller${index + 1}PhoneNumber`],
    }));

    const jsonData = {
      sellersInfo: sellersInfo,
    };

    setValue("sellersInfo", jsonData);
    setValue("agentId", agentIdSet);

    const dataData = getValues();
    const formData = new FormData();

    for (const key in dataData) {
      if (dataData.hasOwnProperty(key)) {
        const value = dataData[key];

        if (value instanceof File) {
          formData.append(key, value);

        } else if (value instanceof FileList) {
          Array.from(value).forEach((file) => {
            formData.append(key, file);
          });

        } else if (key === "sellersInfo") {
          formData.append(key, JSON.stringify(value));
        } else if (key === "sharedAgent") {
          formData.append(key, JSON.stringify(value));
        } else if (key === "listingType") {
          continue;
        } else {
          formData.append(key, value);
        }
      }
    }

    formData.set("listingType", "regular");


    try {
      const isDraft = data.saveBtn === "save-draft";
      const requestData = isDraft ? { ...data, status: "draft" } : data;

      const response = await createUpdateFullPropertyListingData({
        data: formData,
        uuid,
      }).unwrap();
      const responseUuid = response?.data?.propertyListingData?.uuid;

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
              status: propertiesData?.status || "draft",
            },
            uuid: responseUuid,
          }).unwrap();
          navigatePath = `/dashboard/super-admin/property-listing`;
          break;
        case "save-draft":
          await changePropertyListingStatus({
            data: {
              status: "draft",
            },
            uuid: responseUuid,
          }).unwrap();
          navigatePath = `/dashboard/super-admin/property-listing`;
          break;
        default:
          break;
      }

      if (navigatePath) {
        navigate(navigatePath, { replace: true });
      }
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
      setIsUploadLoading(false);
    }

  };

  const resetForm = () => {
    reset();
    toast.success("Successfully Reset!");
  };

  const cancelSubmit = () => {
    toast.error("You are canceling the creation of the trade sheet!");
    navigate(`/dashboard/super-admin/property-listing`, { replace: true });
  };

  const handleAgentChange = (selectedOption: any) => {
    if (selectedOption) {
      setSelectedAgentId(selectedOption?.value);
      setValue("agentId", selectedOption?.value);
    }
  };
  const handleSharedAgentChange = (selectedOptions: any) => {
    setSelectedShareAgent(selectedOptions);
    setValue(
      "sharedAgent",
      selectedOptions.map((option: any) => option)
    );
  };

  const saveAndNextFunction = () => {
    setValue("saveBtn", "save-next");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue("firstPicture", file);
    }
  };
  const handleFileChangeListingAgreement = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue("listingAgreement", file);
    }
  };
  const handleFileChangeMls = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue("mlsDataSheet", file);
    }
  };
  const handleFileChangeReco = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue("recoGuide", file);
    }
  };

  const handleCityChange = (selectedOptions: any) => {
    setSelectedCityId(selectedOptions.value);
    setValue("cityId", selectedOptions.value);
  };

  const addSeller = () => {
    setSellers([...sellers, { id: Date.now() }]);
  };

  const removeSeller = (id: number) => {
    setSellers(sellers.filter((seller) => seller.id !== id));
  };

  const showPropertyHeader = uuid && (propertiesData?.propertyListingTypeId || propertiesData?.propertyAddress);

  return (
    <div>
      <div className="bg-[#c9c1c13d] py-5 flex items-center justify-center w-full">
        <h2 className="uppercase text-center m-0 flex-1">
          {showPropertyHeader
            ? `${propertiesData?.propertyListingTypeId || 'N/A'}-${propertiesData?.propertyAddress || 'N/A'}`
            : 'PROPERTY LISTING'}
        </h2>
      </div>
      <PropertyListingSteps active={1} uuid={uuid} />

      <div className="max-w-full mt-0 p-2 border border-gray-300/30  rounded-md  border-2 mb-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="max-FULL  p-6 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <h3 className="py-2 font-bold">Property Details:</h3>
              <Link
                to="/dashboard/super-admin/property-listing"
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
                  className={`react-select ${errors.agentId ? "border-red-500" : ""
                    }`}
                  onChange={(selectedOption) => {
                    handleAgentChange(selectedOption);
                    setAgentIdSet(selectedOption?.value);
                  }}
                  value={agentOptions.find(
                    (option: any) => option.value === selectedAgentId
                  )}
                  isClearable
                />
              </div>
            )}

            {isSuperAdmin ? (
              <div className="flex flex-col gap-2 mb-4">
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
                  <option value="">Select Branch</option>
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
                  <p className="text-xs text-gray-500 mt-1 mb-4">
                    Property listing will be assigned to your branch automatically
                  </p>
                </div>
              </>
            )}

            <div className="flex flex-col gap-2 mb-2 mt-3">
              <label>
                Share multiple Agent from list:{" "}
                <span className="text-xs text-gray-500">
                  (Note: If you share an agent in the property listing, they
                  will also be able to view the property listing. Please ensure
                  this is intentional.)
                </span>
              </label>

              <Select
                options={updatedAgentOptions}
                isMulti
                value={selectedShareAgent}
                onChange={handleSharedAgentChange}
                classNamePrefix="react-select"
              />
              {errors.subcategories && (
                <p className="text-red-500 text-sm">
                  {errors.subcategories.message}
                </p>
              )}
            </div>
            <div className="max-FULL mb-2">
              <h3 className="py-2">
                {propertyListingType === "For rent"
                  ? "Landlord's Information:"
                  : "Seller's Information:"}
              </h3>
              <div className="flex flex-col gap-2">
                {sellers.map((seller, index) => (
                  <div key={seller.id} className="flex flex-col gap-4">
                    <h3 className="text-sm font-semibold">
                      {propertyListingType === "For rent"
                        ? `Landlord ${index + 1}`
                        : `Seller ${index + 1}`}
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

                          <label>Phone Number</label>
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
                    {propertyListingType === "For rent"
                      ? "Add Another Landlord"
                      : "Add Another Seller"}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
              <TextInput
                label="MLS #"
                register={register}
                required={false}
                name="mlsNumber"
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
                {errors.stateId && (
                  <p className="text-red-500">{errors.stateId.message}</p>
                )}
              </div>

              <div>
                <label>
                  City <span className="text-red-500 ml-1">*</span>
                </label>
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

              <TextInput
                label="Lockbox"
                register={register}
                name="lockbox"
                errors={errors}
              />

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
                required={false}
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
                required={false}
                control={control}
                name="offerDate"
                errors={errors}
              />

              

              <SelectInput
                label="Property type"
                required
                register={register}
                name="propertyType"
                errors={errors}
                options={
                  listType === "Commercial"
                    ? COMMERCIAL_PROPERTY_TYPES.map((t) => ({
                        value: t,
                        label: t,
                      }))
                    : RESIDENTIAL_PROPERTY_TYPES.map((t) => ({
                        value: t,
                        label: t,
                      }))
                }
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
                options={[
                  { value: "New", label: "New" },
                  { value: "sold", label: "Sold" },
                  { value: "leased", label: "Leased" },
                  { value: "terminated", label: "Terminated" },
                  { value: "suspended", label: "Suspended" },
                  { value: "extended", label: "Extended" },
                  { value: "expired", label: "Expired" },
                  { value: "dft", label: "DFT" },
                  { value: "Price Change", label: "Price Change" },
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
                      accept="image/*"
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

            <button
              type="submit"
              onClick={saveAndNextFunction}
              className="primary-btn flex-1 mx-2 my-2"
            >
              {btnLoading == "save-next" ? <ButtonLoader /> : "Save and Next"}
            </button>


            <button
              type="submit"
              onClick={() => setValue("saveBtn", "save-exit")}
              {...register("saveBtn")}
              className="primary-btn flex-1 mx-2 my-2"
            >
              {btnLoading == "save-exit" ? <ButtonLoader /> : "Save and Exit"}
            </button>

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
              {btnLoading === "reset" ? <ButtonLoader /> : "Reset Form"}
            </button>

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

    </div>
  );
};

export default CreateUpdatePropertyListing;
