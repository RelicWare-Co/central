/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const users = app.findCollectionByNameOrId("users")
    
    // Allow public registration - users can create their own accounts
    // The role field will be set to 'member' by default and cannot be changed during registration
    users.createRule = "@request.auth.id = '' && @request.body.role = 'member' && @request.body.isActive = true"
    
    app.save(users)
}, (app) => {
    // Rollback - remove createRule (back to admin-only creation)
    const users = app.findCollectionByNameOrId("users")
    users.createRule = null
    app.save(users)
})
