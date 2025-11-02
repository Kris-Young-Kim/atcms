# Supabase Migrations

이 디렉터리는 AT-Care 프로젝트의 Supabase 데이터베이스 마이그레이션 스크립트를 포함합니다.

## 마이그레이션 적용 방법

### 방법 1: Supabase Dashboard (권장)

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **SQL Editor** 메뉴로 이동
4. 각 마이그레이션 파일의 내용을 복사하여 실행
5. 순서대로 실행 (파일명의 날짜 순)

### 방법 2: Supabase CLI

```bash
# Supabase CLI 설치 (아직 안 했다면)
npm install -g supabase

# 프로젝트 링크 (최초 1회)
supabase link --project-ref <your-project-id>

# 마이그레이션 적용
supabase db push
```

## 마이그레이션 파일 목록

- `20251030_create_audit_logs.sql`: 감사 로그 테이블 생성
- `20251031_create_clients.sql`: 대상자 테이블 생성

**참고**: 이 프로젝트는 Supabase RLS를 사용하지 않습니다. 모든 접근 제어는 애플리케이션 레벨에서 처리합니다.

## 주의사항

- 마이그레이션은 한 번만 실행하세요 (중복 실행 방지)
- 프로덕션 적용 전 반드시 테스트 환경에서 검증하세요
- 접근 제어는 애플리케이션 레벨에서 구현합니다 (Clerk 인증 + API 미들웨어)

