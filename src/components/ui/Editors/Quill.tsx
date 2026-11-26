// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
// import ReactQuill from "react-quill-new";
// 
// import "react-quill/dist/quill.bubble.css"; // Import for bubble theme

type QuillProps = {
  value: string;
  onChange: (html: string) => void;
};

const Quill = ({ value, onChange }: QuillProps) => {
  // const [editorHtml, setEditorHtml] = useState("");

  // const handleChange = (html: string) => {
  //   setEditorHtml(html);
  // };

  const modules = {
    toolbar: [
      [{ header: "1" }, { header: "2" }, { font: [] }],
      [{ size: [] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [
        { list: "ordered" },
        { list: "bullet" },
        { indent: "-1" },
        { indent: "+1" },
      ],
      ["link", "image", "video"],
      ["clean"],
    ],
    clipboard: {
      matchVisual: false, // To avoid extra line breaks when pasting HTML
    },
  };

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
    "video",
  ];

  return (
    <div>
      {/* <ReactQuill
        theme={"snow"}
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        bounds={".app"}
        placeholder={"write here"}
      /> */}
    </div>
  );
};

export default Quill;
