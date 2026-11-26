import { useParams, useNavigate } from "react-router-dom";
import { 
    useGetSingleCalendarEventQuery, 
    useJoinCalendarEventMutation 
} from "../../redux/api/superadmin/calendar/calendarEventSlice";
import TableLoader from "../../components/loader/TableLoader";
import moment from "moment";
import { useForm } from "react-hook-form";
import ButtonLoader from "../../components/loader/buttonLoader";
import toast from "react-hot-toast";
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from "@reduxjs/toolkit";
import { formatPhoneNumber } from "../../utils/format";
  
type FormData = {
    name: string;
    email: string;
    phoneNumber: string;
};

interface ApiResponse {
    data?: {
        status?: boolean;
        message?: string;
    };
    error?: FetchBaseQueryError | SerializedError;
}


const EventJoin = () => {
    const { uuid } = useParams();
    const navigate = useNavigate();

    const { data, isLoading } = useGetSingleCalendarEventQuery(uuid);
    const { register, handleSubmit, reset,setValue } = useForm<FormData>();
    const [joinCalendarEvent, { isLoading: isJoining }] = useJoinCalendarEventMutation();

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
    
        const formattedValue = formatPhoneNumber(value);
        setValue("phoneNumber", formattedValue);
      };

    const onSubmit = async (data: FormData) => {
        try {
            const response: ApiResponse = await joinCalendarEvent({
                data,
                uuid,
            });
    
            if (response.data?.status) {
                toast.success(response.data.message || "Success!");
                reset();
                navigate('/event-join-success', { state: { message: response.data.message || "Successfully joined the event!" } });
            } else if (response.error) {
                if ('data' in response.error && typeof response.error.data === 'object') {
                    toast.error((response.error.data as any).message || "An error occurred.");
                } else if ('message' in response.error) {
                    toast.error(response.error.message || "An unexpected error occurred.");
                }
            }
        } catch (error) {
            console.error("Unexpected error:", error);
        }
    };
    
    
    return (
        <div>
            {isLoading
                ? (<TableLoader />)
                : (<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                    <div className="bg-white shadow-md rounded-lg p-6 max-w-md w-full">
                        <h1 className="text-2xl font-bold text-center mb-4">Join Event</h1>
                        <div className="mb-6">
                            <h2 className="text-xl my-2">{data?.data?.calendarEvent?.title}</h2>
                            <p className="text-gray-600"> <span className="font-bold">Start Date:</span> {moment(data?.data?.calendarEvent?.start).format('MMMM Do YYYY, h:mm:ss a')}</p>
                            <p className="text-gray-600"> <span className="font-bold">End Date:</span> {moment(data?.data?.calendarEvent?.end).format('MMMM Do YYYY, h:mm:ss a')}</p>
                            <p className="text-gray-600"> <span className="font-bold">Location:</span> {data?.data?.calendarEvent?.location}</p>
                            <p className="mt-2 text-gray-800">
                                <span className="font-bold">Details:</span> {data?.data?.calendarEvent?.description}
                            </p>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="name">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    {...register("name")}
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    {...register("email")}
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                                    placeholder="Enter your email"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                                    Phone Number
                                </label>
                                <input
                                    {...register("phoneNumber", {
                                    required: "Phone number is required",
                                    })}
                                    type="text"
                                    placeholder="e.g. +1 (123) 456-7890"
                                    className=""
                                    onChange={handlePhoneNumberChange}
                                />
                            </div>
                            
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition duration-200"
                            >
                                {isJoining ? <ButtonLoader /> : "Join Event"}
                            </button>
                        </form>
                    </div>
                </div>)}
        </div>
    );
};

export default EventJoin;
