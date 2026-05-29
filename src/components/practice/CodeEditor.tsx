import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { useMemo } from 'react'
import type { CodeLanguage } from '../../data/languages'

interface CodeEditorProps {
  value: string
  language: CodeLanguage
  onChange: (value: string) => void
  readOnly?: boolean
}

function getCodeMirrorLanguage(language: CodeLanguage) {
  switch (language) {
    case 'python':
      return python()
    case 'javascript':
      return javascript()
    case 'typescript':
      return javascript({ typescript: true })
  }
}

const prepifyEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#07111f',
      height: '100%',
    },
    '.cm-scroller': {
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: '12px',
      lineHeight: '1.625',
    },
    '.cm-gutters': {
      backgroundColor: '#0b1730',
      color: '#64748b',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(77, 163, 255, 0.08)',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(77, 163, 255, 0.06)',
    },
    '.cm-cursor': {
      borderLeftColor: '#4da3ff',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'rgba(77, 163, 255, 0.22) !important',
    },
  },
  { dark: true },
)

export function CodeEditor({ value, language, onChange, readOnly = false }: CodeEditorProps) {
  const extensions = useMemo(
    () => [getCodeMirrorLanguage(language), prepifyEditorTheme, EditorView.lineWrapping],
    [language],
  )

  return (
    <CodeMirror
      value={value}
      theme={vscodeDark}
      extensions={extensions}
      onChange={onChange}
      readOnly={readOnly}
      editable={!readOnly}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
        highlightSelectionMatches: false,
        autocompletion: false,
      }}
      className="code-editor h-full overflow-hidden [&_.cm-editor]:h-full [&_.cm-editor]:outline-none [&_.cm-scroller]:theme-scrollbar"
      aria-label="Code editor"
    />
  )
}
