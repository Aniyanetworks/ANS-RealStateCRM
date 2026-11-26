import { Link } from "react-router-dom";
import Branding from "./Branding";
import { useForm, SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import { useForgotPasswordMutation } from "../../redux/api/userSlice";
import { useState } from "react";

interface ForgotPassword {
    email: string;
}

const ForgotPassword = () => {

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
    } = useForm<ForgotPassword>({ mode: "onChange" });

    const [forgotPassword] = useForgotPasswordMutation();

    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [countdown, setCountdown] = useState(60);

    const onSubmit: SubmitHandler<ForgotPassword> = async () => {
        setIsButtonDisabled(true);
        setCountdown(60);

        const data = {
            email: getValues("email")
        }

        const res = (await forgotPassword(data)) as any;

        if (res?.data?.status) {
            toast.success(`Reset link sent to your email`);
            startCountdown();
        }

        if (res.error) {
            toast.error(`${res?.error?.data?.message}`);
            setIsButtonDisabled(false);
        }
    };

    const startCountdown = () => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsButtonDisabled(false);
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
    };

    return (
        <div className="min-h-screen flex flex-col sm:flex-row">
            <Branding />
            <div className="sm:w-[75%] p-8 flex flex-col">
                <div className="flex items-center justify-center flex-1">
                    <div className="w-full max-w-sm">
                        <h1>Forgot Password</h1>
                        <form
                            className="flex mt-5 flex-col gap-4"
                            onSubmit={handleSubmit(onSubmit)}
                        >
                            <div>
                                <label className="block mb-2 text-[15px]">Email</label>
                                <input
                                    {...register("email", {
                                        required: true,
                                        pattern: /^\S+@\S+$/i,
                                    })}
                                    type="email"
                                    placeholder="Enter your email"
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-sm">Provide valid email</p>
                                )}
                            </div>

                            <button 
                                type="submit" 
                                className="w-full py-2 primary-btn" 
                                disabled={isButtonDisabled}
                            >
                                {isButtonDisabled ? `Resend Link after ${countdown}s` : "Send Reset Link"}
                            </button>
                            <div className="flex justify-between mt-4">
                                <Link to="/login" className="text-primaryPurple text-sm">
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;