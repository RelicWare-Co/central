import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { parseRichTextDocument, serializeRichTextValue } from "#/lib/rich-text";
import { cn } from "#/lib/utils";
import { EnhancedToolbar } from "./enhanced-toolbar";
import { CalloutExtension, DividerExtension } from "./extensions";
import { ImageDialog } from "./image-dialog";
import { LinkPopover } from "./link-popover";
import { TableDialog } from "./table-dialog";

type RichTextEditorProps = {
	className?: string;
	id?: string;
	minHeightClassName?: string;
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
};

type ToolbarState = {
	canRedo: boolean;
	canUndo: boolean;
	isBlockquote: boolean;
	isBold: boolean;
	isBulletList: boolean;
	isCallout: boolean;
	isCode: boolean;
	isCodeBlock: boolean;
	isDivider: boolean;
	isHighlight: boolean;
	isH1: boolean;
	isH2: boolean;
	isH3: boolean;
	isImage: boolean;
	isItalic: boolean;
	isLink: boolean;
	isOrderedList: boolean;
	isStrike: boolean;
	isSubscript: boolean;
	isSuperscript: boolean;
	isTable: boolean;
	isTaskList: boolean;
	isUnderline: boolean;
	textAlign: string;
};

const DEFAULT_TOOLBAR_STATE: ToolbarState = {
	canRedo: false,
	canUndo: false,
	isBlockquote: false,
	isBold: false,
	isBulletList: false,
	isCallout: false,
	isCode: false,
	isCodeBlock: false,
	isDivider: false,
	isHighlight: false,
	isH1: false,
	isH2: false,
	isH3: false,
	isImage: false,
	isItalic: false,
	isLink: false,
	isOrderedList: false,
	isStrike: false,
	isSubscript: false,
	isSuperscript: false,
	isTable: false,
	isTaskList: false,
	isUnderline: false,
	textAlign: "left",
};

