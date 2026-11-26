/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { FaCheck, FaHome, FaUserFriends, FaUserShield, FaUserTie } from "react-icons/fa";
import Branding from "./Branding";
import EyeBtn from "./EyeBtn";
import { useForm } from "react-hook-form";
import {
  useUserLoginMutation,
  useResendOtpMutation
} from "../../redux/api/userSlice";
import { useAppDispatch } from "../../redux/hooks";
import { setAccessToken, setUser } from "../../redux/slices/userSlice";
import toast from "react-hot-toast";
import Captcha from "../../components/Captcha/Captcha";
import useCaptcha from "../../hooks/useCaptcha";
import { cn } from "../../utils/cn";
import { Button, Modal } from "antd";

const Login = () => {
  const [textType, setTextType] = useState(false);
  const [isModalOtpVisible, setIsModalOtpVisible] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [responseData, setResponseData] = useState([]);
  const [loginData, setLoginData] = useState({});
  const { firstValue, secondValue, result, operator, resetCaptcha } = useCaptcha();

  const [userLogin] = useUserLoginMutation();
  const [resendOtp] = useResendOtpMutation();
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ mode: "onChange" });

  const onSubmit = async (data: any) => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    const res = (await userLogin(formData)) as any;

    setLoginData(data);

    if (res?.data?.requiresOtp) {
      setResponseData(res.data);
      setIsModalOtpVisible(true);
      toast.success("OTP sent to your phone number");
    } else if (res?.data?.data?.user) {
      handleSuccessfulLogin(res.data);
    }
    else if (res.error) {
      reset({
        captcha: "",
      });
      resetCaptcha();
      toast.error(res?.error?.data?.message || res?.error?.data?.error || 'Login failed. Please try again.');
    }
  };

  const handleOtpVerification = async () => {
    try {
      const formData = new FormData();
      
      Object.keys(loginData).forEach((key) => {
        formData.append(key, loginData[key]);
      });
      
      formData.append("otp", otpCode);

      const res = (await userLogin(formData)) as any;

      if (res?.data?.data?.user) {
        handleSuccessfulLogin(res.data);
        setIsModalOtpVisible(false);
      } else if (res.error) {
        toast.error(res.error.data?.message || "Invalid OTP");
      }
    } catch (error) {
      toast.error("OTP verification failed");
    }
  };

  const handleSuccessfulLogin = useCallback((response: any) => {
    dispatch(setAccessToken(response?.token));
    dispatch(setUser(response.data.user));
    
    const defaultPath = location.state?.from?.pathname || "/";
    const redirectPath = response.data.user.userType === 'agent' && 
      response.data.user.agentAccount[0].status !== 'approved' 
      ? '/agent-information-submit' 
      : defaultPath;
    
    toast.success(`Welcome Back`);
    navigate(redirectPath, { replace: true });
  }, [dispatch, navigate, location]);
  useEffect(() => {
    const autoVerify = async () => {
      if (otpCode.length === 6 && isModalOtpVisible && Object.keys(loginData).length > 0) {
        try {
          const formData = new FormData();
          
          Object.keys(loginData).forEach((key) => {
            formData.append(key, loginData[key]);
          });
          
          formData.append("otp", otpCode);

          const res = (await userLogin(formData)) as any;

          if (res?.data?.data?.user) {
            handleSuccessfulLogin(res.data);
            setIsModalOtpVisible(false);
          } else if (res.error) {
            toast.error(res.error.data?.message || "Invalid OTP");
          }
        } catch (error) {
          toast.error("OTP verification failed");
        }
      }
    };

    autoVerify();
  }, [otpCode, isModalOtpVisible, loginData, userLogin, handleSuccessfulLogin]);

  const handleResendOtp = async () => {
    try {
      const res = await resendOtp({ email: loginData.email }).unwrap();
      if (res.status) {
        toast.success("OTP resent successfully");
      }
    } catch (error) {
      toast.error(error.data?.message || "Failed to resend OTP");
    }
  };

  const demoRoles = [
    { icon: <FaUserShield />, email: "superadmin@ans.demo", title: "Super Admin", desc: "Every module" },
    { icon: <FaUserTie />, email: "admin@ans.demo", title: "Branch Admin", desc: "Branch and agents" },
    { icon: <FaHome />, email: "agent@ans.demo", title: "Agent", desc: "Trades, listings, clients" },
    { icon: <FaUserFriends />, email: "client@ans.demo", title: "Client", desc: "Documents and properties" },
  ];
  const [demoLoading, setDemoLoading] = useState("");

  const demoLogin = async (email: string) => {
    setDemoLoading(email);
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", "demo");
    const res = (await userLogin(formData)) as any;
    setDemoLoading("");
    if (res?.data?.data?.user) handleSuccessfulLogin(res.data);
    else toast.error("Demo login failed");
  };

  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      <Branding />

      <div className="sm:w-[75%] p-8 flex flex-col">
        <div className="flex items-center justify-center flex-1">
          <div className="w-full max-w-xl">
            <div className="mb-3">
              <h1 className="text-xl font-bold text-[#0b3b38]">Welcome back</h1>
              <p className="mt-0.5 text-[12px] text-gray-500">Explore instantly: pick a role to sign in as.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoRoles.map((r) => (
                <button
                  key={r.email}
                  type="button"
                  disabled={!!demoLoading}
                  onClick={() => demoLogin(r.email)}
                  className="group flex items-center gap-2.5 rounded-lg border border-teal-100 bg-white px-3 py-2 text-left shadow-sm transition hover:border-[#0f766e] hover:shadow-md disabled:opacity-60"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-50 text-base text-[#0f766e] transition group-hover:bg-[#0f766e] group-hover:text-white">
                    {r.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold leading-tight text-[#0b3b38]">
                      {demoLoading === r.email ? "Signing in..." : r.title}
                    </div>
                    <div className="text-[11px] leading-tight text-gray-500 truncate">{r.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="my-3 flex items-center gap-3 text-gray-400">
              <div className="h-px flex-1 bg-gray-300" />
              <p className="text-[12px] uppercase tracking-wide">or log in with email</p>
              <div className="h-px flex-1 bg-gray-300" />
            </div>

            <form
              className="flex flex-col gap-2.5 rounded-lg bg-white p-4 shadow-sm"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="">
                <label className="block mb-1 text-[13px]">Email</label>
                <input
                  {...register("email", {
                    required: true,
                    pattern: /^\S+@\S+$/i,
                  })}
                  type="email"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">Provide valid email</p>
                )}
              </div>

              <div className="">
                <label className="block mb-1 text-[13px]">Password</label>
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

              <div className="flex justify-between">
                <label
                  htmlFor="registration"
                  className="flex items-center gap-2 relative cursor-pointer"
                >
                  <span className="text-[13px]">Don't have an account?</span>
                </label>
                <div>
                  <Link to="/register" className="text-primaryPurple text-sm">
                    Sign Up
                  </Link>
                </div>
              </div>
              
              <div className="flex justify-between">
                <label
                  htmlFor="remember"
                  className="flex items-center gap-2 relative cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mr-2 appearance-none peer !border-primaryPurple size-4 absolute opacity-0"
                    id="remember"
                  />
                  <p className="size-4 flex items-center justify-center *:hidden peer-checked:*:block peer-checked:bg-primaryPurple border border-primaryPurple rounded">
                    <FaCheck className="text-[10px] text-white" />
                  </p>
                  <span className="text-[13px]">Remember me</span>
                </label>
                <div>
                  <Link
                    to="/forgot-password"
                    className="text-primaryPurple text-sm"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button type="submit" className="w-full py-2 primary-btn">
                Log in
              </button>
            </form>
          </div>
        </div>
      </div>

      <Modal
        title="SMS OTP Verification"
        open={isModalOtpVisible}
        onCancel={() => setIsModalOtpVisible(false)}
        width={400}
        footer={null}
      >
        <div className="p-4">
          <p className="text-gray-600 mb-4">
            Enter the 6-digit OTP sent to your phone number
          </p>
          
          <div className="mb-4">
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (otpCode.length === 6) handleOtpVerification();
                }
              }}
              placeholder="Enter OTP"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primaryPurple"
              maxLength={6}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleResendOtp}
              className="flex-1"
              type="default"
            >
              Resend OTP
            </Button>
            <Button
              onClick={handleOtpVerification}
              className="flex-1 primary-btn"
              type="primary"
              disabled={otpCode.length !== 6}
            >
              Verify OTP
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Didn't receive the OTP? Check your phone number or request a new one.
          </p>
        </div>
      </Modal>

    </div>
  );
};

export default Login;