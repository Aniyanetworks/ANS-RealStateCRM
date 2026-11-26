// @ts-nocheck
import ModalMain from "../../../../../../components/ui/Modal";
import ReceiptForm from "./ReceiptForm";

interface ReceiptCreateEditModalProps {
  isModalOpen: boolean;
  handleCancel: () => void;
  handleOk: () => void;
  isLoading: boolean;
  register: any;
  errors: any;
  propertyListingOptions: any[];
  selectedPropertyListingId: React.Key;
  handlePropertyListingChange: (selectedOption: any) => void;
  uploadReceiverIdImage: string;
  handleUploadReceiverIdImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveReceiverIdImage: () => void;
}

const ReceiptCreateEditModal = ({
  isModalOpen,
  handleCancel,
  handleOk,
  isLoading,
  register,
  errors,
  propertyListingOptions,
  selectedPropertyListingId,
  handlePropertyListingChange,
  uploadReceiverIdImage,
  handleUploadReceiverIdImage,
  handleRemoveReceiverIdImage,
}: ReceiptCreateEditModalProps) => {
  return (
    <ModalMain
      handleCancel={handleCancel}
      isModalOpen={isModalOpen}
      handleOk={handleOk}
      title="Create Receipt"
      isLoading={isLoading}
      modalClass={"lg:!w-[70%] !z-[10000]"}
    >
      <ReceiptForm
        register={register}
        errors={errors}
        propertyListingOptions={propertyListingOptions}
        selectedPropertyListingId={selectedPropertyListingId}
        handlePropertyListingChange={handlePropertyListingChange}
        uploadReceiverIdImage={uploadReceiverIdImage}
        handleUploadReceiverIdImage={handleUploadReceiverIdImage}
        handleRemoveReceiverIdImage={handleRemoveReceiverIdImage}
      />
    </ModalMain>
  );
};

export default ReceiptCreateEditModal;

