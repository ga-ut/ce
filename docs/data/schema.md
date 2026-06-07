# Data Schema

This document defines the shared field-name contract for JSON files under `docs/data/`.

## Stable Field Names

Use these schema field names when adding or updating data.

- `id`: Unique item identifier as a `kebab-case` string
- `status`: Current state (`planned` | `in-progress` | `done` | `blocked`)
- `owner`: Responsible person or team
- `lastUpdated`: Last update date as `YYYY-MM-DD`
- `milestone`: Milestone identifier or name
- `priority`: Priority (`low` | `medium` | `high` | `critical`)

## File Shapes

### `components-status.json`

```json
{
  "components": [
    {
      "id": "component-id",
      "status": "in-progress",
      "owner": "team-name",
      "lastUpdated": "2026-02-15",
      "milestone": "m1",
      "priority": "high"
    }
  ]
}
```

### `roadmap.json`

```json
{
  "items": [
    {
      "id": "roadmap-item-id",
      "status": "planned",
      "owner": "team-name",
      "lastUpdated": "2026-02-15",
      "milestone": "2026-q1",
      "priority": "medium"
    }
  ]
}
```

### `usage-guides.json`

```json
{
  "guides": [
    {
      "id": "guide-id",
      "status": "done",
      "owner": "docs-team",
      "lastUpdated": "2026-02-15",
      "milestone": "docs-v1",
      "priority": "low"
    }
  ]
}
```

## Review Scope

Reviews for data changes should focus on schema compliance.

## After Merge

Future data PRs should reference this schema as the source of truth for field names and file shapes.
