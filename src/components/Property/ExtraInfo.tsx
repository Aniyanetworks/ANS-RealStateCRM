import React from "react";

type ExtraInfoProps = {
  extraInfo: {
    client_remarks: string;
    extras: string;
    inclusions: string;
    exclusions: string;
    rental_items: string;
    requirement: string;
    brokarage: string;
  };
};

const ExtraInfo: React.FC<ExtraInfoProps> = ({ extraInfo }) => {
  return (
    <div className="my-5 border-b pb-5">
      <div className="flex flex-col gap-1">
        <p className=" text-nowrap block font-semibold">Client Remks:</p>
        <textarea
          value={
            extraInfo?.client_remarks
              ? extraInfo?.client_remarks?.split(":")[1]
              : extraInfo?.client_remarks
          }
          name=" "
          className="border-none bg-transparent block text-wrap resize-none overflow-hidden"
          id=""
          placeholder="e.g. This lovely detached house is just a gem nestled "
          onInput={(e: any) => {
            e.target.style.height = "auto"; // Reset height
            e.target.style.height = `${e.target.scrollHeight}px`; // Set height to scrollHeight
          }}
          style={{ minHeight: "20px" }}
        ></textarea>
      </div>
      <div className="flex flex-col gap-1">
        <p className=" text-nowrap block font-semibold">Extras:</p>
        <textarea
          value={
            extraInfo?.extras
              ? extraInfo?.extras?.split(":")[1]
              : extraInfo?.extras
          }
          name=" "
          className="border-none bg-transparent block text-wrap  resize-none overflow-hidden"
          id=""
          placeholder="e.g. This lovely detached house is just a gem nestled "
          onInput={(e: any) => {
            e.target.style.height = "auto"; // Reset height
            e.target.style.height = `${e.target.scrollHeight}px`; // Set height to scrollHeight
          }}
          style={{ minHeight: "20px" }}
        ></textarea>
      </div>
      <div className="flex flex-col gap-1">
        <p className=" text-nowrap block font-semibold">Inclusions:</p>
        <textarea
          value={
            extraInfo?.inclusions
              ? extraInfo?.inclusions?.split(":")[1]
              : extraInfo?.inclusions
          }
          name=" "
          className="border-none bg-transparent block text-wrap  resize-none overflow-hidden"
          id=""
          placeholder="e.g. This lovely detached house is just a gem nestled "
          onInput={(e: any) => {
            e.target.style.height = "auto"; // Reset height
            e.target.style.height = `${e.target.scrollHeight}px`; // Set height to scrollHeight
          }}
          style={{ minHeight: "20px" }}
        ></textarea>
      </div>
      <div className="flex flex-col gap-1">
        <p className=" text-nowrap block font-semibold">Exclusions:</p>
        <textarea
          value={
            extraInfo?.exclusions
              ? extraInfo?.exclusions?.split(":")[1]
              : extraInfo?.exclusions
          }
          name=" "
          className="border-none bg-transparent block text-wrap  resize-none overflow-hidden"
          id=""
          placeholder="e.g. This lovely detached house is just a gem nestled "
          onInput={(e: any) => {
            e.target.style.height = "auto"; // Reset height
            e.target.style.height = `${e.target.scrollHeight}px`; // Set height to scrollHeight
          }}
          style={{ minHeight: "20px" }}
        ></textarea>
      </div>
      <div className="flex items-center gap-1">
        <p className=" text-nowrap block font-semibold">Rental Items:</p>
        <input
          value={
            extraInfo?.rental_items
              ? extraInfo?.rental_items?.split(":")[1]
              : extraInfo?.rental_items
          }
          type="text"
          name=""
          id=""
          placeholder="e.g. Hot Water Tank"
          className="border-none bg-transparent block text-wrap"
        />
      </div>
      <div className="flex items-center gap-1">
        <p className=" text-nowrap block font-semibold">
          Showing Requirements:
        </p>
        <input
          value={
            extraInfo?.requirement
              ? extraInfo?.requirement?.split(":")[1]
              : extraInfo?.requirement
          }
          type="text"
          name=""
          id=""
          placeholder="e.g. Lockbox"
          className="border-none bg-transparent block"
        />
      </div>
      <div className="flex flex-col gap-1">
        <p className=" text-nowrap block font-semibold">Brkage Remks:</p>
        <textarea
          value={
            extraInfo?.brokarage
              ? extraInfo?.brokarage?.split(":")[1]
              : extraInfo?.brokarage
          }
          name=" "
          className="border-none bg-transparent block text-wrap resize-none overflow-hidden"
          id=""
          placeholder="e.g. Easy Showings with LB. Offers Anytime.  "
          onInput={(e: any) => {
            e.target.style.height = "auto"; // Reset height
            e.target.style.height = `${e.target.scrollHeight}px`; // Set height to scrollHeight
          }}
          style={{ minHeight: "20px" }}
        ></textarea>
      </div>
    </div>
  );
};

export default ExtraInfo;
