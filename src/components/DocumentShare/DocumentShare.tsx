import React, { useState } from "react";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";

type DocumentShareProps = {
    isOpen: boolean;
    onClose: () => void;
    onShare: (expiration: string, passphrase: string) => void;
};

const DocumentShare: React.FC<DocumentShareProps> = ({ isOpen, onClose, onShare }) => {
    const [expiration, setExpiration] = useState<string>("12 Hours");
    const [passphrase, setPassphrase] = useState<string>("");
    const [isPassphraseEnabled, setPassphraseEnabled] = useState<boolean>(false);
    const [isPasswordVisible, setPasswordVisible] = useState<boolean>(false);
    const [validationMessage, setValidationMessage] = useState<string>("");

    if (!isOpen) return null;

    const handleShare = () => {
        setValidationMessage("");

        if (isPassphraseEnabled && !passphrase) {
            setValidationMessage("Passphrase is required.");
            return;
        }

        onShare(expiration, passphrase);
        setPassphrase("");
        setExpiration("12 Hours");
        onClose();
    };

    return (
        <div className="">
            <div className="bg-white p-5 rounded-md">
                <h2 className="text-lg font-bold">Secure your file</h2>
                <div className="mt-4">
                    <p>Expiration period:</p>
                    <div className="flex gap-2 mt-2">
                        {["12 Hours", "1 Day", "2 Days", "5 Days", "10 Days"].map((option) => (
                            <button
                                key={option}
                                className={`border px-4 py-2 rounded-md ${expiration === option ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
                                onClick={() => setExpiration(option)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mt-4 gap-2">
                    <p>Additional passphrase:</p>
                    <div className="flex items-center mt-2">
                        <button 
                            onClick={() => {
                                setPassphraseEnabled(true);
                                setPassphrase("");
                            }} 
                            className={`border px-4 py-2 rounded-md ${isPassphraseEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-black'}`}
                        >
                            Yes
                        </button>
                        <button 
                            onClick={() => {
                                setPassphraseEnabled(false);
                                setPassphrase("");
                            }} 
                            className={`border px-4 py-2 rounded-md ${!isPassphraseEnabled ? 'bg-red-500 text-white' : 'bg-gray-200 text-black'}`}
                        >
                            No
                        </button>
                        <div className="relative w-full ml-2">
                            <input 
                                type={isPasswordVisible ? "text" : "password"} 
                                value={passphrase} 
                                onChange={(e) => setPassphrase(e.target.value)} 
                                className="border p-2 rounded-md w-full pr-10"
                                disabled={!isPassphraseEnabled}
                            />
                            <button 
                                onClick={() => setPasswordVisible(!isPasswordVisible)} 
                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                type="button"
                            >
                                {isPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>
                </div>
                {validationMessage && <p className="text-red-500">{validationMessage}</p>}
                <div className="flex justify-end mt-4">
                    <button onClick={onClose} className="mr-2">Cancel</button>
                    <button onClick={handleShare} className="primary-btn">Continue</button>
                </div>
            </div>
        </div>
    );
};

export default DocumentShare; 