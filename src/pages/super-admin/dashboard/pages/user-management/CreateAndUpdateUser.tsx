/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import { Select } from 'antd';
// @ts-expect-error: No type definitions are available for this module
import {
  Controller,
  SubmitHandler,
  useForm,
} from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  FaCrop,
  FaUserCircle,
} from 'react-icons/fa';
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
} from 'react-image-crop';
import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import setCanvasPreview
  from '../../../../../components/cropper/setCanvasPreview';
import PageLoader from '../../../../../components/ui/Loaders/PageLoader';
import {
  useGetCitiesQuery,
  useGetStatesQuery,
} from '../../../../../redux/api/common/countryStateCitySlice';
import {
  useGetAgentListDataQuery,
} from '../../../../../redux/api/superadmin/agent/agentManagementSlice';
import {
  useGetActiveBranchListDataQuery,
} from '../../../../../redux/api/superadmin/branch/Branchmanagementslice';
import {
  useGetRoleListQuery,
} from '../../../../../redux/api/superadmin/roleManagementSlice';
import {
  useCreateUpdateUserMutation,
  useGetSpacificUserDataQuery,
} from '../../../../../redux/api/superadmin/user/userManageSlice';
import { useAppSelector } from '../../../../../redux/hooks';
import {
  formatPhoneNumber,
  formatPostalCode,
} from '../../../../../utils/format';
import { getFileUrl } from '../../../../../utils/constant';

const ASPECT_RATIO = 1;
const MIN_DIMENSION = 150;


