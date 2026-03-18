# Feature Recipes

Use this file when the user asks for a concrete React implementation pattern.

## Recipe Matrix

| Need | Recipe |
| --- | --- |
| Always-visible formatting | Fixed toolbar |
| Selection-based formatting | Bubble menu |
| Empty-line insertion UI | Floating menu |
| Interactive tables | Table support |
| Checklists | Task list / checklist |
| Link creation | Link editing |
| Media insertion | Image insertion |
| Mentions | Mention suggestions |
| Text alignment | Text align |
| History controls | Undo / redo only |

## Fixed toolbar

```tsx
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBold: editor.isActive('bold'),
      isItalic: editor.isActive('italic'),
      canUndo: editor.can().chain().focus().undo().run(),
      canRedo: editor.can().chain().focus().redo().run(),
    }),
  })

  if (!editor || !state) {
    return null
  }

  return (
    <div className="toolbar">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={state.isBold ? 'is-active' : ''}
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={state.isItalic ? 'is-active' : ''}
      >
        Italic
      </button>
      <button onClick={() => editor.chain().focus().undo().run()} disabled={!state.canUndo}>
        Undo
      </button>
      <button onClick={() => editor.chain().focus().redo().run()} disabled={!state.canRedo}>
        Redo
      </button>
    </div>
  )
}

export function EditorWithToolbar() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hello World!</p>',
  })

  return (
    <>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </>
  )
}
```

## Bubble menu

```tsx
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'

export function BubbleMenuEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Select some text to format it.</p>',
  })

  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBold: editor.isActive('bold'),
      isItalic: editor.isActive('italic'),
    }),
  })

  if (!editor) {
    return null
  }

  return (
    <>
      <BubbleMenu editor={editor}>
        <div className="bubble-menu">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={state?.isBold ? 'is-active' : ''}
          >
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={state?.isItalic ? 'is-active' : ''}
          >
            Italic
          </button>
        </div>
      </BubbleMenu>
      <EditorContent editor={editor} />
    </>
  )
}
```

## Floating menu

```tsx
import { EditorContent, useEditor } from '@tiptap/react'
import { FloatingMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'

export function FloatingMenuEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Press enter on an empty line.</p><p></p>',
  })

  if (!editor) {
    return null
  }

  return (
    <>
      <FloatingMenu editor={editor}>
        <div className="floating-menu">
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            H1
          </button>
          <button onClick={() => editor.chain().focus().toggleBulletList().run()}>
            Bullet list
          </button>
        </div>
      </FloatingMenu>
      <EditorContent editor={editor} />
    </>
  )
}
```

## Image insertion

`Image` only renders images. Uploading is your responsibility.

```tsx
import Document from '@tiptap/extension-document'
import Image from '@tiptap/extension-image'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { EditorContent, useEditor } from '@tiptap/react'

export function ImageEditor() {
  const editor = useEditor({
    extensions: [Document, Paragraph, Text, Image],
    content: '<p>Add an image:</p>',
  })

  if (!editor) {
    return null
  }

  return (
    <>
      <button
        onClick={() => {
          const src = window.prompt('Image URL')
          if (src) {
            editor.chain().focus().setImage({ src }).run()
          }
        }}
      >
        Insert image
      </button>
      <EditorContent editor={editor} />
    </>
  )
}
```

## Mention suggestions

Install `@tiptap/suggestion` alongside `@tiptap/extension-mention`.

```tsx
import Document from '@tiptap/extension-document'
import Mention from '@tiptap/extension-mention'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { EditorContent, useEditor } from '@tiptap/react'

const people = ['Ada Lovelace', 'Grace Hopper', 'Linus Torvalds']

export function MentionEditor() {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: {
          char: '@',
          items: ({ query }) => {
            return people
              .filter(item =>
                item.toLowerCase().includes(query.toLowerCase()),
              )
              .slice(0, 5)
          },
        },
      }),
    ],
    content: '<p>Type @ to open mention suggestions.</p>',
  })

  return <EditorContent editor={editor} />
}
```

Use `suggestions` instead of `suggestion` if you need multiple triggers such as `@` and `#`.

## Table support

Prefer `TableKit` unless the host app needs highly custom table wiring.

```tsx
import StarterKit from '@tiptap/starter-kit'
import { TableKit } from '@tiptap/extension-table'
import { EditorContent, useEditor } from '@tiptap/react'

export function TableEditor() {
  const editor = useEditor({
    extensions: [StarterKit, TableKit],
    content: '<p>Insert a table below.</p>',
  })

  if (!editor) {
    return null
  }

  return (
    <>
      <button
        onClick={() =>
          editor.commands.insertTable({
            rows: 3,
            cols: 3,
            withHeaderRow: true,
          })
        }
      >
        Insert table
      </button>
      <EditorContent editor={editor} />
    </>
  )
}
```

## Table support with editing commands

Use this when the product needs real table controls instead of only initial insertion.

