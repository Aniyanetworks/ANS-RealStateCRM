import AnnouncementCard from "./AnnouncementCard";

import TableLoader from "../loader/TableLoader";
import { useGetPublishedAnnouncementsListQuery } from "../../redux/api/superadmin/announcementSlice";

type AnnouncementData = {
  id: number;
  image: string;
  title: string;
  created_at: string;
  date: string;
  description: string;
};

const Announcement = () => {
  const { data, isLoading } = useGetPublishedAnnouncementsListQuery("");

  return (
    <div>
      {isLoading ? (
        <TableLoader />
      ) : (
        <div>
          {data?.data?.announcements?.length > 0 ? (
            data.data.announcements.map((announcement: AnnouncementData, i: number) => (
              <AnnouncementCard
                key={announcement.id}
                index={i}
                announcement={announcement}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <span className="text-3xl mb-2">📢</span>
              <p className="text-xs">No announcements at the moment</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Announcement;
