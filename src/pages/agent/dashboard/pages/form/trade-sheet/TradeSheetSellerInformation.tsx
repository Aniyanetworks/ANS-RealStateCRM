/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "antd";
import { PlusCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";
import TradeSheetSteps from "../../../../../../components/Stepper/TradeSheetSteps";
import {
  useCreateUpdateSellerInformationsMutation,
  useGetSpacificTradeSheetListDataQuery,
} from "../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import toast from "react-hot-toast";
import TableLoader from "../../../../../../components/loader/TableLoader";
import ButtonLoader from "../../../../../../components/loader/buttonLoader";
import { useAppSelector } from "../../../../../../redux/hooks";

const TextInput = ({
  label,
  register,
  required,
  name,
  errors,
  type = "text",
  placeholder = "",
}: any) => (
  <div className="flex flex-col gap-2">
    <label>
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>

    <input
      {...register(name, { required })}
      type={type}
      placeholder={placeholder}
      className="border w-full border-gray-300 p-2 rounded"
    />
    {errors[name] && (
      <p className="text-red-500 text-sm">{`${label} is required`}</p>
    )}
  </div>
);

const TradeSheetSellerInformation = () => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid?: string }>();
  const [btnLoading, setBtnLoading] = useState('');
  const { tradeSheetRepresentationData } = useAppSelector(
    (state: any) => state.user
  );
  let userName ="Seller";

  if(tradeSheetRepresentationData === "landlord" || tradeSheetRepresentationData === "tenant" || tradeSheetRepresentationData === "landlord,tenant" || tradeSheetRepresentationData === "tenant,landlord")
  {
    userName="Landlord"
  }
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm();
  const [sellers, setSellers] = useState([{ id: Date.now() }]);

  const { data, isLoading } = useGetSpacificTradeSheetListDataQuery(uuid);
  useEffect(() => {
    if (
      data?.data?.tradeSheetData?.sellerInformations &&
      data?.data?.tradeSheetData?.sellerInformations.length > 0
    ) {
      data?.data?.tradeSheetData?.sellerInformations.forEach(
        (seller: any, index: any) => {
          setValue(`seller${index + 1}FirstName`, seller.firstName);
          setValue(`seller${index + 1}LastName`, seller.lastName);
        }
      );
      setSellers(data?.data?.tradeSheetData?.sellerInformations);
    }
    else if (data?.data?.tradeSheetData?.propertyListing?.sellersInfo) {
      try {
        const sellersInfo = JSON.parse(data.data.tradeSheetData.propertyListing.sellersInfo)?.sellersInfo;
        if (sellersInfo?.length > 0) {
          sellersInfo.forEach((seller, index) => {
            setValue(`seller${index + 1}FirstName`, seller.firstName);
            setValue(`seller${index + 1}LastName`, seller.lastName);
            setValue(`seller${index + 1}PhoneNumber`, seller.phoneNumber);
          });
          setSellers(sellersInfo);
        }
      } catch (e) {
        console.error("Error parsing seller data:", e);
      }
    }
    
  }, [data, reset, uuid, setValue]);

  const [createUpdateSellerInformations] =
    useCreateUpdateSellerInformationsMutation();

  const onSubmit = async (formData: any) => {
  setBtnLoading(formData.saveBtn);
  
  try {
    const sellersArray = sellers.map((seller, index) => ({
      firstName: formData[`seller${index + 1}FirstName`],
      lastName: formData[`seller${index + 1}LastName`],
    }));

    const isDraft = formData.saveBtn === "save-draft";
    const requestData = {
      sellers: sellersArray,
      status: isDraft ? 'draft' : 'active',
      saveBtn: formData.saveBtn
    };

    const response = await createUpdateSellerInformations({
      data: requestData,
      uuid,
    }).unwrap();

    toast.success(`${response?.message}`);

     let navigatePath = '';
      switch (requestData.saveBtn) {
        case "save-next":
          navigatePath = `/dashboard/agent/pages/form/trade-sheet/buyer-information/${uuid}`;
          break;
        case "save-exit":
        case "save-draft":
          navigatePath = `/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list`;
          break;
        default:
          break;
      }
  
      if (navigatePath) {
        navigate(navigatePath, { replace: true });
      }
  } catch (error: any) {
    toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
  } finally {
    setBtnLoading('');
  }
};

  const resetForm = () =>{
    setBtnLoading('reset');
    reset();
    toast.success("Successfully Reset!");
    setBtnLoading('');
  }

  const cancelSubmit = () =>{
    setBtnLoading('cancel');
    toast.error("You are canceling the creation of the trade sheet!");
    setBtnLoading('');
    navigate(
      `/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list`,
      { replace: true }
    );
  }

  const addSeller = () => {
    setSellers([...sellers, { id: Date.now() }]);
  };

  const removeSeller = (id: number) => {
    setSellers(sellers.filter((seller) => seller.id !== id));
  };

  return (
    <div>
      <TradeSheetSteps active={3} uuid={uuid} />

      {isLoading ? (
        <TableLoader />
      ) : (
        <div className="max-w-full mt-8 p-8 border border-gray-300/30 rounded-md border-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="max-FULL p-6 bg-[#c9c1c13d] rounded-lg shadow-md">
              <h3 className="py-2">{userName}'s Information:</h3>
              <div className="flex flex-col gap-6">
                {sellers.map((seller, index) => (
                  <div key={seller.id} className="flex flex-col gap-4">
                    <h3 className="text-lg font-semibold">
                      {userName} {index + 1}
                    </h3>
                    <div className="flex items-end gap-4">
                      <div className="w-full flex gap-5">
                        <div className="w-full">
                          <TextInput
                            label="First Name"
                            register={register}
                            required={index === 0}
                            name={`seller${index + 1}FirstName`}
                            errors={errors}
                          />
                        </div>
                        <div className=" w-full">
                          <TextInput
                            label="Last Name"
                            register={register}
                            required={index === 0}
                            name={`seller${index + 1}LastName`}
                            errors={errors}
                          />
                        </div>
                      </div>
                      <div>
                        {sellers.length > 1 && (
                          <Button
                            type="link"
                            icon={<MinusCircleOutlined />}
                            className="text-red-500"
                            onClick={() => removeSeller(seller.id)}
                          ></Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className=" flex justify-end">
                  <Button
                    type="dashed"
                    icon={<PlusCircleOutlined />}
                    onClick={addSeller}
                  >
                    Add Another {userName}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-between my-15 mx-5">
              <button
                type="submit"
                onClick={() => {
                  setValue("saveBtn", "save-next");
                }}
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading === "save-next" ? (
                  <ButtonLoader />
                ) : (
                  "Save and Next"
                )}
              </button>

              <button
                type="submit"
                onClick={() => {
                  setValue("saveBtn", "save-exit");
                }}
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading === "save-exit" ? (
                  <ButtonLoader />
                ) : (
                  "Save and Exit"
                )}
              </button>

              <button
                type="submit"
                onClick={() => {
                  setValue("saveBtn", "save-draft");
                }}
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading === "save-draft" ? (
                  <ButtonLoader />
                ) : (
                  "Save as Draft"
                )}
              </button>
              {data?.data?.tradeSheetData?.representationType == "multiple" && (
                <NavLink
                  to={`/dashboard/agent/pages/form/trade-sheet/property-details-multiple-representation/${uuid}`}
                  className="primary-btn flex-1 mx-2 my-2 text-center"
                >
                  Go Back
                </NavLink>
              )}

              {data?.data?.tradeSheetData?.representationType == "single" &&
                data?.data?.tradeSheetData?.representation == "buyer" && (
                  <NavLink
                    to={`/dashboard/agent/pages/form/trade-sheet/property-details/${uuid}`}
                    className="primary-btn flex-1 mx-2 my-2 text-center"
                  >
                    Go Back
                  </NavLink>
                )}

              {data?.data?.tradeSheetData?.representationType == "single" &&
                data?.data?.tradeSheetData?.representation == "seller" && (
                  <NavLink
                    to={`/dashboard/agent/pages/form/trade-sheet/property-details-seller/${uuid}`}
                    className="primary-btn flex-1 mx-2 my-2 text-center"
                  >
                    Go Back
                  </NavLink>
                )}

              <button
                type="button"
                onClick={resetForm}
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading === "reset" ? <ButtonLoader /> : "Rest Form"}
              </button>

              <button
                onClick={cancelSubmit}
                type="button"
                className="primary-btn flex-1 mx-2 my-2"
              >
                {btnLoading === "cancel" ? <ButtonLoader /> : "Cancel"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TradeSheetSellerInformation;