```tsx
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import { TableKit } from '@tiptap/extension-table'
import Text from '@tiptap/extension-text'
import { Gapcursor } from '@tiptap/extensions'
import { EditorContent, useEditor } from '@tiptap/react'

export function AdvancedTableEditor() {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Gapcursor,
      TableKit.configure({
        table: { resizable: true },
      }),
    ],
    content: `
      <table>
        <tbody>
          <tr>
            <th>Name</th>
            <th colspan="2">Role</th>
          </tr>
          <tr>
            <td>Ada</td>
            <td>Engineer</td>
            <td>Writer</td>
          </tr>
        </tbody>
      </table>
    `,
  })

  if (!editor) {
    return null
  }

  return (
    <>
      <div className="toolbar">
        <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          Insert table
        </button>
        <button onClick={() => editor.chain().focus().addColumnBefore().run()}>
          Add column before
        </button>
        <button onClick={() => editor.chain().focus().addColumnAfter().run()}>
          Add column after
        </button>
        <button onClick={() => editor.chain().focus().deleteColumn().run()}>
          Delete column
        </button>
        <button onClick={() => editor.chain().focus().addRowBefore().run()}>
          Add row before
        </button>
        <button onClick={() => editor.chain().focus().addRowAfter().run()}>
          Add row after
        </button>
        <button onClick={() => editor.chain().focus().deleteRow().run()}>
          Delete row
        </button>
        <button onClick={() => editor.chain().focus().mergeCells().run()}>
          Merge cells
        </button>
        <button onClick={() => editor.chain().focus().splitCell().run()}>
          Split cell
        </button>
        <button onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
          Toggle header row
        </button>
      </div>
      <EditorContent editor={editor} />
    </>
  )
}
```

## Task list / checklist

Use this when the editor needs checkable items, nested checklists, or Notion-like task blocks.

```tsx
import Document from '@tiptap/extension-document'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { EditorContent, useEditor } from '@tiptap/react'

export function ChecklistEditor() {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: `
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="true">Install Tiptap</li>
        <li data-type="taskItem" data-checked="false">Build toolbar</li>
      </ul>
    `,
  })

  if (!editor) {
    return null
  }

  return (
    <>
      <div className="toolbar">
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          Toggle checklist
        </button>
        <button
          onClick={() => editor.chain().focus().splitListItem('taskItem').run()}
          disabled={!editor.can().splitListItem('taskItem')}
        >
          Split item
        </button>
        <button
          onClick={() => editor.chain().focus().sinkListItem('taskItem').run()}
          disabled={!editor.can().sinkListItem('taskItem')}
        >
          Indent item
        </button>
        <button
          onClick={() => editor.chain().focus().liftListItem('taskItem').run()}
          disabled={!editor.can().liftListItem('taskItem')}
        >
          Outdent item
        </button>
      </div>
      <EditorContent editor={editor} />
    </>
  )
}
```

## Placeholder

```tsx
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/react'

export function PlaceholderEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
  })

  return <EditorContent editor={editor} />
}
```

## Link editing

```tsx
import Link from '@tiptap/extension-link'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/react'

export function LinkEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: '<p>Select text and add a link.</p>',
  })

  if (!editor) {
    return null
  }

  return (
    <>
      <button
        onClick={() => {
          const href = window.prompt('URL')
          if (!href) return

          editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
        }}
      >
        Set link
      </button>
      <button onClick={() => editor.chain().focus().unsetLink().run()}>
        Remove link
      </button>
      <EditorContent editor={editor} />
    </>
  )
}
```

## Text align

```tsx
import TextAlign from '@tiptap/extension-text-align'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/react'

export function TextAlignEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: '<p>Align this paragraph.</p>',
  })

  if (!editor) {
    return null
  }

  return (
    <>
      <button onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        Left
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        Center
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        Right
      </button>
      <EditorContent editor={editor} />
    </>
  )
}
```

## Undo / redo only

Use this when the app wants explicit history buttons but not a full formatting toolbar.

```tsx
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { UndoRedo } from '@tiptap/extensions'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'

export function HistoryEditor() {
  const editor = useEditor({
    extensions: [Document, Paragraph, Text, UndoRedo],
    content: '<p>Edit this text and try undo/redo.</p>',
  })

  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      canUndo: editor.can().chain().focus().undo().run(),
      canRedo: editor.can().chain().focus().redo().run(),
    }),
  })

  if (!editor) {
    return null
  }

  return (
    <>
      <div className="toolbar">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!state?.canUndo}
        >
          Undo
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!state?.canRedo}
        >
          Redo
        </button>
      </div>
      <EditorContent editor={editor} />
    </>
  )
}
```

## Menu checklist

- [ ] Fixed toolbar if formatting must always be visible.
- [ ] Bubble menu if actions depend on selected text.
- [ ] Floating menu if actions depend on empty blocks.
- [ ] `focus()` inside commands so clicks do not steal editor focus.
- [ ] Reactive state via `useEditorState` or `useTiptapState`.
- [ ] Small, focused menus instead of one giant toolbar when the editor does many jobs.
