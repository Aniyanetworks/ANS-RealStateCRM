import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Select, Switch, Divider } from "antd";
import { useForm } from "react-hook-form";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useGetActiveBranchListDataQuery } from "../../../redux/api/superadmin/branch/Branchmanagementslice";


interface Announcement {
  id?: number;
  uuid?: string;
  title: string;
  slug: string;
  description: string;
  date?: string;
  status: 'publish' | 'unpublish';
  sendEmail?: boolean;
  sendSms?: boolean;
  targetType?: "all" | "branches";
  selectedBranches?: string[];
  recipientScope?: "all_users" | "selected_users" | "our_agents" | "approved_agents";
  selectedAgents?: string[];
}

interface AnnouncementModalProps {
  announcement: Announcement | null;
  onClose: (data?: Announcement) => void;
  agentOptions?: any[];
}

const formatDate = (date: string | undefined): string => {
  if (!date) return '';
  const newDate = new Date(date);
  return newDate.toISOString().split('T')[0];
};

const normalizeToStringArray = (value: any): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item));
      return [];
    } catch {
      return [];
    }
  }
  return [];
};

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ announcement, onClose, agentOptions = [] }) => {
  const { user } = useSelector((state: any) => state.user);
  const isSuperAdmin = user?.roleId == 1;
  const userBranchId = user?.branchId ? String(user.branchId) : "";
  const { data: activeBranches } = useGetActiveBranchListDataQuery("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  const [targetType, setTargetType] = useState<"all" | "branches">("all");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [recipientScope, setRecipientScope] = useState<"all_users" | "selected_users" | "our_agents" | "approved_agents">("all_users");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors },
    setValue,
    watch,
  } = useForm<Announcement>({
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      date: '',
      status: 'publish',
    }
  });

  // Watch the description field to use as editor value
  const description = watch('description');

  useEffect(() => {
    if (announcement) {
      const normalizedSelectedAgents = normalizeToStringArray(announcement.selectedAgents);
      const normalizedSelectedBranches = normalizeToStringArray(announcement.selectedBranches);
      const resolvedRecipientScope = announcement.recipientScope || (normalizedSelectedAgents.length > 0 ? "selected_users" : "all_users");

      reset({
        ...announcement,
        date: formatDate(announcement.date),
      });
      setSendEmail(announcement.sendEmail ?? true);
      setSendSms(announcement.sendSms ?? true);
      setTargetType(announcement.targetType || "all");
      setSelectedBranches(normalizedSelectedBranches);
      setRecipientScope(resolvedRecipientScope);
      setSelectedAgents(normalizedSelectedAgents);
    } else {
      reset({ title: '', slug: '', description: '', date: '', status: 'publish' });
      setSendEmail(true);
      setSendSms(true);
      setTargetType(isSuperAdmin ? "all" : "branches");
      setSelectedBranches(!isSuperAdmin && userBranchId ? [userBranchId] : []);
      setRecipientScope("all_users");
      setSelectedAgents([]);
    }
  }, [announcement, reset, isSuperAdmin, userBranchId]);

  useEffect(() => {
    if (!isSuperAdmin && userBranchId) {
      setTargetType("branches");
      setSelectedBranches([userBranchId]);
    }
  }, [isSuperAdmin, userBranchId]);

  useEffect(() => {
    // Preserve prefilled selected users while editing existing announcements.
    if (recipientScope === "all_users" && !announcement) {
      setSelectedAgents([]);
    }
  }, [recipientScope, announcement]);

  const branchOptions = useMemo(() => {
    return activeBranches?.data?.branchData?.map((branch: any) => ({
      value: String(branch.id),
      label: branch.name,
    })) || [];
  }, [activeBranches]);

  const filteredAgentOptions = useMemo(() => {
    return agentOptions.filter((agent: any) => {
      if (targetType === "all") return true;
      if (selectedBranches.length === 0) return false;
      return selectedBranches.includes(String(agent.branchId));
    });
  }, [agentOptions, selectedBranches, targetType]);

  useEffect(() => {
    if (recipientScope !== "selected_users") return;

    const allowedIds = new Set(filteredAgentOptions.map((agent: any) => String(agent.value)));
    setSelectedAgents((prev) => prev.filter((id) => allowedIds.has(String(id))));
  }, [recipientScope, filteredAgentOptions]);

  useEffect(() => {
    if (recipientScope !== "our_agents" && recipientScope !== "approved_agents") return;

    const approvedAgentIds = filteredAgentOptions.map((agent: any) => String(agent.value));
    setSelectedAgents(approvedAgentIds);
  }, [recipientScope, filteredAgentOptions]);

  const onSubmit = (data: Announcement) => {
    if (!sendEmail && !sendSms) {
      toast.error("Please select at least one notification method (Email or SMS)");
      return;
    }
    const normalizedRecipientScope =
      recipientScope === "our_agents" || recipientScope === "approved_agents"
        ? "selected_users"
        : recipientScope;
    const approvedAgentIds = filteredAgentOptions.map((agent: any) => String(agent.value));
    const normalizedSelectedAgents =
      recipientScope === "our_agents" || recipientScope === "approved_agents"
        ? approvedAgentIds
        : selectedAgents;

    onClose({
      ...data,
      sendEmail,
      sendSms,
      targetType,
      selectedBranches,
      recipientScope: normalizedRecipientScope,
      selectedAgents: normalizedSelectedAgents,
    });
  };

  const handleEditorChange = (value: string) => {
    setValue("description", value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <Modal
      title={announcement ? 'Edit Schedule Announcement' : 'Create Schedule Announcement'}
      open={true}
      onCancel={() => onClose()}
      width="700px"
      footer={[
        <button key="cancel" className="cancel-btn mx-2" onClick={() => onClose()}>Cancel</button>,
        <button key="save" className="primary-btn" onClick={handleSubmit(onSubmit)}>Save</button>,
      ]}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Title</label>
          <input 
            type="text"
            className="border p-2 w-full"
            placeholder="Title" 
            {...register("title", { required: "Please enter a title" })} 
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>
        
        <div className="form-group mb-10">
          <label>Description</label>
          <div className='mb-2'>          

            <ReactQuill
                      value={description}
                      onChange={handleEditorChange}
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
                theme="snow"
                      placeholder="Write your drscription here..."
                    />
          </div>
          <input 
            type="hidden" 
            {...register("description", { 
              required: "Description is required",
              validate: value => value.trim() !== '' || "Description cannot be empty" 
            })} 
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        <Divider />

        <div className="form-group">
          <label className="block mb-2">Notification Methods</label>
          <div className="flex gap-6 mb-2">
            <div className="flex items-center gap-2">
              <Switch checked={sendEmail} onChange={setSendEmail} />
              <span>Email</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={sendSms} onChange={setSendSms} />
              <span>SMS</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="block mb-2">Target Audience</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {isSuperAdmin && (
              <Select
                value={targetType}
                onChange={(value) => {
                  setTargetType(value);
                  if (value === "all") setSelectedBranches([]);
                }}
                options={[
                  { value: "all", label: "All Branches (One Click)" },
                  { value: "branches", label: "Selected Branch(es)" },
                ]}
                className="w-full"
                style={{ width: "100%" }}
              />
            )}
            <Select
              value={recipientScope}
              onChange={setRecipientScope}
              options={[
                { value: "all_users", label: "All Users" },
                { value: "our_agents", label: "Our Agents" },
                { value: "selected_users", label: "Select Individual Users" },
              ]}
              className="w-full"
              style={{ width: "100%" }}
            />
          </div>

          {targetType === "branches" && (
            <div className="mt-3">
              <Select
                mode="multiple"
                value={selectedBranches}
                onChange={(values) => setSelectedBranches(values.map((value) => String(value)))}
                options={branchOptions}
                disabled={!isSuperAdmin}
                placeholder="Select branch"
                className="w-full"
                style={{ width: "100%" }}
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="block mb-2">Select Target Agents</label>
          <Select
            mode="multiple"
            value={selectedAgents}
            onChange={(values) => setSelectedAgents(values.map((value) => String(value)))}
            options={filteredAgentOptions}
            optionFilterProp="label"
            allowClear
            disabled={recipientScope === "all_users" || recipientScope === "our_agents" || recipientScope === "approved_agents"}
            placeholder={
              recipientScope === "all_users"
                ? "All users in selected scope"
                : recipientScope === "our_agents" || recipientScope === "approved_agents"
                  ? "All our agents in selected scope"
                  : "Select users"
            }
            className="w-full"
            style={{ width: "100%" }}
          />
        </div>

        <div className="form-group">
          <label>Schedule Date</label>
          <input 
            type="date" 
            className="border p-2 w-full"
            {...register("date", { required: "Please enter a date" })} 
          />
          {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
        </div>

        <div className="form-group">
          <label>Status</label>
          <select 
            className="border p-2 w-full"
            {...register("status", { required: "Please select a status" })}
          >
            <option value="publish">Publish</option>
            <option value="unpublish">Unpublish</option>
          </select>
          {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
        </div>
      </form>
    </Modal>
  );
};

export default AnnouncementModal;