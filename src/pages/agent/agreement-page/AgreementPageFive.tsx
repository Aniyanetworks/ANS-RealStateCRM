// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../redux/hooks";
import { getFileUrl } from "../../../utils/constant";
import toast from "react-hot-toast";
import { useChangeAgreementStepMutation } from "../../../redux/api/superadmin/agent/agentManagementSlice";
import { formatDate27September2012 } from "../../../utils/formatDateUtils";

const AgreementPageFive = () => { 

  const { user } = useAppSelector((state) => state.user);
  const navigate = useNavigate();
  const [changeAgreementStep] = useChangeAgreementStepMutation();
  const handleChangeStep = async () => {
    const res = await changeAgreementStep({
      step: 6,
      id: user.agentAccount[0].id,
    });
    if(res){
      toast.success("Agreement save successfully!");
      navigate('/agent/agent-agreeement-page-six', { replace: true });
    }
    // toast.success("Application save successfully!");
    // navigate('/agent-information-submit', { replace: true });
    
  }

  // Function to format the date to "DD Month YYYY"
  const formatDate = (date:any) => {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const currentDate = new Date();

  const data = {
    pageNumber: 5,
    totalPages: 5,
    signatures: {
      salesperson: {
        name: "Mahnaz Rahman",
        signature: "Mahnaz Rahman",
        date: formatDate(currentDate) // Set current date
      },
      broker: {
        signature: getFileUrl(user.signature),
        date: formatDate(currentDate) // Set current date
      }
    }
  };

  return (
    <div className="max-w-[850px] mx-auto p-8 bg-white">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 border border-gray-300">
          <img
            src="/logo.svg"
            alt="ANS RealStateCRM Inc. Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold">ANS REALSTATECRM INC.</h1>
          <h2 className="text-lg">INDEPENDENT CONTRACTOR&apos;S AGREEMENT</h2>
        </div>
      </div>

      {/* Legal Text */}
      <div className="space-y-6 text-sm">
        <p className="mb-6">
          Any such notice or communication shall be deemed received on the
          earlier of actual receipt, if delivered or on the date transmitted, if
          by email unless received after 5:00 p.m. on a business day (i.e. a day
          other than a Saturday or Sunday or statutory holiday in Ontario) in
          which case receipt will be deemed to be on the next business day.
          Either party may change its address for service by giving notice
          thereof pursuant to the term of this Section.
        </p>

        <p className="mb-6">
          <span className="mr-4 font-bold">16.6</span>
          Each party agrees, at the request of the other party, to do, execute
          and give such further and other acts, documents and assurances as may
          be reasonably requested in order to give full effect to this Agreement
          and to the transactions contemplated herein.
        </p>

        <p>
          <span className="font-bold mb-8">IN WITNESS</span> whereof the parties
          have duly signed the Agreement as of the date indicated.
        </p>

        {/* Signature Section */}
        <div className="space-y-12 mt-16">
          {/* First Row */}
          <div className="grid grid-cols-[1fr_2fr_1fr] gap-8 items-end">
            <div className="pt-1">
              <div className="h-12 flex items-center justify-center">
                {user.name}
              </div>
              <p className="border-t border-black text-center">
                (Witness)
              </p>
            </div>
            <div className="pt-1">
              <div className="w-16 h-12 flex items-center justify-center">
                <img src={getFileUrl(user.signature)} alt="" className="" />
              </div>
              <p className="border-t border-black text-center">
                (Signature of Salesperson)
              </p>
            </div>
            <div className="pt-1">
              <div className="h-12 flex items-center justify-center">
                {formatDate27September2012(data.signatures.salesperson.date)}
              </div>
              <p className="border-t border-black text-center">Date</p>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-[1fr_2fr_1fr] gap-8 items-end">
            <div className="pt-1">
              <div className="h-12 flex items-center justify-center">
                {data?.signatures?.broker?.name}
              </div>
              <p className="border-t border-black text-center">
                (Witness)
              </p>
            </div>
            <div className="pt-1">
              <div className="w-16 h-12 flex items-center justify-center"></div>
              <p className="border-t border-black">
                (Signature of Authorized Signing Officer of Brokerage)
              </p>
            </div>
            <div className="pt-1">
              <div className="h-12 flex items-center justify-center">
                {formatDate27September2012(data.signatures.broker.date)}
              </div>
              <p className="border-t border-black text-center">Date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-12">
        <p className="text-sm">
          Page {data.pageNumber} of {data.totalPages}
        </p>
        <div className="flex gap-4">
          <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
            <img src={getFileUrl(user.initial)} alt="" />
          </div>
          <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
            {user.agentAccount[0].status == "approved" && (
              <img src={getFileUrl(user.signature)} alt="" />
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-5">
        <button onClick={handleChangeStep} className="primary-btn">
          Save & Finish
        </button>
      </div>
    </div>
  );
}

export default AgreementPageFive;