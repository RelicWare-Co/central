export const queryKeys = {
	activity: {
		list: (scope: ActivityScope) => ["activity", "list", scope] as const,
	},
	projects: {
		detail: (projectId: string) => ["projects", "detail", projectId] as const,
		formOptions: ["projects", "form-options"] as const,
		list: ["projects", "list"] as const,
	},
	tasks: {
		detail: (taskId: string) => ["tasks", "detail", taskId] as const,
		formOptions: ["tasks", "form-options"] as const,
		list: (scope: TaskListScope) => ["tasks", "list", scope] as const,
		subtasks: (taskId: string) => ["tasks", "subtasks", taskId] as const,
	},
} as const;

export type ActivityScope =
	| {
			projectId: string;
			taskId?: never;
	  }
	| {
			projectId?: never;
			taskId: string;
	  }
	| {
			projectId?: never;
			taskId?: never;
	  };

export type TaskListScope =
	| {
			kind: "inbox";
	  }
	| {
			kind: "my-tasks";
			userId: string;
	  }
	| {
			kind: "project";
			projectId: string;
	  }
	| {
			kind: "today";
			userId: string;
			dayKey: string;
	  }
	| {
			kind: "upcoming";
			userId: string;
			dayKey: string;
	  };
