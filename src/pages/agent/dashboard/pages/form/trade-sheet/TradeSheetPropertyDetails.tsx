/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import TradeSheetSteps from "../../../../../../components/Stepper/TradeSheetSteps";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import {
  useCreateUpdatePropertyDetailsMutation,
  useGetSpacificTradeSheetListDataQuery,
} from "../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice";
import toast from "react-hot-toast";
import TableLoader from "../../../../../../components/loader/TableLoader";
import ButtonLoader from "../../../../../../components/loader/buttonLoader";
import { useAppSelector } from "../../../../../../redux/hooks";
import {
  useGetCitiesQuery,
  useGetStatesQuery,
} from "../../../../../../redux/api/common/countryStateCitySlice";
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
  <div className="flex flex-col gap-2">
    <label>
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {console.log(name)}
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

const TradeSheetPropertyDetails = () => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid?: string }>();
  const [btnLoading, setBtnLoading] = useState("");
  const [propertiesData, setPropertiesData] = useState([]);
  const { data, isLoading } = useGetSpacificTradeSheetListDataQuery(uuid);
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
  } = useForm();

  const selectedCountry = 39;
  const selectedState = watch("stateId");
  const selectedCity = watch("cityId");
  const selectedPostalCode = watch("postalCode");
  const selectedAddress = watch("address");

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
    const properties = data?.data?.tradeSheetData?.properties;
    setPropertiesData(properties);
    if (properties && properties.length > 0) {
      const processedProperty = {
        ...properties[0],
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
  }, [data, reset]);

  useEffect(() => {
    const properties = data?.data?.tradeSheetData?.properties;
    const savedCityId = properties?.[0]?.cityId;
    if (
      savedCityId &&
      !isCityLoading &&
      cities?.data?.cities?.some((city: any) => city.id == savedCityId)
    ) {
      setValue("cityId", savedCityId);
    }
  }, [cities, isCityLoading, data, setValue]);

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

  const [createUpdatePropertyDetails] =
    useCreateUpdatePropertyDetailsMutation();

  if (isCityLoading || isLoading) {
    return <TableLoader />;
  }

  const onSubmit = async (data: any) => {
    setBtnLoading(data.saveBtn);

    try {
      const isDraft = data.saveBtn === "save-draft";
      const requestData = isDraft ? { ...data, status: "draft" } : data;

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
    navigate(
      `/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list`,
      { replace: true }
    );
  };

  const saveAndNextFunction = () => {
    setValue("saveBtn", "save-next");
  };

  const tradeSheetId = data?.data?.tradeSheetData?.id;

  return (
    <div>
      <TradeSheetSteps active={2} uuid={uuid} />

      <div className="max-w-full mt-8 p-8 border border-gray-300/30 rounded-md  border-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="max-FULL p-6 bg-[#c9c1c13d] rounded-lg shadow-md">
            <h3 className="py-2">Property Details:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
              <TextInput
                label="MLS #"
                register={register}
                name="mlsNumber"
                errors={errors}
                required={tradeSheetRepresentationData === "buyer"}
              />

              <div className="w-full">
                <label className="block mb-1">
                  Province <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("stateId", { required: "Province is required" })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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

              <div className="w-full">
                <label className="block mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("cityId", { required: "City is required" })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <label htmlFor="fname" className="block mb-1">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("postalCode", {
                    required: "Postal code is required",
                  })}
                  defaultValue={propertiesData?.postalCode}
                  placeholder="XXX XXX"
                  type="text"
                  id="fname"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  Address <span className="text-red-500">*</span>
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

              <TextInput
                label="Sold Price"
                register={register}
                name="soldPrice"
                errors={errors}
              />

              <DateInput
                label="Offer date (if any)"
                required={false}
                control={control}
                name="offerDate"
                errors={errors}
              />

              <TextInput
                label="Acceptance Date"
                register={register}
                required
                name="acceptanceDate"
                errors={errors}
                type="date"
              />

              <TextInput
                label="Closing Date"
                register={register}
                required
                name="closingDate"
                errors={errors}
                type="date"
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

              <div className="flex flex-col gap-2">
                <label>
                  Deposit Amount <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  {...register("depositAmount", {
                    required: "Deposit Amount is required",
                    min: { value: 0, message: "Amount must be positive" },
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="border border-gray-300 p-2 rounded"
                />
                {errors.depositAmount && (
                  <p className="text-red-500 text-sm">
                    {errors.depositAmount.message}
                  </p>
                )}
              </div>

              <TextInput
                label="Deposit Date"
                register={register}
                required
                name="depositDate"
                errors={errors}
                type="date"
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

              {conditionalOptionValue === "Others" && (
                <TextInput
                  label="Write other condition"
                  register={register}
                  name="otherCondition"
                  errors={errors}
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
              Rest Form
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

export default TradeSheetPropertyDetails;
