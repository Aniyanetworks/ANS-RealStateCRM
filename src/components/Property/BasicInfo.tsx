/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React from "react";
import { searchSingleString } from "../../utils/searchString";

type BasicInfo = {
  name: string;
  text: string;
};

type BasicInfoProps = {
  basicInfo?: BasicInfo[];
  data?: any;
};

const BasicInfo: React.FC<BasicInfoProps> = ({ basicInfo, data }) => {
  const info: { text: string }[] =
    basicInfo?.map((item) => {
      return {
        text:
          item.text.split(":").length > 1 ? item.text.split(":")[1] : item.text,
      };
    }) || [];

  const sold: string = searchSingleString(data, "Sold:");
  const list = searchSingleString(data, "List:");
  const forSale = searchSingleString(data, "For:");
  const diff = searchSingleString(data, "% Dif:");

  const taxes = searchSingleString(data, "Taxes:");
  const spis = searchSingleString(data, "SPIS:");
  const lastStatus = searchSingleString(data, "Last Status:");
  const dom = searchSingleString(data, "DOM:");

  return (
    <div className="border-b pb-5">
      <div className="border-b pb-5">
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">Prepared By:</p>
          <input
            defaultValue={info[0]?.text}
            type="text"
            name=""
            id=""
            placeholder="e.g. Alam Hossain"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <input
            defaultValue={info[1]?.text}
            type="text"
            name=""
            id=""
            placeholder="e.g. Brokerage"
            className="border-none -ml-2 bg-transparent block"
          />
        </div>
      </div>

      <div>
        <div className="flex gap-10 justify-between">
          <div className="w-[70%]">
            <div className="flex items-center gap-1">
              <p className=" text-nowrap block font-semibold">Address:</p>
              <input
                defaultValue={info[3]?.text}
                type="text"
                name=""
                id=""
                placeholder="e.g.1 Stanwood Cres"
                className="border-none bg-transparent block"
              />
            </div>
            <div className="flex items-center gap-1">
              <p className=" text-nowrap block font-semibold">location:</p>
              <input
                defaultValue={info[5]?.text}
                type="text"
                name=""
                id=""
                placeholder="e.g.Toronto Ontario M9M 1Z8"
                className="border-none bg-transparent block"
              />
            </div>
            <div className="flex items-center gap-1">
              <p className=" text-nowrap block font-semibold">Area:</p>
              <input
                defaultValue={info[7]?.text}
                type="text"
                name=""
                id=""
                placeholder="e.g.Toronto W05 Humbermede Toronto"
                className="border-none bg-transparent block"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className=" text-nowrap block font-semibold">Sold:</p>
              <input
                defaultValue={sold}
                type="text"
                name=""
                id=""
                placeholder="e.g.$1,190,000"
                className="border-none bg-transparent block"
              />
            </div>
            <div className="flex items-center gap-1">
              <p className=" text-nowrap block font-semibold">List:</p>
              <input
                defaultValue={list}
                type="text"
                name=""
                id=""
                placeholder="e.g.$1,195,000"
                className="border-none bg-transparent block"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Taxes:</p>
            <input
              defaultValue={taxes}
              type="text"
              name=""
              id=""
              placeholder="e.g.$3,744.46/2023 "
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">For:</p>
            <input
              defaultValue={forSale || info[9]?.text}
              type="text"
              name=""
              id=""
              placeholder="e.g.sale "
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">% Dif:</p>
            <input
              defaultValue={diff}
              type="text"
              name=""
              id=""
              placeholder="e.g.100"
              className="border-none bg-transparent block"
            />
          </div>
        </div>
        <div className="flex gap-10">
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">SPIS:</p>
            <input
              defaultValue={spis}
              type="text"
              name=""
              id=""
              placeholder="e.g.N"
              className="border-none bg-transparent block"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className=" text-nowrap block font-semibold">Last Status:</p>
            <input
              defaultValue={lastStatus}
              type="text"
              name=""
              id=""
              placeholder="e.g.SLD"
              className="border-none bg-transparent block"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">legal_description:</p>
          <input
            defaultValue={info[13]?.text}
            type="text"
            name=""
            id=""
            placeholder="e.g.LT 14 PL 5768 NORTH YORK; S/T NY347835; TORONTO (N YORK)"
            className="border-none bg-transparent block"
          />
        </div>

        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">City:</p>
          <input
            defaultValue={info[14]?.text}
            type="text"
            name=""
            id=""
            placeholder="e.g.CITY OF TORONTO"
            className="border-none bg-transparent block"
          />
        </div>
        <div className="flex items-center gap-1">
          <p className=" text-nowrap block font-semibold">DOM:</p>
          <input
            defaultValue={dom}
            type="text"
            name=""
            id=""
            placeholder="e.g.100"
            className="border-none bg-transparent block"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfo;
