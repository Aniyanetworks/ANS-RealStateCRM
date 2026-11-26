/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck

import { SubmitHandler, useForm } from "react-hook-form";
import { useSetupAppAuthenticatorMutation } from "../../redux/api/userSlice";
import toast from "react-hot-toast";
import ButtonLoader from "../loader/buttonLoader";
import { useEffect, useState } from "react";
import { usePermissions } from "../../utils/permissionUtils";
import { Button, Modal } from "antd";
import { useAppSelector } from "../../redux/hooks";



const Security = () => {
  const { user } = useAppSelector((state) => state.user);

  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalQrCodeVisible, setIsModalQuCodeVisible] = useState(false);



  const [setupAppAuthenticator] = useSetupAppAuthenticatorMutation();

    useEffect(() => {
      
      const isGoogleAuthEnabled = localStorage.getItem('isGoogleAuthEnabled')

      if(isGoogleAuthEnabled=='true')
      {
        setGoogleAuthEnabled(true);
      }
      else if(isGoogleAuthEnabled=='false')
      {
        setGoogleAuthEnabled(false);
      }
      else if(user?.auth_secret)
      {
          setGoogleAuthEnabled(true);
      }
      else
      {
        setGoogleAuthEnabled(false);
      }

      
    }, [user])


  const handleGoogleAuthToggle = async () => {
    const newGoogleAuthEnabled = !googleAuthEnabled;
    setGoogleAuthEnabled(newGoogleAuthEnabled);

    localStorage.setItem('isGoogleAuthEnabled',newGoogleAuthEnabled)

    try {
      const response = await setupAppAuthenticator({email:user.email,isGoogleAuthEnabled:newGoogleAuthEnabled}).unwrap();
      setQrCodeUrl(response?.qr_code_url)
      if(response?.qr_code_url)
      {
        setIsModalQuCodeVisible(true)
      }
      toast.success(response?.message);
    } catch (error) {
      toast.error(error?.message);
    }
  };

  return (
    <div>
      <div className=" bg-gray-50 py-12 px-6 sm:px-12">
        <div className="">
          <div className="flex justify-between items-center space-x-4">
            <div className="flex-1">
              <h3 className="text-xl font-medium text-gray-700">
                Google Authenticator
              </h3>
              <p className="text-gray-600">
                {googleAuthEnabled
                  ? "Google Authenticator is currently enabled. You can disable it anytime."
                  : "Google Authenticator is currently disabled. Enable it for enhanced security."}
              </p>
            </div>

            <div className="relative">
              <input
                type="checkbox"
                id="googleAuthToggle"
                checked={googleAuthEnabled}
                onChange={handleGoogleAuthToggle}
                className="sr-only"
              />
              <label
                htmlFor="googleAuthToggle"
                className={`cursor-pointer block w-14 h-8 rounded-full bg-gray-300 ${googleAuthEnabled ? "bg-green-500" : "bg-red-500"
                  } transition duration-300`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform duration-300 ${googleAuthEnabled ? "transform translate-x-6" : ""
                    }`}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="Authenticator"
        open={isModalQrCodeVisible}
        onCancel={() => setIsModalQuCodeVisible(false)}
        width={1300}
        footer={[
          <Button key="cancel" onClick={() => setIsModalQuCodeVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <div>
          <div className="flex justify-center items-center p-4">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-48 h-48 rounded-lg shadow-lg"
            />
          </div>
        </div>
        <p className="text-center text-lg text-gray-700 mt-4">
          Scan this QR code with your authenticator app to complete the setup.
        </p>
      </Modal>
    </div>
  );
};

export default Security;

