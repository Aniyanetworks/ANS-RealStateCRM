import { Controller } from 'react-hook-form';
import Select from 'react-select';
import TextInput from './TextInput';
import CommercialCommissionTable from './CommercialCommissionTable';

interface AgentSectionProps {
  type: 'seller' | 'buyer';
  title: string;
  register: any;
  errors: any;
  control: any;
  watch: any;
  setValue: any;
  brokerageOptions: any[];
  agentOptions: any[];
  brokerageId: string;
  states: any;
  cities: any;
  selectedState: any;
  selectedCity: any;
  formattedPhoneNumber: string;
  formattedFaxNumber: string;
  formattedPostalCode: string;
  onBrokerageChange: (selectedOption: any, type: string) => void;
  onPhoneNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFaxNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPostalCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBrokerageCreate: () => void;
  onAgentCreate: () => void;
  listType?: string;
  representation?: string;
}

const AgentSection: React.FC<AgentSectionProps> = ({
  type,
  title,
  register,
  errors,
  control,
  watch,
  setValue,
  brokerageOptions,
  agentOptions,
  brokerageId,
  states,
  cities,
  selectedState,
  selectedCity,
  formattedPhoneNumber,
  formattedFaxNumber,
  formattedPostalCode,
  onBrokerageChange,
  onPhoneNumberChange,
  onFaxNumberChange,
  onPostalCodeChange,
  onBrokerageCreate,
  onAgentCreate,
  listType,
  representation,
}) => {
  const isCommercial = listType === 'Commercial';
  const isRent = representation === 'landlord' || representation === 'tenant';
  const showCommercialTable = isCommercial && isRent;
  return (
    <div className="max-FULL p-6 bg-[#c9c1c13d] rounded-lg shadow-md mt-6">
      <div>
        <h4 className="font-semibold my-3">{title}</h4>
        <span className="text-xs text-gray-500">
          <strong>Note:</strong> If you want to create a new agent, please
          type the agent First Name, Last Name, Email or select from
          existing agent dropdown.
        </span>
        <div className="flex space-x-4 w-full max-w-xl mt-2">
          <div className="flex flex-col w-full">
            <label>
              {title.split("'")[0]} Brokerage <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Select
                options={brokerageOptions}
                classNamePrefix="select"
                className={`react-select flex-1 ${errors[`${type}BrokerageName`] ? "border-red-500" : ""}`}
                onChange={selectedOption => {
                  if (selectedOption) {
                    onBrokerageChange(selectedOption.value, type);
                  } else {
                    setValue(`${type}BrokerageId`, null);
                    setValue(`${type}InternalAgent`, null);
                  }
                }}
                value={brokerageOptions.find(option => option.value === brokerageId) || null}
                isClearable={true}
              />
              {errors[`${type}BrokerageName`] && (
                <p className="text-red-500 text-sm">Brokerage is required</p>
              )}
              <button
                type="button"
                onClick={onBrokerageCreate}
                className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f766e] text-white transition hover:bg-[#0d6b64]"
              >
                +
              </button>
            </div>
          </div>

          <div className="mb-4 w-full" hidden={!brokerageId}>
            <label>Select Agent</label>
            <div className="flex items-center gap-2">
              <Controller
                name={`${type}InternalAgent`}
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={agentOptions}
                    value={agentOptions.find(option => option.value === field.value) || null}
                    onChange={option => field.onChange(option ? option.value : null)}
                    placeholder="Select Agent"
                    className="w-full"
                    classNamePrefix="select"
                    isDisabled={!brokerageId}
                    isClearable={true}
                  />
                )}
              />
              <button
                type="button"
                onClick={onAgentCreate}
                className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f766e] text-white transition hover:bg-[#0d6b64]"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
          <TextInput
            label="Agent First Name"
            disabled={true}
            register={register}
            required
            name={`${type}FirstName`}
            placeholder={`Enter ${type} agent first name`}
            errors={errors}
          />
          <TextInput
            label="Agent Last Name"
            disabled={true}
            register={register}
            required
            name={`${type}LastName`}
            errors={errors}
            placeholder={`Enter ${type} agent last name`}
          />
          <TextInput
            label="Agent Email"
            disabled={true}
            register={register}
            name={`${type}Email`}
            errors={errors}
            placeholder={`Enter ${type} agent email`}
            type="email"
          />
          <TextInput
            label="Brokerage's Address"
            disabled={true}
            register={register}
            required
            name={`${type}BrokerageAddress`}
            errors={errors}
          />
          <TextInput
            label="Brokerage's Street Address 2"
            disabled={true}
            register={register}
            name={`${type}StreetAddress`}
            errors={errors}
          />

          <div className="flex flex-col gap-2">
            <label>Brokerage's Province</label>
            <select
              {...register(`${type}StateProvince`, { required: "State is required" })}
              disabled={true}
            >
              <option value="">Select Province</option>
              {states?.data?.states?.map((state: any) => (
                <option key={state.id} value={state.id} selected={state.id == selectedState}>
                  {state.name}
                </option>
              ))}
            </select>
            {errors[`${type}StateProvince`] && (
              <p className="text-red-500 text-sm">State is required</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label>Brokerage's City</label>
            <select
              {...register(`${type}City`, { required: "City is required" })}
              disabled={true}
            >
              <option value="">Select City</option>
              {cities?.data?.cities?.map((city: any) => (
                <option key={city.id} value={city.id} selected={city.id == selectedCity}>
                  {city.name}
                </option>
              ))}
            </select>
            {errors[`${type}City`] && (
              <p className="text-red-500 text-sm">City is required</p>
            )}
          </div>

          <TextInput
            label="Brokerage's Postal Code"
            disabled={true}
            register={register}
            name={`${type}PostalZipCode`}
            errors={errors}
            placeholder={`Enter ${type} postal zip code`}
            onChange={onPostalCodeChange}
            value={formattedPostalCode}
          />
          <TextInput
            label="Brokerage's Phone Number"
            disabled={true}
            register={register}
            name={`${type}BrokeragePhoneNumber`}
            errors={errors}
            placeholder="(000) 000-0000"
            onChange={onPhoneNumberChange}
            value={formattedPhoneNumber}
          />
          <TextInput
            label="Brokerage's Fax Number"
            disabled={true}
            register={register}
            name={`${type}BrokerageFaxNumber`}
            errors={errors}
            placeholder="(000) 000-0000"
            onChange={onFaxNumberChange}
            value={formattedFaxNumber}
          />
          <TextInput
            label="Brokerage's Billing Email Address"
            disabled={true}
            register={register}
            name={`${type}BrokerageBillingEmailAddress`}
            errors={errors}
          />
          <div className="flex flex-col gap-2">
            <label>Agent Commission Type</label>
            <select
              {...register(`${type}CommissionType`)}
              className="border border-gray-300 p-2 rounded"
              defaultValue={watch(`${type}CommissionType`) || "percentage"}
            >
              <option value="percentage">Percentage</option>
              <option value="amount">Amount</option>
            </select>
          </div>
          {showCommercialTable ? (
            <CommercialCommissionTable
              type={type}
              control={control}
              setValue={setValue}
              watch={watch}
              errors={errors}
              commissionType={watch(`${type}CommissionType`) || "percentage"}
            />
          ) : (
            <>
              {watch(`${type}CommissionType`) === "percentage" ? (
                <div className="flex flex-col gap-2">
                  <label>
                    Agent Commission (%) {errors[`${type}Commission`] && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <Controller
                    name={`${type}Commission`}
                    control={control}
                    defaultValue=""
                    render={({ field }) => {
                      const displayValue = field.value !== null && field.value !== undefined 
                        ? String(field.value) 
                        : '';
                      return (
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder={`Enter ${type} commission percentage`}
                          className="border border-gray-300 p-2 rounded"
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              field.onChange(value);
                            }
                          }}
                          onBlur={field.onBlur}
                          value={displayValue}
                        />
                      );
                    }}
                  />
                  {errors[`${type}Commission`] && (
                    <p className="text-red-500 text-sm">Agent Commission is required</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label>
                    Agent Commission Amount {errors[`${type}CommissionAmount`] && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <Controller
                    name={`${type}CommissionAmount`}
                    control={control}
                    render={({ field }) => {
                      const displayValue = field.value != null && field.value !== '' 
                        ? String(field.value) 
                        : '';
                      return (
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder={`Enter ${type} commission amount`}
                          className="border border-gray-300 p-2 rounded"
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              field.onChange(value);
                            }
                          }}
                          onBlur={field.onBlur}
                          value={displayValue}
                        />
                      );
                    }}
                  />
                  {errors[`${type}CommissionAmount`] && (
                    <p className="text-red-500 text-sm">Agent Commission Amount is required</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentSection;