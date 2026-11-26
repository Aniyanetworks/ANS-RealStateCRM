import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const DataLoader = () => {
  return (
    <Spin
      indicator={<LoadingOutlined spin className="text-primaryPurple" />}
      size="large"
    />
  );
};

export default DataLoader;
