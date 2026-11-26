import TableLoader from "./TableLoader";

const BlurLoader = () => {
  return (
    <div className="relative">
      {/* Background content */}
      <div className="absolute inset-0 bg-gray-100">
        {/* Your table or other content here */}
        <p>Your table content goes here</p>
      </div>

      {/* Loader */}
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-60 backdrop-blur-md z-50">
        <TableLoader />
      </div>
    </div>
  );
};

export default BlurLoader;
