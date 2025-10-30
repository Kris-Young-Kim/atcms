# AT-Care 감사 로그 정책 (MVP)

## 1. 목적
- 사례관리(CMS)와 대여관리(ERM) 전 과정을 추적하기 위한 공통 감사 로그 체계를 정의합니다.
- Sentry 및 향후 `audit_logs` 테이블과 연계해 운영 중 장애 원인 파악 시간을 단축합니다.

## 2. 로깅 도구
- `web/src/lib/logger/auditLogger.ts`
  - `auditLogger.info(action, { metadata, actorId, tags })`
  - `auditLogger.error(action, { metadata, actorId, tags, error })`
- 내부적으로 `console` + `@sentry/nextjs`를 동시에 호출하며, `NODE_ENV === "test"`에서는 콘솔 로그를 생략합니다.

## 3. 필수 호출 지점
- CRUD 트랜잭션: 대상자 등록/수정, 상담/평가 기록 CRUD, 기기 재고/대여/반납, 맞춤 제작 요청
- 인증 및 권한: 로그인/로그아웃, 역할 변경, 권한 오류 발생 시
- 시스템 이벤트: 배치 작업, 자동화 알림 전송, 오류 발생 및 예외 처리
- 테스트: Jest/RTL에서 감사 로그 호출 여부를 최소 한 번 검증 (`auditLogger.info/error` 모킹)

## 4. 메시지 패턴
| 레벨 | action 예시 | metadata | 비고 |
|------|-------------|----------|------|
| info | `client_created`, `consultation_created`, `equipment_status_updated` | `{ clientId, payload }` | 정상 흐름 |
| error | `client_create_failed`, `rental_return_failed` | `{ clientId, reason }` | `error` 옵션으로 예외 객체 전달 |

> action 이름은 `영역_동사` 패턴을 따릅니다. 예: `auth_login`, `supabase_migration`, `automation_reminder_sent`

## 5. 향후 확장
- `audit_logs` 테이블 생성 시 `auditLogger`에 Supabase insert 로직 추가
- 로그 레벨별 SLO를 정의하고 Sentry Alert Rule과 연동
- 각 API 라우트에 감사 로그 미들웨어 추가로 중복 코드 축소

