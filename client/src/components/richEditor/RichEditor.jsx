import { useRef, useEffect, useCallback } from "react";
import "./richEditor.css";

const TOOLBAR = [
  [
    { cmd: "bold",          icon: "fas fa-bold",         title: "Bold (Ctrl+B)" },
    { cmd: "italic",        icon: "fas fa-italic",        title: "Italic (Ctrl+I)" },
    { cmd: "underline",     icon: "fas fa-underline",     title: "Underline (Ctrl+U)" },
    { cmd: "strikeThrough", icon: "fas fa-strikethrough", title: "Strikethrough" },
  ],
  [
    { cmd: "formatBlock", value: "<p>",  label: "¶",  title: "Normal paragraph" },
    { cmd: "formatBlock", value: "<h2>", label: "H2", title: "Heading 2" },
    { cmd: "formatBlock", value: "<h3>", label: "H3", title: "Heading 3" },
  ],
  [
    { cmd: "insertUnorderedList", icon: "fas fa-list-ul", title: "Bullet list" },
    { cmd: "insertOrderedList",   icon: "fas fa-list-ol", title: "Numbered list" },
  ],
  [
    { cmd: "justifyLeft",   icon: "fas fa-align-left",   title: "Align left" },
    { cmd: "justifyCenter", icon: "fas fa-align-center", title: "Align center" },
    { cmd: "justifyRight",  icon: "fas fa-align-right",  title: "Align right" },
  ],
  [
    { cmd: "removeFormat", icon: "fas fa-remove-format", title: "Clear formatting" },
  ],
];

export default function RichEditor({ value, onChange, placeholder, minHeight }) {
  const editorRef = useRef(null);

  // Set initial HTML once on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = useCallback((cmd, val) => {
    document.execCommand(cmd, false, val ?? null);
    editorRef.current?.focus();
  }, []);

  const handleInput = useCallback(() => {
    if (onChange) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  return (
    <div className="richEditorWrap">
      <div className="richEditorToolbar">
        {TOOLBAR.map((group, gi) => (
          <span key={gi} className="richEditorGroup">
            {group.map((tool, ti) => (
              <button
                key={ti}
                type="button"
                title={tool.title}
                className="richEditorBtn"
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus in editor
                  exec(tool.cmd, tool.value);
                }}
              >
                {tool.icon
                  ? <i className={tool.icon} />
                  : <span className="richEditorBtnText">{tool.label}</span>
                }
              </button>
            ))}
          </span>
        ))}
      </div>
      <div
        ref={editorRef}
        className="richEditorContent"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder || "Write something..."}
        style={minHeight ? { minHeight } : undefined}
      />
    </div>
  );
}
