/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { RiDeleteBackLine } from "react-icons/ri";

type TProps = {
  btnClass?: string;
  onClick: (e?: any) => void;
  text: string;
  icon?: ReactNode;
  showIcon?: boolean;
};

const Dangerbtn = ({
  onClick,
  icon,
  text,
  btnClass,
  showIcon = false,
}: TProps) => {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();

        onClick();
      }}
      className={cn("cancel-btn flex-center   gap-2", btnClass)}
    >
      {icon ? icon : showIcon && <RiDeleteBackLine className="text-lg " />}{" "}
      {text}
    </button>
  );
};

export default Dangerbtn;
