// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";

const CommissionTab = ({ data }) => {
  const [activityLog, setActivityLog] = useState<any>([]);
  const [groupedActivityLog, setGroupedActivityLog] = useState<Record<string, any[]>>({});
  const [activeUser, setActiveUser] = useState<string | null>(null);

  useEffect(() => {
    if (data?.data?.tradeSheetData?.activityLog) {
      setActivityLog(data.data.tradeSheetData.activityLog);

      const grouped = data.data.tradeSheetData.activityLog.reduce((acc, log) => {
        if (!acc[log.userName]) {
          acc[log.userName] = [];
        }
        acc[log.userName].push(log);
        return acc;
      }, {});

      setGroupedActivityLog(grouped);

      const firstUser = Object.keys(grouped)[0];
      setActiveUser(firstUser);
    }
  }, [data]);

  return (
    <div className="relative h-full w-full p-3 z-[999] bg-white shadow-lg py-5 pl-5 transform translate-x-0 transition-transform duration-300">
      <div className="overflow-auto h-[70vh]">
        <div className="rounded-md p-4 shadow-md">
          <div className="flex space-x-4 border-b mb-4">
            {Object.keys(groupedActivityLog).map((userName, index) => (
              <button
                key={index}
                onClick={() => setActiveUser(userName)}
                className={`px-4 py-2 text-sm font-medium ${
                  activeUser === userName
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {userName}
              </button>
            ))}
          </div>

          <div>
            <h3 className="font-semibold text-xl text-gray-900 mb-4">Activity Log</h3>
            {activeUser && groupedActivityLog[activeUser]?.length > 0 ? (
              <div className="space-y-4">
                {groupedActivityLog[activeUser].map((log, logIndex) => (
                  <div key={logIndex} className="p-4 border rounded-lg shadow-sm">
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">Action:</span> {log.action}
                      </span>
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">Description:</span> {log.historyText}
                      </span>
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">Date:</span> {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700">No activity log available for this user.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionTab;