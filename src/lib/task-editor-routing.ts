export type TaskEditorSource = "inbox" | "my-tasks" | "project";
export type TaskEditorPanelState = "open" | "closed";

export type TaskEditorSearch = {
	editor?: TaskEditorPanelState;
	projectId?: string;
	source?: TaskEditorSource;
};

export type TaskEditorNavigation =
	| { to: "/app/inbox" }
	| { to: "/app/my-tasks" }
	| { to: "/app/projects" }
	| { params: { projectId: string }; to: "/app/projects/$projectId" };

export function validateTaskEditorSearch(search: unknown) {
	const values =
		typeof search === "object" && search !== null
			? (search as Record<string, unknown>)
			: {};

	return {
		editor: isTaskEditorPanelState(values.editor) ? values.editor : undefined,
		projectId:
			typeof values.projectId === "string" && values.projectId.length > 0
				? values.projectId
				: undefined,
		source: isTaskEditorSource(values.source) ? values.source : undefined,
	} satisfies TaskEditorSearch;
}

export function getTaskEditorReturnLink(
	search: TaskEditorSearch,
	selectedProjectId?: string | null,
): TaskEditorNavigation {
	if (search.source === "project") {
		if (selectedProjectId) {
			return {
				params: {
					projectId: selectedProjectId,
				},
				to: "/app/projects/$projectId",
			};
		}

		return {
			to: "/app/projects",
		};
	}

	if (search.source === "my-tasks") {
		return {
			to: "/app/my-tasks",
		};
	}

	if (!search.source && selectedProjectId) {
		return {
			params: {
				projectId: selectedProjectId,
			},
			to: "/app/projects/$projectId",
		};
	}

	return {
		to: "/app/inbox",
	};
}

function isTaskEditorSource(value: unknown): value is TaskEditorSource {
	return value === "inbox" || value === "my-tasks" || value === "project";
}

function isTaskEditorPanelState(value: unknown): value is TaskEditorPanelState {
	return value === "open" || value === "closed";
}
