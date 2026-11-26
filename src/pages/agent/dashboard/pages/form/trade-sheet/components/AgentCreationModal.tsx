import Modal from 'antd/es/modal';
import Select from 'react-select';

interface AgentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  form: any;
  brokerageOptions: any[];
  createAgent: any;
  internalAgent: any;
  onSuccess: (newAgent: any) => void;
}

const AgentCreationModal: React.FC<AgentCreationModalProps> = ({
  isOpen,
  onClose,
  title,
  form,
  brokerageOptions,
  createAgent,
  internalAgent,
  onSuccess,
}) => {
  const handleCreateAgent = async (data: any) => {
    const response = await createAgent(data);
    if (response?.data?.status) {
      onClose();
      form.reset();
      if (internalAgent.refetch) await internalAgent.refetch();
      const newAgent = response?.data?.data?.agentData;
      onSuccess(newAgent);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={title}
      footer={[
        <button key="cancel" onClick={onClose} className="cancel-btn mr-2">
          Cancel
        </button>,
        <button
          key="create"
          onClick={form.handleSubmit(handleCreateAgent)}
          className="primary-btn"
        >
          Create
        </button>,
      ]}
    >
      <form>
        <div className="flex flex-col gap-4">
          <Select
            options={brokerageOptions}
            value={brokerageOptions.find(opt => opt.value === form.watch("brokerageId"))}
            onChange={opt => form.setValue("brokerageId", opt.value)}
            placeholder="Select Brokerage"
            classNamePrefix="select"
            isClearable
            isLoading={!brokerageOptions.length}
          />
          {!brokerageOptions.length && (
            <div className="text-red-500 text-sm">No brokerages found. Please create a brokerage first.</div>
          )}
          <div className='w-full flex gap-3'>
            <div className="flex-1">
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">First Name *</label>
              <input 
                {...form.register("firstName", { required: true })} 
                placeholder="First Name" 
                className="border p-2 rounded w-full" 
              />
            </div>
            <div className="flex-1">
              <label htmlFor="lastName" className="block text-sm font-medium mb-1">Last Name </label>
              <input 
                {...form.register("lastName", { required: false })} 
                placeholder="Last Name" 
                className="border p-2 rounded w-full" 
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email *</label>
            <input 
              {...form.register("email", { required: true })} 
              placeholder="Email" 
              type="email" 
              className="border p-2 rounded w-full" 
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AgentCreationModal;