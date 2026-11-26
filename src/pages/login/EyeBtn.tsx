import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

type TProps = {
  textType: boolean;
  setTextType: (text: boolean) => void;
};

const EyeBtn = ({ setTextType, textType }: TProps) => {
  return (
    <>
      {!textType ? (
        <AiOutlineEye onClick={() => setTextType(true)} className={iconClass} />
      ) : (
        <AiOutlineEyeInvisible
          onClick={() => setTextType(false)}
          className={iconClass}
        />
      )}
    </>
  );
};

export default EyeBtn;

const iconClass =
  "absolute top-1/2 right-2 -translate-y-1/2 text-xl cursor-pointer";
