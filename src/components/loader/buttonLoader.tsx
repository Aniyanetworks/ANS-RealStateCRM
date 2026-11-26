import { Oval } from "react-loader-spinner";

const ButtonLoader = () => {
  return (
    <div className=" flex justify-center">
      <Oval
        visible={true}
        height="20"
        width="20"
        color="#fff"
        ariaLabel="oval-loading"
        wrapperStyle={{}}
        wrapperClass=""
      />
    </div>
  );
};

export default ButtonLoader;
