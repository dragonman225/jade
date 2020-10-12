/**
 * This file also serves as a quick test of Slate.js, so it contains 
 * dead code that is not used by Jade.
 */

import * as React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { createEditor, Node, Transforms, Editor } from 'slate'
import {
  Slate, Editable, withReact, RenderElementProps, RenderLeafProps,
  ReactEditor
} from 'slate-react'
import { withHistory } from 'slate-history'

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format)
  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

export interface MyEditorProps {
  content: Node[]
  readOnly: boolean
  focus: boolean
  onChange: (content: Node[]) => void
  onFocus?: () => void
  onBlur?: () => void
}

export const MyEditor = (props: MyEditorProps): JSX.Element => {
  const editor = useMemo(() => withReact(withHistory(createEditor())), [])
  const [value, setValue] = useState(props.content)

  /**
   * Need content to be loaded and DOM created first so that we can focus.
   * So, useEffect() is necessary.
   */
  React.useEffect(() => {
    if (props.focus) {
      console.log('focus newly created text programmatically')
      editor.selection = {
        anchor: {
          path: [0, 0],
          offset: 0
        },
        focus: {
          path: [0, 0],
          offset: 0
        }
      }
      ReactEditor.focus(editor)
    }
  }, [])

  // Define a rendering function based on the element passed to `props`. We use
  // `useCallback` here to memoize the function for subsequent renders.
  const renderElement = useCallback((props: RenderElementProps) => {
    switch (props.element.type) {
      case 'code':
        return <CodeElement {...props} />
      default:
        return <DefaultElement {...props} />
    }
  }, [])

  // Define a leaf rendering function that is memoized with `useCallback`.
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return <Leaf {...props} />
  }, [])

  const onChange = (newValue: Node[]) => {
    props.onChange(newValue)
    setValue(newValue)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === '[') {
      e.preventDefault()
      editor.insertText('[]')
      Transforms.move(editor, { distance: 1, unit: 'character', reverse: true })
    } else if (e.key === '`' && e.ctrlKey) {
      e.preventDefault()
      toggleMark(editor, 'code')
    } else if (e.key === 'b' && e.ctrlKey) {
      e.preventDefault()
      toggleMark(editor, 'bold')
    } else if (e.key === 'i' && e.ctrlKey) {
      e.preventDefault()
      toggleMark(editor, 'italic')
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey)
        editor.insertText('\n')
    }
  }

  return (
    <Slate editor={editor} value={value} onChange={onChange} >
      <Editable
        readOnly={props.readOnly}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onKeyDown={onKeyDown}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        placeholder={'Type here...'} />
    </Slate>
  )
}

const DefaultElement = (props: RenderElementProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return props.children
}

const CodeElement = (props: RenderElementProps) => {
  return (
    <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  )
}

const Leaf = (props: RenderLeafProps) => {
  const { attributes, leaf } = props
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  let { children } = props
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.code) {
    children = (
      <code>
        <style jsx>{`
          code {
            border-radius: 5px;
            background-color: rgba(135, 131, 120, 0.15);
            color: #ff4081;
            font-size: 0.9em;
            padding: 0em 0.4em;
            word-break: break-word;
          }
        `}</style>
        {children}
      </code>
    )
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  return <span {...attributes}>{children}</span>
}