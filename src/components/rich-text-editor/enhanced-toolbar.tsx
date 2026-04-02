import type { Editor } from "@tiptap/react";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { cn } from "#/lib/utils";

type SvgIconProps = {
	className?: string;
};

type EnhancedToolbarState = {
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

type EnhancedToolbarProps = {
	editor: Editor;
	state: EnhancedToolbarState;
	onInsertImage: () => void;
	onInsertLink: () => void;
	onInsertTable: () => void;
};

export function EnhancedToolbar({
	editor,
	state,
	onInsertImage,
	onInsertLink,
	onInsertTable,
}: EnhancedToolbarProps) {
	return (
		<div className="central-rich-editor__toolbar flex flex-wrap items-center gap-1 border-b border-border/70 bg-background/30 px-3 py-2">
			<ToolbarGroup>
				<ToolbarButton
					active={state.isBold}
					disabled={!editor.can().chain().focus().toggleBold().run()}
					label="Negrita"
					onClick={() => editor.chain().focus().toggleBold().run()}
				>
					<BoldIcon />
				</ToolbarButton>
				<ToolbarButton
					active={state.isItalic}
					disabled={!editor.can().chain().focus().toggleItalic().run()}
					label="Cursiva"
					onClick={() => editor.chain().focus().toggleItalic().run()}
				>
					<ItalicIcon />
				</ToolbarButton>
				<ToolbarButton
					active={state.isUnderline}
					disabled={!editor.can().chain().focus().toggleUnderline().run()}
					label="Subrayado"
					onClick={() => editor.chain().focus().toggleUnderline().run()}
				>
					<UnderlineIcon />
				</ToolbarButton>
				<ToolbarButton
					active={state.isStrike}
					disabled={!editor.can().chain().focus().toggleStrike().run()}
					label="Tachado"
					onClick={() => editor.chain().focus().toggleStrike().run()}
				>
					<StrikethroughIcon />
				</ToolbarButton>
				<ToolbarButton
					active={state.isHighlight}
					disabled={!editor.can().chain().focus().toggleHighlight().run()}
					label="Resaltado"
					onClick={() => editor.chain().focus().toggleHighlight().run()}
				>
					<HighlightIcon />
				</ToolbarButton>
				<ToolbarButton
					active={state.isCode}
					disabled={!editor.can().chain().focus().toggleCode().run()}
					label="Código inline"
					onClick={() => editor.chain().focus().toggleCode().run()}
				>
					<CodeIcon />
				</ToolbarButton>
			</ToolbarGroup>

			<ToolbarDivider />

			<ToolbarGroup>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<ToolbarButton
							active={state.isH1 || state.isH2 || state.isH3}
							label="Encabezado"
						>
							<HeadingIcon />
						</ToolbarButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem
							onClick={() =>
								editor.chain().focus().toggleHeading({ level: 1 }).run()
							}
							className={cn(state.isH1 && "bg-secondary")}
						>
							<span className="font-semibold">H1</span>
							<span className="text-muted-foreground ml-auto text-xs">
								Título
							</span>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								editor.chain().focus().toggleHeading({ level: 2 }).run()
							}
							className={cn(state.isH2 && "bg-secondary")}
						>
							<span className="font-semibold">H2</span>
							<span className="text-muted-foreground ml-auto text-xs">
								Subtítulo
							</span>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								editor.chain().focus().toggleHeading({ level: 3 }).run()
							}
							className={cn(state.isH3 && "bg-secondary")}
						>
							<span className="font-semibold">H3</span>
							<span className="text-muted-foreground ml-auto text-xs">
								Sección
							</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<ToolbarButton active={state.isBlockquote} label="Cita">
							<QuoteIcon />
						</ToolbarButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem
							onClick={() => editor.chain().focus().toggleBlockquote().run()}
							className={cn(state.isBlockquote && "bg-secondary")}
						>
							<QuoteIcon className="mr-2" />
							Cita
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => editor.chain().focus().toggleCodeBlock().run()}
							className={cn(state.isCodeBlock && "bg-secondary")}
						>
							<CodeIcon className="mr-2" />
							Código
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</ToolbarGroup>

			<ToolbarDivider />

			<ToolbarGroup>
				<ToolbarButton
					active={state.isBulletList}
					disabled={!editor.can().chain().focus().toggleBulletList().run()}
					label="Lista con viñetas"
					onClick={() => editor.chain().focus().toggleBulletList().run()}
				>
					<BulletListIcon />
				</ToolbarButton>
				<ToolbarButton
					active={state.isOrderedList}
					disabled={!editor.can().chain().focus().toggleOrderedList().run()}
					label="Lista numerada"
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
				>
					<OrderedListIcon />
				</ToolbarButton>
				<ToolbarButton
					active={state.isTaskList}
					disabled={!editor.can().chain().focus().toggleTaskList().run()}
					label="Lista de tareas"
					onClick={() => editor.chain().focus().toggleTaskList().run()}
				>
					<TaskListIcon />
				</ToolbarButton>
			</ToolbarGroup>

			<ToolbarDivider />

			<ToolbarGroup>
				<ToolbarButton
					active={state.isLink}
					disabled={
						!editor.can().chain().focus().setLink({ href: "" }).run() &&
						!editor.isActive("link")
					}
					label="Enlace"
					onClick={onInsertLink}
				>
					<LinkIcon />
				</ToolbarButton>
				<ToolbarButton
					active={state.isImage}
					label="Imagen"
					onClick={onInsertImage}
				>
					<ImageIcon />
				</ToolbarButton>
				<ToolbarButton
					active={state.isTable}
					label="Tabla"
					onClick={onInsertTable}
				>
					<TableIcon />
				</ToolbarButton>
			</ToolbarGroup>

			<ToolbarDivider />

			<ToolbarGroup>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<ToolbarButton label="Insertar">
							<PlusIcon />
						</ToolbarButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem
							onClick={() =>
								editor
									.chain()
									.focus()
									.insertContent({ type: "callout", attrs: { type: "info" } })
									.run()
							}
						>
							<CalloutIcon className="mr-2" />
							Nota destacada
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								editor.chain().focus().insertContent({ type: "divider" }).run()
							}
						>
							<DividerIcon className="mr-2" />
							Divididor
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => editor.chain().focus().setHorizontalRule().run()}
						>
							<MinusIcon className="mr-2" />
							Línea horizontal
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<ToolbarButton
							active={state.textAlign !== "left"}
							label="Alineación"
						>
							<AlignLeftIcon />
						</ToolbarButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem
							onClick={() => editor.chain().focus().setTextAlign("left").run()}
							className={cn(state.textAlign === "left" && "bg-secondary")}
						>
							<AlignLeftIcon className="mr-2" />
							Izquierda
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								editor.chain().focus().setTextAlign("center").run()
							}
							className={cn(state.textAlign === "center" && "bg-secondary")}
						>
							<AlignCenterIcon className="mr-2" />
							Centro
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => editor.chain().focus().setTextAlign("right").run()}
							className={cn(state.textAlign === "right" && "bg-secondary")}
						>
							<AlignRightIcon className="mr-2" />
							Derecha
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</ToolbarGroup>

			<div className="ml-auto flex flex-wrap gap-1">
				<ToolbarButton
					disabled={!state.canUndo}
					label="Deshacer"
					onClick={() => editor.chain().focus().undo().run()}
				>
					<UndoIcon />
				</ToolbarButton>
				<ToolbarButton
					disabled={!state.canRedo}
					label="Rehacer"
					onClick={() => editor.chain().focus().redo().run()}
				>
					<RedoIcon />
				</ToolbarButton>
			</div>
		</div>
	);
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
	return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarDivider() {
	return <div className="mx-1 h-5 w-px bg-border" />;
}

