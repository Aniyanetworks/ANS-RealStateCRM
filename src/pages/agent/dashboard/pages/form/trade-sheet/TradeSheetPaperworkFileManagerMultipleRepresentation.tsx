
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { Tabs } from "antd";
import { useEffect, useState } from "react";
import TableLoader from "../../../../../../components/loader/TableLoader";
import { useGetSpacificTradeSheetListDataQuery } from "../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice";
import { formatStringCamelCasecapitalize } from "../../../../../../utils/stringUtils";
import TradeSheetPaperworkFileManagerMultipleRepresentationComponent from "./TradeSheetPaperworkFileManagerMultipleRepresentationComponent";

const TradeSheetPaperworkFileManagerMultipleRepresentation = ({ uuid }) => {
  // const { uuid } = useParams<{ uuid?: string }>();
  const [multipleRepresentation, setMultipleRepresentation] = useState<string[]>([]); // Initialize as an empty array
  const [representation, setRepresentation] = useState<string | null>(null);

  // Fetch data using a query hook
  const { data: spacificTradeSheetLisData, isLoading } = useGetSpacificTradeSheetListDataQuery(uuid);

  useEffect(() => {
    if (spacificTradeSheetLisData?.data?.tradeSheetData?.multipleRepresentation) {
      // Split the comma-separated string into an array
      const multipleRepresentationArray = spacificTradeSheetLisData.data.tradeSheetData.multipleRepresentation.split(',');
      setMultipleRepresentation(multipleRepresentationArray);
      setRepresentation(multipleRepresentationArray[0]); // Set the first element as the default representation
    }
  }, [spacificTradeSheetLisData]); // Re-run when the data is updated

  if (isLoading) {
    return <TableLoader />;
  }

  return (
    <div className="">
      <div>
        <Tabs
          defaultActiveKey={representation || "2"} // Set default key based on first element or a fallback
          type="card"
          items={multipleRepresentation.map((tab) => {
            return {
              label: <span>{formatStringCamelCasecapitalize(tab)}</span>, // Capitalize string
              key: tab,
            };
          })}
          onChange={(key) => {
            // Set selected representation based on the tab key
            setRepresentation(key);
          }}
        />
      </div>
      <div>
        {/* Pass dynamic representation prop */}
        <TradeSheetPaperworkFileManagerMultipleRepresentationComponent dynamicRepresentation={representation} uuid={uuid} />
      </div>
    </div>
  );
};

export default TradeSheetPaperworkFileManagerMultipleRepresentation;
