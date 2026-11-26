import { TextInput } from '../forms/inputs/TextInput';
import { formatPhoneNumber, formatPostalCode } from '../../utils/format';
import { FieldErrors, FieldValues, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { UseFormRegister } from 'react-hook-form';

interface BrokerageFormProps {
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors<FieldValues>;
  states: {
    data: {
        states: [];
    };
  };
  cities: {
    data: {
        cities: [];
    };
  };
  watch: UseFormWatch<FieldValues>;  
  setValue: UseFormSetValue<FieldValues>;
}

type State = {
  id: string;
  name: string;
};

type City = {
  id: string;
  name: string;
};

export const BrokerageForm = ({
  register,
  errors,
  states,
  cities,
  watch,
  setValue,
}: BrokerageFormProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TextInput
        label="Brokerage Name"
        register={register}
        required
        name="brokerageName"
        errors={errors}
        placeholder="Enter brokerage name"
      />
      <TextInput
        label="Brokerage's Address"
        register={register}
        required
        name="address"
        errors={errors}
        placeholder="Enter address"
      />
      <TextInput
        label="Street Address 2"
        register={register}
        name="streetAddress"
        errors={errors}
        placeholder="Enter street address"
      />
      <div className="flex flex-col gap-2">
        <label>Province <span className="text-red-500">*</span></label>
        <select
          {...register("stateId", { required: "Province is required" })}
          className="border rounded p-2"
          onChange={(e) => {
            setValue("stateId", e.target.value);
            setValue("cityId", "");
          }}
        >
          <option value="">Select Province</option>
          {states?.data?.states?.map((state: State) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
        {errors.stateId && (
          <p className="text-red-500 text-sm">{errors.stateId.message as string}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label>City <span className="text-red-500">*</span></label>
        <select
          {...register("cityId", { required: "City is required" })}
          className="border rounded p-2"
          disabled={!watch("stateId")}
        >
          <option value="">Select City</option>
          {cities?.data?.cities?.map((city: City) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        {errors.cityId && (
          <p className="text-red-500 text-sm">{errors.cityId.message as string}</p>
        )}
      </div>
      <TextInput
        label="Postal Code"
        register={register}
        required
        name="postalZipCode"
        errors={errors}
        placeholder="Enter postal code"
        onChange={(e) => {
          const formatted = formatPostalCode(e.target.value);
          setValue("postalZipCode", formatted);
        }}
      />
      <TextInput
        label="Phone Number"
        register={register}
        required
        name="phoneNumber"
        errors={errors}
        placeholder="(000) 000-0000"
        onChange={(e) => {
          const formatted = formatPhoneNumber(e.target.value);
          setValue("phoneNumber", formatted);
        }}
      />
      <TextInput
        label="Fax Number"
        register={register}
        name="faxNumber"
        errors={errors}
        placeholder="(000) 000-0000"
        onChange={(e) => {
          const formatted = formatPhoneNumber(e.target.value);
          setValue("faxNumber", formatted);
        }}
      />
      <TextInput
        label="Commission (%)"
        register={register}
        name="commission"
        errors={errors}
        type="number"
        step="0.01"
        placeholder="Enter commission percentage"
      />
    </div>
  );
}; 