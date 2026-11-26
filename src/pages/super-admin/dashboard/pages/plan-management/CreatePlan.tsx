// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useState, useEffect } from "react";
import { useCreatePlanMutation } from "../../../../../redux/api/superadmin/plan-management/planManagementSlice";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaMinusCircle, FaPlusCircle } from "react-icons/fa";

interface PlanSubItem {
  name: string;
  value: number;
}

interface PlanItem {
  name: string;
  value: number;
  isOptional: boolean;
  commissionOwner: number;
  commissionAgent: number;
  itemType: string;
  planSubItems: PlanSubItem[];
}

const CreatePlan = () => {
  const [planName, setPlanName] = useState<string>("");
  const [planType, setPlanType] = useState<string>("Yearly");
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const dummyData: PlanItem[] = [
      {
        name: "Yearly Desk Fee",
        value: 100,
        isOptional: false,
        commissionOwner: 0,
        commissionAgent: 0,
        itemType: "Other",
        planSubItems: [],
      },
      {
        name: "Commission Plan",
        value: 0,
        isOptional: true,
        commissionOwner: 0,
        commissionAgent: 0,
        itemType: "Commission",
        planSubItems: [
          { name: "Buy/Sale Admin Fees", value: 0 },
          { name: "Lease Admin Fees", value: 0 },
        ],
      },
      {
        name: "Transection Cap Fee",
        value: 0,
        isOptional: true,
        commissionOwner: 0,
        commissionAgent: 0,
        itemType: "Other",
        planSubItems: [],
      },
      {
        name: "Agent must payback if leave with in 2 year of service",
        value: 0,
        isOptional: true,
        commissionOwner: 0,
        commissionAgent: 0,
        itemType: "Other",
        planSubItems: [],
      },
    ];

    setPlanItems(dummyData);
  }, []);

  const handleAddPlanItem = () => {
    setPlanItems([
      ...planItems,
      {
        name: "",
        value: 0,
        isOptional: false,
        commissionOwner: 0,
        commissionAgent: 0,
        itemType: "Fee",
        planSubItems: [],
      },
    ]);
  };

  const handleRemovePlanItem = (index: number) => {
    const newPlanItems = planItems.filter((_, i) => i !== index);
    setPlanItems(newPlanItems);
  };

  const handlePlanItemChange = <K extends keyof PlanItem>(
    index: number,
    field: K,
    value: PlanItem[K]
  ) => {
    const newPlanItems = [...planItems];
    newPlanItems[index][field] = value;
    setPlanItems(newPlanItems);
  };

  const handleAddSubItem = (itemIndex: number) => {
    const newPlanItems = [...planItems];
    newPlanItems[itemIndex].planSubItems.push({ name: "", value: 0 });
    setPlanItems(newPlanItems);
  };

  const handleRemoveSubItem = (itemIndex: number, subItemIndex: number) => {
    const newPlanItems = [...planItems];
    newPlanItems[itemIndex].planSubItems = newPlanItems[
      itemIndex
    ].planSubItems.filter((_, i) => i !== subItemIndex);
    setPlanItems(newPlanItems);
  };

  const handleSubItemChange = <K extends keyof PlanSubItem>(
    itemIndex: number,
    subItemIndex: number,
    field: K,
    value: PlanSubItem[K]
  ) => {
    const newPlanItems = [...planItems];
    newPlanItems[itemIndex].planSubItems[subItemIndex][field] = value;
    setPlanItems(newPlanItems);
  };

  const [createPlan] = useCreatePlanMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = {
      name: planName,
      type: planType,
      planItems: planItems,
    };

    try {
      const response = await createPlan(data).unwrap();
      if (response.status) {
        toast.success("Plan created successfully!");
        navigate("/dashboard/super-admin/plan-management", { replace: true });
        setMessage("Plan created successfully!");
        setError("");
      }
    } catch (error) {
      setError("Error creating plan. Please try again.");
      setMessage("");
    }
  };

  return (
    <div className="mx-auto  ">
      <form onSubmit={handleSubmit}>
        <div className="bg-white  shadow-lg border border-gray-300 rounded-xl">
          <h1 className=" bg-[#EEEEEE] px-4 rounded-t-xl py-2">
            Create a New Plan
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 px-4 pt-4 gap-5">
            <div className="mb-4">
              <input
                id="planName"
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                required
                placeholder="e.g. plan name"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <select
                id="planType"
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
              >
                <option value="" selected disabled>
                  Plan type
                </option>
                <option value="Yearly">Yearly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-2 mt-5">Plan Items</h3>
        <div className="space-y-5 ">
          {planItems.map((item, index) => (
            <div
              key={index}
              className=" border bg-white border-gray-300 rounded-xl shadow-xl"
            >
              <div className="flex justify-between bg-[#EEEEEE] rounded-t-xl px-4 py-2">
                <h4 className="text-md  font-semibold ">Item {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => handleRemovePlanItem(index)}
                  className="text-red-600 text-xl "
                >
                  <svg
                    fill="#dc2626 "
                    version="1.1"
                    className=""
                    width="18px"
                    height="18px"
                    viewBox="0 0 482.428 482.429"
                  >
                    <g>
                      <g>
                        <path
                          d="M381.163,57.799h-75.094C302.323,25.316,274.686,0,241.214,0c-33.471,0-61.104,25.315-64.85,57.799h-75.098
			c-30.39,0-55.111,24.728-55.111,55.117v2.828c0,23.223,14.46,43.1,34.83,51.199v260.369c0,30.39,24.724,55.117,55.112,55.117
			h210.236c30.389,0,55.111-24.729,55.111-55.117V166.944c20.369-8.1,34.83-27.977,34.83-51.199v-2.828
			C436.274,82.527,411.551,57.799,381.163,57.799z M241.214,26.139c19.037,0,34.927,13.645,38.443,31.66h-76.879
			C206.293,39.783,222.184,26.139,241.214,26.139z M375.305,427.312c0,15.978-13,28.979-28.973,28.979H136.096
			c-15.973,0-28.973-13.002-28.973-28.979V170.861h268.182V427.312z M410.135,115.744c0,15.978-13,28.979-28.973,28.979H101.266
			c-15.973,0-28.973-13.001-28.973-28.979v-2.828c0-15.978,13-28.979,28.973-28.979h279.897c15.973,0,28.973,13.001,28.973,28.979
			V115.744z"
                        />
                        <path
                          d="M171.144,422.863c7.218,0,13.069-5.853,13.069-13.068V262.641c0-7.216-5.852-13.07-13.069-13.07
			c-7.217,0-13.069,5.854-13.069,13.07v147.154C158.074,417.012,163.926,422.863,171.144,422.863z"
                        />
                        <path
                          d="M241.214,422.863c7.218,0,13.07-5.853,13.07-13.068V262.641c0-7.216-5.854-13.07-13.07-13.07
			c-7.217,0-13.069,5.854-13.069,13.07v147.154C228.145,417.012,233.996,422.863,241.214,422.863z"
                        />
                        <path
                          d="M311.284,422.863c7.217,0,13.068-5.853,13.068-13.068V262.641c0-7.216-5.852-13.07-13.068-13.07
			c-7.219,0-13.07,5.854-13.07,13.07v147.154C298.213,417.012,304.067,422.863,311.284,422.863z"
                        />
                      </g>
                    </g>
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-3 my-5 gap-5 px-4">
                <div>
                  <input
                    id={`itemName-${index}`}
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      handlePlanItemChange(index, "name", e.target.value)
                    }
                    placeholder="Item Name"
                    required
                    className=" block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                  />
                </div>

                <div>
                  <select
                    id={`itemType-${index}`}
                    value={item.itemType}
                    onChange={(e) =>
                      handlePlanItemChange(index, "itemType", e.target.value)
                    }
                    className=" block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                  >
                    <option value="" selected disabled>
                      Select item type{" "}
                    </option>
                    <option value="Fee">Fee</option>
                    <option value="Commission">Commission</option>
                    <option value="Optional">Optional</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {item.itemType !== "Commission" && (
                  <div>
                    <input
                      id={`itemValue-${index}`}
                      type="number"
                      value={item.value}
                      onChange={(e) =>
                        handlePlanItemChange(
                          index,
                          "value",
                          parseFloat(e.target.value)
                        )
                      }
                      placeholder="Item Value"
                      required
                      className=" block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {item.itemType === "Commission" && (
                <div className="px-4">
                  <h5 className="text-md font-semibold text-gray-700 mb-2">
                    Commission Split
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label
                        htmlFor={`commissionAgent-${index}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Agent (%):
                      </label>
                      <input
                        id={`commissionAgent-${index}`}
                        type="number"
                        value={item.commissionAgent}
                        onChange={(e) =>
                          handlePlanItemChange(
                            index,
                            "commissionAgent",
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                      />
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor={`commissionOwner-${index}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Brokerage (%):
                      </label>
                      <input
                        id={`commissionOwner-${index}`}
                        type="number"
                        value={item.commissionOwner}
                        onChange={(e) =>
                          handlePlanItemChange(
                            index,
                            "commissionOwner",
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mx-5 mb-5 bg-white rounded-xl shadow-lg border border-gray-300">
                <h5 className="text-md px-4 py-2 rounded-t-xl bg-[#EEEEEE] font-semibold mb-2">
                  Sub Items
                </h5>
                <div className="px-5 pb-5 space-y-3">
                  {item.planSubItems.map((subItem, subItemIndex) => (
                    <div key={subItemIndex} className="flex gap-5">
                      <p className=" flex items-center">{subItemIndex + 1}</p>
                      <input
                        id={`subItemName-${index}-${subItemIndex}`}
                        type="text"
                        value={subItem.name}
                        onChange={(e) =>
                          handleSubItemChange(
                            index,
                            subItemIndex,
                            "name",
                            e.target.value
                          )
                        }
                        required
                        placeholder="Sub Item Name"
                        className=" block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                      />
                      <div>
                        <input
                          id={`subItemValue-${index}-${subItemIndex}`}
                          type="number"
                          value={subItem.value}
                          onChange={(e) =>
                            handleSubItemChange(
                              index,
                              subItemIndex,
                              "value",
                              parseFloat(e.target.value)
                            )
                          }
                          required
                          className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveSubItem(index, subItemIndex)
                          }
                          className="text-red-600 text-2xl"
                        >
                          <svg
                            width="20px"
                            height="20px"
                            className="bg-red-100 hover:bg-red-200 rounded-full "
                            viewBox="0 -0.5 25 25"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M6.96967 16.4697C6.67678 16.7626 6.67678 17.2374 6.96967 17.5303C7.26256 17.8232 7.73744 17.8232 8.03033 17.5303L6.96967 16.4697ZM13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697L13.0303 12.5303ZM11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303L11.9697 11.4697ZM18.0303 7.53033C18.3232 7.23744 18.3232 6.76256 18.0303 6.46967C17.7374 6.17678 17.2626 6.17678 16.9697 6.46967L18.0303 7.53033ZM13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303L13.0303 11.4697ZM16.9697 17.5303C17.2626 17.8232 17.7374 17.8232 18.0303 17.5303C18.3232 17.2374 18.3232 16.7626 18.0303 16.4697L16.9697 17.5303ZM11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697L11.9697 12.5303ZM8.03033 6.46967C7.73744 6.17678 7.26256 6.17678 6.96967 6.46967C6.67678 6.76256 6.67678 7.23744 6.96967 7.53033L8.03033 6.46967ZM8.03033 17.5303L13.0303 12.5303L11.9697 11.4697L6.96967 16.4697L8.03033 17.5303ZM13.0303 12.5303L18.0303 7.53033L16.9697 6.46967L11.9697 11.4697L13.0303 12.5303ZM11.9697 12.5303L16.9697 17.5303L18.0303 16.4697L13.0303 11.4697L11.9697 12.5303ZM13.0303 11.4697L8.03033 6.46967L6.96967 7.53033L11.9697 12.5303L13.0303 11.4697Z"
                              fill="#dc2626 "
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddSubItem(index)}
                    className="flex items-center gap-1 mt-4 py-[4px] px-4 rounded-md border border-dashed border-gray-300"
                  >
                    <FaPlusCircle />
                    ADD SUB ITEM
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between mb-10 mt-5 bg-white p-4 rounded-xl shadow-lg border border-gray-300">
          <button
            type="button"
            onClick={handleAddPlanItem}
            className="primary-btn mr-2"
          >
            ADD PLAN ITEM
          </button>
          <div>
            <Link to="/dashboard/super-admin/plan-management">
              <button type="button" className="cancel-btn mr-3">
                Go Back
              </button>
            </Link>

            <button type="submit" className="btn-common">
              Create Plan
            </button>
          </div>
        </div>
        {message && <p className="text-green-600">{message}</p>}
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </div>
  );
};

export default CreatePlan;
