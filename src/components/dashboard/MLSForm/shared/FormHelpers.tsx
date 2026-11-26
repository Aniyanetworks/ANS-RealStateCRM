import { TFormSectionHeading } from "../../../../types/FreeHoldSale";
import { cn } from "../../../../utils/cn";

// for the blue and pink headers-----------------------
export const FormSectionHeading = ({
  className,
  children,
  bgBlack = false,
}: TFormSectionHeading) => (
  <p
    className={cn(
      "bg-darkBlue text-white font-medium text-[12px]  px-3 ",
      className,
      {
        "bg-black": bgBlack,
      }
    )}
  >
    {children}
  </p>
);

// pink header-----------------------
export const SubSectionHeading = ({
  title,
  className,
  bgOrange = false,
}: {
  title: string;
  className?: string;
  bgOrange?: boolean;
}) => {
  return (
    <p
      className={cn("bg-pink-500 px-1 text-[11px] inline-block", className, {
        "bg-orange-600": bgOrange,
      })}
    >
      {title}
    </p>
  );
};

// input field-------------------
export const InPutField = ({
  inputClass,
  boldBorder = false,
  blackBorder = false,
}: {
  inputClass?: string;
  boldBorder?: boolean;
  blackBorder?: boolean;
}) => {
  return (
    <div className="relative">
      <input
        type="text"
        className={cn(
          "!rounded-none !tracking-wider !pb-1 !pt-0 !text-[15px] !border-0 mt-1 font-medium ",
          inputClass
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute h-4 w-full border border-t-0 bottom-0 border-darkBlue ",
          {
            "border-2 border-t-0": boldBorder,
            "border-black": blackBorder,
          }
        )}
      ></div>
    </div>
  );
};
