/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const users = app.findCollectionByNameOrId("users")
    const USERS_ID = users.id
    const PROJECTS_ID = "projcts00000001"
    const TASKS_ID = "tasks0000000001"
    const SUBTASKS_ID = "subtasks0000001"

    // -------------------------------------------------------------------------
    // users (auth collection) modifications
    // -------------------------------------------------------------------------
    users.updateRule = "@request.auth.role = 'admin' || (@request.auth.id = id && @request.body.role:changed = false && @request.body.isActive:changed = false)"
    
    // Create new fields using specific Field classes
    users.fields.add(new SelectField({
        name: "role",
        required: true,
        maxSelect: 1,
        values: ["member", "manager", "admin"],
    }))

    users.fields.add(new BoolField({
        name: "isActive",
        required: false,
    }))

    // Add indexes for the new fields
    users.addIndex("idx_users_role", false, "role", "")
    users.addIndex("idx_users_is_active", false, "isActive", "")

    app.save(users)

    // -------------------------------------------------------------------------
    // projects
    // -------------------------------------------------------------------------
    const projects = new Collection({
        id: PROJECTS_ID,
        type: "base",
        name: "projects",
        system: false,

        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != '' && @request.body.owner = @request.auth.id",
        updateRule: "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'manager' || (owner = @request.auth.id && @request.body.owner:changed = false))",
        deleteRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager'",

        fields: [
            {
                id: "prjtitlefld0001",
                name: "name",
                type: "text",
                required: true,
                presentable: true,
                min: 2,
                max: 180,
            },
            {
                id: "prjslugfld00001",
                name: "slug",
                type: "text",
                required: true,
                min: 2,
                max: 180,
            },
            {
                id: "prjdescfld00001",
                name: "description",
                type: "editor",
                required: false,
            },
            {
                id: "prjstatus000001",
                name: "status",
                type: "select",
                required: true,
                maxSelect: 1,
                values: ["active", "paused", "blocked", "completed", "archived"],
            },
            {
                id: "prjownerfld0001",
                name: "owner",
                type: "relation",
                required: false,
                maxSelect: 1,
                collectionId: USERS_ID,
                cascadeDelete: false,
            },
            {
                id: "prjstartfld0001",
                name: "startDate",
                type: "date",
                required: false,
            },
            {
                id: "prjduefld000001",
                name: "dueDate",
                type: "date",
                required: false,
            },
            {
                id: "prjarchfld00001",
                name: "isArchived",
                type: "bool",
                required: false,
            },
        ],

        indexes: [
            "CREATE UNIQUE INDEX idx_projects_slug ON projects (slug)",
            "CREATE INDEX idx_projects_status ON projects (status)",
            "CREATE INDEX idx_projects_owner ON projects (owner)",
            "CREATE INDEX idx_projects_due_date ON projects (dueDate)",
            "CREATE INDEX idx_projects_archived ON projects (isArchived)",
        ],
    })

    app.save(projects)

    // -------------------------------------------------------------------------
    // tasks
    // -------------------------------------------------------------------------
    const tasks = new Collection({
        id: TASKS_ID,
        type: "base",
        name: "tasks",
        system: false,

        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != '' && @request.body.createdBy = @request.auth.id",
        updateRule: "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'manager' || createdBy = @request.auth.id || assignee = @request.auth.id) && @request.body.createdBy:changed = false",
        deleteRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager'",

        fields: [
            {
                id: "tsktitlefld0001",
                name: "title",
                type: "text",
                required: true,
                presentable: true,
                min: 2,
                max: 240,
            },
            {
                id: "tskdescfld00001",
                name: "description",
                type: "editor",
                required: false,
            },
            {
                id: "tskproject000001",
                name: "project",
                type: "relation",
                required: false, // permite inbox sin proyecto
                maxSelect: 1,
                collectionId: PROJECTS_ID,
                cascadeDelete: false,
            },
            {
                id: "tskassignee00001",
                name: "assignee",
                type: "relation",
                required: false,
                maxSelect: 1,
                collectionId: USERS_ID,
                cascadeDelete: false,
            },
            {
                id: "tskcreator000001",
                name: "createdBy",
                type: "relation",
                required: false,
                maxSelect: 1,
                collectionId: USERS_ID,
                cascadeDelete: false,
            },
            {
                id: "tskstatus000001",
                name: "status",
                type: "select",
                required: true,
                maxSelect: 1,
                values: ["pending", "in_progress", "blocked", "completed", "canceled"],
            },
            {
                id: "tskpriori000001",
                name: "priority",
                type: "select",
                required: true,
                maxSelect: 1,
                values: ["low", "medium", "high"],
            },
            {
                id: "tskduedate000001",
                name: "dueDate",
                type: "date",
                required: false,
            },
            {
                id: "tskstartdt000001",
                name: "startDate",
                type: "date",
                required: false,
            },
            {
                id: "tskposfld000001",
                name: "position",
                type: "number",
                required: false,
                min: 0,
                onlyInt: true,
            },
            {
                id: "tskblocked000001",
                name: "blockedReason",
                type: "text",
                required: false,
                max: 500,
            },
            {
                id: "tskarchiv000001",
                name: "isArchived",
                type: "bool",
                required: false,
            },
            {
                id: "tskdoneat0000001",
                name: "completedAt",
                type: "date",
                required: false,
            },
        ],

        indexes: [
            "CREATE INDEX idx_tasks_project ON tasks (project)",
            "CREATE INDEX idx_tasks_assignee ON tasks (assignee)",
            "CREATE INDEX idx_tasks_created_by ON tasks (createdBy)",
            "CREATE INDEX idx_tasks_status ON tasks (status)",
            "CREATE INDEX idx_tasks_priority ON tasks (priority)",
            "CREATE INDEX idx_tasks_due_date ON tasks (dueDate)",
            "CREATE INDEX idx_tasks_position ON tasks (position)",
            "CREATE INDEX idx_tasks_archived ON tasks (isArchived)",
        ],
    })

    app.save(tasks)

    // -------------------------------------------------------------------------
    // subtasks
    // -------------------------------------------------------------------------
    const subtasks = new Collection({
        id: SUBTASKS_ID,
        type: "base",
        name: "subtasks",
        system: false,

        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'manager' || task.createdBy = @request.auth.id || task.assignee = @request.auth.id)",
        deleteRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager'",

        fields: [
            {
                id: "subtaskttl00001",
                name: "title",
                type: "text",
                required: true,
                presentable: true,
                min: 1,
                max: 240,
            },
            {
                id: "subtaskrel00001",
                name: "task",
                type: "relation",
                required: true,
                maxSelect: 1,
                collectionId: TASKS_ID,
                cascadeDelete: true,
            },
            {
                id: "subtaskpos00001",
                name: "position",
                type: "number",
                required: false,
                min: 0,
                onlyInt: true,
            },
            {
                id: "subtaskdone0001",
                name: "isCompleted",
                type: "bool",
                required: false,
            },
            {
                id: "subtaskdoneat01",
                name: "completedAt",
                type: "date",
                required: false,
            },
        ],

        indexes: [
            "CREATE INDEX idx_subtasks_task ON subtasks (task)",
            "CREATE INDEX idx_subtasks_position ON subtasks (position)",
            "CREATE INDEX idx_subtasks_completed ON subtasks (isCompleted)",
        ],
    })

    app.save(subtasks)
}, (app) => {
    // borrar en orden inverso por relaciones
    const collections = ["subtasks", "tasks", "projects"]

    for (const name of collections) {
        try {
            const collection = app.findCollectionByNameOrId(name)
            app.delete(collection)
        } catch (_) {
            // no existe, no hay nada que revertir
        }
    }

    // rollback de modifiaciones a users
    try {
        const users = app.findCollectionByNameOrId("users")
        users.updateRule = "id = @request.auth.id"
        users.fields.removeByName("role")
        users.fields.removeByName("isActive")
        users.removeIndex("idx_users_role")
        users.removeIndex("idx_users_is_active")
        app.save(users)
    } catch (_) {
        // no existe o no se pudo revertir
    }
})