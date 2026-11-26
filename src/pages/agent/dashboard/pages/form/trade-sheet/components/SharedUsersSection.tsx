// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import Select from 'react-select';
import Modal from 'antd/es/modal';
import toast from 'react-hot-toast';
import TextInput from './TextInput';

interface SharedUsersSectionProps {
  sharedUsersData: any[];
  setSharedUsersData: (data: any[]) => void;
  hasSharedUsers: boolean;
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  internalAgent: any;
  sellerBrokerageId: string;
  buyerBrokerageId: string;
  tradeSheetUuid: string;
  tradeSheetRepresentationData: string;
  firstAgent: string;
  secondAgent: string;
  addSharedUser: any;
  removeSharedUser: any;
  updateSharedUserCommission: any;
}

const SharedUsersSection: React.FC<SharedUsersSectionProps> = ({
  sharedUsersData,
  setSharedUsersData,
  register,
  errors,
  setValue,
  internalAgent,
  sellerBrokerageId,
  buyerBrokerageId,
  tradeSheetUuid,
  tradeSheetRepresentationData,
  firstAgent,
  secondAgent,
  addSharedUser,
  removeSharedUser,
  updateSharedUserCommission,
}) => {
  const [isSellerAddModalOpen, setIsSellerAddModalOpen] = useState(false);
  const [isBuyerAddModalOpen, setIsBuyerAddModalOpen] = useState(false);
  const [selectedSellerAgent, setSelectedSellerAgent] = useState(null);
  const [selectedBuyerAgent, setSelectedBuyerAgent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingCommissionId, setUpdatingCommissionId] = useState<number | null>(null);

  // Get available agents based on brokerage - handle null/undefined values
  const sellerAgentOptions = sellerBrokerageId
    ? (internalAgent?.data?.userData?.filter(
        (agent: any) => agent?.brokerageId && String(agent.brokerageId) === String(sellerBrokerageId) && agent.status !== "closed"
      ) || []).map((agent: any) => ({
        value: agent.userId,
        label: agent.name,
        email: agent.email,
        firstName: agent.firstName,
        lastName: agent.lastName
      }))
    : [];

  const buyerAgentOptions = buyerBrokerageId
    ? (internalAgent?.data?.userData?.filter(
        (agent: any) => agent?.brokerageId && String(agent.brokerageId) === String(buyerBrokerageId) && agent.status !== "closed"
      ) || []).map((agent: any) => ({
        value: agent.userId,
        label: agent.name,
        email: agent.email,
        firstName: agent.firstName,
        lastName: agent.lastName
      }))
    : [];

  // FIXED: Handle both single and multiple representation types
  const checkRepresentationMatch = (userRepType: string, targetTypes: string[]) => {
    if (!userRepType) return false;
    
    // Handle multiple representation types (comma-separated)
    if (userRepType.includes(',')) {
      const userTypes = userRepType.split(',').map(type => type.trim());
      return userTypes.some(type => targetTypes.includes(type));
    }
    
    // Handle single representation type
    return targetTypes.includes(userRepType);
  };

  // FIXED: Get representation types for each side
  const getSellerRepresentationTypes = () => {
    return ['seller', 'landlord'];
  };

  const getBuyerRepresentationTypes = () => {
    return ['buyer', 'tenant'];
  };

  // FIXED: Filter shared users with support for multiple representation types
  const sellerRepresentationTypes = getSellerRepresentationTypes();
  const buyerRepresentationTypes = getBuyerRepresentationTypes();

  const sellerSharedUsers = sharedUsersData?.filter((user: any) => {
    return checkRepresentationMatch(user.representationType, sellerRepresentationTypes);
  }) || [];

  const buyerSharedUsers = sharedUsersData?.filter((user: any) => {
    return checkRepresentationMatch(user.representationType, buyerRepresentationTypes);
  }) || [];

  // Add shared user and update local state
  const handleAddAgent = async (type: 'seller' | 'buyer') => {
    const selectedAgent = type === 'seller' ? selectedSellerAgent : selectedBuyerAgent;
    const agentOptions = type === 'seller' ? sellerAgentOptions : buyerAgentOptions;
    
    // Use single representation type when adding new agents
    const representationType = type === 'seller' ? 'seller' : 'buyer';

    if (!selectedAgent) {
      toast.error("Please select an agent");
      return;
    }

    setIsLoading(true);
    try {
      const agentToAdd = agentOptions.find(
        (agent: any) => String(agent.value) === String(selectedAgent)
      );

      if (agentToAdd) {
        const response = await addSharedUser({
          uuid: tradeSheetUuid,
          data: {
            sharedUserId: agentToAdd.value,
            firstName: agentToAdd.firstName,
            lastName: agentToAdd.lastName,
            email: agentToAdd.email,
            commissionType: "percentage",
            commission: 0,
            representationType: representationType
          }
        }).unwrap();

        if (response?.status && response.data) {
          // Add the new shared user to local state
          const updatedSharedUsers = [...sharedUsersData, response.data];
          setSharedUsersData(updatedSharedUsers);
          setValue("sharedUsers", updatedSharedUsers);
          
          toast.success("Agent added successfully");
          
          // Close modal and reset selection
          if (type === 'seller') {
            setIsSellerAddModalOpen(false);
            setSelectedSellerAgent(null);
          } else {
            setIsBuyerAddModalOpen(false);
            setSelectedBuyerAgent(null);
          }
        }
      }
    } catch (error: any) {
      console.error("Failed to add agent:", error);
      toast.error(error?.data?.message || "Failed to add agent");
    } finally {
      setIsLoading(false);
    }
  };

  // Remove shared user and update local state
  const handleRemoveAgent = async (agentId: number) => {
    setIsLoading(true);
    try {
      const response = await removeSharedUser(agentId).unwrap();
      
      if (response?.status && response.data) {
        // Remove the shared user from local state
        const updatedSharedUsers = sharedUsersData.filter(user => user.id !== agentId);
        setSharedUsersData(updatedSharedUsers);
        setValue("sharedUsers", updatedSharedUsers);
        
        toast.success("Agent removed successfully");
      }
    } catch (error: any) {
      console.error("Failed to remove agent:", error);
      toast.error(error?.data?.message || "Failed to remove agent");
    } finally {
      setIsLoading(false);
    }
  };

  // Commission update handler - only updates on blur
  const handleUpdateCommission = async (agentId: number, field: string, value: any) => {
    setUpdatingCommissionId(agentId);
    
    try {
      const currentAgent = sharedUsersData.find((agent: any) => agent.id === agentId);
      if (!currentAgent) return;

      const updateData = {
        commissionType: field === 'commissionType' ? value : currentAgent.commissionType,
        commission: field === 'commission' ? (value === '' ? 0 : parseFloat(value)) : currentAgent.commission
      };

      // Update local state immediately for better UX
      const updatedSharedUsers = sharedUsersData.map(user => 
        user.id === agentId 
          ? { ...user, ...updateData }
          : user
      );
      setSharedUsersData(updatedSharedUsers);
      setValue("sharedUsers", updatedSharedUsers);

      // Make API call
      const response = await updateSharedUserCommission({
        id: agentId,
        data: updateData
      }).unwrap();

      if (response?.status) {
        toast.success("Commission updated successfully");
      }
    } catch (error: any) {
      console.error("Failed to update commission:", error);
      toast.error(error?.data?.message || "Failed to update commission");
      
      // Revert local state on error
      setSharedUsersData([...sharedUsersData]);
      setValue("sharedUsers", [...sharedUsersData]);
    } finally {
      setUpdatingCommissionId(null);
    }
  };

  // Handle commission blur for saving
  const handleCommissionBlur = (agentId: number, value: string) => {
    if (value === '' || value === null || value === undefined) {
      handleUpdateCommission(agentId, 'commission', 0);
      return;
    }
    
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      handleUpdateCommission(agentId, 'commission', numericValue);
    }
  };

  // Handle commission type change
  const handleCommissionTypeChange = (agentId: number, value: string) => {
    handleUpdateCommission(agentId, 'commissionType', value);
  };

  // Check if brokerage has agents available
  const hasSellerAgents = sellerAgentOptions.length > 0;
  const hasBuyerAgents = buyerAgentOptions.length > 0;

  const SharedUsersList = ({ users, title, type }: { users: any[], title: string, type: 'seller' | 'buyer' }) => {
    const hasBrokerage = type === 'seller' ? sellerBrokerageId : buyerBrokerageId;
    const hasAgents = type === 'seller' ? hasSellerAgents : hasBuyerAgents;

    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-lg">{title}</h4>
          <button
            type="button"
            onClick={type === 'seller' ? () => setIsSellerAddModalOpen(true) : () => setIsBuyerAddModalOpen(true)}
            className="primary-btn"
            disabled={!hasBrokerage || !hasAgents || isLoading}
          >
            Add {title.split(' ')[0]} Shared Agent
          </button>
        </div>

        {!hasBrokerage && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-700 text-sm">
              Please select a {type} brokerage first to add shared agents.
            </p>
          </div>
        )}

        {hasBrokerage && !hasAgents && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-700 text-sm">
              No agents found in the selected {type} brokerage. Please add agents to the brokerage first.
            </p>
          </div>
        )}
        
        {users && users.length > 0 ? (
          <div className="mt-4">
            {users.map((user: any, userIndex: number) => {
              const globalIndex = sharedUsersData.findIndex((su: any) => su.id === user.id);
              const isUpdating = updatingCommissionId === user.id;
              
              return (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4 bg-white mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg">{user.name || `${user.firstName} ${user.lastName}`}</h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveAgent(user.id)}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                        disabled={isLoading || isUpdating}
                      >
                        {isLoading ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Hidden fields for IDs */}
                    <input type="hidden" {...register(`sharedUsers.${globalIndex}.id`)} value={user.id} />
                    <input type="hidden" {...register(`sharedUsers.${globalIndex}.sharedUserId`)} value={user.sharedUserId} />
                    <input type="hidden" {...register(`sharedUsers.${globalIndex}.representationType`)} value={user.representationType} />
                    
                    {/* User Name */}
                    <TextInput
                      disabled={true}
                      label="Agent Name"
                      register={register}
                      name={`sharedUsers.${globalIndex}.name`}
                      errors={errors}
                      placeholder="Agent name"
                      defaultValue={user.name || `${user.firstName} ${user.lastName}`}
                    />
                    
                    {/* User Email */}
                    <TextInput
                      disabled={true}
                      label="Agent Email"
                      register={register}
                      name={`sharedUsers.${globalIndex}.email`}
                      errors={errors}
                      placeholder="Agent email"
                      type="email"
                      defaultValue={user.email}
                    />
                    
                    {/* Commission Type */}
                    <div className="flex flex-col gap-2">
                      <label>Commission Type</label>
                      <select
                        value={user.commissionType || "percentage"}
                        onChange={(e) => handleCommissionTypeChange(user.id, e.target.value)}
                        className="border border-gray-300 p-2 rounded"
                        disabled={isLoading || isUpdating}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="amount">Amount</option>
                      </select>
                    </div>
                    
                    {/* Commission Value */}
                    <div className="flex flex-col gap-2">
                      <label>
                        {user.commissionType === "percentage" ? "Commission (%)" : "Commission Amount"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={
                          user.commissionType === "percentage" 
                            ? "Enter commission percentage" 
                            : "Enter commission amount"
                        }
                        className="border border-gray-300 p-2 rounded disabled:opacity-50"
                        defaultValue={user.commission || ''}
                        onBlur={(e) => handleCommissionBlur(user.id, e.target.value)}
                        disabled={isLoading || isUpdating}
                      />
                      {isUpdating && (
                        <span className="text-xs text-blue-600">Updating commission...</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-center">
              No shared agents found for {title.toLowerCase()}.
            </p>
          </div>
        )}
      </div>
    );
  };

  const AddAgentModal = ({ 
    isOpen, 
    onClose, 
    title, 
    agentOptions, 
    selectedAgent, 
    setSelectedAgent, 
    onAdd,
    brokerageId,
    hasAgents
  }: any) => {
    const representationType = title.toLowerCase().includes('seller') ? 'seller' : 'buyer';
    
    return (
      <Modal
        open={isOpen}
        onCancel={onClose}
        title={title}
        footer={[
          <button 
            key="cancel" 
            onClick={onClose} 
            className="cancel-btn mr-2"
            disabled={isLoading}
          >
            Cancel
          </button>,
          <button
            key="add"
            onClick={onAdd}
            className="primary-btn"
            disabled={!selectedAgent || isLoading || !hasAgents}
          >
            {isLoading ? "Adding..." : "Add Agent"}
          </button>,
        ]}
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label>Select Agent</label>
            {!brokerageId ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-700 text-sm">
                  Please select a brokerage first to see available agents.
                </p>
              </div>
            ) : !hasAgents ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-700 text-sm">
                  No agents found in this brokerage. Please add agents to the brokerage first.
                </p>
              </div>
            ) : (
              <>
                <Select
                  options={agentOptions}
                  value={agentOptions.find(option => option.value === selectedAgent) || null}
                  onChange={(option) => setSelectedAgent(option ? option.value : null)}
                  placeholder="Select Agent"
                  className="w-full"
                  classNamePrefix="select"
                  isClearable={true}
                  isDisabled={!brokerageId || !hasAgents}
                />
                {selectedAgent && (
                  <div className="mt-2 p-2 bg-blue-50 rounded">
                    <p className="text-sm text-blue-700">
                      Selected: {agentOptions.find(opt => opt.value === selectedAgent)?.label}
                    </p>
                    <p className="text-sm text-blue-600">
                      Will be added as: {title.split(' ')[1]} Shared Agent
                    </p>
                    <p className="text-sm text-blue-600">
                      Representation Type: {representationType}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="max-FULL p-6 bg-[#c9c1c13d] rounded-lg shadow-md mt-6">
      <h3 className="py-2">Shared Agents:</h3>
      <span className="text-xs text-gray-500">
        <strong>Note:</strong> Agents who will share commission for this trade sheet.
      </span>
      
      {/* Seller Shared Users */}
      <SharedUsersList 
        users={sellerSharedUsers} 
        title={`${firstAgent} Shared Agents`} 
        type="seller" 
      />
      
      {/* Buyer Shared Users */}
      <SharedUsersList 
        users={buyerSharedUsers} 
        title={`${secondAgent} Shared Agents`} 
        type="buyer" 
      />

      {/* Add Agent Modals */}
      <AddAgentModal
        isOpen={isSellerAddModalOpen}
        onClose={() => {
          setIsSellerAddModalOpen(false);
          setSelectedSellerAgent(null);
        }}
        title={`Add ${firstAgent} Shared Agent`}
        agentOptions={sellerAgentOptions}
        selectedAgent={selectedSellerAgent}
        setSelectedAgent={setSelectedSellerAgent}
        onAdd={() => handleAddAgent('seller')}
        brokerageId={sellerBrokerageId}
        hasAgents={hasSellerAgents}
      />

      <AddAgentModal
        isOpen={isBuyerAddModalOpen}
        onClose={() => {
          setIsBuyerAddModalOpen(false);
          setSelectedBuyerAgent(null);
        }}
        title={`Add ${secondAgent} Shared Agent`}
        agentOptions={buyerAgentOptions}
        selectedAgent={selectedBuyerAgent}
        setSelectedAgent={setSelectedBuyerAgent}
        onAdd={() => handleAddAgent('buyer')}
        brokerageId={buyerBrokerageId}
        hasAgents={hasBuyerAgents}
      />
    </div>
  );
};

export default SharedUsersSection;