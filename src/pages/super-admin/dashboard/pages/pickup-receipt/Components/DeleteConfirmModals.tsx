// @ts-nocheck
import { Modal, Button } from "antd";

interface DeleteConfirmModalsProps {
  isModalVisible: boolean;
  isDeleteMultipleModalVisible: boolean;
  cancelDelete: () => void;
  confirmDelete: () => void;
  handleDeleteConfirmMultiple: () => void;
}

const DeleteConfirmModals = ({
  isModalVisible,
  isDeleteMultipleModalVisible,
  cancelDelete,
  confirmDelete,
  handleDeleteConfirmMultiple,
}: DeleteConfirmModalsProps) => {
  return (
    <>
      {/* Delete single receipt */}
      <Modal
        title="Confirm Deletion"
        visible={isModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={confirmDelete}
            style={{ marginLeft: "8px" }}
          >
            Confirm
          </Button>,
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
        ]}
      >
        <p>Are you sure you want to delete this item?</p>
      </Modal>

      {/* Delete Multiple Confirmation Modal */}
      <Modal
        title="Confirm Deletion"
        open={isDeleteMultipleModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={handleDeleteConfirmMultiple}
          >
            Confirm
          </Button>,
        ]}
      >
        Are you sure you want to delete selected items?
      </Modal>
    </>
  );
};

export default DeleteConfirmModals;

