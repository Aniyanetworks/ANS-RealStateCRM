import { useLocation } from "react-router-dom";

const EventJoinSuccess = () => {
    const location = useLocation();
    const message = location.state?.message || "You have successfully joined the event!";

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="11" fill="#48bb78" />
                    <path stroke="white" strokeWidth="3" fill="none" d="M7 12.5 l3 3 7-7" />
                </svg>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Success!</h1>
                <p className="text-gray-600">{message}</p>
                <h2 className="text-xl my-2">Thank you for joining the event!</h2>
            </div>
        </div>
    );
};

export default EventJoinSuccess;
