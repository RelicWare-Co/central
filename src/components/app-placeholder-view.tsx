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
				<p className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
					{eyebrow}
				</p>
				<h3 className="mt-1.5 font-serif text-xl font-normal tracking-[-0.02em] text-foreground">
					{title}
				</h3>
			</div>

			<Empty className="min-h-[240px]">
				<EmptyHeader>
					<EmptyTitle className="text-sm font-medium text-foreground">
						{title}
					</EmptyTitle>
				</EmptyHeader>
			</Empty>
		</section>
	);
}
