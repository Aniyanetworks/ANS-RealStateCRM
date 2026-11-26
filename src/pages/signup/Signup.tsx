/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { FaCheck } from "react-icons/fa";
import Branding from "../login/Branding";
import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useUserRegistrationMutation,useValidateAgentMutation } from "../../redux/api/userSlice";
import toast from "react-hot-toast";
import Captcha from "../../components/Captcha/Captcha";
import useCaptcha from "../../hooks/useCaptcha";
import { cn } from "../../utils/cn";


const Signup = () => {
  const { agent_id } = useParams<{ agent_id?: string }>();
  const [agentValidation, setAgentValidation] = useState<string | "null">("null");

  const { firstValue, secondValue, result, operator, resetCaptcha } =
    useCaptcha();

  const [userRegistration] = useUserRegistrationMutation();
  const [validateAgent] = useValidateAgentMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({ mode: "onChange" });

  const handleValueChange = useCallback(async (newValue: string): Promise<void> => {
    try {
      const res = await validateAgent(newValue);
      setAgentValidation(res?.data?.message);
    } catch (error) {
      console.error("Error during validation:", error);
    }
  }, [setAgentValidation,validateAgent]);

  useEffect(() => {
    if (agent_id) {
      setValue('agentId', agent_id);
      handleValueChange(agent_id);
    }
  }, [agent_id, setValue, handleValueChange]);
  
  
  

  const onSubmit = async (data: any) => {

    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });


    const res = (await userRegistration(formData)) as any;
    if (res?.data?.status) {
      toast.success("Registration successfull.");

      reset();
    }

    if (res?.error) {
      reset({
        captcha: "",
      });
      resetCaptcha();
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex flex-col sm:flex-row  ">
      <Branding />

      <div className="sm:w-[75%] bg-white p-8 flex flex-col">
        <div className="max-md:mb-10">
          <Link
            to={"/"}
            className="border py-2 px-5 rounded-lg font-medium  border-primaryPurple duration-200 hover:bg-lightPurple text-black"
          >
            <ArrowLeftOutlined className="text-sm" /> Home
          </Link>
        </div>

        <div className=" flex items-center justify-center  flex-1">
          <div className="w-full max-w-sm">
            <h1>Create client account</h1>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex gap-3">
                <div className="mt-5 w-full">
                  <label className="block mb-2 text-[15px]">First Name <span className="text-red-500 ml-1">*</span></label>
                  <input
                    type="text"
                    placeholder="your first name"
                    {...register("firstName", { required: true })}
                  />
                  <input
                    type="text"
                    hidden
                    {...register("userType", { required: true })}
                    value={'client'}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm">First Name is required</p>
                  )}
                </div>
                <div className="mt-5 w-full">
                  <label className="block mb-2 text-[15px]">Last Name</label>
                  <input
                    type="text"
                    placeholder="your last name"
                    {...register("lastName", { required: true })}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm">First Name is required</p>
                  )}
                </div>
              </div>

              <div className="">
                <label className="block mb-2 text-[15px]">Email <span className="text-red-500 ml-1">*</span></label>
                <input
                  type="email"
                  placeholder="youremail@email.com"
                  {...register("email", {
                    required: true,
                    pattern: /^\S+@\S+$/i,
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">Provide valid email</p>
                )}
              </div>

              <div className="">
                <label className="block mb-2 text-[15px]">Agent Id <span className="text-red-500 ml-1">*</span></label>
                <input
                  type="text"
                  placeholder="Agent ID"
                  {...register("agentId", {
                    required: true,
                  })}
                  onChange={(e) => handleValueChange(e.target.value)}
                />
                {agentValidation === 'Agent Id Verified' ? (
                    <p className="text-green-500 text-sm">Agent ID successfully verified!</p>
                  ) : (
                    <p className="text-red-500 text-sm">{agentValidation != 'null' ? 'Oops! Please provide a valid Agent Id' : ''} </p>
                  )}

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

              <div className=" ">
                <label
                  htmlFor="remember"
                  className=" flex items-center gap-2 relative cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mr-2 appearance-none peer !border-primaryPurple size-4 absolute opacity-0"
                    id="remember"
                  />
                  <p className="size-4 flex items-center justify-center *:hidden peer-checked:*:block peer-checked:bg-primaryPurple border border-primaryPurple rounded ">
                    <FaCheck className="text-[10px] text-white" />
                  </p>
                  <span className="text-[15px]">Remember me</span>
                </label>
              </div>

              <button type="submit" className="w-full py-2 primary-btn " disabled={agentValidation != 'Agent Id Verified'}>
                Continue
              </button>
            </form>

            <p className="mt-4 text-[15px]">
              Already have an account?
              <Link to="/login" className="text-primaryPurple underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
