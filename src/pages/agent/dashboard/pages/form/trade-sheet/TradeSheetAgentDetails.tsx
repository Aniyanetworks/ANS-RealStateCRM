/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { NavLink, useNavigate, useParams } from 'react-router-dom';

import ButtonLoader from '../../../../../../components/loader/buttonLoader';
import TableLoader from '../../../../../../components/loader/TableLoader';
import TradeSheetSteps from '../../../../../../components/Stepper/TradeSheetSteps';
import { cleanPersonName } from '../../../../../../utils/stringUtils';
import { useCreateAgentMutation } from '../../../../../../redux/api/superadmin/agent/agentManagementSlice';
import { useGetAgentListDataQuery } from '../../../../../../redux/api/superadmin/agent/agentManagementSlice';
import {  
  useCreateUpdateAgentDetailsMutation,
  useGetSpacificTradeSheetListDataQuery,
  useAddSharedUserMutation,
  useRemoveSharedUserMutation,
  useUpdateSharedUserCommissionMutation,
} from '../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice';
import { useGetBrokerageDataQuery, useValidateBrokerageDataMutation, useCreateBrokerageDataMutation } from '../../../../../../redux/api/superadmin/brokerageDataSlice';
import { useAppSelector } from '../../../../../../redux/hooks';
import {
  formatPhoneNumber,
  formatPostalCode,
} from '../../../../../../utils/format';
import { useGetStatesQuery, useGetCitiesQuery } from '../../../../../../redux/api/common/countryStateCitySlice';

// Import Components
import AgentSection from './components/AgentSection';
import SharedUsersSection from './components/SharedUsersSection';
import AgentCreationModal from './components/AgentCreationModal';
import BrokerageCreationModal from './components/BrokerageCreationModal';
import ValidationModal from './components/ValidationModal';

interface TextInputProps {
  label: string;
  register: any;
  required?: boolean;
  name: string;
  errors: any;
  type?: string;
  placeholder?: string;
  step?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  disabled?: boolean;
}

// Reusable Text Input Component
const TextInput = ({
  label,
  register,
  required,
  name,
  errors,
  type = "text",
  placeholder = "",
  step,
  onChange,
  value,
  disabled = false,
}: TextInputProps) => (
  <div className="flex flex-col gap-2">
    <label>
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      {...register(name, { required })}
      type={type}
      placeholder={placeholder}
      {...(step && { step })}
      className="border border-gray-300 p-2 rounded"
      onChange={(e) => {
        register(name).onChange(e);
        onChange?.(e);
      }}
      {...(value !== undefined ? { value } : {})}
      disabled={disabled}
    />
    {errors[name] && (
      <p className="text-red-500 text-sm">{`${label} is required`}</p>
    )}
  </div>
);

