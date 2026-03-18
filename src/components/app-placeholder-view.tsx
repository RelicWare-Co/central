import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";

type AppPlaceholderViewProps = {
	description: string;
	eyebrow: string;
	title: string;
};

export function AppPlaceholderView({
	description,
	eyebrow,
	title,
}: AppPlaceholderViewProps) {
	return (
		<Card className="border border-border/70 bg-card/70 ring-0">
			<CardHeader className="border-b border-border/70">
				<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
					{eyebrow}
				</p>
				<CardTitle className="text-xl font-semibold tracking-[-0.04em] text-foreground">
					{title}
				</CardTitle>
				<CardDescription className="max-w-2xl text-sm text-muted-foreground">
					{description}
				</CardDescription>
			</CardHeader>

			<div className="p-4">
				<Empty className="min-h-[280px] rounded-2xl border-border/70 bg-background/60">
					<EmptyHeader>
						<EmptyTitle className="text-sm font-medium text-foreground">
							{title}
						</EmptyTitle>
						<EmptyDescription className="max-w-md text-sm text-muted-foreground">
							{description}
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		</Card>
	);
}
