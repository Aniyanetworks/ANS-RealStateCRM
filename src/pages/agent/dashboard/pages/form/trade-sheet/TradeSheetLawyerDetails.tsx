/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useForm, FieldError, Controller } from "react-hook-form";
import TradeSheetSteps from "../../../../../../components/Stepper/TradeSheetSteps";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  useCreateUpdateLawyerDetailsMutation,
  useGetSpacificTradeSheetListDataQuery,
} from "../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice";
import toast from "react-hot-toast";
import TableLoader from "../../../../../../components/loader/TableLoader";
import { useGetLawyerDataQuery, useCreateLawyerDataMutation } from "../../../../../../redux/api/superadmin/lawyerDataSlice";
import Select from "react-select";
import ButtonLoader from "../../../../../../components/loader/buttonLoader";
import {
  useGetCitiesQuery,
  useGetStatesQuery,
} from "../../../../../../redux/api/common/countryStateCitySlice";
import { useAppSelector } from "../../../../../../redux/hooks";
import { useSelector } from "react-redux";
import { formatPhoneNumber, formatPostalCode } from "../../../../../../utils/format";
import { useGetLawyerFirmDataQuery, useCreateLawyerFirmDataMutation, useValidateLawyerFirmDataMutation } from "../../../../../../redux/api/superadmin/lawyerFirmDataSlice";
import { Tooltip, Tabs, Modal } from "antd";
import { useForm as useReactHookForm } from "react-hook-form";

