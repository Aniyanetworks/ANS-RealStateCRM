// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import UpcommingCalendarCard from "../Calendar/UpcommingCalendarCard";
import { useGetCalendarEventsQuery } from "../../../redux/api/superadmin/calendar/calendarEventSlice";
import { Link } from "react-router-dom";
import TableLoader from "../../loader/TableLoader";

type EventData = {
  id: string;
  summary: string;
  description: string;
  htmlLink: string;
  icsContent: string;
  created_at: string;
  start: string;
  uuid: string;
  title: string;
};

const UpcommingCalendar = () => {
  const { data, isLoading } = useGetCalendarEventsQuery("");
  const now = new Date();
  const upcomingEvents = data?.data?.calendarEvents?.filter(
    (calendarEvent: EventData) => new Date(calendarEvent.start) >= now
  );

  return (
    <div>
      {isLoading ? (
        <TableLoader />
      ) : (
        <div>
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <>
              {upcomingEvents.map((calendarEvent: EventData, i: number) => (
                <UpcommingCalendarCard
                  key={calendarEvent.id}
                  index={i}
                  calendarEvent={calendarEvent}
                />
              ))}
              <div className="p-3">
                <Link to={`/dashboard/super-admin/calendar-list`}>
                  <button className="btn-common-outline">Show All</button>
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <span className="text-3xl mb-2">📅</span>
              <p className="text-xs">No upcoming events at the moment</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UpcommingCalendar;
