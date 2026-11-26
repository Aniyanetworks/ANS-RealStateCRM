import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Branding from "../login/Branding";
import EyeBtn from "../login/EyeBtn";
import { useForm, SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import { useResetPasswordMutation } from "../../redux/api/userSlice";

interface PasswordFormInputs {
  password: string;
  confirmPassword: string;
}

const ChangePassword = () => {
  const [textType, setTextType] = useState(false);
  const [token, setToken] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordFormInputs>({ mode: "onChange" });

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenValue = params.get("token") || '';
    setToken(tokenValue);
  }, [location.search]);

  const [resetPassword] = useResetPasswordMutation  ();
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<PasswordFormInputs> = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const res: any = await resetPassword({
        token: token,
        data: {
          password: data.password,
        },
      });

      if (res?.data?.status === false) {
        toast.error(res?.data?.message);
      }
      
      if (res?.data?.status === true) {
        toast.success(`Password changed successfully. Please login with your new password.`);
        navigate('/', { replace: true });
      }

      if (res.error) {
        toast.error(`${res?.error?.data?.message}`);
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      <Branding />
      <div className="sm:w-[75%] p-8 flex flex-col">
        <div className="flex items-center justify-center flex-1">
          <div className="w-full max-w-sm">
            <h1>Change your password</h1>
            <form
              className="flex mt-5 flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div>
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

              <div>
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
                    <p className="text-red-500 text-sm">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <button type="submit" className="w-full py-2 primary-btn">
                Create Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;