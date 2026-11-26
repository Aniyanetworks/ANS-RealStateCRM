import { Table } from "antd";
import { Link, useParams } from "react-router-dom";
import TableLoader from "../../../../../components/loader/TableLoader";
import { useGetEventAttendeesQuery } from "../../../../../redux/api/superadmin/calendar/calendarEventSlice";
import moment from "moment";
import { useState } from "react";

interface Attendee {
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
}

const Attendees = () => {
    const { uuid } = useParams();
    const { data, isLoading } = useGetEventAttendeesQuery(uuid);
    const [searchText, setSearchText] = useState("");

    const columns = [
        {
            title: "SN",
            dataIndex: "serial",
            key: "serial",
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Phone Number",
            dataIndex: "phone",
            key: "phone",
        },
        {
            title: "Joined At",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (text: string) => moment(text).format("DD-MM-YYYY hh:mm A"),
        },
    ];

    const filteredData = data?.data?.attendees?.filter((item: Attendee) => {
        return item?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            item?.email?.toLowerCase().includes(searchText.toLowerCase()) ||
            item?.phone?.toLowerCase().includes(searchText.toLowerCase())
    });

    const tableSourceData = filteredData?.map((item: Attendee, index: number) => {
        return {
            ...item,
            serial: index + 1,
        };
    });

    const exportToCSV = () => {
        const csvRows = [];
        const headers = ['SN', 'Name', 'Email', 'Phone Number', 'Joined At'];
        csvRows.push(headers.join(','));

        tableSourceData.forEach((item: Attendee) => {
            const row = [
                item.id,
                item.name,
                item.email,
                item.phone,
                moment(item.createdAt).format("DD-MM-YYYY hh:mm A"),
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'attendees.csv');
        a.click();
    };

    if (isLoading) return <TableLoader />;

    return (
        <div className="p-4">
            <div className="flex items-center justify-between gap-5 xl:gap-10  mb-5 p-1">
                <h1>Attendees List</h1>
                <div className="w-1/2">
                    <input
                        type="text"
                        placeholder="Search from table..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="global-search "
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={exportToCSV} className="primary-btn">Export CSV</button>
                    <Link to={`/dashboard/super-admin/calendar-events`}>
                        <button className="primary-btn">Back</button>
                    </Link>
                </div>
            </div>
            <Table<Attendee>
                rowKey="id"
                columns={columns}
                dataSource={tableSourceData || []}
                pagination={{ pageSize: 20 }}
            />
        </div>
    );
};

export default Attendees;