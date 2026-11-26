/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
} from "react-image-crop";
import setCanvasPreview from "../cropper/setCanvasPreview";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { getFileUrl } from "../../utils/constant";
import { useUpdateBasicInfoMutation } from "../../redux/api/userSlice";
import { useAppDispatch } from "../../redux/hooks";
import toast from "react-hot-toast";
import { setUser } from "../../redux/slices/userSlice";
import ButtonLoader from "../loader/buttonLoader";
import { usePermissions } from "../../utils/permissionUtils";

const ASPECT_RATIO = 1;
const MIN_DIMENSION = 150;

interface FormData {
  firstName?: string;
  lastName?: string;
}

interface PercentCro {
  unit: "px" | "%";
  width: number;
  height: number;
  x: number;
  y: number;
}

const BasicInfo = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [crop, setCrop] = useState<PercentCro | undefined>(undefined);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const { user } = useSelector((state: any) => state.user);
  const dispatch = useAppDispatch();

  const [updateBasicInfo] = useUpdateBasicInfoMutation();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const imageElement = new Image();
      const imageUrl = reader.result?.toString() || "";
      imageElement.src = imageUrl;

      imageElement.addEventListener("load", (event: Event) => {
        const { naturalWidth, naturalHeight } =
          event.currentTarget as HTMLImageElement;

        setImageFile(null);

        if (naturalWidth < MIN_DIMENSION || naturalHeight < MIN_DIMENSION) {
          alert("Image must be at least 1000 x 500 pixels.");
          return setSelectedImage("");
        }

        setSelectedImage(imageUrl);
      });
    });

    reader.readAsDataURL(file);
  };

  const onImageLoad = (e: React.ChangeEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const cropWidthInPercent = (MIN_DIMENSION / width) * 100;

    const crop = makeAspectCrop(
      {
        unit: "%",
        width: cropWidthInPercent,
      },
      ASPECT_RATIO,
      width,
      height
    );
    const centeredCrop = centerCrop(crop, width, height);

    setCrop(centeredCrop);
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    const newData = { ...data };
    if (imageFile) {
      newData.profilePicture = imageFile;
      newData.previousFile = user.profilePicture;
    }

    const response = await updateBasicInfo(newData);
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className=" space-y-5 bg-white p-5 rounded-md">
        <h2>Basic Information</h2>
        <div className="flex items-center gap-5">
          <div className="w-1/2">
            <label htmlFor="image">Change Profile Image</label>
            <label
              htmlFor="image"
              className=" border-dashed py-1 max-w-[250px] px-5 cursor-pointer text-center rounded-md border border-gray-600"
            >
              <span>Upload Image</span>
              <input
                onChange={handleImageUpload}
                className=" hidden"
                type="file"
                id="image"
              />
            </label>
          </div>
          <div className="w-1/2 flex justify-center items-center">
            {imageFile ? (
              <img
                className=" w-[120px] h-[120px] rounded-full"
                src={imageFile}
                alt=""
              />
            ) : user.profilePicture ? (
              <img
                className=" w-[120px] h-[120px] rounded-full"
                src={getFileUrl(user.profilePicture)}
                alt=""
              />
            ) : (
              <svg
                width="120px"
                height="120px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.12 12.78C12.05 12.77 11.96 12.77 11.88 12.78C10.12 12.72 8.71997 11.28 8.71997 9.50998C8.71997 7.69998 10.18 6.22998 12 6.22998C13.81 6.22998 15.28 7.69998 15.28 9.50998C15.27 11.28 13.88 12.72 12.12 12.78Z"
                  stroke="#292D32"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M18.74 19.3801C16.96 21.0101 14.6 22.0001 12 22.0001C9.40001 22.0001 7.04001 21.0101 5.26001 19.3801C5.36001 18.4401 5.96001 17.5201 7.03001 16.8001C9.77001 14.9801 14.25 14.9801 16.97 16.8001C18.04 17.5201 18.64 18.4401 18.74 19.3801Z"
                  stroke="#292D32"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="#292D32"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            )}
          </div>
        </div>


        <div className="">
          {imageFile ? (
            ""
          ) : (
            <div className="">
              {selectedImage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                    <div>
                      <ReactCrop
                        crop={crop}
                        onChange={(percentCrop) => setCrop(percentCrop)}
                        circularCrop
                        keepSelection
                        aspect={ASPECT_RATIO}
                        minWidth={MIN_DIMENSION}
                      >
                        <img
                          ref={imgRef}
                          src={selectedImage}
                          alt="Upload"
                          onLoad={onImageLoad}
                        />
                      </ReactCrop>
                      <div className="flex justify-end gap-2 mt-5 items-center">
                        <p
                          onClick={() => setSelectedImage("")}
                          className="btn-common-outline cursor-pointer"
                        >
                          Cancel
                        </p>
                        <p
                          className="btn-common cursor-pointer"
                          onClick={() => {
                            if (imgRef.current && previewCanvasRef.current) {
                              if (crop) {
                                const croppedArea = convertToPixelCrop(
                                  crop,
                                  imgRef.current.width,
                                  imgRef.current.height
                                );

                                setCanvasPreview(
                                  imgRef.current,
                                  previewCanvasRef.current,
                                  croppedArea
                                );

                                const dataUrl =
                                  previewCanvasRef.current.toDataURL();
                                setImageFile(dataUrl);
                              } else {
                                console.error(
                                  "Crop is undefined, please set a valid crop."
                                );
                              }
                            } else {
                              console.error(
                                "Image or Canvas reference is null"
                              );
                            }
                          }}
                        >
                          Crop Image
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {crop && (
            <canvas
              ref={previewCanvasRef}
              className="mt-4"
              style={{
                display: "none",
                border: "1px solid black",
                objectFit: "contain",
              }}
            />
          )}
        </div>

        <div className="flex gap-5">
          <div className="w-full">
            <label htmlFor="fname">First Name</label>
            <input
              {...register("firstName", { required: "First Name is required" })}
              defaultValue={user.firstName}
              type="text"
              id="fname"
              className=" w-full"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm">{errors.firstName.message}</p>
            )}
          </div>
          <div className="w-full">
            <label htmlFor="lname">Last Name</label>
            <input
              {...register("lastName", { required: "Last Name is required" })}
              defaultValue={user.lastName}
              type="text"
              id="lname"
              className="w-full"
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm">{errors.lastName.message}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
            <button className="primary-btn relative flex gap-2 items-center">
              {isLoading ? "Loading" : " Save Changes"}
              {isLoading && <ButtonLoader />}
            </button>
          </div>
      </div>
    </form>
  );
};

export default BasicInfo;
