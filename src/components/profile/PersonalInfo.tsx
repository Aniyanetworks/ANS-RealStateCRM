import { SubmitHandler, useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import {
  useGetCitiesQuery,
  useGetStatesQuery,
} from "../../redux/api/common/countryStateCitySlice";
import { useEffect, useState } from "react";
import { useUpdatePersonalInfoMutation } from "../../redux/api/userSlice";
import toast from "react-hot-toast";
import { useAppDispatch } from "../../redux/hooks";
import { setUser } from "../../redux/slices/userSlice";
import ButtonLoader from "../loader/buttonLoader";
import { RootState } from "../../redux/store";
import { formatPostalCode } from "../../utils/format";
interface FormData {
  gender?: string;
  nationality?: string;
  countryId?: number;
  stateId?: number;
  cityId?: number;
  address?: string;

  postalCode?: string;
}

interface State {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

const PersonalInfo = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useForm<FormData>();
  const { user } = useSelector((state: RootState) => state.user);
  const [updatePersonalInfo] = useUpdatePersonalInfoMutation();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [postalCode, setPostalCode] = useState<string>("");

  const selectedCountry = 39;
  useEffect(() => {
    setValue("stateId", user.stateId);
    setValue("cityId", user.cityId);
    setValue("postalCode",user.postalCode);
    setPostalCode(user.postalCode);
  }, [user, setValue]);
  const selectedState = watch("stateId");


  const { data: states = [] } = useGetStatesQuery(selectedCountry, {
    skip: !selectedCountry,
  });

  const { data: cities = [] } = useGetCitiesQuery(selectedState, {
    skip: !selectedState,
  });

  useEffect(() => {
    setValue("countryId", 39);
  }, [setValue,user]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    const newData = {
      gender: data.gender,
      countryId: 39,
      stateId: parseInt(data?.stateId || user.stateId),
      cityId: parseInt(data?.cityId || user.cityId),
      address: data.address,
      postalCode: data.postalCode,
    };

    const response = await updatePersonalInfo(newData);
    if (response.data.status) {
      toast.success(response.data.message);

      dispatch(setUser(response.data.data));
      setIsLoading(false);
    } else {
      toast.error(response.data.message);
      setIsLoading(false);
    }
  };

  const handleChangePostalCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('postalCode', { type: 'manual', message: '' });
    const postalCode = e.target.value;
    const value = formatPostalCode(postalCode);
    setPostalCode(value);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className=" bg-white space-y-5 p-5 rounded-md">
        <h2>Personal Information</h2>
        <div className=" grid grid-cols-2 gap-5">
          <div>
            <label htmlFor="gender">Gender <span className="text-red-500">*</span></label>
            <select
              {...register("gender", { required: "Gender is required" })}
              defaultValue={user.gender}
              id="gender"
            >
              <option value="" disabled selected hidden>
                Select Gender
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="others">Others</option>
            </select>
          </div>

          <div>
            <label>Province <span className="text-red-500">*</span></label>
            <select {...register("stateId", { required: "Province is required" })}>
              <option value="">Select Province</option>
              {states?.data?.states?.map((state: State) => (
                <option
                  key={state.id}
                  value={state.id}
                  selected={state.id == selectedState}
                >
                  {state.name}
                </option>
              ))}
            </select>
            {errors.stateId && (
              <p className="text-red-500 text-sm">{errors.stateId.message}</p>
            )}
          </div>
          <div>
            <label>City <span className="text-red-500">*</span></label>
            <select {...register("cityId", { required: "City is required" })}>
              <option value="">Select City</option>
              {cities?.data?.cities?.map((city: City) => (
                <option
                  key={city.id}
                  value={city.id}
                  selected={user.cityId == city.id}
                >
                  {city.name}
                </option>
              ))}
            </select>
            {errors.cityId && (
              <p className="text-red-500 text-sm">{errors.cityId.message}</p>
            )}
          </div>
          <div className="w-full">
            <label htmlFor="fname">Postal Code <span className="text-red-500">*</span></label>
            <input
              {...register("postalCode", { required: "Postal Code is required" })}
              onChange={handleChangePostalCode}
              value={postalCode}
              type="text"
              id="fname"
              className=" w-full"
            />
            {errors.postalCode && (
              <p className="text-red-500 text-sm">{errors.postalCode.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="address">Address</label>
            <textarea
              {...register("address")}
              defaultValue={user.address}
              id="address"
              className=" h-[50px] "
            ></textarea>
            {errors.address && (
              <p className="text-red-500 text-sm">{errors.address.message}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
            <button className="primary-btn relative flex gap-2 items-center">
              {isLoading ? "Loading" : " Save Changes"}
              {isLoading && <ButtonLoader />}
            </button>
          </div>
      </div>
    </form>
  );
};

export default PersonalInfo;
