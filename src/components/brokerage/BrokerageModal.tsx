import { Modal } from 'antd';
import { BrokerageForm } from './BrokerageForm';
import { FieldErrors, FieldValues, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { UseFormRegister } from 'react-hook-form';

interface BrokerageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  title: string;
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors<FieldValues>;
  states: {
    data: {
        states: [];
    };
  };
  cities: {
    data: {
        cities: [];
    };
  };
  watch: UseFormWatch<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
}

export const BrokerageModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  register,
  errors,
  states,
  cities,
  watch,
  setValue,
}: BrokerageModalProps) => {
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      onOk={onSubmit}
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
          onClick={onSubmit}
          className="primary-btn"
        >
          Create
        </button>,
      ]}
    >
      <BrokerageForm
        register={register}
        errors={errors}
        states={states}
        cities={cities}
        watch={watch}
        setValue={setValue}
      />
    </Modal>
  );
}; 