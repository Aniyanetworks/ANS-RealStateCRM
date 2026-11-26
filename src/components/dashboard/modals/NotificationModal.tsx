/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Modal, Select, Switch, Divider, Input, Tag } from "antd";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useGetActiveBranchListDataQuery } from "../../../redux/api/superadmin/branch/Branchmanagementslice";

const { TextArea } = Input;

interface Announcement {
  id?: number;
  uuid?: string;
  title: string;
  slug: string;
  date?: string;
  status: "publish" | "unpublish";
}

interface NotificationModalProps {
  announcement: Announcement | null;
  onClose: (data?: any) => void;
  agentOptions: any[];
  isInstantNotification?: boolean;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ 
  announcement,
  onClose,
  agentOptions,
  isInstantNotification = false
}) => {
  const { user } = useSelector((state: any) => state.user);
  const isSuperAdmin = user?.roleId == 1;
  const userBranchId = user?.branchId ? String(user.branchId) : "";
  const { data: activeBranches } = useGetActiveBranchListDataQuery("");

  const [sendEmail, setSendEmail] = useState(false);
  const [sendSms, setSendSms] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [recipientScope, setRecipientScope] = useState<"all_users" | "selected_users" | "our_agents" | "approved_agents">("all_users");
  const [targetType, setTargetType] = useState<"all" | "branches">("all");
  const [emailBody, setEmailBody] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [customEmails, setCustomEmails] = useState<string[]>([]);
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [customPhones, setCustomPhones] = useState<string[]>([]);
  const [customPhoneInput, setCustomPhoneInput] = useState('');

  useEffect(() => {
    if (isInstantNotification) {
      setSendEmail(false);
      setSendSms(false);
      setSelectedAgents([]);
      setSelectedBranches([]);
      setRecipientScope("all_users");
      setTargetType("all");
      setEmailBody('');
      setSmsBody('');
      setNotificationTitle('');
      setCustomEmails([]);
      setCustomEmailInput('');
      setCustomPhones([]);
      setCustomPhoneInput('');
    } 
  }, [isInstantNotification]);

  useEffect(() => {
    if (!isSuperAdmin && userBranchId) {
      setTargetType("branches");
      setSelectedBranches([userBranchId]);
    }
  }, [isSuperAdmin, userBranchId]);

  useEffect(() => {
    if (recipientScope === "all_users" && !isInstantNotification) {
      setSelectedAgents([]);
    }
  }, [recipientScope, isInstantNotification]);

  const branchOptions = activeBranches?.data?.branchData?.map((branch: any) => ({
    value: String(branch.id),
    label: branch.name,
  })) || [];

  const filteredAgentOptions = agentOptions.filter((agent: any) => {
    if (targetType === "all") return true;
    if (selectedBranches.length === 0) return false;
    return selectedBranches.includes(String(agent.branchId));
  });

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

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

const isValidCanadianPhone = (phone: string) => {
  if (!phone || phone.trim().length === 0) return false;
  
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  
  if (cleaned.startsWith('+1') && cleaned.length === 12) {
    const digitsOnly = cleaned.substring(2);
    return /^\d{10}$/.test(digitsOnly);
  } else if (cleaned.startsWith('1') && cleaned.length === 11) {
    const digitsOnly = cleaned.substring(1);
    return /^\d{10}$/.test(digitsOnly);
  } else if (cleaned.length === 10) {
    return /^\d{10}$/.test(cleaned);
  }
  
  return false;
};

const processPhoneInput = () => {
  if (!customPhoneInput.trim()) return;

  const phones = customPhoneInput
    .split(',')
    .map(phone => phone.trim())
    .filter(phone => phone.length > 0);

  const validPhones: string[] = [];
  const invalidPhones: { phone: string, reason: string }[] = [];

  phones.forEach(phone => {
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      invalidPhones.push({ 
        phone, 
        reason: `too short (${digitsOnly.length} digits, need 10)` 
      });
    } else if (digitsOnly.length > 11) {
      invalidPhones.push({ 
        phone, 
        reason: `too long (${digitsOnly.length} digits, max 11)` 
      });
    } else if (!isValidCanadianPhone(phone)) {
      invalidPhones.push({ 
        phone, 
        reason: 'invalid Canadian format' 
      });
    } else {
      const formattedPhone = formatCanadianPhone(phone);
      if (!validPhones.includes(formattedPhone) && !customPhones.includes(formattedPhone)) {
        validPhones.push(formattedPhone);
      }
    }
  });

  if (validPhones.length > 0) {
    setCustomPhones(prev => [...prev, ...validPhones]);
    toast.success(`Added ${validPhones.length} Canadian phone number(s)`);
  }

  if (invalidPhones.length > 0) {
    const errorMessages = invalidPhones.map(item => 
      `${item.phone} (${item.reason})`
    );
    toast.error(
      <div>
        <div className="font-semibold mb-1">Invalid phone numbers:</div>
        {errorMessages.map((msg, index) => (
          <div key={index} className="text-sm">• {msg}</div>
        ))}
        <div className="mt-1 text-sm">Canadian numbers must be 10 digits (e.g., 4165551234)</div>
      </div>,
      { duration: 5000 }
    );
  }

  setCustomPhoneInput('');
};

