// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import {
  Avatar,
  Button,
  Modal,
  Select,
  Tabs,
  Tooltip,
  Spin,
  Alert,
} from "antd";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { BsFillPersonFill } from "react-icons/bs";
import { FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import LeadReminder from "../../../../../components/dashboard/Agent/LeadReminder";
import { useChangeLeadStatusMutation } from "../../../../../redux/api/superadmin/leadManagementSlice";
import {
  useCreateUpdateLeadNoteMutation,
  useDeleteLeadNoteMutation,
  useGetLeadNoteQuery,
} from "../../../../../redux/api/superadmin/leadNoteSlice";
import { useGetValidationLogSummaryQuery } from "../../../../../redux/api/superadmin/leadManagementSlice";
import { baseUrl } from "../../../../../utils/constant";

// Add styles for tabs
const styles = `
  .lead-notes-tabs .ant-tabs-nav-wrap {
    padding: 0 24px;
  }
  
  .lead-notes-tabs .ant-tabs-tab {
    padding: 12px 16px;
    margin-right: 8px;
  }
  
  .lead-notes-tabs .ant-tabs-tab:last-child {
    margin-right: 0;
  }
  
  .lead-notes-tabs .ant-tabs-nav {
    margin-bottom: 0;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
  }

  .summary-container {
    padding: 24px;
    background: #f4f7fb;
    min-height: 400px;
  }

  .summary-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .summary-header {
    font-size: 18px;
    font-weight: 600;
    color: #0b3b38;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e5e7eb;
  }

  .summary-content {
    font-size: 15px;
    line-height: 1.8;
    color: #374151;
    white-space: pre-wrap;
  }

  .no-summary {
    text-align: center;
    color: #9ca3af;
    font-size: 15px;
    padding: 60px 20px;
  }
`;

interface LeadData {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  propertyType: string;
  budget: string;
  timeRange: string;
  prefLocation: string;
  prefContact: string;
  createdAt: string;
  updatedAt: string;
  campaignId?: number;
  leadDate?: string;
  platform?: string;
  form?: string;
  source?: string;
  channel?: string;
  stage?: string;
  labels?: string;
  status?: string;
  agentId?: number;
}

interface LeadNotesProps {
  leadId: number;
  isOpen: boolean;
  onClose: () => void;
  leadData?: LeadData;
  refetchLeads: () => void;
}

interface LeadNote {
  uuid: string;
  slug: string;
  note: string;
  leadId: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  CreatedAt?: string;
  created_at?: string;
  owner?: {
    id: number;
    name: string;
    avatarUrl?: string;
    profilePicture?: string;
  };
}

const getFormattedCreatedAt = (note: LeadNote) => {
  const createdTimestamp = note.CreatedAt || note.createdAt || note.created_at;
  if (!createdTimestamp) return "N/A";

  const createdMoment = moment(createdTimestamp);
  return createdMoment.isValid()
    ? createdMoment.format("DD MMM YYYY, hh:mm A")
    : "N/A";
};

const getInitials = (name?: string) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const { Option } = Select;

const LeadNotes: React.FC<LeadNotesProps> = ({
  leadId,
  isOpen,
  onClose,
  leadData,
  refetchLeads,
}) => {
  console.log("Lead Data-------------", leadData);
  console.log("Lead Id-------------", leadId);

  const [noteText, setNoteText] = useState("");
  const [selectedNoteUuid, setSelectedNoteUuid] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [changeLeadStatus] = useChangeLeadStatusMutation();

  const { data: notesData, refetch } = useGetLeadNoteQuery({
    leadId: leadId.toString(),
  });
  const [createUpdateNote] = useCreateUpdateLeadNoteMutation();
  const [deleteNote] = useDeleteLeadNoteMutation();

  // Fetch validation log summary
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useGetValidationLogSummaryQuery(leadData?.phone || "", {
    skip: !leadData?.phone || !isOpen,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [notesData, isOpen, leadData]);

  const handleSubmit = async () => {
    try {
      if (!noteText || noteText.replace(/<(.|\n)*?>/g, "").trim() === "") {
        toast.error("Note cannot be empty");
        return;
      }

      await createUpdateNote({
        uuid: selectedNoteUuid,
        data: {
          note: noteText,
          leadId: leadId,
        },
      }).unwrap();

      toast.success(
        isEditMode ? "Note updated successfully" : "Note added successfully"
      );
      setNoteText("");
      setSelectedNoteUuid(null);
      setIsEditMode(false);
      refetch();
    } catch (error) {
      const message = error?.data?.error || error?.data?.message || "Failed to save note";
      toast.error(message);
      console.error("Note error:", error);
    }
  };

  const handleEdit = (note: LeadNote) => {
    setNoteText(note.note);
    setSelectedNoteUuid(note.uuid);
    setIsEditMode(true);
  };

  const handleDelete = async (uuid: string) => {
    try {
      await deleteNote(uuid).unwrap();
      toast.success("Note deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete note");
      console.error("Delete error:", error);
    }
  };

  const handleCancel = () => {
    setNoteText("");
    setSelectedNoteUuid(null);
    setIsEditMode(false);
  };

  const renderAISummary = () => {
    return (
      <div className="summary-container">
        {isSummaryLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: "#6b7280" }}>
              Loading AI summary...
            </div>
          </div>
        ) : summaryError ? (
          <Alert
            message="Error"
            description="Failed to load AI summary. The lead may not have been validated yet."
            type="warning"
            showIcon
            style={{ margin: "20px 0" }}
          />
        ) : summaryData?.data?.call_summary ? (
          <div className="summary-card">
            <div className="summary-header">AI Call Summary</div>
            <div className="summary-content">
              {summaryData.data.call_summary}
            </div>
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid #e5e7eb",
                fontSize: 13,
                color: "#6b7280",
              }}
            >
              <strong>Lead:</strong> {leadData?.name || "N/A"} |{" "}
              <strong>Phone:</strong> {leadData?.phone || "N/A"}
            </div>
          </div>
        ) : (
          <div className="no-summary">
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <div>No AI summary available for this lead yet.</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>
              The summary will appear here once the lead has been validated.
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLeadDetails = () => {
    if (!leadData)
      return (
        <div className="p-5 text-center text-gray-500">
          No lead details available
        </div>
      );

    // Extract all fields from leadData
    const basicFields = {
      name: { label: "Name" },
      email: { label: "Email" },
      phone: { label: "Phone" },
      secondaryPhone: { label: "Secondary Phone" },
      platform: { label: "Platform" },
      form: { label: "Form" },
      status: { label: "Status" },
      createdAt: {
        label: "Import Date",
        format: (value) => moment.utc(value).format("D MMMM YYYY [at] h:mm A"),
      },
      leadDate: {
        label: "Lead Assigned Date",
        format: (value) => moment.utc(value).format("DD MMM YYYY"),
      },
    };

    // Safely extract form fields from leadData.rows[0].data
    let formFields = {};
    if (leadData.rows && leadData.rows[0] && leadData.rows[0].data) {
      // Handle nested rows structure
      let rowData = leadData.rows[0].data;
      if (Array.isArray(rowData.rows) && rowData.rows[0]?.data) {
        rowData = rowData.rows[0].data;
      }

      // Convert object values to strings
      formFields = Object.fromEntries(
        Object.entries(rowData).map(([key, value]) => {
          if (typeof value === "object" && value !== null) {
            try {
              return [key, JSON.stringify(value)];
            } catch {
              return [key, "[object]"];
            }
          }
          return [key, value];
        })
      );
    }

    return (
      <div className="min-w-6xl mx-auto p-4">
        {/* Basic Information Section */}
        <div className="mb-6">
          <h3 className="border-t border-gray-400 bg-[#0b3b38] text-white border-x text-center text-sm font-bold py-1">
            BASIC INFORMATION
          </h3>
          <table className="w-full text-xs border-collapse border border-gray-400">
            <tbody>
              {Object.entries(basicFields).map(([key, field]) => {
                const value = leadData[key];
                if (value === undefined || value === null) return null;

                const displayValue = field.format
                  ? field.format(value)
                  : value && value.toString().trim() !== ""
                  ? value
                  : "N/A";

                return (
                  <tr key={key}>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold w-1/4">
                      {field.label}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 w-3/4">
                      {displayValue}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Form Responses Section */}
        <div className="mb-6">
          <h3 className="border-t border-gray-400 bg-[#0f766e] text-white border-x text-center text-sm font-bold py-1">
            FORM RESPONSES
          </h3>
          <table className="w-full text-xs border-collapse border border-gray-400">
            <tbody>
              {Object.entries(formFields).map(([key, value]) => {
                if (key in basicFields) return null;

                const fieldName = key.replace(/_/g, " ").replace(/\?/g, "");
                const displayValue =
                  value && value.toString().trim() !== "" ? value : "N/A";

                return (
                  <tr key={key}>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold w-1/4">
                      {fieldName}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 w-3/4">
                      {displayValue}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderNotes = () => {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 28,
            background: "#f4f7fb",
            borderBottom: "1px solid #e5e7eb",
            minHeight: 0,
            maxHeight: "calc(100% - 200px)",
          }}
        >
          {(notesData?.data?.NoteData || []).length === 0 && (
            <div
              style={{ color: "#b0b0b0", textAlign: "center", marginTop: 40 }}
            >
              No notes yet.
            </div>
          )}
          {(notesData?.data?.NoteData || []).map((note: LeadNote) => (
            <div
              key={note.uuid}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-end",
                marginBottom: 28,
                gap: 16,
                justifyContent: "flex-start",
              }}
            >
              {note.owner?.profilePicture &&
              note.owner.profilePicture !== "" ? (
                <img
                  src={
                    note.owner.profilePicture.startsWith("http")
                      ? note.owner.profilePicture.replace(/\\/g, "/")
                      : `${baseUrl}${note.owner.profilePicture
                          .replace(/^[\\/]/, "")
                          .replace(/\\/g, "/")}`
                  }
                  alt="User Avatar"
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                    marginBottom: 10,
                    background: "#0a2a28",
                  }}
                />
              ) : (
                <Avatar
                  size={46}
                  alt="User Avatar"
                  style={{
                    backgroundColor: "#0a2a28",
                    fontWeight: 700,
                    fontSize: 22,
                    marginBottom: 10,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                  }}
                  icon={<BsFillPersonFill style={{ fontSize: 22 }} />}
                >
                  {getInitials(note.owner?.name)}
                </Avatar>
              )}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  padding: "18px 26px 14px 26px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                  maxWidth: 800,
                  minWidth: 140,
                  position: "relative",
                  border: "1px solid #e5e7eb",
                  wordBreak: "break-word",
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    margin: 10,
                    color: "#222",
                  }}
                  dangerouslySetInnerHTML={{ __html: note.note }}
                />
                <div style={{ fontSize: 13, color: "#888", marginBottom: 2 }}>
                  {note.owner?.name || "N/A"} &middot;{" "}
                  {getFormattedCreatedAt(note)}
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 16,
                    display: "flex",
                    gap: 10,
                  }}
                >
                  <Tooltip title="Edit">
                    <Button
                      size="small"
                      type="text"
                      icon={
                        <FaRegEdit style={{ color: "#1677ff", fontSize: 17 }} />
                      }
                      onClick={() => handleEdit(note)}
                      style={{ padding: 0 }}
                    />
                  </Tooltip>
                  <Tooltip title="Delete">
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={
                        <MdDelete style={{ color: "#ff4d4f", fontSize: 18 }} />
                      }
                      onClick={() => handleDelete(note.uuid)}
                      style={{ padding: 0 }}
                    />
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* Input area */}
        <div
          style={{
            padding: 22,
            background: "#fff",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <ReactQuill
              value={noteText}
              onChange={setNoteText}
              placeholder="Type a note..."
              style={{
                borderRadius: 10,
                background: "#f8fafc",
                height: 120,
                paddingBottom: 40,
              }}
              theme="snow"
              modules={{
                toolbar: [
                  [{ header: "1" }, { header: "2" }, { font: [] }],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["bold", "italic", "underline"],
                  [{ align: [] }],
                  ["link", "image"],
                  [{ color: [] }],
                ],
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "blue", fontSize: 36 }}>
                {" "}
                Change Lead Status
              </span>
              <Select
                defaultValue={leadData?.status || "New"}
                style={{ width: 200 }}
                onChange={(value) => {
                  changeLeadStatus({
                    uuid: leadData?.uuid,
                    data: { status: value },
                  })
                    .unwrap()
                    .then((response) => {
                      if (response.status) {
                        toast.success(response.message);
                        if (leadData) {
                          leadData.status = value;
                        }
                        refetchLeads();
                      } else {
                        toast.error(response.message);
                      }
                    })
                    .catch((error) => {
                      console.error("Status update error:", error);
                    });
                }}
              >
                <Option value="New">New</Option>
                <Option value="Attempted Contact">Attempted Contact</Option>
                <Option value="Contacted">Contacted</Option>
                <Option value="Qualified">Qualified</Option>
                <Option value="Active">Active</Option>
                <Option value="Nurture">Nurture</Option>
                <Option value="Lost">Lost</Option>
                <Option value="Closed">Closed</Option>
                <Option value="Imported">Imported</Option>
              </Select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {isEditMode && <Button onClick={handleCancel}>Cancel</Button>}
              <Button className="primary-btn mx-3" onClick={handleSubmit}>
                {isEditMode ? "Update Note" : "Add Note"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{styles}</style>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 18 }}>
              Lead Information
            </span>
          </div>
        }
        open={isOpen}
        onCancel={onClose}
        footer={null}
        width={1000}
        bodyStyle={{
          padding: 0,
          display: "flex",
          flexDirection: "column",
          borderRadius: 18,
          background: "#f4f7fb",
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "1",
              label: "Lead Details",
              children: renderLeadDetails(),
            },
            {
              key: "2",
              label: "Notes",
              children: renderNotes(),
            },

            {
              key: "4",
              label: "Reminders",
              children: (
                <LeadReminder agentId={leadData?.agentId} leadId={leadId} />
              ),
            },
            {
              key: "3",
              label: "AI Summary",
              children: renderAISummary(),
            },
          ]}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
          className="lead-notes-tabs"
        />
      </Modal>
    </>
  );
};

export default LeadNotes;
