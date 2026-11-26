// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import 'react-quill-new/dist/quill.snow.css';

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  FieldErrors,
  useForm,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
} from 'react-image-crop';
import ReactQuill from 'react-quill-new';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import {
  useGetCitiesQuery,
  useGetStatesQuery,
} from '../../../redux/api/common/countryStateCitySlice';
import {
  useCreateBrokerageDataMutation,
  useGetBrokerageDataQuery,
} from '../../../redux/api/superadmin/brokerageDataSlice';
import { useAppSelector } from '../../../redux/hooks';
import { baseUrl, getFileUrl } from '../../../utils/constant';
import { formatPhoneNumber } from '../../../utils/format';
import { BrokerageModal } from '../../brokerage/BrokerageModal';
import { BrokerageSelector } from '../../brokerage/BrokerageSelector';
import setCanvasPreview from '../../cropper/setCanvasPreview';

// set ratio of crop image
const ASPECT_RATIO = 1;
const MIN_DIMENSION = 150;

interface AgentFormProps {
  statusOptions: { value: string; label: string }[];
  isEditMode: boolean;
  specialNote: string;
  handleChange: (value: string) => void;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  profilePicture?: string;
  activeBranches?: any;
  branchesLoading?: boolean;
}

interface PercentCro {
  unit: "px" | "%";
  width: number;
  height: number;
  x: number;
  y: number;
}