type ToolbarButtonProps = {
	active?: boolean;
	children?: React.ReactNode;
	disabled?: boolean;
	label: string;
	onClick?: () => void;
};

function ToolbarButton({
	active = false,
	children,
	disabled = false,
	label,
	onClick,
}: ToolbarButtonProps) {
	return (
		<Button
			className="min-w-0 size-7 p-0"
			disabled={disabled}
			size="icon-xs"
			type="button"
			variant={active ? "secondary" : "ghost"}
			title={label}
			onClick={onClick}
			onMouseDown={(e) => {
				e.preventDefault();
			}}
		>
			{children}
			<span className="sr-only">{label}</span>
		</Button>
	);
}

function BoldIcon() {
	return <strong className="text-xs font-bold">B</strong>;
}

function ItalicIcon() {
	return <em className="text-xs italic not-italic font-serif">I</em>;
}

function UnderlineIcon() {
	return <u className="text-xs font-bold">U</u>;
}

function StrikethroughIcon() {
	return <s className="text-xs">S</s>;
}

function HighlightIcon() {
	return <span className="bg-yellow-200 px-0.5 text-xs">A</span>;
}

function CodeIcon({ className }: SvgIconProps) {
	return (
		<svg
			className={cn("size-3.5", className)}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden="true"
		>
			<polyline points="16 18 22 12 16 6" />
			<polyline points="8 6 2 12 8 18" />
		</svg>
	);
}

function HeadingIcon() {
	return <span className="text-xs font-bold">H</span>;
}

function QuoteIcon({ className }: SvgIconProps) {
	return (
		<svg
			className={cn("size-3.5", className)}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
		</svg>
	);
}

