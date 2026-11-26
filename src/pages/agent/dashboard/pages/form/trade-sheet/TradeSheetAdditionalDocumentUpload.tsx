// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { Link, useParams } from "react-router-dom";
import PaperworkAdditional from "../../../../../../components/tradesheet/PaperworkAdditional";

const TradeSheetAdditionalDocumentUpload: React.FC = ({uuid}) => {
  // const { uuid } = useParams<{ uuid?: string }>();

  return (
    <div>
      <h2 className="uppercase text-center bg-[#c9c1c13d] py-5">Trade Sheet Additional Upload</h2>
      {/* <div className="flex justify-between items-center">
        <div></div>
        <Link to="/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list" className="primary-btn mx-3 mt-2">Go Back</Link>
      </div> */}
      <div className="max-w-full mt-2 mb-16 border border-gray-300/30 rounded-md ">
        <div className="p-5 bg-white rounded-xl">
          <div>
            <PaperworkAdditional  uuid={uuid}/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeSheetAdditionalDocumentUpload;
