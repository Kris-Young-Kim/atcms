# Cursor IDE Settings Prompts

## User Rules

```
당신은 효율적이고 실용적인 개발 보조자입니다. 다음 원칙을 따르세요:

1. 코드 작성 시 최신 표준과 모범 사례를 따릅니다.
2. 명확하고 유지보수하기 쉬운 코드를 작성합니다.
3. 성능과 보안을 항상 고려합니다.
4. 불필요한 설명은 피하고 핵심만 전달합니다.
5. 사용자의 의도를 파악하고 예상되는 요구사항을 선제적으로 반영합니다.
6. 오류나 문제 발생 시 명확한 해결책을 제시합니다.
7. 코드 리뷰 시 개선 사항을 구체적으로 지적합니다.
8. 기존 프로젝트 컨텍스트를 고려하여 일관된 스타일을 유지합니다.
```

## Project Rules

```
이 프로젝트의 개발 규칙:

1. 언어: [JavaScript/TypeScript/Python 등 선택]
2. 프레임워크: [React/Vue/Django 등 선택]
3. 코드 스타일:
   - 들여쓰기: 2 스페이스
   - 라인 길이: 최대 100자
   - 변수명: camelCase (함수, 변수), PascalCase (컴포넌트, 클래스)
4. 파일 구조:
   - 컴포넌트는 /components 디렉토리에 저장
   - 유틸리티는 /utils 디렉토리에 저장
   - 상수는 /constants 디렉토리에 저장
5. 테스트:
   - 모든 주요 함수에 대한 단위 테스트 작성
   - 테스트 프레임워크: [Jest/Vitest 등]
6. 커밋 메시지:
   - 형식: [TYPE] 설명
   - TYPE: feat, fix, refactor, docs, test, style, chore
   - 예: "[feat] 사용자 로그인 기능 구현"
7. 의존성 관리:
   - 불필요한 외부 라이브러리 추가 금지
   - 버전 고정 원칙 (package-lock.json 커밋)
8. 보안:
   - 민감한 정보는 환경 변수로 관리
   - 입력값 검증 필수
   - SQL 인젝션, XSS 방지 필수
```

## Project Memories

```
프로젝트 컨텍스트:

프로젝트명: [프로젝트 이름]
목표: [프로젝트의 주요 목표]
주요 기능:
  - [기능 1]
  - [기능 2]
  - [기능 3]

기술 스택:
  - Frontend: [사용 기술]
  - Backend: [사용 기술]
  - Database: [사용 기술]
  - 기타: [기타 도구]

팀 구성: [팀 규모 및 역할]

현재 진행 상황:
  - 완료된 기능: [기능들]
  - 진행 중인 작업: [현재 작업]
  - 예정된 작업: [향후 계획]

주의사항:
  - [피해야 할 패턴]
  - [자주 발생하는 문제]
  - [특별히 고려할 점]

API 엔드포인트 (해당 사항 있을 시):
  - GET /api/users - 사용자 목록 조회
  - POST /api/users - 사용자 생성
  - [기타 엔드포인트]

데이터베이스 스키마 (해당 사항 있을 시):
  - users 테이블: id, name, email, created_at
  - posts 테이블: id, user_id, title, content, created_at
  - [기타 테이블]

외부 의존성:
  - [서비스명]: [용도]
  - [라이브러리명]: [버전]
```

## Project Commands

```
다음은 자주 사용할 명령어입니다:

1. 개발 환경 시작:
   npm run dev
   # 또는
   yarn dev

2. 빌드:
   npm run build
   # 또는
   yarn build

3. 테스트 실행:
   npm run test
   # 또는
   yarn test

4. 테스트 커버리지:
   npm run test:coverage
   # 또는
   yarn test:coverage

5. 린팅:
   npm run lint
   # 또는
   yarn lint

6. 형식 검사/정렬:
   npm run format
   # 또는
   yarn format

7. 타입 체크 (TypeScript):
   npm run type-check
   # 또는
   yarn type-check

8. 환경 설정:
   npm install
   cp .env.example .env
   # .env 파일 설정 필요

9. 데이터베이스 마이그레이션 (해당 사항 있을 시):
   npm run migrate
   npm run migrate:rollback

10. 프로덕션 배포:
    npm run build && npm run deploy

11. 로그 확인:
    npm run logs

12. 캐시 초기화:
    npm run clean
    rm -rf node_modules && npm install
```

---

## 사용 방법

각 섹션의 내용을 다음과 같이 Cursor 설정에 입력하세요:

1. **User Rules**: Cursor 설정 → Rules 탭 → 위의 User Rules 내용 복사
2. **Project Rules**: 프로젝트 루트의 `.cursor/rules` 파일 또는 Cursor 설정 → 내용 복사
3. **Memories**: Cursor 설정 → Memories 탭 → 위의 Project Memories 내용 복사
4. **Commands**: Cursor 설정 → Commands 탭 또는 `.cursor/commands.md` → 위의 내용 복사

## 커스터마이징 팁

- `[...]`로 표시된 부분을 프로젝트 상황에 맞게 수정하세요
- 불필요한 항목은 삭제하고 필요한 항목을 추가하세요
- 프로젝트가 진행되면서 정보를 주기적으로 업데이트하세요
- 팀 내에서 사용하는 특정 규칙이나 패턴이 있다면 명시적으로 작성하세요
