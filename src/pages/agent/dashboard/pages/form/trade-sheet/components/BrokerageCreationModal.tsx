// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import Modal from 'antd/es/modal';

interface BrokerageCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  form: any;
  modalContent: () => JSX.Element;
  onCreate: () => void;
}

const BrokerageCreationModal: React.FC<BrokerageCreationModalProps> = ({
  isOpen,
  onClose,
  title,
  form,
  modalContent,
  onCreate,
}) => {
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={title}
      width={800}
      footer={[
        <button
          key="cancel"
          onClick={onClose}
          className="cancel-btn mr-2"
        >
          Cancel
        </button>,
        <button
          key="create"
          onClick={onCreate}
          className="primary-btn"
        >
          Create
        </button>,
      ]}
    >
      {modalContent()}
    </Modal>
  );
};

export default BrokerageCreationModal;