const AgentForm: React.FC<AgentFormProps> = ({
  statusOptions,
  isEditMode,
  specialNote,
  handleChange,
  errors,
  register,
  setValue,
  watch,
  profilePicture,
  activeBranches,
  branchesLoading
}) => {
  const [cellPhone, setCellPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const { uuid } = useParams<{ uuid?: string }>();
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [imageFile, setImageFile] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [crop, setCrop] = useState<PercentCro | undefined>(undefined);
  const { tradeSheetRepresentationData } = useAppSelector(
    (state: any) => state.user
  );
  const { user } = useSelector((state: any) => state.user);
  const isSuperAdmin = user?.roleId == 1;

  // const profilePicture = watch?.("profilePicture");

  // Brokerage dropdown state
  const [selectedBrokerage, setSelectedBrokerage] = useState(null);
  const { data: brokerageData, refetch: refetchBrokerages } = useGetBrokerageDataQuery("");
  const brokerageOptions =
    brokerageData?.data?.brokerageData?.map((brokerage) => ({
      value: brokerage.id,
      label: brokerage.brokerageName,
      ...brokerage,
    })) || [];

  // Brokerage modal state
  const [isBrokerageModalOpen, setIsBrokerageModalOpen] = useState(false);
  const brokerageForm = useForm({ defaultValues: { countryId: '39' } });
  const [createBrokerage] = useCreateBrokerageDataMutation();
  const selectedState = brokerageForm.watch('stateId');
  const { data: states = { data: { states: [] } } } = useGetStatesQuery('39');
  const { data: cities = { data: { cities: [] } } } = useGetCitiesQuery(selectedState, { skip: !selectedState });

  const handleCreateBrokerage = async () => {
    const values = brokerageForm.getValues();
    try {
      await createBrokerage(values).unwrap();
      setIsBrokerageModalOpen(false);
      brokerageForm.reset({ countryId: '39' });
      refetchBrokerages();
    } catch {
      // Optionally show error
    }
  };

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
          alert("Image must be at least 150 x 150 pixels.");
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

  const safeWatch = typeof watch === 'function' ? watch : () => undefined;

  // useEffect(() => {
  //   if (isEditMode) {
  //     const phoneValue = safeWatch('cellPhone');
  //     const emergencyValue = safeWatch('emergencyContact');

  //     if (phoneValue) {
  //       setCellPhone(formatPhoneNumber(phoneValue));
  //     }
  //     if (emergencyValue) {
  //       setEmergencyContact(formatPhoneNumber(emergencyValue));
  //     }
  //   }
  // }, [isEditMode, safeWatch]);

  /* const handleChangeCellPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatPhoneNumber(e.target.value);
    setCellPhone(value);
    setValue("cellPhone", value, { shouldValidate: true });
  };

  const handleChangeEmergencyContact = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = formatPhoneNumber(e.target.value);
    setEmergencyContact(value);
    setValue("emergencyContact", value, { shouldValidate: true });
  }; */

  // Set selectedBrokerage from form value in edit mode
  useEffect(() => {
    const currentId = safeWatch('brokerageId');
    if (currentId && brokerageOptions.length > 0) {
      const found = brokerageOptions.find(opt => opt.value === currentId);
      setSelectedBrokerage(found || null);
    }
  }, [safeWatch, brokerageOptions]);

  useEffect(() => {
  if (isEditMode) {
    const currentDesignation = safeWatch('designation');
    if (currentDesignation) {
      setValue('designation', currentDesignation, { shouldValidate: true });
    }
  }
}, [isEditMode, safeWatch, setValue]);

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {/* Profile Image Upload */}
        <div className="col-span-3 flex items-center">
          <div className="w-1/2">
          
          <div className="w-1/2">
            {imageFile ? (
              <img
                className="w-[120px] h-[120px] rounded-full object-cover"
                src={imageFile}
                alt="Profile"
              />
            ) : profilePicture ? (
              <img
                className="w-[120px] h-[120px] rounded-full object-cover"
                src={getFileUrl(profilePicture)}
                alt="Profile"
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
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18.74 19.3801C16.96 21.0101 14.6 22.0001 12 22.0001C9.40001 22.0001 7.04001 21.0101 5.26001 19.3801C5.36001 18.4401 5.96001 17.5201 7.03001 16.8001C9.77001 14.9801 14.25 14.9801 16.97 16.8001C18.04 17.5201 18.64 18.4401 18.74 19.3801Z"
                  stroke="#292D32"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="#292D32"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
            <label htmlFor="image">Profile Image</label>
            <label
              htmlFor="image"
              className="border-dashed py-1 max-w-[250px] px-5 cursor-pointer text-center rounded-md border border-gray-600"
            >
              <span>Upload Image</span>
              <input
                onChange={handleImageUpload}
                className="hidden"
                type="file"
                id="image"
                accept="image/*"
              />
            </label>
          </div>
        </div>

        {/* Image Cropper Modal */}
        {selectedImage && !imageFile && (
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
                      if (imgRef.current && previewCanvasRef.current && crop) {
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

                        const dataUrl = previewCanvasRef.current.toDataURL();
                        setImageFile(dataUrl);
                        setValue("profilePicture", dataUrl);
                        setSelectedImage("");
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

        {/* First Name */}
        <div className="flex flex-col gap-2">
          <label>
            First Name<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            {...register("firstName", { required: "First name is required" })}
          />
          {errors.firstName && (
            <span className="text-red-500">
              {errors.firstName.message as string}
            </span>
          )}
        </div>

        {/* Last Name */}
        <div className="flex flex-col gap-2 ">
          <label>
            Last Name<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            {...register("lastName", { required: "Last name is required" })}
          />
          {errors.lastName && (
            <span className="text-red-500">
              {errors.lastName.message as string}
            </span>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2 ">
          <label>
            Email<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^\S+@\S+$/i,
                message: "Email is not valid",
              },
            })}
          />
          {errors.email && (
            <span className="text-red-500">
              {errors.email.message as string}
            </span>
          )}
        </div>
        
      {/*Add Brokarage */}
      <div className="flex flex-col gap-2">
        <BrokerageSelector
          label="Brokerage"
          options={brokerageOptions}
          selectedBrokerage={selectedBrokerage}
          onSelect={(option) => {
            setSelectedBrokerage(option);
            setValue('brokerageId', option ? option.value : '');
          }}
          onCreateClick={() => setIsBrokerageModalOpen(true)}
        />
        <BrokerageModal
          isOpen={isBrokerageModalOpen}
          onClose={() => setIsBrokerageModalOpen(false)}
          onSubmit={handleCreateBrokerage}
          title="Create New Brokerage"
          register={brokerageForm.register}
          errors={brokerageForm.formState.errors}
          states={states}
          cities={cities}
          watch={brokerageForm.watch}
          setValue={brokerageForm.setValue}
        />
      </div>

        {/* PREC Name */}
        <div className="flex flex-col gap-2">
          <label>PREC Name (if any)</label>
          <input type="text" {...register("precName")} />
        </div>

        {/* Address */}
        <div>
          <label>Address</label>
          <input
            type="text"
            {...register("address")}
            className={`border p-2 w-full ${
              errors.address ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.address && (
            <p className="text-red-500">Address is required </p>
          )}
        </div>

        {/* Cell Phone */}
        <div>
          <label>Cell Phone</label>
          <input
            type="text"
            {...register("cellPhone", {
              onChange: (e) => {
                const value = formatPhoneNumber(e.target.value);
                setValue("cellPhone", value, { shouldValidate: true });
              }
            })}
            className={`border p-2 w-full ${
              errors.cellPhone ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>

        {/* Phone Service Provider */}
        {/* <div>
          <label>Phone Service Provider</label>
          <input
            type="text"
            {...register("phoneServiceProvider")}
            className={`border p-2 w-full ${
              errors.phoneServiceProvider ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.phoneServiceProvider && (
            <p className="text-red-500">Phone service provider is required</p>
          )}
        </div> */}

        {/* RECO Reg Number */}
        <div>
          <label>RECO Reg Number</label>
          <input
            type="text"
            {...register("recoRegNumber")}
            className={`border p-2 w-full ${
              errors.recoRegNumber ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.recoRegNumber && (
            <p className="text-red-500">RECO reg number is required</p>
          )}
        </div>

        {/* RECO Expiry Date */}
        <div>
          <label>RECO Expiry Date</label>
          <input
            type="date"
            {...register("recoExpiryDate")}
            className={`border p-2 w-full border-gray-300 bg-gray-100`}
          />
        </div>

         {/* Agrement Expiry Date */}
        <div /* className='hidden' */>
          <label>Agreement Expiry Date</label>
          <input
            type="date"
            {...register("agrementExpiryDate")}
            className={`border p-2 w-full border-gray-300 bg-gray-100`}
          />
        </div>

        <div>
          <label>TRREB Member ID</label>
          <input
            type="text"
            {...register("trrebMemberId")}
            className={`border p-2 w-full ${
              errors.trrebMemberId ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.trrebMemberId && (
            <p className="text-red-500">TRREB member id is required</p>
          )}
        </div>

        {/* SIN */}
        <div>
          <label>SIN</label>
          <input
            type="text"
            {...register("sin")}
            className={`border p-2 w-full ${
              errors.sin ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.sin && <p className="text-red-500">SIN is required</p>}
        </div>

        {/* Date of Birth */}
        <div>
          <label>Date of Birth</label>
          <input
            type="date"
            {...register("dob")}
            className={`border p-2 w-full ${
              errors.dob ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.dob && (
            <p className="text-red-500">Date of birth is required</p>
          )}
        </div>

        {/* Emergency Contact */}
        <div>
            <label>Emergency Contact</label>
            <div className="flex">
              <input
                type="text"
                {...register("emergencyUser")}
                placeholder="Name"
              />
              <input
                type="text"
                {...register("emergencyContact", {
                  onChange: (e) => {
                    const value = formatPhoneNumber(e.target.value);
                    setValue("emergencyContact", value, { shouldValidate: true });
                  }
                })}
                placeholder="Number"
                className={`border p-2 w-1/2 ${
                  errors.emergencyContact ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
          </div>

        {/* HST Number */}
        <div>
          <label>HST Number</label>
          <input
            type="text"
            {...register("hstNo")}
            className={`border p-2 w-full ${
              errors.hstNo ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.hstNo && (
            <p className="text-red-500">HST number is required</p>
          )}
        </div>

        {/* PREC HST Number */}
        <div>
          <label>PREC HST Number</label>
          <input
            type="text"
            {...register("precHstNo")}
            className={`border p-2 w-full ${
              errors.precHstNo ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>

        {/* Expected Gross */}
        <div>
          <label>Expected Gross</label>
          <input
            type="number"
            {...register("expectedGross")}
            className={`border p-2 w-full ${
              errors.expectedGross ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.expectedGross && (
            <p className="text-red-500">Expected gross is required</p>
          )}
        </div>
         <div>
                      <label className="block mb-1">
                        Designation <span className="text-red-500">*</span>
                      </label>
                     <select
                        {...register("designation", {
                          required: "Designation is required",
                        })}
                        className="border p-2 rounded w-full"
                      >
                        <option value="">Select Designation</option>
                        <option value="Sales Representative">Sales Representative</option>
                        <option value="Broker">Broker</option>
                        <option value="Broker of Record">Broker of Record</option>
                        <option value="Branch Manager">Branch Manager</option>
                      </select>

                      {errors.desegnation && (
                        <p className="text-red-500">Designation is required</p>
                      )}
                    </div>

        {/* New Password */}
        <div>
          <label htmlFor="new-pass">
            New Password
            {!isEditMode && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            {...register("password", {
              required: !isEditMode && "Password is required",
            })}
            type="password"
          />
          {errors.password && (
            <p className="text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirm-pass">
            Confirm Password
            {!isEditMode && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            {...register("confirmPassword", {
              required: !isEditMode && "Confirm Password is required",
            })}
            type="password"
          />
          {errors.confirmPassword && (
            <p className="text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Select Branch */}
        {isSuperAdmin ? (
          <div>
            <label htmlFor="branchId">Select Branch (If any)</label>
            <select
              {...register("branchId")}
              disabled={branchesLoading}
              className="border p-2 w-full"
            >
              <option value="">No Branch</option>
              {branchesLoading ? (
                <option disabled>Loading branches...</option>
              ) : activeBranches?.data?.branchData?.length === 0 ? (
                <option disabled>No active branches available</option>
              ) : (
                (activeBranches?.data?.branchData as Array<{ id: number; name: string }>)?.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))
              )}
            </select>
          </div>
          ) : (
            <>
              <input
                type="hidden"
                {...register("branchId")}
                value={user?.branchId ?? 1}
                readOnly
              />
              <div className="">
                <label>Branch Name:</label>
                <input
                  type="text"
                  value={user?.branch?.name || "No Branch Assigned"}
                  disabled
                  className="border rounded p-2 w-full bg-gray-100"
                />
              </div>
            </>
          )}

        {/* Account Status */}
        <div className='hidden'>
          <label>Account Status:</label>
          <select {...register("status")} defaultValue={"approved"}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {isEditMode && errors.status && (
            <span className="text-red-500">Status is required</span>
          )}
        </div>

        {/* Agreement Status */}
        <div className='hidden'>
          <label>
            Agreement Status:{" "}
            {uuid && (
              <span className="">
                (To view or change the status of this agreement,{" "}
                <a
                  href={`/dashboard/super-admin/agreement-preview/${uuid}`}
                  className="underline hover:text-blue-800"
                >
                  click here
                </a>
                .)
              </span>
            )}
          </label>
          <select
            {...register("agreementStatus")}
            defaultValue={"pending"}
            disabled={true}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {isEditMode && errors.status && (
            <span className="text-red-500">Status is required</span>
          )}
        </div>

       
      </div>

      {/* Special Note */}
      <div className="mt-4 ">
        <label>Special Note:</label>
        <ReactQuill
          value={specialNote}
          onChange={handleChange}
          modules={{
            toolbar: [
              [{ header: "1" }, { header: "2" }, { font: [] }],
              [{ list: "ordered" }, { list: "bullet" }],
              ["bold", "italic", "underline"],
              [{ align: [] }],
              ["link", "image"],
              [{ color: [] }],
            ],
          }}
          theme="snow"
          placeholder="Write your special note here..."
        />
      </div>
    </div>
  );
};

export default AgentForm;
