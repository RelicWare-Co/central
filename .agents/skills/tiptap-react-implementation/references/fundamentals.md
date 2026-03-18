# Fundamentals

Read this file first for every Tiptap React task.

## Default choice

For most editors, start with:

- `@tiptap/react`
- `@tiptap/pm`
- `@tiptap/starter-kit`

Use a minimal schema only when the editor must be intentionally tiny.

## Setup Matrix

| Scenario | Recommended base | Reason |
| --- | --- | --- |
| Normal rich text editor | `StarterKit` | fastest path to headings, lists, blockquote, code block, history |
| Very small schema | `Document` + `Paragraph` + `Text` | avoids unnecessary behavior |
| SSR app | `StarterKit` plus `immediatelyRender: false` | prevents hydration and server-render issues |
| Many child UI components | composable API | easier editor access across component tree |

## Basic editor

```tsx
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export function RichTextEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hello World!</p>',
  })

  if (!editor) {
    return null
  }

  return <EditorContent editor={editor} />
}
```

## Minimal schema

Use this only when you do not want the rest of `StarterKit`.

```tsx
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { EditorContent, useEditor } from '@tiptap/react'

export function MinimalEditor() {
  const editor = useEditor({
    extensions: [Document, Paragraph, Text],
    content: '<p>Minimal editor</p>',
  })

  return <EditorContent editor={editor} />
}
```

## SSR rule

For Next.js or any SSR/hybrid app, disable immediate rendering.

```tsx
'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export function SSREditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hello World!</p>',
    immediatelyRender: false,
  })

  if (!editor) {
    return null
  }

  return <EditorContent editor={editor} />
}
```

## Composable API

Use this when many child components need access to the editor.

```tsx
import { Tiptap, useEditor, useTiptap } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

function MenuBar() {
  const { editor, isReady } = useTiptap()

  if (!isReady || !editor) {
    return null
  }

  return (
    <div>
      <button onClick={() => editor.chain().focus().toggleBold().run()}>
        Bold
      </button>
    </div>
  )
}

export function ComposableEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hello World!</p>',
    immediatelyRender: false,
  })

  return (
    <Tiptap instance={editor}>
      <Tiptap.Loading>Loading editor...</Tiptap.Loading>
      <MenuBar />
      <Tiptap.Content />
    </Tiptap>
  )
}
```

## Performance rule

Most React performance issues come from rendering the editor in the wrong component or from using reactive state incorrectly.

Do this:

- isolate the editor from unrelated app state
- subscribe to editor-derived UI state with `useEditorState`
- consider `shouldRerenderOnTransaction: false` if you need tighter render control

```tsx
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBold: editor.isActive('bold'),
      isItalic: editor.isActive('italic'),
    }),
  })

  if (!editor || !state) {
    return null
  }

  return (
    <div>
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
    </div>
  )
}

export function IsolatedEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Optimized editor</p>',
    shouldRerenderOnTransaction: false,
  })

  return (
    <>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </>
  )
}
```

## Persistence rule

Prefer JSON for persistence.

```tsx
import { useMemo } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const STORAGE_KEY = 'editorContent'

export function PersistedEditor() {
  const content = useMemo(() => {
    if (typeof window === 'undefined') {
      return '<p>Hello World!</p>'
    }

    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : '<p>Hello World!</p>'
  }, [])

  const editor = useEditor({
    extensions: [StarterKit],
    content,
  })

  if (!editor) {
    return null
  }

  return (
    <div>
      <EditorContent editor={editor} />
      <button
        onClick={() => {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(editor.getJSON()),
          )
        }}
      >
        Save
      </button>
    </div>
  )
}
```

## Styling rule

Tiptap is headless. Start with CSS before customizing rendering.

```css
.tiptap p {
  margin: 1em 0;
}

.tiptap h1 {
  font-size: 2rem;
  margin: 1.5em 0 0.75em;
}
```

If a project uses Tailwind, prefer styling the editor content area with scoped selectors or typography classes instead of introducing custom node views for visual-only changes.

## Build Checklist

- [ ] Install `@tiptap/react`, `@tiptap/pm`, and the extension packages you actually need.
- [ ] Confirm all `@tiptap/*` versions match.
- [ ] Decide early whether the editor is client-only or SSR.
- [ ] Keep unrelated sidebar/dialog/page state outside the editor component.
- [ ] Add persistence after the editor boots cleanly.
- [ ] Add menus only after the command layer works.