export function RichTextEditorImpl({
	className,
	id,
	minHeightClassName = "min-h-40",
	placeholder,
	value,
	onChange,
}: RichTextEditorProps) {
	const initialContentRef = useRef(parseRichTextDocument(value));
	const normalizedValue = serializeRichTextValue(value);
	const lastSyncedValueRef = useRef(normalizedValue);
	const showPlaceholder = normalizedValue.length === 0;
	const emitChange = useEffectEvent((nextValue: string) => {
		lastSyncedValueRef.current = nextValue;
		onChange(nextValue);
	});

	const [imageDialogOpen, setImageDialogOpen] = useState(false);
	const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
	const [tableDialogOpen, setTableDialogOpen] = useState(false);

	const editor = useEditor(
		{
			content: initialContentRef.current,
			editorProps: {
				attributes: {
					autocapitalize: "sentences",
					autocomplete: "off",
					autocorrect: "on",
					class:
						"central-rich-editor__input text-sm text-foreground outline-none",
					...(id ? { id } : {}),
					spellcheck: "true",
				},
			},
			extensions: [
				StarterKit.configure({
					heading: {
						levels: [1, 2, 3],
					},
					link: false,
					underline: false,
				}),
				TaskList,
				TaskItem.configure({
					nested: true,
				}),
				Underline,
				Highlight,
				Subscript,
				Superscript,
				Link.configure({
					openOnClick: false,
					HTMLAttributes: {
						class:
							"text-primary underline underline-offset-4 hover:text-primary/80",
					},
				}),
				Image.configure({
					HTMLAttributes: {
						class: "rounded-lg max-w-full",
					},
				}),
				TextAlign.configure({
					types: ["heading", "paragraph"],
				}),
				Placeholder.configure({
					placeholder,
				}),
				TableKit,
				CalloutExtension,
				DividerExtension,
			],
			immediatelyRender: false,
			onUpdate: ({ editor: currentEditor }) => {
				emitChange(serializeRichTextValue(currentEditor.getJSON()));
			},
			shouldRerenderOnTransaction: false,
		},
		[],
	);

	const toolbarState =
		useEditorState({
			editor,
			selector: (ctx) => {
				if (!ctx.editor) {
					return DEFAULT_TOOLBAR_STATE;
				}
				return {
					canRedo: ctx.editor.can().chain().focus().redo().run(),
					canUndo: ctx.editor.can().chain().focus().undo().run(),
					isBlockquote: ctx.editor.isActive("blockquote"),
					isBold: ctx.editor.isActive("bold"),
					isBulletList: ctx.editor.isActive("bulletList"),
					isCallout: ctx.editor.isActive("callout"),
					isCode: ctx.editor.isActive("code"),
					isCodeBlock: ctx.editor.isActive("codeBlock"),
					isDivider: ctx.editor.isActive("divider"),
					isHighlight: ctx.editor.isActive("highlight"),
					isH1: ctx.editor.isActive("heading", { level: 1 }),
					isH2: ctx.editor.isActive("heading", { level: 2 }),
					isH3: ctx.editor.isActive("heading", { level: 3 }),
					isImage: ctx.editor.isActive("image"),
					isItalic: ctx.editor.isActive("italic"),
					isLink: ctx.editor.isActive("link"),
					isOrderedList: ctx.editor.isActive("orderedList"),
					isStrike: ctx.editor.isActive("strike"),
					isSubscript: ctx.editor.isActive("subscript"),
					isSuperscript: ctx.editor.isActive("superscript"),
					isTable: ctx.editor.isActive("table"),
					isTaskList: ctx.editor.isActive("taskList"),
					isUnderline: ctx.editor.isActive("underline"),
					textAlign: ctx.editor.isActive({ textAlign: "left" })
						? "left"
						: ctx.editor.isActive({ textAlign: "center" })
							? "center"
							: ctx.editor.isActive({ textAlign: "right" })
								? "right"
								: "left",
				};
			},
		}) ?? DEFAULT_TOOLBAR_STATE;

	useEffect(() => {
		if (!editor) {
			return;
		}

		if (normalizedValue === lastSyncedValueRef.current) {
			return;
		}

		editor.commands.setContent(parseRichTextDocument(value), {
			emitUpdate: false,
		});
		lastSyncedValueRef.current = normalizedValue;
	}, [editor, normalizedValue, value]);

	if (!editor) {
		return <RichTextEditorFallback className={className} />;
	}

	return (
		<div className={cn("central-rich-editor", className)}>
			<EnhancedToolbar
				editor={editor}
				state={toolbarState}
				onInsertImage={() => setImageDialogOpen(true)}
				onInsertLink={() => setLinkPopoverOpen(true)}
				onInsertTable={() => setTableDialogOpen(true)}
			/>

			<div
				className={cn(
					"central-rich-editor__body relative px-3 py-3",
					minHeightClassName,
				)}
			>
				{showPlaceholder && editor?.isEmpty ? (
					<div className="pointer-events-none absolute inset-x-3 top-3 text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground/70">
						{placeholder}
					</div>
				) : null}
				<EditorContent editor={editor} />
			</div>

			<ImageDialog
				open={imageDialogOpen}
				onOpenChange={setImageDialogOpen}
				onInsert={(src, alt) => {
					editor.chain().focus().setImage({ src, alt }).run();
					setImageDialogOpen(false);
				}}
			/>

			<LinkPopover
				open={linkPopoverOpen}
				onOpenChange={setLinkPopoverOpen}
				editor={editor}
			/>

			<TableDialog
				open={tableDialogOpen}
				onOpenChange={setTableDialogOpen}
				onInsert={(rows, cols) => {
					editor
						.chain()
						.focus()
						.insertTable({
							rows,
							cols,
							withHeaderRow: true,
						})
						.run();
					setTableDialogOpen(false);
				}}
			/>
		</div>
	);
}

function RichTextEditorFallback({ className }: { className?: string }) {
	return (
		<div className={cn("central-rich-editor", className)}>
			<div className="central-rich-editor__toolbar flex flex-wrap gap-2 border-b border-border/70 bg-background/30 px-3 py-2">
				<div className="h-6 w-14 rounded-sm bg-muted/70" />
				<div className="h-6 w-14 rounded-sm bg-muted/70" />
				<div className="h-6 w-14 rounded-sm bg-muted/70" />
			</div>
			<div className="min-h-40 px-3 py-3">
				<div className="h-3 w-40 rounded-sm bg-muted/60" />
				<div className="mt-3 h-3 w-full rounded-sm bg-muted/40" />
				<div className="mt-2 h-3 w-4/5 rounded-sm bg-muted/40" />
			</div>
		</div>
	);
}
