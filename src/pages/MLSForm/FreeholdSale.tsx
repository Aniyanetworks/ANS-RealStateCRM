/* eslint-disable @typescript-eslint/no-explicit-any */
import Page1 from "../../components/dashboard/MLSForm/FreeholdSale/Page1";
import Page2 from "../../components/dashboard/MLSForm/FreeholdSale/Page2";
// import Page2 from "../../components/dashboard/MLSForm/FreeholdSale/Page2";
import Page3 from "../../components/dashboard/MLSForm/FreeholdSale/Page3";

const FreeholdSale = () => {
  return (
    <div className="w-[1200px] flex flex-col gap-10 p-20 mx-auto ">
      <Page1 />
      <Page2 />
      <Page3 />
    </div>
  );
};

export default FreeholdSale;
