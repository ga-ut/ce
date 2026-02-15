# GitHub Pages 배포 장애 기록

## 발생 일시
- 2026-02-15

## 증상
- `actions/deploy-pages@v4` 단계에서 `Creating Pages deployment failed`와 함께 `HttpError: Not Found (404)`가 발생.
- 에러 메시지에 `Ensure GitHub Pages has been enabled`가 포함됨.

## 원인 분석
- 워크플로우는 `upload-pages-artifact`까지 정상 수행되어 artifact 생성에는 문제가 없음.
- `deploy-pages` 단계의 404는 GitHub Pages 미활성화 상태이거나, Pages 소스가 `GitHub Actions`로 설정되지 않은 경우에 발생.
- 즉, 경로(`docs/site`, `docs/data`) 문제가 아니라 리포지토리 Settings > Pages의 선행 설정 부재가 1차 원인.

## 조치 내용
1. `.github/workflows/pages.yml`의 `deploy` job 시작부에 **Preflight 점검 단계** 추가.
   - GitHub API(`repos.getPages`)로 Pages 활성화 상태를 확인.
   - Pages가 비활성화(404)면 즉시 실패 처리하고, 설정 위치와 필요한 값(Source=`GitHub Actions`)을 로그로 안내.
   - Pages가 활성화되어도 `build_type != workflow`이면 즉시 실패 처리.
2. 배포 실패 시 운영 가이드 로그를 보강.
   - 기존의 경로 점검 안내에 더해, **Pages 활성화 및 Source 설정 점검**을 최우선으로 명시.

## 기대 효과
- 기존처럼 `deploy-pages` 단계에서 모호한 404를 뒤늦게 보는 대신,
  설정 누락을 배포 전(preflight)에서 즉시 식별 가능.
- 운영자가 확인해야 할 우선순위(설정 → 경로)가 명확해져 장애 대응 시간이 단축됨.
