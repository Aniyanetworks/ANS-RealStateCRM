// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import SignatureCanvas from "react-signature-canvas";
import { getFileUrl } from "../../utils/constant";
import { useUpdateSignatureMutation } from "../../redux/api/userSlice";
import toast from "react-hot-toast";
import { useAppDispatch } from "../../redux/hooks";
import { setUser } from "../../redux/slices/userSlice";
import { usePermissions } from "../../utils/permissionUtils";
interface FormData {
  signature: string;
  initial: string;
}

const Signature = () => {
  const { hasPermissionForSlug } = usePermissions();
  const { reset, setValue } = useForm<FormData>();

  const signatureRef = useRef({});
  const initialRef = useRef<SignatureCanvas | null>(null);
  const [uploadSignatureImage, setUploadSignatureImage] = useState("");
  const [uploadInitialImage, setUploadInitialImage] = useState<string | null>(
    ""
  );
  const [previousSignature, setPreviousSignature] = useState<string | null>("");
  const [previousInitial, setPreviousInitial] = useState<string | null>("");
  const [updateSignature] = useUpdateSignatureMutation();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { user } = useSelector((state: any) => state.user);

  useEffect(() => {
    setValue("countryId", 39); //by defult set county canada

    if (user) {
      reset(user);
      // setUploadSignatureImage(baseUrl + user.signature);
      // setUploadInitialImage(baseUrl + user.initial);
      setValue("signature", "");
      setValue("initial", "");
    }
  }, [reset]);

  useEffect(() => {
    if (user) {
      setPreviousInitial(user.initial);
      setPreviousSignature(user.signature);
    }
  }, [user]);

  // Handle file change for signature image upload
  const handleChangeSignatureImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "signature" | "initial"
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === "signature") {
          setUploadSignatureImage(base64String);
          setValue("signature", base64String);
        } else {
          setUploadInitialImage(base64String);
          setValue("initial", base64String);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  // Clear signature canvas
  const clear = (type: "signature" | "initial") => {
    if (type === "signature" && signatureRef.current) {
      signatureRef.current.clear();
    } else if (type === "initial" && initialRef.current) {
      initialRef.current.clear();
    }
  };

  // Save signature canvas image
  const save = (type: "signature" | "initial") => {
    let dataUrl = "";
    if (type === "signature" && signatureRef.current) {
      dataUrl = signatureRef.current.getTrimmedCanvas().toDataURL("image/png");
      setUploadSignatureImage(dataUrl);
      setValue("signature", dataUrl);
    } else if (type === "initial" && initialRef.current) {
      dataUrl = initialRef.current.getTrimmedCanvas().toDataURL("image/png");
      setUploadInitialImage(dataUrl);
      setValue("initial", dataUrl);
    }
  };

  // Remove signature or initial image
  const handleRemoveImage = (type: "signature" | "initial") => {
    if (type === "signature") {
      setUploadSignatureImage("");
    } else {
      setUploadInitialImage("");
    }
  };

  const handleUploadSignature = async () => {
    setIsLoading(true);
    const data = {
      signature: uploadSignatureImage,
      initial: uploadInitialImage,
      previousInitial: user.initial,
      previousSignature: user.signature,
    };

    const response = await updateSignature(data);
    if (response.data.status) {
      toast.success(response.data.message);

      dispatch(setUser(response.data.data));
      setIsLoading(false);
    } else {
      toast.error(response.data.message);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className=" bg-white space-y-5 p-5 rounded-md">
        <div className="grid grid-cols-2 gap-4 w-full p-5">
          {/* Signature */}
          <div>
            <div className="flex flex-col gap-2 mt-3">
              <label>Signature Draw</label>
              <div className="border border-gray-400 rounded p-2 w-full max-w-[300px] h-[40vh] sm:h-[200px]">
                <SignatureCanvas
                  ref={signatureRef}
                  penColor="black"
                  canvasProps={{
                    width: 300,
                    height: 200,
                    className: "w-full max-w-[300px] h-[40vh] sm:h-[200px]",
                  }}
                />
              </div>
              <div className="flex gap-5 mt-2">
                <button
                  type="button"
                  onClick={() => clear("signature")}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => save("signature")}
                >
                  Save Signature
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2">Signature Upload</p>
              <label className="flex justify-center items-center py-2 border border-dashed border-gray-400 rounded-md gap-2 hover:border-blue-500 cursor-pointer w-[300px]">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleChangeSignatureImage(e, "signature")}
                  accept="image/*"
                />
                <span>Upload files</span>
              </label>

              {uploadSignatureImage ? (
                <div className="mt-4">
                  <img
                    src={uploadSignatureImage}
                    alt="Signature Upload"
                    className="w-[200px]"
                  />
                  <button
                    onClick={() => handleRemoveImage("signature")}
                    className="bg-red-500 mt-3 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    ✖ Reset
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <img
                    src={previousSignature}
                    alt="Signature Upload"
                    className="w-[200px]"
                  />
                  <button
                    onClick={() => setPreviousSignature("")}
                    className="bg-red-500 mt-3 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    ✖ Reset
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Initial Draw */}
          <div>
            <div className="flex flex-col gap-2 mt-3">
              <label>Initial Draw</label>
              <div className="border border-gray-400 rounded p-2 w-full max-w-[300px] h-[40vh] sm:h-[200px]">
                <SignatureCanvas
                  ref={initialRef}
                  penColor="black"
                  canvasProps={{
                    width: 300,
                    height: 200,
                    className: "w-full max-w-[300px] h-[40vh] sm:h-[200px]",
                  }}
                />
              </div>
              <div className="flex gap-5 mt-2">
                <button
                  type="button"
                  onClick={() => clear("initial")}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => save("initial")}
                >
                  Save Initial
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2">Initial Upload</p>
              <label className="flex justify-center items-center py-2 border border-dashed border-gray-400 rounded-md gap-2 hover:border-blue-500 cursor-pointer w-[300px]">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleChangeSignatureImage(e, "initial")}
                  accept="image/*"
                />
                <span>Upload files</span>
              </label>

              {uploadInitialImage ? (
                <div className="mt-4">
                  <img
                    src={uploadInitialImage}
                    alt="Initial Upload"
                    className="w-[200px]"
                  />
                  <button
                    onClick={() => handleRemoveImage("initial")}
                    className="bg-red-500 mt-3 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    ✖ Reset
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <img
                    src={previousInitial}
                    alt="Initial Upload"
                    className="w-[200px]"
                  />
                  <button
                    onClick={() => setPreviousInitial("")}
                    className="bg-red-500 mt-3 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    ✖ Reset
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
            <button onClick={handleUploadSignature} className="primary-btn">
              {isLoading ? "Loading" : "Save Changes"}
            </button>
          </div>
      </div>
    </div>
  );
};

export default Signature;
