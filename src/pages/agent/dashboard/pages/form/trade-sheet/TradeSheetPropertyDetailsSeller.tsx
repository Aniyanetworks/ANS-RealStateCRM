/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { useParams, useNavigate, Link, NavLink } from "react-router-dom";
import toast from "react-hot-toast";
import ButtonLoader from "../../../../../../components/loader/buttonLoader";
import { useAppSelector } from "../../../../../../redux/hooks";
import TableLoader from "../../../../../../components/loader/TableLoader";
import {
  useGetSpacificTradeSheetListDataQuery,
  useCreateUpdatePropertyDetailsMutation,
} from "../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice";
import {
  useGetCitiesQuery,
  useGetStatesQuery,
} from "../../../../../../redux/api/common/countryStateCitySlice";
import {
  useCreateUpdateFullPropertyListingDataOnTradesheetMutation,
  useGetSpacificPropertyListingQuery,
} from "../../../../../../redux/api/superadmin/propertyListingDataSlice";
import { getFileUrl } from "../../../../../../utils/constant";
import TradeSheetSteps from "../../../../../../components/Stepper/TradeSheetSteps";
import { formatPostalCode } from "../../../../../../utils/format";
import moment from "moment";
import ConditionalSection from "../../../../../../components/ConditionalSection";
const TextInput = ({
  label,
  register,
  required,
  name,
  errors,
  type = "text",
  placeholder = "",
}: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>

    <input
      {...register(name, { required })}
      type={type}
      placeholder={placeholder}
      className="border border-gray-300 p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
    {errors[name] && (
      <p className="text-red-500 text-xs">{`${label} is required`}</p>
    )}
  </div>
);

