/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck

import {
  useEffect,
  useState,
  useRef,
} from 'react';

import { Tabs } from 'antd';
import moment from 'moment';
import {
  FaHistory,
  FaPlus,
  FaPrint,
  FaRegClock,
} from 'react-icons/fa';
import { FaMinus } from 'react-icons/fa6';
import html2pdf from 'html2pdf.js';

import AgentBasicInfo from '../../../../../../components/dashboard/tradeSheet/preview/AgentBasicInfo';
import AgentDetails from '../../../../../../components/dashboard/tradeSheet/preview/AgentDetails';
import LayerDetails from '../../../../../../components/dashboard/tradeSheet/preview/LayerDetails';
import Propertydetails from '../../../../../../components/dashboard/tradeSheet/preview/Propertydetails';
import PropertydetailsSeller from '../../../../../../components/dashboard/tradeSheet/preview/PropertydetailsSeller';
import SellerAndBuyerInfo from '../../../../../../components/dashboard/tradeSheet/preview/SellerAndBuyerInfo';
import SubmittedDocuments from '../../../../../../components/dashboard/tradeSheet/preview/SubmittedDocuments';
import TradeSheetPaperworkFileManager from './TradeSheetPaperworkFileManager';
import TradeSheetPaperworkFileManagerMultipleRepresentation from './TradeSheetPaperworkFileManagerMultipleRepresentation';
import TradeSheetNote from '../../../../../../components/dashboard/tradeSheet/TradeSheetNote';
import { useGetSpacificTradeSheetListDataQuery } from '../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice';
import { useAppSelector } from '../../../../../../redux/hooks';
import type { RootState } from '../../../../../../redux/store';
import { useGetTradeSheetNoteQuery } from '../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice';
import html2canvas from 'html2canvas';

interface ActivityLog {
  id: number;
  action: string;
  historyText: string;
  createdAt: string;
  activitySubArea?: string;
}

interface TradeSheetNoteType {
  uuid: string;
  note: string;
  createdAt: string;
  owner?: {
    name: string;
  };
}

