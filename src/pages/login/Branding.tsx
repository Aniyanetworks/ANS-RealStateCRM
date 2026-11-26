import logo from "/logo.svg";

const Branding = () => {
  return (
    <div className="hidden  sm:w-[25%]  md:min-w-[350px] lg:w-[40%] sm:flex items-center justify-center px-6 2xl-px-20 bg-[#0b3b38]">
      <div className="flex flex-col gap-8">
        <div className=" flex justify-center">
          <div className=" flex flex-col items-center gap-2  ">
            <img src={logo} alt="" className="w-[60px]" />
            <h2 className=" tracking-widest text-xl playfair-display-sc-bold text-[#0f766e]">
              ANS REALSTATECRM
            </h2>
          </div>
        </div>
        <h2 className=" hidden md:block text-center  text-white">
          Welcome to ANS RealStateCRM's ANS RealStateCRM, your go-to resource for
          everything you need to succeed.
        </h2>
      </div>
    </div>
  );
};

export default Branding;