const DateInput = ({ label, control, name, errors, required }: any) => (
  <div className="flex flex-col gap-0">
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
  <div className="flex flex-col gap-0">
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

const RadioGroup = ({ label, register, name, errors, options = [], required = false }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="flex gap-4 flex-wrap">
      {options.map((option: any, index: number) => (
        <label key={index} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            {...register(name, { required: required ? `${label} is required` : false })}
            value={option.value}
            className="cursor-pointer w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
    {errors[name] && (
      <p className="text-red-500 text-xs">{`${label} is required`}</p>
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

const TradeSheetPropertyDetailsSeller = () => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid?: string }>();
  const [btnLoading, setBtnLoading] = useState("");
  const [propertiesData, setPropertiesData] = useState([]);
  const {
    data: spacificTradeSheetListData,
    isLoading: isLoadingTradeSheetList,
  } = useGetSpacificTradeSheetListDataQuery(uuid);
  const { data, isLoading } = useGetSpacificPropertyListingQuery(uuid);
  const { tradeSheetRepresentationData } = useAppSelector(
    (state: any) => state.user
  );
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
  const linkedPropertyListing = spacificTradeSheetListData?.data?.tradeSheetData?.propertyListing;
  const tradeRepresentation = spacificTradeSheetListData?.data?.tradeSheetData?.representation;
  const isSellerLandlord =
    tradeRepresentation === "seller" || tradeRepresentation === "landlord";
  const isLockedFromListing = isSellerLandlord && !!linkedPropertyListing;

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
    if (
      spacificTradeSheetListData?.data?.tradeSheetData?.properties.length > 0
    ) {
      const properties =
        spacificTradeSheetListData?.data?.tradeSheetData?.properties;
      setPropertiesData(properties);
      if (properties && properties.length > 0) {
        const listing = spacificTradeSheetListData?.data?.tradeSheetData?.propertyListing;
        const rep = spacificTradeSheetListData?.data?.tradeSheetData?.representation;
        const lockedAddress =
          listing && (rep === "seller" || rep === "landlord")
            ? {
                address: [listing.address, listing.addressTwo].filter(Boolean).join(", ") || listing.address,
                postalCode: listing.postalCode,
                ...(listing.stateId ? { stateId: listing.stateId } : {}),
                ...(listing.cityId ? { cityId: listing.cityId } : {}),
              }
            : {};
        const processedProperty = {
          ...properties[0],
          ...lockedAddress,
          offerDate: formatDate(properties[0]?.offerDate),
          acceptanceDate: formatDate(properties[0]?.acceptanceDate),
          closingDate: formatDate(properties[0]?.closingDate),
          depositDate: formatDate(properties[0]?.depositDate),
          firmDate: formatDate(properties[0]?.firmDate),
          conditionExpiryDate: formatDate(properties[0]?.conditionExpiryDate),
          createdAt: formatDate(properties[0]?.createdAt),
        };
        reset(processedProperty);
      }
    } else {
      const properties =
        spacificTradeSheetListData?.data?.tradeSheetData?.propertyListing;
      if (properties) {
        setPropertiesData(properties);
      }

      if (properties) {
        const combinedAddress = [properties.address, properties.addressTwo]
          .filter(Boolean)
          .join(", ");
        const processedProperty = {
          ...properties,
          address: combinedAddress || properties.address,
          contractDate: formatDate(properties?.contractDate),
          expiryDate: formatDate(properties?.expiryDate),
          offerDate: formatDate(properties?.offerDate),
        };
        reset(processedProperty);
        setValue("uuid", processedProperty?.uuid);
      }
    }
  }, [reset, spacificTradeSheetListData, setPropertiesData]);

  useEffect(() => {
    const listing = spacificTradeSheetListData?.data?.tradeSheetData?.propertyListing;
    const rep = spacificTradeSheetListData?.data?.tradeSheetData?.representation;
    const hasCities = cities?.data?.cities?.length > 0;
    if ((rep === "seller" || rep === "landlord") && listing?.cityId && hasCities) {
      setValue("cityId", listing.cityId);
    }
  }, [cities, spacificTradeSheetListData, setValue]);

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

  const [createUpdateFullPropertyListingDataOnTradesheet] =
    useCreateUpdateFullPropertyListingDataOnTradesheetMutation();
  const [createUpdatePropertyDetails] =
    useCreateUpdatePropertyDetailsMutation();

  if (isCityLoading || isLoading) {
    return <TableLoader />;
  }
  if (!propertiesData) {
    return <TableLoader />;
  }

  const onSubmit = async (data: any) => {
    setBtnLoading(data.saveBtn);

    try {
      const isDraft = data.saveBtn === "save-draft";
      const requestData = isDraft ? { ...data, status: "draft" } : { ...data };
      if (spacificTradeSheetListData?.data?.tradeSheetData?.listType === "Commercial") {
        requestData.salesPriceType = data.listingPriceType ?? null;
        requestData.salesPriceUnit = data.listingPriceUnit ?? null;
      } else {
        requestData.listingPriceType = null;
        requestData.listingPriceUnit = null;
        requestData.salesPriceType = null;
        requestData.salesPriceUnit = null;
      }

      const response = await createUpdatePropertyDetails({
        data: requestData,
        uuid,
      }).unwrap();

      toast.success(`${response?.message}`);

      let navigatePath = "";
      switch (data.saveBtn) {
        case "save-next":
          navigatePath = `/dashboard/agent/pages/form/trade-sheet/seller-information/${uuid}`;
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
    }

    setBtnLoading("");
  };

  const resetForm = () => {
    reset();
    toast.success("Successfully Reset!");
  };

  const cancelSubmit = () => {
    toast.error("You are canceling the creation of the trade sheet!");
    navigate(`/dashboard/super-admin/property-listing`, { replace: true });
  };

  const tradeSheetId = spacificTradeSheetListData?.data?.tradeSheetData?.id;
  const listType = spacificTradeSheetListData?.data?.tradeSheetData?.listType;
  const isListCommercial = listType === "Commercial";

  return (
    <div>
      <TradeSheetSteps active={2} uuid={uuid} />

      <div className="max-w-full mt-8 p-8 border border-gray-300/30 rounded-md  border-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="max-FULL  p-6 bg-[#c9c1c13d] rounded-lg shadow-md">
            <h3 className="py-2">Property Details:</h3>
            {isLockedFromListing && (
              <div className="col-span-full mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                Address fields are locked to match the selected property listing.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
              <div className="w-full">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    MLS # <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    {...register("mlsNumber", { required: "MLS # is required" })}
                    type="text"
                    readOnly={isLockedFromListing}
                    className={`border border-gray-300 p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent${isLockedFromListing ? " bg-gray-100 cursor-not-allowed text-gray-600" : ""}`}
                  />
                  {errors.mlsNumber && <p className="text-red-500 text-xs">MLS # is required</p>}
                </div>
              </div>
              <div>
                <label>
                  Province <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  {...register("stateId", {
                    required: "Province is required",
                  })}
                  disabled={isLockedFromListing}
                  className={isLockedFromListing ? "bg-gray-100 cursor-not-allowed text-gray-600 w-full border border-gray-300 rounded p-2" : undefined}
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
                <select
                  {...register("cityId", { required: "City is required" })}
                  disabled={isLockedFromListing}
                  className={isLockedFromListing ? "bg-gray-100 cursor-not-allowed text-gray-600 w-full border border-gray-300 rounded p-2" : undefined}
                >
                  <option value="">Select City</option>
                  {cities?.data?.cities?.map((city: any) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {errors.cityId && (
                  <p className="text-red-500">{errors.cityId.message}</p>
                )}
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
                  readOnly={isLockedFromListing}
                  className={`w-full${isLockedFromListing ? " bg-gray-100 cursor-not-allowed text-gray-600" : ""}`}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (!isLockedFromListing)
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
                  readOnly={isLockedFromListing}
                  className={`w-full${isLockedFromListing ? " bg-gray-100 cursor-not-allowed text-gray-600" : ""}`}
                />
                {errors.address && (
                  <p className="text-red-500">{errors.address.message}</p>
                )}
              </div>

              <div className="col-span-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className={isListCommercial ? "border border-gray-200 rounded-lg p-3 bg-gray-50" : ""}>
                    <div className="space-y-3">
                      <TextInput
                        label="Listing Price"
                        register={register}
                        name="listingPrice"
                        errors={errors}
                      />
                      {isListCommercial && (
                        <div className="grid grid-cols-2 gap-3">
                          <RadioGroup
                            label="Price Type"
                            register={register}
                            name="listingPriceType"
                            errors={errors}
                            required
                            options={[
                              { value: "net", label: "Net Price" },
                              { value: "gross", label: "Gross Price" },
                            ]}
                          />
                          <RadioGroup
                            label="Price Unit"
                            register={register}
                            name="listingPriceUnit"
                            errors={errors}
                            required
                            options={[
                              { value: "perSquareFoot", label: "Per Square Foot" },
                              { value: "monthlyRent", label: "Monthly Rent" },
                            ]}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={isListCommercial ? "border border-gray-200 rounded-lg p-3" : ""}>
                    <div className="space-y-3">
                      <TextInput
                        label="Sales Price"
                        register={register}
                        name="salesPrice"
                        errors={errors}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DateInput
                label="Offer date (if any)"
                required={false}
                control={control}
                name="offerDate"
                errors={errors}
              />

              <DateInput
                label="Acceptance Date"
                required
                control={control}
                name="acceptanceDate"
                errors={errors}
              />

              <DateInput
                label="Closing Date"
                required
                control={control}
                name="closingDate"
                errors={errors}
              />



              {tradeSheetRepresentationData === "seller" && (
                <SelectInput
                  label="Continue Showings"
                  required
                  register={register}
                  name="continueShowings"
                  errors={errors}
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                  ]}
                />
              )}

              <TextInput
                label="Deposit Amount"
                register={register}
                required
                name="depositAmount"
                errors={errors}
                type="number"
              />

              <DateInput
                label="Deposit Date"
                required
                control={control}
                name="depositDate"
                errors={errors}
              />

              {tradeSheetRepresentationData === "seller" && (
                <SelectInput
                  label="Update MLS Status"
                  required
                  register={register}
                  name="updateMLSStatus"
                  errors={errors}
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "notapplicable", label: "N/A" },
                  ]}
                />
              )}

              <SelectInput
                label="Conditional"
                required
                register={register}
                name="conditional"
                errors={errors}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
              />

              {conditionalValue === "no" && (
                <DateInput
                  label="FIRM Date"
                  required
                  control={control}
                  name="firmDate"
                  errors={errors}
                />
              )}
            </div>
            <ConditionalSection
              tradeSheetId={tradeSheetId}
              isConditional={conditionalValue === "yes"}
            />
          </div>
          <div className="flex justify-between my-15 mx-5">
            <button
              type="submit"
              onClick={() => {
                setValue("saveBtn", "save-next");
              }}
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

            <NavLink
              to={`/dashboard/agent/pages/form/trade-sheet/agent-basic-info/${uuid}`}
              className="primary-btn flex-1 mx-2 my-2 text-center"
            >
              Go Back
            </NavLink>

            <button
              type="button"
              onClick={resetForm}
              className="primary-btn flex-1 mx-2 my-2"
            >
              Reset Form
            </button>

            <button
              onClick={cancelSubmit}
              type="button"
              className="primary-btn flex-1 mx-2 my-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default TradeSheetPropertyDetailsSeller;
