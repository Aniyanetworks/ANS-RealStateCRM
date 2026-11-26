// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import { useParams } from "react-router-dom";

import PropertyListingSteps from "../../../../../components/Stepper/PropertyListingSteps";
import PaperworkPropertyListing from "../../../../../components/tradesheet/PaperworkPropertyListing";
import { useGetSpacificPropertyListingQuery } from "../../../../../redux/api/superadmin/propertyListingDataSlice";

const PropertyListingPaperworkAttachmentUpload: React.FC = () => {
  const { uuid } = useParams<{ uuid?: string }>();
  const { data } = useGetSpacificPropertyListingQuery(uuid ?? "", {
    skip: !uuid,
  });
  const propertiesData = data?.data?.propertyListingData;
  const showPropertyHeader =
    uuid && (propertiesData?.propertyListingTypeId || propertiesData?.propertyAddress);

  return (
    <div>
      <div className="bg-[#c9c1c13d] py-5 flex items-center justify-center w-full">
        <h2 className="uppercase text-center m-0 flex-1">
          {showPropertyHeader
            ? `${propertiesData?.propertyListingTypeId || "N/A"}-${propertiesData?.propertyAddress || "N/A"}`
            : "PROPERTY LISTING"}
        </h2>
      </div>
      <PropertyListingSteps active={8} uuid={uuid} />

      <div className="max-w-full mt-8 mb-16 border border-gray-300/30 rounded-md ">
        <div className="p-5 bg-white rounded-xl">
          <div>
            <PaperworkPropertyListing />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyListingPaperworkAttachmentUpload;
