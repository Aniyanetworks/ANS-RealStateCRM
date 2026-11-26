import { Modal } from "antd";
import { useState } from "react";
import { getFileUrl } from "../../utils/constant";
import defaultAvatar from "../../assets/agent-2.png";

type AgentData = {
  id: number;
  name: string;
  recoRegNumber:string;
  user:{
    profilePicture:string;
    userType:string;
  },
};

interface AgentCardProps {
  agentData: AgentData;
}

const AgentCard: React.FC<AgentCardProps> = ({ agentData }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const showLoading = () => {
    setOpen(true);
    setLoading(true);

    // Simple loading mock. You should add cleanup logic in real world.
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };
  return (
    <div className="bg-white rounded-2xl p-3 2xl:p-5 ">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="2xl:w-[80px] w-[60px] h-[60px] 2xl:h-[80px] rounded-full bg-gray-50">
            <img className="h-full w-full" src={agentData?.user?.profilePicture ? getFileUrl(agentData.user.profilePicture) : defaultAvatar} alt="Agent profile" />
          </div>
          <div>
            <h3 className=" font-medium">{agentData.name}</h3>
            <p className="text-gray-400 first-letter:uppercase">{agentData.user.userType}</p>
          </div>
        </div>
        <div>
          <button
            onClick={showLoading}
            className="bg-gray-100 px-3 2xl:px-5 py-1 2xl:py-2 rounded-md hover:bg-[#9E8566] hover:text-white duration-300 transition"
          >
            Details
          </button>
        </div>
      </div>
      <p className="mt-3">
        I am <span className="bold">{agentData.name}</span>. My RECO reg number is {agentData.recoRegNumber}
      </p>

      <Modal
        title={<p>Agent Details</p>}
        loading={loading}
        footer={null}
        open={open}
        onCancel={() => setOpen(false)}
      >
        <div>
          <div className="bg-white rounded-2xl p-3 2xl:p-5 ">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="2xl:w-[80px] w-[60px] h-[60px] 2xl:h-[80px] rounded-full bg-gray-50">
                  <img className="h-full w-full" src={agentData?.user?.profilePicture ? getFileUrl(agentData.user.profilePicture) : defaultAvatar} alt="Agent profile" />
                </div>
                <div>
                  <h3 className=" font-medium">{agentData.name}</h3>
                  <p className="text-gray-400 first-letter:uppercase">{agentData.user.userType}</p>
                </div>
              </div>
            </div>
            <p className="mt-3">I am <span className="bold">{agentData.name}</span>. My RECO reg number is {agentData.recoRegNumber}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AgentCard;
