// Log activities for tasks automatically
onRecordAfterCreateRequest((e) => {
    const log = new Record($app.dao().findCollectionByNameOrId("activity_logs"));
    log.set("entityType", "task");
    log.set("action", "created");
    log.set("task", e.record.getId());
    if (e.record.get("project")) log.set("project", e.record.get("project"));
    if (e.record.get("assignee")) log.set("targetUser", e.record.get("assignee"));
    log.set("actor", e.httpContext.get("authRecord")?.getId() || null);
    log.set("eventAt", new Date().toISOString());
    $app.dao().saveRecord(log);
}, "tasks");

onRecordAfterUpdateRequest((e) => {
    const oldRecord = e.record.originalCopy();
    let action = "updated";
    
    if (e.record.get("status") !== oldRecord.get("status")) {
        action = e.record.get("status") === "completed" ? "completed" : "status_changed";
        if (e.record.get("status") === "blocked") action = "blocked";
    } else if (e.record.get("assignee") !== oldRecord.get("assignee")) {
        action = "assigned";
    } else if (e.record.get("priority") !== oldRecord.get("priority")) {
        action = "priority_changed";
    }

    const log = new Record($app.dao().findCollectionByNameOrId("activity_logs"));
    log.set("entityType", "task");
    log.set("action", action);
    log.set("task", e.record.getId());
    if (e.record.get("project")) log.set("project", e.record.get("project"));
    if (e.record.get("assignee")) log.set("targetUser", e.record.get("assignee"));
    log.set("actor", e.httpContext.get("authRecord")?.getId() || null);
    log.set("eventAt", new Date().toISOString());
    $app.dao().saveRecord(log);
}, "tasks");

// Log activities for projects automatically
onRecordAfterCreateRequest((e) => {
    const log = new Record($app.dao().findCollectionByNameOrId("activity_logs"));
    log.set("entityType", "project");
    log.set("action", "created");
    log.set("project", e.record.getId());
    if (e.record.get("owner")) log.set("targetUser", e.record.get("owner"));
    log.set("actor", e.httpContext.get("authRecord")?.getId() || null);
    log.set("eventAt", new Date().toISOString());
    $app.dao().saveRecord(log);
}, "projects");

onRecordAfterUpdateRequest((e) => {
    const oldRecord = e.record.originalCopy();
    let action = "updated";
    
    if (e.record.get("status") !== oldRecord.get("status")) {
        action = e.record.get("status") === "completed" ? "completed" : "status_changed";
    }

    const log = new Record($app.dao().findCollectionByNameOrId("activity_logs"));
    log.set("entityType", "project");
    log.set("action", action);
    log.set("project", e.record.getId());
    if (e.record.get("owner")) log.set("targetUser", e.record.get("owner"));
    log.set("actor", e.httpContext.get("authRecord")?.getId() || null);
    log.set("eventAt", new Date().toISOString());
    $app.dao().saveRecord(log);
}, "projects");
