import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../redux/hooks";
import { getFileUrl } from "../../../utils/constant";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

const AgreementPageSevent = () => {

    const { user } = useAppSelector((state) => state.user);
    const navigate = useNavigate();
    const [agent, setAgent] = useState<any>(null);

    useEffect(() => {
        if (user.agentAccount) {
            console.log(user.agentAccount);
            
            setAgent(user.agentAccount[0])
        }
    }, [user.agentAccount,]);

    const handleChangeStep = async () => {

        toast.success("Application save successfully!");
        navigate('/agent-information-submit', { replace: true });

    }

    return (
        <div className="max-w-[850px] mx-auto p-8 bg-white">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 border border-gray-300">
                    <img
                        src="/logo.png"
                        alt="Dream Valley Realty Inc. Logo"
                        className="w-full h-full object-contain"
                    />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">DREAM VALLEY REALTY INC.</h1>
                    <h2 className="text-lg">INDEPENDENT CONTRACTOR&apos;S AGREEMENT</h2>
                </div>
            </div>

            <h3 className="text-center font-semibold text-lg underline mb-6">
                INDEPENDENT CONTRACTOR&apos;S DETAILS
            </h3>

            <div className="space-y-4">
                <FormRow label="Name:" value={`${agent?.name}`} />
                <FormRow label="PREC Name (If available):" value={agent?.precName || ''} />
                <FormRow label="Address:" value={agent?.address || ''} />
                <FormRow label="Cell Phone #:" value={agent?.cellPhone || ''} />
                <FormRow
                    label="RECO Reg. # & Expiry date:"
                    value={`${agent?.recoRegNumber || ''}, ${agent?.recoExpiryDate && !isNaN(new Date(agent.recoExpiryDate).getTime()) ? new Date(agent.recoExpiryDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) : ''}`}
                />
                <FormRow label="TRREB member:" value={agent?.trrebMemberId || ''} />
                <FormRow label="S.I.N:" value={agent?.sin || ''} />
                <FormRow
                    label="D.O.B"
                    value={agent?.dob && !isNaN(new Date(agent.dob).getTime()) ? new Date(agent.dob).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) : ''}
                />
                <FormRow label="Email address:" value={agent?.email || ''} />
                <FormRow label="Emergency Contact:" value={agent?.emergencyContact || ''} />
                <FormRow label="HST No." value={agent?.hstNo || ''} />
                <FormRow label="PREC HST #" value={agent?.precHstNo || ''} />
                <FormRow label="Expected Gross" value={`$${agent?.expectedGross?.toFixed(2) || ''}`} />
            </div>


            <div className="mt-12 space-y-2">
                <div className="pt-4">
                    <div className="flex flex-col items-end">
                        {/* Signature Image */}
                        <div className="w-16 h-12 flex items-end justify-end">
                            <img src={getFileUrl(user?.signature)} alt="Signature" className="object-contain" />
                        </div>
                        {/* Signature Text */}
                        <div className="border-t border-gray-300 text-end text-sm italic">
                            (Signature of Salesperson)
                        </div>
                    </div>
                </div>
            </div>


            {/* Footer */}
            <div className="flex justify-between items-center mt-12">
                <p className="text-sm">Page 7 of 7</p>
                <div className="flex gap-4">
                    <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
                        <img src={getFileUrl(user?.initial)} alt="" />
                    </div>
                    <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
                        {agent?.agreementStatus === 'approved' && (
                            <img src={getFileUrl(agent?.approvedUser?.signature)} alt="" />
                        )}
                    </div>
                </div>
            </div>
            <div className="flex justify-end mt-5">
                <button onClick={handleChangeStep} className="primary-btn">Save & Finish</button>
            </div>
        </div>
    );
}
function FormRow({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex">
        <div className="w-1/3">{label}</div>
        <div className="w-2/3 border-b border-gray-300">{value}</div>
      </div>
    )
  }
export default AgreementPageSevent;

