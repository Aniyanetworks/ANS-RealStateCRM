// @ts-nocheck
import { Link } from "react-router-dom";
import { Table } from "antd";
import { CalendarOutlined, FileTextOutlined, HomeOutlined, NotificationOutlined } from "@ant-design/icons";
import { useAppSelector } from "../../redux/hooks";
import Announcement from "../../components/dashboard/Announcement";
import UpcommingCalendar from "../../components/dashboard/Calendar/UpcommingCalendar";
import { useGetClientPropertyListingQuery } from "../../redux/api/superadmin/client/clientPropertyListingDataSlice";
import { useGetPublishedAnnouncementsListQuery } from "../../redux/api/superadmin/announcementSlice";
import { useGetCalendarEventsQuery } from "../../redux/api/superadmin/calendar/calendarEventSlice";

const Tile = ({ icon, value, label, to }) => (
  <Link to={to} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-[18px] text-[#0f766e]">{icon}</div>
    <div>
      <div className="text-[22px] font-bold leading-none text-gray-800">{value}</div>
      <div className="mt-1 text-[12px] text-gray-500">{label}</div>
    </div>
  </Link>
);

const Card = ({ title, sub, children }) => (
  <div className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
    <div className="border-b border-gray-100 px-5 py-3.5">
      <div className="text-[14px] font-semibold text-gray-800">{title}</div>
      <div className="text-[11px] text-gray-400">{sub}</div>
    </div>
    <div className="max-h-[380px] flex-1 overflow-y-auto">{children}</div>
  </div>
);

const ClientHome = () => {
  const { user } = useAppSelector((state) => state.user);
  const { data: propData, isLoading } = useGetClientPropertyListingQuery({ uuid: user?.id });
  const { data: annData } = useGetPublishedAnnouncementsListQuery("");
  const { data: calData } = useGetCalendarEventsQuery("");

  const properties = propData?.data?.clientPropertyListingData ?? [];
  const visits = properties.filter((p) => p?.visitingDate).length;
  const announcements = annData?.data?.announcements?.length ?? 0;
  const events = calData?.data?.calendarEvents?.length ?? calData?.data?.length ?? 0;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const columns = [
    { title: "MLS #", dataIndex: "mlsNumber", key: "mls", render: (v) => <span className="font-medium text-gray-700">{v || "-"}</span> },
    { title: "Property", dataIndex: "propertyAddress", key: "addr", render: (v) => v || "-" },
    { title: "Price", dataIndex: "price", key: "price", render: (v) => (v ? `$${Number(v).toLocaleString()}` : "-") },
    { title: "Visit date", dataIndex: "visitingDate", key: "visit", render: (v) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not scheduled") },
  ];

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="rounded-xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#0f766e]">{today}</div>
        <div className="text-[22px] font-bold text-gray-800">{greeting}, {user?.firstName || user?.name}</div>
        <div className="mt-1 text-[13px] text-gray-500">Track the properties your agent shared with you, your visits and your documents.</div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile icon={<HomeOutlined />} value={properties.length} label="My properties" to={`/dashboard/clients/property-list/${user?.id}/${user?.name}`} />
        <Tile icon={<CalendarOutlined />} value={visits} label="Visits scheduled" to={`/dashboard/clients/property-list/${user?.id}/${user?.name}`} />
        <Tile icon={<FileTextOutlined />} value="Open" label="My accounting" to="/dashboard/my-accounting" />
        <Tile icon={<NotificationOutlined />} value={announcements} label="Announcements" to="/" />
      </div>

      <Card title="My properties" sub="Properties shared with you by your agent">
        <Table rowKey={(r) => r.id ?? r.mlsNumber} size="middle" loading={isLoading} columns={columns} dataSource={properties} pagination={{ pageSize: 6, hideOnSinglePage: true }} />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Announcements" sub="Latest updates"><Announcement /></Card>
        <Card title="Upcoming events" sub="Scheduled calendar events"><UpcommingCalendar /></Card>
      </div>
    </div>
  );
};

export default ClientHome;
