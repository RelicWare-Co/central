import { createFileRoute } from "@tanstack/react-router";
import { AppPlaceholderView } from "#/components/app-placeholder-view";

export const Route = createFileRoute("/app/upcoming")({
	component: UpcomingRoute,
});

function UpcomingRoute() {
	return (
		<AppPlaceholderView
			eyebrow="Upcoming"
			title="Forward visibility without PM overhead"
		/>
	);
}
