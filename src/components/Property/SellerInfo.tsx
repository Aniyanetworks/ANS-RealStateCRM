/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck

import React from "react";
import { searchSingleString } from "../../utils/searchString";

type SellerInfoProps = {
  data?: any;
};

const SellerInfo: React.FC<SellerInfoProps> = ({ data }) => {
  const mls = searchSingleString(data, "MLS#:");
  const seller = searchSingleString(data, "Seller");
  const occupancy = searchSingleString(data, "Occup");
  const pin = searchSingleString(data, "PIN#:");
  const arn = searchSingleString(data, "ARN#:");
  const contactAfter = searchSingleString(data, "Contact After Exp:");
  const holdover = searchSingleString(data, "Holdover:");
  return (
    <div className=" border-y py-5">
      <div className="flex gap-5">
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">MLS#:</p>
          <input
            defaultValue={mls}
            type="text"
            name=""
            id=""
            placeholder="e.g. W8372234"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex w-[65%] items-center gap-1">
          <p className=" text-nowrap block font-semibold">Seller:</p>
          <input
            defaultValue={seller}
            type="text"
            name=""
            id=""
            placeholder="e.g. Nadia Binte Nazrul (Under Power Of Sale)"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Occupancy:</p>
          <input
            defaultValue={occupancy}
            type="text"
            name=""
            id=""
            placeholder="e.g.Vacant"
            className="border-none bg-transparent block"
          />
        </div>
      </div>
      <div className="flex gap-5">
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">PIN#:</p>
          <input
            defaultValue={pin}
            type="text"
            name=""
            id=""
            placeholder="e.g.103090703"
            className="border-none bg-transparent block"
          />
        </div>

        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">ARN#:</p>
          <input
            defaultValue={arn}
            type="text"
            name=""
            id=""
            placeholder="e.g.190801222000400"
            className="border-none bg-transparent block"
          />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">
              Contact After Exp:
            </p>
            <input
              defaultValue={contactAfter}
              type="text"
              name=""
              id=""
              placeholder="e.g.N"
              className="border-none bg-transparent block"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <p className=" text-nowrap block font-semibold">Holdover:</p>
        <input
          defaultValue={holdover}
          type="text"
          name=""
          id=""
          placeholder="e.g.90"
          className="border-none bg-transparent block"
        />
      </div>
    </div>
  );
};

export default SellerInfo;
