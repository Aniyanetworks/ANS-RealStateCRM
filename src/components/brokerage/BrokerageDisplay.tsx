interface BrokerageDisplayProps {   
  brokerage: Brokerage;
}

interface Brokerage {
  address: string;
  streetAddress: string;
  state: {
    name: string;
  };
  city: {
    name: string;
  };
  postalZipCode: string;
  phoneNumber: string;
  faxNumber: string;
}

export const BrokerageDisplay = ({ brokerage }: BrokerageDisplayProps) => {
  return (
    <div className="grid grid-cols-2 gap-6 mt-6 p-6 bg-white shadow-sm rounded-md">
      <div className="flex items-center">
        <label className="font-semibold text-gray-700 mr-2">Address:</label>
        <p className="text-gray-600">{brokerage.address}</p>
      </div>
      {brokerage.streetAddress && (
        <div className="flex items-center">
          <label className="font-semibold text-gray-700 mr-2">Street Address:</label>
          <p className="text-gray-600">{brokerage.streetAddress}</p>
        </div>
      )}
      <div className="flex items-center">
        <label className="font-semibold text-gray-700 mr-2">Province:</label>
        <p className="text-gray-600">{brokerage.state.name}</p>
      </div>
      <div className="flex items-center">
        <label className="font-semibold text-gray-700 mr-2">City:</label>
        <p className="text-gray-600">{brokerage.city.name}</p>
      </div>
      <div className="flex items-center">
        <label className="font-semibold text-gray-700 mr-2">Postal Code:</label>
        <p className="text-gray-600">{brokerage.postalZipCode}</p>
      </div>
      <div className="flex items-center">
        <label className="font-semibold text-gray-700 mr-2">Phone:</label>
        <p className="text-gray-600">{brokerage.phoneNumber}</p>
      </div>
      {brokerage.faxNumber && (
        <div className="flex items-center">
          <label className="font-semibold text-gray-700 mr-2">Fax:</label>
          <p className="text-gray-600">{brokerage.faxNumber}</p>
        </div>
      )}
    </div>
  );
}; 