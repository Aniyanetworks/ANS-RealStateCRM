import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../redux/hooks";
import { getFileUrl } from "../../../utils/constant";
import { useChangeAgreementStepMutation } from "../../../redux/api/superadmin/agent/agentManagementSlice";
import toast from "react-hot-toast";

const AgreementPageTwo = () => {
  const { user } = useAppSelector((state) => state.user);
  const data = {
    pageNumber: 2,
    totalPages: 5
  }

  const [changeAgreementStep] = useChangeAgreementStepMutation();
  const navigate = useNavigate();

  const handleChangeStep = async () => {
    const res = await changeAgreementStep( {       
      step: 3,
      id: user.agentAccount[0].id,
    });
    if(res){
      toast.success("Agreement save successfully!");
      navigate('/agent/agent-agreeement-page-three', { replace: true });
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

      {/* Legal Text */}
      <div className="space-y-6 text-sm">
        <div className="ml-8">
          <p className="mb-4">
            <span className="mr-4 font-bold">3.2</span>
            The Salesperson shall furnish their own automobile and pay all expenses thereon and shall carry liability and property
            damage insurance satisfactory to the Brokerage. The Salesperson shall provide proof of such insurance to the
            Brokerage upon request.
          </p>
          
          <p className="mb-2">
            <span className="mr-4 font-bold">3.3</span>
            The Salesperson shall during the Term of this Agreement:
          </p>
          <div className="ml-8 mb-4">
            <p className="mb-2">a) maintain in good standing all registrations required by the Act and Regulations necessary to trade in real estate;</p>
            <p>b) be a member in good standing of RECO and TRREB.</p>
          </div>

          <p className="mb-4">
            <span className="mr-4 font-bold">3.4</span>
            The Salesperson shall maintain errors and omissions and such other insurance as RECO may require from time to time.
          </p>

          <p className="mb-4">
            <span className="mr-4 font-bold">3.5</span>
            The Salesperson shall obtain and maintain HST registration as required by the Excise Tax Act (Canada) as amended from time to time.
          </p>

          <p className="mb-4">
            <span className="mr-4 font-bold">3.6</span>
            The Salesperson shall not obligate the Brokerage for goods or services.
          </p>

          <p className="mb-4">
            <span className="mr-4 font-bold">3.7</span>
            The Salesperson shall only use such real estate forms that have been approved by the Brokerage prior to their use.
          </p>

          <p className="mb-4">
            <span className="mr-4 font-bold">3.8</span>
            The Salesperson has read and agrees to the office policy as outlined in the Brokerage's office policy manual
            and agree to conduct themselves accordingly and in accordance with any amendments thereto
            communicated to the Salesperson in writing from time to time.
          </p>

          <p className="mb-4">
            <span className="mr-4 font-bold">3.9</span>
            The Brokerage may set-off against the Salesperson's commission or other amounts the Brokerage may owe
            the Salesperson or any amount due to the Brokerage from the Salesperson including without limitation
            payable to the Brokerage pursuant to Article Five of this Agreement.
          </p>
        </div>

        <div>
          <h3 className="font-bold mb-2">ARTICLE FOUR - COMMISSIONS</h3>
          <div className="ml-8">
            <p className="mb-4">
              <span className="mr-4 font-bold">4.1</span>
              The full amount of all gross commissions resulting from real estate transactions procured by the Salesperson
              and received by the Brokerage as required by the Act shall be credited to the Salesperson's account and shall
              remain the property of the Salesperson.
            </p>

            <p className="mb-4">
              <span className="mr-4 font-bold">4.2</span>
              All credit balances in the Salesperson's account shall be paid by the Brokerage to the Salesperson on with
              arrangement basis, net of fees and other amounts owed to the Brokerage by the Salesperson.
            </p>

            <p className="mb-4">
              <span className="mr-4 font-bold">4.3</span>
              The commission to be charged for any transaction shall be determined solely by the Salesperson and shall
              belong to the Salesperson. The parties acknowledge that the Act requires that commission be collected only
              by the Brokerage.
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-2">ARTICLE FIVE - FEES, EXPENSES AND COSTS</h3>
          <div className="ml-8">
            <p className="mb-4">
              <span className="mr-4 font-bold">5.1</span>
              The Salesperson agrees to pay the Brokerage the Fees set out in Plan "A", "B" or "C", as applicable, which form
              part of this Agreement.
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-2">ARTICLE SIX - REPRESENTATION AGREEMENTS AND CUSTOMER SERVICE AGREEMENTS</h3>
          <div className="ml-8">
            <p className="mb-4">
              <span className="mr-4 font-bold">6.1</span>
              All representation agreements and customer service agreements are the property of the Brokerage according
              to the Act during the term of this Agreement. Upon termination of this Agreement, the Brokerage agrees to
              terminate any representation agreements or customer service agreements procured by the Salesperson.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-12">
        <p className="text-sm">Page {data.pageNumber} of {data.totalPages}</p>
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

export default AgreementPageTwo;