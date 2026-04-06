/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const users = app.findCollectionByNameOrId("users")
    const USERS_ID = users.id
    const TASKS_ID = "tasks0000000001"
    const TASK_COMMENTS_ID = "taskcomments00001"

    const taskComments = new Collection({
        id: TASK_COMMENTS_ID,
        type: "base",
        name: "task_comments",
        system: false,

        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != '' && @request.body.author = @request.auth.id",
        updateRule: "@request.auth.id = author && @request.body.author:changed = false",
        deleteRule: "@request.auth.id = author",

        fields: [
            {
                id: "tcommtaskfld001",
                name: "task",
                type: "relation",
                required: true,
                maxSelect: 1,
                collectionId: TASKS_ID,
                cascadeDelete: true,
            },
            {
                id: "tcommauthor001",
                name: "author",
                type: "relation",
                required: false,
                maxSelect: 1,
                collectionId: USERS_ID,
                cascadeDelete: false,
            },
            {
                id: "tcommbodyfld01",
                name: "body",
                type: "text",
                required: true,
                min: 1,
                max: 2000,
            },
            {
                id: "tcommcreated001",
                name: "createdAt",
                type: "date",
                required: true,
            },
            {
                id: "tcommupdated001",
                name: "updatedAt",
                type: "date",
                required: false,
            },
        ],
    })

    app.save(taskComments)

    // Now add the self-referential field after the collection exists
    const savedCollection = app.findCollectionByNameOrId("task_comments")
    savedCollection.fields.add(new RelationField({
        id: "tcommquoted001",
        name: "quotedComment",
        type: "relation",
        required: false,
        maxSelect: 1,
        collectionId: TASK_COMMENTS_ID,
        cascadeDelete: false,
    }))

    app.save(savedCollection)
}, (app) => {
    try {
        const collection = app.findCollectionByNameOrId("task_comments")
        app.delete(collection)
    } catch (_) {
        // no existe, no hay nada que revertir
    }
})
