# Data Schema

이 문서는 `docs/data/` 하위 JSON 파일에서 공통으로 사용하는 필드명 규칙을 고정합니다.

## 고정 필드명 규칙

아래 필드명은 스키마 기준 필드이며, 새로운 데이터 추가 시 동일한 이름을 사용해야 합니다.

- `id`: 항목 고유 식별자 (`kebab-case` 문자열)
- `status`: 현재 상태 (`planned` | `in-progress` | `done` | `blocked`)
- `owner`: 담당자 또는 담당 팀
- `lastUpdated`: 마지막 갱신 시각 (`YYYY-MM-DD`)
- `milestone`: 마일스톤 식별자 또는 이름
- `priority`: 우선순위 (`low` | `medium` | `high` | `critical`)

## 파일별 구조

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

## 리뷰 포인트

본 PR의 리뷰 포인트는 **데이터 스키마 적합성**으로 한정합니다.

## 머지 후 원칙

머지 이후 생성되는 다른 PR은 이 문서의 스키마(필드명 규칙)를 기준으로만 참조합니다.
