import { Button, Popover } from "antd";

import toast from "react-hot-toast";

const Toasts = () => {
  const showToast = (type: "error" | "success") => {
    switch (type) {
      case "error":
        toast.error("Didnt work");
        break;
      case "success":
        toast.success("This worked");
        break;

      default:
        break;
    }
  };

  return (
    <div className="space-x-5">
      <Button type="primary" onClick={() => showToast("success")}>
        Success
      </Button>
      <Button danger onClick={() => showToast("error")}>
        Error
      </Button>
      <Popover content={Content} trigger="click">
        <Button>See code</Button>
      </Popover>
    </div>
  );
};

export default Toasts;

const Content = () => {
  return (
    <div>
      <code>
        {`const showToast = () => 
    toast.success("Yes ")
  `}
      </code>
    </div>
  );
};
