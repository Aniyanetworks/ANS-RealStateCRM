import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../redux/hooks";
import { getFileUrl } from "../../../utils/constant";
import { useChangeAgreementStepMutation } from "../../../redux/api/superadmin/agent/agentManagementSlice";
import toast from "react-hot-toast";

const getCurrentDate = () => {
  const currentDate = new Date();
  const day = currentDate.getDate().toString().padStart(2, '0'); // Day (02, 03, ...)
  const month = currentDate.toLocaleString('default', { month: 'long' }); // Month (January, February, ...)
  const year = currentDate.getFullYear(); // Full year (2024)

  return {
    day,
    month,
    year
  };
};

const AgreementPageOne = () => {

  const { user } = useAppSelector((state) => state.user);

  const currentDate = getCurrentDate();

  const data = {
    contractDate: currentDate, // Use dynamic current date
    broker: {
      name: "DREAM VALLEY REALTY INC., BROKERAGE",
      title: "BROKER"
    },
    salesperson: {
      name: "Mahnaz Rahman",
      title: "SALESPERSON"
    }
  }

  const [changeAgreementStep] = useChangeAgreementStepMutation();
  const navigate = useNavigate();

  const handleChangeStep = async () => {
    const res = await changeAgreementStep( {       
      step: 2,
      id: user.agentAccount[0].id,
    });
    if(res){
      toast.success("Agreement save successfully!");
      navigate('/agent/agent-agreeement-page-two', { replace: true });
    }
  }

  return (
    <div className="max-w-[850px] mx-auto p-8 bg-white">

      {/* Header */}
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



      {/* Agreement Intro */}
      <div className="mb-8 text-center">
        <p className="mb-4">
          THIS INDEPENDENT CONTRACTOR'S AGREEMENT is made in duplicate for a term of one year,
        </p>
        <p className="mb-4">
          beginning <span className="underline px-1">{data.contractDate.day}</span> day of{" "}
          <span className="underline px-1">{data.contractDate.month}</span> in the year{" "}
          <span className="underline px-1">{data.contractDate.year}</span>
        </p>
      </div>

      {/* Parties */}
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-[100px_1fr] gap-2">
          <p className="font-bold">BETWEEN:</p>
          <div>
            <p className="font-bold">{data.broker.name}</p>
            <p className="text-sm">(Herein referred to as {data.broker.title})</p>
          </div>
        </div>

        <div className="grid grid-cols-[100px_1fr] gap-2">
          <p className="font-bold">AND:</p>
          <div>
            <p className="font-bold">{user.name}</p>
            <p className="text-sm">(Herein referred to as {data.salesperson.title})</p>
          </div>
        </div>
      </div>

      {/* Legal Text */}
      <div className="space-y-6 mb-8 text-sm">
        <p>
          In this Agreement, the term "Salesperson" includes a Broker registered under the Real Estate and Business Brokers Act,
          2002.
        </p>

        <div>
          <p className="font-bold mb-2">WHEREAS:</p>
          <ol className="list-[upper-alpha] ml-6 space-y-4">
            <li>
              The Brokerage is a duly registered real estate brokerage pursuant to the Real Estate and Business Brokers Act,
              2002 (Ontario) (the "Act") and the regulations made pursuant thereto (the "Regulations") and owns, for the
              purpose thereof, all facilities and equipment required to conduct a real estate brokerage business.
            </li>
            <li>
              The Salesperson is an independent contractor desiring access to such facilities and equipment for the purpose
              of conducting therefrom a real estate business.
            </li>
          </ol>
        </div>

        <p>
          NOW THEREFORE in consideration of the mutual covenants and agreements and for other good and valuable
          consideration as herein provided, the receipt and sufficiency of which is hereby acknowledged, the parties hereto
          hereby agree as follows:
        </p>

        <div>
          <h3 className="font-bold mb-2">ARTICLE ONE - APPOINTMENT</h3>
          <p className="ml-8">
            <span className="mr-4 font-bold">1.1</span>
            The Brokerage hereby retains and appoints the Salesperson as an independent contractor in accordance with
            this Agreement and the Salesperson hereby accepts such appointment as an independent contractor upon
            and subject to the terms, conditions, covenants and provisions set forth herein. The parties acknowledge that
            the Salesperson is a self-employed independent contractor and is not and shall not represent himself or
            herself to be a partner or employee of the Brokerage or to have any relationship to the Brokerage other than as
            a self-employed independent contractor.
          </p>
        </div>

        <div>
          <h3 className="font-bold mb-2">ARTICLE TWO - FACILITIES</h3>
          <p className="ml-8">
            <span className="mr-4 font-bold">2.1</span>
            The Broker shall make available, at the agreed price, and the Salesperson shall maintain and be responsible for all
            necessary office equipments including space, computers, printers, desk, chairs and telephone.
          </p>
        </div>

        <div>
          <h3 className="font-bold mb-2">ARTICLE THREE - GENERAL CONDITIONS</h3>
          <p className="ml-8">
            <span className="mr-4 font-bold">3.1</span>
            The Salesperson shall govern their conduct by the Act and Regulations and the constitution, by-laws, and all
            requirements of the Real Estate Council of Ontario ("RECO") all as may be amended from time to time.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-12">
        <p className="text-sm">Page 1 of 5</p>
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

export default AgreementPageOne;