// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { FC, useEffect } from "react";
import { Button, Modal, Space } from "antd";
import moment from "moment";

interface Property {
  closingDate: string;
  propertyAddress?: string;
}

interface TradeSheet {
  id: number;
  tradeSheetTypeId: string;
  properties: Property[];
}

interface PropertyListing {
  id: number;
  address?: string;
  expiryDate?: string;
}

interface ClosingDatePopupProps {
  tradeData: TradeSheet[];
  propertyData: PropertyListing[];
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ClosingDatePopup: FC<ClosingDatePopupProps> = ({
  tradeData,
  propertyData,
  isModalOpen,
  setIsModalOpen,
}) => {
  const calculateTimeline = (targetDate: string) => {
    const today = moment.utc().startOf("day");
    const target = moment.utc(targetDate).startOf("day");
    return target.diff(today, "days");
  };

  const today = moment.utc().startOf("day");

  const getCurrentMonthClosings = () => {
    const currentMonth = today.month();
    const currentYear = today.year();
    return tradeData.filter((trade) => {
      const properties = Array.isArray(trade?.properties) ? trade.properties : [];
      return properties.some((prop) => {
        const closingDate = moment.utc(prop.closingDate);
        return (
          closingDate.month() === currentMonth &&
          closingDate.year() === currentYear &&
          closingDate.isSameOrAfter(today)
        );
      });
    });
  };

  const getUpcomingClosings = () => {
    const currentMonth = today.month();
    const currentYear = today.year();
    return tradeData.filter((trade) => {
      const properties = Array.isArray(trade?.properties) ? trade.properties : [];
      return properties.some((prop) => {
        const closingDate = moment.utc(prop.closingDate);
        return (
          closingDate.year() > currentYear ||
          (closingDate.year() === currentYear &&
            closingDate.month() > currentMonth)
        );
      });
    });
  };

  const getExpiringSoonListings = () => {
    return propertyData.filter((listing) => {
      if (!listing.expiryDate) return false;
      const expiry = moment.utc(listing.expiryDate).startOf("day");
      const diffDays = expiry.diff(today, "days");
      return diffDays <= 7 && diffDays >= 0;
    });
  };


  const handleDontRemind = () => {
    localStorage.setItem("popupVisibility", "false");
    setIsModalOpen(false);
  };

  const handleReminderSet = (days: number) => {
    const reminderDate = moment().add(days, "days").format("YYYY-MM-DD");
    localStorage.setItem("reminderDate", reminderDate);
    localStorage.setItem("popupVisibility", "false");
    setIsModalOpen(false);
  };

  useEffect(() => {
    const popupVisibility = localStorage.getItem("popupVisibility");
    const reminderDate = localStorage.getItem("reminderDate");
    const todayStr = today.format("YYYY-MM-DD");
    const shouldShow =
      popupVisibility === "true" ||
      (reminderDate && moment.utc(todayStr).isSameOrAfter(moment.utc(reminderDate))) ||
      getExpiringSoonListings().length > 0;
    if (shouldShow) {
      setIsModalOpen(true);
      localStorage.setItem("popupVisibility", "true");
    } else {
      setIsModalOpen(false);
    }
  }, [tradeData, propertyData]);

  return (
    <Modal
      width={780}
      title={
        <h6 className="font-semibold text-primary-700 border-b pb-2 text-sm">
          🏠 Trade Sheet & Property Listing Reminders
        </h6>
      }
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      styles={{ body: { maxHeight: "55vh", overflowY: "auto", padding: "8px 16px" } }}
      footer={[
        <Space key="reminder-buttons" className="flex justify-center w-full gap-2">
          <Button
            size="small"
            type="primary"
            onClick={() => handleReminderSet(3)}
            className="bg-[#0f766e] hover:!bg-[#0f766e] text-xs"
          >
            Remind in 3 days
          </Button>
          <Button
            size="small"
            type="primary"
            onClick={() => handleReminderSet(7)}
            className="bg-[#0f766e] hover:!bg-[#0f766e] text-xs"
          >
            Remind in 7 days
          </Button>
          <Button
            size="small"
            type="primary"
            onClick={() => handleReminderSet(15)}
            className="bg-[#0f766e] hover:!bg-[#0f766e] text-xs"
          >
            Remind in 15 days
          </Button>
          <Button
            size="small"
            type="primary"
            onClick={handleDontRemind}
            className="border-red-300 hover:border-red-400 bg-red-500 hover:!bg-red-400 text-xs"
          >
            Don't remind me
          </Button>
        </Space>,
      ]}
    >
      <div className="space-y-3 py-1">
        <div>
          <h6 className="font-bold text-gray-800 flex items-center mb-1 text-xs uppercase tracking-wide">
            <span className="mr-1">📅</span> Current Month Closings
          </h6>
          {getCurrentMonthClosings().length > 0 ? (
            <div className="space-y-1">
              {getCurrentMonthClosings()
                .filter((trade) => Array.isArray(trade?.properties) && trade.properties.length > 0)
                .sort((a, b) => {
                  const aDate = Array.isArray(a?.properties) && a.properties[0]?.closingDate
                    ? moment.utc(a.properties[0].closingDate)
                    : moment.utc(0);
                  const bDate = Array.isArray(b?.properties) && b.properties[0]?.closingDate
                    ? moment.utc(b.properties[0].closingDate)
                    : moment.utc(0);
                  return aDate.diff(bDate);
                })
                .map((trade) => {
                  const firstProperty = Array.isArray(trade?.properties) ? trade.properties[0] : null;
                  if (!firstProperty) return null;
                  return (
                    <div key={trade.id} className="bg-white px-3 py-1.5 rounded border border-gray-100 flex justify-between items-center">
                      <p className="min-w-0 flex-1 truncate text-xs text-gray-700 sm:max-w-[340px] sm:flex-none">
                        {trade.tradeSheetTypeId} ({firstProperty?.propertyAddress})
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="hidden text-xs text-gray-500 sm:block">📆 {moment.utc(firstProperty?.closingDate).format("D MMM, YYYY")}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${calculateTimeline(firstProperty?.closingDate) <= 7 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                          {calculateTimeline(firstProperty?.closingDate)} days remaining
                        </span>
                      </div>
                    </div>
                  );
                })
                .filter(Boolean)}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-1 pl-1">No closings scheduled for the current month</p>
          )}
        </div>

        <div>
          <h6 className="font-bold text-gray-800 flex items-center mb-1 text-xs uppercase tracking-wide">
            <span className="mr-1">🔜</span> Upcoming Closings
          </h6>
          {getUpcomingClosings().length > 0 ? (
            <div className="space-y-1">
              {getUpcomingClosings()
                .filter((trade) => Array.isArray(trade?.properties) && trade.properties.length > 0)
                .sort((a, b) => {
                  const aDate = Array.isArray(a?.properties) && a.properties[0]?.closingDate
                    ? moment.utc(a.properties[0].closingDate)
                    : moment.utc(0);
                  const bDate = Array.isArray(b?.properties) && b.properties[0]?.closingDate
                    ? moment.utc(b.properties[0].closingDate)
                    : moment.utc(0);
                  return aDate.diff(bDate);
                })
                .map((trade) => {
                  const firstProperty = Array.isArray(trade?.properties) ? trade.properties[0] : null;
                  if (!firstProperty) return null;
                  return (
                    <div key={trade.id} className="bg-white px-3 py-1.5 rounded border border-gray-100 flex justify-between items-center">
                      <p className="min-w-0 flex-1 truncate text-xs text-gray-700 sm:max-w-[340px] sm:flex-none">
                        {trade.tradeSheetTypeId} ({firstProperty?.propertyAddress})
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="hidden text-xs text-gray-500 sm:block">📆 {moment.utc(firstProperty?.closingDate).format("D MMM, YYYY")}</p>
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs whitespace-nowrap">
                          {calculateTimeline(firstProperty?.closingDate)} days remaining
                        </span>
                      </div>
                    </div>
                  );
                })
                .filter(Boolean)}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-1 pl-1">No upcoming closings scheduled</p>
          )}
        </div>

        <div>
          <h6 className="font-bold text-gray-800 flex items-center mb-1 text-xs uppercase tracking-wide">
            <span className="mr-1">⏰</span> Property Listings Expiring Soon
          </h6>
          {getExpiringSoonListings().length > 0 ? (
            <div className="space-y-1">
              {getExpiringSoonListings().filter(tradeSheet => tradeSheet.tradeSheet == 'closed')
                .sort((a, b) => moment.utc(a.expiryDate).diff(moment.utc(b.expiryDate)))
                .map((listing) => (
                  <div key={listing.id} className="bg-white px-3 py-1.5 rounded border border-gray-100 flex justify-between items-center">
                    <p className="min-w-0 flex-1 truncate text-xs text-gray-700 sm:max-w-[340px] sm:flex-none">
                      {listing.propertyListingTypeId} ({listing.address})
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="hidden text-xs text-gray-500 sm:block">📆 {moment.utc(listing.expiryDate).format("D MMM, YYYY")}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${calculateTimeline(listing.expiryDate) <= 3 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                        {calculateTimeline(listing.expiryDate)} days remaining
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-1 pl-1">No property listings expiring within the next 7 days</p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ClosingDatePopup;
