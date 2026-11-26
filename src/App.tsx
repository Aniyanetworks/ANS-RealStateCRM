import { Outlet } from "react-router-dom";
import "./App.css";
import "./css/Antd.css";
import "./css/payment.css";
import { Toaster } from "react-hot-toast";
import "react-image-crop/dist/ReactCrop.css";

function App() {
  return (
    <div>
      <Outlet />
      <Toaster />
    </div>
  );
}

export default App;
