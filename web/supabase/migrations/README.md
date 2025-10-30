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
- (추가 예정) `20251031_create_clients.sql`: 대상자 테이블 생성
- (추가 예정) `20251031_create_clients_rls.sql`: 대상자 테이블 RLS 정책

## 주의사항

- 마이그레이션은 한 번만 실행하세요 (중복 실행 방지)
- 프로덕션 적용 전 반드시 테스트 환경에서 검증하세요
- RLS 정책은 반드시 적용 후 테스트하세요

