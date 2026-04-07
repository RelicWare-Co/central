/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // -------------------------------------------------------------------------
    // projects - restrict member access
    // -------------------------------------------------------------------------
    // Admins and managers can see all projects
    // Members can only see projects where they are the owner
    // Note: If project membership is needed in the future, a "members" relation field 
    // should be added to projects collection
    const projects = app.findCollectionByNameOrId("projects")
    
    projects.listRule = `@request.auth.role = 'admin' || @request.auth.role = 'manager' || owner = @request.auth.id`
    projects.viewRule = `@request.auth.role = 'admin' || @request.auth.role = 'manager' || owner = @request.auth.id`
    
    app.save(projects)

    // -------------------------------------------------------------------------
    // tasks - restrict member access
    // -------------------------------------------------------------------------
    // Admins and managers can see all tasks
    // Members can only see tasks assigned to them
    const tasks = app.findCollectionByNameOrId("tasks")
    
    tasks.listRule = `@request.auth.role = 'admin' || @request.auth.role = 'manager' || assignee = @request.auth.id`
    tasks.viewRule = `@request.auth.role = 'admin' || @request.auth.role = 'manager' || assignee = @request.auth.id`
    
    app.save(tasks)

    // -------------------------------------------------------------------------
    // subtasks - restrict member access based on parent task
    // -------------------------------------------------------------------------
    // Admins and managers can see all subtasks
    // Members can only see subtasks of tasks assigned to them
    const subtasks = app.findCollectionByNameOrId("subtasks")
    
    subtasks.listRule = `@request.auth.role = 'admin' || @request.auth.role = 'manager' || task.assignee = @request.auth.id`
    subtasks.viewRule = `@request.auth.role = 'admin' || @request.auth.role = 'manager' || task.assignee = @request.auth.id`
    
    app.save(subtasks)
}, (app) => {
    // Rollback - restore original rules
    const projects = app.findCollectionByNameOrId("projects")
    projects.listRule = "@request.auth.id != ''"
    projects.viewRule = "@request.auth.id != ''"
    app.save(projects)

    const tasks = app.findCollectionByNameOrId("tasks")
    tasks.listRule = "@request.auth.id != ''"
    tasks.viewRule = "@request.auth.id != ''"
    app.save(tasks)

    const subtasks = app.findCollectionByNameOrId("subtasks")
    subtasks.listRule = "@request.auth.id != ''"
    subtasks.viewRule = "@request.auth.id != ''"
    app.save(subtasks)
})
