/* eslint-disable @typescript-eslint/no-explicit-any */
import "../../../css/Tiptap.css";
import { useEditor, EditorContent, Editor, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Code from "@tiptap/extension-code";
import Link from "@tiptap/extension-link";
import {
  FaBold,
  FaHeading,
  FaItalic,
  FaLink,
  FaListOl,
  FaListUl,
  FaQuoteLeft,
  FaRedo,
  FaStrikethrough,
  FaUnderline,
  FaUndo,
  FaCode,
} from "react-icons/fa";
import { useCallback, useState } from "react";
import Modal from "../Modal";
import IconBtn from "../IconBtn";
import Dangerbtn from "../Dangerbtn";

const Tiptap = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Code,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],
    content: ``,
  }) as Editor;

  const [modalIsOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState<string>("");

  const openModal = useCallback(() => {
    setUrl(editor!.getAttributes("link").href);
    setIsOpen(true);
  }, [editor]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setUrl("");
  }, []);

  // save link
  const saveLink = useCallback(() => {
    if (url) {
      editor!
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url, target: "_blank" })
        .run();
    } else {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
    }

    closeModal();
  }, [editor, url, closeModal]);

  // remove link with button click on Bubble menu
  const removeLink = useCallback(() => {
    editor!.chain().focus().extendMarkRange("link").unsetLink().run();
    closeModal();
  }, [editor, closeModal]);

  if (!editor) {
    return null;
  }

  return (
    <div className="textEditor">
      {/* ------------------------------------------------- */}
      <div className="flex justify-between items-center px-4 bg-lightPurple/10 rounded-t-md">
        <div className="flex gap-3 items-center h-10 flex-wrap group  hover:*:bg-lightPurple/30 *:duration-200 *:p-[5px] *:rounded-sm *:text-[14px] ">
          {/* ----------H1 */}
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={
              editor.isActive("heading", { level: 2 }) ? "is_active" : ""
            }
          >
            <FaHeading />
          </button>

          {/* ----------H2 */}

          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={
              editor.isActive("heading", { level: 3 }) ? "is_active" : ""
            }
          >
            <FaHeading className="text-[10px]" />
          </button>

          {/* ----bold */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "is_active" : ""}
          >
            <FaBold />
          </button>

          {/* ----italic */}

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "is_active" : ""}
          >
            <FaItalic />
          </button>

          {/* ----underline */}

          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive("underline") ? "is_active" : ""}
          >
            <FaUnderline />
          </button>

          {/* ----strike */}

          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive("strike") ? "is_active" : ""}
          >
            <FaStrikethrough />
          </button>

          {/* --------bullet */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "is_active" : ""}
          >
            <FaListUl />
          </button>

          {/* --------number */}

          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "is_active" : ""}
          >
            <FaListOl />
          </button>

          {/* --------qoute */}

          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive("blockquote") ? "is_active" : ""}
          >
            <FaQuoteLeft />
          </button>

          {/* -------code */}
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive("code") ? "is_active" : ""}
          >
            <FaCode />
          </button>

          {/* ------link */}
          <button
            onClick={openModal}
            className={editor.isActive("link") ? "is_active" : ""}
          >
            <FaLink />
          </button>

          {/* ---------bubble menu / only shows when selected text has link */}
          <BubbleMenu
            className="flex gap-2 items-center bg-white p-2 border rounded-md "
            tippyOptions={{ duration: 150 }}
            editor={editor}
            shouldShow={({ editor, from, to }) => {
              const isLink = editor.isActive("link");
              if (isLink) {
                const linkAttrs = editor.getAttributes("link");
                setUrl(linkAttrs.href); // Set active link when BubbleMenu opens
              }
              return from === to && isLink;
            }}
          >
            <input
              type="text"
              value={url} // Display the active link in the input
              onChange={(e) => setUrl(e.target.value)}
            />
            <IconBtn text="Edit" btnClass="border-none" onClick={saveLink} />
            <Dangerbtn text="Remove" onClick={removeLink} />
          </BubbleMenu>
        </div>

        {/* ----------unde/redo btns */}
        <div className="flex gap-5 items-center hover:*:text-primaryPurple *:duration-200">
          {/* ---------undo */}
          <button onClick={() => editor.chain().focus().undo().run()}>
            <FaUndo />
          </button>

          {/* ---------redo */}

          <button onClick={() => editor.chain().focus().redo().run()}>
            <FaRedo />
          </button>
        </div>
      </div>

      <EditorContent editor={editor} />

      <Modal
        handleCancel={closeModal}
        isModalOpen={modalIsOpen}
        handleOk={saveLink}
        title="Edit Link"
      >
        <input
          type="text"
          name=""
          id=""
          placeholder="Paste  your link here"
          onChange={(e) => setUrl(e.target.value)}
          value={url}
        />
      </Modal>
    </div>
  );
};

export default Tiptap;
