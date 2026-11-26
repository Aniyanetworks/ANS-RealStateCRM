// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useNavigate, useParams } from "react-router-dom";
import { getFileUrl } from "../../utils/constant";
import {
  useChangeAgentAgreementStatusMutation,
  useGetSingleAgentDataQuery,
} from "../../redux/api/superadmin/agent/agentManagementSlice";

import { useEffect, useRef, useState } from "react";
import { useGetOptionalPlanListDataQuery } from "../../redux/api/superadmin/plan-management/planManagementSlice";
import TableLoader from "../../components/loader/TableLoader";
import { Select } from "antd";
import toast, { LoaderIcon } from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { formatDate27September2012 } from "../../utils/formatDateUtils";
import { toDate } from "date-fns";
import SelectedPlansDisplay from "../../components/dashboard/Agent/SelectedPlan";
import SelectedDiscount from "../../components/dashboard/Agent/SelectedDiscount";
import SelectedAddonsPlans from "../../components/dashboard/Agent/SelectedAddonPlan";
// Type Definitions
interface AgentAccount {
  id: string;
  status: string;
  agreementStatus: string;
  approvedUser: {
    signature: string;
    createdAt: string;
  };
}

interface User {
  name?: string; // Full name (could be a combination of firstName, lastName, etc.)
  firstName?: string; // First name
  lastName?: string; // Last name
  precName?: string; // Prec name (may relate to a designation or title)
  address?: string; // Address of the user
  cellPhone?: string; // Cell phone number
  phoneServiceProvider?: string; // Phone service provider name
  recoRegNumber?: string; // RECO registration number
  recoExpiryDate?: Date; // RECO expiry date (mapped from DateTime)
  sin?: string; // SIN (Social Insurance Number)
  dob?: Date; // Date of birth (mapped from DateTime)
  email: string; // Email address (unique field)
  emergencyContact?: string; // Emergency contact information
  nationalIdentity?: string; // National identity number
  hstNo?: string; // HST number
  precHstNo?: string; // Prec HST number
  expectedGross?: number; // Expected gross income (floating point value)
  status?: string; // Status of the user (Enum: pending, approved, rejected)
  agreementStatus?: string; // Agreement status (Enum: pending, approved, rejected)
  agreementStep?: string; // Step in the agreement process
  remarks?: string; // Any remarks
  special_note?: string; // Special notes or remarks
  signature?: string; // Digital or file path to the user's signature
  initial: string;
  agentAccount?: AgentAccount[]; // An array of `AgentAccount` (assuming this is a related field)
  approvedUser: {
    signature: string;
    createdAt: string;
  };
  plan: {};
  optionalPlanId: string;
  approvedAt: string;
  submittedAt: string;
}

const getCurrentDate = () => {
  const currentDate = new Date();
  const day = currentDate.getDate().toString().padStart(2, "0"); // Day (02, 03, ...)
  const month = currentDate.toLocaleString("default", { month: "long" }); // Month (January, February, ...)
  const year = currentDate.getFullYear(); // Full year (2024)

  return {
    day,
    month,
    year,
  };
};

