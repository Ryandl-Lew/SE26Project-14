# Module Ownership

The backend is a modular monolith. Each owner maintains the frontend API wrapper, backend module, tests and OpenAPI definitions for the same business area.

| Owner | Java modules | Primary endpoints |
| --- | --- | --- |
| P1 | `common`, `security`, `auth`, `user`, `dashboard` | `/auth/**`, `/dashboard` |
| P2 | `project` | `/projects/**`, project members and activities |
| P3 | `template`, `record` CRUD | `/templates/**`, record create/detail/update/copy |
| P4 | `collaboration`, record workflow | record list/start/submit/review/archive, comments and versions |
| P5 | `file`, `search`, `report` | files, attachments, search and exports |

## Shared-code rule

- P1 reviews changes under `common`, `security`, the root `pom.xml` and application configuration.
- A module owner may propose a Flyway migration, but P1 and every affected module owner must review it.
- Cross-module calls go through public service/query interfaces, not another module's repository.
- No module may return its JPA entity to a controller in another module.
- API changes are documented before implementation and announced to all frontend consumers.

## Suggested internal structure

```text
module/
├─ controller/
├─ dto/
├─ service/
├─ repository/
├─ entity/
└─ mapper/
```

Create only the directories a module actually needs. Keep business rules in services and keep controllers thin.
