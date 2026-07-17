# @ga-ut/ui

GA-UT 제품의 공통 시각 언어와 인터랙션을 담은 비공개 Web Components 패키지입니다. `@ga-ut/ce/web` 위에 구축되며 Tailwind, 외부 UI 프레임워크, 런타임 스타일 의존성이 없습니다.

## 사용

패키지를 한 번 import하면 모든 GA-UT 요소가 자동 등록됩니다.

```ts
import "@ga-ut/ui";
```

```html
<ga-mark size="md"></ga-mark>
<ga-button variant="primary" size="md">저장하기</ga-button>
<ga-switch checked>업데이트 알림</ga-switch>
<ga-text-field label="이메일" placeholder="name@ga-ut.com"></ga-text-field>
```

태그 이름이 필요한 라우터나 테스트에서는 등록 결과를 import할 수 있습니다.

```ts
import {
  gaButtonTag,
  gaSwitchTag,
  gaTextFieldTag,
} from "@ga-ut/ui";

// "ga-button", "ga-switch", "ga-text-field"
```

## 토큰과 기반 스타일

`gaUiTokens`와 `gaUiFoundations`는 각각 CSS 문자열입니다. `gaUiStyles`는 두 문자열을 순서대로 담은 `string[]`이며 CE 앱 전체의 전역 Shadow DOM 스타일로도 사용할 수 있습니다.

```ts
import { config } from "@ga-ut/ce/web";
import { gaUiStyles } from "@ga-ut/ui";

config({ globalStyles: gaUiStyles });
```

각 GA-UT 컴포넌트에는 이 기반 스타일이 이미 포함되어 있습니다. 주요 의미 토큰은 surface, text, border, accent, success, warning, danger, focus, typography, spacing, radius, shadow, motion으로 나뉩니다.

밝은 모드는 porcelain `#F7F5F1`, ink `#171816`, accent `#E84D3D`, celadon과 blue focus를 사용합니다. 상위 요소에 `data-theme="dark"` 또는 `.ga-dark`를 지정하면 어두운 의미 토큰으로 전환됩니다.

```html
<main data-theme="dark">
  <ga-button>어두운 화면의 버튼</ga-button>
</main>
```

## 컴포넌트

| 태그 | 속성 | 내용 |
| --- | --- | --- |
| `ga-button` | `variant="primary\|outline\|ghost"`, `size="sm\|md\|lg"`, `disabled`, `loading` | 기본 슬롯 |
| `ga-switch` | `checked`, `disabled` | 기본 슬롯 라벨 |
| `ga-text-field` | `label`, `value`, `placeholder`, `disabled`, `invalid` | 없음 |
| `ga-badge` | `tone="success\|warning\|danger\|neutral"` | 기본 슬롯 |
| `ga-feedback` | `tone`, `title`, `dismiss` | 기본 슬롯 메시지 |
| `ga-tab` | `selected`, `disabled` | 기본 슬롯 |
| `ga-mark` | `size="sm\|md\|lg"` | 없음 |

기본값은 button `primary/md`, 상태 tone `neutral`, mark `md`입니다. 알 수 없는 문자열 값은 해당 기본값으로 안전하게 돌아갑니다.

## 이벤트

상호작용 이벤트는 Shadow DOM 밖에서 사용할 수 있도록 모두 `bubbles: true`, `composed: true`로 전달됩니다.

```ts
const field = document.querySelector("ga-text-field");

field?.addEventListener("ga-input", (event) => {
  console.log((event as CustomEvent<{ value: string }>).detail.value);
});
```

- `ga-switch`: `ga-change`, detail `{ checked: boolean }`
- `ga-text-field`: `ga-input`, `ga-change`, detail `{ value: string }`
- `ga-feedback`: `ga-dismiss`; 취소되지 않으면 host에 `hidden`을 설정합니다.

모든 컨트롤은 네이티브 `button` 또는 `input`을 내부에 사용하며 키보드 포커스, disabled 상태, ARIA 상태를 함께 동기화합니다. 세부 스타일 확장이 필요할 때는 공개된 `part`를 사용할 수 있지만, GA-UT 내부 일관성을 위해 의미 토큰을 우선합니다.
