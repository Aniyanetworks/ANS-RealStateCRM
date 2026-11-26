// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";
import { useGetSpacificTradeSheetListDataQuery } from "../../../redux/api/agent/trade-sheet/tradeSheetSlice";
import { Tabs } from "antd";
import Commission from "../../../components/accounting/tabs/Commission";
import KeyInfo from "../../../components/accounting/tabs/KeyInfo";
import Property from "../../../components/accounting/tabs/Property";
import Agent from "../../../components/accounting/tabs/Agent";
import Lawyer from "../../../components/accounting/tabs/Lawyer";
import ActivityLog from "../../../components/accounting/tabs/ActivityLog";
import People from "../../../components/accounting/tabs/People";
import Brokarage from "../../../components/accounting/tabs/Brokarage";
import CommissionSeller from "../../../components/accounting/tabs/CommissionSeller";

const FinalizeTrade = ({ uuid, open, setIsOpen }) => {
  const [tradesheetData, setTradeSheetData] = useState<any>([]);
  const { data } = useGetSpacificTradeSheetListDataQuery(uuid);

  useEffect(() => {
    setTradeSheetData(data?.data?.tradeSheetData);
  }, [
    data
  ]);

  const tabs = [
    {
      id: 0,
      name: "Key Info",
      component: <KeyInfo data={data}/>,
    },
    {
      id: 1,
      name: "People",
      component: <People data={data} />,
    },
    {
      id: 2,
      name: "Property Info",
      component: <Property data={data} />,
    },
    {
      id: 3,
      name: "Agent Info",
      component: <Agent data={data}/>,
    },
    {
      id: 4,
      name: "Lawyer Info",
      component: <Lawyer data={data} />,
    },
    {
      id: 6,
      name: "Outside Brokers",
      component: <Brokarage data={data} />,
    },
    {
      id: 7,
      name: "Commissions",
      component: (() => {
        const representation = data?.data?.tradeSheetData?.representation;
        const representationType = data?.data?.tradeSheetData?.representationType;
    
        if (representationType === "multiple") {
          return <Commission data={data} />;
        } else if (representation === "seller") {
          return <CommissionSeller data={data} />;
        } else if (representation === "buyer") {
          return <Commission data={data} />;
        } else {
          return null;
        }
      })(),
    },    
    {
      id: 8,
      name: "Activity Log",
      component: <ActivityLog data={data} />,
    },
  ];

  return (
    open && (
      <div className="fixed inset-0 z-[9999] flex justify-end bg-black bg-opacity-50">
        
        <div className="relative h-full w-[80%] z-[999] bg-white shadow-lg py-5 pl-5 transform translate-x-0 transition-transform duration-300">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 left-[-50px] w-[50px] rounded-l-full bg-red-500 text-white p-2"
          >
            &times;
          </button>
            <div className="py-3 border-b border-gray-200 mb-4">
            <h2 className="text-xl font-bold">Tradesheet: {data?.data?.tradeSheetData?.tradeSheetTypeId}</h2>
            <p className="text-gray-600">Property Address: {data?.data?.tradeSheetData?.properties?.[0]?.propertyAddress}</p>
            </div>
          <Tabs
            type="card"
            items={tabs.map((item, i) => ({
              label: <span>{item.name}</span>,
              key: String(i),
              children: item.component,
            }))}
          />
        </div>
      </div>
    )
  );
};

export default FinalizeTrade;
