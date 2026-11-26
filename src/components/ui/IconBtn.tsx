/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from "react";
import { cn } from "../../utils/cn";

type TProps = {
  btnClass?: string;
  onClick: (e?: any) => void;
  text: string;
  icon?: ReactNode;
};
const IconBtn = ({ onClick, icon, text, btnClass }: TProps) => {
  return (
    <button
      onClick={onClick}
      className={cn("primary-btn-ghost flex items-center gap-2 ", btnClass)}
    >
      {icon} {text}
    </button>
  );
};

export default IconBtn;
