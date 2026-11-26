// @ts-nocheck
import ReactQuill from "react-quill-new";
import ButtonLoader from "../../../../../../components/loader/buttonLoader";
import "react-quill-new/dist/quill.snow.css";

interface EmailFormProps {
  register: any;
  errors: any;
  handleChange: (value: any) => void;
  onSubmitEmail: () => void;
  isEmailSend: boolean;
  data: string;
}

const EmailForm = ({
  register,
  errors,
  handleChange,
  onSubmitEmail,
  isEmailSend,
  data,
}: EmailFormProps) => {
  return (
    <div className="space-y-3 pt-5">
      <div>
        <h5 className="mb-2 text-center font-bold">Send Email</h5>

        {/* Recipients Input */}
        <div className="mb-4">
          <label className="font-bold">Recipients Email:</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Enter email addresses separated by commas"
            {...register("recipients", {
              required: "Recipients are required",
            })}
          />
          {errors?.recipients && (
            <span className="text-red-500">
              {errors?.recipients.message}
            </span>
          )}
        </div>

        {/* Subject Input (Text Area) */}
        <div className="mb-4">
          <label className="font-bold">Email Subject:</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Subject"
            {...register("subject", {
              required: "Subject is required",
            })}
          />

          {errors?.subject && (
            <span className="text-red-500">{errors?.subject?.message}</span>
          )}
        </div>

        {/* Data Input (Text Area) */}
        <div className="mb-4">
          <label className="font-bold">Email Body:</label>
          <ReactQuill
            value={data}
            onChange={handleChange}
            modules={{
              toolbar: [
                [{ header: "1" }, { header: "2" }, { font: [] }],
                [{ list: "ordered" }, { list: "bullet" }],
                ["bold", "italic", "underline"],
                [{ align: [] }],
                ["link", "image"],
                [{ color: [] }],
              ],
            }}
            theme="snow"
            placeholder="Write your email body here..."
          />
          {errors?.data && (
            <span className="text-red-500">{errors?.data?.message}</span>
          )}
        </div>
        {/* Submit Button */}
        <div>
          <button
            className="bg-[#0f766e] text-white p-2 rounded-md flex gap-2 items-center"
            onClick={onSubmitEmail}
            disabled={isEmailSend}
          >
            {isEmailSend && <ButtonLoader />}
            {isEmailSend ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailForm;

