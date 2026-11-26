// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import 'react-quill-new/dist/quill.snow.css';

import React, {
  useEffect,
  useState,
} from 'react';

import {
  Button,
  Modal,
  notification,
} from 'antd';
import toast from 'react-hot-toast';
import { FaCopy } from 'react-icons/fa';
import ReactQuill from 'react-quill-new';
import Select from 'react-select';

import DocumentShare from '../../components/DocumentShare/DocumentShare';
import TableLoader from '../../components/loader/TableLoader';
import {
  useGetSpacificTradeSheetListDataQuery,
} from '../../redux/api/agent/trade-sheet/tradeSheetSlice';
import {
  useGetLawyerDataQuery,
} from '../../redux/api/superadmin/lawyerDataSlice';
import {
  useSendMailMutation,
  useShareDocumentMutation,
} from '../../redux/api/superadmin/shareDocumentSlice';
import {
  useGetTemplateBuilderListQuery,
} from '../../redux/api/superadmin/templateBuilderSlice';
import { useAppSelector } from '../../redux/hooks';
import capitalizeFirstLetter from '../../utils/capitalizeFirstLetter';
import { getFileUrl } from '../../utils/constant';

type UploadFileType = {
    id: number;
    uploadFileNameId: number;
    status: string;
    filePath: string;
};

type PaperworkDocumentType = {
    id: number;
    uploadFileName: {
        name: string;
    };
    required: string;
    paperType: string;
    filePath: string;
};

