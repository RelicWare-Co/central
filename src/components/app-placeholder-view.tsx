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
		<section className="flex flex-col gap-5">
			<div>
				<p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>
				<h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-foreground">
					{title}
				</h3>
			</div>

			<Empty className="min-h-[240px] border-border/30 bg-card/30">
				<EmptyHeader>
					<EmptyTitle className="text-sm font-medium text-foreground">
						{title}
					</EmptyTitle>
				</EmptyHeader>
			</Empty>
		</section>
	);
}
