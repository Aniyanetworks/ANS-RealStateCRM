import React from 'react';
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../redux/hooks";
import { getFileUrl } from "../../../utils/constant";
import { useChangeAgreementStepMutation } from "../../../redux/api/superadmin/agent/agentManagementSlice";
import toast from "react-hot-toast";

const AgreementPageFour: React.FC = () => {
  const { user } = useAppSelector((state) => state.user);
  const [changeAgreementStep] = useChangeAgreementStepMutation();
  const navigate = useNavigate();

  const handleChangeStep = async () => {
    const res = await changeAgreementStep( {       
      step: 5,
      id: user.agentAccount[0].id,
    });
    if(res){
      toast.success("Agreement save successfully!");
      navigate('/agent/agent-agreeement-page-five', { replace: true });
    }
  }
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

      <div className="space-y-6 text-sm">
        {/* ARTICLE THIRTEEN - CORRESPONDENCE */}
        <div>
          <h3 className="font-bold mb-2">ARTICLE THIRTEEN - CORRESPONDENCE</h3>
          <p className="ml-8 mb-4">
            <span className="mr-4 font-bold">13.1</span>
            All letters received and a copy of all letters written by the Salesperson pertaining to the business of the
            Brokerage shall be turned over to the Brokerage for its records and shall be the property of the Brokerage. All
            letters are to be approved by the Brokerage before mailing.
          </p>
        </div>

        {/* ARTICLE FOURTEEN - INDEMNITY */}
        <div>
          <h3 className="font-bold mb-2">ARTICLE FOURTEEN - INDEMNITY</h3>
          <p className="ml-8 mb-4">
            <span className="mr-4 font-bold">14.1</span>
            The Salesperson hereby indemnifies the Brokerage against all liability, loss, damages, costs and expenses
            sustained, suffered or incurred by the Brokerage as a result of any breach by the Salesperson of the
            Salesperson's obligations under this Agreement or as a result of any claim by a third party arising out of the
            Salesperson's real estate business activities. This indemnity shall survive the termination of this Agreement.
          </p>
        </div>

        {/* ARTICLE FIFTEEN - USE AND DISTRIBUTION OF PERSONAL INFORMATION */}
        <div>
          <h3 className="font-bold mb-2">ARTICLE FIFTEEN - USE AND DISTRIBUTION OF PERSONAL INFORMATION</h3>
          <p className="ml-8 mb-4">
            <span className="mr-4 font-bold">15.1</span>
            The Salesperson consents to the collection, use and disclosure of personal information of the Salesperson by the
            Brokerage for the purpose of a transfer, sale, or financing by the Brokerage of the business, or compliance with
            the requirements of the Real Estate Council of Ontario, or such other use of the personal information as may be
            required by law. The Salesperson acknowledges that the Brokerage may retain such personal information for as long
            as necessary to fulfill these purposes.
          </p>
        </div>

        <div>
          <h3 className="font-bold mb-2">ARTICLE SIXTEEN- GENERAL AGREEMENT TERMS</h3>
          <p className="ml-8 mb-4">
            <span className="mr-4 font-bold">16.1</span>
            Either party may waive any default of the other party under this Agreement, but, no such waiver shall affect
            the rights of that party in respect of any subsequent default, whether of the same or a different nature
          </p>
          <p className="ml-8 mb-4">
            <span className="mr-4 font-bold">16.2</span>
            This Agreement which includes Schedule(s) “A”, Consisting of Plan A, Plan B or Plan C as appropriate, shall
            constitute the entire agreement between the parties with respect to its subject matter and supersedes all prior
            agreements and understandings in any way relating to that subject matter. This Agreement can only be
            changed by a writing signed by both parties. No remedy conferred on a party under this Agreement, or by law,
            shall preclude the exercise by that party of any other remedy available to it in equity or in law in respect of the
            same default.
          </p>
          <p className="ml-8 mb-4">
            <span className="mr-4 font-bold">16.3</span>
            This Agreement is personal to the Salesperson and no right of the Salesperson under this Agreement may be
            assigned without the prior written consent of the Brokerage, which consent may be arbitrarily, or unreasonably
            withheld. The Brokerage may, without the consent of the Salesperson, assign any of its rights under the
            Agreement and, following such assignment, shall be relieved of all obligations in respect of the rights so
            assigned. Subject to the foregoing, this Agreement shall enure to the benefit and be binding upon the parties
            and their respective heirs, executors, administrators, successors and permitted assigns.
          </p>
          <p className="ml-8 mb-4">
            <span className="mr-4 font-bold">16.4</span>
            The use of section headings in this Agreement is for convenience of reference only and shall not affect the
            interpretation of this Agreement.
          </p>
          <p className="ml-8 mb-4">
            <span className="mr-4 font-bold">16.5</span>
            All notices or other communications required or permitted under this Agreement to be given by one party to
            the other shall be in writing and shall be given by personal delivery (including courier), or by facsimile to the
            party as follows:
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-12">
        <p className="text-sm">Page 4 of 5</p>
        <div className="flex gap-4">
          <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
          <img src={getFileUrl(user.initial)} alt="" />
          </div>
          <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
            {user.agentAccount[0].status=='approved' && (<img src={getFileUrl(user.signature)} alt="" />)}
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-5">
        <button onClick={handleChangeStep} className="primary-btn">Agree & Next</button>
      </div>
    </div>
  );
}


export default AgreementPageFour;