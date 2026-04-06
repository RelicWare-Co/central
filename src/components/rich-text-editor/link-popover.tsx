import type { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Popover, PopoverContent } from "#/components/ui/popover";

type LinkPopoverProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editor: Editor;
};

export function LinkPopover({ open, onOpenChange, editor }: LinkPopoverProps) {
	const [url, setUrl] = useState("");

	useEffect(() => {
		if (open) {
			const currentLink = editor.getAttributes("link").href;
			setUrl(currentLink || "");
		}
	}, [open, editor]);

	const handleSetLink = () => {
		if (url) {
			editor
				.chain()
				.focus()
				.extendMarkRange("link")
				.setLink({ href: url })
				.run();
		} else {
			editor.chain().focus().unsetLink().run();
		}
		onOpenChange(false);
		setUrl("");
	};

	const handleRemoveLink = () => {
		editor.chain().focus().unsetLink().run();
		onOpenChange(false);
	};

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverContent className="w-80" align="start" side="bottom">
				<div className="grid gap-3">
					<div className="space-y-2">
						<p className="text-sm font-medium">Insertar enlace</p>
						<Input
							placeholder="https://ejemplo.com"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleSetLink();
								}
							}}
							autoFocus
						/>
					</div>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleRemoveLink}
							disabled={!editor.isActive("link")}
						>
							Quitar enlace
						</Button>
						<div className="flex-1" />
						<Button
							type="button"
							size="sm"
							onClick={handleSetLink}
							disabled={!url}
						>
							{editor.isActive("link") ? "Actualizar" : "Insertar"}
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