const formatPhoneForDisplay = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
  } else if (cleaned.length === 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  return phone;
};

  const formatCanadianPhone = (phone: string) => {
    if (!phone) return '';
    
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('+1') && cleaned.length === 12) {
      return cleaned;
    } else if (cleaned.startsWith('1') && cleaned.length === 11) {
      return `+${cleaned}`;
    } else if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    return phone;
  };

  const processEmailInput = () => {
    if (!customEmailInput.trim()) return;

    const emails = customEmailInput
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    const validEmails: string[] = [];
    const invalidEmails: string[] = [];

    emails.forEach(email => {
      if (isValidEmail(email)) {
        if (!validEmails.includes(email) && !customEmails.includes(email)) {
          validEmails.push(email);
        }
      } else {
        invalidEmails.push(email);
      }
    });

    if (validEmails.length > 0) {
      setCustomEmails(prev => [...prev, ...validEmails]);
      toast.success(`Added ${validEmails.length} email(s)`);
    }

    if (invalidEmails.length > 0) {
      toast.error(`Invalid email format: ${invalidEmails.join(', ')}`);
    }

    setCustomEmailInput('');
  };

 

  const handleRemoveEmail = (emailToRemove: string) => {
    setCustomEmails(prev => prev.filter(email => email !== emailToRemove));
  };

  const handleRemovePhone = (phoneToRemove: string) => {
    setCustomPhones(prev => prev.filter(phone => phone !== phoneToRemove));
  };

  const handleClearAllEmails = () => {
    setCustomEmails([]);
    setCustomEmailInput('');
  };

  const handleClearAllPhones = () => {
    setCustomPhones([]);
    setCustomPhoneInput('');
  };

  const handleSubmit = async () => {
    if (!sendEmail && !sendSms) {
      toast.error('Please select at least one notification method (Email or SMS)');
      return;
    }

    if (isInstantNotification) {
      if (!notificationTitle.trim()) {
        toast.error('Announcement title is required');
        return;
      }
    }

    if (sendEmail && !emailBody.trim()) {
      toast.error('Email body is required when sending email announcements');
      return;
    }

    if (sendSms && !smsBody.trim()) {
      toast.error('SMS body is required when sending SMS announcements');
      return;
    }


    if (sendEmail && customEmails.length > 0) {
      const invalidEmails = customEmails.filter(email => !isValidEmail(email));
      if (invalidEmails.length > 0) {
        toast.error(`Invalid email format: ${invalidEmails.join(', ')}`);
        return;
      }
    }

    if (sendSms && customPhones.length > 0) {
      const invalidPhones = customPhones.filter(phone => !isValidCanadianPhone(phone));
      if (invalidPhones.length > 0) {
        toast.error(`Invalid Canadian phone number format: ${invalidPhones.join(', ')}`);
        return;
      }
    }

    setLoading(true);
    try {
      const notificationData = {
        sendEmail,
        sendSms,
        emailBody,
        smsBody,
        selectedAgents: recipientScope === "our_agents" || recipientScope === "approved_agents"
          ? filteredAgentOptions.map((agent: any) => String(agent.value))
          : selectedAgents,
        targetType,
        selectedBranches,
        recipientScope:
          recipientScope === "our_agents" || recipientScope === "approved_agents"
            ? "selected_users"
            : recipientScope,
        title: notificationTitle,
        customEmails,
        customPhones,
      };
      
      onClose(notificationData);
    } catch (error) {
      console.error('Error sending announcement:', error);
      toast.error('Failed to send announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailBodyChange = (value: string) => {
    setEmailBody(value);
  };

  const handleSmsBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSmsBody(e.target.value);
  };

  const handleAgentChange = (value: string[]) => {
    setSelectedAgents(value.map((item) => String(item)));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotificationTitle(e.target.value);
  };

  const handleEmailToggle = (checked: boolean) => {
    setSendEmail(checked);
  };

  const handleSmsToggle = (checked: boolean) => {
    setSendSms(checked);    
  };

  const modalTitle = isInstantNotification 
    ? "Send Announcement" 
    : `Send Announcements - ${announcement?.title}`;

  return (
    <Modal
      title={modalTitle}
      open={true}
      onCancel={() => onClose()}
      width="800px"
      footer={[
        <button key="cancel" className="cancel-btn mx-2" onClick={() => onClose()}>
          Cancel
        </button>,
        <button 
          key="send" 
          className="primary-btn" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Announcements'}
        </button>,
      ]}
    >
      <div className="space-y-6">
        {isInstantNotification && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Announcement Title
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                placeholder="Enter announcement title"
                value={notificationTitle}
                onChange={handleTitleChange}
                className="w-full"
              />
            </div>
            <Divider />
          </>
        )}

        <div>
          <div className="flex gap-6 mb-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={sendEmail}
                onChange={handleEmailToggle}
              />
              <span className="text-sm font-medium">Send Email Announcement</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={sendSms}
                onChange={handleSmsToggle}
              />
              <span className="text-sm font-medium">Send SMS Announcement</span>
            </div>
          </div>
        </div>

        <Divider />

        <div>
          <label className="block text-sm font-medium mb-2">
            Target Audience
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {isSuperAdmin && (
              <div>
                <span className="text-xs text-gray-500 block mb-1">Send To</span>
                <Select
                  value={targetType}
                  onChange={(value) => {
                    setTargetType(value);
                    if (value === "all") {
                      setSelectedBranches([]);
                    }
                  }}
                  options={[
                    { value: "all", label: "All Branches (One Click)" },
                    { value: "branches", label: "Selected Branch(es)" },
                  ]}
                  className="w-full"
                />
              </div>
            )}

            <div>
              <span className="text-xs text-gray-500 block mb-1">Recipients In Scope</span>
              <Select
                value={recipientScope}
                onChange={setRecipientScope}
                options={[
                  { value: "all_users", label: "All Users" },
                  { value: "our_agents", label: "Our Agents" },
                  { value: "selected_users", label: "Select Individual Users" },
                ]}
                className="w-full"
              />
            </div>
          </div>

          {targetType === "branches" && (
            <div className="mt-3">
              <span className="text-xs text-gray-500 block mb-1">
                {isSuperAdmin ? "Select Branch(es)" : "Your Branch"}
              </span>
              <Select
                mode="multiple"
                value={selectedBranches}
                onChange={(values) => setSelectedBranches(values.map((item) => String(item)))}
                options={branchOptions}
                className="w-full"
                disabled={!isSuperAdmin}
                placeholder="Select branch"
              />
            </div>
          )}
        </div>

        <Divider />

        <div>
          <label className="block text-sm font-medium mb-2">
            Select Target Agents
            <span className="text-gray-500 text-xs ml-1">
              {recipientScope === "all_users" ? "(Optional - all users in selected scope)" : "(Optional)"}
            </span>
          </label>
          <Select
            mode="multiple"
            placeholder={
              recipientScope === "all_users"
                ? "Select specific agents (optional)"
                : recipientScope === "our_agents" || recipientScope === "approved_agents"
                  ? "All our agents in selected scope"
                  : "Select users"
            }
            value={selectedAgents}
            onChange={handleAgentChange}
            options={filteredAgentOptions}
            optionFilterProp="label"
            allowClear
            style={{ width: '100%' }}
            className="w-full"
            disabled={recipientScope === "all_users" || recipientScope === "our_agents" || recipientScope === "approved_agents"}
          />
        </div>

        {sendEmail && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Additional Email Addresses
              <span className="text-gray-500 text-xs ml-1">
                (Optional - enter multiple emails separated by commas)
              </span>
            </label>
            <Input
              placeholder="e.g., email1@example.com, email2@example.com, email3@example.com"
              value={customEmailInput}
              onChange={(e) => setCustomEmailInput(e.target.value)}
              onBlur={processEmailInput}
              onPressEnter={(e) => {
                e.preventDefault();
                processEmailInput();
              }}
              className="w-full"
            />
            
            {customEmails.length > 0 && (
              <div className="mt-3 p-3 border rounded bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Added Emails ({customEmails.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAllEmails}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customEmails.map((email, index) => (
                    <Tag
                      key={index}
                      closable
                      onClose={() => handleRemoveEmail(email)}
                      color="blue"
                      className="mb-1"
                    >
                      {email}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {sendEmail && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Email Body
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className='mb-2'>          
              <ReactQuill
                value={emailBody}
                onChange={handleEmailBodyChange}
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
                placeholder="Enter email content..."
              />
            </div>
            {sendEmail && !emailBody.trim() && (
              <p className="text-red-500 text-sm mt-1">Email body is required when sending email</p>
            )}
          </div>
        )}

        {sendSms && (
         <div>
           <div>
            <label className="block text-sm font-medium mb-2">
              Additional Phone Numbers
              <span className="text-gray-500 text-xs ml-1">
                (Optional - enter multiple Canadian phone numbers separated by commas)
              </span>
            </label>
            <Input
              placeholder="e.g., 1234567890, 4165551234, 5145556789"
              value={customPhoneInput}
              onChange={(e) => setCustomPhoneInput(e.target.value)}
              onBlur={processPhoneInput}
              onPressEnter={(e) => {
                e.preventDefault();
                processPhoneInput();
              }}
              className="w-full"
            />
            
            {customPhones.length > 0 && (
              <div className="mt-3 p-3 border rounded bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Added Canadian Phone Numbers ({customPhones.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAllPhones}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customPhones.map((phone, index) => (
                    <Tag
                      key={index}
                      closable
                      onClose={() => handleRemovePhone(phone)}
                      color="green"
                      className="mb-1"
                    >
                      {formatPhoneForDisplay(phone)}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: 1234567890, 4165551234, or +14165551234
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              SMS Body
              <span className="text-red-500 ml-1">*</span>
            </label>
            <TextArea
              rows={4}
              placeholder="Enter SMS content..."
              value={smsBody}
              onChange={handleSmsBodyChange}
              showCount
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">SMS messages are limited to 160 characters</p>
          </div>
         </div>
        )}       
      </div>
    </Modal>
  );
};

export default NotificationModal;