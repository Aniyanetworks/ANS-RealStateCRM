/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { Card, Typography, Spin } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import { useGetCalendarEventsQuery } from "../../../redux/api/superadmin/calendar/calendarEventSlice";
import Events from "./Events";
import moment from "moment-timezone";

const { Title } = Typography;

const CalendarList = () => {
  const { data, isLoading } = useGetCalendarEventsQuery("");

  // event.start is stored/returned as UTC. Convert to the fixed business
  // timezone (America/Toronto) rather than the viewer's browser-local
  // timezone, so agents see the same date/time the admin actually scheduled
  // (matches the convention used in CalendarEventManagement.tsx).
  const events = useMemo(() => {
    return (
      data?.data?.calendarEvents.map((event: any) => {
        const start = moment.utc(event.start).tz("America/Toronto");
        return {
          date: start.format("YYYY-MM-DD"),
          title: event.title,
          location: event.location,
          description: event.description || "No description available",
          time: start.format("hh:mm A"),
          uuid: event.uuid,
        };
      }) || []
    );
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <Card className="!rounded-lg shadow-none border-b">
        <Title level={4} style={{ margin: 0 }}>
          <CalendarOutlined style={{ marginRight: "8px", fontSize: "16px" }} />
          Events
        </Title>
      </Card>

      {/*####################
      ####### Events #######
      ######################
      */}
      <Events events={events} />
    </div>
  );
};

export default CalendarList;
