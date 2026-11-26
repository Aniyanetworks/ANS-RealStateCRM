// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import TradeSheetSteps from "../../../../../../components/Stepper/TradeSheetSteps";
import { useParams } from "react-router-dom";

import Paperwork from "../../../../../../components/tradesheet/Paperwork";

const TradeSheetPaperworkAttachmentUpload: React.FC = () => {
  const { uuid } = useParams<{ uuid?: string }>();

  return (
    <div>
      <TradeSheetSteps active={8} uuid={uuid} />

      <div className="max-w-full mt-8 mb-16 border border-gray-300/30 rounded-md ">
        <div className="p-5 bg-white rounded-xl">
          <div>
            <Paperwork />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeSheetPaperworkAttachmentUpload;
