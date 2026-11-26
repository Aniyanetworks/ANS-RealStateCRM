import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../redux/hooks";
import { getFileUrl } from "../../../utils/constant";
import { useChangeAgreementStepMutation } from "../../../redux/api/superadmin/agent/agentManagementSlice";
import toast from "react-hot-toast";

const AgreementPageThree = () => { 
  const { user } = useAppSelector((state) => state.user);
  const data = {
    authenticationId: "1FA745CB-0B97-EF11-88CF-002248259057",
    pageNumber: 3,
    totalPages: 5,
    companyName: "ANS REALSTATECRM INC."
  }

  const [changeAgreementStep] = useChangeAgreementStepMutation();
  const navigate = useNavigate();

  const handleChangeStep = async () => {
    const res = await changeAgreementStep( {       
      step: 4,
      id: user.agentAccount[0].id,
    });
    if(res){
      toast.success("Agreement save successfully!");
      navigate('/agent/agent-agreeement-page-four', { replace: true });
    }
  }

  return (
    <div className="max-w-[850px] mx-auto p-8 bg-white">

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
        <div>
          <h3 className="font-bold mb-2">ARTICLE SEVEN - ADVERTISING</h3>
          <p className="ml-8">
            <span className="mr-4 font-bold">7.1</span>
            All advertising to be approved by the Brokerage in advance.
          </p>
        </div>

        <div>
          <h3 className="font-bold mb-2">ARTICLE EIGHT - TERMINATION</h3>
          <div className="ml-8 space-y-4">
            <p>
              <span className="mr-4 font-bold">8.1</span>
              This Agreement may be terminated by either party at any time without cause upon 24 hours written notice
              that may be delivered personally or by facsimile. Upon termination both parties agree to complete their
              obligations herein in order to complete an orderly conclusion of their relationship. The Salesperson will not
              have any claim on real estate transactions that have not been procured from representation agreements prior
              to termination, or any future commissions therefrom.
            </p>
            <p>
              <span className="mr-4 font-bold">8.2</span>
              Upon termination of this Agreement, the Salesperson will return to the Brokerage all keys, listings, listing
              books, blueprints, signs, plans, maps, supplies and sales literature received at any time from the Brokerage.
              The Salesperson agrees to pay the Brokerage for the value of such items that were not returned upon
              termination of this Agreement.
            </p>
            <p>
              <span className="mr-4 font-bold">8.3</span>
              If on termination the Salesperson is indebted to the Brokerage then until such debt has been paid, the
              amount outstanding from time to time shall bear interest at the rate of 5 (Five) per cent per annum calculated
              and payable monthly.
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-2">ARTICLE NINE - TERM</h3>
          <p className="ml-8">
            <span className="mr-4 font-bold">9.1</span>
            Any and all changes to this Agreement from one year to the next will be announced at a meeting of the
            salespeople on or about each year. This Agreement will commence on the date hereof and run until the end of
            the current calendar year and subject to announced changes, if any, and termination as provided for herein,
            this Agreement will automatically renew annually (the "Term").
          </p>
        </div>

        <div>
          <h3 className="font-bold mb-2">ARTICLE TEN - BROKERAGE'S SUPPLIES</h3>
          <p className="ml-8">
            <span className="mr-4 font-bold">10.1</span>
            The Salesperson shall only use supplies which conform to the Brokerage's current specifications and
            standards, including signs, business cards, stationery and other items used for communications or
            presentations to customers and prospective customers and all promotional and novelty items.
          </p>
        </div>

        <div>
          <h3 className="font-bold mb-2">ARTICLE ELEVEN - LITIGATION, DISPUTE AND ARBITRATION</h3>
          <div className="ml-8 space-y-4">
            <p>
              <span className="mr-4 font-bold">11.1</span>
              If any transaction in which the Salesperson is involved results in a dispute, arbitration, litigation or legal
              expense, the Salesperson shall co-operate fully with the Brokerage in the resolution or prosecution of same.
              All at salespersons costs.
            </p>
            <p>
              <span className="mr-4 font-bold">11.2</span>
              The Brokerage reserves the right to determine whether or not any litigation or dispute concerning any
              transaction in which the Salesperson is involved shall be prosecuted, defended or settled, or whether or not
              legal expense shall be incurred.
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-2">ARTICLE TWELVE - DEPOSITS</h3>
          <p className="ml-8">
            <span className="mr-4 font-bold">12.1</span>
            All monies, documents or property received by the Salesperson in connection with any transaction shall be
            delivered to the Brokerage immediately. All cheques must be made payable to {data.companyName}.
            By cheque, bank draft or money order. It is against the company policy to receive cash deposit. Agents are not
            permitted to act on behalf of a client by taking cash deposits, even if the deposit is being held by another
            Brokerage.
          </p>
        </div>
      </div>

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

export default AgreementPageThree;