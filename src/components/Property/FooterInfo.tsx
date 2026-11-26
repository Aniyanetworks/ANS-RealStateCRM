/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React from "react";
import { searchSingleString } from "../../utils/searchString";

type FooterInfoProps = {
  data: any;
  pdfData?: any;
};
const FooterInfo: React.FC<FooterInfoProps> = ({ data, pdfData }) => {
  const contractDate = searchSingleString(pdfData, "Contract Date:");
  const soldDate = searchSingleString(pdfData, "Sold Date:");
  const leasedTerm = searchSingleString(pdfData, "Leased Terms:");
  const expiryDate = searchSingleString(pdfData, "Expiry Date:");
  const closingDate = searchSingleString(pdfData, "Closing Date:");
  const original = searchSingleString(pdfData, "Original:");
  const lastUpdate = searchSingleString(pdfData, "Last Update:");
  const cbComm = searchSingleString(pdfData, "CB Comm:");

  return (
    <div className="mt-5">
      <div className="flex gap-2">
        <div className="flex items-center gap-1 w-1/2">
          <p className=" text-nowrap block font-semibold">List:</p>
          <input
            type="text"
            name=""
            id=""
            placeholder="e.g. DREAM VALLEY REALTY INC."
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-2 w-1/2">
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Ph:</p>
            <input
              type="text"
              name=""
              id=""
              placeholder="e.g. 416-951-9929."
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Fax:</p>
            <input
              type="text"
              name=""
              id=""
              placeholder="e.g. 416-951-9929."
              className="border-none bg-transparent block"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <p className=" text-nowrap block font-semibold">Co-op:</p>
        <input
          value={data?.coOp ? data?.coOp?.split(":")[1] : data?.coOp}
          type="text"
          name=""
          id=""
          placeholder="e.g. RE/MAX REALTRON REALTY INC., BROKERAGE."
          className="border-none bg-transparent block"
        />
      </div>

      <div className=" grid grid-cols-3 gap-2">
        <div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Contract Date:</p>
            <input
              defaultValue={contractDate}
              type="text"
              name=""
              id=""
              placeholder="e.g. 05/24/2024."
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Expiry Date:</p>
            <input
              defaultValue={expiryDate}
              type="text"
              name=""
              id=""
              placeholder="e.g. 10/31/2024"
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Last Update:</p>
            <input
              defaultValue={lastUpdate}
              type="text"
              name=""
              id=""
              placeholder="e.g. 06/11/2024"
              className="border-none bg-transparent block"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Sold Date:</p>
            <input
              defaultValue={soldDate}
              type="text"
              name=""
              id=""
              placeholder="e.g. 06/10/2024"
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Closing Date:</p>
            <input
              defaultValue={closingDate}
              type="text"
              name=""
              id=""
              placeholder="e.g. 10/31/2024"
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">CB Comm:</p>
            <input
              defaultValue={cbComm}
              type="text"
              name=""
              id=""
              placeholder="e.g."
              className="border-none bg-transparent block"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Leased Terms:</p>
            <input
              defaultValue={leasedTerm}
              type="text"
              name=""
              id=""
              placeholder="e.g. ABC"
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Original:</p>
            <input
              defaultValue={original}
              type="text"
              name=""
              id=""
              placeholder="e.g. $1,195,000"
              className="border-none bg-transparent block"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterInfo;
