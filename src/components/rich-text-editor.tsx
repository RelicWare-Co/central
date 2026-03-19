import { lazy, Suspense } from "react";

const RichTextEditorImpl = lazy(async () => {
	const module = await import("#/components/rich-text-editor-impl");

	return {
		default: module.RichTextEditorImpl,
	};
});

type RichTextEditorProps = {
	className?: string;
	id?: string;
	minHeightClassName?: string;
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
};

export function RichTextEditor(props: RichTextEditorProps) {
	return (
		<Suspense
			fallback={
				<div className="min-h-40 rounded-sm border border-input bg-input/35" />
			}
		>
			<RichTextEditorImpl {...props} />
		</Suspense>
	);
}
