
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { Tabs } from "antd";
import { useEffect, useState } from "react";
import TableLoader from "../../../../../../components/loader/TableLoader";
import { useGetSpacificTradeSheetListDataQuery } from "../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice";
import { formatStringCamelCasecapitalize } from "../../../../../../utils/stringUtils";
import TradeSheetPaperworkFileManagerMultipleRepresentationComponent from "./TradeSheetPaperworkFileManagerMultipleRepresentationComponent";

const TradeSheetPaperworkFileManagerMultipleRepresentation = ({ uuid }) => {
  const [multipleRepresentation, setMultipleRepresentation] = useState<string[]>([]);
  const [representation, setRepresentation] = useState<string | null>(null);

  const { data: spacificTradeSheetLisData, isLoading } = useGetSpacificTradeSheetListDataQuery(uuid);

  useEffect(() => {
    if (spacificTradeSheetLisData?.data?.tradeSheetData?.multipleRepresentation) {
      const multipleRepresentationArray = spacificTradeSheetLisData.data.tradeSheetData.multipleRepresentation.split(',');
      setMultipleRepresentation(multipleRepresentationArray);
      setRepresentation(multipleRepresentationArray[0]);
    }
  }, [spacificTradeSheetLisData]);

  if (isLoading) {
    return <TableLoader />;
  }

  return (
    <div className="">
      <div>
        <Tabs
          defaultActiveKey={representation || "2"}
          type="card"
          items={multipleRepresentation.map((tab) => {
            return {
              label: <span>{formatStringCamelCasecapitalize(tab)}</span>,
              key: tab,
            };
          })}
          onChange={(key) => {
            setRepresentation(key);
          }}
        />
      </div>
      <div>
        <TradeSheetPaperworkFileManagerMultipleRepresentationComponent dynamicRepresentation={representation} uuid={uuid} />
      </div>
    </div>
  );
};

export default TradeSheetPaperworkFileManagerMultipleRepresentation;
