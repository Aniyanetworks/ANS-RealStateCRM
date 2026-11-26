interface TextInputProps {
  label: string;
  register: any;
  required?: boolean;
  name: string;
  errors: any;
  type?: string;
  placeholder?: string;
  step?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  disabled?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  register,
  required,
  name,
  errors,
  type = "text",
  placeholder = "",
  step,
  onChange,
  value,
  disabled = false,
}) => (
  <div className="flex flex-col gap-2">
    <label>
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      {...register(name, { required })}
      type={type}
      placeholder={placeholder}
      {...(step && { step })}
      className="border border-gray-300 p-2 rounded"
      onChange={(e) => {
        register(name).onChange(e);
        onChange?.(e);
      }}
      {...(value !== undefined ? { value } : {})}
      disabled={disabled}
    />
    {errors[name] && (
      <p className="text-red-500 text-sm">{`${label} is required`}</p>
    )}
  </div>
);

export default TextInput;