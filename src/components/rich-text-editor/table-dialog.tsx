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
import { Label } from "#/components/ui/label";

type TableDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onInsert: (rows: number, cols: number) => void;
};

export function TableDialog({
	open,
	onOpenChange,
	onInsert,
}: TableDialogProps) {
	const [rows, setRows] = useState(3);
	const [cols, setCols] = useState(3);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onInsert(rows, cols);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Insertar tabla</DialogTitle>
					<DialogDescription>
						Selecciona el número de filas y columnas para la tabla.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label htmlFor="table-rows">Filas</Label>
								<input
									type="number"
									id="table-rows"
									min={1}
									max={10}
									value={rows}
									onChange={(e) =>
										setRows(
											Math.min(
												10,
												Math.max(1, parseInt(e.target.value, 10) || 1),
											),
										)
									}
									className="h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="table-cols">Columnas</Label>
								<input
									type="number"
									id="table-cols"
									min={1}
									max={10}
									value={cols}
									onChange={(e) =>
										setCols(
											Math.min(
												10,
												Math.max(1, parseInt(e.target.value, 10) || 1),
											),
										)
									}
									className="h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
								/>
							</div>
						</div>
						<div className="flex flex-wrap gap-1" aria-hidden="true">
							{Array.from({ length: rows * cols }).map((_, i) => (
								<div
									key={String(i)}
									className="size-6 rounded-sm border border-border bg-muted/50"
								/>
							))}
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancelar
						</Button>
						<Button type="submit">Insertar tabla</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