const TradeSheetSeparatePreviewPage = ({ uuid }: { uuid: string }) => {
  const { user } = useAppSelector((state: RootState) => state.user);
  const { data, refetch } = useGetSpacificTradeSheetListDataQuery(uuid);
  const previewRef = useRef<HTMLDivElement>(null);
  const pdfExportRef = useRef<HTMLDivElement>(null);

  const agentBasicInfoData = data?.data?.tradeSheetData || {};
  const propertieDetailsData = data?.data?.tradeSheetData?.properties?.[0] || {};
  const conditionsData = data?.data?.tradeSheetData?.conditions || [];
  const sellerInformationsData = data?.data?.tradeSheetData?.sellerInformations || [];
  const buyerInformationsData = data?.data?.tradeSheetData?.buyerInformations || [];
  const agentDetailsData = data?.data?.tradeSheetData?.agentDetails?.[0] || {};
  const sharedUsers = data?.data?.tradeSheetData?.sharedUsers|| [];
  const lawyerDetailsData = data?.data?.tradeSheetData?.lawyerDetails?.[0] || {};

  const [isActivityLogExpanded, setIsActivityLogExpanded] = useState(false);
  const [isLawyerShareLogExpanded, setIsLawyerShareLogExpanded] = useState(false);
  const [activityLogSearch, setActivityLogSearch] = useState('');
  const [lawyerShareLogSearch, setLawyerShareLogSearch] = useState('');
  const [isInvoiceSendLogExpanded, setIsInvoiceSendLogExpanded] = useState(false);

  const toggleActivityLogExpand = () => setIsActivityLogExpanded((prev) => !prev);
  const toggleLawyerShareLogExpand = () => setIsLawyerShareLogExpanded((prev) => !prev);
  const toggleInvoiceSendLogExpand = () => {
    setIsInvoiceSendLogExpanded(prev => !prev);
  };

  // Document Share Log (only share-document-email)
  const documentShareLogs = data?.data?.tradeSheetData?.activityLog?.filter(
    (log: ActivityLog) => log.activitySubArea === "share-document-email"
  ) || [];
  const [isDocumentShareLogExpanded, setIsDocumentShareLogExpanded] = useState(false);
  const [documentShareLogSearch, setDocumentShareLogSearch] = useState('');
  const toggleDocumentShareLogExpand = () => setIsDocumentShareLogExpanded((prev) => !prev);

  const filteredDocumentShareLogs = documentShareLogs.filter((log: ActivityLog) =>
    log.historyText?.toLowerCase().includes(documentShareLogSearch.toLowerCase())
  );

  useEffect(() => {
    if (isActivityLogExpanded || isLawyerShareLogExpanded || isDocumentShareLogExpanded) {
      refetch();
    }
  }, [isActivityLogExpanded, isLawyerShareLogExpanded, isDocumentShareLogExpanded, refetch]);

  // Separate activity logs
  const activityLogs: ActivityLog[] = data?.data?.tradeSheetData?.activityLog || [];
  const lawyerShareLogs = activityLogs.filter((log: ActivityLog) => log.action === "lawyer_share");
  // Exclude lawyer_share and share-document-email logs from otherLogs
  const otherLogs = activityLogs.filter(
    (log: ActivityLog) => log.action !== "lawyer_share" && log.activitySubArea !== "share-document-email"
  );

  // Filtered logs based on search
  const filteredActivityLogs = otherLogs.filter((log: ActivityLog) =>
    log.historyText.toLowerCase().includes(activityLogSearch.toLowerCase())
  );
  const filteredLawyerShareLogs = lawyerShareLogs.filter((log: ActivityLog) =>
    log.historyText.toLowerCase().includes(lawyerShareLogSearch.toLowerCase())
  );

  const handleDownloadPDF = () => {
    const input = pdfExportRef.current;
    if (!input) return;
    
    // Clone the element to avoid modifying the original
    const element = input.cloneNode(true) as HTMLElement;
    
    // Remove the absolute positioning used for hiding
    element.style.position = 'relative';
    element.style.left = '0';
    element.style.top = '0';
    element.style.width = '100%';
    element.style.zIndex = '1';
    element.style.background = '#fff';
    
    // Create a container for the PDF content
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    
    // Add logo and header
    const header = document.createElement('div');
    header.style.textAlign = 'center';
    header.style.marginBottom = '20px';
    
    const logo = document.createElement('img');
    logo.src = '/logo.png';
    logo.style.width = '40px';
    logo.style.height = '20px';
    logo.style.margin = '0 auto 10px';
    
    const title = document.createElement('div');
    title.textContent = 'DREAM VALLEY REALTY';
    title.style.color = '#9F8667';
    title.style.fontWeight = 'bold';
    title.style.fontSize = '16px';
    title.style.marginBottom = '20px';
    
    const tradeNumber = document.createElement('div');
    tradeNumber.textContent = ` ${data?.data?.tradeSheetData?.tradeSheetTypeId || "N/A"}`;
    tradeNumber.style.fontWeight = 'bold';
    tradeNumber.style.textTransform = 'uppercase';
    tradeNumber.style.marginBottom = '20px';
    tradeNumber.style.backgroundColor = '#c9c1c13d';
    tradeNumber.style.padding = '10px';
    
    header.appendChild(logo);
    header.appendChild(title);
    header.appendChild(tradeNumber);
    
    // Add header and content to container
    container.appendChild(header);
    container.appendChild(element);
    
    // Set options for PDF generation
    const opt = {
      margin: 10,
      filename: 'tradesheet-preview.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate PDF
    html2pdf().set(opt).from(container).save();
  };

  const handlePrint = async () => {
  const input = pdfExportRef.current;
  if (!input) return;
  
  // Create a canvas of the export-only section
  const canvas = await html2canvas(input, { 
    scale: 2, 
    backgroundColor: '#fff',
    useCORS: true,
    logging: false
  });
  const imgData = canvas.toDataURL('image/png');
  
  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return;
  }
  
  iframeDoc.open();
  iframeDoc.write(`
    <html>
      <head>
        <title>Trade Sheet - ${data?.data?.tradeSheetData?.tradeSheetTypeId || "N/A"}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            text-align: center;
          }
          .header {
            margin-bottom: 20px;
          }
          .logo {
            width: 40px;
            height: 20px;
            margin: 0 auto 10px;
          }
          .title {
            color: #9F8667;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .trade-number {
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 20px;
            background-color: #c9c1c13d;
            padding: 10px;
          }
          .preview-image {
            max-width: 100%;
            height: auto;
            display: block;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 0; 
            }
            .header {
              margin-bottom: 10px;
            }
          }
          @page {
            margin: 0.5in;
          }
        </style>
      </head>
      <body>        
        <img src="${imgData}" class="preview-image" alt="Trade Sheet Preview">
      </body>
    </html>
  `);
  iframeDoc.close();
  
  // Wait for image to load
  const img = iframeDoc.querySelector('img');
  if (img) {
    img.onload = function() {
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 100);
      }, 500);
    };
  } else {
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 100);
    }, 1000);
  }
};

  const items = [
    {
      key: 'preview',
      label: 'Preview',
      children: (
        <div className="max-w-full mt-2 p-2 border border-gray-300/30 rounded-md">
          <div className="max-w-full mx-auto px-0">
            <div>
              <AgentBasicInfo basicInfo={agentBasicInfoData} />
              {(agentBasicInfoData?.representation === "buyer" || agentBasicInfoData?.representation === "tenant") ? (
                <Propertydetails propertyDetails={propertieDetailsData} conditions={conditionsData} />
              ) : (
                <PropertydetailsSeller
                  propertyDetails={propertieDetailsData}
                  conditions={conditionsData}
                  showPriceTypeUnit={agentBasicInfoData?.listType === "Commercial"}
                />
              )}
              <SellerAndBuyerInfo
                sellerInfo={sellerInformationsData}
                buyerInfo={buyerInformationsData}
              />
              <AgentDetails agentDetails={agentDetailsData} sharedUsers={sharedUsers} />

              {(agentBasicInfoData?.representation === "buyer" || agentBasicInfoData?.representation === "seller" || agentBasicInfoData?.multipleRepresentation === "seller,buyer" || agentBasicInfoData?.multipleRepresentation === "buyer,seller") && (
                <LayerDetails lawyerDetails={lawyerDetailsData} />
              )}

              <SubmittedDocuments
                documents={data?.data?.tradeSheetData?.paperWorkAttachmentFiles}
                otherDocuments={
                  data?.data?.tradeSheetData?.paperWorkOtherAttachments
                }
              />
            </div>

            {/* Activity Log Section */}
            {user?.userType === "superAdmin" && otherLogs.length > 0 && (
              <div className="mt-10 mb-6">
                <h3
                  className="border-t border-gray-400 bg-[#243451] text-white border-x text-center text-sm font-bold py-1 cursor-pointer flex justify-between items-center px-4"
                  onClick={toggleActivityLogExpand}
                >
                  <span>ACTIVITY LOG</span>
                  {isActivityLogExpanded ? (
                    <FaMinus className="text-white" />
                  ) : (
                    <FaPlus className="text-white" />
                  )}
                </h3>

                {isActivityLogExpanded && (
                  <div className="max-h-[400px] overflow-y-auto space-y-3">
                    <div className="p-2 bg-gray-100 border border-gray-400">
                      <input
                        type="text"
                        placeholder="Search Activity Log..."
                        value={activityLogSearch}
                        onChange={e => setActivityLogSearch(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>

                    <table className="w-full text-xs border-collapse border border-gray-400">
                      <colgroup>
                        <col className="w-3/5" />
                        <col className="w-2/5" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Details</th>
                          <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredActivityLogs
                          .slice()
                          .sort((a, b) => b.id - a.id)
                          .map((log: ActivityLog) => (
                            <tr
                              key={log.id}
                              className="hover:bg-gray-50 transition duration-150"
                            >
                              <td className="border border-gray-400 px-3 py-1.5 text-left">
                                <FaHistory className="inline mr-1" />
                                {log.historyText}
                              </td>
                              <td className="border border-gray-400 px-3 py-1.5 text-left whitespace-nowrap">
                                <FaRegClock className="inline mr-1" />
                                {moment(log.createdAt).format("D MMMM YYYY [at] h:mm A")}
                              </td>
                            </tr>
                          ))}
                        {filteredActivityLogs.length === 0 && (
                          <tr>
                            <td
                              colSpan={2}
                              className="border border-gray-400 px-3 py-1.5 text-center text-gray-500"
                            >
                              No logs found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Lawyer Share Log Section */}
            {user?.userType === "superAdmin" && lawyerShareLogs.length > 0 && (
              <div className="mb-6">
                <h3
                  className="border-t border-gray-400 bg-[#243451] text-white border-x text-center text-sm font-bold py-1 cursor-pointer flex justify-between items-center px-4"
                  onClick={toggleLawyerShareLogExpand}
                >
                  <span>LAWYER SHARE LOG</span>
                  {isLawyerShareLogExpanded ? (
                    <FaMinus className="text-white" />
                  ) : (
                    <FaPlus className="text-white" />
                  )}
                </h3>

                {isLawyerShareLogExpanded && (
                  <div className="max-h-[400px] overflow-y-auto space-y-3">
                    <div className="p-2 bg-gray-100 border border-gray-400">
                      <input
                        type="text"
                        placeholder="Search Lawyer Share Log..."
                        value={lawyerShareLogSearch}
                        onChange={e => setLawyerShareLogSearch(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>

                    <table className="w-full text-xs border-collapse border border-gray-400">
                      <colgroup>
                        <col className="w-3/5" />
                        <col className="w-2/5" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Details</th>
                          <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLawyerShareLogs
                          .slice()
                          .sort((a, b) => b.id - a.id)
                          .map((log: ActivityLog) => (
                            <tr
                              key={log.id}
                              className="hover:bg-gray-50 transition duration-150"
                            >
                              <td className="border border-gray-400 px-3 py-1.5 text-left">
                                <FaHistory className="inline mr-1" />
                                {log.historyText}
                              </td>
                              <td className="border border-gray-400 px-3 py-1.5 text-left whitespace-nowrap">
                                <FaRegClock className="inline mr-1" />
                                {moment(log.createdAt).format("D MMMM YYYY [at] h:mm A")}
                              </td>
                            </tr>
                          ))}
                        {filteredLawyerShareLogs.length === 0 && (
                          <tr>
                            <td
                              colSpan={2}
                              className="border border-gray-400 px-3 py-1.5 text-center text-gray-500"
                            >
                              No logs found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Document Share Log Section */}
            {user?.userType === "superAdmin" && documentShareLogs.length > 0 && (
              <div className="mb-6">
                <h3
                  className="border-t border-gray-400 bg-[#243451] text-white border-x text-center text-sm font-bold py-1 cursor-pointer flex justify-between items-center px-4"
                  onClick={toggleDocumentShareLogExpand}
                >
                  <span>DOCUMENT SHARE LOG</span>
                  {isDocumentShareLogExpanded ? (
                    <FaMinus className="text-white" />
                  ) : (
                    <FaPlus className="text-white" />
                  )}
                </h3>

                {isDocumentShareLogExpanded && (
                  <div className="max-h-[400px] overflow-y-auto space-y-3">
                    <div className="p-2 bg-gray-100 border border-gray-400">
                      <input
                        type="text"
                        placeholder="Search Document Share Log..."
                        value={documentShareLogSearch}
                        onChange={e => setDocumentShareLogSearch(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>

                    <table className="w-full text-xs border-collapse border border-gray-400">
                      <colgroup>
                        <col className="w-3/5" />
                        <col className="w-2/5" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Details</th>
                          <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocumentShareLogs
                          .slice()
                          .sort((a, b) => b.id - a.id)
                          .map((log: ActivityLog) => (
                            <tr
                              key={log.id}
                              className="hover:bg-gray-50 transition duration-150"
                            >
                              <td className="border border-gray-400 px-3 py-1.5 text-left">
                                <FaHistory className="inline mr-1" />
                                <div dangerouslySetInnerHTML={{ __html: log.historyText }} />
                              </td>
                              <td className="border border-gray-400 px-3 py-1.5 text-left whitespace-nowrap">
                                <FaRegClock className="inline mr-1" />
                                {moment(log.createdAt).format("D MMMM YYYY [at] h:mm A")}
                              </td>
                            </tr>
                          ))}
                        {filteredDocumentShareLogs.length === 0 && (
                          <tr>
                            <td
                              colSpan={2}
                              className="border border-gray-400 px-3 py-1.5 text-center text-gray-500"
                            >
                              No logs found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Trade Notes Log Section */}
            {user?.userType === "superAdmin" && data?.data?.tradeSheetData?.id && (
              <TradeNotesLogSection tradeSheetId={data.data.tradeSheetData.id} />
            )}

            {/* Invoice Send Log Section */}
            {user?.userType === "superAdmin" && (
              <div className="mb-6">
                <h3
                  className="border-t border-gray-400 bg-[#243451] text-white border-x text-center text-sm font-bold py-1 cursor-pointer flex justify-between items-center px-4"
                  onClick={toggleInvoiceSendLogExpand}
                >
                  <span>INVOICE SEND LOG</span>
                  {isInvoiceSendLogExpanded ? (
                    <FaMinus className="text-white" />
                  ) : (
                    <FaPlus className="text-white" />
                  )}
                </h3>

                {isInvoiceSendLogExpanded && (
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-xs border-collapse border border-gray-400">
                      <colgroup>
                        <col className="w-1/6" />
                        <col className="w-1/6" />
                        <col className="w-1/6" />
                        <col className="w-1/6" />
                        <col className="w-1/6" />
                        <col className="w-1/6" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Invoice ID</th>
                          <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Status</th>
                          <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Selling Commission</th>
                          <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Sale Price</th>
                          <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Total Commission</th>
                          <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.data?.tradeSheetData?.tradeCommissionInvoiceRecords?.map((record: {
                          id: number;
                          invoiceId?: string;
                          status: string;
                          sellingCommission: number;
                          salePrice: number;
                          totalCommission: number;
                          gstCommission: number;
                          createdAt: string;
                        }) => (
                          <tr
                            key={record.id}
                            className="hover:bg-gray-50 transition duration-150"
                          >
                            <td className="border border-gray-400 px-3 py-1.5 text-left">
                              {record.invoiceId ?? "N/A"}
                            </td>
                            <td className="border border-gray-400 px-3 py-1.5 text-left">
                              {record.status}
                            </td>
                            <td className="border border-gray-400 px-3 py-1.5 text-left">
                              ${record.sellingCommission}
                            </td>
                            <td className="border border-gray-400 px-3 py-1.5 text-left">
                              ${record.salePrice}
                            </td>
                            <td className="border border-gray-400 px-3 py-1.5 text-left">
                              ${record.totalCommission} (GST: ${record.gstCommission})
                            </td>
                            <td className="border border-gray-400 px-3 py-1.5 text-left whitespace-nowrap">
                              <FaRegClock className="inline mr-1" />
                              {moment.utc(record.createdAt).format("D MMM YYYY [at] h:mm A")}
                            </td>
                          </tr>
                        ))}
                        {(!data?.data?.tradeSheetData?.tradeCommissionInvoiceRecords ||
                          data?.data?.tradeSheetData?.tradeCommissionInvoiceRecords.length === 0) && (
                            <tr>
                              <td
                                colSpan={6}
                                className="border border-gray-400 px-3 py-1.5 text-center text-gray-500"
                              >
                                No invoice records found
                              </td>
                            </tr>
                          )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'notes',
      label: 'Notes',
      children: (
        <div className="mt-4">
          {data?.data?.tradeSheetData?.id && (
            <TradeSheetNote tradeSheetId={data.data.tradeSheetData.id} />
          )}
        </div>
      ),
    },
    {
      key: 'fileManager',
      label: 'File Manager',
      children: (
        <div className="mt-4">
          {data?.data?.tradeSheetData?.representationType == "single" ? (
            <TradeSheetPaperworkFileManager uuid={data?.data?.tradeSheetData?.uuid} />
          ) : (
            <TradeSheetPaperworkFileManagerMultipleRepresentation
              uuid={data?.data?.tradeSheetData?.uuid}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Hidden export-only section for PDF generation */}
      <div ref={pdfExportRef} style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px', background: '#fff', zIndex: -1 }}>
        <div className="max-w-full mt-2 p-2 border border-gray-300/30 rounded-md">
          <h2 className="uppercase text-center bg-[#c9c1c13d] py-5">
             {data?.data?.tradeSheetData?.tradeSheetTypeId || "N/A"}-{propertieDetailsData?.propertyAddress || "N/A"}
          </h2>
          <div className="max-w-full mx-auto px-0">
            <div>
              <AgentBasicInfo basicInfo={agentBasicInfoData} />
              {(agentBasicInfoData?.representation === "buyer" || agentBasicInfoData?.representation === "tenant") ? (
                <Propertydetails propertyDetails={propertieDetailsData} />
              ) : (
                <PropertydetailsSeller
                  propertyDetails={propertieDetailsData}
                  showPriceTypeUnit={agentBasicInfoData?.listType === "Commercial"}
                />
              )}
              <SellerAndBuyerInfo
                sellerInfo={sellerInformationsData}
                buyerInfo={buyerInformationsData}
              />
              <AgentDetails agentDetails={agentDetailsData} sharedUsers={sharedUsers} />

              {(agentBasicInfoData?.representation === "buyer" || agentBasicInfoData?.representation === "seller" || agentBasicInfoData?.multipleRepresentation === "seller,buyer" || agentBasicInfoData?.multipleRepresentation === "buyer,seller") && (
                <LayerDetails lawyerDetails={lawyerDetailsData} />
              )}

              {/* Always show  SUBMITTED DOCUMENT heading, even if no documents */}
              <div style={{ marginTop: 24 }}>
                <SubmittedDocuments
                  documents={data?.data?.tradeSheetData?.paperWorkAttachmentFiles}
                  otherDocuments={
                    data?.data?.tradeSheetData?.paperWorkOtherAttachments
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Visible UI section with tabs and logs */}
      <div ref={previewRef}>
        <div className="relative">
          <div className="bg-[#c9c1c13d] py-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
            <h2 className="uppercase text-center sm:text-left m-0 text-sm md:text-base break-all leading-snug flex-1">
              {data?.data?.tradeSheetData?.tradeSheetTypeId || "N/A"}-{propertieDetailsData?.propertyAddress || "N/A"}
            </h2>
            <div className="flex gap-2 flex-shrink-0">
              <button
                className="primary-btn my-0 flex items-center gap-2 text-sm px-3 py-1.5"
                onClick={handlePrint}
              >
                <FaPrint /> Print
              </button>
              <button
                className="primary-btn my-0 text-sm px-3 py-1.5"
                onClick={handleDownloadPDF}
              >
                Download
              </button>
            </div>
          </div>
        </div>
        {items && (
          <Tabs items={items} />
        )}
      </div>
    </div>
  );
};

export default TradeSheetSeparatePreviewPage;

// Trade Notes Log Section Component
const TradeNotesLogSection = ({ tradeSheetId }: { tradeSheetId: number }) => {
  const { data } = useGetTradeSheetNoteQuery({ tradeSheetId });
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState('');

  const notes = (data?.data?.NoteData || [])
    .filter((note: TradeSheetNoteType) => note.note?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mb-6">
      <h3
        className="border-t border-gray-400 bg-[#243451] text-white border-x text-center text-sm font-bold py-1 cursor-pointer flex justify-between items-center px-4"
        onClick={() => setIsExpanded(e => !e)}
      >
        <span>TRADE NOTES LOG</span>
        {isExpanded ? <FaMinus className="text-white" /> : <FaPlus className="text-white" />}
      </h3>
      {isExpanded && (
        <div className="max-h-[400px] overflow-y-auto space-y-3">
          <div className="p-2 bg-gray-100 border border-gray-400">
            <input
              type="text"
              placeholder="Search Trade Notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <table className="w-full text-xs border-collapse border border-gray-400">
            <colgroup>
              <col className="w-3/5" />
              <col className="w-2/5" />
            </colgroup>
            <thead>
              <tr>
                <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Note</th>
                <th className="border border-gray-400 px-3 py-1.5 bg-gray-100 font-semibold text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {notes.length > 0 ? notes
                .slice()
                .sort((a: TradeSheetNoteType, b: TradeSheetNoteType) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((note: TradeSheetNoteType) => (
                  <tr key={note.uuid} className="hover:bg-gray-50 transition duration-150">
                    <td className="border border-gray-400 px-3 py-1.5 text-left">
                      <span className="flex items-center gap-2 flex-nowrap">
                        <FaHistory className="inline mr-1 flex-shrink-0" />
                        <span className="font-semibold text-gray-700 mr-2 whitespace-nowrap flex-shrink-0">{note.owner?.name || 'N/A'}</span>
                      </span>
                      <span className="text-gray-800" dangerouslySetInnerHTML={{ __html: note.note }} />
                    </td>
                    <td className="border border-gray-400 px-3 py-1.5 text-left whitespace-nowrap">
                      <FaRegClock className="inline mr-1" />
                      {moment.utc(note.createdAt).format("D MMMM YYYY [at] h:mm A")}
                    </td>
                  </tr>
                )) : (
                <tr>
                  <td colSpan={2} className="border border-gray-400 px-3 py-1.5 text-center text-gray-500">
                    No notes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};