const formatDate = (
  dateString: string | Date,
  format: "full" | "short" | "medium" | "long" = "medium"
) => {
  // Ensure we have a valid date
  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  // Options for different formatting styles
  const formatOptions = {
    full: {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    },
    long: {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
    medium: {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
    short: {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    },
  };

  // Format the date based on the selected style
  return new Intl.DateTimeFormat("en-US", formatOptions[format]).format(date);
};

const AgreementPreview = () => {
  const navigate = useNavigate(); // Initialize the navigate function
  const [user, setUser] = useState<User | null>(null);
  const [agent, setAgent] = useState<User | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [optionalPlans, setOptionalPlans] = useState<any[]>([]);
  const [isStatusLoading, setIsStatusLoading] = useState<boolean>(false);
  const { uuid } = useParams(); // Destructuring the UUID from the URL
  const {
    data: agentDetails,
    isLoading,
    error,
  } = useGetSingleAgentDataQuery(uuid);
  const { data: optionalPlanData } = useGetOptionalPlanListDataQuery("");
  const agreementRef = useRef<HTMLDivElement>(null);
  const currentDate = getCurrentDate();

  // Replace the existing selector
  const auth = useSelector((state: RootState) => state.user?.user ?? null);

  useEffect(() => {
    if (agentDetails?.data?.agentDetails) {
      const agentData = agentDetails.data.agentDetails;
      setUser(agentData);
      setAgent(agentData.agentAccount?.[0] || null);
    }
  }, [agentDetails]);

  useEffect(() => {
    if (agent) {
      console.log("agent", agent);
      setPlan(agent.plan); // Set the plan data after agent is set
      const planArray = agent.optionalPlanId
        ? agent.optionalPlanId.split(",").map(Number)
        : [];
      const filteredOptionalPlans = optionalPlanData?.data?.optionalPlans
        ? optionalPlanData.data.optionalPlans.filter((plan: any) =>
            planArray.includes(Number(plan.id))
          )
        : [];
      setOptionalPlans(filteredOptionalPlans);
    }
  }, [agent, optionalPlanData]);

  const statusOptions = [
    { label: "Approved", value: "approved" },
    { label: "Pending", value: "pending" },
    { label: "Under Review", value: "underReview" },
    { label: "Draft", value: "draft" },
    { label: "Rejected", value: "rejected" },
    { label: "Closed", value: "closed" },
  ];

  const [changeAgentAgreementStatus] = useChangeAgentAgreementStatusMutation();

  const handleChangeAgreementStatus = async (newStatus: string) => {
    try {
      const content = agreementRef.current;
      setIsStatusLoading(true);

      if (newStatus === "approved") {
        setTimeout(() => {
          html2canvas(content, {
            scale: 2,
            useCORS: true, // Enable CORS for external images
            logging: true,
            allowTaint: true,
          }).then(async (canvas) => {
            const pdf = new jsPDF("p", "mm", "a4");

            const pdfWidth = pdf.internal.pageSize.getWidth();

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const scaleRatio = pdfWidth / canvasWidth;

            // Detect the positions of <hr> tags
            const hrElements = content.querySelectorAll("hr");
            const hrPositions: number[] = Array.from(hrElements).map((hr) => {
              const rect = hr.getBoundingClientRect();
              const contentRect = content.getBoundingClientRect();
              return (
                (rect.top - contentRect.top) *
                (canvas.height / content.scrollHeight)
              ); // Scale to canvas coordinates
            });

            // Add an extra point at the end of the canvas
            hrPositions.push(canvasHeight);

            let previousPosition = 0;
            hrPositions.forEach((position, index) => {
              const pageCanvas = document.createElement("canvas");
              const pageContext = pageCanvas.getContext("2d");

              const pageHeight = position - previousPosition;

              pageCanvas.width = canvasWidth;
              pageCanvas.height = pageHeight;

              // Draw the portion of the canvas corresponding to the current section
              pageContext?.drawImage(
                canvas,
                0,
                previousPosition,
                canvasWidth,
                pageHeight,
                0,
                0,
                canvasWidth,
                pageHeight
              );

              const pageImgData = pageCanvas.toDataURL("image/png");
              if (index > 0) {
                pdf.addPage();
              }

              // Set text size
              pdf.setFontSize(8); // Example: Set text size to 12
              pdf.text(`Page ${index + 1}`, 10, 10); // Add text at the top of each page

              const imgHeight = pageHeight * scaleRatio;
              pdf.addImage(pageImgData, "PNG", 0, 20, pdfWidth, imgHeight); // Place image below text

              previousPosition = position;
            });

            const pdfBlob = pdf.output("blob");
            const formData = new FormData();
            formData.append("status", newStatus);
            formData.append("id", String(agent.id));
            formData.append("pdfBlob", pdfBlob, "agreement-preview.pdf");

            const response = await changeAgentAgreementStatus(
              formData
            ).unwrap();
            setIsStatusLoading(false);
            toast.success(`${response?.message}`);
          });
        }, 500);
      } else {
        const formData = new FormData();
        formData.append("status", newStatus);
        formData.append("id", String(agent.id));

        const response = await changeAgentAgreementStatus(formData).unwrap();
        setIsStatusLoading(false);
        toast.success(`${response?.message}`);
      }
    } catch (error: any) {
      console.error(error); // Use console.error for error logging
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  if (isLoading) {
    return (
      <div>
        <TableLoader />
      </div>
    );
  }

  if (error) {
    return <div>Error loading data</div>; // Handle any potential errors
  }

  return (
    <div className="max-w-[850px] mx-auto p-8 bg-white">
      <div className="flex items-center gap-2">
        <Select
          value={agent?.agreementStatus}
          onChange={(newStatus) => handleChangeAgreementStatus(newStatus)}
          options={statusOptions}
          style={{ width: 150 }}
          disabled={isStatusLoading}
        />
        {isStatusLoading && <LoaderIcon />}

        {/* Go Back Button */}
        <button
          onClick={() => navigate("/dashboard/super-admin/agent-management")}
          className="p-2 bg-[#0b3b38] hover:bg-[#374a6d] text-sm rounded-md text-white"
        >
          Go Back
        </button>
      </div>
      {/* Note/Message */}
      <div className="text-sm text-gray-600 mt-2">
        <p>
          If you have approved this agreement, it has been saved to your
          document manager.{" "}
          <a
            href={`/dashboard/super-admin/agent-file-upload/${uuid}`}
            className="text-blue-600 underline hover:text-blue-800"
          >
            Click here to view the documents.
          </a>
        </p>
      </div>

      <div className="max-w-[850px]" ref={agreementRef}>
        <div className="mx-10 my-5">
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
              <h2 className="text-lg">
                INDEPENDENT CONTRACTOR&apos;S AGREEMENT
              </h2>
            </div>
          </div>

          {/* Agreement Intro */}
          <div className="mb-4 text-center">
            <p>
              THIS INDEPENDENT CONTRACTOR'S AGREEMENT is made in duplicate for a
              term of one year,
            </p>
            <p>
              beginning{" "}
              <span className="underline px-1">{currentDate.day}</span> day of{" "}
              <span className="underline px-1">{currentDate.month}</span> in the
              year <span className="underline px-1">{currentDate.year}</span>
            </p>
          </div>

          {/* Parties */}
          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <p className="font-bold">BETWEEN:</p>
              <div>
                <p className="font-bold">ANS REALSTATECRM INC., BROKERAGE</p>
                <p className="text-sm">(Herein referred to as BROKER)</p>
              </div>
            </div>

            <div className="grid grid-cols-[100px_1fr] gap-2">
              <p className="font-bold">AND:</p>
              <div>
                <p className="font-bold">{user?.name}</p>
                <p className="text-sm">(Herein referred to as SALESPERSON)</p>
              </div>
            </div>
          </div>

          {/* Legal Text */}
          <div className="space-y-2 mb-8 text-sm">
            <p>
              In this Agreement, the term "Salesperson" includes a Broker
              registered under the Real Estate and Business Brokers Act, 2002.
            </p>

            <div>
              <p className="font-bold mb-2">WHEREAS:</p>
              <p className="ml-8">
                <span className="mr-4 font-bold">A.</span>
                The Brokerage is a duly registered real estate brokerage
                pursuant to the Real Estate and Business Brokers Act, 2002
                (Ontario) (the "Act") and the regulations made pursuant thereto
                (the "Regulations") and owns, for the purpose thereof, all
                facilities and equipment required to conduct a real estate
                brokerage business.
              </p>
              <p className="ml-8">
                <span className="mr-4 font-bold">B.</span>
                The Salesperson is an independent contractor desiring access to
                such facilities and equipment for the purpose of conducting
                therefrom a real estate business.
              </p>
            </div>

            <p>
              NOW THEREFORE in consideration of the mutual covenants and
              agreements and for other good and valuable consideration as herein
              provided, the receipt and sufficiency of which is hereby
              acknowledged, the parties hereto hereby agree as follows:
            </p>

            <div>
              <h3 className="font-bold mb-2">ARTICLE ONE - APPOINTMENT</h3>
              <p className="ml-8">
                <span className="mr-4 font-bold">1.1</span>
                The Brokerage hereby retains and appoints the Salesperson as an
                independent contractor in accordance with this Agreement and the
                Salesperson hereby accepts such appointment as an independent
                contractor upon and subject to the terms, conditions, covenants
                and provisions set forth herein. The parties acknowledge that
                the Salesperson is a self-employed independent contractor and is
                not and shall not represent himself or herself to be a partner
                or employee of the Brokerage or to have any relationship to the
                Brokerage other than as a self-employed independent contractor.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">ARTICLE TWO - FACILITIES</h3>
              <p className="ml-8">
                <span className="mr-4 font-bold">2.1</span>
                The Broker shall make available, at the agreed price, and the
                Salesperson shall maintain and be responsible for all necessary
                office equipment including space, computers, printers, desk,
                chairs and telephone.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">
                ARTICLE THREE - GENERAL CONDITIONS
              </h3>
              <p className="ml-8">
                <span className="mr-4 font-bold">3.1</span>
                The Salesperson shall govern their conduct by the Act and
                Regulations and the constitution, by-laws, and all requirements
                of the Real Estate Council of Ontario ("RECO") all as may be
                amended from time to time.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-12">
            <p className="text-sm">Page 1 of 7</p>
            <div className="flex gap-4">
              <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
                <img src={getFileUrl(user?.initial)} alt="" />
              </div>
              <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
                <img src={getFileUrl(auth?.signature)} alt="" />
              </div>
            </div>
          </div>
        </div>

        <hr />

        <div className="mx-10 my-5">
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
              <h2 className="text-lg">
                INDEPENDENT CONTRACTOR&apos;S AGREEMENT
              </h2>
            </div>
          </div>

          {/* Legal Text */}
          <div className="space-y-6 text-sm">
            <div className="ml-8">
              <p className="mb-4">
                <span className="mr-4 font-bold">3.2</span>
                The Salesperson shall furnish their own automobile and pay all
                expenses thereon and shall carry liability and property damage
                insurance satisfactory to the Brokerage. The Salesperson shall
                provide proof of such insurance to the Brokerage upon request.
              </p>

              <p className="mb-2">
                <span className="mr-4 font-bold">3.3</span>
                The Salesperson shall during the Term of this Agreement:
              </p>
              <div className="ml-8 mb-4">
                <p className="mb-2">
                  a) maintain in good standing all registrations required by the
                  Act and Regulations necessary to trade in real estate;
                </p>
                <p>b) be a member in good standing of RECO and TRREB.</p>
              </div>

              <p className="mb-4">
                <span className="mr-4 font-bold">3.4</span>
                The Salesperson shall maintain errors and omissions and such
                other insurance as RECO may require from time to time.
              </p>

              <p className="mb-4">
                <span className="mr-4 font-bold">3.5</span>
                The Salesperson shall obtain and maintain HST registration as
                required by the Excise Tax Act (Canada) as amended from time to
                time.
              </p>

              <p className="mb-4">
                <span className="mr-4 font-bold">3.6</span>
                The Salesperson shall not obligate the Brokerage for goods or
                services.
              </p>

              <p className="mb-4">
                <span className="mr-4 font-bold">3.7</span>
                The Salesperson shall only use such real estate forms that have
                been approved by the Brokerage prior to their use.
              </p>

              <p className="mb-4">
                <span className="mr-4 font-bold">3.8</span>
                The Salesperson has read and agrees to the office policy as
                outlined in the Brokerage's office policy manual and agree to
                conduct themselves accordingly and in accordance with any
                amendments thereto communicated to the Salesperson in writing
                from time to time.
              </p>

              <p className="mb-4">
                <span className="mr-4 font-bold">3.9</span>
                The Brokerage may set-off against the Salesperson's commission
                or other amounts the Brokerage may owe the Salesperson or any
                amount due to the Brokerage from the Salesperson including
                without limitation payable to the Brokerage pursuant to Article
                Five of this Agreement.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">ARTICLE FOUR - COMMISSIONS</h3>
              <div className="ml-8">
                <p className="mb-4">
                  <span className="mr-4 font-bold">4.1</span>
                  The full amount of all gross commissions resulting from real
                  estate transactions procured by the Salesperson and received
                  by the Brokerage as required by the Act shall be credited to
                  the Salesperson's account and shall remain the property of the
                  Salesperson.
                </p>

                <p className="mb-4">
                  <span className="mr-4 font-bold">4.2</span>
                  All credit balances in the Salesperson's account shall be paid
                  by the Brokerage to the Salesperson on with arrangement basis,
                  net of fees and other amounts owed to the Brokerage by the
                  Salesperson.
                </p>

                <p className="mb-4">
                  <span className="mr-4 font-bold">4.3</span>
                  The commission to be charged for any transaction shall be
                  determined solely by the Salesperson and shall belong to the
                  Salesperson. The parties acknowledge that the Act requires
                  that commission be collected only by the Brokerage.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-12">
            <p className="text-sm">Page 2 of 5</p>
            <div className="flex gap-4">
              <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
                <img src={getFileUrl(user?.initial)} alt="" />
              </div>
              <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
                <img src={getFileUrl(auth?.signature)} alt="" />
              </div>
            </div>
          </div>
        </div>

        <hr />

        <div className="mx-10 my-5">
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
              <h2 className="text-lg">
                INDEPENDENT CONTRACTOR&apos;S AGREEMENT
              </h2>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <h3 className="font-bold mb-2">
                ARTICLE FIVE - FEES, EXPENSES AND COSTS
              </h3>
              <div className="ml-8">
                <p className="mb-4">
                  <span className="mr-4 font-bold">5.1</span>
                  The Salesperson agrees to pay the Brokerage the Fees set out
                  in Plan "A", "B" or "C", as applicable, which form part of
                  this Agreement.
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-2">
                ARTICLE SIX - REPRESENTATION AGREEMENTS AND CUSTOMER SERVICE
                AGREEMENTS
              </h3>
              <div className="ml-8">
                <p className="mb-4">
                  <span className="mr-4 font-bold">6.1</span>
                  All representation agreements and customer service agreements
                  are the property of the Brokerage according to the Act during
                  the term of this Agreement. Upon termination of this
                  Agreement, the Brokerage agrees to terminate any
                  representation agreements or customer service agreements
                  procured by the Salesperson.
                </p>
              </div>
            </div>
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
                  This Agreement may be terminated by either party at any time
                  without cause upon 24 hours written notice that may be
                  delivered personally or by facsimile. Upon termination both
                  parties agree to complete their obligations herein in order to
                  complete an orderly conclusion of their relationship. The
                  Salesperson will not have any claim on real estate
                  transactions that have not been procured from representation
                  agreements prior to termination, or any future commissions
                  therefrom.
                </p>
                <p>
                  <span className="mr-4 font-bold">8.2</span>
                  Upon termination of this Agreement, the Salesperson will
                  return to the Brokerage all keys, listings, listing books,
                  blueprints, signs, plans, maps, supplies and sales literature
                  received at any time from the Brokerage. The Salesperson
                  agrees to pay the Brokerage for the value of such items that
                  were not returned upon termination of this Agreement.
                </p>
                <p>
                  <span className="mr-4 font-bold">8.3</span>
                  If on termination the Salesperson is indebted to the Brokerage
                  then until such debt has been paid, the amount outstanding
                  from time to time shall bear interest at the rate of 5 (Five)
                  per cent per annum calculated and payable monthly.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">ARTICLE NINE - TERM</h3>
              <p className="ml-8">
                <span className="mr-4 font-bold">9.1</span>
                Any and all changes to this Agreement from one year to the next
                will be announced at a meeting of the salespeople on or about
                each year. This Agreement will commence on the date hereof and
                run until the end of the current calendar year and subject to
                announced changes, if any, and termination as provided for
                herein, this Agreement will automatically renew annually (the
                "Term").
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">
                ARTICLE TEN - BROKERAGE'S SUPPLIES
              </h3>
              <p className="ml-8">
                <span className="mr-4 font-bold">10.1</span>
                The Salesperson shall only use supplies which conform to the
                Brokerage's current specifications and standards, including
                signs, business cards, stationery and other items used for
                communications or presentations to customers and prospective
                customers and all promotional and novelty items.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mb-5 mt-12">
            <p className="text-sm">Page 3 of 7</p>
            <div className="flex gap-4">
              <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
                <img src={getFileUrl(user?.initial)} alt="" />
              </div>
              <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
                <img src={getFileUrl(auth?.signature)} alt="" />
              </div>
            </div>
          </div>
        </div>

        <hr />

        <div className="mx-10 my-5">
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
              <h2 className="text-lg">
                INDEPENDENT CONTRACTOR&apos;S AGREEMENT
              </h2>
            </div>
          </div>

          <div className="space-y-6 text-sm">
            <div>
              <h3 className="font-bold mb-2">
                ARTICLE ELEVEN - LITIGATION, DISPUTE AND ARBITRATION
              </h3>
              <div className="ml-8 space-y-3">
                <p>
                  <span className="mr-4 font-bold">11.1</span>
                  If any transaction in which the Salesperson is involved
                  results in a dispute, arbitration, litigation or legal
                  expense, the Salesperson shall co-operate fully with the
                  Brokerage in the resolution or prosecution of same. All at
                  salespersons costs.
                </p>
                <p>
                  <span className="mr-4 font-bold">11.2</span>
                  The Brokerage reserves the right to determine whether or not
                  any litigation or dispute concerning any transaction in which
                  the Salesperson is involved shall be prosecuted, defended or
                  settled, or whether or not legal expense shall be incurred.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">ARTICLE TWELVE - DEPOSITS</h3>
              <p className="ml-8">
                <span className="mr-4 font-bold">12.1</span>
                All monies, documents or property received by the Salesperson in
                connection with any transaction shall be delivered to the
                Brokerage immediately. All cheques must be made payable to DREAM
                VALLEY REALTY INC. By cheque, bank draft or money order. It is
                against the company policy to receive cash deposit. Agents are
                not permitted to act on behalf of a client by taking cash
                deposits, even if the deposit is being held by another
                Brokerage.
              </p>
            </div>
            {/* ARTICLE THIRTEEN - CORRESPONDENCE */}
            <div>
              <h3 className="font-bold mb-2">
                ARTICLE THIRTEEN - CORRESPONDENCE
              </h3>
              <p className="ml-8 mb-4">
                <span className="mr-4 font-bold">13.1</span>
                All letters received and a copy of all letters written by the
                Salesperson pertaining to the business of the Brokerage shall be
                turned over to the Brokerage for its records and shall be the
                property of the Brokerage. All letters are to be approved by the
                Brokerage before mailing.
              </p>
            </div>

            {/* ARTICLE FOURTEEN - INDEMNITY */}
            <div>
              <h3 className="font-bold mb-2">ARTICLE FOURTEEN - INDEMNITY</h3>
              <p className="ml-8 mb-4">
                <span className="mr-4 font-bold">14.1</span>
                The Salesperson hereby indemnifies the Brokerage against all
                liability, loss, damages, costs and expenses sustained, suffered
                or incurred by the Brokerage as a result of any breach by the
                Salesperson of the Salesperson's obligations under this
                Agreement or as a result of any claim by a third party arising
                out of the Salesperson's real estate business activities. This
                indemnity shall survive the termination of this Agreement.
              </p>
            </div>

            {/* ARTICLE FIFTEEN - USE AND DISTRIBUTION OF PERSONAL INFORMATION */}
            <div>
              <h3 className="font-bold mb-2">
                ARTICLE FIFTEEN - USE AND DISTRIBUTION OF PERSONAL INFORMATION
              </h3>
              <p className="ml-8 mb-4">
                <span className="mr-4 font-bold">15.1</span>
                The Salesperson consents to the collection, use and disclosure
                of personal information of the Salesperson by the Brokerage for
                the purpose of a transfer, sale, or financing by the Brokerage
                of the business, or compliance with the requirements of the Real
                Estate Council of Ontario, or such other use of the personal
                information as may be required by law. The Salesperson
                acknowledges that the Brokerage may retain such personal
                information for as long as necessary to fulfill these purposes.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-5">
            <p className="text-sm">Page 4 of 7</p>
            <div className="flex gap-4">
              <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
                <img src={getFileUrl(user?.initial)} alt="" />
              </div>
              <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
                <img src={getFileUrl(auth?.signature)} alt="" />
              </div>
            </div>
          </div>
        </div>

        <hr />

        <div className="mx-10 my-2 pb-5">
          {/* Header */}
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 border border-gray-300">
              <img
                src="/logo.svg"
                alt="ANS RealStateCRM Inc. Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ANS REALSTATECRM INC.</h1>
              <h2 className="text-lg">
                INDEPENDENT CONTRACTOR&apos;S AGREEMENT
              </h2>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2">
              ARTICLE SIXTEEN- GENERAL AGREEMENT TERMS
            </h3>
            <p className="ml-8 mb-4">
              <span className="mr-4 font-bold">16.1</span>
              Either party may waive any default of the other party under this
              Agreement, but, no such waiver shall affect the rights of that
              party in respect of any subsequent default, whether of the same or
              a different nature
            </p>
            <p className="ml-8 mb-4">
              <span className="mr-4 font-bold">16.2</span>
              This Agreement which includes Schedule(s) "A", Consisting of Plan
              A, Plan B or Plan C as appropriate, shall constitute the entire
              agreement between the parties with respect to its subject matter
              and supersedes all prior agreements and understandings in any way
              relating to that subject matter. This Agreement can only be
              changed by a writing signed by both parties. No remedy conferred
              on a party under this Agreement, or by law, shall preclude the
              exercise by that party of any other remedy available to it in
              equity or in law in respect of the same default.
            </p>
            <p className="ml-8 mb-4">
              <span className="mr-4 font-bold">16.3</span>
              This Agreement is personal to the Salesperson and no right of the
              Salesperson under this Agreement may be assigned without the prior
              written consent of the Brokerage, which consent may be
              arbitrarily, or unreasonably withheld. The Brokerage may, without
              the consent of the Salesperson, assign any of its rights under the
              Agreement and, following such assignment, shall be relieved of all
              obligations in respect of the rights so assigned. Subject to the
              foregoing, this Agreement shall enure to the benefit and be
              binding upon the parties and their respective heirs, executors,
              administrators, successors and permitted assigns.
            </p>
            <p className="ml-8 mb-4">
              <span className="mr-4 font-bold">16.4</span>
              The use of section headings in this Agreement is for convenience
              of reference only and shall not affect the interpretation of this
              Agreement.
            </p>
            <p className="ml-8 mb-4">
              <span className="mr-4 font-bold">16.5</span>
              All notices or other communications required or permitted under
              this Agreement to be given by one party to the other shall be in
              writing and shall be given by personal delivery (including
              courier), or by facsimile to the party as follows:
            </p>
          </div>

          {/* Legal Text */}
          <div className="space-y-3 text-sm">
            <p className="mb-6">
              Any such notice or communication shall be deemed received on the
              earlier of actual receipt, if delivered or on the date
              transmitted, if by email unless received after 5:00 p.m. on a
              business day (i.e. a day other than a Saturday or Sunday or
              statutory holiday in Ontario) in which case receipt will be deemed
              to be on the next business day. Either party may change its
              address for service by giving notice thereof pursuant to the term
              of this Section.
            </p>

            <p className="">
              <span className="mr-4 font-bold">16.6</span>
              Each party agrees, at the request of the other party, to do,
              execute and give such further and other acts, documents and
              assurances as may be reasonably requested in order to give full
              effect to this Agreement and to the transactions contemplated
              herein.
            </p>

            <p>
              <span className="font-bold ">IN WITNESS</span> whereof the parties
              have duly signed the Agreement as of the date indicated.
            </p>

            {/* Signature Section */}
            <div className="space-y-2 mt-2 pb-5">
              {/* First Row */}
              <div className="grid grid-cols-[1fr_2fr_1fr] gap-8 items-end">
                <div className="pt-1">
                  <div className="h-12 flex items-center justify-center">
                    {user?.name}
                  </div>
                  <p className="border-t border-black text-center text-xs">
                    (Witness)
                  </p>
                </div>
                <div className="pt-1">
                  <div className="w-16 h-12 flex items-center justify-center">
                    <img src={getFileUrl(user?.signature)} alt="" />
                  </div>
                  <p className="border-t border-black text-xs">
                    (Signature of Salesperson)
                  </p>
                </div>
                <div className="pt-1">
                  <div className="h-12 flex items-center justify-center">
                    {formatDate27September2012(agent?.submittedAt)}
                  </div>
                  <p className="border-t border-black text-center text-xs">
                    Date
                  </p>
                </div>
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-[1fr_2fr_1fr] gap-8 items-end">
                <div className="pt-1">
                  <div className="h-12 flex items-center justify-center">
                    {auth?.name}
                  </div>
                  <p className="border-t border-black text-center text-xs">
                    (Witness)
                  </p>
                </div>
                <div className="pt-1">
                  <div className="w-16 h-12 flex items-center justify-center">
                    <img src={getFileUrl(auth?.signature)} alt="" />
                  </div>
                  <p className="border-t border-black text-xs">
                    (Signature of Authorized Signing Officer of Brokerage)
                  </p>
                </div>
                <div className="pt-1">
                  <div className="h-12 flex items-center justify-center">
                    {formatDate27September2012(agent?.approvedAt || new Date())}
                  </div>
                  <p className="border-t border-black text-center text-xs">
                    Date
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm">Page 5 of 7</p>
            <div className="flex gap-4">
              <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
                <img src={getFileUrl(user?.initial)} alt="" />
              </div>
              <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
                <img src={getFileUrl(auth?.signature)} alt="" />
              </div>
            </div>
          </div>
        </div>

        <hr />

        <div className="mx-10 mt-5 mb-10">
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
              <h2 className="text-lg">
                INDEPENDENT CONTRACTOR&apos;S AGREEMENT
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full p-5 border">
            <SelectedPlansDisplay plan={plan as any} />
            <SelectedDiscount agentAccount={agent} />
            <SelectedAddonsPlans
              optionalPlans={optionalPlans as OptionalPlan[]}
            />
            <div>
              {agent?.special_note && (
                <div className="mt-1">
                  <p className="font-bold">Special Note </p>
                  <p
                    className="mt-1"
                    dangerouslySetInnerHTML={{ __html: agent.special_note }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mb-5 mt-12">
            <p className="text-sm">Page 6 of 7</p>
            <div className="flex gap-4">
              <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
                <img src={getFileUrl(user?.initial)} alt="" />
              </div>
              <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
                <img src={getFileUrl(auth?.signature)} alt="" />
              </div>
            </div>
          </div>
        </div>

        <hr />

        <div className="mx-10 my-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 border border-gray-300">
              <img
                src="/logo.svg"
                alt="ANS RealStateCRM Inc. Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ANS REALSTATECRM INC.</h1>
              <h2 className="text-lg">
                INDEPENDENT CONTRACTOR&apos;S AGREEMENT
              </h2>
            </div>
          </div>

          <h3 className="text-center font-semibold text-lg underline mb-6">
            INDEPENDENT CONTRACTOR&apos;S DETAILS
          </h3>

          <div className="space-y-4">
            <FormRow label="Name:" value={`${agent?.name}`} />
            <FormRow
              label="PREC Name (If available):"
              value={agent?.precName || ""}
            />
            <FormRow label="Address:" value={agent?.address || ""} />
            <FormRow label="Cell Phone #:" value={agent?.cellPhone || ""} />
            <FormRow
              label="Phone Service Provider:"
              value={agent?.phoneServiceProvider || ""}
            />
            <FormRow
              label="RECO Reg. # & Expiry date:"
              value={`${agent?.recoRegNumber || ""}, ${
                agent?.recoExpiryDate &&
                !isNaN(new Date(agent.recoExpiryDate).getTime())
                  ? new Date(agent.recoExpiryDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : ""
              }`}
            />
            <FormRow label="S.I.N:" value={agent?.sin || ""} />
            <FormRow
              label="D.O.B"
              value={
                agent?.dob && !isNaN(new Date(agent.dob).getTime())
                  ? new Date(agent.dob).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : ""
              }
            />
            <FormRow label="Email address:" value={agent?.email || ""} />
            <FormRow
              label="Emergency Contact:"
              value={agent?.emergencyContact || ""}
            />
            <FormRow label="HST No." value={agent?.hstNo || ""} />
            <FormRow label="PREC HST #" value={agent?.precHstNo || ""} />
            <FormRow
              label="Expected Gross"
              value={`$${agent?.expectedGross?.toFixed(2) || ""}`}
            />
          </div>

          <div className=" space-y-2">
            <div className="pt-4">
              <div className="flex flex-col items-end">
                {/* Signature Image */}
                <div className="w-16 h-12 flex items-end justify-end">
                  <img
                    src={getFileUrl(user?.signature)}
                    alt="Signature"
                    className="object-contain"
                  />
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
                <img src={getFileUrl(auth?.signature)} alt="" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
function FormRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <div className="w-1/3">{label}</div>
      <div className="w-2/3 border-b border-gray-300">{value}</div>
    </div>
  );
}

export default AgreementPreview;
