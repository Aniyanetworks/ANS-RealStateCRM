import { useState } from "react";
import type { TableColumnsType } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { Input, Table, Tag } from "antd";
import { FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import allUsers from "../../../data/users"; // Make sure this data matches DataType structure

interface DataType {
  key?: React.Key; // Ensure `key` matches what your data needs
  name: string;
  email: string;
  age: number;
  role: string;
}

const AntdTable = () => {
  const [users] = useState<DataType[]>(allUsers); // Specify type for state

  const columns: TableColumnsType<DataType> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      filterDropdown: ({ setSelectedKeys, confirm, selectedKeys }) => (
        <div className="p-2">
          <Input
            value={selectedKeys[0]}
            onChange={(e) => {
              setSelectedKeys(e.target.value ? [e.target.value] : []);
              confirm({ closeDropdown: false });
            }}
            onPressEnter={() => confirm()}
            onBlur={() => confirm()}
          />
          <button onClick={() => confirm()} className="primary-btn !py-1 mt-2">
            Search
          </button>
        </div>
      ),
      filterIcon: () => <SearchOutlined />,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(String(value).toLowerCase()),
    },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
      sorter: (a, b) => a.age - b.age,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <div>
          {role === "admin" ? (
            <Tag color="volcano">{role}</Tag>
          ) : (
            <span>{role}</span>
          )}
        </div>
      ),
      filters: [
        { text: "Developer", value: "developer" },
        { text: "Admin", value: "admin" },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: "Actions",
      dataIndex: "",
      key: "actions",
      render: () => (
        <div className="flex gap-5 items-center">
          <button className="text-[16px] hover:text-primaryPurple duration-100">
            <FaRegEdit />
          </button>
          <button className="hover:text-red-500 text-lg duration-100">
            <MdDelete />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={users}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default AntdTable;
