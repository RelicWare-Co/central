import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";

type ImageDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onInsert: (src: string, alt: string) => void;
};

export function ImageDialog({
	open,
	onOpenChange,
	onInsert,
}: ImageDialogProps) {
	const [src, setSrc] = useState("");
	const [alt, setAlt] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (src) {
			onInsert(src, alt);
			setSrc("");
			setAlt("");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Insertar imagen</DialogTitle>
					<DialogDescription>
						Agrega una imagen usando una URL o sube un archivo.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="image-src">URL de la imagen</Label>
							<Input
								id="image-src"
								placeholder="https://ejemplo.com/imagen.jpg"
								value={src}
								onChange={(e) => setSrc(e.target.value)}
								autoFocus
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="image-alt">Texto alternativo</Label>
							<Input
								id="image-alt"
								placeholder="Descripción de la imagen"
								value={alt}
								onChange={(e) => setAlt(e.target.value)}
							/>
						</div>
						{src && (
							<div className="mt-2">
								<p className="text-xs text-muted-foreground mb-2">
									Vista previa:
								</p>
								<div className="max-h-40 overflow-auto rounded border bg-muted/30 p-2">
									<img
										src={src}
										alt={alt || "Vista previa"}
										className="max-w-full"
										onError={(e) => {
											(e.target as HTMLImageElement).style.display = "none";
										}}
									/>
								</div>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancelar
						</Button>
						<Button type="button" onClick={handleSubmit} disabled={!src}>
							Insertar
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
