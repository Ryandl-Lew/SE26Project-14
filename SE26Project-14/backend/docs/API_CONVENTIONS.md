# API Conventions

## Paths and authentication

- All business endpoints use the `/api/v1` prefix.
- Public endpoints are limited to login, registration, health checks and OpenAPI resources.
- Protected endpoints require `Authorization: Bearer <accessToken>`.
- Every response includes an `X-Trace-Id` header. Send this ID when reporting a backend error.

## Success response

```json
{
  "code": "OK",
  "data": {},
  "traceId": "d8672e03c72e4f67a055cb5530f45e7b"
}
```

List endpoints return `PageResponse` inside `data`:

```json
{
  "items": [],
  "page": 0,
  "size": 20,
  "total": 0,
  "totalPages": 0
}
```

## Error response

```json
{
  "code": "VALIDATION_ERROR",
  "message": "请求参数校验失败",
  "fieldErrors": {
    "title": "实验标题不能为空"
  },
  "traceId": "d8672e03c72e4f67a055cb5530f45e7b"
}
```

Use `BusinessException` with an `ErrorCode` for expected failures. Do not throw generic runtime exceptions for validation, permission or not-found cases.

## Controller rules

1. Controllers accept and return DTOs, never JPA entities.
2. Validation uses Jakarta Validation annotations on request DTOs.
3. Permissions, transactions and status transitions belong in services.
4. Pagination is zero-based and defaults to page 0, size 20.
5. Dates and times use ISO 8601. Enum values use uppercase English constants.
6. Update requests for versioned entities must include their current version.

## Status codes

| Status | Usage |
| --- | --- |
| 200 | Query or update succeeded |
| 201 | Resource created |
| 204 | Archive/delete with no response body |
| 400 | Malformed or invalid request |
| 401 | Missing, invalid or expired login |
| 403 | Authenticated but insufficient project permission |
| 404 | Resource not found in the user's accessible scope |
| 409 | Version conflict or illegal state transition |
