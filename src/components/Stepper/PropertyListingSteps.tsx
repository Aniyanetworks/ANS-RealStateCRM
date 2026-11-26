import React from "react";
import { AiOutlineDoubleRight } from "react-icons/ai";
import { Link } from "react-router-dom";
interface PropertyListingStepsProps {
    active: any;
    uuid: any;
}

const PropertyListingSteps: React.FC<PropertyListingStepsProps> = ({ active, uuid }) => {
    
    // Define your steps
    const steps = [
        {
            label: "Property Details",
            path: `/dashboard/super-admin/create-update-property-listing/${uuid}`,
        },
        {
            label: "Attachment",
            path: `/dashboard/super-admin/property-listing/paperwork-attachment-upload/${uuid}`,
        },
        // {
        //     label: "",
        //     path: ``,
        // },
        // {
        //     label: "Documents",
        //     path: `/dashboard/super-admin/agent-file-upload/${uuid}`,
        // },
    ];

    return (
        <div className="flex items-center justify-center pt-10 px-20 w-[40%] m-auto">
            {steps.map((step, index) => (
                <React.Fragment key={index}>
                    <Link
                        to={step.path}
                        className="router-link-active-stepper-steps relative "
                    >
                        <span className="hidden xl:block text-xs absolute top-[-20px] left-[-25px] text-nowrap">
                            {step?.label}
                        </span>
                        <div className="flex items-center rounded-2xl  xl:border xl:border-r-0">
                            <div className="flex size-8 items-center justify-center rounded-full border-2 border-[#9F8667]">
                                {active === index + 1 ? (
                                    <div className="flex size-6 flex-shrink-0 bg-[#9F8667]  items-center justify-center rounded-full font-medium text-white">
                                        <AiOutlineDoubleRight
                                            name="fe:check"
                                            className="text-lg text-[#fff] "
                                        />
                                    </div>
                                ) : active > index + 1 ? (
                                    <div className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-[#9F8667] font-medium text-white">
                                        <AiOutlineDoubleRight
                                            name="fe:check"
                                            className="text-lg "
                                        />
                                    </div>
                                ) : (
                                    <div className="flex size-5 flex-shrink-0 items-center justify-center rounded-full  font-medium text-white "></div>
                                )}
                            </div>
                        </div>
                    </Link>

                    {index < steps.length - 1 && (
                        <hr
                            className={`${active >= index + 2 ? "border-[#9F8667] " : "border-[#ffffff] "
                                }  border-2 w-full `}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default PropertyListingSteps;
