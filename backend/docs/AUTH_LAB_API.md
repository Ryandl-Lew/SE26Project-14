# Authentication and Laboratory API Contract

This document defines the implemented contract for username/email login, account registration, system-admin laboratory creation and reviewed laboratory membership.

## Domain rules

- Account status and laboratory membership status are independent. A user with no laboratory, or with a pending application, still has an `ACTIVE` account and may log in.
- System roles and laboratory roles are independent. `SystemRole.ADMIN` controls platform administration, while `LaboratoryRole` is scoped to one laboratory.
- Only a system `ADMIN` creates a laboratory or transfers its leader. The designated leader is an active `LAB_ADMIN` member.
- Usernames and emails are unique ignoring case. Generated normalized columns enforce `trim + lowercase` uniqueness. Usernames must not contain `@`.
- Project access remains controlled by `project_members`. Laboratory membership does not automatically grant access to every laboratory project.
- A project may be personal (`laboratoryId=null`) or belong to one laboratory.
- Invite codes are random high-entropy values. The database stores only a SHA-256 hash and a short display hint. The plaintext code is returned only once when created.
- Creating an application consumes one invite use. The invite row must be locked or atomically updated in the same transaction so concurrent requests cannot exceed `maxUses`. Rejection or cancellation does not restore that use.
- At most one `PENDING` application may exist for the same user and laboratory. Terminal applications remain as history and the user may apply again.
- An invite always creates a normal `MEMBER` application. Higher laboratory roles are granted later by a `LAB_ADMIN`, never by registration or application input.
- Registration with an invalid, expired, revoked or exhausted invite fails as one transaction; the account is not created.
- Approving an application and creating or reactivating its membership occur in one transaction.

## Enumerations

| Type | Values |
| --- | --- |
| `SystemRole` | `USER`, `ADMIN` |
| `LaboratoryStatus` | `ACTIVE`, `ARCHIVED` |
| `LaboratoryRole` | `LAB_ADMIN`, `MENTOR`, `REVIEWER`, `MEMBER` |
| `LaboratoryMemberStatus` | `ACTIVE`, `LEFT`, `REMOVED` |
| `LaboratoryInviteStatus` | `ACTIVE`, `REVOKED` |
| `JoinApplicationOrigin` | `REGISTRATION`, `LATER_JOIN` |
| `JoinApplicationStatus` | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| `JoinReviewDecision` | `APPROVE`, `REJECT` |

Invite expiry is determined from `expiresAt`; it is not persisted as a third invite status.

## Authentication interfaces

### `POST /api/v1/auth/register`

Public. Creates an active account and optionally creates a pending laboratory application in the same transaction.

`RegisterRequest`:

| Field | Type | Required | Rule |
| --- | --- | :---: | --- |
| `username` | string | yes | 3-64 characters; no `@`; unique ignoring case |
| `email` | string | yes | valid email; max 255; unique ignoring case |
| `password` | string | yes | 8-72 characters; never logged or returned |
| `name` | string | yes | 1-100 characters |
| `avatarText` | string | no | max 8 characters; otherwise derived from name |
| `labInviteCode` | string | no | blank is treated as absent |
| `joinMessage` | string | no | max 500; allowed only with an invite code |

`RegisterResponse`:

| Field | Type | Description |
| --- | --- | --- |
| `user` | `UserResponse` | Newly created account |
| `joinApplication` | `RegistrationJoinApplicationResponse` or null | Pending application created from the invite |

Returns `201`. Registration does not issue a JWT in the first implementation; the user signs in through the normal login endpoint.

### `POST /api/v1/auth/login`

Existing endpoint with an updated request field.

`LoginRequest` contains `identifier` and `password`. `identifier` accepts either a username or email. Invalid account, disabled account and wrong password all return the same `AUTH_INVALID_CREDENTIALS` response.

### `GET /api/v1/auth/me`

Keeps returning the base `UserResponse`. Laboratory context is queried separately so the auth module does not own laboratory DTOs.

## Laboratory interfaces

### `POST /api/v1/laboratories`

Allowed only for a system `ADMIN`. Creates a laboratory and assigns its leader. The designated leader becomes an active `LAB_ADMIN` in the same transaction; the system administrator does not automatically become a laboratory member.

`CreateLaboratoryRequest` fields:

| Field | Type | Required | Rule |
| --- | --- | :---: | --- |
| `name` | string | yes | Non-blank; max 200 |
| `description` | string | yes | Non-blank; max 5000 |
| `leaderIdentifier` | string | yes | Username or email of an active user |

Response: `LaboratoryResponse`. Returns `201`.

### `GET /api/v1/laboratories/{laboratoryId}`

Returns laboratory details to an active member or a system `ADMIN`.

### `GET /api/v1/laboratories/mine`

Returns the current user's active laboratory memberships. Application history is queried through `/api/v1/laboratory-join-applications/mine`.

### `PATCH /api/v1/laboratories/{laboratoryId}/leader`

Allowed only for a system `ADMIN`. Requires `leaderIdentifier` and the current laboratory `version`.

The new leader is created or reactivated as `LAB_ADMIN`. When the leader changes, the previous leader remains active and becomes `MENTOR`. Returns the updated `LaboratoryResponse`.

## Invite interfaces

### `POST /api/v1/laboratories/{laboratoryId}/invites`

Allowed for active `LAB_ADMIN` members.

`CreateLaboratoryInviteRequest` fields:

