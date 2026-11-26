import { Button, Modal } from 'antd';
import { AiFillWarning } from 'react-icons/ai';

interface ConfirmDeleteModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
}

const ConfirmDeleteModal = ({
  open,
  onCancel,
  onConfirm,
  loading,
  title = 'Confirm Deletion',
}: ConfirmDeleteModalProps) => (
  <Modal
    title={title}
    open={open}
    onCancel={onCancel}
    footer={[
      <Button key="cancel" onClick={onCancel}>
        Cancel
      </Button>,
      <Button
        key="confirm"
        type="primary"
        danger
        loading={loading}
        onClick={onConfirm}
        style={{ marginLeft: 8 }}
      >
        Confirm
      </Button>,
    ]}
  >
    <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-md">
      <div className="flex items-center">
        <AiFillWarning className="text-2xl mr-2" />
        <p className="font-semibold text-sm">
          Are you sure you want to delete this item?
        </p>
      </div>
      <p className="mt-2 text-sm">
        <span className="font-semibold">Warning:</span> If you delete this item,
        it will be archived, and all previously uploaded files in this section
        will also be archived. Please make sure to backup the uploaded tradesheet
        file before proceeding.
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Deleting this document will archive it and cannot be undone. Proceed with
        caution.
      </p>
      <p className="mt-2 text-sm text-blue-500">
        If you wish to restore this document, please contact the administrator.
      </p>
    </div>
  </Modal>
);

export default ConfirmDeleteModal;
