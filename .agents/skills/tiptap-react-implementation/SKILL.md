---
name: tiptap-react-implementation
description: Portable guide for implementing Tiptap in React. Use this when setting up, extending, debugging, or optimizing a Tiptap editor in React, including SSR, menus, persistence, common extensions, and custom React node views.
---

# Tiptap React Implementation

This skill is intentionally self-contained. Prefer the code and patterns in these reference files before searching external docs or source code.

## Workflow

1. Classify the task:
   - basic editor setup
   - SSR or hydration issue
   - toolbar, bubble menu, or floating menu
   - persistence or HTML rendering
   - common extension such as image, mention, table, placeholder, link, or text align
   - custom node, mark, node view, or mark view
2. Read [references/fundamentals.md](references/fundamentals.md) first.
3. Then read only the extra file that matches the work:
   - [references/example-map.md](references/example-map.md) for task routing and validation rules
   - [references/feature-recipes.md](references/feature-recipes.md) for ready-to-adapt React examples
   - [references/custom-extensions.md](references/custom-extensions.md) for custom nodes, marks, and React-rendered content inside the editor
4. Copy the smallest working pattern and adapt it to the host app instead of inventing the integration from scratch.
5. Only check official docs or source if the skill does not cover the feature or if exact option names are unclear.

## Coverage

| Area | Where to read | Includes |
| --- | --- | --- |
| Setup and SSR | `references/fundamentals.md` | basic editor, minimal schema, SSR, composable API, persistence, performance |
| Common features | `references/feature-recipes.md` | toolbars, menus, links, images, mentions, tables, checklists, text align |
| Task routing | `references/example-map.md` | decision rules, validation rules, collaboration notes, static renderer |
| Custom editor primitives | `references/custom-extensions.md` | custom nodes, mark views, editable node views, drag handles |

## Implementation Checklist

- [ ] Choose `StarterKit` or a minimal schema on purpose.
- [ ] Put the editor in its own React component.
- [ ] If the app uses SSR, set `immediatelyRender: false`.
- [ ] Use `useEditorState` or `useTiptapState` for reactive menu state.
- [ ] Decide whether the UI needs a fixed toolbar, bubble menu, floating menu, or a mix.
- [ ] Store JSON unless there is a strong reason to persist HTML.
- [ ] Add only the extensions the product really needs.
- [ ] Use custom node views only for real interactive document widgets.

## Non-negotiables

- Keep every `@tiptap/*` package on the same version.
- For SSR, set `immediatelyRender: false`.
- Isolate the editor in its own React component.
- In React, use `useEditorState` or `useTiptapState` for reactive toolbar state. Do not rely on plain `editor.isActive()` inside render without a subscription.
- Prefer JSON over HTML for persistence unless the project explicitly needs HTML.
- Prefer `StarterKit` for normal editors. Use `Document` + `Paragraph` + `Text` only when you intentionally want a minimal schema.
- Do not add React node views just for styling. Use extension configuration and CSS first.
