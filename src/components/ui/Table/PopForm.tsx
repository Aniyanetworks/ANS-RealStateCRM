/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import IconBtn from "../IconBtn";
import { FaRegSquarePlus } from "react-icons/fa6";
import {
  useCreatePageMutation,
  // useGetPagesDataQuery,
} from "../../../redux/api/pageSlice";
import Modal from "../Modal";

const PopForm = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [sections, setSections] = useState([
    { title: "", description: "", image: null },
  ]);

  const [createPage] = useCreatePageMutation();
  // const { data, isLoading } = useGetPagesDataQuery("");

  const showModal = () => setIsModalOpen(true);

  const handleOk = async () => {
    // Create a new FormData object
    const formData = new FormData();

    // Append the page title to the FormData
    formData.append("page_title", pageTitle);

    // Append each section's data to FormData with the correct structure
    sections.forEach((section, index) => {
      formData.append(`content[${index}][title]`, section.title);
      formData.append(`content[${index}][description]`, section.description);

      // Append the image if it exists
      if (section.image) {
        formData.append(`content[${index}][image]`, section.image);
      }
    });

    // Call the createPage mutation with the FormData
    const res = await createPage(formData);
    console.log(res);

    // Log the FormData for debugging
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleAddSection = (e: any) => {
    e.preventDefault();
    setSections([...sections, { title: "", description: "", image: null }]);
  };

  const handleInputChange = (
    index: number,
    field: string,
    value: string | File | null
  ) => {
    const newSections = [...sections] as any;
    newSections[index][field] = value;
    setSections(newSections);
  };

  const handleFileChange = (index: number, file: File | null) => {
    handleInputChange(index, "image", file);
  };

  return (
    <>
      <button onClick={showModal} className="primary-btn mb-5">
        Add more
      </button>
      <Modal
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleOk}
        title="Create page Content"
        footerLeftBtn={
          <IconBtn
            icon={<FaRegSquarePlus className="text-lg" />}
            onClick={handleAddSection}
            text="Add more"
            btnClass="border-none"
          />
        }
      >
        <form className="flex-col flex gap-3 mb-6">
          {/* page title */}
          <div className="flex flex-col ">
            <label>Page Title</label>
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder="Page Title"
              className=""
            />
          </div>

          {sections.map((section, index) => (
            <>
              <div key={index} className=" flex flex-col gap-2 mt-3">
                {/* section title */}

                <div key={index} className="flex flex-col ">
                  <label>Section Title</label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) =>
                      handleInputChange(index, "title", e.target.value)
                    }
                    placeholder="Section Title"
                    className=""
                  />
                </div>

                <div key={index} className="flex flex-col ">
                  <label>Section Description</label>
                  <input
                    type="text"
                    value={section.description}
                    onChange={(e) =>
                      handleInputChange(index, "description", e.target.value)
                    }
                    placeholder="Section Description"
                    className=""
                  />
                </div>

                <div key={index} className="flex flex-col ">
                  <label>Section Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileChange(index, e.target.files?.[0] || null)
                    }
                    className=""
                  />
                </div>
              </div>
              {sections.length > 1 && <hr className="mt-3" />}
            </>
          ))}
        </form>
      </Modal>
    </>
  );
};

export default PopForm;
