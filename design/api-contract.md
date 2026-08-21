# API Contract

**Base URL:** `/api`
**Content-Type:** `application/json`
**Auth:** `Authorization: Bearer <token>`

---

## Auth

| Method | Endpoint         | Body                    | Auth | Response           |
| ------ | ---------------- | ----------------------- | ---- | ------------------ |
| POST   | `/auth/register` | `{name,email,password}` | —    | `201 {user,token}` |
| POST   | `/auth/login`    | `{email,password}`      | —    | `200 {user,token}` |
| GET    | `/auth/me`       | —                       | ✓    | `200 user`         |
| POST   | `/auth/logout`   | —                       | ✓    | `204`              |

**Errors:** `400`, `401`, `409`

---

## Projects

| Method | Endpoint               | Body/Query             | Auth   |
| ------ | ---------------------- | ---------------------- | ------ |
| POST   | `/projects`            | `{name,description}`   | ✓      |
| GET    | `/projects`            | —                      | ✓      |
| GET    | `/projects/:projectId` | —                      | Member |
| PATCH  | `/projects/:projectId` | `{name?,description?}` | Owner  |
| DELETE | `/projects/:projectId` | —                      | Owner  |

**Responses:** `200`, `201`, `204`
**Errors:** `400`, `403`, `404`

---

## Members & Invitations

| Method | Endpoint                               | Body      | Auth       |
| ------ | -------------------------------------- | --------- | ---------- |
| GET    | `/projects/:projectId/members`         | —         | Member     |
| DELETE | `/projects/:projectId/members/:userId` | —         | Owner/Self |
| POST   | `/projects/:projectId/invitations`     | `{email}` | Owner      |
| GET    | `/projects/:projectId/invitations`     | —         | Owner      |
| POST   | `/invitations/:token/accept`           | —         | ✓          |
| DELETE | `/invitations/:invitationId`           | —         | Owner      |

**Responses:** `200`, `201`, `204`
**Errors:** `400`, `403`, `404`, `409`

---

## Tasks

| Method | Endpoint                     | Body/Query                                            | Auth   |
| ------ | ---------------------------- | ----------------------------------------------------- | ------ |
| POST   | `/projects/:projectId/tasks` | `{title,description,assignee_id,priority,due_date}`   | Member |
| GET    | `/projects/:projectId/tasks` | `status,priority,assignee_id,sort,order,q,page,limit` | Member |
| GET    | `/tasks/:taskId`             | —                                                     | Member |
| PATCH  | `/tasks/:taskId`             | Partial task                                          | Member |
| DELETE | `/tasks/:taskId`             | —                                                     | Member |

**Responses:** `200`, `201`, `204`
**Errors:** `400`, `403`, `404`

---

## Comments

| Method | Endpoint                  | Body     | Auth         |
| ------ | ------------------------- | -------- | ------------ |
| POST   | `/tasks/:taskId/comments` | `{body}` | Member       |
| GET    | `/tasks/:taskId/comments` | —        | Member       |
| PATCH  | `/comments/:commentId`    | `{body}` | Author       |
| DELETE | `/comments/:commentId`    | —        | Author/Owner |

**Responses:** `200`, `201`, `204`
**Errors:** `400`, `403`, `404`

---

## Dashboard

| Method | Endpoint     | Response                              | Auth |
| ------ | ------------ | ------------------------------------- | ---- |
| GET    | `/dashboard` | `{counts_by_status,my_overdue_tasks}` | ✓    |

---

## Tags — Stretch

| Method | Endpoint                     | Body           | Auth   |
| ------ | ---------------------------- | -------------- | ------ |
| POST   | `/projects/:projectId/tags`  | `{name,color}` | Member |
| GET    | `/projects/:projectId/tags`  | —              | Member |
| POST   | `/tasks/:taskId/tags`        | `{tag_id}`     | Member |
| DELETE | `/tasks/:taskId/tags/:tagId` | —              | Member |

---

## Activity Log — Stretch

| Method | Endpoint                  | Auth   |
| ------ | ------------------------- | ------ |
| GET    | `/tasks/:taskId/activity` | Member |

---

## Conversations

| Method | Endpoint                                              | Body/Query                           | Auth        |
| ------ | ----------------------------------------------------- | ------------------------------------ | ----------- |
| POST   | `/conversations`                                      | `{type,project_id?,participant_ids}` | ✓           |
| GET    | `/conversations`                                      | —                                    | ✓           |
| GET    | `/conversations/:conversationId`                      | —                                    | Participant |
| GET    | `/projects/:projectId/conversation`                   | —                                    | Member      |
| PATCH  | `/conversations/:conversationId/participants/:userId` | `{muted}`                            | Self        |
| DELETE | `/conversations/:conversationId/participants/:userId` | —                                    | Self/Owner  |

---

## Messages

| Method | Endpoint                                               | Body/Query     | Auth        |
| ------ | ------------------------------------------------------ | -------------- | ----------- |
| POST   | `/conversations/:conversationId/messages`              | `{body}`       | Participant |
| GET    | `/conversations/:conversationId/messages`              | `before,limit` | Participant |
| PATCH  | `/messages/:messageId`                                 | `{body}`       | Sender      |
| DELETE | `/messages/:messageId`                                 | —              | Sender      |
| POST   | `/messages/:messageId/read`                            | —              | Participant |
| GET    | `/conversations/:conversationId/messages/unread-count` | —              | Participant |

---

## Standard Responses

### Success

```text
200 OK       → GET / PATCH
201 Created  → POST
204 No Content → DELETE / logout
```

### Errors

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

### Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  }
}
```

---

## Authorization

```text
✓       = authenticated user
Member  = project member
Owner   = project owner
Self    = authenticated user owns the resource
Author  = resource author
Sender  = message sender
Participant = conversation participant
```

**Rule:** Authentication → Authorization → Validation → Service → Database.
