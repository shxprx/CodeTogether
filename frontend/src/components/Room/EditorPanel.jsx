import { useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import './EditorPanel.css';

/**
 * Language → Monaco language identifier mapping.
 * Monaco uses 'cpp' as 'cpp' but the display name differs.
 */
const MONACO_LANGUAGE_MAP = {
  cpp: 'cpp',
  python: 'python',
  java: 'java',
};

/**
 * EditorPanel — wraps the Monaco Editor.
 *
 * Props:
 *   code     — current code (from context, may be updated by other users)
 *   language — current language
 *   onChange — called with the full code string on every edit
 *
 * We track whether the change came from the local user (typing)
 * or from a remote update (CODE_UPDATED via context) to avoid
 * echo loops.
 */
export default function EditorPanel({ code, language, onChange }) {
  const editorRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  const handleChange = useCallback((value) => {
    // If the change came from us programmatically setting the value
    // (remote CODE_UPDATED), don't send it back to the server.
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    onChange(value || '');
  }, [onChange]);

  // When `code` changes from a remote update, we need to update
  // the editor without triggering a CODE_CHANGE back to the server.
  // Monaco @monaco-editor/react handles this: when `value` prop changes,
  // it updates the editor model. We use the `isRemoteUpdate` flag
  // to prevent the onChange from firing a CODE_CHANGE.

  // We detect remote vs local changes by checking if the editor's
  // current value matches the incoming code.
  // If they differ, it's a remote update.
  const currentEditorValue = editorRef.current?.getValue();
  if (currentEditorValue !== undefined && currentEditorValue !== code) {
    isRemoteUpdate.current = true;
  }

  return (
    <div className="editor-panel">
      <Editor
        height="100%"
        language={MONACO_LANGUAGE_MAP[language] || 'plaintext'}
        value={code}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          padding: { top: 12 },
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          automaticLayout: true,
          tabSize: 4,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
        }}
      />
    </div>
  );
}
