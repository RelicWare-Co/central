/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // 1. users: fix visibility so users can see each other to assign tasks
    const users = app.findCollectionByNameOrId("users")
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    app.save(users)

    // 2. tasks: allow any authenticated user to collaborate (update tasks), but protect createdBy
    const tasks = app.findCollectionByNameOrId("tasks")
    tasks.updateRule = "@request.auth.id != '' && @request.body.createdBy:changed = false"
    app.save(tasks)

    // 3. subtasks: allow any authenticated user to check off subtasks
    const subtasks = app.findCollectionByNameOrId("subtasks")
    subtasks.updateRule = "@request.auth.id != ''"
    app.save(subtasks)

    // 4. projects: 
    // - Allow admins/managers to create projects for others or without owner
    // - Allow any authenticated user to edit projects they own or unassigned ones
    const projects = app.findCollectionByNameOrId("projects")
    projects.createRule = "@request.auth.id != '' && (@request.body.owner = '' || @request.body.owner = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'manager')"
    projects.updateRule = "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'manager' || owner = @request.auth.id || owner = '')"
    app.save(projects)

}, (app) => {
    // Revert users
    const users = app.findCollectionByNameOrId("users")
    users.listRule = "id = @request.auth.id"
    users.viewRule = "id = @request.auth.id"
    app.save(users)

    // Revert tasks
    const tasks = app.findCollectionByNameOrId("tasks")
    tasks.updateRule = "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'manager' || createdBy = @request.auth.id || assignee = @request.auth.id) && @request.body.createdBy:changed = false"
    app.save(tasks)

    // Revert subtasks
    const subtasks = app.findCollectionByNameOrId("subtasks")
    subtasks.updateRule = "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'manager' || task.createdBy = @request.auth.id || task.assignee = @request.auth.id)"
    app.save(subtasks)

    // Revert projects
    const projects = app.findCollectionByNameOrId("projects")
    projects.createRule = "@request.auth.id != '' && @request.body.owner = @request.auth.id"
    projects.updateRule = "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'manager' || (owner = @request.auth.id && @request.body.owner:changed = false))"
    app.save(projects)
})
