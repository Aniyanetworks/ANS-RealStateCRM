/* eslint-disable @typescript-eslint/no-explicit-any */
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Branding from "../login/Branding";
import EyeBtn from "../login/EyeBtn";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Captcha from "../../components/Captcha/Captcha";
import useCaptcha from "../../hooks/useCaptcha";
import { cn } from "../../utils/cn";
import { useCreatePasswordMutation } from "../../redux/api/superadmin/agent/agentManagementSlice";


const CreatePassword = () => {
  const [textType, setTextType] = useState(false);
  const [token, setToken] = useState<string | ''>('');
  const { firstValue, secondValue, result, operator, resetCaptcha } = useCaptcha();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ mode: "onChange" });

  const location = useLocation();
  
  useEffect(() => {
    const getTokenFromUrl = () => {
      const params = new URLSearchParams(location.search);
      return params.get("token");
    };

    const tokenValue = getTokenFromUrl() || '';
    setToken(tokenValue);
  }, [location.search]);

  const [createPassword] = useCreatePasswordMutation();

  const navigate = useNavigate();

  const onSubmit = async (data: any) => {

    const res = (await createPassword({
      token: token,
      data,
    })) as any;

    if (res?.data?.status === false) {
      toast.success(res?.data?.message);
    }
    
    if (res?.data?.status==true) {
      toast.success(`Your password has been created successfully. Please login to continue.`);
      navigate('/', { replace: true });
    }

    if (res.error) {
      reset({
        captcha: "",
      });
      resetCaptcha();
      toast.error(`${res?.error?.data?.message}`);
    }
  };
  return (
    <div className="min-h-screen flex flex-col sm:flex-row  ">
      <Branding />

      <div className="sm:w-[75%]  p-8 flex flex-col">

        <div className=" flex items-center justify-center  flex-1">
          <div className="w-full max-w-sm">
            <h1>Create password</h1>

            <form
              className="flex mt-5 flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >

              <div className="">
                <label className="block mb-2 text-[15px]">Password</label>

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
                      {errors.password.message as string}
                    </p>
                  )}
                </div>
              </div>

              <div className="">
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
                      })}
                      type={!textType ? "password" : "text"}
                      placeholder="Enter a unique password"
                    />
                    <EyeBtn setTextType={setTextType} textType={textType} />
                  </div>

                  {errors.password && (
                    <p className="text-red-500 text-sm">
                      {errors.password.message as string}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Captcha
                  firstValue={firstValue}
                  secondValue={secondValue}
                  operator={operator}
                >
                  <input
                    type="number"
                    className={cn("appearance-none text-center max-w-20", {
                      "!border-red-500": errors.captcha,
                      "!border-green-500":
                        !errors.captcha && watch("captcha") == result,
                    })}
                    min={0}
                    {...register("captcha", {
                      required: "Please solve the equation",
                      validate: (value: number) =>
                        value == result || "Incorrect captcha result",
                    })}
                  />
                </Captcha>

                {errors.captcha ? (
                  <p className="text-red-500 text-sm">
                    {errors.captcha.message as string}
                  </p>
                ) : watch("captcha") == result ? (
                  <p className="text-green-500 text-sm">
                    Well done! You solved the captcha!
                  </p>
                ) : null}
              </div>

              <button type="submit" className="w-full py-2 primary-btn ">
                Create Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePassword;
