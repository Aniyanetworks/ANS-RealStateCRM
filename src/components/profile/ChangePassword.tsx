/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck

import { SubmitHandler, useForm } from "react-hook-form";
import { useUpdatePasswordMutation } from "../../redux/api/userSlice";
import toast from "react-hot-toast";
import ButtonLoader from "../loader/buttonLoader";
import { useState } from "react";
import { usePermissions } from "../../utils/permissionUtils";

interface FormData {
  oldPass?: string;
  newPass?: string;
  confirmPass?: string;
}

const ChangePassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const { hasPermissionForSlug } = usePermissions();
  const [error, setError] = useState<string>("");
  const [updatePassword] = useUpdatePasswordMutation();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setIsLoading(true);
      if (data.newPass !== data.confirmPass) {
        setError("Password does not match");
        setIsLoading(false);
        return;
      } else {
        setError("");
      }

      const response = await updatePassword(data);
      console.log(response);
      if (response?.data?.status) {
        toast.success(response?.data?.message);
      } else if (response?.error?.data?.message) {
        toast.error(response?.error?.data?.message);
      } else {
        toast.error("Something went wrong");
      }
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* pasword start  */}
      <div className=" bg-white space-y-5 p-5 rounded-md">
        <h2>Change Password</h2>
        <div>
          <label htmlFor="old-pass">Current Password</label>
          <input
            {...register("oldPass", { required: true })}
            type="password"
            id="old-pass"
          />
          {errors.oldPass && (
            <p className="text-red-500">This field is required</p>
          )}
        </div>
        <div>
          <label htmlFor="new-pass">New Password</label>
          <input
            type="password"
            {...register("newPass", { required: true })}
            id="new-pass"
          />
          {errors.newPass && (
            <p className="text-red-500">This field is required</p>
          )}
        </div>
        <div>
          <label htmlFor="confirm-pass">Confirm Password</label>
          <input
            {...register("confirmPass", { required: true })}
            type="password"
            id="confirm-pass"
          />
          {errors.confirmPass && (
            <p className="text-red-500">This field is required</p>
          )}
          {error && <p className="text-red-500">{error}</p>}
        </div>
        {hasPermissionForSlug("edit-my-profile") && (
          <div className="flex justify-end">
            <button className="primary-btn relative flex gap-2 items-center">
              {isLoading ? "Loading" : " Save Changes"}
              {isLoading && <ButtonLoader />}
            </button>
          </div>
        )}
      </div>
      {/* pasword end */}
    </form>
  );
};

export default ChangePassword;