const CreateAndUpdateUser = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);
  const isSuperAdmin = user?.roleId == 1;

  const {
    data: roleData,
    isLoading: roleIsLoading,
    refetch: roleRefetch,
  } = useGetRoleListQuery("");
  const [roleListData, setRoleListData] = useState<DataType[]>([]);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [crop, setCrop] = useState<PercentCro | undefined>(undefined);

  const { uuid = "" } = useParams<{ uuid?: string }>();
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [postalCode, setPostalCode] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [officeNumber, setOfficeNumber] = useState<string>("");
  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>();
  const [createUpdateUser] = useCreateUpdateUserMutation();

  const { data, isLoading } = useGetSpacificUserDataQuery(uuid);
  const { data: agentList } = useGetAgentListDataQuery("");

  const { data: activeBranches, isLoading: branchesLoading } =
    useGetActiveBranchListDataQuery("");

  const agentOptions =
    agentList?.data?.userData?.map((agent: any) => ({
      value: agent.user.id,
      email: agent.user.email,
      firstName: agent?.user?.firstName,
      lastName: agent?.user?.lastName,
      label: `${agent?.user?.name}`,
    })) || [];

  const selectedCountry = 39;
  const selectedState = watch("stateId");
  const selectedCity = watch("cityId");
  const roleIdWatch = watch("roleId");


  const { data: states = [] } = useGetStatesQuery(selectedCountry, {
    skip: !selectedCountry,
  });

  const { data: cities = [] } = useGetCitiesQuery(selectedState, {
    skip: !selectedState,
  });

  useEffect(() => {
    setValue("countryId", 39);
    if (data?.data?.userData) {
      const userData = data.data.userData;
      const { password, ...userWithoutPassword } = userData;

      reset(userWithoutPassword);
      setPhoneNumber(formatPhoneNumber(userWithoutPassword.phoneNumber));
      setOfficeNumber(formatPhoneNumber(userWithoutPassword.officeNumber));
      setPostalCode(formatPostalCode(userWithoutPassword.postalCode));
      setValue("agentId", userData?.clientAccount?.[0]?.agentId);

      if (userData.branchId) {
        setValue("branchId", userData.branchId);
      }
    }
    setRoleListData(roleData?.data?.roles);
  }, [data, reset, setValue, roleData]);

  if (isLoading) {
    return <PageLoader />;
  }

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

  const onSubmit: SubmitHandler<FormData> = async (d) => {
    let data = d;
    if (data.password && data.confirmPassword) {
      if (data.password !== data.confirmPassword) {
        setError("confirmPassword", {
          type: "manual",
          message: "Passwords do not match",
        });
        return;
      }
    } else {
      const { password, confirmPassword, ...rest } = data;
      data = rest;
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));

    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const response = await createUpdateUser({ data, uuid }).unwrap();
      toast.success(response?.message);
      navigate("/dashboard/super-admin/user-management", { replace: true });
    } catch (error: CustomError) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  const handleChangePostalCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const postalCode = e.target.value;
    const value = formatPostalCode(postalCode);

    setPostalCode(value);
  };

  const handleChangePhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value;

    const value = formatPhoneNumber(phoneNumber);
    setPhoneNumber(value);
  };

  const handleChangeOfficeNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const officeNumber = e.target.value;
    const value = formatPhoneNumber(officeNumber);
    setOfficeNumber(value);
  };

  return (
    <div>
      <h1>Create and Update User</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-2">
        <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
          <div className=" space-y-5 bg-white p-5 rounded-md">
            <h2>Basic Information</h2>
            <div className="flex items-center gap-2">
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


              <div>
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
                            <button
                              className="text-white font-mono text-xs py-2 px-4 rounded-2xl mt-4 cursor-pointer bg-[#0f766e] w-[200px] text-center hover:bg-[#0b3b38]"
                              onClick={() => {
                                if (
                                  imgRef.current &&
                                  previewCanvasRef.current
                                ) {
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
                              <FaCrop className="inline-block mr-2" />
                              Crop Image
                            </button>
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


              <div className="w-1/2 flex justify-center">
                {imageFile ? (
                  <img
                    className="w-[120px] h-[120px] rounded-full object-cover"
                    src={imageFile}
                    alt=""
                  />
                ) : watch("profilePicture") ? (
                  <img
                    className="w-[120px] h-[120px] rounded-full object-cover"
                    src={getFileUrl(watch("profilePicture"))}
                    alt=""
                  />
                ) : (
                  <div className="flex items-center justify-center w-[120px] h-[120px] rounded-full bg-gray-200">
                    <FaUserCircle className="w-full h-full text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-full">
                <label htmlFor="fname">First Name</label>
                <input
                  {...register("firstName")}
                  type="text"
                  id="fname"
                  className=" w-full"
                />
              </div>
              <div className="w-full">
                <label htmlFor="lname">Last Name</label>
                <input
                  {...register("lastName")}
                  type="text"
                  id="lname"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-5">
              {(user.userType == "superAdmin" || user.userType == "admin") &&
                roleIdWatch == 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2  gap-4 mb-6 w-full ">
                    <div className="flex flex-col gap-2 ">
                      <div className="flex flex-col ">
                        <label htmlFor="">Select Agent From Existing One</label>
                        <Controller
                          name="agentId"
                          control={control}
                          rules={{ required: "Agent is required" }}
                          defaultValue={
                            user.userType === "agent" ? user.id : ""
                          }
                          render={({ field }) => (
                            <Select
                              {...field}
                              disabled={user.userType === "agent"}
                              placeholder="Select Agent"
                              showSearch
                              rootClassName="custom-select "
                              optionFilterProp="children"
                              style={{ width: "100%" }}
                              allowClear
                              onChange={(value) => field.onChange(value)}
                              onBlur={field.onBlur}
                            >
                              <option value="" disabled>
                                Select Agent
                              </option>
                              {agentOptions?.map((agent, i) => (
                                <Option key={i} value={agent.value}>
                                  {agent.label}
                                </Option>
                              ))}
                            </Select>
                          )}
                        />
                      </div>
                      {errors.agentId && (
                        <p className="text-red-500 text-sm">
                          {errors.agentId.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {isSuperAdmin ? (
              <div>
                <label htmlFor="branchId">Select Branch (If any)</label>
                <select {...register("branchId")} disabled={branchesLoading}>
                  <option value="">
                    {roleIdWatch == 1 ? "All Branch" : "No Branch"}
                  </option>
                  {roleIdWatch != 1 && (
                    <>
                      {branchesLoading ? (
                        <option disabled>Loading branches...</option>
                      ) : activeBranches?.data?.branchData?.length === 0 ? (
                        <option disabled>No active branches available</option>
                      ) : (
                        activeBranches?.data?.branchData?.map((branch: any) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))
                      )}
                    </>
                  )}
                </select>
                {branchesLoading && (
                  <p className="text-gray-500 text-sm mt-1">
                    Loading branches...
                  </p>
                )}
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
          </div>
          <div className="bg-white space-y-5 p-5 rounded-md">
            <h2>Personal Information</h2>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label htmlFor="roleId">User Role</label>
                <select
                  {...register("roleId", {
                    required: "Role type is required",
                  })}
                >
                  <option value="" disabled selected hidden>
                    Select User Role
                  </option>
                  {roleListData?.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                {errors.roleId && (
                  <p className="text-red-500">{errors.roleId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="gender">Gender</label>
                <select {...register("gender")}>
                  <option value="" disabled selected hidden>
                    Select Gender
                  </option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div>
                <label>Province</label>
                <select {...register("stateId")}>
                  <option value="">Select Province</option>
                  {states?.data?.states?.map((state: any) => (
                    <option
                      key={state.id}
                      value={state.id}
                      selected={state.id == selectedState}
                    >
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>City</label>
                <select {...register("cityId")} disabled={!watch("stateId")}>
                  <option value="">Select City</option>
                  {cities?.data?.cities?.map((city: any) => (
                    <option
                      key={city.id}
                      value={city.id}
                      selected={city.id == selectedCity}
                    >
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full">
                <label htmlFor="fname">Postal Code</label>
                <input
                  {...register("postalCode")}
                  value={postalCode}
                  onChange={handleChangePostalCode}
                  type="text"
                  id="fname"
                  className=" w-full"
                />
              </div>
              <div>
                <label htmlFor="address">Address</label>
                <textarea
                  {...register("address")}
                  defaultValue={data?.data?.userData.address}
                  id="address"
                  className=" h-[50px] "
                ></textarea>
              </div>
            </div>
          </div>
          <div className="bg-white space-y-5 p-5 rounded-md">
            <h2>Contact Information</h2>
            <div>
              <label htmlFor="email">Email Address</label>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^@ ]+@[^@ ]+\.[^@ .]{2,}$/,
                    message: "Email is not valid",
                  },
                })}
                type="email"
              />
              {errors.email && (
                <p className="text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <div className="w-full">
                <label htmlFor="number">Phone Number</label>
                <input
                  {...register("phoneNumber")}
                  type="text"
                  onChange={handleChangePhoneNumber}
                  value={phoneNumber}
                />
              </div>
              <div className="w-full">
                <label htmlFor="officeNumber">Office Number</label>
                <input
                  {...register("officeNumber")}
                  type="text"
                  id="officeNumber"
                  onChange={handleChangeOfficeNumber}
                  value={officeNumber}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="my-5 mb-10 flex justify-end">
          <button type="submit" className="primary-btn">
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAndUpdateUser;
