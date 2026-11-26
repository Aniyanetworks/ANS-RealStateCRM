// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import { Button, Modal } from "antd";

interface DeleteModalsProps {
  isModalDeleteVisible: boolean;
  isDeleteMultipleModalVisible: boolean;
  onCancel: () => void;
  onConfirmDelete: () => void;
  onConfirmDeleteMultiple: () => void;
}

const DeleteModals = ({
  isModalDeleteVisible,
  isDeleteMultipleModalVisible,
  onCancel,
  onConfirmDelete,
  onConfirmDeleteMultiple,
}: DeleteModalsProps) => {
  return (
    <>
      {/* Delete Single Confirmation Modal */}
      <Modal
        title="Confirm Deletion"
        visible={isModalDeleteVisible}
        onCancel={onCancel}
        footer={[
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={onConfirmDelete}
            style={{ marginLeft: "8px" }}
          >
            Confirm
          </Button>,
          <Button key="cancel" onClick={onCancel}>
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
        onCancel={onCancel}
        footer={[
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={onConfirmDeleteMultiple}
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

export default DeleteModals;

