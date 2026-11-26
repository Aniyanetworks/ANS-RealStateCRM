import { Watch } from "react-loader-spinner";

const TableLoader = () => {
  return (
    <div className=" flex justify-center items-center h-[calc(100vh-20rem)]">
      <Watch
        visible={true}
        height="80"
        width="80"
        radius="48"
        color="#0b3b38"
        ariaLabel="watch-loading"
        wrapperStyle={{}}
        wrapperClass=""
      />
    </div>
  );
};

export default TableLoader;
