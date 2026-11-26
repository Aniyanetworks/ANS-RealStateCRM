import { DatePicker } from "antd";
import {
  FormSectionHeading,
  InPutField,
  SubSectionHeading,
} from "../shared/FormHelpers";
import {
  exterior,
  propertyTypes,
  styleOptions,
} from "../../../../data/FormData";

const Page1 = () => {
  return (
    <div className=" bg-white px-12 py-8 text-darkBlue">
      <div className="flex justify-between mb-2">
        <div className="flex items-end gap-10  ">
          <div className="flex gap-2 items-center">
            <span className="size-5 bg-pink-500"></span>
            <span className="leading-4 text-sm">
              Mandatory field <br />
              All property types
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="size-5 border-2 border-darkBlue"></span>
            <span className="leading-4 text-sm">
              Optinal field <br />
              All property types
            </span>
          </div>
        </div>

        <div>
          <div className="flex gap-2 mb-2">
            <FormSectionHeading className="bg-transparent px-0 text-darkBlue  ">
              <SubSectionHeading
                title="MLS&reg; "
                className="bg-transparent border-2 border-darkBlue "
              />
            </FormSectionHeading>
            <div className="-mt-2">
              <InPutField />
            </div>
          </div>
          <p className="text-[16px] leading-5">
            FOR BOARD USE ONLY FOR A NEW LISTING OR TO BE <br /> COMPLETED FOR A
            RE-RUN
          </p>
        </div>
      </div>

      {/* ------------------ ----------------------
      LOCATIOn SECTION
      ---------------------------------------------- */}
      <div>
        <FormSectionHeading className="uppercase">Location</FormSectionHeading>
        <div className="flex justify-between items-center">
          <div>
            <FormSectionHeading className="bg-transparent mt-1 px-0">
              <SubSectionHeading title="ASSESSMENT ROLL NUMBER (ARNI)" />
            </FormSectionHeading>
            <InPutField inputClass="!w-[420px]" />
          </div>

          <div className="flex items-center  gap-1 ">
            <p className="border-dashed border-2 bg-blue-900/15 border-blue-900 size-6"></p>
            <p className="capitalize leading-4 font-medium text-blue-900">
              Initial information <br /> page
            </p>
          </div>
        </div>
      </div>

      {/* ------------------ ----------------------
       SECTION 2
      ---------------------------------------------- */}
      <div className="py-2">
        <div className="flex ">
          {/*---- pin--------- */}
          <div className="border-b-2 border-r-2 border-dashed pb-2 w-64 border-darkBlue">
            <FormSectionHeading className="bg-transparent mt-1 px-0">
              <span className="border-darkBlue text-darkBlue border-2 px-1">
                PIN #
              </span>
            </FormSectionHeading>
            <div className="!w-56">
              <InPutField inputClass="" />
            </div>
          </div>

          {/* area----- */}
          <div className="border-t-2 border-r-2 border-dashed pb-2 pl-5 flex-grow border-darkBlue bg-darkBlue/5">
            <FormSectionHeading className="bg-transparent mt-1 px-0">
              <SubSectionHeading title="AREA" />
            </FormSectionHeading>
            <div className="max-w-[90%]">
              <InPutField inputClass="bg-transparent" />
            </div>
          </div>
        </div>

        {/*  */}
        <div className="border-2 border-t-0 border-dashed pb-1 px-2 flex flex-col gap-1 flex-grow border-darkBlue bg-darkBlue/5">
          {/* MUNICIPALITY------------ */}
          <div>
            <FormSectionHeading className="bg-transparent mt-1 px-0">
              <SubSectionHeading title="MUNICIPALITY" />
            </FormSectionHeading>
            <div className="max-w-[65%]">
              <InPutField inputClass="!bg-transparent" />
            </div>
          </div>

          {/* COMMUNITY------------ */}
          <div>
            <FormSectionHeading className="bg-transparent mt-1 px-0">
              <div className="flex gap-2 ">
                <SubSectionHeading title="COMMUNITY" />

                <span className="text-darkBlue h-1 -mt-1 text-xl">*</span>
              </div>
            </FormSectionHeading>
            <div className="max-w-[75%]">
              <InPutField inputClass="!bg-transparent" />
            </div>
          </div>

          <div>
            <p className="flex gap-1 items-center text-[13px] border-b border-darkBlue">
              <span className="text-lg -mb-1">*</span>
              <span> MANDATORY IF AVAILABLE</span>
            </p>

            <div className="flex pt-1 gap-5">
              {/* STREET NUMBER ---------- */}
              <div className="">
                <FormSectionHeading className="bg-transparent mt-1 px-0">
                  <SubSectionHeading title="STREET NUMBER" />
                </FormSectionHeading>
                <div className="w-28">
                  <InPutField inputClass="!bg-transparent" />
                </div>
              </div>

              {/* STREET NAME ---------- */}
              <div className="">
                <FormSectionHeading className="bg-transparent mt-1 px-0">
                  <SubSectionHeading title="STREET NAME" />
                </FormSectionHeading>
                <div className="w-60">
                  <InPutField inputClass="!bg-transparent" />
                </div>
              </div>

              {/* ABBREV. ---------- */}
              <div className="">
                <FormSectionHeading className="bg-transparent mt-1 px-0">
                  <SubSectionHeading title="ABBREV." />
                </FormSectionHeading>
                <div className="w-20">
                  <InPutField inputClass="!bg-transparent" />
                </div>
              </div>

              {/* ----direction */}

              <div className="  flex-shrink-0">
                <FormSectionHeading className="bg-transparent text-darkBlue mt-1 px-0">
                  <span className="border-2  border-darkBlue px-1">DIR</span>
                </FormSectionHeading>

                <div className="grid grid-cols-2 gap-x-2  pt-1">
                  <label className="cursor-pointer flex items-center gap-2 m-0">
                    <input type="checkbox" className="cursor-pointer !m-0 " />E
                  </label>
                  <label className="cursor-pointer !m-0 flex items-center gap-2 ">
                    <input type="checkbox" className="cursor-pointer !m-0 " />N
                  </label>
                  <label className="cursor-pointer !m-0 flex items-center gap-2 ">
                    <input type="checkbox" className="cursor-pointer !m-0 " />S
                  </label>
                  <label className="cursor-pointer !m-0 flex items-center gap-2">
                    <input type="checkbox" className="cursor-pointer !m-0 " />W
                  </label>
                </div>
              </div>
              {/* APT/UNIT # ---------- */}
              <div className="">
                <FormSectionHeading className="bg-transparent text-darkBlue mt-1 px-0">
                  <span className="border-2  border-darkBlue px-1">
                    APT/UNIT #
                  </span>
                </FormSectionHeading>
                <div className="w-32">
                  <InPutField inputClass="!bg-transparent" />
                </div>
              </div>
              {/* POSTAL CODE ---------- */}
              <div className="">
                <FormSectionHeading className="bg-transparent mt-1 px-0">
                  <SubSectionHeading title="POSTAL CODE" />
                </FormSectionHeading>
                <div className="">
                  <InPutField inputClass="!bg-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------ ----------------------
       SECTION 3  FRONTING ON
      ---------------------------------------------- */}

      <div className="border-b border-t py-2 border-darkBlue flex gap-32">
        {/* FRONTING ON------------ */}
        <div>
          <FormSectionHeading className="bg-transparent px-0  ">
            <div className="flex items-center gap-2">
              <SubSectionHeading title="FRONTING ON" />
              <p className="text-darkBlue font-medium text-[12px]">
                (check 1 code)
              </p>
            </div>
          </FormSectionHeading>
          <div className="grid grid-cols-2 gap-x-2 pt-1">
            <label className="cursor-pointer flex items-center gap-2 m-0">
              <input type="checkbox" className="cursor-pointer !m-0 " />
              East
            </label>
            <label className="cursor-pointer !m-0 flex items-center gap-2 ">
              <input type="checkbox" className="cursor-pointer !m-0 " />
              South
            </label>
            <label className="cursor-pointer !m-0 flex items-center gap-2 ">
              <input type="checkbox" className="cursor-pointer !m-0 " />
              North
            </label>
            <label className="cursor-pointer !m-0 flex items-center gap-2">
              <input type="checkbox" className="cursor-pointer !m-0 " />
              West
            </label>
          </div>
        </div>

        {/* LEGAL DESCRIPTION (LOT, PLAN, CONCESSION)--------- */}
        <div className="flex-grow">
          <FormSectionHeading className="bg-transparent px-0  ">
            <div className="flex  gap-1 items-center">
              <SubSectionHeading
                title="LEGAL DESCRIPTION (LOT, PLAN, CONCESSION)"
                className=""
              />
              <span className="text-darkBlue text-[12px]">(30 characters)</span>
            </div>
          </FormSectionHeading>
          <InPutField inputClass="mt-2" />
        </div>
      </div>

      {/* ------------------ ----------------------
       SECTION 4 lot front
      ---------------------------------------------- */}
      <div className="mt-2  flex gap-10">
        {/* lot front */}
        <div>
          <FormSectionHeading className="bg-transparent px-0  ">
            <div className="flex  gap-1">
              <SubSectionHeading title="LOT FRONT" />
              <span className="text-darkBlue text-xl h-1 -mt-1 ">*</span>
            </div>
          </FormSectionHeading>
          <InPutField />
        </div>

        {/* lot depth*/}
        <div className="w-32">
          <FormSectionHeading className="bg-transparent px-0  ">
            <div className="flex  gap-1">
              <SubSectionHeading title="LOT DEPTH" />
              <span className="text-darkBlue text-xl h-1 -mt-1 ">*</span>
            </div>
          </FormSectionHeading>
          <InPutField />
        </div>

        {/* LOT SIZE CODE*/}
        <div className="flex-shrink-0 ">
          <FormSectionHeading className="bg-transparent px-0  ">
            <div className="flex  gap-1">
              <SubSectionHeading title="LOT SIZE CODE" />
              <span className="text-darkBlue text-xl h-1 -mt-1 ">*</span>
            </div>
          </FormSectionHeading>
          <div className="flex gap-3 p-0 mt-2 pt-1  text-darkBlue">
            <label
              htmlFor="LOT_SIZE_CODE_FEET"
              className="cursor-pointer flex items-center gap-2"
            >
              <input type="radio" name="lotSizeCode" id="LOT_SIZE_CODE_FEET" />
              Built-In
            </label>

            <label
              htmlFor="LOT_SIZE_CODE_METRES"
              className="cursor-pointer flex items-center gap-2"
            >
              <input
                type="radio"
                name="lotSizeCode"
                id="LOT_SIZE_CODE_METRES"
              />
              Metres
            </label>
            <label
              htmlFor="LOT_SIZE_CODE_ACRES"
              className="cursor-pointer flex items-center gap-2"
            >
              <input type="radio" name="lotSizeCode" id="LOT_SIZE_CODE_ACRES" />
              Acres
            </label>
          </div>
        </div>

        {/* LOT IRREGULARITIES---------- */}
        <div className="flex-grow flex-shrink-0">
          <FormSectionHeading className="bg-transparent px-0 text-darkBlue  ">
            <div className="flex  gap-1 items-center">
              <SubSectionHeading
                title="LOT IRREGULARITIES"
                className="bg-transparent border-2 border-darkBlue "
              />
              <span className="text-darkBlue text-[12px]">(40 characters)</span>
            </div>
          </FormSectionHeading>
          <InPutField />
        </div>
      </div>

      {/* ------------------ ----------------------
       SECTION 5   ACREAGE
      ---------------------------------------------- */}

      <div className="border-b  mt-1 border-darkBlue">
        <p className="flex gap-2 items-center text-[13px] border-b border-darkBlue">
          <span className="text-xl -mb-1">*</span>
          <span> MANDATORY EXCEP FOR MOBILE/TRAILER</span>
        </p>

        <div className="mt-2">
          <FormSectionHeading className="bg-transparent px-0  ">
            <div className="flex items-center gap-2">
              <SubSectionHeading
                title="ACREAGE"
                className="bg-transparent text-blue-900 border-2 border-blue-900"
              />
              <p className="text-darkBlue font-medium text-[12px]">
                (check 1 code)
              </p>
            </div>
          </FormSectionHeading>
          <div className="grid grid-cols-5 mt-2 ">
            <label
              htmlFor="acreage_less_than_.5"
              className="cursor-pointer flex items-center gap-2"
            >
              <input
                type="radio"
                name="acreage"
                className="cursor-pointer"
                id="acreage_less_than_.5"
              />
              Less than .50 Acres
            </label>

            <label
              htmlFor="acreage_0.5_1.99"
              className="cursor-pointer flex items-center gap-2"
            >
              <input
                type="radio"
                name="acreage"
                className="cursor-pointer"
                id="acreage_0.5_1.99"
              />
              .50 - 1.99 Acres
            </label>

            <label
              htmlFor="acreage_2_4.99"
              className="cursor-pointer flex items-center gap-2"
            >
              <input
                type="radio"
                name="acreage"
                className="cursor-pointer"
                id="acreage_2_4.99"
              />
              2 - 4.99 Acres
            </label>

            <label
              htmlFor="acreage_5_9.99"
              className="cursor-pointer flex items-center gap-2"
            >
              <input
                type="radio"
                name="acreage"
                className="cursor-pointer"
                id="acreage_5_9.99"
              />
              5 - 9.99 Acres
            </label>

            <label
              htmlFor="acreage_10_24.99"
              className="cursor-pointer flex items-center gap-2"
            >
              <input
                type="radio"
                name="acreage"
                className="cursor-pointer"
                id="acreage_10_24.99"
              />
              10 - 24.99 Acres
            </label>

            <label
              htmlFor="acreage_25_49.99"
              className="cursor-pointer flex items-center gap-2"
            >
              <input
                type="radio"
                name="acreage"
                className="cursor-pointer"
                id="acreage_25_49.99"
              />
              25 - 49.99 Acres
            </label>

            <label
              htmlFor="acreage_50_99.99"
              className="cursor-pointer flex items-center gap-2"
            >
              <input
                type="radio"
                name="acreage"
                className="cursor-pointer"
                id="acreage_50_99.99"
              />
              50 - 99.99 Acres
            </label>

            <label
              htmlFor="acreage_100_plus"
              className="cursor-pointer flex items-center gap-2"
            >
              <input
                type="radio"
                name="acreage"
                className="cursor-pointer"
                id="acreage_100_plus"
              />
              100 + Acres
            </label>
          </div>
        </div>
      </div>

      {/* ------------------ ----------------------
       SECTION 6   ZONING
      ---------------------------------------------- */}
      <div className="flex  mt-2 gap-10">
        {/* zoning ------------ */}
        <div className="w-1/2">
          <FormSectionHeading className="bg-transparent px-0 text-darkBlue  ">
            <div className="flex  gap-1 items-center">
              <SubSectionHeading
                title="ZONING"
                className="bg-transparent border-2 border-darkBlue "
              />
              <span className="text-darkBlue text-[12px]">(40 characters)</span>
            </div>
          </FormSectionHeading>
          <InPutField />
        </div>

        {/* DIRECTION/MAIN CROSS STREETS */}
        <div className="w-1/2">
          <FormSectionHeading className="bg-transparent px-0  ">
            <div className="flex  gap-1 items-center">
              <SubSectionHeading
                title="DIRECTION/MAIN CROSS STREETS"
                className=""
              />
              <span className="text-darkBlue text-[12px]">(30 characters)</span>
            </div>
          </FormSectionHeading>
          <InPutField inputClass="mt-2" />
        </div>
      </div>

      {/* ------------------ ----------------------
      AMOUNT/DATES SECTION
      ---------------------------------------------- */}

      <div className="mt-10">
        <FormSectionHeading className="flex items-center justify-between">
          <p className="text-[13px]">AMOUNTS/DATES</p>
          <div className="flex gap-2 items-center">
            <span className="size-2 bg-white rotate-45"></span>
            <p className="!text-[12px] font-normal">
              One of Possession Date or Possession Remarks is Mandatory
            </p>
          </div>
        </FormSectionHeading>

        {/* --------------
        1st row
          ----------- */}
        <div className="flex  mt-2 border-b border-darkBlue">
          {/* -----LIST  PRICE---- */}
          <div>
            <FormSectionHeading className="bg-transparent px-0 ">
              <SubSectionHeading title="LIST PRICE" />
            </FormSectionHeading>

            <InPutField inputClass="!w-36" />
          </div>
          {/* -----TAXES---- */}
          <div>
            <FormSectionHeading className="bg-transparent px-0 ml-7 ">
              <SubSectionHeading title="TAXES" />
            </FormSectionHeading>

            <div className="flex items-center">
              <span className="text-lg -mb-2 text-blue-800 px-2">$</span>
              <InPutField boldBorder={true} />
            </div>
          </div>
          {/* -----TAX  YEAR---- */}
          <div className="ml-5">
            <FormSectionHeading className="bg-transparent px-0 ">
              <SubSectionHeading title="TAX YEAR" />
            </FormSectionHeading>

            <InPutField inputClass="!w-28" />
          </div>

          {/* -----ASSESSMENT ---- */}
          <div className="ml-5">
            <FormSectionHeading className="bg-transparent px-0  ">
              <SubSectionHeading
                title="ASSESSMENT"
                className="bg-transparent text-blue-900 border-2 border-blue-900"
              />
            </FormSectionHeading>

            <InPutField inputClass="!w-32 -mb-1 " boldBorder />
          </div>

          {/* -----ASSESSMENT YR ---- */}
          <div className="ml-5">
            <FormSectionHeading className="bg-transparent px-0  ">
              <SubSectionHeading
                title="ASSESSMENT YR"
                className="bg-transparent text-blue-900 border-2 border-blue-900"
              />
            </FormSectionHeading>

            <InPutField inputClass="!w-28 -mb-1" />
          </div>
          {/* -----CONTRACT COMMERCEMENT ---- */}
          <div className="ml-5 flex-shrink-0">
            <FormSectionHeading className="bg-transparent px-0  ">
              <SubSectionHeading title="CONTRACT COMMERCEMENT" />
            </FormSectionHeading>
            <div className=" border-b-2 border-blue-900 !pb-0">
              <DatePicker
                format="MM/DD/YYYY"
                className="mt-1 border-0 w-full p-0 font-medium"
              />
            </div>
            <p className="text-blue-900 font-medium text-[11px]">
              M M / D D / Y Y Y Y
            </p>
          </div>
        </div>

        {/* --------------
        2nd  row
          ----------- */}
        <div className="mt-2 flex gap-10 border-b border-darkBlue">
          {/* -----EXPIRY DATE ---- */}
          <div className="w-44 flex-shrink-0">
            <FormSectionHeading className="bg-transparent px-0  ">
              <SubSectionHeading title="EXPIRY DATE" />
            </FormSectionHeading>
            <div className=" border-b-2 border-blue-900 !pb-0">
              <DatePicker
                format="MM/DD/YYYY"
                className="mt-1 border-0 w-full p-0 font-medium"
              />
            </div>
            <p className="text-blue-900 font-medium text-[11px]">
              M M / D D / Y Y Y Y
            </p>
          </div>

          {/* -----POSSESSION DATE ---- */}
          <div className="w-44 flex-shrink-0">
            <FormSectionHeading className="bg-transparent px-0  ">
              <div className="flex  gap-1">
                <SubSectionHeading title="POSSESSION DATE" />
                <span className="size-2 bg-darkBlue rotate-45"></span>
              </div>
            </FormSectionHeading>
            <div className=" border-b-2 border-blue-900 !pb-0">
              <DatePicker
                format="MM/DD/YYYY"
                className="mt-1 border-0 w-full p-0 font-medium"
              />
            </div>
            <p className="text-blue-900 font-medium text-[11px]">
              M M / D D / Y Y Y Y
            </p>
          </div>

          {/* -----POSSESSION Remarks ---- */}
          <div className=" flex-shrink-0 flex-grow flex ">
            <div className="flex-shrink-0">
              <FormSectionHeading className="bg-transparent px-0  ">
                <div className="flex  gap-1">
                  <SubSectionHeading
                    title="POSSESSION REMARKS"
                    className="flex-shrink-0"
                  />
                  <span className="size-2 bg-darkBlue rotate-45 flex-shrink-0"></span>
                </div>
              </FormSectionHeading>
              <p className="text-darkBlue mt-2 font-medium">(14 characters)</p>
            </div>
            <div className=" flex-center flex-grow">
              <input
                type="text"
                value={"TBA"}
                className="!border-0 !border-b font-medium !rounded-none !border-darkBlue"
              />
            </div>
          </div>
        </div>

        {/* --------------
        3rd  row
          ----------- */}

        <div className="mt-2 flex gap-24 ">
          {/* -----HOLDOVER DAYS ---- */}
          <div className="flex-shrink-0">
            <FormSectionHeading className="bg-transparent px-0 ">
              <SubSectionHeading title="HOLDOVER DAYS" />
            </FormSectionHeading>

            <div className="w-20">
              <InPutField inputClass="!w-full" />
            </div>
          </div>

          {/* -----SELLER NAME ---- */}

          <div className="w-full ">
            <FormSectionHeading className="bg-transparent px-0  ">
              <div className="flex  gap-1 items-center">
                <SubSectionHeading title="SELLER NAME" />
                <p className="text-darkBlue text-[12px]">(70 characters)</p>
              </div>
            </FormSectionHeading>
            <input
              type="text"
              value={"Nadia Binte Nazrul (Under Power of Sale)"}
              className="!border-0 tracking-[0.1em] !text-[14px] !border-b font-medium !pb-0  !rounded-none !border-darkBlue"
            />
          </div>
        </div>
        {/* --------------
        4th  row
          ----------- */}
        <div className="mt-2 flex gap-2">
          <FormSectionHeading className="bg-transparent px-0  flex-shrink-0">
            <div className="flex items-center gap-2">
              <SubSectionHeading
                title="MORTGAGE COMMENTS"
                className="bg-transparent text-blue-900 border-2 border-blue-900"
              />
              <p className=" text-darkBlue text-[12px]">(140 characters)</p>
            </div>
          </FormSectionHeading>
          <div className="w-full">
            <textarea
              rows={2}
              className="py-0 border-t-0 border-x-0 rounded-none border-darkBlue resize-none !text-sm"
              id=""
            />
          </div>
        </div>
      </div>

      {/* ------------------ ----------------------
        Exterior section
       ---------------------------------------------- */}

      <div>
        <FormSectionHeading className="uppercase">EXterior</FormSectionHeading>

        <div className="grid grid-cols-5 ">
          {/* 1st col------------ */}
          <div className="pt-2 pr-2 border-r border-darkBlue">
            <div className="border-2 p-1 bg-darkBlue/5  border-darkBlue border-dashed ">
              <FormSectionHeading className="bg-transparent  px-0 mb-2 flex items-center gap-2 ">
                <SubSectionHeading title=" PROPERTY TYPE" />
                <span className="text-[12px] text-darkBlue">(check 1)</span>
              </FormSectionHeading>
              <div className="flex flex-col gap-1.5">
                {propertyTypes.slice(0, 11).map(({ id, label }) => (
                  <label
                    key={id}
                    htmlFor={id}
                    className="cursor-pointer flex items-center gap-2 my-auto"
                  >
                    <input type="radio" name="property_type" id={id} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 2nd col------------- */}
          <div className="p-2 border-r border-darkBlue">
            <div className="border-2 p-1 bg-darkBlue/5  border-darkBlue border-dashed ">
              <div className="flex flex-col gap-1.5">
                {propertyTypes.slice(11).map(({ id, label }) => (
                  <label
                    key={id}
                    htmlFor={id}
                    className="cursor-pointer flex items-center gap-2 my-auto"
                  >
                    <input type="radio" name="property_type" id={id} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            {/* link ---------- */}
            <div className="mt-2">
              <FormSectionHeading className="uppercase bg-transparent text-darkBlue p-0">
                <SubSectionHeading
                  title="LINK*"
                  className="bg-transparent border-2 border-darkBlue"
                />
              </FormSectionHeading>

              <div className="flex items-center gap-5 mt-2">
                <label
                  htmlFor="link_yes"
                  className="cursor-pointer flex items-center gap-2 my-auto"
                >
                  <input type="radio" name="link" id="link_yes" />
                  Yes
                </label>
                <label
                  htmlFor="link_no"
                  className="cursor-pointer flex items-center gap-2 my-auto"
                >
                  <input type="radio" name="link" id="link_no" />
                  No
                </label>
              </div>

              <p className="text-[12px] font-medium mt-1">
                * Mandatory if Detached
              </p>
            </div>

            <div className="mt-2 ">
              <FormSectionHeading className="uppercase bg-transparent text-darkBlue p-0">
                <SubSectionHeading
                  title="PARCEL OF TIED LAND (POTL)*"
                  className="bg-transparent border-2 text-[11px] border-darkBlue"
                />
              </FormSectionHeading>
              <label
                htmlFor="potl"
                className="cursor-pointer mt-2 flex items-center  gap-2 my-auto"
              >
                <input type="radio" name="potl" id={"potl"} />
                Yes
              </label>
              <p className="text-[12px] font-medium mt-2">
                * Mandatory if POTL
              </p>
            </div>
          </div>

          {/* 3rd col------------- */}
          <div className="p-2 border-r border-darkBlue">
            {/* POTL MONTHLY FEES*--------- */}
            <div>
              <FormSectionHeading className="uppercase bg-transparent text-darkBlue p-0">
                <SubSectionHeading
                  title="POTL MONTHLY FEES*"
                  className="bg-transparent border-2  border-darkBlue"
                />
              </FormSectionHeading>
              <div className="w-[90%]">
                <InPutField />
              </div>
              <p className="text-[12px] font-medium mt-1">
                * Mandatory if POTL
              </p>
            </div>

            {/* ASSIGNMENT---------- */}
            <div className="mt-2 flex gap-1">
              <FormSectionHeading className="uppercase bg-transparent text-darkBlue p-0">
                <SubSectionHeading
                  title="ASSIGNMENT"
                  className="bg-transparent border-2 border-darkBlue"
                />
              </FormSectionHeading>

              <div className="flex items-center gap-1 mt-1">
                <label
                  htmlFor="link_yes"
                  className="cursor-pointer flex items-center gap-2 my-auto"
                >
                  <input type="radio" name="link" id="link_yes" />
                  Yes
                </label>
                <label
                  htmlFor="link_no"
                  className="cursor-pointer flex items-center gap-2 my-auto"
                >
                  <input type="radio" name="link" id="link_no" />
                  No
                </label>
              </div>
            </div>

            {/* FRACTAL OWNERSHIP--------- */}
            <div className="mt-2 ">
              <FormSectionHeading className="uppercase bg-transparent text-darkBlue p-0">
                <SubSectionHeading
                  title="FRACTAL OWNERSHIP"
                  className="bg-transparent border-2 border-darkBlue"
                />
              </FormSectionHeading>

              <div className="flex items-center gap-5 mt-2">
                <label
                  htmlFor="link_yes"
                  className="cursor-pointer flex items-center gap-2 my-auto"
                >
                  <input type="radio" name="link" id="link_yes" />
                  Yes
                </label>
                <label
                  htmlFor="link_no"
                  className="cursor-pointer flex items-center gap-2 my-auto"
                >
                  <input type="radio" name="link" id="link_no" />
                  No
                </label>
              </div>
            </div>

            <div className=" mt-2">
              <FormSectionHeading className="bg-transparent px-0 mb-2  flex items-center gap-2">
                <SubSectionHeading title="STYLE" />{" "}
                <span className="text-[12px] text-darkBlue">(check 1)</span>
              </FormSectionHeading>
              <div className="flex flex-col gap-1.5">
                {styleOptions.slice(0, 4).map(({ id, label }) => (
                  <label
                    key={id}
                    htmlFor={id}
                    className="cursor-pointer flex items-center gap-2 my-auto"
                  >
                    <input type="radio" name="property_type" id={id} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          {/* 4th  col------------- */}
          <div className="p-2 border-r border-darkBlue">
            <div className="flex flex-col gap-1.5 ">
              {styleOptions.slice(4).map(({ id, label }) => (
                <label
                  key={id}
                  htmlFor={id}
                  className="cursor-pointer flex items-center gap-2 my-auto"
                >
                  <input type="radio" name="property_type" id={id} />
                  {label}
                </label>
              ))}
            </div>

            <div className=" mt-2">
              <FormSectionHeading className="bg-transparent px-0 mb-2  flex items-center gap-2">
                <SubSectionHeading title="EXTERIOR" />{" "}
                <span className="text-[12px] text-darkBlue">
                  (check up to 2)
                </span>
              </FormSectionHeading>
              <div className="flex flex-col gap-1">
                {exterior.slice(0, 1).map(({ id, label }) => (
                  <label
                    key={id}
                    htmlFor={id}
                    className="cursor-pointer flex items-center gap-2 my-auto"
                  >
                    <input type="checkbox" name="property_type" id={id} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          {/* 5th  col------------- */}
          <div className="p-2">
            <div className="flex flex-col gap-[5px] ">
              {exterior.slice(1).map(({ id, label }) => (
                <label
                  key={id}
                  htmlFor={id}
                  className="cursor-pointer flex items-center gap-2 my-auto"
                >
                  <input type="checkbox" name="property_type" id={id} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* page footer---seller initials ------------ */}
      <div className="flex justify-end gap-2 mt-8">
        <div className="flex gap-3 items-center">
          <p className="text-[a6px]">SELLER INITIALS</p>
          <div
            className="h-14  w-36    bg-gray-100"
            style={{ clipPath: "ellipse(50% 50% at 50% 49%)" }}
          ></div>
        </div>
        <div
          className="h-14  w-36    bg-gray-100"
          style={{ clipPath: "ellipse(50% 50% at 50% 49%)" }}
        ></div>

        <div className="mt-auto ml-3">
          <p>Page 1 of 3</p>
        </div>
      </div>
    </div>
  );
};

export default Page1;