const TradeSheetAgentDetails = () => {
  const { uuid } = useParams<{ uuid?: string }>();
  const navigate = useNavigate();
  const { data, isLoading/* ,refetch:refetchTradeSheet */ } = useGetSpacificTradeSheetListDataQuery(uuid);
  
  const [btnLoading, setBtnLoading] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [sellerBrokeragePhoneNumber, setSellerBrokeragePhoneNumber] = useState("");
  const [buyerBrokeragePhoneNumber, setBuyerBrokeragePhoneNumber] = useState("");
  const [sellerBrokerageFaxNumber, setSellerBrokerageFaxNumber] = useState("");
  const [buyerBrokerageFaxNumber, setBuyerBrokerageFaxNumber] = useState("");
  const [sellerBrokeragePostalZipCode, setSellerBrokeragePostalZipCode] = useState("");
  const [buyerBrokeragePostalZipCode, setBuyerBrokeragePostalZipCode] = useState("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [faxNumber, setFaxNumber] = useState("");
  const [modalState, setModalState] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues,
    control,
  } = useForm();

  const { data: brokerageData, refetch } = useGetBrokerageDataQuery("");
  const { data: internalAgent } = useGetAgentListDataQuery("");
  const [createAgent] = useCreateAgentMutation();
  const [createUpdateAgentDetails] = useCreateUpdateAgentDetailsMutation();
  const [validateBrokerageData] = useValidateBrokerageDataMutation();
  const [createBrokerage] = useCreateBrokerageDataMutation();

  // Shared users mutations
  const [addSharedUser] = useAddSharedUserMutation();
  const [removeSharedUser] = useRemoveSharedUserMutation();
  const [updateSharedUserCommission] = useUpdateSharedUserCommissionMutation();

  // Form instances for modals
  const sellerAgentForm = useForm();
  const buyerAgentForm = useForm();
  const brokerageForm = useForm();

  // Modals state
  const [isSellerAgentCreateModalOpen, setIsSellerAgentCreateModalOpen] = useState(false);
  const [isBuyerAgentCreateModalOpen, setIsBuyerAgentCreateModalOpen] = useState(false);
  const [isSellerBrokerageCreateModalOpen, setIsSellerBrokerageCreateModalOpen] = useState(false);
  const [isBuyerBrokerageCreateModalOpen, setIsBuyerBrokerageCreateModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  // Shared users state
  const [sharedUsersData, setSharedUsersData] = useState<any[]>([]);
  const [hasSharedUsers, setHasSharedUsers] = useState(false);

  // Watch form values
  const selectedCountry = 39;
  const selectedState = watch("sellerStateProvince");
  const selectedCity = watch("sellerCity");
  const selectedBuyerCountry = 39;
  const selectedBuyerState = watch("buyerStateProvince");
  const selectedBuyerCity = watch("buyerCity");
  const sellerBrokerageId = watch('sellerBrokerageId');
  const buyerBrokerageId = watch('buyerBrokerageId');

  // API hooks for states and cities
  const { data: states = [] } = useGetStatesQuery(selectedCountry, { skip: !selectedCountry });
  const { data: cities = [] } = useGetCitiesQuery(selectedState, { skip: !selectedState });
  const { data: buyerStates = [] } = useGetStatesQuery(selectedBuyerCountry, { skip: !selectedBuyerCountry });
  const { data: buyerCities = [] } = useGetCitiesQuery(selectedBuyerState, { skip: !selectedBuyerState });
  const { data: modalCitiesData } = useGetCitiesQuery(modalState, { skip: !modalState });

  // Get representation data
  const { tradeSheetRepresentationData } = useAppSelector((state: any) => state.user);
  const { tradeSheetRepresentationTypeData } = useAppSelector((state: any) => state.user);
  
  // Brokerage options
  const brokerageOptions = brokerageData?.data?.brokerageData?.map((brokerage: any) => ({
    value: brokerage?.id,
    label: `${brokerage?.brokerageName}`,
  })) || [];

  // Agent options
  const sellerAgentOptions = sellerBrokerageId
    ? (internalAgent?.data?.userData?.filter(
        (agent: any) => String(agent.brokerageId) === String(sellerBrokerageId) && agent.status != "closed"
      ) || []).map((agent: any) => ({
        value: agent.id,
        label: agent.name,
      }))
    : [];

  const buyerAgentOptions = buyerBrokerageId
    ? (internalAgent?.data?.userData?.filter(
        (agent: any) => String(agent.brokerageId) === String(buyerBrokerageId) && agent.status != "closed"
      ) || []).map((agent: any) => ({
        value: agent.id,
        label: agent.name,
      }))
    : [];

  // Determine agent labels based on representation
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

  // Replace your current useEffect that initializes form data with this:

// Initialize form data
useEffect(() => {
  const agentDetails = data?.data?.tradeSheetData?.agentDetails[0];
  const tradeSheet = data?.data?.tradeSheetData;

  if (agentDetails) {
    const formData = {
      // Seller Brokerage (names in "First"/"Last" case, without a duplicated last name)
      sellerFirstName: cleanPersonName(agentDetails?.sellerFirstName, agentDetails?.sellerLastName).firstName,
      sellerLastName: cleanPersonName(agentDetails?.sellerFirstName, agentDetails?.sellerLastName).lastName,
      sellerEmail: agentDetails?.sellerEmail,
      sellerInternalAgent: agentDetails?.intSellerAgentId,
      sellerBrokerageId: agentDetails?.sellerBrokerageId,
      sellerBrokerageName: agentDetails?.sellerBrokerage?.brokerageName,
      sellerBrokerageAddress: agentDetails?.sellerBrokerage?.address,
      sellerStreetAddress: agentDetails?.sellerBrokerage?.streetAddress,
      sellerStreetAddressLine2: agentDetails?.sellerBrokerage?.streetAddressLine2,
      sellerCountryId: 39,
      sellerStateProvince: agentDetails?.sellerBrokerage?.stateId,
      sellerCity: agentDetails?.sellerBrokerage?.cityId,
      sellerPostalZipCode: agentDetails?.sellerBrokerage?.postalZipCode,
      sellerBrokeragePhoneNumber: agentDetails?.sellerBrokerage?.phoneNumber,
      sellerBrokerageFaxNumber: agentDetails?.sellerBrokerage?.faxNumber,
      sellerCommission: agentDetails?.sellerCommission != null ? String(agentDetails.sellerCommission) : '',
      sellerCommissionType: agentDetails?.sellerCommissionType || "percentage",
      sellerCommissionAmount: agentDetails?.sellerCommissionAmount != null ? String(agentDetails.sellerCommissionAmount) : '',
      sellerCommercialCommission: agentDetails?.sellerCommercialCommission || [],
      sellerBrokerageBillingEmailAddress: agentDetails?.sellerBrokerage?.billingEmailAddress,
      
      // Buyer Brokerage
      buyerFirstName: cleanPersonName(agentDetails?.buyerFirstName, agentDetails?.buyerLastName).firstName,
      buyerLastName: cleanPersonName(agentDetails?.buyerFirstName, agentDetails?.buyerLastName).lastName,
      buyerEmail: agentDetails?.buyerEmail,
      buyerInternalAgent: agentDetails?.intBuyerAgentId,
      buyerBrokerageId: agentDetails?.buyerBrokerageId,
      buyerBrokerageName: agentDetails?.buyerBrokerage?.brokerageName,
      buyerBrokerageAddress: agentDetails?.buyerBrokerage?.address,
      buyerStreetAddress: agentDetails?.buyerBrokerage?.streetAddress,
      buyerStreetAddressLine2: agentDetails?.buyerBrokerage?.streetAddressLine2,
      buyerCountryId: 39,
      buyerStateProvince: agentDetails?.buyerBrokerage?.stateId,
      buyerCity: agentDetails?.buyerBrokerage?.cityId,
      buyerPostalZipCode: agentDetails?.buyerBrokerage?.postalZipCode,
      buyerBrokeragePhoneNumber: agentDetails?.buyerBrokerage?.phoneNumber,
      buyerBrokerageFaxNumber: agentDetails?.buyerBrokerage?.faxNumber,
      buyerCommission: agentDetails?.buyerCommission != null ? String(agentDetails.buyerCommission) : '',
      buyerCommissionType: agentDetails?.buyerCommissionType || "percentage",
      buyerCommissionAmount: agentDetails?.buyerCommissionAmount != null ? String(agentDetails.buyerCommissionAmount) : '',
      buyerCommercialCommission: agentDetails?.buyerCommercialCommission || [],
      buyerBrokerageBillingEmailAddress: agentDetails?.buyerBrokerage?.billingEmailAddress,
    };

    reset(formData);
    
    // Set individual values
    setValue("sellerBrokerageId", agentDetails?.sellerBrokerageId);
    setValue("buyerBrokerageId", agentDetails?.buyerBrokerageId);
    setValue("sellerStateProvince", agentDetails?.sellerBrokerage?.stateId);
    setValue("sellerCity", agentDetails?.sellerBrokerage?.cityId);
    setValue("buyerStateProvince", agentDetails?.buyerBrokerage?.stateId);
    setValue("buyerCity", agentDetails?.buyerBrokerage?.cityId);
    
    // Explicitly set commission values to ensure they display correctly
    // Use setTimeout to ensure values are set after form reset completes
    setTimeout(() => {
      // Set seller commission (handle both string and number types, including 0)
      if (agentDetails?.sellerCommission !== null && agentDetails?.sellerCommission !== undefined) {
        const sellerCommValue = typeof agentDetails.sellerCommission === 'string' 
          ? agentDetails.sellerCommission 
          : String(agentDetails.sellerCommission);
        setValue("sellerCommission", sellerCommValue);
      }
      if (agentDetails?.sellerCommissionAmount !== null && agentDetails?.sellerCommissionAmount !== undefined) {
        const sellerCommAmtValue = typeof agentDetails.sellerCommissionAmount === 'string' 
          ? agentDetails.sellerCommissionAmount 
          : String(agentDetails.sellerCommissionAmount);
        setValue("sellerCommissionAmount", sellerCommAmtValue);
      }
      // Set buyer commission (handle both string and number types, including 0)
      if (agentDetails?.buyerCommission !== null && agentDetails?.buyerCommission !== undefined) {
        const buyerCommValue = typeof agentDetails.buyerCommission === 'string' 
          ? agentDetails.buyerCommission 
          : String(agentDetails.buyerCommission);
        setValue("buyerCommission", buyerCommValue);
      }
      if (agentDetails?.buyerCommissionAmount !== null && agentDetails?.buyerCommissionAmount !== undefined) {
        const buyerCommAmtValue = typeof agentDetails.buyerCommissionAmount === 'string' 
          ? agentDetails.buyerCommissionAmount 
          : String(agentDetails.buyerCommissionAmount);
        setValue("buyerCommissionAmount", buyerCommAmtValue);
      }
    }, 0);

    // Set formatted values
    setSellerBrokeragePhoneNumber(formatPhoneNumber(agentDetails?.sellerBrokerage?.phoneNumber));
    setSellerBrokerageFaxNumber(formatPhoneNumber(agentDetails?.sellerBrokerage?.faxNumber));
    setSellerBrokeragePostalZipCode(formatPostalCode(agentDetails?.sellerBrokerage?.postalZipCode));
    setBuyerBrokeragePhoneNumber(formatPhoneNumber(agentDetails?.buyerBrokerage?.phoneNumber));
    setBuyerBrokerageFaxNumber(formatPhoneNumber(agentDetails?.buyerBrokerage?.faxNumber));
    setBuyerBrokeragePostalZipCode(formatPostalCode(agentDetails?.buyerBrokerage?.postalZipCode));
  } else {
    console.log(brokerageData?.data?.brokerageData);

    // Find brokerage by email for buyer and seller - THIS IS THE MISSING LOGIC
    // const tradeSheet = data?.data?.tradeSheetData;
    const brokerageList = brokerageData?.data?.brokerageData || [];
    let buyerBrokerage, sellerBrokerage;
    
    if (tradeSheet?.representation === "buyer" || tradeSheet?.representation === "tenant" ) {
      buyerBrokerage = brokerageList.find(
        (brokerage) => brokerage.agentData?.find((agent) => agent.email === tradeSheet?.email)
      );
      // Find the agent in the brokerage's agentData
      const buyerAgent = buyerBrokerage?.agentData?.find((agent) => agent.email === tradeSheet?.email);
      
      const buyerFormData = {
        buyerFirstName: tradeSheet?.firstName,
        buyerLastName: tradeSheet?.lastName,
        buyerEmail: tradeSheet?.email,
        buyerBrokerageId: buyerBrokerage?.id,
        buyerBrokerageName: buyerBrokerage?.brokerageName,
        buyerBrokerageAddress: buyerBrokerage?.address,
        buyerStreetAddress: buyerBrokerage?.streetAddress,
        buyerStreetAddressLine2: buyerBrokerage?.streetAddressLine2,
        buyerCountryId: 39,
        buyerStateProvince: buyerBrokerage?.stateId,
        buyerCity: buyerBrokerage?.cityId,
        buyerPostalZipCode: buyerBrokerage?.postalZipCode,
        buyerBrokeragePhoneNumber: buyerBrokerage?.phoneNumber,
        buyerBrokerageFaxNumber: buyerBrokerage?.faxNumber,
        buyerBrokerageBillingEmailAddress: buyerBrokerage?.billingEmailAddress,
        buyerInternalAgent: buyerAgent?.id,
      };

      reset(buyerFormData);
      
      if (buyerBrokerage?.id) {
        setValue("buyerBrokerageId", buyerBrokerage.id);
      }
      if (buyerAgent?.id) {
        setValue("buyerInternalAgent", buyerAgent.id);
      }

      // Set formatted values for buyer
      setBuyerBrokeragePhoneNumber(formatPhoneNumber(buyerBrokerage?.phoneNumber));
      setBuyerBrokerageFaxNumber(formatPhoneNumber(buyerBrokerage?.faxNumber));
      setBuyerBrokeragePostalZipCode(formatPostalCode(buyerBrokerage?.postalZipCode));

    } else if (tradeSheet?.representation === "seller"  || tradeSheet?.representation === "landlord") {
      sellerBrokerage = brokerageList.find(
        (brokerage) => brokerage.agentData?.find((agent) => agent.email === tradeSheet?.email)
      );
      const sellerAgent = sellerBrokerage?.agentData?.find((agent) => agent.email === tradeSheet?.email);
      
      const sellerFormData = {
        sellerFirstName: tradeSheet?.firstName,
        sellerLastName: tradeSheet?.lastName,
        sellerEmail: tradeSheet?.email,
        sellerBrokerageId: sellerBrokerage?.id,
        sellerBrokerageName: sellerBrokerage?.brokerageName,
        sellerBrokerageAddress: sellerBrokerage?.address,
        sellerStreetAddress: sellerBrokerage?.streetAddress,
        sellerStreetAddressLine2: sellerBrokerage?.streetAddressLine2,
        sellerCountryId: 39,
        sellerStateProvince: sellerBrokerage?.stateId,
        sellerCity: sellerBrokerage?.cityId,
        sellerPostalZipCode: sellerBrokerage?.postalZipCode,
        sellerBrokeragePhoneNumber: sellerBrokerage?.phoneNumber,
        sellerBrokerageFaxNumber: sellerBrokerage?.faxNumber,
        sellerBrokerageBillingEmailAddress: sellerBrokerage?.billingEmailAddress,
        sellerInternalAgent: sellerAgent?.id,
      };

      reset(sellerFormData);
      
      if (sellerBrokerage?.id) {
        setValue("sellerBrokerageId", sellerBrokerage.id);
      }
      if (sellerAgent?.id) {
        setValue("sellerInternalAgent", sellerAgent.id);
      }

      // Set formatted values for seller
      setSellerBrokeragePhoneNumber(formatPhoneNumber(sellerBrokerage?.phoneNumber));
      setSellerBrokerageFaxNumber(formatPhoneNumber(sellerBrokerage?.faxNumber));
      setSellerBrokeragePostalZipCode(formatPostalCode(sellerBrokerage?.postalZipCode));

    } else if( tradeSheet?.representationType === "designation") {
      const seller_agent = internalAgent?.data?.userData?.find( item => item.id === tradeSheet?.seller_landlord_agent_id);
      const buyer_agent = internalAgent?.data?.userData?.find( item => item.id === tradeSheet?.buyer_tenant_agent_id );

      const bothFormData = {
        // Seller details
        sellerFirstName: seller_agent?.firstName,
        sellerLastName: seller_agent?.lastName,
        sellerEmail: seller_agent?.email,
        sellerBrokerageId: seller_agent?.brokerageId,
        sellerBrokerageName: seller_agent.brokerageData?.brokerageName,
        sellerBrokerageAddress: seller_agent.brokerageData?.address,
        sellerStreetAddress: seller_agent.brokerageData?.streetAddress,
        sellerStreetAddressLine2: seller_agent.brokerageData?.streetAddressLine2,
        sellerCountryId: 39,
        sellerStateProvince: seller_agent.brokerageData?.stateId,
        sellerCity: seller_agent.brokerageData?.cityId,
        sellerPostalZipCode: seller_agent.brokerageData?.postalZipCode,
        sellerBrokeragePhoneNumber: seller_agent.brokerageData?.phoneNumber,
        sellerBrokerageFaxNumber: seller_agent.brokerageData?.faxNumber,
        sellerBrokerageBillingEmailAddress: seller_agent.brokerageData?.billingEmailAddress,
        sellerInternalAgent: seller_agent?.id,
        
        // Buyer details
        buyerFirstName: buyer_agent?.firstName,
        buyerLastName: buyer_agent?.lastName,
        buyerEmail: buyer_agent?.email,
        buyerBrokerageId: buyer_agent?.brokerageId,
        buyerBrokerageName: buyer_agent.brokerageData?.brokerageName,
        buyerBrokerageAddress: buyer_agent.brokerageData?.address,
        buyerStreetAddress: buyer_agent.brokerageData?.streetAddress,
        buyerStreetAddressLine2: buyer_agent.brokerageData?.streetAddressLine2,
        buyerCountryId: 39,
        buyerStateProvince: buyer_agent.brokerageData?.stateId,
        buyerCity: buyer_agent.brokerageData?.cityId,
        buyerPostalZipCode: buyer_agent.brokerageData?.postalZipCode,
        buyerBrokeragePhoneNumber: buyer_agent.brokerageData?.phoneNumber,
        buyerBrokerageFaxNumber: buyer_agent.brokerageData?.faxNumber,
        buyerBrokerageBillingEmailAddress: buyer_agent.brokerageData?.billingEmailAddress,
        buyerInternalAgent: buyer_agent?.id,
      };

      reset(bothFormData);
      
      if (seller_agent?.brokerageId && buyer_agent?.brokerageId) {
        setValue("sellerBrokerageId", seller_agent?.brokerageId);
        setValue("buyerBrokerageId", buyer_agent?.brokerageId);
      }
      if (buyer_agent?.id && seller_agent?.id) {
        setValue("sellerInternalAgent", seller_agent?.id);
        setValue("buyerInternalAgent", buyer_agent?.id);
      }

      // Set formatted values for both
      setSellerBrokeragePhoneNumber(formatPhoneNumber(seller_agent.brokerageData?.phoneNumber));
      setSellerBrokerageFaxNumber(formatPhoneNumber(seller_agent.brokerageData?.faxNumber));
      setSellerBrokeragePostalZipCode(formatPostalCode(seller_agent.brokerageData?.postalZipCode));
      setBuyerBrokeragePhoneNumber(formatPhoneNumber(buyer_agent.brokerageData?.phoneNumber));
      setBuyerBrokerageFaxNumber(formatPhoneNumber(buyer_agent.brokerageData?.faxNumber));
      setBuyerBrokeragePostalZipCode(formatPostalCode(buyer_agent.brokerageData?.postalZipCode));
    }else {
      // For 'both' or other cases, set both buyer and seller details if available
      const brokerage = brokerageList.find(
        (brokerage) => brokerage.agentData?.find((agent) => agent.email === tradeSheet?.email)
      );
      const agent = brokerage?.agentData?.find((agent) => agent.email === tradeSheet?.email);

      const bothFormData = {
        // Seller details
        sellerFirstName: tradeSheet?.firstName,
        sellerLastName: tradeSheet?.lastName,
        sellerEmail: tradeSheet?.email,
        sellerBrokerageId: brokerage?.id,
        sellerBrokerageName: brokerage?.brokerageName,
        sellerBrokerageAddress: brokerage?.address,
        sellerStreetAddress: brokerage?.streetAddress,
        sellerStreetAddressLine2: brokerage?.streetAddressLine2,
        sellerCountryId: 39,
        sellerStateProvince: brokerage?.stateId,
        sellerCity: brokerage?.cityId,
        sellerPostalZipCode: brokerage?.postalZipCode,
        sellerBrokeragePhoneNumber: brokerage?.phoneNumber,
        sellerBrokerageFaxNumber: brokerage?.faxNumber,
        sellerBrokerageBillingEmailAddress: brokerage?.billingEmailAddress,
        sellerInternalAgent: agent?.id,
        
        // Buyer details
        buyerFirstName: tradeSheet?.firstName,
        buyerLastName: tradeSheet?.lastName,
        buyerEmail: tradeSheet?.email,
        buyerBrokerageId: brokerage?.id,
        buyerBrokerageName: brokerage?.brokerageName,
        buyerBrokerageAddress: brokerage?.address,
        buyerStreetAddress: brokerage?.streetAddress,
        buyerStreetAddressLine2: brokerage?.streetAddressLine2,
        buyerCountryId: 39,
        buyerStateProvince: brokerage?.stateId,
        buyerCity: brokerage?.cityId,
        buyerPostalZipCode: brokerage?.postalZipCode,
        buyerBrokeragePhoneNumber: brokerage?.phoneNumber,
        buyerBrokerageFaxNumber: brokerage?.faxNumber,
        buyerBrokerageBillingEmailAddress: brokerage?.billingEmailAddress,
        buyerInternalAgent: agent?.id,
      };

      reset(bothFormData);
      
      if (brokerage?.id) {
        setValue("sellerBrokerageId", brokerage.id);
        setValue("buyerBrokerageId", brokerage.id);
      }
      if (agent?.id) {
        setValue("sellerInternalAgent", agent.id);
        setValue("buyerInternalAgent", agent.id);
      }

      // Set formatted values for both
      setSellerBrokeragePhoneNumber(formatPhoneNumber(brokerage?.phoneNumber));
      setSellerBrokerageFaxNumber(formatPhoneNumber(brokerage?.faxNumber));
      setSellerBrokeragePostalZipCode(formatPostalCode(brokerage?.postalZipCode));
      setBuyerBrokeragePhoneNumber(formatPhoneNumber(brokerage?.phoneNumber));
      setBuyerBrokerageFaxNumber(formatPhoneNumber(brokerage?.faxNumber));
      setBuyerBrokeragePostalZipCode(formatPostalCode(brokerage?.postalZipCode));
    }
  }
}, [data, reset, setValue, brokerageData]);

  // Preselect brokerage when agent creation modals open
  useEffect(() => {
    if (isSellerAgentCreateModalOpen && sellerBrokerageId) {
      sellerAgentForm.setValue('brokerageId', sellerBrokerageId);
    }
  }, [isSellerAgentCreateModalOpen, sellerBrokerageId]);

  useEffect(() => {
    if (isBuyerAgentCreateModalOpen && buyerBrokerageId) {
      buyerAgentForm.setValue('brokerageId', buyerBrokerageId);
    }
  }, [isBuyerAgentCreateModalOpen, buyerBrokerageId]);

// Initialize shared users data
useEffect(() => {
  const agentDetails = data?.data?.tradeSheetData?.agentDetails[0];
  const tradeSheet = data?.data?.tradeSheetData;
  const apiSharedUsers = data?.data?.tradeSheetData?.sharedUsers;

  console.log('=== INITIALIZING SHARED USERS ===');
  console.log('API Shared Users:', apiSharedUsers);
  console.log('Agent Details:', agentDetails);
  console.log('Trade Sheet:', tradeSheet);

  if (apiSharedUsers && apiSharedUsers.length > 0) {
    console.log('Setting shared users from API:', apiSharedUsers);
    setHasSharedUsers(true);
    setSharedUsersData(apiSharedUsers);
    setValue("sharedUsers", apiSharedUsers);
  } else {
    console.log('No shared users found in API response');
    setHasSharedUsers(false);
    setSharedUsersData([]);
    setValue("sharedUsers", []);
  }
}, [data, setValue]);

// Add this debug useEffect to see what's happening
useEffect(() => {
  console.log('=== SHARED USERS STATE UPDATE ===');
  console.log('sharedUsersData:', sharedUsersData);
  console.log('hasSharedUsers:', hasSharedUsers);
}, [sharedUsersData, hasSharedUsers]);

  // Handle brokerage change
  const handleBrokerageChange = async (selectedOption: any, type: string) => {
    if (selectedOption) {
      const selectedValue = selectedOption;
      const selectedBrokerage = brokerageData?.data?.brokerageData?.find(
        (brokerage: any) => brokerage.id === selectedValue
      );
      
      setValue(`${type}BrokerageId`, selectedValue);
      setValue(`${type}BrokerageName`, selectedBrokerage?.brokerageName || "");

      if (selectedBrokerage) {
        setValue(`${type}BrokerageAddress`, selectedBrokerage?.address);
        setValue(`${type}StreetAddress`, selectedBrokerage?.streetAddress);
        setValue(`${type}StreetAddressLine2`, selectedBrokerage.streetAddressLine2);
        setValue(`${type}CountryId`, selectedBrokerage?.countryId);
        setValue(`${type}City`, selectedBrokerage?.cityId);
        setValue(`${type}StateProvince`, selectedBrokerage?.stateId);
        setValue(`${type}PostalZipCode`, selectedBrokerage?.postalZipCode);
        setValue(`${type}BrokeragePhoneNumber`, selectedBrokerage?.phoneNumber);
        setValue(`${type}BrokerageFaxNumber`, selectedBrokerage?.faxNumber);
        setValue(`${type}BrokerageBillingEmailAddress`, selectedBrokerage?.billingEmailAddress);

        // Update formatted values
        if (type === "seller") {
          setSellerBrokeragePhoneNumber(formatPhoneNumber(selectedBrokerage?.phoneNumber));
          setSellerBrokerageFaxNumber(formatPhoneNumber(selectedBrokerage?.faxNumber));
          setSellerBrokeragePostalZipCode(formatPostalCode(selectedBrokerage?.postalZipCode));
        } else {
          setBuyerBrokeragePhoneNumber(formatPhoneNumber(selectedBrokerage?.phoneNumber));
          setBuyerBrokerageFaxNumber(formatPhoneNumber(selectedBrokerage?.faxNumber));
          setBuyerBrokeragePostalZipCode(formatPostalCode(selectedBrokerage?.postalZipCode));
        }
      }
    } else {
      // Clear values
      setValue(`${type}BrokerageName`, "");
      setValue(`${type}BrokerageAddress`, "");
      setValue(`${type}StreetAddress`, "");
      setValue(`${type}StreetAddressLine2`, "");
      setValue(`${type}CountryId`, 39);
      setValue(`${type}City`, "");
      setValue(`${type}StateProvince`, "");
      setValue(`${type}PostalZipCode`, "");
      setValue(`${type}BrokeragePhoneNumber`, "");
      setValue(`${type}BrokerageFaxNumber`, "");
      setValue(`${type}BrokerageBillingEmailAddress`, "");

      if (type === "seller") {
        setSellerBrokeragePhoneNumber("");
        setSellerBrokerageFaxNumber("");
        setSellerBrokeragePostalZipCode("");
      } else {
        setBuyerBrokeragePhoneNumber("");
        setBuyerBrokerageFaxNumber("");
        setBuyerBrokeragePostalZipCode("");
      }
    }
  };

  // Form submission
  const onSubmit = async (formData: any) => {
    setBtnLoading(formData.saveBtn);
    try {
      const isDraft = formData.saveBtn === "save-draft";
      // Save agent names as "First" / "Last" (first letter capital, rest lower; no duplicated last name).
      const seller = cleanPersonName(formData.sellerFirstName, formData.sellerLastName);
      const buyer = cleanPersonName(formData.buyerFirstName, formData.buyerLastName);
      const named = {
        ...formData,
        ...(formData.sellerFirstName || formData.sellerLastName ? { sellerFirstName: seller.firstName, sellerLastName: seller.lastName } : {}),
        ...(formData.buyerFirstName || formData.buyerLastName ? { buyerFirstName: buyer.firstName, buyerLastName: buyer.lastName } : {}),
      };
      const requestData = isDraft ? { ...named, status: "draft" } : named;

      const response = await createUpdateAgentDetails({
        data: requestData,
        uuid,
      }).unwrap();

      toast.success(`${response?.message}`);

      let navigatePath = "";
      switch (formData.saveBtn) {
        case "save-next":
          if (tradeSheetRepresentationData === "tenant" || tradeSheetRepresentationData === "landlord" || tradeSheetRepresentationData === "tenant,landlord" || tradeSheetRepresentationData === "landlord,tenant") {
            if(tradeSheetRepresentationData === "tenant" || tradeSheetRepresentationData === "landlord"){
              navigatePath = `/dashboard/agent/pages/form/trade-sheet/paperwork-attachment-upload/${uuid}`;
            }else{
              navigatePath = `/dashboard/agent/pages/form/trade-sheet/paperwork-attachment-upload-multiple-representation/${uuid}`;
            }
            
            
          } else {
            navigatePath = `/dashboard/agent/pages/form/trade-sheet/lawyer-details/${uuid}`;
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

  // Reset form
  const resetForm = () => {
    const sharedUsers = data?.data?.tradeSheetData?.sharedUsers;
    reset();
    
    if (sharedUsers && sharedUsers.length > 0) {
      setTimeout(() => {
        setValue("sharedUsers", sharedUsers);
        sharedUsers.forEach((user: any, index: number) => {
          setValue(`sharedUsers.${index}.id`, user.id);
          setValue(`sharedUsers.${index}.sharedUserId`, user.sharedUserId);
          setValue(`sharedUsers.${index}.name`, user.name || "");
          setValue(`sharedUsers.${index}.email`, user.email || "");
          setValue(`sharedUsers.${index}.commissionType`, user.commissionType || "percentage");
          setValue(`sharedUsers.${index}.commission`, user.commission || user.userPercentage || 0);
        });
      }, 100);
    }
    
    toast.success("Successfully Reset!");
  };

  const cancelSubmit = () => {
    toast.error("You are canceling the creation of the trade sheet!");
    navigate(
      `/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list`,
      { replace: true }
    );
  };

  // Phone number and formatting handlers
  const handleChangeSellerBrokeragePhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value;
    const value = formatPhoneNumber(phoneNumber);
    setSellerBrokeragePhoneNumber(value);
  };

  const handleChangeSellerBrokerageFaxNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const faxNumber = e.target.value;
    const value = formatPhoneNumber(faxNumber);
    setSellerBrokerageFaxNumber(value);
  };

  const handleChangeSellerBrokeragePostalZipCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const zipCode = e.target.value;
    const value = formatPostalCode(zipCode);
    setSellerBrokeragePostalZipCode(value);
  };

  const handleChangeBuyerBrokeragePhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value;
    const value = formatPhoneNumber(phoneNumber);
    setBuyerBrokeragePhoneNumber(value);
  };

  const handleChangeBuyerBrokerageFaxNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const faxNumber = e.target.value;
    const value = formatPhoneNumber(faxNumber);
    setBuyerBrokerageFaxNumber(value);
  };

  const handleChangeBuyerBrokeragePostalZipCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const zipCode = e.target.value;
    const value = formatPostalCode(zipCode);
    setBuyerBrokeragePostalZipCode(value);
  };

  const handlePostalZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPostalCode(value);
    setPostalCode(formattedValue);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value);
    setPhoneNumber(formattedValue);
  };

  const handlePhoneNumberChangeValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value);
    setValue("phoneNumber", formattedValue);
    brokerageForm.setValue("phoneNumber", formattedValue);
    setPhoneNumber(formattedValue);
  };

  const handleAddressChangeValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("address", value);
    brokerageForm.setValue("address", value);
  };

  const handleSellerBrokerageCreateModalClose = () => {
    setIsSellerBrokerageCreateModalOpen(false);
    setModalState("");
    resetBrokerageForm();
  };

 

  const handleBuyerBrokerageCreateModalClose = () => {
    setIsBuyerBrokerageCreateModalOpen(false);
    setModalState("");
    resetBrokerageForm();
  };

  const { user } = useAppSelector((state) => state.user);

  const handleCancelValidation = () => {
    setIsValidationModalOpen(false);
    reset({ phoneNumber: "", address: "" });
  };

  const handleModalStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateId = e.target.value;
    setModalState(stateId);
    setValue("stateId", stateId);
    setValue("cityId", "");
  };

  const resetBrokerageForm = () => {
    setValue("brokerageName", "");
    setValue("address", "");
    setValue("streetAddress", "");
    setValue("streetAddressLine2", "");
    setValue("phoneNumber", "");
    setValue("faxNumber", "");
    setValue("postalZipCode", "");
    setValue("email", "");
    setPhoneNumber("");
  };

  const onSubmitValidation = async () => {
    setIsUploading(true);
    const data = getValues();
    const targetType = isValidationModalOpen;

    try {
      const response = (await validateBrokerageData(data)) as any;

      if (response?.error?.data?.status == false) {
        setIsUploading(false);
        toast.error(`${response?.error.data?.message}`);
      } else if (response?.data?.status == true) {
        setIsUploading(false);
        setIsValidationModalOpen(false);
        if (targetType === "seller") {
          setIsSellerBrokerageCreateModalOpen(true);
        } else if (targetType === "buyer") {
          setIsBuyerBrokerageCreateModalOpen(true);
        }
      } else {
        setIsUploading(false);
      }
    } catch {
      setIsUploading(false);
    }
  };

  const handleCreateBrokerage = async (type: "seller" | "buyer") => {
    try {
      const brokerageValues = brokerageForm.getValues();
      const brokerageData = {
        brokerageName: brokerageValues.brokerageName,
        address: brokerageValues.address,
        streetAddress: brokerageValues.streetAddress,
        countryId: 39,
        stateId: brokerageValues.stateId,
        cityId: brokerageValues.cityId,
        postalZipCode: brokerageValues.postalZipCode,
        phoneNumber: brokerageValues.phoneNumber,
        faxNumber: brokerageValues.faxNumber,
        billingEmailAddress: brokerageValues.email,
      };

      const response = await createBrokerage(brokerageData).unwrap();

      if (response?.status) {
        toast.success("Brokerage created successfully!");

        await new Promise((resolve) => setTimeout(resolve, 100));

        handleBrokerageChange(brokerageData.brokerageName, type);

        // Reset modal state and form
        setModalState("");
        brokerageForm.reset();
        setPhoneNumber("");
        setFaxNumber("");
        setPostalCode("");

        // Close the appropriate modal
        if (type === "seller") {
          setIsSellerBrokerageCreateModalOpen(false);
        } else {
          setIsBuyerBrokerageCreateModalOpen(false);
        }
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create brokerage");
    }
  };

  // Prefill agent details when agent is selected
  useEffect(() => {
    const selectedId = watch("sellerInternalAgent");
    if (sellerAgentOptions.length > 0 && selectedId) {
      const selectedAgent = internalAgent?.data?.userData?.find(
        (agent) => String(agent.id) === String(selectedId)
      );
      if (selectedAgent) {
        const n = cleanPersonName(selectedAgent.firstName, selectedAgent.lastName);
        setValue("sellerFirstName", n.firstName);
        setValue("sellerLastName", n.lastName);
        setValue("sellerEmail", selectedAgent.email);
      }
    }
  }, [watch("sellerInternalAgent"), sellerAgentOptions, internalAgent, setValue]);

  useEffect(() => {
    const selectedId = watch("buyerInternalAgent");
    if (buyerAgentOptions.length > 0 && selectedId) {
      const selectedAgent = internalAgent?.data?.userData?.find(
        (agent) => String(agent.id) === String(selectedId)
      );
      if (selectedAgent) {
        const n = cleanPersonName(selectedAgent.firstName, selectedAgent.lastName);
        setValue("buyerFirstName", n.firstName);
        setValue("buyerLastName", n.lastName);
        setValue("buyerEmail", selectedAgent.email);
      }
    }
  }, [watch("buyerInternalAgent"), buyerAgentOptions, internalAgent, setValue]);

  // Brokerage modal content
  const brokerageModalContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
      <div className="flex flex-col gap-2">
        <label>Phone Number<span className="text-red-500 ml-1">*</span></label>
        <input
          {...brokerageForm.register("phoneNumber")}
          type="text"
          placeholder="(000) 000-0000"
          className="border border-gray-300 p-2 rounded"
          onChange={handlePhoneNumberChange}
          value={phoneNumber}
        />
        {brokerageForm.formState.errors.phoneNumber && (
          <p className="text-red-500 text-sm">{brokerageForm.formState.errors.phoneNumber.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label>Brokerage Name <span className="text-red-500 ml-1">*</span></label>
        <input
          {...brokerageForm.register("brokerageName", { required: "Brokerage name is required" })}
          type="text"
          placeholder="Enter Brokerage Name"
          className="border border-gray-300 p-2 rounded"
        />
        {brokerageForm.formState.errors.brokerageName && (
          <p className="text-red-500 text-sm">{brokerageForm.formState.errors.brokerageName.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label>Address<span className="text-red-500 ml-1">*</span></label>
        <input
          {...brokerageForm.register("address", { required: "Address is required" })}
          type="text"
          placeholder="Enter Address"
          className="border border-gray-300 p-2 rounded"
        />
        {brokerageForm.formState.errors.address && (
          <p className="text-red-500 text-sm">{brokerageForm.formState.errors.address.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label>Street Address</label>
        <input
          {...brokerageForm.register("streetAddress")}
          type="text"
          placeholder="Enter Street Address"
          className="border border-gray-300 p-2 rounded"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label>Brokerage's Province<span className="text-red-500 ml-1">*</span></label>
        <select
          {...brokerageForm.register("stateId", { required: "Province is required" })}
          onChange={handleModalStateChange}
          className="border border-gray-300 p-2 rounded"
        >
          <option value="">Select Province</option>
          {states?.data?.states?.map((state: any) => (
            <option key={state.id} value={state.id}>{state.name}</option>
          ))}
        </select>
        {brokerageForm.formState.errors.stateId && (
          <p className="text-red-500 text-sm">{brokerageForm.formState.errors.stateId.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label>City<span className="text-red-500 ml-1">*</span></label>
        <select
          {...brokerageForm.register("cityId", { required: "City is required" })}
          disabled={!modalState}
          className="border border-gray-300 p-2 rounded"
        >
          <option value="">Select City</option>
          {modalCitiesData?.data?.cities?.map((city: any) => (
            <option key={city.id} value={city.id}>{city.name}</option>
          ))}
        </select>
        {brokerageForm.formState.errors.cityId && (
          <p className="text-red-500 text-sm">{brokerageForm.formState.errors.cityId.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label>Postal Code<span className="text-red-500 ml-1">*</span></label>
        <input
          {...brokerageForm.register("postalZipCode")}
          type="text"
          placeholder="e.g. A1A 1A1"
          className="border border-gray-300 p-2 rounded"
          onChange={handlePostalZipCodeChange}
          value={postalCode}
        />
        {brokerageForm.formState.errors.postalZipCode && (
          <p className="text-red-500 text-sm">{brokerageForm.formState.errors.postalZipCode.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label>Fax Number</label>
        <input
          {...brokerageForm.register("faxNumber")}
          type="text"
          placeholder="(000) 000-0000"
          className="border border-gray-300 p-2 rounded"
          onChange={e => {
            const formatted = formatPhoneNumber(e.target.value);
            setFaxNumber(formatted);
            brokerageForm.setValue("faxNumber", formatted);
          }}
          value={faxNumber}
        />
      </div>

      {user.userType != 'agent' && (
      <div className="flex flex-col gap-2">
        <label>Billing Email Address</label>
        <input
          {...brokerageForm.register("email", {
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address",
            },
          })}
          type="email"
          placeholder="Enter billing email"
          className="border border-gray-300 p-2 rounded"
        />
        {brokerageForm.formState.errors.email && (
          <p className="text-red-500 text-sm">{brokerageForm.formState.errors.email.message as string}</p>
        )}
      </div>
      )}
    </div>
  );

  return (
    <div>
      <TradeSheetSteps active={5} uuid={uuid} />

      {/* Form */}
      {isLoading ? (
        <TableLoader />
      ) : (
        <div className="max-w-full mt-8 p-8 border border-gray-300/30 rounded-md border-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <h3 className="py-2">Agent's Details:</h3>
            
            {/* Seller's Agent Section */}
            <AgentSection
              type="seller"
              title={`${firstAgent}'s Agent`}
              register={register}
              errors={errors}
              control={control}
              watch={watch}
              setValue={setValue}
              brokerageOptions={brokerageOptions}
              agentOptions={sellerAgentOptions}
              brokerageId={sellerBrokerageId}
              states={states}
              cities={cities}
              selectedState={selectedState}
              selectedCity={selectedCity}
              formattedPhoneNumber={sellerBrokeragePhoneNumber}
              formattedFaxNumber={sellerBrokerageFaxNumber}
              formattedPostalCode={sellerBrokeragePostalZipCode}
              onBrokerageChange={handleBrokerageChange}
              onPhoneNumberChange={handleChangeSellerBrokeragePhoneNumber}
              onFaxNumberChange={handleChangeSellerBrokerageFaxNumber}
              onPostalCodeChange={handleChangeSellerBrokeragePostalZipCode}
              onBrokerageCreate={() => setIsValidationModalOpen("seller")}
              onAgentCreate={() => setIsSellerAgentCreateModalOpen(true)}
              listType={data?.data?.tradeSheetData?.listType}
              representation={data?.data?.tradeSheetData?.representation}
            />

            {/* Buyer's Agent Section */}
            <AgentSection
              type="buyer"
              title={`${secondAgent}'s Agent`}
              register={register}
              errors={errors}
              control={control}
              watch={watch}
              setValue={setValue}
              brokerageOptions={brokerageOptions}
              agentOptions={buyerAgentOptions}
              brokerageId={buyerBrokerageId}
              states={buyerStates}
              cities={buyerCities}
              selectedState={selectedBuyerState}
              selectedCity={selectedBuyerCity}
              formattedPhoneNumber={buyerBrokeragePhoneNumber}
              formattedFaxNumber={buyerBrokerageFaxNumber}
              formattedPostalCode={buyerBrokeragePostalZipCode}
              onBrokerageChange={handleBrokerageChange}
              onPhoneNumberChange={handleChangeBuyerBrokeragePhoneNumber}
              onFaxNumberChange={handleChangeBuyerBrokerageFaxNumber}
              onPostalCodeChange={handleChangeBuyerBrokeragePostalZipCode}
              onBrokerageCreate={() => setIsValidationModalOpen("buyer")}
              onAgentCreate={() => setIsBuyerAgentCreateModalOpen(true)}
              listType={data?.data?.tradeSheetData?.listType}
              representation={data?.data?.tradeSheetData?.representation}
            />

            {/* Shared Users Section */}
            <SharedUsersSection
              sharedUsersData={sharedUsersData}
              setSharedUsersData={setSharedUsersData}
              hasSharedUsers={hasSharedUsers}
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
              internalAgent={internalAgent}
              sellerBrokerageId={sellerBrokerageId}
              buyerBrokerageId={buyerBrokerageId}
              tradeSheetUuid={uuid}
              tradeSheetRepresentationData={tradeSheetRepresentationData}
              firstAgent={firstAgent}
              secondAgent={secondAgent}
              addSharedUser={addSharedUser}
              removeSharedUser={removeSharedUser}
              updateSharedUserCommission={updateSharedUserCommission}
              // refetchTradeSheet={refetchTradeSheet}
            />

            {/* Action Buttons */}
            <div className="flex justify-between my-15 mx-5">
              <button
                type="submit"
                onClick={() => setValue("saveBtn", "save-next")}
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading === "save-next" ? <ButtonLoader /> : "Save and Next"}
              </button>

              <button
                type="submit"
                onClick={() => setValue("saveBtn", "save-exit")}
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading === "save-exit" ? <ButtonLoader /> : "Save and Exit"}
              </button>

              <button
                type="submit"
                onClick={() => setValue("saveBtn", "save-draft")}
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading === "save-draft" ? <ButtonLoader /> : "Save as Draft"}
              </button>

              <NavLink
                to={`/dashboard/agent/pages/form/trade-sheet/buyer-information/${uuid}`}
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

      {/* Modals */}
      <AgentCreationModal
        isOpen={isSellerAgentCreateModalOpen}
        onClose={() => {
          setIsSellerAgentCreateModalOpen(false);
          sellerAgentForm.reset();
        }}
        title="Create New Agent"
        form={sellerAgentForm}
        brokerageOptions={brokerageOptions}
        createAgent={createAgent}
        internalAgent={internalAgent}
        onSuccess={(newAgent) => {
          if (newAgent && newAgent.id) setValue('sellerInternalAgent', newAgent.id);
        }}
      />

      <AgentCreationModal
        isOpen={isBuyerAgentCreateModalOpen}
        onClose={() => {
          setIsBuyerAgentCreateModalOpen(false);
          buyerAgentForm.reset();
        }}
        title="Create New Agent"
        form={buyerAgentForm}
        brokerageOptions={brokerageOptions}
        createAgent={createAgent}
        internalAgent={internalAgent}
        onSuccess={(newAgent) => {
          if (newAgent && newAgent.id) setValue('buyerInternalAgent', newAgent.id);
        }}
      />

      <BrokerageCreationModal
        isOpen={isSellerBrokerageCreateModalOpen}
        onClose={handleSellerBrokerageCreateModalClose}
        title="Create New Brokerage"
        form={brokerageForm}
        modalContent={brokerageModalContent}
        onCreate={() => handleCreateBrokerage("seller")}
      />

      <BrokerageCreationModal
        isOpen={isBuyerBrokerageCreateModalOpen}
        onClose={handleBuyerBrokerageCreateModalClose}
        title="Create New Brokerage"
        form={brokerageForm}
        modalContent={brokerageModalContent}
        onCreate={() => handleCreateBrokerage("buyer")}
      />

      <ValidationModal
        isOpen={isValidationModalOpen}
        onClose={handleCancelValidation}
        title="Create Brokerage Data"
        isUploading={isUploading}
        register={register}
        errors={errors}
        onPhoneNumberChange={handlePhoneNumberChangeValidation}
        onAddressChange={handleAddressChangeValidation}
        onSubmitValidation={onSubmitValidation}
      />
    </div>
  );
};

export default TradeSheetAgentDetails;