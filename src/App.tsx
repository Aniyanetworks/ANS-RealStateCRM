import { Outlet } from "react-router-dom";
import "./App.css";
import "./css/Antd.css";
import "./css/payment.css";
import { Toaster } from "react-hot-toast";
import "react-image-crop/dist/ReactCrop.css";
import AniyaFloat from "./components/AniyaFloat";

function App() {
  return (
    <div>
      <Outlet />
      <Toaster />
      <AniyaFloat />
    </div>
  );
}

export default App;
