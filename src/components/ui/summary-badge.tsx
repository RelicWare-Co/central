type SummaryBadgeVariant = "default" | "info" | "success" | "warning" | "danger";

type SummaryBadgeProps = {
	label: string;
	value: number;
	variant?: SummaryBadgeVariant;
};

const palette: Record<SummaryBadgeVariant, string> = {
	default: "border-border bg-secondary text-foreground",
	info: "border-[oklch(0.85_0.04_230)] bg-[oklch(0.95_0.025_230)] text-[oklch(0.42_0.10_230)]",
	success:
		"border-[oklch(0.87_0.035_148)] bg-[oklch(0.955_0.02_148)] text-[oklch(0.40_0.10_148)]",
	warning:
		"border-[oklch(0.87_0.05_85)] bg-[oklch(0.955_0.03_85)] text-[oklch(0.45_0.12_80)]",
	danger:
		"border-[oklch(0.87_0.04_15)] bg-[oklch(0.955_0.02_15)] text-[oklch(0.42_0.13_18)]",
};

export function SummaryBadge({
	label,
	value,
	variant = "default",
}: SummaryBadgeProps) {
	return (
		<div
			className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${palette[variant]}`}
		>
			<span className="font-semibold tabular-nums">
				{String(value).padStart(2, "0")}
			</span>
			{label}
		</div>
	);
}
