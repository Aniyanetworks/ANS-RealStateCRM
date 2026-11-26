import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "antd";
import { PlusCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";
import TradeSheetSteps from "../../../../../../components/Stepper/TradeSheetSteps";
import {
  useCreateUpdateBuyerInformationsMutation,
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
      className="border border-gray-300 p-2 rounded"
    />
    {errors[name] && (
      <p className="text-red-500 text-sm">{`${label} is required`}</p>
    )}
  </div>
);

const TradeSheetBuyerInformation = () => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid?: string }>();
  const [btnLoading, setBtnLoading] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm();
  const [buyers, setBuyers] = useState([{ id: Date.now() }]);
    const { tradeSheetRepresentationData } = useAppSelector(
      (state: any) => state.user
    );
    let userName ="Buyer";
    
    if(tradeSheetRepresentationData === "landlord" || tradeSheetRepresentationData === "tenant" || tradeSheetRepresentationData === "landlord,tenant" || tradeSheetRepresentationData === "tenant,landlord")
    {
      
      userName="Tenant"
    }

  const { data, isLoading } = useGetSpacificTradeSheetListDataQuery(uuid);
  useEffect(() => {

    if (
      data?.data?.tradeSheetData?.buyerInformations &&
      data?.data?.tradeSheetData?.buyerInformations.length > 0
    ) {
      setBuyers(data?.data?.tradeSheetData?.buyerInformations);
      data?.data?.tradeSheetData?.buyerInformations.forEach(
        (buyer: any, index: any) => {
          setValue(`buyer${index + 1}FirstName`, buyer.firstName);
          setValue(`buyer${index + 1}LastName`, buyer.lastName);
        }
      );
    }
    
  }, [data, reset, uuid, setValue]);

  const [createUpdateBuyerInformations] =
    useCreateUpdateBuyerInformationsMutation();

  const onSubmit = async (formData: any) => {
  setBtnLoading(formData.saveBtn);
  
  try {
    const buyersArray = buyers.map((_buyer, index) => ({
      firstName: formData[`buyer${index + 1}FirstName`],
      lastName: formData[`buyer${index + 1}LastName`],
    }));

    const isDraft = formData.saveBtn === "save-draft";
    const requestData = {
      buyers: buyersArray,
      status: isDraft ? 'draft' : 'active',
      saveBtn: formData.saveBtn
    };

    const response = await createUpdateBuyerInformations({
      data: requestData,
      uuid,
    }).unwrap();

    toast.success(`${response?.message}`);

     let navigatePath = '';
      switch (requestData.saveBtn) {
        case "save-next":
          navigatePath = `/dashboard/agent/pages/form/trade-sheet/agent-details/${uuid}`;
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

  const addBuyer = () => {
    setBuyers([...buyers, { id: Date.now() }]);
  };

  const removeBuyer = (id: number) => {
    setBuyers(buyers.filter((buyer) => buyer.id !== id));
  };
  
  const resetForm = () =>{
    reset();
    toast.success("Successfully Reset!");
  }

  const cancelSubmit = () =>{
    toast.error("You are canceling the creation of the trade sheet!");
    navigate(
      `/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list`,
      { replace: true }
    );
  }

  return (
    <div>
      <TradeSheetSteps active={4} uuid={uuid} />

      {isLoading ? (
        <TableLoader />
      ) : (
        <div className="max-w-full mt-8 p-8 border border-gray-300/30 rounded-md border-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="max-FULL p-6 bg-[#c9c1c13d] rounded-lg shadow-md">
              <h3 className="py-2">{userName}'s Information:</h3>
              <div className="flex flex-col gap-6">
                {buyers.map((buyer, index) => (
                  <div key={buyer.id} className="flex flex-col gap-4">
                    <h3 className="text-lg font-semibold">{userName} {index + 1}</h3>
                    <div className="flex items-end gap-5">
                      <div className="w-full flex gap-4">
                        <div className="w-full">
                          <TextInput
                            label="First Name"
                            register={register}
                            required={index === 0}
                            name={`buyer${index + 1}FirstName`}
                            errors={errors}
                          />
                        </div>
                        <div className="w-full">
                          <TextInput
                            label="Last Name"
                            register={register}
                            required={index === 0}
                            name={`buyer${index + 1}LastName`}
                            errors={errors}
                          />
                        </div>
                      </div>
                      {buyers.length > 1 && (
                        <Button
                          type="link"
                          icon={<MinusCircleOutlined />}
                          className="text-red-500"
                          onClick={() => removeBuyer(buyer.id)}
                        ></Button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button
                    type="dashed"
                    icon={<PlusCircleOutlined />}
                    onClick={addBuyer}
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

              <NavLink
                to={`/dashboard/agent/pages/form/trade-sheet/seller-information/${uuid}`}
                className="primary-btn flex-1 mx-2 my-2 text-center"
              >
                Go Back
              </NavLink>
              
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

export default TradeSheetBuyerInformation;