| Field | Type | Required | Rule |
| --- | --- | :---: | --- |
| `expiresAt` | ISO 8601 instant | no | Must be in the future |
| `maxUses` | integer | no | Positive; null means no count limit |

The response contains invite metadata and plaintext `inviteCode`. No later endpoint returns the plaintext code. Returns `201`.

### `GET /api/v1/laboratories/{laboratoryId}/invites`

Allowed for `LAB_ADMIN`, `MENTOR` and `REVIEWER`. Returns paginated invite metadata without the plaintext code.

### `POST /api/v1/laboratories/{laboratoryId}/invites/{inviteId}/revoke`

Allowed for active `LAB_ADMIN` members. Changes an active invite to `REVOKED`. Returns `204`.

## Join application interfaces

### `POST /api/v1/laboratory-join-applications`

Authenticated endpoint for a user who registered without a laboratory and later receives an invite.

`CreateLaboratoryJoinApplicationRequest` fields: `inviteCode`, optional `message`. The server derives the laboratory from the invite and fixes the requested membership role to `MEMBER`. Returns `LaboratoryJoinApplicationResponse` with status `PENDING` and HTTP `201`.

### `GET /api/v1/laboratory-join-applications/mine`

Returns the current user's application history, ordered newest first.

### `POST /api/v1/laboratory-join-applications/{applicationId}/cancel`

Allows the applicant to cancel a `PENDING` application. Returns `204`.

### `GET /api/v1/laboratories/{laboratoryId}/join-applications`

Allowed for active `LAB_ADMIN`, `MENTOR` and `REVIEWER` members. Supports `status`, `page` and `size` query parameters and returns `PageResponse<LaboratoryJoinApplicationResponse>`.

### `POST /api/v1/laboratories/{laboratoryId}/join-applications/{applicationId}/review`

Allowed for active `LAB_ADMIN`, `MENTOR` and `REVIEWER` members.

`ReviewLaboratoryJoinApplicationRequest` fields:

| Field | Type | Required | Rule |
| --- | --- | :---: | --- |
| `decision` | enum | yes | `APPROVE` or `REJECT` |
| `reason` | string | conditional | Required for rejection; max 1000 |
| `version` | integer | yes | Current application version for optimistic locking |

Approval creates or reactivates one `laboratory_members` row and changes the application to `APPROVED`. Rejection changes it to `REJECTED`. Returns the updated application.

## Member interfaces

### `GET /api/v1/laboratories/{laboratoryId}/members`

Returns paginated laboratory members. Active laboratory members may view the list.

### `PATCH /api/v1/laboratories/{laboratoryId}/members/{userId}`

Allowed for active `LAB_ADMIN` members. The request contains the complete target state: `role`, `memberStatus` and the current `version`. The service prevents removal or demotion of the leader and prevents leaving the laboratory without an active `LAB_ADMIN`.

### `DELETE /api/v1/laboratories/{laboratoryId}/members/{userId}`

Allowed for active `LAB_ADMIN` members. This operation marks the membership `REMOVED` instead of deleting it and returns `204`. The current leader cannot be removed until a system administrator transfers leadership.

## Shared response DTOs

`LaboratoryResponse`: `id`, `code`, `name`, `description`, `status`, `leader`, `createdBy`, `createdAt`, `updatedAt`, `version`.

`LaboratorySummaryResponse`: `id`, `code`, `name`, `status`.

`LaboratoryMemberResponse`: `id`, `laboratory`, `user`, `role`, `memberStatus`, `joinedAt`, `version`.

`RegistrationJoinApplicationResponse`: `id`, `laboratory`, `status`, `createdAt`, `version`.

`LaboratoryJoinApplicationResponse`: `id`, `laboratory`, `applicant`, `origin`, `requestMessage`, `status`, `reviewer`, `reviewedAt`, `reviewReason`, `createdAt`, `version`.

## Laboratory and authentication error codes

| Code | HTTP | Meaning |
| --- | ---: | --- |
| `AUTH_USERNAME_EXISTS` | 409 | Username already registered |
| `AUTH_EMAIL_EXISTS` | 409 | Email already registered |
| `LABORATORY_NOT_FOUND` | 404 | Laboratory not visible or does not exist |
| `LABORATORY_ACCESS_DENIED` | 403 | Laboratory role does not allow the operation |
| `LAB_INVITE_INVALID` | 400 | Invite cannot be parsed or found |
| `LAB_INVITE_UNAVAILABLE` | 409 | Invite is revoked, expired or exhausted |
| `LAB_ALREADY_MEMBER` | 409 | User already has an active membership |
| `LAB_APPLICATION_ALREADY_PENDING` | 409 | User already has a pending application |
| `LAB_APPLICATION_NOT_PENDING` | 409 | Application cannot be reviewed or cancelled in its current state |
| `LAB_MEMBER_NOT_FOUND` | 404 | Laboratory member does not exist |
| `LAB_FINAL_ADMIN_REQUIRED` | 409 | Operation would leave the laboratory without an active administrator |
| `LAB_VERSION_CONFLICT` | 409 | Submitted laboratory-domain version is stale |

## Module ownership

- P1 owns registration, username/email login and the transaction boundary that optionally creates the registration-time join application.
- P2 owns the `laboratory` module: laboratories, invites, applications, members and laboratory permission checks.
- P1 calls a public P2 application service when registration contains an invite; it must not access laboratory repositories directly.