const ShareTradeSheetDocument: React.FC = ({uuid, onClose}:any) => {
    
    const [fetchLoading, setFetchLoading] = useState<boolean>(false);
    const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
    const [selectedOtherFilePaths, setSelectedOtherFilePaths] = useState<string[]>([]);
    const [isSharePopupOpen, setSharePopupOpen] = useState<boolean>(false);
    const [isShareLinkPopupOpen, setShareLinkPopupOpen] = useState<boolean>(false);
    const [shareLink, setShareLink] = useState<string>("");
    const [email, setEmail] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [emailError, setEmailError] = useState<string>("");
    const [bodyError, setBodyError] = useState<string>("");
    const [subjectError, setSubjectError] = useState<string>("");
    const [subject, setSubject] = useState("");
    const [fromEmail, setFromEmail] = useState("");
    const [lawyerListData, setLawyerListData] = useState<any[]>([]);
    const [selectedLawyers, setSelectedLawyers] = useState<any[]>([]);
    const [tradeData, setTradeData] = useState<any[]>([]);
    const { user } = useAppSelector((state) => state.user);
    const {
        data: spacificTradeSheetLisData,
        isLoading,
        refetch,
    } = useGetSpacificTradeSheetListDataQuery(uuid);

    const { data: fetchlawyerListData} = useGetLawyerDataQuery("");

    const { data: rawTemplates } = useGetTemplateBuilderListQuery({ type: "email", area: "tradesheet_share_document" });
    const templates = rawTemplates?.data?.templateBuilders?.filter(t => t.status === "active") || [];
    

    const [paperworkDocuments, setPaperworkDocuments] = useState<PaperworkDocumentType[]>([]);


    useEffect(() => {
        if (!isLoading && spacificTradeSheetLisData) {
            setFetchLoading(true);
            setPaperworkDocuments(spacificTradeSheetLisData?.data?.tradeSheetData?.paperWorkAttachmentFiles);
            setTradeData(spacificTradeSheetLisData?.data?.tradeSheetData);
            setFetchLoading(false);
        }
        if(tradeData.representation == 'seller')
        {
            setSubject(`${tradeData?.tradeSheetTypeId || ''} - ${tradeData?.properties?.[0]?.address || ''} ,${tradeData?.properties?.[0]?.city?.name || ''} - ${capitalizeFirstLetter(tradeData?.representation) || ''} - ${tradeData?.sellerInformations?.[0]?.firstName || ''} ${tradeData?.sellerInformations?.[0]?.lastName || ''}`);
        }
        else
        {
            setSubject(`${tradeData?.tradeSheetTypeId || ''} - ${tradeData?.properties?.[0]?.address || ''} ,${tradeData?.properties?.[0]?.city?.name || ''} - ${capitalizeFirstLetter(tradeData?.representation) || ''} - ${tradeData?.buyerInformations?.[0]?.firstName || ''} ${tradeData?.buyerInformations?.[0]?.lastName || ''}`); 
        }
        if(fetchlawyerListData)
        {
            setLawyerListData(fetchlawyerListData.data?.lawyerData) 
        }
        if(user)
        {
            setFromEmail(user?.email); 
        }
    }, [isLoading, spacificTradeSheetLisData,fetchlawyerListData, user, tradeData,subject]);

    const handleCheckboxChange = (filePath: string) => {
        setSelectedFilePaths(prev => 
            prev.includes(filePath) 
                ? prev.filter(path => path !== filePath) 
                : [...prev, filePath]
        );
    };

    const handleOtherCheckboxChange = (filePath: string) => {
        setSelectedOtherFilePaths(prev => 
            prev.includes(filePath) 
                ? prev.filter(path => path !== filePath) 
                : [...prev, filePath]
        );
    };

    const [shareDocument] = useShareDocumentMutation();

    const handleShare = async (expiration: string, passphrase: string) => {
        const data = {
            expiration: expiration,
            password: passphrase,
            filePaths: [...selectedFilePaths, ...selectedOtherFilePaths],
        };
        const response = await shareDocument(data);
        if(response.data.status){
            setShareLinkPopupOpen(true);
            setShareLink(`${window.location.origin}/shared-document/${response.data.data.uuid}`);
            setEmailBody(`Here is the link of shared documents: <a href="${window.location.origin}/shared-document/${response.data.data.uuid}">${window.location.origin}/shared-document/${response.data.data.uuid}</a>`);
            refetch();
        }
    };

    const handleShareLinkPopupClose = () => {
        setShareLinkPopupOpen(false);
        setShareLink("");
        setEmail("");
        setEmailBody("");
        setSubject("");
        setSelectedLawyers([]);
        
    };

    const handleShareButton = () => {
        if (selectedFilePaths.length === 0 && selectedOtherFilePaths.length === 0) {
            notification.error({
                message: 'Selection Error',
                description: 'Please select at least one file to share.',
            });
            return;
        }
        setSharePopupOpen(true);
    };

    const cancelShare = () => {
        setSharePopupOpen(false);
    };

    const [sendMail] = useSendMailMutation();

    const handleSendMail = async () => {
        setEmailError("");
        setBodyError("");
        setSubjectError("");

        if (email.trim() === "") {
            setEmailError("Please enter a valid email address.");
            return;
        }

        if (subject.trim() === "") {
            setSubjectError("Please enter an email subject.");
            return;
        }

        if (emailBody.trim() === "") {
            handleCopyLink();
            setBodyError("Please enter a valid email body.");
            return;
        }

        const data = {
            fromEmail: fromEmail,
            email: email,
            body: emailBody,
            subject: subject,
            tradeSheetId: tradeData?.id,
            filePaths: [...selectedFilePaths, ...selectedOtherFilePaths],
        };

        const response = await sendMail(data);
        if (response.data.status) {
            toast.success("The email has been sent successfully.");
            handleShareLinkPopupClose();
            notification.success({
                message: 'Email Sent',
                description: 'The email has been sent successfully.',
            });
        } else {
            toast.error("The email has failed to send.");
            setBodyError("The email has failed to send.");
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareLink).then(() => {
            notification.success({
                message: 'Link Copied',
                description: 'The share link has been copied to your clipboard.',
            });
            setEmailBody(`Here is the link to the shared document: ${shareLink}`);
        }).catch(err => {
            notification.error({
                message: 'Copy Failed',
                description: 'Failed to copy the link. Please try again.',
            });
        });
    };

    const handleLawyerSelect = (selectedOptions: any) => {
        const selectedLawyersList = selectedOptions ? selectedOptions.map((option: any) => ({
            id: option.value,
            name: option.label,
            email: option.email
        })) : [];
        setSelectedLawyers(selectedLawyersList);
        const lawyerEmails = selectedLawyersList.map((lawyer: any) => lawyer.email).join(', ');
        setEmail(lawyerEmails);
    };

    if (isLoading || fetchLoading) {
        return <TableLoader />;
    }
    return (
        <div className="bg-white">
            <div className="flex bg-white px-2 py-2 items-center justify-between">
                <div className="w-[80px] ">
                    <p>SN</p>
                </div>
                <div className="w-full">
                    <p className="font-bold">Uploaded Attachments List - {subject}</p>
                </div>
            </div>

            <div className="pb-5">
                {paperworkDocuments?.map((document: PaperworkDocumentType, index: number) => (
                    <div key={index}>
                        <div
                            className={`flex px-2 border-b  border-[#eaf4f2] hover:bg-[#f8f8f8e3] py-2 items-center justify-between`}
                        >
                            <div className="w-[80px] ">
                                <p>{index + 1}</p>
                            </div>
                            <div className="w-full flex gap-1 items-center">
                                <p className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        onChange={() => handleCheckboxChange(document.filePath)} 
                                    />
                                    {document.uploadFileName.name.slice(0, 70)}
                                    {document.uploadFileName.name.length > 70 ? "  ..." : ""}
                                </p>
                                {document.filePath && (
                                    <div className="flex items-center">
                                        <p>
                                            <a
                                                href={getFileUrl(document.filePath)}
                                                target="_blank"
                                                className=" text-blue-500"
                                            >
                                                {"  "}
                                                {document.filePath.split(/[/\\]/).pop()}
                                            </a>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                <div>
                    
                    {spacificTradeSheetLisData?.data?.tradeSheetData?.paperWorkOtherAttachments?.map(
                        (file: UploadFileType, index: number) => (
                            <div
                                key={index}
                                className="ml-20 py-2 border-b border-[#eaf4f2] "
                            >
                                <p className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        onChange={() => handleOtherCheckboxChange(file.filePath)} 
                                    />
                                    <a
                                        href={getFileUrl(file.filePath)}
                                        target="_blank"
                                        className="text-blue-500"
                                    >
                                       {file.filePath.split(/[/\\]/).pop()}
                                    </a>
                                </p>
                            </div>
                        )
                    )}
                </div>
                <div className="flex justify-end my-5 mx-5 gap-2">
                    <button 
                        className="primary-btn text-white px-4 py-2 rounded-md" 
                        onClick={handleShareButton}
                    >
                        Share
                    </button>
                    <Button
                        key="cancel"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                </div>
            </div>
            <Modal
                title="Share Document"
                open={isSharePopupOpen}
                onCancel={cancelShare}
                footer={null}
                maskClosable={false}
            >
                <DocumentShare 
                    isOpen={isSharePopupOpen} 
                    onClose={cancelShare} 
                    onShare={handleShare} 
                />
            </Modal>

            <Modal
                title="Share Link"
                open={isShareLinkPopupOpen}
                onCancel={handleShareLinkPopupClose}
                onOk={handleSendMail}
                width={800}
                footer={[
                    <div className="flex justify-end gap-2">
                        <button 
                            key="close" 
                            className="cancel-btn text-white px-4 py-2 rounded-md" 
                            onClick={handleShareLinkPopupClose}
                        >
                            Close
                        </button>
                        <button 
                            key="send" 
                            className="primary-btn text-white px-4 py-2 rounded-md" 
                            onClick={handleSendMail}
                        >
                            Send Email
                        </button>
                    </div>
                ]}
                maskClosable={false}
            >
                <div className="flex items-center">
                    <p className="mr-2">{shareLink}</p>
                    <button 
                        className="text-blue-500"
                        onClick={handleCopyLink}
                    >
                        <FaCopy /> 
                    </button>
                </div>
                <p className="text-red-500 font-semibold">
                    Note: If you close this popup, the link cannot be found anymore. Please copy it!
                </p>
                <div className="mb-4">
                    <label className="block font-medium text-gray-700 mb-1">Sender email</label>
                    <input
                        type="text"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        placeholder="Enter sender email"
                        className="border rounded-md px-4 py-2 w-full mb-1"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient's Email <span className="text-red-500">*</span></label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (e.target.value.trim() !== "") {
                                setEmailError("");
                            }
                        }}
                        placeholder="Enter recipient's email"
                        className="border rounded-md px-4 py-2 w-full mb-1"
                        required
                    />
                    {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                </div>
                <div className="mb-4">
                    <label className="block  font-medium text-gray-700 mb-1">Select Lawyer Email</label>
                    <Select
                        isMulti
                        name="lawyers"
                        options={lawyerListData?.map((lawyer: any) => ({
                            value: lawyer.id,
                            label: lawyer.name,
                            email: lawyer.email
                        }))}
                        className="basic-multi-select mb-1"
                        classNamePrefix="select"
                        value={selectedLawyers.map(lawyer => ({
                            value: lawyer.id,
                            label: lawyer.name,
                            email: lawyer.email
                        }))}
                        onChange={handleLawyerSelect}
                        placeholder="Select lawyers..."
                        isSearchable={true}
                    />
                </div>
                <div className="mb-4">
                    <label className="block font-medium text-gray-700 mb-1">Enter email subject <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => {
                            setSubject(e.target.value);
                            if (e.target.value.trim() !== "") {
                                setSubjectError("");
                            }
                        }}
                        placeholder="Enter email subject"
                        className="border rounded-md px-4 py-2 w-full mb-1"
                        required
                    />
                    {subjectError && <p className="text-red-500 text-sm">{subjectError}</p>}
                </div>
                <div className="mb-4">
                    <label className="block font-medium text-gray-700 mb-1">Select Template</label>
                    <Select
                        name="template"
                        options={templates?.map((template: any) => ({
                            value: template.uuid,
                            label: template.name,
                            content: template.content
                        }))}
                        className="basic-single-select mb-1"
                        classNamePrefix="select"
                        onChange={(selectedOption: any) => {
                            if (selectedOption) {
                                const shareLinkPart = emailBody.includes('Here is the link to the shared document:') 
                                    ? emailBody.substring(emailBody.indexOf('Here is the link to the shared document:'))
                                    : '';
                                
                                setEmailBody(selectedOption.content + (shareLinkPart ? '\n\n' + shareLinkPart : ''));
                            }
                        }}
                        placeholder="Select a template..."
                        isSearchable={true}
                    />
                </div>
                <div className="mb-4">
                    <label className="block font-medium text-gray-700 mb-1">Email Body</label>
                    <div className="mb-20">
                        <ReactQuill
                            value={emailBody}
                            onChange={(content) => {
                                setEmailBody(content);
                                if (content.trim() !== "") {
                                    setBodyError("");
                                }
                            }}
                            placeholder="Write your email body here..."
                            className="mb-1"
                            style={{ height: '200px' }}
                        />
                    </div>
                    {bodyError && <p className="text-red-500 text-sm">{bodyError}</p>}
                </div>
            </Modal>
        </div>
    );
};

export default ShareTradeSheetDocument;
