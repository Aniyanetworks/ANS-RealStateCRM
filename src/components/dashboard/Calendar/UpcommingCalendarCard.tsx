import { Modal } from "antd";
import { useState } from "react";
import { apiUrl } from "../../../utils/constant";
import { FaCalendarAlt, FaDownload } from "react-icons/fa";
import moment from "moment";

type EventData = {
  id: string;
  uuid: string;
  title: string;
  description: string;
  htmlLink: string;
  icsContent: string;
  created_at: string;
  start: string;
  end:string;
  location:string;
};

interface UpcommingCalendarCardProps {
  index: number;
  calendarEvent: EventData;
}

const UpcommingCalendarCard = ({ index, calendarEvent }: UpcommingCalendarCardProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const formattedDate = calendarEvent.start ? moment(calendarEvent.start).format("DD MMM YYYY, hh:mm A") : "-";
  const formattedDateEnd = calendarEvent.end ? moment(calendarEvent.end).format("DD MMM YYYY, hh:mm A") : "-";

  const showLoading = () => {
    setOpen(true);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleDownloadICS = () => {
    window.location.href = apiUrl + `/auth/calendar-events/download-ics-file?eventId=${calendarEvent.id}`;
  };

  return (
    <div>
    <div className={`p-5 ${index !== 0 && "border-t"} space-y-3`}>
      <h3 className="font-medium">{calendarEvent.title}</h3>
      <p>From {formattedDate} to {formattedDateEnd}</p>
      <p className="break-words"><b>Location:</b> {calendarEvent.location && /^https?:\/\//i.test(calendarEvent.location) ? (
                    <a
                      href={calendarEvent.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-justify text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {calendarEvent.location}
                    </a>
                  ) : (
                    <p className="text-justify">{calendarEvent.location}</p>
                  )}
      </p>
      <div className="flex gap-5">
        <a href={`/event-join/${calendarEvent.uuid}`} target="_blank">
          <button className="btn-common-outline">Register Now</button>
        </a>
        <button onClick={showLoading} className="btn-common">
          Details
        </button>
      </div>
    </div>


      <Modal
        title={<p className="text-xl font-semibold">Event Details</p>}
        loading={loading}
        footer={null}
        open={open}
        onCancel={() => setOpen(false)}
        width={950}
      >
        <div className="bg-white rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              {/* <div className="w-16 h-16 rounded-full bg-gray-50 flex-shrink-0">
                <img className="h-full w-full rounded-full" src={announcement1} alt="Event" />
              </div> */}
              <div>
                <h3 className="text-xl font-medium mb-2">{calendarEvent.title}</h3>
                <p className="text-gray-600 flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-500" />
                  From {formattedDate} to {formattedDateEnd}
                </p>
                <b>Location: </b>{calendarEvent.location && /^https?:\/\//i.test(calendarEvent.location) ? (
                    <a
                      href={calendarEvent.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-justify text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {calendarEvent.location}
                    </a>
                  ) : (
                    <p className="text-justify">{calendarEvent.location}</p>
                  )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadICS}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors whitespace-nowrap"
              >
                <FaDownload />
                Download ICS
              </button>
              <a
                href={`/event-join/${calendarEvent.uuid}`}
                target="_blank"
              >
                <button className="btn-common whitespace-nowrap">
                  Register Now
                </button>
              </a>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-medium mb-2">Description</h4>
            <div 
              className="prose max-w-none text-gray-700">
                {calendarEvent.description}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UpcommingCalendarCard;
