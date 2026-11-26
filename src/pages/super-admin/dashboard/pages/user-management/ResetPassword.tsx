import { useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import EyeBtn from "../../../../login/EyeBtn";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  useVerifyCodeMutation,
  useSendCodeMutation,
  useChangePasswordMutation
} from "../../../../../redux/api/userSlice";

import ButtonLoader from "../../../../../components/loader/buttonLoader";

interface PasswordFormInputs {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const { email } = useParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [textType, setTextType] = useState(false);
  const [step, setStep] = useState(1);

  const { register, handleSubmit, formState: { errors }, watch, getValues } = useForm<PasswordFormInputs>();
  const [sendCode, { isLoading: sendCodeLoading }] = useSendCodeMutation();

  const handleSendCode = async () => {
    const data = getValues();

    try {
      const response = await sendCode(data);

      if (response?.data?.status) {
        toast.success("Code sent successfully.");
        setStep(2);
      } else {
        toast.error("Failed to send code.");
      }
    } catch (error: any) {
      toast.error(error.data.message);
    }
  };

  const [verifyCode, { isLoading: verifyCodeLoading }] = useVerifyCodeMutation();

  const handleVerifyCode = async () => {
    const data = getValues();

    const response = await verifyCode(data);

    if (response?.data?.status) {
      if (response?.data?.data?.othersToken === code) {
        toast.success("Code verified successfully.");
        setStep(3);
      } else {
        toast.error("Invalid code. Please try again.");
      }
    } else {
      toast.error("Failed to verify code.");
    }
  };

  const [changePassword, { isLoading: changePasswordLoading }] = useChangePasswordMutation();

  const handleChangePassword = async () => {
    const data = getValues();
    const response = await changePassword(data);
    if (response?.data?.status) {
      toast.success("Password changed successfully.");
      navigate("/dashboard/super-admin/user-management");
    } else {
      toast.error("Failed to change password.");
    }
  };

  return (
    <div>
      {step === 1 && (
        <div className="flex items-center justify-center mt-20">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
            <h1 className="text-2xl font-semibold text-center text-gray-700 mb-6">Reset User Password</h1>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              {...register("email")}
              value={email}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />

            <button
              onClick={handleSendCode}
              className="w-full py-3 primary-btn"
              disabled={sendCodeLoading}
            >
              {sendCodeLoading ? <ButtonLoader /> : "Send Code"}
            </button>
          </div>
        </div>

      )}
      {step === 2 && (
        <form onSubmit={handleSubmit(handleVerifyCode)}>
          <div className="flex flex-col gap-4 items-center justify-center mt-20">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
              <h1 className="text-2xl font-semibold text-center text-gray-700 mb-6">Reset User Password</h1>
              <label htmlFor="code">Code</label>
              <input
                placeholder="Enter the code"
                {...register("code", { required: "Provide valid code" })}
                className="w-full p-3 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setCode(e.target.value)}
                type="number"
              />
              {errors.code && (
                <p className="text-red-500 mb-2 text-sm">{errors.code.message}</p>
              )}
              <button type="submit"
                className="w-full py-3 primary-btn"
                disabled={verifyCodeLoading}
              >
                {verifyCodeLoading ? <ButtonLoader /> : "Verify Code"}
              </button>
            </div>
          </div>
        </form>
      )}
      {step === 3 && (
        <form onSubmit={handleSubmit(handleChangePassword)}>
          <div className="flex flex-col gap-4 items-center justify-center mt-20">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
              <h1 className="text-2xl font-semibold text-center text-gray-700 mb-6">Reset User Password</h1>
              <div className="mb-2">
                <label className="block mb-2 text-[15px]">New Password</label>
                <div>
                  <div className="relative">
                    <input
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters",
                        },
                      })}
                      type={!textType ? "password" : "text"}
                      placeholder="Enter a unique password"
                    />
                    <EyeBtn setTextType={setTextType} textType={textType} />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-2">
                <label className="block mb-2 text-[15px]">Confirm Password</label>
                <div>
                  <div className="relative">
                    <input
                      {...register("confirmPassword", {
                        required: "Confirm Password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters",
                        },
                        validate: (val: string) => {
                          if (watch('password') !== val) {
                            return "Passwords do not match";
                          }
                        }
                      })}
                      type={!textType ? "password" : "text"}
                      placeholder="Confirm your password"
                    />
                    <EyeBtn setTextType={setTextType} textType={textType} />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 py-2 text-sm">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 primary-btn"
                disabled={changePasswordLoading}
              >
                {changePasswordLoading ? <ButtonLoader /> : "Change Password"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ResetPassword; 