function BulletListIcon() {
	return (
		<svg
			className="size-3.5"
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<circle cx="4" cy="6" r="1.5" />
			<rect x="8" y="5" width="12" height="2" rx="0.5" />
			<circle cx="4" cy="12" r="1.5" />
			<rect x="8" y="11" width="12" height="2" rx="0.5" />
			<circle cx="4" cy="18" r="1.5" />
			<rect x="8" y="17" width="12" height="2" rx="0.5" />
		</svg>
	);
}

function OrderedListIcon() {
	return (
		<svg
			className="size-3.5"
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<text x="2" y="8" fontSize="6" fontWeight="bold">
				1
			</text>
			<rect x="8" y="5" width="12" height="2" rx="0.5" />
			<text x="2" y="14" fontSize="6" fontWeight="bold">
				2
			</text>
			<rect x="8" y="11" width="12" height="2" rx="0.5" />
			<text x="2" y="20" fontSize="6" fontWeight="bold">
				3
			</text>
			<rect x="8" y="17" width="12" height="2" rx="0.5" />
		</svg>
	);
}

function TaskListIcon() {
	return (
		<svg
			className="size-3.5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden="true"
		>
			<rect x="3" y="5" width="4" height="4" rx="0.5" />
			<path d="M5 7l1 1 2-2" />
			<rect x="3" y="11" width="4" height="4" rx="0.5" />
			<rect x="3" y="17" width="4" height="4" rx="0.5" />
			<line x1="11" y1="7" x2="21" y2="7" />
			<line x1="11" y1="13" x2="21" y2="13" />
			<line x1="11" y1="19" x2="21" y2="19" />
		</svg>
	);
}

function LinkIcon() {
	return (
		<svg
			className="size-3.5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden="true"
		>
			<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
			<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
		</svg>
	);
}

function ImageIcon() {
	return (
		<svg
			className="size-3.5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden="true"
		>
			<rect x="3" y="3" width="18" height="18" rx="2" />
			<circle cx="8.5" cy="8.5" r="1.5" />
			<polyline points="21 15 16 10 5 21" />
		</svg>
	);
}

function TableIcon() {
	return (
		<svg
			className="size-3.5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden="true"
		>
			<rect x="3" y="3" width="18" height="18" rx="2" />
			<line x1="3" y1="9" x2="21" y2="9" />
			<line x1="3" y1="15" x2="21" y2="15" />
			<line x1="9" y1="3" x2="9" y2="21" />
			<line x1="15" y1="3" x2="15" y2="21" />
		</svg>
	);
}

function PlusIcon() {
	return (
		<svg
			className="size-3.5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden="true"
		>
			<line x1="12" y1="5" x2="12" y2="19" />
			<line x1="5" y1="12" x2="19" y2="12" />
		</svg>
	);
}

function AlignLeftIcon({ className }: SvgIconProps) {
	return (
		<svg
			className={cn("size-3.5", className)}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<rect x="3" y="4" width="14" height="2" />
			<rect x="3" y="10" width="18" height="2" />
			<rect x="3" y="16" width="14" height="2" />
		</svg>
	);
}

function AlignCenterIcon({ className }: SvgIconProps) {
	return (
		<svg
			className={cn("size-3.5", className)}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<rect x="5" y="4" width="14" height="2" />
			<rect x="3" y="10" width="18" height="2" />
			<rect x="5" y="16" width="14" height="2" />
		</svg>
	);
}

function AlignRightIcon({ className }: SvgIconProps) {
	return (
		<svg
			className={cn("size-3.5", className)}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<rect x="7" y="4" width="14" height="2" />
			<rect x="3" y="10" width="18" height="2" />
			<rect x="7" y="16" width="14" height="2" />
		</svg>
	);
}

function CalloutIcon({ className }: { className?: string }) {
	return (
		<svg
			className={cn("size-3.5", className)}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="10" />
			<line x1="12" y1="16" x2="12" y2="12" />
			<line x1="12" y1="8" x2="12.01" y2="8" />
		</svg>
	);
}

function DividerIcon({ className }: { className?: string }) {
	return (
		<svg
			className={cn("size-3.5", className)}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<circle cx="4" cy="12" r="1.5" />
			<rect x="8" y="11" width="12" height="2" />
			<circle cx="22" cy="12" r="1.5" />
		</svg>
	);
}

function MinusIcon({ className }: { className?: string }) {
	return (
		<svg
			className={cn("size-3.5", className)}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden="true"
		>
			<line x1="5" y1="12" x2="19" y2="12" />
		</svg>
	);
}

function UndoIcon() {
	return (
		<svg
			className="size-3.5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden="true"
		>
			<path d="M3 7v6h6" />
			<path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
		</svg>
	);
}

function RedoIcon() {
	return (
		<svg
			className="size-3.5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden="true"
		>
			<path d="M21 7v6h-6" />
			<path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
		</svg>
	);
}
