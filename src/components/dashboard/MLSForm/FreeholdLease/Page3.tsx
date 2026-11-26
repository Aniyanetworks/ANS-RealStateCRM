import { DatePicker } from "antd";
import {
  FormSectionHeading,
  InPutField,
  SubSectionHeading,
} from "../shared/FormHelpers";

const Page3 = () => {
  return (
    <div className="bg-white px-12 py-8 text-black">
      <FormSectionHeading bgBlack>
        <p>
          COMMENTS <span className="!text-[12px]">(* Refer to form 823)</span>
        </p>
      </FormSectionHeading>

      {/* -------- is cottage/rural ------------- */}
      <div className="flex  border-y  items-center !border-black  mt-1 justify-between ">
        <p className="font-semibold text-[13px] uppercase">
          is cottage /rural/waterfront - mls{" "}
          <span className="text-xl">&reg;</span> data information form (form
          295) part of this agreement?
        </p>

        <div className="flex gap-5  ">
          <label
            htmlFor="affirmative"
            className="cursor-pointer flex items-center gap-2  my-auto"
          >
            <input
              type="radio"
              name="is_cottage_rural_waterfront"
              id="affirmative"
            />
            Yes
          </label>
          <label
            htmlFor="nagative"
            className="cursor-pointer flex items-center gap-2  my-auto"
          >
            <input
              type="radio"
              name="is_cottage_rural_waterfront"
              id="nagative"
            />
            No
          </label>
        </div>
      </div>

      {/* --------------------
        REMARKS FOR CLIENTS
        --------------------------------- */}
      <div className="mt-3 flex flex-col ">
        <FormSectionHeading className="bg-transparent p-0 text-black">
          <div className="flex items-center gap-3">
            <SubSectionHeading
              title="REMARKS FOR CLIENTS"
              className="bg-transparent  border-2 !border-black"
            />
            <span className="text-[12px] font-normal">
              (1000 character max)
            </span>
            <span className="text-[12px] font-normal">
              1. Appear in the rokerage Full, Client Full and Flyer Reports in
              TorontoMLS and are Published on the Internet
            </span>
          </div>
        </FormSectionHeading>
        <div className="flex  gap-5 items-center">
          <p className="font-semibold text-[13px]  uppercase mt-1">
            2. remarks must relate directly to property.
          </p>
          <p className="font-semibold text-[13px] uppercase mt-1">
            3. DISCOLSE POTL DETAILS & POTL MONTHLY FEES IN THE FIELD.
          </p>
        </div>

        <textarea
          className="resize-none font-medium leading-5 focus:border-[#70707034] text-black text-[14px] py-0"
          rows={7}
          maxLength={1000}
        ></textarea>
      </div>

      {/* --------------------
        extras
        --------------------------------- */}
      <div className="mt-3 flex flex-col ">
        <FormSectionHeading className="bg-transparent p-0 text-black">
          <div className="flex items-center gap-3">
            <SubSectionHeading
              title="EXTRAS"
              className="bg-transparent  border-2 !border-black"
            />
            <span className="text-[12px] font-normal">(240 character max)</span>
            <span className="text-[12px] font-normal">
              1. Appear in the rokerage Full, Client Full and Flyer Reports in
              TorontoMLS and are Published on the Internet
            </span>
          </div>
        </FormSectionHeading>
        <p className="font-semibold uppercase mt-1 text-[13px]">
          2. remarks must relate directly to property.
        </p>

        <textarea
          className="resize-none font-medium leading-5 focus:border-[#70707034] text-black text-[14px] py-0"
          rows={2}
          maxLength={240}
        ></textarea>
      </div>
      {/* --------------------
        INCLUSIONS
        --------------------------------- */}
      <div className="mt-3 flex flex-col gap-2">
        <FormSectionHeading className="bg-transparent p-0 text-black">
          <div className="flex items-center gap-3">
            <SubSectionHeading
              title="INCLUSIONS*"
              className="bg-transparent  border-2 !border-black"
            />
            <span className="text-[12px] font-normal">(250 character max)</span>
          </div>
        </FormSectionHeading>

        <textarea
          className="resize-none font-medium leading-5 focus:border-[#70707034] text-black text-[14px] py-0"
          rows={2}
          maxLength={250}
        ></textarea>
      </div>

      {/* --------------------
        EXCLUSIONS
        --------------------------------- */}
      <div className="mt-3 flex flex-col gap-2">
        <FormSectionHeading className="bg-transparent p-0 text-black">
          <div className="flex items-center gap-3">
            <SubSectionHeading
              title="EXCLUSIONS*"
              className="bg-transparent  border-2 !border-black"
            />
            <span className="text-[12px] font-normal">(250 character max)</span>
          </div>
        </FormSectionHeading>

        <textarea
          className="resize-none font-medium leading-5 focus:border-[#70707034] text-black text-[14px] py-0"
          rows={2}
          maxLength={250}
        ></textarea>
      </div>

      {/* --------------------
        RENTAL ITEMS
        --------------------------------- */}
      <div className="mt-3 flex flex-col gap-2">
        <FormSectionHeading className="bg-transparent p-0 text-black">
          <div className="flex items-center gap-3">
            <SubSectionHeading
              title="RENTAL ITEMS*"
              className="bg-transparent  border-2 !border-black"
            />
            <span className="text-[12px] font-normal">(250 character max)</span>
          </div>
        </FormSectionHeading>

        <textarea
          className="resize-none font-medium leading-5 focus:border-[#70707034] text-black text-[14px] py-0"
          rows={2}
          maxLength={250}
        ></textarea>
      </div>

      {/* --------------------
        REMARKS FOR BROKERAGE
        --------------------------------- */}
      <div className="mt-3 flex flex-col ">
        <FormSectionHeading className="bg-transparent p-0 text-black">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <SubSectionHeading
                title="REMARKS FOR BROKERAGE"
                className="bg-transparent  border-2 !border-black"
              />
            </div>
            <span className="text-[12px] font-normal flex-shrink-0">
              (280 character max)
            </span>
            <span className="text-[10.5px] font-normal">
              1. Appear in the Brokerage Full Report in TorontoMLS and not on
              the Client Reports and are not Published on the Internet.
            </span>
          </div>
        </FormSectionHeading>
        <p className="font-semibold text-[13px] uppercase mt-1">
          2. ADDITIONAL CONTACT INFORMATION IS ALLOWED ONLY IN THIS FIELD.
        </p>

        <textarea
          className="resize-none font-medium leading-5 focus:border-[#70707034] text-black text-[14px] py-0"
          rows={2}
          maxLength={280}
        ></textarea>
      </div>

      {/* ============
        other
      ==============*/}
      <div className="mt-5">
        <FormSectionHeading bgBlack className="uppercase">
          OTHER
        </FormSectionHeading>
        {/* -------------
        section 1
        ---------------- */}
        <div className="flex gap-5 mt-2">
          <div className=" w-[56%]">
            <div className="border-2 border-dashed  !border-black bg-darkBlue/5 p-2">
              {/* LISTING BROKERAGE----- */}
              <div>
                <FormSectionHeading className="bg-transparent  px-0">
                  <SubSectionHeading title="LISTING BROKERAGE" bgOrange />
                </FormSectionHeading>
                <InPutField inputClass="bg-transparent" blackBorder />
              </div>

              {/* BROKER 1/ SALESPERSON 1----- */}
              <div className="mt-2">
                <FormSectionHeading className="bg-transparent mt-1 px-0">
                  <SubSectionHeading
                    title="  BROKER 1/ SALESPERSON 1"
                    bgOrange
                  />
                </FormSectionHeading>
                <div className="w-[90%]">
                  <InPutField inputClass="bg-transparent" blackBorder />
                </div>
              </div>
            </div>
            {/* BROKER 2/ SALESPERSON 2----- */}
            <div className="mt-2">
              <FormSectionHeading className="bg-transparent  px-0">
                <SubSectionHeading title="BROKER 2/ SALESPERSON 2" bgOrange />
              </FormSectionHeading>
              <div className="w-[90%] ">
                <InPutField inputClass="bg-transparent" blackBorder />
              </div>
            </div>
          </div>

          {/* right side */}
          <div className="flex-grow">
            {/* L.B. PHONE----- */}
            <div className="flex items-center gap-5 w-full  ">
              <FormSectionHeading className="bg-transparent flex-shrink-0  px-0 !m-0">
                <SubSectionHeading
                  title="L.B. PHONE"
                  bgOrange
                  className="!text-[12px]"
                />
              </FormSectionHeading>
              <div className="w-full -mt-2">
                <InPutField inputClass="bg-transparent " blackBorder />
              </div>
            </div>
            {/* L.B. FAX NO.----- */}
            <div className="flex items-center gap-5 w-full mt-3 ">
              <FormSectionHeading className="bg-transparent flex-shrink-0  px-0 !m-0">
                <SubSectionHeading
                  title="     L.B. FAX NO."
                  bgOrange
                  className="!text-[12px]"
                />
              </FormSectionHeading>
              <div className="w-full -mt-2">
                <InPutField inputClass="bg-transparent " blackBorder />
              </div>
            </div>
            {/*   BROKER 1/ SALESPERSON 1 PHONE----- */}
            <div className=" gap-5 w-full mt-3 ">
              <FormSectionHeading className="bg-transparent flex-shrink-0  px-0 !m-0">
                <SubSectionHeading
                  title="BROKER 1/ SALESPERSON 1 PHONE"
                  bgOrange
                  className="!text-[12px]"
                />
              </FormSectionHeading>
              <div className="w-[70%] ">
                <InPutField inputClass="bg-transparent " blackBorder />
              </div>
            </div>
            {/*   BROKER 2/ SALESPERSON 2 PHONE----- */}
            <div className=" gap-5 w-full mt-3.5 ">
              <FormSectionHeading className="bg-transparent flex-shrink-0  px-0 !m-0">
                <span className="border-2  !border-black text-black px-1 ">
                  BROKER 2/ SALESPERSON 2 PHONE
                </span>
              </FormSectionHeading>
              <div className="w-[70%] ">
                <InPutField inputClass="bg-transparent " blackBorder />
              </div>
            </div>
          </div>
        </div>

        {/*  COMMISSION TO CO-OPERATIANG BROKERAGE----- */}
        <div className="mt-2">
          <FormSectionHeading className="bg-transparent mt-1 px-0">
            <SubSectionHeading
              title=" COMMISSION TO CO-OPERATIANG BROKERAGE"
              bgOrange
              className="!text-[12px]"
            />
          </FormSectionHeading>
          <div className="w-[80%] ">
            <InPutField inputClass="bg-transparent" blackBorder />
          </div>
        </div>
        {/* --------------- 
        spis section
        --------------*/}
        <div className="mt-2 flex gap-10">
          {/* spis ----------- */}
          <div>
            <FormSectionHeading className="bg-transparent  px-0">
              <SubSectionHeading
                title=" SPIS"
                bgOrange
                className="!text-[12px]"
              />
            </FormSectionHeading>

            <div className="flex gap-3 mt-3  ">
              <label
                htmlFor="spis_affirmative"
                className="cursor-pointer flex items-center gap-2  my-auto"
              >
                <input type="radio" name="spis" id="spis_affirmative" />
                Yes
              </label>
              <label
                htmlFor="spis_nagative"
                className="cursor-pointer flex items-center gap-2  my-auto"
              >
                <input type="radio" name="spis" id="spis_nagative" />
                No
              </label>
            </div>
          </div>

          {/* ENERGY CERTIFICATION----------- */}
          <div>
            <FormSectionHeading className="bg-transparent  px-0">
              <span className="border-2 bg-transparent text-black !border-black px-1">
                ENERGY CERTIFICATION
              </span>
            </FormSectionHeading>

            <div className="flex gap-3 mt-3 ">
              <label
                htmlFor="energy_certication_affirmative"
                className="cursor-pointer flex items-center gap-2  my-auto"
              >
                <input
                  type="radio"
                  name="energy_certication"
                  id="energy_certication_affirmative"
                />
                Yes
              </label>
              <label
                htmlFor="energy_certication_nagative"
                className="cursor-pointer flex items-center gap-2  my-auto"
              >
                <input
                  type="radio"
                  name="energy_certication"
                  id="energy_certication_nagative"
                />
                No
              </label>
            </div>
          </div>

          {/*  CERTIFICATION LEVEL----------- */}
          <div className="w-96">
            <FormSectionHeading className="bg-transparent  px-0">
              <div className="flex items-center gap-2">
                <span className="border-2 bg-transparent text-black !border-black px-1">
                  CERTIFICATION LEVEL
                </span>
                <span className="text-[12px] text-black">(25 characters)</span>
              </div>
            </FormSectionHeading>

            <InPutField blackBorder />
          </div>
        </div>
        {/* --------------- 
        GREEN PROPERTY INFORMATION STATEMENT
        --------------*/}
        <div className="mt-3 flex gap-10">
          {/* GREEN PROPERTY INFORMATION STATEMENT----------- */}

          <div>
            <FormSectionHeading className="bg-transparent  px-0">
              <span className="border-2 bg-transparent text-black !border-black px-1">
                GREEN PROPERTY INFORMATION STATEMENT
              </span>
            </FormSectionHeading>

            <div className="flex gap-3 mt-2 ">
              <label
                htmlFor="green_property_affirmative"
                className="cursor-pointer flex items-center gap-2  my-auto"
              >
                <input
                  type="radio"
                  name="green_property"
                  id="green_property_affirmative"
                />
                Yes
              </label>
              <label
                htmlFor="green_property_nagative"
                className="cursor-pointer flex items-center gap-2  my-auto"
              >
                <input
                  type="radio"
                  name="green_property"
                  id="green_property_nagative"
                />
                No
              </label>
            </div>
          </div>

          {/* DISTRIBUTE TO INTERNET----------- */}
          <div>
            <FormSectionHeading className="bg-transparent  px-0">
              <SubSectionHeading
                title=" DISTRIBUTE TO INTERNET"
                bgOrange
                className="!text-[12px]"
              />
            </FormSectionHeading>

            <div className="flex gap-3 mt-2 ">
              <label
                htmlFor="distribute_internet_affirmative"
                className="cursor-pointer flex items-center gap-2  my-auto"
              >
                <input
                  type="radio"
                  name="distribute_internet"
                  id="distribute_internet_affirmative"
                />
                Yes
              </label>
              <label
                htmlFor="distribute_internet_nagative"
                className="cursor-pointer flex items-center gap-2  my-auto"
              >
                <input
                  type="radio"
                  name="distribute_internet"
                  id="distribute_internet_nagative"
                />
                No
              </label>
            </div>
          </div>
          {/* DISPLAY ADDRESS ON INTERNET----------- */}
          <div>
            <FormSectionHeading className="bg-transparent  px-0">
              <SubSectionHeading
                title="   DISPLAY ADDRESS ON INTERNET"
                bgOrange
                className="!text-[12px]"
              />
            </FormSectionHeading>

            <div className="flex gap-3 mt-2 ">
              <label
                htmlFor="display_on_internet_affirmative"
                className="cursor-pointer flex items-center gap-2  my-auto"
              >
                <input
                  type="radio"
                  name="display_on_internet"
                  id="display_on_internet_affirmative"
                />
                Yes
              </label>
              <label
                htmlFor="display_on_internet_nagative"
                className="cursor-pointer flex items-center gap-2  my-auto"
              >
                <input
                  type="radio"
                  name="display_on_internet"
                  id="display_on_internet_nagative"
                />
                No
              </label>
            </div>
          </div>
          {/* ENERGY CERTIFICATION----------- */}
          <div>
            <FormSectionHeading className="bg-transparent  px-0">
              <SubSectionHeading
                title=" DISTRIBUTE TO DDF/IDX"
                bgOrange
                className="!text-[12px]"
              />
            </FormSectionHeading>

            <div className="flex gap-3 mt-2 ">
              <label
                htmlFor="distribute_to_ddf_affirmative"
                className="cursor-pointer flex items-center gap-2  my-auto"
              >
                <input
                  type="radio"
                  name="distribute_to_ddf"
                  id="distribute_to_ddf_affirmative"
                />
                Yes
              </label>
              <label
                htmlFor="distribute_to_ddf_nagative"
                className="cursor-pointer flex items-center gap-2  my-auto"
              >
                <input
                  type="radio"
                  name="distribute_to_ddf"
                  id="distribute_to_ddf_nagative"
                />
                No
              </label>
            </div>
          </div>
        </div>
        {/* --------------- 
        PERMISSION TO CONTRACT LG TO ADVERTISE section
        --------------*/}
        <div className="mt-3 flex gap-10">
          {/*  PERMISSION TO CONTRACT LG TO ADVERTISE ----------- */}
          <div>
            <FormSectionHeading className="bg-transparent  px-0">
              <SubSectionHeading
                title="    PERMISSION TO CONTRACT LB TO ADVERTISE"
                bgOrange
                className="!text-[12px]"
              />
            </FormSectionHeading>

            <div className="flex gap-3 mt-3  ">
              <label
                htmlFor="permission_contract_to_advertise_affirmative"
                className="cursor-pointer flex items-center gap-2  my-auto"
              >
                <input
                  type="radio"
                  name="permission_contract_to_advertise"
                  id="permission_contract_to_advertise_affirmative"
                />
                Yes
              </label>
              <label
                htmlFor="permission_contract_to_advertise_nagative"
                className="cursor-pointer flex items-center gap-2  my-auto"
              >
                <input
                  type="radio"
                  name="permission_contract_to_advertise"
                  id="permission_contract_to_advertise_nagative"
                />
                No
              </label>
            </div>
          </div>

          {/*   OPEN HOUSE DATE----------- */}
          <div>
            <FormSectionHeading className="bg-transparent  px-0">
              <span className="border-2 bg-transparent text-black !border-black px-1">
                OPEN HOUSE DATE
              </span>
            </FormSectionHeading>

            <div className=" border-b-2 pt-1 border-black !pb-0">
              <DatePicker
                format="MM/DD/YYYY"
                className="mt-1 border-0 w-full p-0 font-medium"
              />
            </div>
          </div>

          {/*  FROM----------- */}
          <div className="">
            <FormSectionHeading className="bg-transparent  px-0">
              <div className="flex items-center gap-2">
                <span className="border-2 bg-transparent text-black !border-black px-1">
                  FROM
                </span>
              </div>
            </FormSectionHeading>

            <InPutField blackBorder />
          </div>
          {/*  TO----------- */}
          <div className="">
            <FormSectionHeading className="bg-transparent  px-0">
              <div className="flex items-center gap-2">
                <span className="border-2 bg-transparent text-black !border-black px-1">
                  TO
                </span>
              </div>
            </FormSectionHeading>

            <InPutField />
          </div>
        </div>
        {/*  OPEN HOUSE NOTES----------- */}
        <div className="mt-3">
          <FormSectionHeading className="bg-transparent  px-0">
            <div className="flex items-center gap-2">
              <span className="border-2 bg-transparent text-black !border-black px-1">
                OPEN HOUSE NOTES
              </span>
            </div>
          </FormSectionHeading>

          <div className="w-[40%]">
            <InPutField />
          </div>
        </div>
        {/*  APPOINTMENTS----------- */}
        <div className="mt-3">
          <FormSectionHeading className="bg-transparent  px-0">
            <div className="flex items-center gap-2">
              <span className="border-2 bg-transparent text-black !border-black px-1">
                APPOINTMENTS
              </span>
            </div>
          </FormSectionHeading>

          <div className="w-[70%]">
            <InPutField />
          </div>
        </div>
        {/* -------------
        OCCUPANCY/CONTACT AFTER EXPIRED
        -----------*/}
        <div className="mt-3 flex items-center gap-16">
          <div className="flex items-center gap-5">
            {/* OCCUPANCY ----------- */}
            <FormSectionHeading className="bg-transparent flex gap-2 items-center px-0">
              <SubSectionHeading
                title="OCCUPANCY"
                bgOrange
                className="!text-[12px]"
              />
              <span className="text-[13px] text-black">(check 1)</span>
            </FormSectionHeading>

            <div className="flex gap-3">
              <label
                htmlFor="occupancy_owner_tenant"
                className="cursor-pointer flex items-center gap-2 my-auto"
              >
                <input
                  type="radio"
                  name="occupancy"
                  id="occupancy_owner_tenant"
                />
                Owner/Tenant
              </label>
              <label
                htmlFor="occupancy_owner"
                className="cursor-pointer flex items-center gap-2 my-auto"
              >
                <input type="radio" name="occupancy" id="occupancy_owner" />
                Owner
              </label>
              <label
                htmlFor="occupancy_partial"
                className="cursor-pointer flex items-center gap-2 my-auto"
              >
                <input type="radio" name="occupancy" id="occupancy_partial" />
                Partial
              </label>
              <label
                htmlFor="occupancy_tenant"
                className="cursor-pointer flex items-center gap-2 my-auto"
              >
                <input type="radio" name="occupancy" id="occupancy_tenant" />
                Tenant
              </label>
              <label
                htmlFor="occupancy_vacant"
                className="cursor-pointer flex items-center gap-2 my-auto"
              >
                <input type="radio" name="occupancy" id="occupancy_vacant" />
                Vacant
              </label>
            </div>
          </div>
          <div className="flex items-center gap-5">
            {/* CONTACT AFTER EXPIRED ----------- */}
            <FormSectionHeading className="bg-transparent px-0">
              <SubSectionHeading
                title="CONTACT AFTER EXPIRED"
                bgOrange
                className="!text-[12px]"
              />
            </FormSectionHeading>

            <div className="flex gap-3">
              <label
                htmlFor="contact_after_expired_yes"
                className="cursor-pointer flex items-center gap-2 my-auto"
              >
                <input
                  type="radio"
                  name="contact_after_expired"
                  id="contact_after_expired_yes"
                />
                Yes
              </label>
              <label
                htmlFor="contact_after_expired_no"
                className="cursor-pointer flex items-center gap-2 my-auto"
              >
                <input
                  type="radio"
                  name="contact_after_expired"
                  id="contact_after_expired_no"
                />
                No
              </label>
            </div>
          </div>
        </div>

        {/* --------------  VIRTUAL TOUR URL */}
        <div className="mt-3 flex gap-5">
          <FormSectionHeading className="bg-transparent flex-shrink-0  px-0">
            <div className="flex items-center gap-2 text-black">
              <span className="border-2 bg-transparent  !border-black px-1">
                VIRTUAL TOUR URL
              </span>
              <span className="text-[12px]">(100 characters)</span>
            </div>
          </FormSectionHeading>
          <input
            type="text"
            maxLength={100}
            className="!border-b !p-0 !!border-black !rounded-none !border-0"
          />
        </div>
        {/* Photo options ----------- */}
        <div className="mt-3 border-b pb-1 !border-black">
          <FormSectionHeading className="bg-transparent px-0">
            <SubSectionHeading
              title="PHOTO OPTIONS"
              bgOrange
              className="!text-[12px]"
            />
          </FormSectionHeading>

          <div className="flex gap-3 mt-2">
            <label
              htmlFor="photo_library"
              className="cursor-pointer flex items-center gap-2 my-auto"
            >
              <input type="radio" name="photo_option" id="photo_library" />
              Use photo from photo library
            </label>
            <label
              htmlFor="upload_photo"
              className="cursor-pointer flex items-center gap-2 my-auto"
            >
              <input type="radio" name="photo_option" id="upload_photo" />
              Upload your own photo(s)
            </label>
            <label
              htmlFor="no_photo"
              className="cursor-pointer flex items-center gap-2 my-auto"
            >
              <input type="radio" name="photo_option" id="no_photo" />
              No photo for this listing
            </label>
          </div>
        </div>

        {/* ---------------
        signature
        ------------*/}
        <div className="mt-3 flex ">
          <p className="w-1/3 text-[14px] leading-5 ">
            LANDLORD HEREBY ACKNOWLEDGES HAVING RECIEVED A COPY OF PART 2 OF 2
            OF THE LISTING AGREEMENT .
          </p>
          <div className="flex gap-5 items-center w-2/3">
            <div className=" flex-grow ">
              <div className="flex flex-grow">
                {/* signature-------- */}
                <div className="flex flex-grow">
                  <label htmlFor="" className="  !mb-0 ">
                    <p className="!text-[13px] -mb-3"> SIGNATURE</p>
                  </label>
                  <input
                    type="text"
                    className="!border-black !border-0 !border-b   !rounded-none !p-0 !m-0"
                  />
                </div>

                {/* date -------- */}
                <div className="flex !w-56 flex-shrink-0">
                  <label htmlFor="" className="  !mb-0 ">
                    <p className="-mb-3 !text-[13px]">Date</p>
                  </label>

                  <div className=" border-b !border-black !pb-0 -mt-1 flex-grow">
                    <DatePicker
                      format="MM/DD/YYYY"
                      placeholder=""
                      className=" border-0 w-full p-0 font-medium"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-grow mt-3">
                {/* signature-------- */}
                <div className="flex flex-grow">
                  <label htmlFor="" className="  !mb-0 ">
                    <p className="-mb-3 !text-[13px]"> SIGNATURE</p>
                  </label>
                  <input
                    type="text"
                    className="!border-black !border-0 !border-b   !rounded-none !p-0 !m-0"
                  />
                </div>

                {/* date -------- */}
                <div className="flex !w-56 flex-shrink-0">
                  <label htmlFor="" className="  !mb-0 ">
                    <p className=" !text-[13px] -mb-3">Date</p>
                  </label>

                  <div className=" border-b border-black !pb-0 -mt-1 flex-grow">
                    <DatePicker
                      format="MM/DD/YYYY"
                      placeholder=""
                      className=" border-0 w-full p-0 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-right mt-5">Page 3 of 3</p>
      </div>
    </div>
  );
};

export default Page3;
