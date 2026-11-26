// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
} from "react-image-crop";

// @ts-expect-error: No type definitions are available for this module
import { SubmitHandler, useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import setCanvasPreview from "./../../../../components/cropper/setCanvasPreview";
import PageLoader from "./../../../../components/ui/Loaders/PageLoader";
import {
  useCreateUpdateUserMutation,
  useGetSpacificUserDataQuery,
} from "../../../../redux/api/superadmin/user/userManageSlice";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaCrop } from "react-icons/fa"; // Importing the crop icon
import { FaUserCircle } from "react-icons/fa";
/* import {
  useGetCitiesQuery,
  useGetCountriesQuery,
  useGetStatesQuery,
} from "../../../../redux/api/common/countryStateCitySlice"; */
import { formatPhoneNumber } from "../../../../utils/format";
// import Select from "react-select";
import { Select } from "antd";
import { useAppSelector } from "../../../../redux/hooks";
import { useGetAgentListDataQuery } from "../../../../redux/api/superadmin/agent/agentManagementSlice";

// set ratio of crop image
const ASPECT_RATIO = 1;
const MIN_DIMENSION = 150;

const CreateAndUpdateUser = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const navigate = useNavigate();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [crop, setCrop] = useState<PercentCro | undefined>(undefined);

  const { uuid = "" } = useParams<{ uuid?: string }>();
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { user } = useAppSelector((state) => state.user);
  const { data: agentList } = useGetAgentListDataQuery("");
  const { Option } = Select;
  const {
    register,
    handleSubmit,
    setError,
    // clearErrors,
    reset,
    // watch,
    setValue,
    formState: { errors },
    control,
  } = useForm<FormData>();
  const [createUpdateUser] = useCreateUpdateUserMutation();

  const agentOptions =
    agentList?.data?.userData?.map((agent: any) => ({
      value: agent.user.id,
      email: agent.user.email,
      firstName: agent?.user?.firstName,
      lastName: agent?.user?.lastName,
      label: `${agent?.user?.name}`,
    })) || [];

  // const [error, setErrorMessage] = useState<string>("");

  const { data, isLoading } = useGetSpacificUserDataQuery(uuid);

  /*  const selectedCountry = watch("countryId") || 39;
  const selectedState = watch("stateId"); */
  /* const selectedCity = watch("cityId");

  // Fetch countries
  const { data: countries } = useGetCountriesQuery({});

  // Fetch states based on selected country
  const { data: states = [] } = useGetStatesQuery(selectedCountry, {
    skip: !selectedCountry, // Skip if no country is selected
  });

  // Fetch cities based on selected state
  const { data: cities = [] } = useGetCitiesQuery(selectedState, {
    skip: !selectedState, // Skip if no state is selected
  }); */

  //.............set phone number format..................start
  const handleChangePhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value;

    const value = formatPhoneNumber(phoneNumber);
    setPhoneNumber(value);
  };

  const [clientType] = useState<
    {
      value: string;
      label: string;
    }[]
  >([
    { value: "", label: "Select Client Type" },
    { value: "Buyer", label: "Buyer" },
    { value: "Seller", label: "Seller" },
    { value: "Tenant", label: "Tenant" },
    { value: "Landlord", label: "Landlord" },
  ]);

  const [clientPriority] = useState<
    {
      value: string;
      label: string;
    }[]
  >([
    { value: "", label: "Select Client Priority" },
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" },
  ]);

  useEffect(() => {
    if (user.userType === "agent") {
      setValue("agentId", user.id);
    }
    setValue("countryId", 39);
    setValue("roleId", 3);
    setValue("userType", "client");
    setValue("source", "DVR");

    if (data?.data?.userData) {
      const userData = data.data.userData;
      const { password, ...userWithoutPassword } = userData;

      reset(userWithoutPassword);
      setPhoneNumber(userData.phoneNumber || "");
      setValue("agentId", userData?.clientAccount?.[0]?.agentId);
      setSelectedImage(userData.profilePicture || "");
    }
  }, [data, reset, setValue, user]);

  if (isLoading) {
    return <PageLoader />;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Safely access the first file
    if (!file) return; // Return if no file is selected

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const imageElement = new Image();
      const imageUrl = reader.result?.toString() || ""; // Safely convert result to string
      imageElement.src = imageUrl;

      imageElement.addEventListener("load", (event: Event) => {
        const { naturalWidth, naturalHeight } =
          event.currentTarget as HTMLImageElement;

        setImageFile(null); // Resetting the file

        if (naturalWidth < MIN_DIMENSION || naturalHeight < MIN_DIMENSION) {
          alert("Image must be at least 1000 x 500 pixels.");
          return setSelectedImage(""); // Reset the selected image if the dimensions are invalid
        }

        // Set the selected image if the dimensions are valid
        setSelectedImage(imageUrl);
      });
    });

    reader.readAsDataURL(file); // Read the file as Data URL
  };

  // crop image
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
    console.log(data);

    const formData = new FormData();
    // Append form data
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));

    if (imageFile) {
      formData.append("image", imageFile);
    }
    console.log("data", data)
    try {
      const response = await createUpdateUser({ data, uuid }).unwrap();
      toast.success(response?.message);
      navigate("/dashboard/clients/client-list", { replace: true });
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };


  return (
    <div>
      <h1>Create and Update Client</h1>
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

              {/* croper start  */}

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
                            <div className="flex justify-end gap-5 mt-4">
                              <button
                                onClick={() => setSelectedImage("")}
                                className="cancel-btn !font-medium "
                              >
                                Cancel
                              </button>
                              <button
                                className="primary-btn "
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

              {/* croper end */}

              <div className="w-1/2 flex justify-center">
                {imageFile ? (
                  <img
                    className="w-[120px] h-[120px] rounded-full"
                    src={imageFile}
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
                <label htmlFor="fname">
                  First Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                  type="text"
                  id="fname"
                  className=" w-full"
                />
                {errors.firstName && (
                  <p className="text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div className="w-full">
                <label htmlFor="lname">
                  Last Name {/* <span className="text-red-500 ml-1">*</span>{" "} */}
                </label>
                <input
                  {...register("lastName", {
                    required: false,
                  })}
                  type="text"
                  id="lname"
                  className="w-full"
                />
                {errors.lastName && (
                  <p className="text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="flex gap-5">
              <div className="w-full">
                <label>
                  Client Type {/* <span className="text-red-500 ml-1">*</span> */}
                </label>
                {/* 
                <Select
                  {...register("clientType", {
                    required: "Client Type is required",
                  })}
                  options={clientType}
                  isMulti
                  onChange={handleClientTypeChange}
                  classNamePrefix="react-select"
                  /> */}

                <select {...register("clientType", { required: false })}>
                  {clientType.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.clientType && (
                  <p className="text-red-500 text-sm">
                    {errors.clientType.message}
                  </p>
                )}
              </div>
              <div className="w-full">
                <label>
                  Client Priority {/* <span className="text-red-500 ml-1">*</span> */}
                </label>
                {/* <Select
                  {...register("clientPriority", {
                    required: "Client Priority is required",
                  })}
                  options={clientPriority}
                  isMulti
                  onChange={handleClientPriorityChange}
                  classNamePrefix="react-select"
                  /> */}

                <select {...register("clientPriority", { required: false })}>
                  {clientPriority.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.clientPriority && (
                  <p className="text-red-500 text-sm">
                    {errors.clientPriority.message}
                  </p>
                )}
              </div>
            </div>
            {(user.userType == "superAdmin" || user.userType == "admin") && (
              <div className="grid grid-cols-1 sm:grid-cols-2  gap-4 mb-6 w-full ">
                {/* Select Agent */}
                <div className="flex flex-col gap-2 ">
                  <div className="flex flex-col ">
                    <label htmlFor="">Select Agent From Existing One</label>
                    <Controller
                      name="agentId"
                      control={control}
                      rules={{ required: "Agent is required" }}
                      defaultValue={user.userType === "agent" ? user.id : ""}
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
          {/* Personal Information */}
          {/* <div className="bg-white space-y-5 p-5 rounded-md">
            <h2>Personal Information</h2>
            <div className="grid grid-cols-2 gap-5">              
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
                <select {...register("stateId")} disabled={!watch("countryId")}>
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
          </div> */}
          {/* Password Section */}
          {/* {<div className="bg-white space-y-5 p-5 rounded-md">
            <h2>Password</h2>
            <div>
              <label htmlFor="new-pass">New Password</label>
              <input
                {...register("password")}
                type="password"
              />
              {errors.password && (
                <p className="text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirm-pass">Confirm Password</label>
              <input
                {...register("confirmPassword")}
                type="password"
              />
              {errors.confirmPassword && (
                <p className="text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>} */}
          {/* Source & Contact Information Section */}
          <div className="bg-white space-y-5 p-5 rounded-md">
            <h2>Contact Information</h2>
            <div>
              <label htmlFor="email">
                Email Address <span className="text-red-500 ml-1">*</span>
              </label>
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
            <input {...register("source")} type="hidden" defaultValue="DVR" />
            <div className="flex gap-2">
              {/*  <div>
                <label htmlFor="code">Phone Code</label>
                <select {...register("phoneCode")}>
                  <option value="" hidden disabled>
                    Select Code
                  </option>
                  {countries?.data?.countries?.map((country: any) => (
                    <option
                      value={country.phoneCode}
                    >
                      {country.phoneCode} ({country.countryName})
                    </option>
                  ))}
                </select>
              </div> */}
              <div className="w-full">
                <label htmlFor="number">
                  Phone Number {/* <span className="text-red-500 ml-1">*</span> */}
                </label>
                {/* <input {...register("phoneNumber")} type="text" /> */}
                <input
                  value={phoneNumber}
                  type="text"
                  id="phoneNumber"
                  placeholder="+1 (XXX) XXX-XXXX"
                  maxLength="18"
                  className=""
                  {...register("phoneNumber", {
                    required: false,
                  })}
                  onChange={handleChangePhoneNumber}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="my-5 mb-10 flex justify-end gap-3">
          <Link to="/dashboard/clients/client-list">
            <button type="button" className="cancel-btn">
              Back
            </button>
          </Link>

          <button type="submit" className="primary-btn">
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAndUpdateUser;
