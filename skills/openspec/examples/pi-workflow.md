# Example: Feature development with OpenSpec in Pi

A real scenario — adding a notification system to an existing project.

## Context

Project: web app on TypeScript + React + Node.js. Need to add event notifications (new messages, status updates).

## Step 1: Exploration

```
/opsx:explore
```

> I want to add notifications. What are the options?

The agent explores the codebase, finds existing patterns (WebSocket connection already exists for chat), suggests options:
1. Extend existing WebSocket
2. Server-Sent Events
3. Polling

We decide to extend WebSocket — it's already there.

## Step 2: Create a change

```
/opsx:propose add-notifications
```

The agent creates a full set of artifacts:

**proposal.md** — Why:
- Users don't see new events without refreshing the page
- Scope: real-time notifications via WebSocket, UI component, persistence
- Out of scope: email/push notifications (separate change)

**specs/notifications/spec.md** — What:
```markdown
## ADDED Requirements

### Requirement: Real-time Notifications
The system SHALL deliver notifications to connected users in real-time.

#### Scenario: New message notification
- GIVEN a user is connected via WebSocket
- WHEN another user sends them a message
- THEN a notification appears within 2 seconds

#### Scenario: Notification persistence
- GIVEN a user was offline
- WHEN the user reconnects
- THEN unread notifications are loaded from the database
```

**design.md** — How:
- Extend the WebSocket handler with a new event type
- New `notifications` table in PostgreSQL
- React NotificationBell component in Header

**tasks.md** — Steps:
```markdown
## 1. Backend
- [ ] 1.1 Create migration for notifications table
- [ ] 1.2 Add notification event type to WebSocket handler
- [ ] 1.3 API endpoint GET /notifications

## 2. Frontend
- [ ] 2.1 NotificationBell component
- [ ] 2.2 Subscribe to WebSocket events
- [ ] 2.3 Notification dropdown with history
```

## Step 3: Adjust artifacts

Read proposal and design. Notice we didn't account for notification rate limiting. Edit design.md, add a task to tasks.md.

Artifacts are living documents — they can be changed at any time.

## Step 4: Implement

```
/opsx:apply
```

The agent walks through tasks.md:
- Creates the migration
- Extends the WebSocket handler
- Creates React components
- Marks tasks `[x]`

If a problem is discovered during implementation — update design.md and continue.

## Step 5: Verify

```bash
openspec status --change add-notifications
```

```
Change: add-notifications
Progress: 4/4 artifacts complete
Tasks: 6/6 complete
```

## Step 6: Archive

```
/opsx:archive
```

- Delta specs are merged into `openspec/specs/notifications/spec.md`
- Directory moves to archive
- Specifications are updated

## Result

After archiving:

```
openspec/specs/notifications/spec.md    # New spec — source of truth
openspec/changes/archive/2026-02-27-add-notifications/
                                         # Full history: proposal, design, tasks
```

The next change (e.g. email notifications) can reference the existing `notifications/spec.md` spec and extend it via a delta.
