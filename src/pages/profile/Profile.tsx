import BasicInfo from "../../components/profile/BasicInfo";
import PersonalInfo from "../../components/profile/PersonalInfo";
import ChangePassword from "../../components/profile/ChangePassword";
import ContactInfo from "../../components/profile/ContactInfo";
import Signature from "../../components/profile/Signature";
import ApiTokens from "../../components/profile/ApiTokens";
import { Tabs } from "antd";
import AgentDocument from "../../components/dashboard/Agent/AgentDocument";
import { useSelector } from "react-redux";
import AgentSelectedPlanDiscountAddon from "../../components/dashboard/Agent/AgentSelectedPlanDiscountAddon";
import Security from "../../components/profile/Security";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import uploadIcon from "../../assets/upload2.svg";


type TabType = {
  id: number;
  name: string;
  component: JSX.Element;
};

const Profile = () => {
  const { user } = useSelector((state: any) => state.user);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get("tab");
  const [showDocInstruction, setShowDocInstruction] = useState(false);

  useEffect(() => {
    if (tabParam && tabParam.toLowerCase() === "document") {
      setShowDocInstruction(true);
      // Optionally auto-hide after a few seconds:
      const timer = setTimeout(() => setShowDocInstruction(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [tabParam]);

  const documentTab = {
    id: 5,
    name: "Documents",
    // component: <AgentDocument agentAccount={user?.agentAccount[0]} mode="view" />,
    component: <AgentDocument agentAccount={user?.agentAccount[0]} />,
  };

  const PlanTab = {
    id: 5,
    name: "Plan",
    // component: <AgentSelectedPlanDiscountAddon agentAccount={user?.agentAccount[0]} mode="view" />,
    component: <AgentSelectedPlanDiscountAddon agentAccount={user?.agentAccount[0]} />,
  };

  const tabs: TabType[] = [
    {
      id: 0,
      name: "Basic Information",
      component: <BasicInfo />,
    },
    {
      id: 1,
      name: "Personal Information",
      component: <PersonalInfo />,
    },
    {
      id: 2,
      name: "Change Password",
      component: <ChangePassword />,
    },
    {
      id: 7,
      name: "Security",
      component: <Security />,
    },
    {
      id: 3,
      name: "Contact Information",
      component: <ContactInfo />,
    },
    {
      id: 4,
      name: "Signature",
      component: <Signature />,
    },
    {
      id: 8,
      name: "API Tokens",
      component: <ApiTokens />,
    },
    ...(user.userType === 'agent' ? [documentTab,PlanTab] : []),
  ];

  // Only select Documents tab if tab=document
  let defaultActiveKey = "1";
  if (tabParam && tabParam.toLowerCase() === "document") {
    const foundIndex = tabs.findIndex(
      t => t.name.toLowerCase() === "documents"
    );
    if (foundIndex !== -1) {
      defaultActiveKey = String(foundIndex + 1);
    }
  }

  return (
    <div className="mb-10 ">
      <h1 className="mb-5 ">Profile</h1>
      {showDocInstruction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full flex flex-col items-center animate-bounce-in">
            <img src={uploadIcon} alt="Upload" className="w-16 h-16 mb-4 animate-bounce" />
            <h2 className="text-xl font-bold mb-2">Update Your Expeired Documents</h2>
            <p className="text-gray-600 mb-4 text-center">Click the <span className="font-semibold text-blue-600">Upload</span> button next to each document to add your files. Accepted formats: PDF, JPG, PNG.</p>
            <button onClick={() => setShowDocInstruction(false)} className="mt-2 px-4 py-2 bg-[#243451] text-white rounded">Got it!</button>
          </div>
        </div>
      )}
      <Tabs
        type="card"
        defaultActiveKey={defaultActiveKey}
        items={tabs.map((item, i) => {
          const id = String(i + 1);
          return {
            label: <span>{item.name}</span>,
            key: id,
            children: item.component,
          };
        })}
      />
    </div>
  );
};

export default Profile;
