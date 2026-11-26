import 'react-quill-new/dist/quill.snow.css';
import React, { useEffect } from 'react';
import { Modal } from 'antd';
import { useForm } from 'react-hook-form';
import ReactQuill from 'react-quill-new';

interface Template {
  id?: number;
  uuid?: string;
  name: string;
  slug: string;
  subject: string;
  content: string;
  type: string;
  area: string;
  date?: string;
  status: string;
}

const formatDate = (date: string | undefined): string => {
  if (!date) return '';
  const newDate = new Date(date);
  return newDate.toISOString().split('T')[0];
};
interface TemplateModalProps {
  template: Template | null;
  onClose: (data?: Template) => void;
}

const TradeSheetShareDocumentTemplateModal: React.FC<TemplateModalProps> = ({ template, onClose }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Template>({
    defaultValues: {
      name: '',
      slug: '',
      subject: '',
      content: '',
      type: 'email',
      area: 'tradesheet_share_document',
      status: 'active',
    },
  });

  const content = watch('content');

  useEffect(() => {
    console.log('template', template)
    if (template) {
      reset({
        ...template,
        date: formatDate(template.date),
      });
    } else {
      reset({
        name: "",
        slug: "",
        subject: "",
        content: "",
        type: "email",
        area: "tradesheet_share_document",
        status: "active",
      });
    }
  }, [template, reset]);

  const onSubmit = (data: Template) => {
    onClose(data);
  };

  const handleEditorChange = (value: string) => {
    setValue('content', value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <Modal
      title={template ? 'Edit Template' : 'Create Template'}
      open={true}
      onCancel={() => onClose()}
      width="700px"
      footer={[
        <button key="cancel" className="cancel-btn mx-2" onClick={() => onClose()}>Cancel</button>,
        <button key="save" className="primary-btn" onClick={handleSubmit(onSubmit)}>Save</button>,
      ]}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            className="border p-2 w-full"
            placeholder="Name"
            {...register("name", { required: "Please enter a name" })}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        {/* <div className="form-group">
          <label>Slug</label>
          <input
            type="text"
            className="border p-2 w-full"
            placeholder="Slug"
            {...register("slug", { required: "Please enter a slug" })}
          />
          {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>}
        </div> */}

        {/* <div className="form-group">
          <label>Subject</label>
          <input
            type="text"
            className="border p-2 w-full"
            placeholder="Subject"
            {...register("subject", { required: "Please enter a subject" })}
          />
          {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
        </div> */}

        <div className="form-group mb-10">
          <label>Content</label>
          <div className="quill-wrapper">
            <ReactQuill
              value={content}
              onChange={handleEditorChange}
              modules={{
                toolbar: [
                  [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
                  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                  ['bold', 'italic', 'underline'],
                  [{ 'align': [] }],
                  ['link', 'image'],
                  [{ 'color': [] }]
                ],
              }}
              theme="snow"
              placeholder="Write your content here..."
              style={{ height: '150px' }}
            />
          </div>
          <input
            type="hidden"
            {...register("content", {
              required: "Content is required",
              validate: value => value.trim() !== '' || "Content cannot be empty"
            })}
          />
          {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>}
        </div>

        {/* <div className="form-group">
          <label>Type</label>
          <select className="border p-2 w-full" {...register("type", { required: true })}>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="call">Call</option>
          </select>
        </div> */}

        {/* <div className="form-group">
          <label>Area</label>
          <select className="border p-2 w-full" {...register("area", { required: true })}>
            <option value="tradesheet_share_document">TradeSheet Share Document</option>
            <option value="propertylisting">Property Listing</option>
          </select>
        </div> */}

        <div className="form-group">
          <label >Status</label>
          <select className="border p-2 w-full" {...register("status", { required: true })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default TradeSheetShareDocumentTemplateModal;
