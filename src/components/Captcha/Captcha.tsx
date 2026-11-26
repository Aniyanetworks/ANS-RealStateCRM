import { ReactNode } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type TProps = {
  firstValue: number;
  secondValue: number;
  operator: string;
  children: ReactNode;
};
const Captcha = ({
  firstValue,
  secondValue,
  operator,

  children,
}: TProps) => {
  return (
    <div>
      <label className="block mb-2 text-[15px]">Solve the equation</label>

      <div className="flex items-center justify-between gap-5">
        <input
          type="number"
          className="appearance-none text-center max-w-20"
          readOnly
          value={firstValue}
        />
        <span className="text-xl font-medium">{operator}</span>

        <input
          type="text"
          className="appearance-none text-center max-w-20"
          readOnly
          value={secondValue}
        />

        <span className="text-xl font-medium">=</span>

        {children}
      </div>
    </div>
  );
};

export default Captcha;
