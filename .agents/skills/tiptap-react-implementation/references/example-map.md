# Task Routing

Use this file to decide which pattern to apply and when to validate against external material.

## Pick the smallest working pattern

- plain rich text editor: use the basic `StarterKit` setup from `fundamentals.md`
- intentionally tiny schema: use the minimal `Document` + `Paragraph` + `Text` setup
- top toolbar: use `useEditorState` with a dedicated toolbar component
- selection toolbar: use a bubble menu
- empty-line insertion UI: use a floating menu
- save/load content: use JSON persistence
- render JSON to HTML without mounting an editor: use the static renderer recipe
- images, mentions, tables, placeholder, link, text align: use the ready-made snippets in `feature-recipes.md`
- custom document widgets: use `custom-extensions.md`

## Menu Selection Table

| Menu type | Use when | Typical content |
| --- | --- | --- |
| Fixed toolbar | formatting should always stay visible | bold, italic, headings, undo/redo, lists |
| Bubble menu | actions depend on text selection | inline formatting, links, comments |
| Floating menu | actions depend on caret position on empty blocks | headings, lists, insertions |
| Mixed approach | editor has both formatting and block insertion workflows | fixed toolbar plus bubble or floating menu |

## Feature Coverage Table

| Feature | Recommended section |
| --- | --- |
| Basic editor | `fundamentals.md` |
| SSR / hydration | `fundamentals.md` |
| Persistence | `fundamentals.md` and static renderer here |
| Fixed toolbar | `feature-recipes.md` |
| Bubble menu | `feature-recipes.md` |
| Floating menu | `feature-recipes.md` |
| Tables | `feature-recipes.md` |
| Checklists / task lists | `feature-recipes.md` |
| Links, images, mentions | `feature-recipes.md` |
| Custom nodes / marks | `custom-extensions.md` |

## Validation rule

This skill is designed to be enough for common work. Only validate against official docs or source when:

- you need an exact option name or command name
- a feature is Pro-only or collaboration-specific
- the task depends on behavior not covered by the embedded examples
- the host app is already using a more advanced Tiptap pattern and you need to match it

## React-specific guardrails

- do not treat `editor.isActive()` as reactive state on its own
- do not put unrelated layout state in the same component that creates the editor
- do not forget `focus()` in toolbar commands
- do not use SSR without `immediatelyRender: false`
- do not persist HTML by default when JSON is enough
- do not introduce a custom node view when simple extension configuration and CSS would solve the task

## Static renderer pattern

Use this when the task is "I have Tiptap JSON and need HTML on the server".

```tsx
import Bold from '@tiptap/extension-bold'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { renderToHTMLString } from '@tiptap/static-renderer'

const json = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Example ' },
        {
          type: 'text',
          marks: [{ type: 'bold' }],
          text: 'Text',
        },
      ],
    },
  ],
}

const html = renderToHTMLString({
  content: json,
  extensions: [Document, Paragraph, Text, Bold],
})
```

## Collaboration rule

Collaboration is a special case:

- disable built-in `undoRedo` inside `StarterKit`
- collaboration history comes from the collaboration extension stack
- if the task includes remote cursors or selections, treat that as a separate concern from basic collaboration

Example extension shape:

```tsx
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'

const extensions = [
  StarterKit.configure({
    undoRedo: false,
  }),
  Collaboration.configure({
    document: ydoc,
  }),
]
```
