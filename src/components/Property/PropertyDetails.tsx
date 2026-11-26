/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React from "react";
import { searchSingleString } from "../../utils/searchString";

type PropertyInfo = {
  name: string;
  text: string;
};

type PropertyDetailsProps = {
  propertyDetails?: PropertyInfo[];
  data?: any;
};

const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  propertyDetails,
  data,
}) => {
  const info: { text: string }[] =
    propertyDetails?.map((item) => {
      return {
        text:
          item.text.split(":").length > 1 ? item.text.split(":")[1] : item.text,
      };
    }) || [];

  const front = searchSingleString(data, "Fronting On:");
  const rms = searchSingleString(data, "Rms:");
  const link = searchSingleString(data, "Link:");
  const acreage = searchSingleString(data, "Acreage:");
  const bedrooms = searchSingleString(data, "Bedrooms:");
  const lot = searchSingleString(data, "Lot:");
  const washrms = searchSingleString(data, "Washrms:");
  const irreg = searchSingleString(data, "Irreg:");
  const crossSt = searchSingleString(data, "Dir/Cross St:");

  return (
    <div className="my-5 ">
      <div className="grid grid-cols-3 gap-5">
        <div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Property type:</p>
            <input
              defaultValue={info[0]?.text}
              type="text"
              name=""
              id=""
              placeholder="e.g. Detached"
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Link:</p>
            <input
              defaultValue={link}
              type="text"
              name=""
              id=""
              placeholder="e.g.N"
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Style:</p>
            <input
              defaultValue={info[6]?.text}
              type="text"
              name=""
              id=""
              placeholder="e.g. Sidesplit 4"
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Irreg:</p>
            <input
              defaultValue={irreg}
              type="text"
              name=""
              id=""
              placeholder="e.g.N"
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Dir/Cross St:</p>
            <input
              defaultValue={crossSt}
              type="text"
              name=""
              id=""
              placeholder="e.g. Sidesplit 4"
              className="border-none bg-transparent block"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Fronting On:</p>
            <input
              defaultValue={front}
              type="text"
              name=""
              id=""
              placeholder="e.g. E"
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Acreage:</p>
            <input
              defaultValue={acreage}
              type="text"
              name=""
              id=""
              placeholder="e.g. E"
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Lot:</p>
            <input
              defaultValue={lot}
              type="text"
              name=""
              id=""
              placeholder="e.g. 90.36 x 150.00"
              className="border-none bg-transparent block"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">RMS:</p>
            <input
              defaultValue={rms}
              type="text"
              name=""
              id=""
              placeholder="e.g. 5"
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Bedrooms:</p>
            <input
              defaultValue={bedrooms}
              type="text"
              name=""
              id=""
              placeholder="e.g. 5"
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Washrms:</p>
            <input
              defaultValue={washrms}
              type="text"
              name=""
              id=""
              placeholder="e.g. 1x3xBsmt, 1x4xMain, 1x4x2nd"
              className="border-none bg-transparent block"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