const TextInput = ({
  label,
  register,
  required,
  name,
  errors,
  type = "text",
  placeholder = "",
  disabled = false,
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
      disabled={disabled}
    />
    {errors[name] && (
      <p className="text-red-500 text-sm">{`${label} is required`}</p>
    )}
  </div>
);
const TradeSheetLawyerDetails = () => {
  const { uuid } = useParams<{ uuid?: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useGetSpacificTradeSheetListDataQuery(uuid);
  const [btnLoading, setBtnLoading] = useState("");
  const [sellerLawyerId, setSellerLawyerId] = useState("");
  const [buyerLawyerId, setBuyerLawyerId] = useState<number | string>("");
  const { tradeSheetData } = useAppSelector((state: any) => state.user);
  const { user } = useAppSelector((state: any) => state.user);
  const { tradeSheetRepresentationTypeData } = useSelector((state: any) => state.user);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues,
    control
  } = useForm();

  const { data: lawyerData, refetch: refetchLawyers } = useGetLawyerDataQuery("");
  const { data: lawyerFirmData, refetch: refetchLawyerFirms } = useGetLawyerFirmDataQuery("");

  const selectedCountry = 39;
  const selectedState = watch("sellerStateProvince");
  const selectedCity = watch("sellerCity");


  const { data: states = [] } = useGetStatesQuery(selectedCountry, {
    skip: !selectedCountry,
  });

  const { data: cities = [] } = useGetCitiesQuery(selectedState, {
    skip: !selectedState,
  });

  const selectedBuyerCountry = watch("buyerCountryId");
  const selectedBuyerState = watch("buyerStateProvince");
  const selectedBuyerCity = watch("buyerCity");

  const { data: buyerStates = [] } = useGetStatesQuery(selectedBuyerCountry, {
    skip: !selectedBuyerCountry,
  });

  const { data: buyerCities = [] } = useGetCitiesQuery(selectedBuyerState, {
    skip: !selectedBuyerState,
  });

  const [isLawyerModalOpen, setIsLawyerModalOpen] = useState(false);
  const [lawyerModalType, setLawyerModalType] = useState<'seller' | 'buyer' | null>(null);
  const [newLawyerLoading, setNewLawyerLoading] = useState(false);
  const [createLawyerData] = useCreateLawyerDataMutation();
  const [newLawyer, setNewLawyer] = useState({
    firstName: '',
    lastName: '',
    firmId: '',
    address: '',
    streetAddress: '',
    countryId: 39,
    stateId: '',
    cityId: '',
    postalZipCode: '',
    phoneNumber: '',
    cellPhoneNumber: '',
    faxNumber: '',
    email: '',
  });
  const [lawyerFormErrors, setLawyerFormErrors] = useState<any>({});

  const [sellerLawFirmId, setSellerLawFirmId] = useState<string>("");
  const [buyerLawFirmId, setBuyerLawFirmId] = useState<string>("");

  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isFullFormModalOpen, setIsFullFormModalOpen] = useState(false);
  const [isEnableContinueBtn, setIsEnableContinueBtn] = useState(false);
  const [lawFirmModalType, setLawFirmModalType] = useState<'seller' | 'buyer' | null>(null);
  const [newLawFirmLoading, setNewLawFirmLoading] = useState(false);

  const {
    register: registerFirmPhone,
    handleSubmit: handleSubmitFirmPhone,
    formState: { errors: errorsFirmPhone },
    setValue: setValueFirmPhone,
    reset: resetFirmPhone,
  } = useReactHookForm<{ phoneNumber: string }>({
    defaultValues: { phoneNumber: '' },
  });

  const {
    register: registerFirm,
    handleSubmit: handleSubmitFirm,
    formState: { errors: errorsFirm },
    reset: resetFirm,
    watch: watchFirm,
    setValue: setValueFirm,
    control: controlFirm,
  } = useReactHookForm<LawFirmFormValues>({
    defaultValues: {
      firmName: '',
      address: '',
      streetAddress: '',
      stateId: '',
      cityId: '',
      postalZipCode: '',
      phoneNumber: '',
      faxNumber: '',
      billingEmailAddress: '',
      countryId: '39',
    },
  });

  const selectedFirmState = watchFirm('stateId');
  const { data: firmCities = [], isFetching: isFirmCitiesFetching } = useGetCitiesQuery(selectedFirmState, { skip: !selectedFirmState });

  const showCityLoader =
    !!selectedFirmState &&
    (isFirmCitiesFetching ||
      !firmCities?.data?.cities ||
      firmCities.data.cities.length === 0);

  const [validateLawyerFirmData] = useValidateLawyerFirmDataMutation();
  const [createLawyerFirmData] = useCreateLawyerFirmDataMutation();
  const [firmPhoneError, setFirmPhoneError] = useState<string | null>(null);

  const handleOpenLawFirmModal = (type: 'seller' | 'buyer') => {
    setLawFirmModalType(type);
    setIsValidationModalOpen(true);
    setIsFullFormModalOpen(false);
    setIsEnableContinueBtn(false);
    resetFirmPhone();
    resetFirm();
  };
  const handleCancelValidation = () => {
    setIsValidationModalOpen(false);
    setIsEnableContinueBtn(false);
    resetFirmPhone();
  };
  const handleCancelFullForm = () => {
    setIsFullFormModalOpen(false);
    setLawFirmModalType(null);
    resetFirm();
  };
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value);
    setValueFirmPhone('phoneNumber', formattedValue);
  };
  const handlePostalZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValueFirm('postalZipCode', formatPostalCode(value));
  };
  const handleFaxNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValueFirm('faxNumber', formatPhoneNumber(value));
  };
  const handleFirmPhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValueFirm('phoneNumber', formatPhoneNumber(value));
  };
  const handleFirmPhoneContinue = async (data: { phoneNumber: string }) => {
    setFirmPhoneError(null);
    setIsEnableContinueBtn(false);
    try {
      const response = await validateLawyerFirmData({ phoneNumber: data.phoneNumber });
      const resp = response as { data?: { status?: boolean }, error?: { data?: { status?: boolean, message?: string }}};
      if (resp?.data?.status === true) {
        setIsEnableContinueBtn(true);
        setValueFirm('phoneNumber', data.phoneNumber);
        toast.success('Phone number validated!');
      } else if (resp?.error?.data?.status === false) {
        const msg = resp?.error?.data?.message || 'Phone number validation failed';
        setFirmPhoneError(msg);
      }
    } catch {
      setFirmPhoneError('Phone number validation failed');
    }
  };
  const handleContinueToFullForm = () => {
    setIsValidationModalOpen(false);
    setIsFullFormModalOpen(true);
  };
  const handleLawFirmFormSubmit = async (values: LawFirmFormValues) => {
    setNewLawFirmLoading(true);
    try {
      const res = await createLawyerFirmData(values).unwrap();
      if (res && res.data && res.data.lawyerFirm && res.data.lawyerFirm.id) {
        toast.success('Law Firm created successfully!');
        setIsFullFormModalOpen(false);
        setLawFirmModalType(null);
        await refetchLawyerFirms();
        if (lawFirmModalType === 'seller') setSellerLawFirmId(res.data.lawyerFirm.id.toString());
        if (lawFirmModalType === 'buyer') setBuyerLawFirmId(res.data.lawyerFirm.id.toString());
      } else {
        console.error('Unexpected response from server:', res);
        toast.error('Unexpected response from server. Law firm may not have been created.');
      }
    } catch (err: any) {
      let errorMessage = 'Failed to create law firm';
      if (err && err.data && err.data.message) {
        errorMessage = err.data.message;
      }
      toast.error(errorMessage);
      console.error('Law firm creation error:', err);
    } finally {
      setNewLawFirmLoading(false);
    }
  };

  const sellerLawyerOptions = sellerLawFirmId
    ? (lawyerData?.data?.lawyerData?.filter((lawyer: any) => String(lawyer.firm?.id) === sellerLawFirmId)
        .map((lawyer: any) => ({ value: lawyer.name, id: lawyer.id, label: lawyer.name })) || [])
    : [];
  const buyerLawyerOptions = buyerLawFirmId
    ? (lawyerData?.data?.lawyerData?.filter((lawyer: any) => String(lawyer.firm?.id) === buyerLawFirmId)
        .map((lawyer: any) => ({ value: lawyer.name, id: lawyer.id, label: lawyer.name })) || [])
    : [];

  useEffect(() => {
    const lawyerDetails = data?.data?.tradeSheetData?.lawyerDetails[0];
    if (lawyerDetails) {
      setSellerLawyerId(lawyerDetails?.sellerLawyerId);
      setBuyerLawyerId(lawyerDetails?.buyerLawyerId);
      setSellerLawFirmId(lawyerDetails?.sellerLawyer?.firm?.id ? String(lawyerDetails?.sellerLawyer?.firm?.id) : "");
      setBuyerLawFirmId(lawyerDetails?.buyerLawyer?.firm?.id ? String(lawyerDetails?.buyerLawyer?.firm?.id) : "");
      reset({
        sellerLawyerId: lawyerDetails?.sellerLawyerId,
        buyerLawyerId: lawyerDetails?.buyerLawyerId,
        sellerFirstName: lawyerDetails?.sellerLawyer?.firstName,
        sellerLastName: lawyerDetails?.sellerLawyer?.lastName,
        sellerLawFirmName: lawyerDetails?.sellerLawyer?.firm?.firmName,
        sellerAddress: lawyerDetails?.sellerLawyer?.firm?.address,
        sellerStreetAddress: lawyerDetails?.sellerLawyer?.firm?.streetAddress,
        sellerStreetAddressLine2:
          lawyerDetails?.sellerLawyer?.firm?.streetAddressLine2,
        sellerCountryId: lawyerDetails?.sellerLawyer?.firm?.countryId || 39,
        sellerStateProvince: lawyerDetails?.sellerLawyer?.firm?.stateId,
        sellerCity: lawyerDetails?.sellerLawyer?.firm?.cityId,
        sellerPostalZipCode: lawyerDetails?.sellerLawyer?.firm?.postalZipCode,
        sellerPhoneNumber: lawyerDetails?.sellerLawyer?.phoneNumber,
        sellerFaxNumber: lawyerDetails?.sellerLawyer?.firm?.faxNumber,
        sellerEmail: lawyerDetails?.sellerLawyer?.email,
        buyerFirstName: lawyerDetails?.buyerLawyer?.firstName,
        buyerLastName: lawyerDetails?.buyerLawyer?.lastName,
        buyerLawFirmName: lawyerDetails?.buyerLawyer?.firm?.firmName,
        buyerAddress: lawyerDetails?.buyerLawyer?.firm?.address,
        buyerStreetAddress: lawyerDetails?.buyerLawyer?.firm?.streetAddress,
        buyerStreetAddressLine2: lawyerDetails?.buyerLawyer?.firm?.streetAddressLine2,
        buyerCountryId: lawyerDetails?.buyerLawyer?.firm?.countryId || 39,
        buyerStateProvince: lawyerDetails?.buyerLawyer?.firm?.stateId,
        buyerCity: lawyerDetails?.buyerLawyer?.firm?.cityId,
        buyerPostalZipCode: lawyerDetails?.buyerLawyer?.firm?.postalZipCode,
        buyerPhoneNumber: lawyerDetails?.buyerLawyer?.firm?.phoneNumber,
        buyerFaxNumber: lawyerDetails?.buyerLawyer?.firm?.faxNumber,
        buyerEmail: lawyerDetails?.buyerLawyer?.email,
      });
    } else {
      reset({
        sellerCountryId: 39,
        buyerCountryId: 39,
      });
    }
  }, [data, reset]);

  const [createUpdateLawyerDetails] = useCreateUpdateLawyerDetailsMutation();

  const onSubmit = async (data: any) => {
    setBtnLoading(data.saveBtn);
    try {
      const dataWithFirmIds = {
        ...data,
        sellerLawFirmId: sellerLawFirmId || undefined,
        buyerLawFirmId: buyerLawFirmId || undefined,
      };
      const requestData =
        data.saveBtn === "save-draft"
          ? { ...dataWithFirmIds, status: "draft" }
          : dataWithFirmIds;

      const response = await createUpdateLawyerDetails({
        data: requestData,
        uuid,
      }).unwrap();

      toast.success(`${response?.message}`);

      let navigatePath = "";
      switch (data.saveBtn) {
        case "save-next":
          if (tradeSheetData?.status === "rejected" && user.userType !== "superAdmin") {
            navigatePath = `/dashboard/agent/pages/form/trade-sheet/preview-page/${uuid}`;
          }
          else {
            if (tradeSheetRepresentationTypeData != "single") {
              navigatePath = `/dashboard/agent/pages/form/trade-sheet/paperwork-attachment-upload-multiple-representation/${uuid}`;
            }
            else {
              navigatePath = `/dashboard/agent/pages/form/trade-sheet/paperwork-attachment-upload/${uuid}`;
            }

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
      setBtnLoading("");
    }
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

  const handleLawyerChange = (selectedOption: any, type: string) => {
    if (selectedOption) {

      const selectedValue = selectedOption?.value;

      register(`${type}LawyerName`).onChange(selectedValue);

      const selectedLawyer = lawyerData?.data?.lawyerData?.find(
        (lawyer: any) => lawyer.name === selectedValue
      );

      if (selectedLawyer) {
        setValue(`${type}FirstName`, selectedLawyer?.firstName);
        setValue(`${type}LastName`, selectedLawyer?.lastName);
        setValue(`${type}LawFirmName`, selectedLawyer?.firm?.firmName);
        setValue(`${type}Address`, selectedLawyer?.firm?.address);
        setValue(`${type}StreetAddress`, selectedLawyer?.firm?.streetAddress);
        setValue(
          `${type}StreetAddressLine2`,
          selectedLawyer?.firm?.streetAddressLine2
        );
        setValue(`${type}CountryId`, 39);
        setValue(`${type}City`, selectedLawyer?.firm?.cityId);
        setValue(`${type}StateProvince`, selectedLawyer?.firm?.stateId);
        setValue(`${type}PostalZipCode`, selectedLawyer?.firm?.postalZipCode);
        setValue(`${type}PhoneNumber`, selectedLawyer?.phoneNumber);
        setValue(`${type}FaxNumber`, selectedLawyer?.firm?.faxNumber);
        setValue(`${type}Email`, selectedLawyer?.email);
      }
    } else {
      setValue(`${type}FirstName`, "");
      setValue(`${type}LastName`, "");
      setValue(`${type}LawyerAddress`, "");
      setValue(`${type}StreetAddress`, "");
      setValue(`${type}StreetAddressLine2`, "");
      setValue(`${type}Country`, 39);
      setValue(`${type}City`, "");
      setValue(`${type}StateProvince`, "");
      setValue(`${type}PostalZipCode`, "");
      setValue(`${type}PhoneNumber`, "");
      setValue(`${type}FaxNumber`, "");
      setValue(`${type}Email`, "");
    }
  };

  const handleOpenLawyerModal = (type: 'seller' | 'buyer') => {
    setLawyerModalType(type);
    setIsLawyerModalOpen(true);
    setNewLawyer({
      firstName: '',
      lastName: '',
      firmId: '',
      address: '',
      streetAddress: '',
      countryId: 39,
      stateId: '',
      cityId: '',
      postalZipCode: '',
      phoneNumber: '',
      cellPhoneNumber: '',
      faxNumber: '',
      email: '',
    });
    setLawyerFormErrors({});
  };
  const handleCloseLawyerModal = () => {
    setIsLawyerModalOpen(false);
    setLawyerModalType(null);
    setLawyerFormErrors({});
  };
  const handleLawyerInputChange = (e: any) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === "phoneNumber" || name === "cellPhoneNumber") {
      newValue = formatPhoneNumber(value);
    }
    setNewLawyer((prev) => ({ ...prev, [name]: newValue }));
  };
  const validateLawyerForm = () => {
    const errors: any = {};
    if (!newLawyer.firstName) errors.firstName = 'First name is required';
    if (!newLawyer.lastName) errors.lastName = 'Last name is required';
    if (!newLawyer.firmId) errors.firmId = 'Lawyer firm is required';
    return errors;
  };
  const handleLawyerFormSubmit = async (e: any) => {
    e.preventDefault();
    const errors = validateLawyerForm();
    setLawyerFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setNewLawyerLoading(true);
    try {
      const res = await createLawyerData(newLawyer).unwrap();
      toast.success('Lawyer created successfully!');
      setIsLawyerModalOpen(false);
      setLawyerModalType(null);
      setNewLawyerLoading(false);
      await refetchLawyers();
      await refetchLawyerFirms();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create lawyer');
      setNewLawyerLoading(false);
    }
  };

  const [firmModalOpen, setFirmModalOpen] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [selectedLawyer, setSelectedLawyer] = useState(null);

  const { tradeSheetRepresentationData } = useAppSelector((state: any) => state.user);

  const getAgentLabels = () => {
    
  let firstAgent ="Seller";
  let secondAgent ="Buyer";

  if(tradeSheetRepresentationData === "landlord" || tradeSheetRepresentationData === "tenant") 
  {
      firstAgent="Landlord"
      secondAgent="Tenant"
  }

  if (tradeSheetRepresentationTypeData != "single"){
    if(tradeSheetRepresentationData === "tenant,landlord" || tradeSheetRepresentationData === "landlord,tenant"){
      firstAgent="Landlord"
      secondAgent="Tenant"
    }else if(tradeSheetRepresentationData === "buyer,seller" || tradeSheetRepresentationData === "seller,buyer"){
      firstAgent="Seller"
      secondAgent="Buyer"
    }      
  }

    return { firstAgent, secondAgent };
  };

  const { firstAgent, secondAgent } = getAgentLabels();

  return (
    <div>
      <TradeSheetSteps active={6} uuid={uuid} />


      {isLoading ? (
        <TableLoader />
      ) : (
        <div className="max-w-full mt-8 p-8 border border-gray-300/30 rounded-md  border-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="max-FULL p-6 bg-[#c9c1c13d] rounded-lg shadow-md">
              <h3 className="py-2">Lawyer's Details:</h3>
              <h4 className="font-semibold my-3">{firstAgent}'s Lawyer</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2 mb-4">
                  <label htmlFor="">Select Law Firm</label>
                  <div className="flex items-center gap-2 w-full">
                    <select
                      value={sellerLawFirmId}
                      onChange={e => {
                        setSellerLawFirmId(e.target.value);
                        setSellerLawyerId("");
                      }}
                      className="border p-2 rounded w-full"
                    >
                      <option value="">Select Law Firm</option>
                      {lawyerFirmData?.data?.lawyerFirm?.map((firm: any) => (
                        <option key={firm.id} value={firm.id}>{firm.firmName}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleOpenLawFirmModal('seller')}
                      className="p-2 bg-green-500 text-white rounded"
                      title="Add New Law Firm"
                    >
                      +
                    </button>
                  </div>
                </div>
                {sellerLawFirmId && sellerLawFirmId !== '' && sellerLawFirmId !== null &&
                <div className="flex flex-col gap-2 mb-4">
                  <label htmlFor="">Select Lawyer</label>
                  <div className="flex items-center gap-2 w-full">
                    <Controller
                      name="sellerLawyerName"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={sellerLawyerOptions}
                          classNamePrefix="select"
                          className={`react-select w-full ${errors.sellerLawyerName ? "border-red-500" : ""}`}
                          onChange={(selectedOption) => {
                            field.onChange(selectedOption);
                            setSellerLawyerId(selectedOption ? selectedOption.id : "");
                            handleLawyerChange(selectedOption, "seller");
                          }}
                          value={sellerLawyerOptions.find((option) => option.id === sellerLawyerId) || null}
                          isClearable
                          getOptionValue={option => option.id}
                          getOptionLabel={option => option.label}
                          isDisabled={!sellerLawFirmId}
                        />
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenLawyerModal('seller')}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f766e] text-white transition hover:bg-[#0d6b64]"
                      title="Add New Lawyer"
                      disabled={!sellerLawFirmId}
                    >
                      +
                    </button>
                  </div>
                </div>
                }
                <TextInput
                  label="First Name"
                  register={register}
                  disabled={true}
                  name="sellerFirstName"
                  errors={errors}
                />
                <TextInput
                  label="Last Name"
                  register={register}
                  disabled={true}
                  name="sellerLastName"
                  errors={errors}
                />
                <TextInput
                  label="Address"
                  register={register}
                  disabled={true}
                  name="sellerAddress"
                  errors={errors}
                />
                <TextInput
                  label="Street Address"
                  register={register}
                  disabled={true}
                  name="sellerStreetAddress"
                  errors={errors}
                />

                <div className="flex flex-col gap-2">
                  <label>Province</label>
                  <select
                    {...register("sellerStateProvince", {
                    })}
                    disabled={true}
                  >
                    <option value="">Select Province</option>
                    {states?.data?.states?.map((state: any) => (
                      <option
                        key={state.id}
                        value={state.id}
                        selected={state.id == selectedState}
                      >
                        {state.name}
                      </option>
                    ))}
                  </select>
                  {errors.sellerStateProvince && (
                    <p className="text-red-500 text-sm">
                      {(errors.sellerStateProvince as FieldError).message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label>City</label>
                  <select
                    {...register("sellerCity", {
                    })}
                    disabled={true}
                  >
                    <option value="">Select City</option>
                    {cities?.data?.cities?.map((city: any) => (
                      <option
                        selected={city?.id === getValues('sellerCity')}
                        key={city.id}
                        value={city.id}
                      >
                        {city.name}
                      </option>
                    ))}
                  </select>
                  {errors.sellerCity && (
                    <p className="text-red-500 text-sm">
                      {(errors.sellerCity as FieldError).message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label>
                    Postal Code
                  </label>

                  <input
                    {...register("sellerPostalZipCode")}
                    type="text"
                    disabled={true}
                    placeholder="XXX XXX"
                    className="border border-gray-300 p-2 rounded"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setValue(
                        "sellerPostalZipCode",
                        formatPostalCode(e.target.value)
                      );
                    }}
                  />

                  {errors.sellerPostalZipCode && (
                    <p className="text-red-500 text-sm">{`seller Postal ZipCode is required`}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label>
                    Phone Number
                  </label>

                  <input
                    {...register("sellerPhoneNumber")}
                    disabled={true}
                    type="text"
                    placeholder="+1 (XXX) XXX-XXXX"
                    className="border border-gray-300 p-2 rounded"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setValue(
                        "sellerPhoneNumber",
                        formatPhoneNumber(e.target.value)
                      );
                    }}
                  />

                  {errors.sellerPhoneNumber && (
                    <p className="text-red-500 text-sm">{`Seller PhoneNumber is required`}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label>
                    Fax Number
                  </label>

                  <input
                    {...register("sellerFaxNumber")}
                    disabled={true}
                    type="text"
                    placeholder="+1 (XXX) XXX-XXXX"
                    className="border border-gray-300 p-2 rounded"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setValue(
                        "sellerFaxNumber",
                        formatPhoneNumber(e.target.value)
                      );
                    }}
                  />

                  {errors.sellerFaxNumber && (
                    <p className="text-red-500 text-sm">{`seller FaxNumber is required`}</p>
                  )}
                </div>
                <TextInput
                  label="Email"
                  disabled={true}
                  register={register}
                  name="sellerEmail"
                  errors={errors}
                  placeholder="example@example.com"
                />
              </div>

              <div>
                <h4 className="font-semibold my-3">{secondAgent}'s Lawyer</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2 mb-4">
                    <label htmlFor="">Select Law Firm</label>
                    <div className="flex items-center gap-2 w-full">
                      <select
                        value={buyerLawFirmId}
                        onChange={e => {
                          setBuyerLawFirmId(e.target.value);
                          setBuyerLawyerId(""); 
                        }}
                        className="border p-2 rounded w-full"
                      >
                        <option value="">Select Law Firm</option>
                        {lawyerFirmData?.data?.lawyerFirm?.map((firm: any) => (
                          <option key={firm.id} value={firm.id}>{firm.firmName}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenLawFirmModal('buyer')}
                        className="p-2 bg-green-500 text-white rounded"
                        title="Add New Law Firm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {buyerLawFirmId && buyerLawFirmId !== '' && buyerLawFirmId !== null &&
                  <div className="flex flex-col gap-2 mb-4">
                    <label htmlFor="">Select Lawyer </label>
                    <div className="flex items-center gap-2 w-full">
                      <Controller
                        name="buyerLawyerName"
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={buyerLawyerOptions}
                            classNamePrefix="select"
                            className={`react-select w-full ${errors.buyerLawyerName ? "border-red-500" : ""}`}
                            onChange={(selectedOption) => {
                              field.onChange(selectedOption);
                              setBuyerLawyerId(selectedOption ? selectedOption.id : "");
                              handleLawyerChange(selectedOption, "buyer");
                            }}
                            value={buyerLawyerOptions.find((option) => option.id === buyerLawyerId) || null}
                            isClearable
                            getOptionValue={option => option.id}
                            getOptionLabel={option => option.label}
                            isDisabled={!buyerLawFirmId}
                          />
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => handleOpenLawyerModal('buyer')}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f766e] text-white transition hover:bg-[#0d6b64]"
                        title="Add New Lawyer"
                        disabled={!buyerLawFirmId}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  }
                  <TextInput
                    label="First Name"
                    register={register}
                    disabled={true}
                    name="buyerFirstName"
                    errors={errors}
                  />
                  <TextInput
                    label="Last Name"
                    register={register}
                    disabled={true}
                    name="buyerLastName"
                    errors={errors}
                  />
                  <TextInput
                    label="Address"
                    register={register}
                    disabled={true}
                    name="buyerAddress"
                    errors={errors}
                  />
                  <TextInput
                    label="Street Address 2"
                    register={register}
                    disabled={true}
                    name="buyerStreetAddress"
                    errors={errors}
                  />

                  <div className="flex flex-col gap-2">
                    <label>Province</label>
                    <select
                      {...register("buyerStateProvince", {
                      })}
                      disabled={true}
                      onChange={(e) => {
                        setValue("buyerStateProvince", e.target.value);
                        setValue("buyerCity", "");
                      }}
                    >
                      <option value="">Select Province</option>
                      {buyerStates?.data?.states?.map((state: any) => (
                        <option
                          key={state.id}
                          value={state.id}
                          selected={state.id == selectedBuyerState}
                        >
                          {state.name}
                        </option>
                      ))}
                    </select>
                    {errors.buyerStateProvince && (
                      <p className="text-red-500 text-sm">
                        {(errors.buyerStateProvince as FieldError).message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label>City</label>
                    <select
                      {...register("buyerCity", {
                      })}
                      disabled={true}
                    >
                      <option value="">Select City</option>
                      {buyerCities?.data?.cities?.map((city: any) => (
                        <option
                          key={city.id}
                          value={city.id}
                          selected={city.id == selectedBuyerCity}
                        >
                          {city.name}
                        </option>
                      ))}
                    </select>
                    {errors.buyerCity && (
                      <p className="text-red-500 text-sm">
                        {(errors.buyerCity as FieldError).message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>
                      Postal Code
                    </label>

                    <input
                      {...register("buyerPostalZipCode")}
                      type="text"
                      disabled={true}
                      placeholder="XXX XXX"
                      className="border border-gray-300 p-2 rounded"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setValue(
                          "buyerPostalZipCode",
                          formatPostalCode(e.target.value)
                        );
                      }}
                    />

                    {errors.buyerPostalZipCode && (
                      <p className="text-red-500 text-sm">{`buyer Postal Zip Code is required`}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>
                      Phone Number
                    </label>

                    <input
                      {...register("buyerPhoneNumber")}
                      disabled={true}
                      type="text"
                      placeholder="+1 (XXX) XXX-XXXX"
                      className="border border-gray-300 p-2 rounded"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setValue(
                          "buyerPhoneNumber",
                          formatPhoneNumber(e.target.value)
                        );
                      }}
                    />

                    {errors.buyerPhoneNumber && (
                      <p className="text-red-500 text-sm">{`Buyer Phone Number is required`}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>
                      Fax Number
                    </label>

                    <input
                      {...register("buyerFaxNumber")}
                      disabled={true}
                      type="text"
                      placeholder="+1 (XXX) XXX-XXXX"
                      className="border border-gray-300 p-2 rounded"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setValue(
                          "buyerFaxNumber",
                          formatPhoneNumber(e.target.value)
                        );
                      }}
                    />

                    {errors.buyerFaxNumber && (
                      <p className="text-red-500 text-sm">{`FaxNumber is required`}</p>
                    )}
                  </div>
                  <TextInput
                    label="Email"
                    disabled={true}
                    register={register}
                    name="buyerEmail"
                    errors={errors}
                    placeholder="example@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between my-15 mx-5">
              <button
                type="submit"
                onClick={() => {
                  setValue("saveBtn", "save-next");
                }}
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading === "save-next" ? (
                  <ButtonLoader />
                ) : (
                  "Save and Next"
                )}
              </button>

              <button
                type="submit"
                onClick={() => {
                  setValue("saveBtn", "save-exit");
                }}
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading === "save-exit" ? (
                  <ButtonLoader />
                ) : (
                  "Save and Exit"
                )}
              </button>

              <button
                type="submit"
                onClick={() => {
                  setValue("saveBtn", "save-draft");
                }}
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading === "save-draft" ? (
                  <ButtonLoader />
                ) : (
                  "Save as Draft"
                )}
              </button>
              <NavLink
                to={`/dashboard/agent/pages/form/trade-sheet/agent-details/${uuid}`}
                className="primary-btn flex-1 mx-2 my-2 text-center"
              >
                Go Back
              </NavLink>
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
      )}

      {isLawyerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={handleCloseLawyerModal}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Create Lawyer Data</h2>
            <form onSubmit={handleLawyerFormSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label>
                    First Name <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    name="firstName"
                    value={newLawyer.firstName}
                    onChange={handleLawyerInputChange}
                    type="text"
                    placeholder="Enter Lawyer Name"
                    className="border p-2 rounded w-full"
                  />
                  {lawyerFormErrors.firstName && (
                    <p className="text-red-500 text-sm">{lawyerFormErrors.firstName}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label>
                    Last Name <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    name="lastName"
                    value={newLawyer.lastName}
                    onChange={handleLawyerInputChange}
                    type="text"
                    placeholder="Enter Lawyer Name"
                    className="border p-2 rounded w-full"
                  />
                  {lawyerFormErrors.lastName && (
                    <p className="text-red-500 text-sm">{lawyerFormErrors.lastName}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label>
                    Lawyer Firm <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    name="firmId"
                    value={newLawyer.firmId}
                    onChange={handleLawyerInputChange}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Select Lawyer Firm</option>
                    {lawyerFirmData?.data?.lawyerFirm?.map((firm: any) => (
                      <option key={firm.id} value={firm.id}>{firm.firmName}</option>
                    ))}
                  </select>
                  {lawyerFormErrors.firmId && (
                    <p className="text-red-500 text-sm">{lawyerFormErrors.firmId}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label>
                    Email 
                  </label>
                  <input
                    name="email"
                    value={newLawyer.email}
                    onChange={handleLawyerInputChange}
                    type="text"
                    placeholder="Enter your Email"
                    className="border p-2 rounded w-full"
                  />
                  {lawyerFormErrors.email && (
                    <p className="text-red-500 text-sm">{lawyerFormErrors.email}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label>
                    Phone Number 
                  </label>
                  <input
                    name="phoneNumber"
                    value={newLawyer.phoneNumber}
                    onChange={handleLawyerInputChange}
                    type="text"
                    placeholder="+1 (XXX) XXX-XXXX"
                    maxLength={18}
                    className="border p-2 rounded w-full"
                  />
                  {lawyerFormErrors.phoneNumber && (
                    <p className="text-red-500 text-sm">{lawyerFormErrors.phoneNumber}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="cancel-btn mr-1" onClick={handleCloseLawyerModal}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={newLawyerLoading}>
                  {newLawyerLoading ? 'Creating...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isValidationModalOpen && (
        <Modal
          open={isValidationModalOpen}
          onCancel={handleCancelValidation}
          title="Create Lawyer Firm"
          footer={(() => {
            const footerButtons = [
              <button key="cancel" className="cancel-btn mr-1" onClick={handleCancelValidation}>Cancel</button>
            ];
            if (!isEnableContinueBtn) {
              footerButtons.push(
                <button key="submit" className="primary-btn" onClick={handleSubmitFirmPhone(handleFirmPhoneContinue)}>Verify your number</button>
              );
            }
            if (isEnableContinueBtn) {
              footerButtons.push(
                <button key="continue" className="primary-btn ml-2" onClick={handleContinueToFullForm}>Continue</button>
              );
            }
            return footerButtons;
          })()}
          width={400}
          closable={false}
          maskClosable={false}
        >
          <form className="space-y-3">
            <div className="flex flex-col gap-2">
              <label>Phone Number <span className="text-red-500 ml-1">*</span></label>
              <input
                {...registerFirmPhone('phoneNumber')}
                type="text"
                placeholder="e.g. +1 (123) 456-7890"
                className="border p-2 rounded w-full"
                onChange={handlePhoneNumberChange}
              />
              {errorsFirmPhone.phoneNumber && <p className="text-red-500 text-sm">{errorsFirmPhone.phoneNumber.message}</p>}
              {firmPhoneError && <p className="text-red-500 text-sm">{firmPhoneError}</p>}
            </div>
          </form>
        </Modal>
      )}
      {isFullFormModalOpen && (
        <Modal
          open={isFullFormModalOpen}
          onCancel={handleCancelFullForm}
          title="Create Lawyer Firm"
          footer={[
            <button key="cancel" className="cancel-btn mr-1" onClick={handleCancelFullForm}>Cancel</button>,
            <button key="submit" className="primary-btn" onClick={handleSubmitFirm(handleLawFirmFormSubmit)} disabled={newLawFirmLoading}>
              {newLawFirmLoading ? 'Creating...' : 'Submit'}
            </button>,
          ]}
          width={600}
          closable={false}
          maskClosable={false}
        >
          <form className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label>Firm Name <span className="text-red-500 ml-1">*</span></label>
                <input {...registerFirm('firmName', { required: 'Firm name is required' })} type="text" className="border p-2 rounded w-full" />
                {errorsFirm.firmName && <p className="text-red-500 text-sm">{errorsFirm.firmName.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label>Address <span className="text-red-500 ml-1">*</span></label>
                <input {...registerFirm('address', { required: 'Address is required' })} type="text" className="border p-2 rounded w-full" />
                {errorsFirm.address && <p className="text-red-500 text-sm">{errorsFirm.address.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label>Street Address</label>
                <input {...registerFirm('streetAddress')} type="text" className="border p-2 rounded w-full" />
                {errorsFirm.streetAddress && <p className="text-red-500 text-sm">{errorsFirm.streetAddress.message}</p>}
              </div>
              
              <div className="flex flex-col gap-2">
                <label>Province <span className="text-red-500 ml-1">*</span></label>
                <select {...registerFirm('stateId', { required: 'Province is required' })} className="border p-2 rounded w-full" onChange={e => {
                  registerFirm('stateId').onChange(e);
                  setValueFirm('cityId', '');
                }}>
                  <option value="">Select Province</option>
                  {states?.data?.states?.map((state: any) => (
                    <option key={state.id} value={state.id}>{state.name}</option>
                  ))}
                </select>
                {errorsFirm.stateId && <p className="text-red-500 text-sm">{errorsFirm.stateId.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label>City <span className="text-red-500 ml-1">*</span></label>
                <Controller
                  name="cityId"
                  control={controlFirm}
                  rules={{ required: 'City is required' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={
                        showCityLoader
                          ? [
                              {
                                value: '',
                                label: (
                                  <span style={{ display: 'flex', alignItems: 'center' }}>
                                    <svg width="18" height="18" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#2563eb" style={{ marginRight: 8 }}>
                                      <g fill="none" fillRule="evenodd">
                                        <g transform="translate(1 1)" strokeWidth="2">
                                          <circle strokeOpacity=".3" cx="18" cy="18" r="18" />
                                          <path d="M36 18c0-9.94-8.06-18-18-18">
                                            <animateTransform
                                              attributeName="transform"
                                              type="rotate"
                                              from="0 18 18"
                                              to="360 18 18"
                                              dur="1s"
                                              repeatCount="indefinite" />
                                          </path>
                                        </g>
                                      </g>
                                    </svg>
                                    Loading cities...
                                  </span>
                                ),
                                isDisabled: true,
                              },
                            ]
                          : firmCities?.data?.cities?.map((city: any) => ({ value: city.id, label: city.name })) || []
                      }
                      isDisabled={!selectedFirmState || showCityLoader}
                      isLoading={showCityLoader}
                      placeholder={showCityLoader ? 'Loading cities...' : 'Select City'}
                      value={
                        showCityLoader
                          ? { value: '', label: 'Loading cities...' }
                          : (firmCities?.data?.cities?.map((city: any) => ({ value: city.id, label: city.name })).find((opt: any) => opt.value === field.value) || null)
                      }
                      onChange={option => field.onChange(option ? option.value : '')}
                      styles={{ menu: (provided) => ({ ...provided, zIndex: 9999 }) }}
                    />
                  )}
                />
                {errorsFirm.cityId && <p className="text-red-500 text-sm">{errorsFirm.cityId.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label>Postal Code <span className="text-red-500 ml-1">*</span></label>
                <input {...registerFirm('postalZipCode')} type="text" className="border p-2 rounded w-full" onChange={handlePostalZipCodeChange} />
                {errorsFirm.postalZipCode && <p className="text-red-500 text-sm">{errorsFirm.postalZipCode.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label>Phone Number <span className="text-red-500 ml-1">*</span></label>
                <input
                  {...registerFirm('phoneNumber')}
                  type="text"
                  className="border p-2 rounded w-full"
                  onChange={handleFirmPhoneNumberChange}
                  value={watchFirm('phoneNumber')}
                  disabled
                />
                {errorsFirm.phoneNumber && <p className="text-red-500 text-sm">{errorsFirm.phoneNumber.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label>Fax Number</label>
                <input {...registerFirm('faxNumber')} type="text" className="border p-2 rounded w-full" onChange={handleFaxNumberChange} />
                {errorsFirm.faxNumber && <p className="text-red-500 text-sm">{errorsFirm.faxNumber.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label>Billing Email Address</label>
                <input {...registerFirm('billingEmailAddress')} type="email" className="border p-2 rounded w-full" />
                {errorsFirm.billingEmailAddress && <p className="text-red-500 text-sm">{errorsFirm.billingEmailAddress.message}</p>}
              </div>
              <input type="hidden" {...registerFirm('countryId')} value="39" />
            </div>
          </form>
        </Modal>
      )}

      {firmModalOpen && selectedFirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setFirmModalOpen(false)}>✕</button>
            <Tabs defaultActiveKey="details" className="custom-tabs">
              <Tabs.TabPane tab="Details" key="details">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">{selectedFirm.firmName}</h3>
                  <p><span className="font-semibold">Address:</span> {selectedFirm.address}</p>
                  <p><span className="font-semibold">City:</span> {selectedFirm.city?.name}</p>
                  <p><span className="font-semibold">State:</span> {selectedFirm.state?.name}</p>
                  <p><span className="font-semibold">Postal:</span> {selectedFirm.postalZipCode}</p>
                  <p><span className="font-semibold">Phone:</span> {selectedFirm.phoneNumber}</p>
                  <p><span className="font-semibold">Email:</span> {selectedFirm.billingEmailAddress}</p>
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Lawyers" key="lawyers">
                <div className="flex gap-6">
                <div className="max-h-[400px] overflow-y-auto">
                  <ul className="w-1/2 space-y-2">
                    {selectedFirm.lawyerData?.length > 0 ? selectedFirm.lawyerData.map((lawyer: any) => (
                      <li key={lawyer.id}>
                        <button
                          className={`text-blue-600 underline ${selectedLawyer?.id === lawyer.id ? 'font-bold' : ''}`}
                          onClick={() => setSelectedLawyer(lawyer)}
                        >
                          {lawyer.firstName} {lawyer.lastName}
                        </button>
                      </li>
                    )) : <li className="text-gray-500">No lawyers found for this firm.</li>}
                  </ul>
                </div>
                  <div className="w-1/2">
                    {selectedLawyer ? (
                      <div className="space-y-2">
                        <h4 className="font-bold text-base">{selectedLawyer.firstName} {selectedLawyer.lastName}</h4>
                        <p><span className="font-semibold">Email:</span> {selectedLawyer.email}</p>
                        <p><span className="font-semibold">Phone:</span> {selectedLawyer.phoneNumber}</p>
                        <p><span className="font-semibold">Address:</span> {selectedLawyer.address}</p>
                        <p><span className="font-semibold">Postal:</span> {selectedLawyer.postalZipCode}</p>
                        <p><span className="font-semibold">Status:</span> {selectedLawyer.status}</p>
                      </div>
                    ) : (
                      <div className="text-gray-500">Select a lawyer to view details.</div>
                    )}
                  </div>
                </div>
              </Tabs.TabPane>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeSheetLawyerDetails;
