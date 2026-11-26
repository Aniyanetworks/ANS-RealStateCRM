import { SubmitHandler, useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useUpdateContactInfoMutation } from "../../redux/api/userSlice";
import toast from "react-hot-toast";
import { useAppDispatch } from "../../redux/hooks";
import { setUser } from "../../redux/slices/userSlice";
import { useEffect, useState } from "react";
import ButtonLoader from "../loader/buttonLoader";
import { RootState } from "../../redux/store";
import { formatPhoneNumber } from "../../utils/format";
interface FormData {
  phoneCode?: string;
  phoneNumber?: string;
}

const ContactInfo = () => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>();
  const {user} = useSelector((state: RootState) => state.user);
  const [updateContactInfo] = useUpdateContactInfoMutation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    const response = await updateContactInfo(data);
    if (response.data.status) {
      toast.success(response.data.message);

      dispatch(setUser(response.data.data));
      setIsLoading(false);
    } else {
      toast.error(response.data.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setValue("phoneCode", '1');
    setValue("phoneNumber", user.phoneNumber);
  }, [user, setValue]);

  const handleChangePhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value;
    const value = formatPhoneNumber(phoneNumber);
    setPhoneNumber(value);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className=" bg-white space-y-5 p-5 rounded-md">
        <h2>Contact Information</h2>
        <div>
          <label htmlFor="email">Email Address</label>
          <input
            defaultValue={user.email}
            type="email"
            name=""
            id="email"
            readOnly
          />
        </div>
        <div className="flex gap-2">
          <div className="w-full">
            <label htmlFor="number">Phone Number</label>
            <input
              {...register("phoneNumber", { required: "Phone Number is required" })}
              onChange={handleChangePhoneNumber}
              value={phoneNumber}
              defaultValue={user.phoneNumber}
              type="text"
              id="number"
              placeholder="+1 (XXX) XXX-XXXX"
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>
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

export default ContactInfo;
