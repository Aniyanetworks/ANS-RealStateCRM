import Page1 from "../../components/dashboard/MLSForm/FreeholdLease/Page1";
// import Page2 from "../../components/dashboard/MLSForm/FreeholdLease/Page2";
import Page3 from "../../components/dashboard/MLSForm/FreeholdLease/Page3";

const FreeholdLease = () => {
  return (
    <div className="w-full max-w-[1500px] flex flex-col gap-10 p-20 mx-auto ">
      <Page1 />
      {/* <Page2 /> */}
      <Page3 />
    </div>
  );
};

export default FreeholdLease;
