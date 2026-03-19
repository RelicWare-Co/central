import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import {
	type Editor,
	EditorContent,
	useEditor,
	useEditorState,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useEffectEvent, useRef } from "react";
import { Button } from "#/components/ui/button";
import { parseRichTextDocument, serializeRichTextValue } from "#/lib/rich-text";
import { cn } from "#/lib/utils";

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
	isCodeBlock: boolean;
	isEmpty: boolean;
	isHeading2: boolean;
	isHeading3: boolean;
	isItalic: boolean;
	isOrderedList: boolean;
	isStrike: boolean;
	isTaskList: boolean;
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
						levels: [2, 3],
					},
				}),
				TaskList,
				TaskItem.configure({
					nested: true,
				}),
			],
			immediatelyRender: false,
			onUpdate: ({ editor: currentEditor }) => {
				emitChange(serializeRichTextValue(currentEditor.getJSON()));
			},
			shouldRerenderOnTransaction: false,
		},
		[],
	);

	const toolbarState = useEditorState({
		editor,
		selector: ({ editor: currentEditor }) => ({
			canRedo: currentEditor
				? currentEditor.can().chain().focus().redo().run()
				: false,
			canUndo: currentEditor
				? currentEditor.can().chain().focus().undo().run()
				: false,
			isBlockquote: currentEditor
				? currentEditor.isActive("blockquote")
				: false,
			isBold: currentEditor ? currentEditor.isActive("bold") : false,
			isBulletList: currentEditor
				? currentEditor.isActive("bulletList")
				: false,
			isCodeBlock: currentEditor ? currentEditor.isActive("codeBlock") : false,
			isEmpty: currentEditor ? currentEditor.isEmpty : true,
			isHeading2: currentEditor
				? currentEditor.isActive("heading", { level: 2 })
				: false,
			isHeading3: currentEditor
				? currentEditor.isActive("heading", { level: 3 })
				: false,
			isItalic: currentEditor ? currentEditor.isActive("italic") : false,
			isOrderedList: currentEditor
				? currentEditor.isActive("orderedList")
				: false,
			isStrike: currentEditor ? currentEditor.isActive("strike") : false,
			isTaskList: currentEditor ? currentEditor.isActive("taskList") : false,
		}),
	}) satisfies ToolbarState | null;

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

	if (!editor || !toolbarState) {
		return <RichTextEditorFallback className={className} />;
	}

	return (
		<div className={cn("central-rich-editor", className)}>
			<RichTextEditorToolbar editor={editor} state={toolbarState} />

			<div
				className={cn(
					"central-rich-editor__body relative px-3 py-3",
					minHeightClassName,
				)}
			>
				{showPlaceholder && toolbarState.isEmpty ? (
					<div className="pointer-events-none absolute inset-x-3 top-3 text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground/70">
						{placeholder}
					</div>
				) : null}
				<EditorContent editor={editor} />
			</div>
		</div>
	);
}

type RichTextEditorToolbarProps = {
	editor: Editor;
	state: ToolbarState;
};

function RichTextEditorToolbar({ editor, state }: RichTextEditorToolbarProps) {
	return (
		<div className="central-rich-editor__toolbar flex flex-wrap gap-2 border-b border-border/70 bg-background/30 px-3 py-2">
			<ToolbarButton
				active={state.isBold}
				label="Bold"
				onClick={() => editor.chain().focus().toggleBold().run()}
			/>
			<ToolbarButton
				active={state.isItalic}
				label="Italic"
				onClick={() => editor.chain().focus().toggleItalic().run()}
			/>
			<ToolbarButton
				active={state.isStrike}
				label="Strike"
				onClick={() => editor.chain().focus().toggleStrike().run()}
			/>
			<ToolbarButton
				active={state.isHeading2}
				label="H2"
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
			/>
			<ToolbarButton
				active={state.isHeading3}
				label="H3"
				onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
			/>
			<ToolbarButton
				active={state.isBulletList}
				label="List"
				onClick={() => editor.chain().focus().toggleBulletList().run()}
			/>
			<ToolbarButton
				active={state.isOrderedList}
				label="1."
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
			/>
			<ToolbarButton
				active={state.isTaskList}
				label="Check"
				onClick={() => editor.chain().focus().toggleTaskList().run()}
			/>
			<ToolbarButton
				active={state.isBlockquote}
				label="Quote"
				onClick={() => editor.chain().focus().toggleBlockquote().run()}
			/>
			<ToolbarButton
				active={state.isCodeBlock}
				label="Code"
				onClick={() => editor.chain().focus().toggleCodeBlock().run()}
			/>
			<div className="ml-auto flex flex-wrap gap-2">
				<ToolbarButton
					disabled={!state.canUndo}
					label="Undo"
					onClick={() => editor.chain().focus().undo().run()}
				/>
				<ToolbarButton
					disabled={!state.canRedo}
					label="Redo"
					onClick={() => editor.chain().focus().redo().run()}
				/>
			</div>
		</div>
	);
}

type ToolbarButtonProps = {
	active?: boolean;
	disabled?: boolean;
	label: string;
	onClick: () => void;
};

function ToolbarButton({
	active = false,
	disabled = false,
	label,
	onClick,
}: ToolbarButtonProps) {
	return (
		<Button
			className="min-w-0"
			disabled={disabled}
			size="xs"
			type="button"
			variant={active ? "secondary" : "ghost"}
			onClick={onClick}
			onMouseDown={(event) => {
				event.preventDefault();
			}}
		>
			{label}
		</Button>
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
