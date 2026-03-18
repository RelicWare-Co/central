import { Empty, EmptyHeader, EmptyTitle } from "#/components/ui/empty";

type AppPlaceholderViewProps = {
	eyebrow: string;
	title: string;
};

export function AppPlaceholderView({
	eyebrow,
	title,
}: AppPlaceholderViewProps) {
	return (
		<section className="flex flex-col gap-4">
			<div>
				<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
					{eyebrow}
				</p>
				<h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground">
					{title}
				</h3>
			</div>

			<Empty className="min-h-[280px] border-border/70 bg-background/35">
				<EmptyHeader>
					<EmptyTitle className="text-sm font-medium text-foreground">
						{title}
					</EmptyTitle>
				</EmptyHeader>
			</Empty>
		</section>
	);
}
