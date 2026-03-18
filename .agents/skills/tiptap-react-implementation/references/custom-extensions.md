# Custom Extensions

Use this file when the task needs custom nodes, marks, or React-rendered content inside the editor.

## Decision rule

Choose the simplest approach that works:

- configure an existing extension when possible
- extend an existing extension when you only need new attributes or different HTML
- create a new node or mark only when the schema is genuinely new
- use React node views only when you need interactive React UI inside the document

Do not introduce a node view just for styling.

## Custom node with a React node view

This is the baseline pattern for an interactive block inside the document.

### Extension

```tsx
import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CounterNodeView from './CounterNodeView'

export const CounterNode = Node.create({
  name: 'counterNode',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      count: {
        default: 0,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'counter-node' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['counter-node', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CounterNodeView)
  },
})
```

### React component

```tsx
import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react'

export default function CounterNodeView(props: ReactNodeViewProps) {
  return (
    <NodeViewWrapper className="counter-node">
      <button
        onClick={() =>
          props.updateAttributes({
            count: props.node.attrs.count + 1,
          })
        }
      >
        Clicked {props.node.attrs.count} times
      </button>
    </NodeViewWrapper>
  )
}
```

### Register it

```tsx
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/react'
import { CounterNode } from './CounterNode'

export function CustomNodeEditor() {
  const editor = useEditor({
    extensions: [StarterKit, CounterNode],
    content: '<p>Before the custom node</p><counter-node count="2"></counter-node>',
  })

  return <EditorContent editor={editor} />
}
```

## Editable content inside a node view

Use `NodeViewContent` when the custom node contains editable child content.

### Extension

```tsx
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CalloutNodeView from './CalloutNodeView'

export const CalloutNode = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',

  parseHTML() {
    return [{ tag: 'callout-box' }]
  },

  renderHTML() {
    return ['callout-box', 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView)
  },
})
```

### React component

```tsx
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'

export default function CalloutNodeView() {
  return (
    <NodeViewWrapper className="callout">
      <strong contentEditable={false}>Note</strong>
      <NodeViewContent className="callout-content" />
    </NodeViewWrapper>
  )
}
```

Key rule:

- the node `content` spec must allow the content you want to edit

## Custom HTML rendering without a node view

If the task only needs different markup, extend an existing extension and override `renderHTML`.

```tsx
import Bold from '@tiptap/extension-bold'

export const CustomBold = Bold.extend({
  renderHTML({ HTMLAttributes }) {
    return ['b', HTMLAttributes, 0]
  },
})
```

## Mark view in React

Use a mark view when the behavior belongs to inline formatted text, not a block node.

### Extension

```tsx
import { Mark } from '@tiptap/core'
import { ReactMarkViewRenderer } from '@tiptap/react'
import CommentMarkView from './CommentMarkView'

export const CommentMark = Mark.create({
  name: 'commentMark',

  parseHTML() {
    return [{ tag: 'comment-mark' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['comment-mark', HTMLAttributes, 0]
  },

  addMarkView() {
    return ReactMarkViewRenderer(CommentMarkView)
  },
})
```

### React component

```tsx
import type { ReactMarkViewProps } from '@tiptap/react'

export default function CommentMarkView(props: ReactMarkViewProps) {
  return (
    <span className="comment-mark" data-active={props.selected ? 'true' : 'false'}>
      {props.children}
    </span>
  )
}
```

## Drag handles

If the custom node should be draggable:

- set `draggable: true` on the node
- add `data-drag-handle` to the element that should initiate dragging

```tsx
export const DraggableBlock = Node.create({
  name: 'draggableBlock',
  group: 'block',
  draggable: true,
})
```

```tsx
<NodeViewWrapper className="draggable-block">
  <button type="button" data-drag-handle>
    Drag
  </button>
  <div>Content</div>
</NodeViewWrapper>
```
