/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Calendar, Collapse, Modal, Tag, Typography } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";

const { Panel } = Collapse;
const { Text } = Typography;

const Events = ({ events }: { events: any[] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const dateCellRender = (value: any) => {
    const dateString = value.format("YYYY-MM-DD");
    const dayEvents = events.filter((event) => event.date === dateString);

    if (dayEvents.length > 0) {
      return (
        <div className="flex items-center   justify-end h-full">
          <Tag color="#243451" className="m-0 mt-2">
            <span className="max-md:hidden"> {dayEvents.length} Events</span>
          </Tag>
        </div>
      );
    }
    return null;
  };

  const onDateSelect = (date: any) => {
    const selected = date.format("YYYY-MM-DD");
    const isSameDate =
      selectedDate && format(parseISO(selectedDate), "YYYY-MM-DD") === selected;

    // Check if the selected date already matches or is invalid
    if (isSameDate || !events.some((event) => event.date === selected)) {
      return;
    }

    setSelectedDate(selected);
    setIsModalOpen(true);
  };
  const selectedDayEvents = events.filter(
    (event) => event.date === selectedDate
  );

  return (
    <div className="mt-3 mb-10">
      <div className="w-full p-4 rounded-lg bg-white">
        <Calendar dateCellRender={dateCellRender} onSelect={onDateSelect} />
      </div>

      {/*##########################
      #### Event Details Modal #### 
      ############################
      */}

      {setSelectedDate && (
        <Modal
          open={isModalOpen}
          onOk={() => setIsModalOpen(false)}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedDate(null);
          }}
          footer={false}
          className="lg:!w-[40%]"
          title={
            <div className="flex items-center gap-2">
              <CalendarOutlined className="-mt-1" />
              {selectedDate && format(parseISO(selectedDate), "EEEE, MMM dd")}
            </div>
          }
        >
          <Collapse ghost>
            {selectedDayEvents.map((event) => (
              <Panel
                key={event.title}
                header={
                  <div className="flex flex-col gap-2">
                    <Text strong>{event.title}</Text>
                    <div>
                      <Tag icon={<ClockCircleOutlined />} color="blue">
                        {event.time}
                      </Tag>
                    </div>
                  </div>
                }
              >
                <div className="px-6 -mt-3">
                  <p className="font-semibold">Description</p>
                  <p className="text-justify">{event.description}</p>
                  <p className="font-semibold">Location</p>
                  {event.location && /^https?:\/\//i.test(event.location) ? (
                    <a
                      href={event.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-justify text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {event.location}
                    </a>
                  ) : (
                    <p className="text-justify">{event.location}</p>
                  )}

                  <div className="flex justify-end">
                    <Link
                      to={`/event-join/${event.uuid}`}
                      target="_blank"
                      className="primary-btn flex items-center !gap-2"
                    >
                      <UserOutlined />
                      Join Event
                    </Link>
                  </div>
                </div>
              </Panel>
            ))}
          </Collapse>
        </Modal>
      )}
    </div>
  );
};

export default Events;
