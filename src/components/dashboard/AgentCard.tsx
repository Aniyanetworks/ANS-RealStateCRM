import { Modal } from "antd";
import { useState } from "react";
import { getFileUrl } from "../../utils/constant";

type AgentData = {
  id: number;
  name: string;
  recoRegNumber?: string;
  email?: string;
  cellPhone?: string;
  city?: string;
  user?: {
    profilePicture?: string | null;
    userType?: string;
  };
};

interface AgentCardProps {
  agentData: AgentData;
}

const initialsOf = (name: string) =>
  String(name || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Avatar = ({ agentData, size }: { agentData: AgentData; size: number }) =>
  agentData?.user?.profilePicture ? (
    <img
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
      src={getFileUrl(agentData.user.profilePicture)}
      alt={agentData.name}
    />
  ) : (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size / 2.6,
        background: "linear-gradient(135deg,#0f766e,#14b8a6)",
        boxShadow: "0 0 0 2px #99f6e4",
      }}
    >
      {initialsOf(agentData.name)}
    </div>
  );

const AgentCard: React.FC<AgentCardProps> = ({ agentData }) => {
  const [open, setOpen] = useState<boolean>(false);
  const role = agentData?.user?.userType || "agent";
  const reco = agentData.recoRegNumber;

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm transition hover:shadow-md sm:gap-3 sm:p-4">
      <Avatar agentData={agentData} size={typeof window !== "undefined" && window.innerWidth < 640 ? 36 : 48} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-gray-800">{agentData.name}</h3>
        <p className="truncate text-xs capitalize text-gray-500">
          {role}
          {reco ? ` · RECO #${reco}` : ""}
        </p>
      </div>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-md border border-teal-200 px-2.5 py-1 text-[11px] text-[#0f766e] sm:px-3 sm:py-1.5 sm:text-[12px] transition hover:bg-[#0f766e] hover:text-white"
      >
        Details
      </button>

      <Modal title="Agent Details" footer={null} open={open} onCancel={() => setOpen(false)}>
        <div className="flex items-center gap-4">
          <Avatar agentData={agentData} size={72} />
          <div>
            <h3 className="text-base font-semibold text-gray-800">{agentData.name}</h3>
            <p className="text-sm capitalize text-gray-500">{role}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-[110px_1fr] gap-y-2 text-sm">
          {reco && (
            <>
              <dt className="text-gray-500">RECO reg. no.</dt>
              <dd className="text-gray-800">{reco}</dd>
            </>
          )}
          {agentData.email && (
            <>
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-800">{agentData.email}</dd>
            </>
          )}
          {agentData.cellPhone && (
            <>
              <dt className="text-gray-500">Phone</dt>
              <dd className="text-gray-800">{agentData.cellPhone}</dd>
            </>
          )}
        </dl>
      </Modal>
    </div>
  );
};

export default AgentCard;
