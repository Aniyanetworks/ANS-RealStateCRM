// components/ValidationModal.tsx
import Modal from 'antd/es/modal';

interface ValidationModalProps {
  isOpen: any;
  onClose: () => void;
  title: string;
  isUploading: boolean;
  register: any;
  errors: any;
  onPhoneNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitValidation: () => void;
}

const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  title,
  isUploading,
  register,
  errors,
  onPhoneNumberChange,
  onAddressChange,
  onSubmitValidation,
}) => {
  return (
    <Modal
      onCancel={onClose}
      open={isOpen}
      title={title}
      width={"600px"}
      loading={isUploading}
      footer={[
        <button
          key="cancel"
          className="cancel-btn mr-1"
          onClick={onClose}
        >
          Cancel
        </button>,
        <button
          key="confirm"
          className="primary-btn"
          onClick={onSubmitValidation}
          style={{ marginLeft: "8px" }}
        >
          Continue
        </button>,
      ]}
    >
      <form className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label>
              Phone Number<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("phoneNumber")}
              type="text"
              placeholder="e.g. +1 (123) 456-7890"
              className=""
              onChange={onPhoneNumberChange}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm">
                {errors.phoneNumber.message as string}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label>
              Address<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("address")}
              type="text"
              placeholder="Enter Address"
              className=""
              onChange={onAddressChange}
            />
            {errors.address && (
              <p className="text-red-500 text-sm">
                {errors.address.message as string}
              </p>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ValidationModal;
