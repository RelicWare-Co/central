/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const taskComments = app.findCollectionByNameOrId("task_comments");
		taskComments.listRule =
			"@request.auth.role = 'admin' || @request.auth.role = 'manager' || author = @request.auth.id || task.assignee = @request.auth.id";
		taskComments.viewRule =
			"@request.auth.role = 'admin' || @request.auth.role = 'manager' || author = @request.auth.id || task.assignee = @request.auth.id";
		taskComments.createRule =
			"@request.auth.id != '' && @request.body.author = @request.auth.id";
		taskComments.updateRule =
			"@request.auth.id = author && @request.body.author:changed = false";
		taskComments.deleteRule = "@request.auth.id = author";
		app.save(taskComments);

		const activityLogs = app.findCollectionByNameOrId("activity_logs");
		activityLogs.listRule =
			"@request.auth.role = 'admin' || @request.auth.role = 'manager' || task.assignee = @request.auth.id || project.owner = @request.auth.id";
		activityLogs.viewRule =
			"@request.auth.role = 'admin' || @request.auth.role = 'manager' || task.assignee = @request.auth.id || project.owner = @request.auth.id";
		activityLogs.createRule =
			"@request.auth.id != '' && @request.body.actor = @request.auth.id";
		activityLogs.updateRule = "@request.auth.role = 'admin'";
		activityLogs.deleteRule = "@request.auth.role = 'admin'";
		app.save(activityLogs);
	},
	(app) => {
		const taskComments = app.findCollectionByNameOrId("task_comments");
		taskComments.listRule = "@request.auth.id != ''";
		taskComments.viewRule = "@request.auth.id != ''";
		app.save(taskComments);

		const activityLogs = app.findCollectionByNameOrId("activity_logs");
		activityLogs.listRule = "@request.auth.id != ''";
		activityLogs.viewRule = "@request.auth.id != ''";
		app.save(activityLogs);
	},
);
