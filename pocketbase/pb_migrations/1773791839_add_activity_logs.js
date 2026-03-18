/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const users = app.findCollectionByNameOrId("users")
    const USERS_ID = users.id
    const PROJECTS_ID = "projcts00000001"
    const TASKS_ID = "tasks0000000001"
    const ACTIVITY_LOGS_ID = "actlogs00000001"

    const activityLogs = new Collection({
        id: ACTIVITY_LOGS_ID,
        type: "base",
        name: "activity_logs",
        system: false,

        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != '' && @request.body.actor = @request.auth.id",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",

        fields: [
            {
                id: "alogtypefld0001",
                name: "entityType",
                type: "select",
                required: true,
                maxSelect: 1,
                values: ["project", "task", "subtask"],
            },
            {
                id: "alogaction00001",
                name: "action",
                type: "select",
                required: true,
                maxSelect: 1,
                values: [
                    "created",
                    "updated",
                    "status_changed",
                    "assigned",
                    "priority_changed",
                    "due_date_changed",
                    "blocked",
                    "unblocked",
                    "completed",
                    "archived",
                    "restored",
                    "deleted",
                ],
            },
            {
                id: "alogproject0001",
                name: "project",
                type: "relation",
                required: false,
                maxSelect: 1,
                collectionId: PROJECTS_ID,
                cascadeDelete: true,
            },
            {
                id: "alogtaskfld00001",
                name: "task",
                type: "relation",
                required: false,
                maxSelect: 1,
                collectionId: TASKS_ID,
                cascadeDelete: true,
            },
            {
                id: "alogactorfld001",
                name: "actor",
                type: "relation",
                required: false,
                maxSelect: 1,
                collectionId: USERS_ID,
                cascadeDelete: false,
            },
            {
                id: "alogtargetusr001",
                name: "targetUser",
                type: "relation",
                required: false,
                maxSelect: 1,
                collectionId: USERS_ID,
                cascadeDelete: false,
            },
            {
                id: "alogmessage0001",
                name: "message",
                type: "text",
                required: false,
                max: 500,
            },
            {
                id: "alogmetajson001",
                name: "metadata",
                type: "json",
                required: false,
            },
            {
                id: "alogeventat0001",
                name: "eventAt",
                type: "date",
                required: true,
            },
        ],

        indexes: [
            "CREATE INDEX idx_activity_logs_entity_type ON activity_logs (entityType)",
            "CREATE INDEX idx_activity_logs_action ON activity_logs (action)",
            "CREATE INDEX idx_activity_logs_project ON activity_logs (project)",
            "CREATE INDEX idx_activity_logs_task ON activity_logs (task)",
            "CREATE INDEX idx_activity_logs_actor ON activity_logs (actor)",
            "CREATE INDEX idx_activity_logs_target_user ON activity_logs (targetUser)",
            "CREATE INDEX idx_activity_logs_event_at ON activity_logs (eventAt)"
        ],
    })

    app.save(activityLogs)
}, (app) => {
    try {
        const collection = app.findCollectionByNameOrId("activity_logs")
        app.delete(collection)
    } catch (_) {
        // no existe, no hay nada que revertir
    }
})