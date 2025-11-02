# 자동 백업 시스템 전략

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

AT-CMP 프로젝트의 자동 백업 시스템 전략 문서입니다. 이 문서는 데이터베이스 백업, 복구 프로세스, 백업 관리 방법을 정의합니다.

---

## 🎯 목표

1. **데이터 손실 방지**: 일 1회 이상 자동 백업으로 데이터 보호
2. **빠른 복구**: 백업에서 빠르게 데이터 복구 가능
3. **비즈니스 연속성**: 장애 발생 시 최소한의 다운타임으로 복구
4. **규정 준수**: 데이터 보존 정책 준수

---

## 📊 백업 전략

### 1. 백업 빈도

**권장 설정:**
- **일일 백업**: 매일 자동 백업 (Supabase 기본 설정)
- **마이그레이션 전 백업**: 데이터베이스 스키마 변경 전 수동 백업
- **주요 변경 전 백업**: 대량 데이터 변경 전 수동 백업

**Supabase 자동 백업:**
- Supabase Pro 플랜 이상: 일일 자동 백업 (7일 보관)
- Supabase Free 플랜: 수동 백업 권장

### 2. 백업 보관 기간

**권장 보관 기간:**
- **일일 백업**: 최소 7일 보관 (Supabase 기본)
- **주간 백업**: 최소 4주 보관 (선택사항)
- **월간 백업**: 최소 3개월 보관 (선택사항)

**법적 보존 기간 고려:**
- 개인정보: 법적 보존 기간 준수 (통상 5년)
- 감사 로그: 최소 1년 보관

### 3. 백업 저장소

**Supabase 자동 백업:**
- Supabase 플랫폼에서 자동 관리
- 암호화된 상태로 저장
- Point-in-Time Recovery (PITR) 지원 (Pro 플랜 이상)

**수동 백업:**
- Supabase Dashboard에서 다운로드
- 로컬 또는 클라우드 스토리지에 보관
- 암호화하여 저장 권장

---

## 🔄 Supabase 백업 설정

### 1. 자동 백업 확인 및 활성화

**Supabase Dashboard에서 확인:**

1. **Supabase Dashboard 접속**: https://supabase.com/dashboard
2. 프로젝트 선택
3. **Settings** → **Database** → **Backups** 메뉴 이동
4. 백업 설정 확인:
   - **Daily Backups**: 활성화 확인
   - **Backup Retention**: 보관 기간 확인 (일반적으로 7일)
   - **Point-in-Time Recovery**: 활성화 여부 확인 (Pro 플랜 이상)

**현재 상태 확인:**
- [ ] Supabase 프로젝트 백업 설정 확인
- [ ] 일일 백업 활성화 확인
- [ ] 보관 기간 확인
- [ ] PITR 활성화 여부 확인 (Pro 플랜인 경우)

### 2. 백업 스케줄 확인

**Supabase 자동 백업:**
- 백업 시간: 매일 자동 (Supabase가 관리)
- 백업 방식: 전체 데이터베이스 스냅샷
- 백업 위치: Supabase 인프라 내부 (암호화됨)

**백업 시간 확인:**
- Supabase Dashboard에서 최근 백업 시간 확인
- 백업 상태 모니터링 설정

### 3. 수동 백업 생성

**필요 시나리오:**
- 마이그레이션 실행 전
- 대량 데이터 변경 전
- 중요한 변경 전

**수동 백업 생성 방법:**

1. **Supabase Dashboard**:
   - Settings → Database → Backups
   - **Create Backup** 버튼 클릭
   - 백업 이름 입력 (예: `pre-migration-20251101`)
   - 백업 생성 대기

2. **Supabase CLI** (선택사항):
   ```bash
   # Supabase CLI 설치
   npm install -g supabase
   
   # 프로젝트 링크
   supabase link --project-ref <your-project-id>
   
   # 데이터베이스 덤프 생성
   supabase db dump -f backup-$(date +%Y%m%d).sql
   ```

---

## 🔧 데이터베이스 스냅샷 관리

### 1. 마이그레이션 전 스냅샷 생성 가이드

**절차:**

1. **마이그레이션 전 백업 생성**:
   ```
   단계:
   1. Supabase Dashboard 접속
   2. Settings → Database → Backups
   3. "Create Backup" 클릭
   4. 백업 이름: "pre-migration-YYYYMMDD-description"
   5. 백업 완료 확인
   ```

2. **백업 확인**:
   - 백업 목록에서 새 백업 확인
   - 백업 크기 및 생성 시간 확인
   - 백업 상태가 "Completed"인지 확인

3. **마이그레이션 실행**:
   - 백업 확인 후 마이그레이션 실행
   - 문제 발생 시 즉시 롤백 가능

**체크리스트:**
- [ ] 마이그레이션 전 백업 생성
- [ ] 백업 완료 확인
- [ ] 백업 이름 명확히 기록
- [ ] 마이그레이션 실행
- [ ] 마이그레이션 후 검증

### 2. 롤백 시나리오 문서화

**시나리오 1: 마이그레이션 실패**

**증상:**
- 마이그레이션 중 오류 발생
- 데이터베이스 상태 불일치

**복구 절차:**
1. 마이그레이션 중단
2. Supabase Dashboard → Database → Backups
3. 마이그레이션 전 백업 선택
4. **Restore** 버튼 클릭
5. 복구 확인 대기
6. 복구 완료 후 재시도

**시나리오 2: 데이터 손실**

**증상:**
- 실수로 데이터 삭제
- 잘못된 업데이트로 인한 데이터 손상

**복구 절차:**
1. 손실 발견 즉시 조치
2. Supabase Dashboard → Database → Backups
3. 손실 발생 전 백업 선택
4. **Restore** 버튼 클릭
5. 복구 확인
6. 데이터 정합성 검증

**시나리오 3: Point-in-Time Recovery (PITR)**

**Pro 플랜 이상인 경우:**
- 특정 시점으로 복구 가능
- 최근 변경사항을 선택적으로 복구

**복구 절차:**
1. Supabase Dashboard → Database → Backups
2. **Point-in-Time Recovery** 선택
3. 복구할 시점 선택
4. 복구 실행
5. 복구 확인

### 3. 백업 확인 체크리스트

**일일 확인 사항:**
- [ ] 최근 백업이 24시간 이내에 생성되었는지 확인
- [ ] 백업 상태가 "Completed"인지 확인
- [ ] 백업 크기가 정상 범위인지 확인

**주간 확인 사항:**
- [ ] 백업 보관 기간 확인
- [ ] 오래된 백업 정리 (필요시)
- [ ] 백업 복구 테스트 (분기별)

**마이그레이션 전 확인 사항:**
- [ ] 최신 백업 생성 완료
- [ ] 백업 이름 명확히 기록
- [ ] 복구 절차 확인
- [ ] 롤백 계획 수립

---

## 📦 Storage 백업

### 1. Supabase Storage 백업

**현재 상태:**
- Supabase Storage는 데이터베이스 백업과 별도로 관리
- Storage 파일은 백업에 포함되지 않음 (수동 백업 필요)

**수동 백업 방법:**

1. **Supabase Dashboard**:
   - Storage → Buckets
   - 각 버킷의 파일 목록 확인
   - 중요 파일 다운로드하여 보관

2. **Supabase CLI** (선택사항):
   ```bash
   # Storage 파일 다운로드
   supabase storage download <bucket-name> <path> --local-path ./backup
   ```

### 2. Storage 백업 권장사항

**백업 빈도:**
- 중요 파일: 수동 백업 (변경 시)
- 정기 백업: 월 1회 (선택사항)

**백업 저장소:**
- 로컬 스토리지 또는 클라우드 스토리지
- 암호화하여 저장

---

## 🔄 복구 프로세스

### 1. 데이터베이스 복구

**절차:**

1. **백업 선택**:
   - Supabase Dashboard → Database → Backups
   - 복구할 백업 선택

2. **복구 실행**:
   - **Restore** 버튼 클릭
   - 복구 확인 (주의: 현재 데이터가 덮어씌워짐)
   - 복구 실행

3. **복구 확인**:
   - 데이터베이스 연결 확인
   - 주요 테이블 데이터 확인
   - 애플리케이션 정상 동작 확인

**주의사항:**
- 복구는 현재 데이터를 덮어씌웁니다
- 복구 전 현재 상태 백업 권장
- 복구 후 애플리케이션 재시작 필요

### 2. 복구 테스트

**정기 복구 테스트:**
- 분기별 1회 이상 복구 테스트 권장
- 테스트 환경에서 복구 프로세스 검증

**테스트 절차:**
1. 테스트 환경 준비
2. 백업 선택
3. 복구 실행
4. 데이터 정합성 확인
5. 애플리케이션 동작 확인
6. 테스트 결과 문서화

---

## 📋 백업 관리 체크리스트

### 일일 체크리스트
- [ ] 최근 백업 생성 확인 (24시간 이내)
- [ ] 백업 상태 확인 (Completed)
- [ ] 백업 크기 확인 (정상 범위)

### 주간 체크리스트
- [ ] 백업 보관 기간 확인
- [ ] 오래된 백업 정리 (필요시)
- [ ] 백업 로그 검토

### 마이그레이션 전 체크리스트
- [ ] 최신 백업 생성
- [ ] 백업 이름 기록
- [ ] 복구 절차 확인
- [ ] 롤백 계획 수립

### 분기별 체크리스트
- [ ] 복구 테스트 실행
- [ ] 백업 정책 검토
- [ ] 백업 저장소 용량 확인
- [ ] 백업 문서 업데이트

---

## 🔗 관련 문서

- [암호화 전략](./encryption-strategy.md)
- [배포 가이드](../DEPLOYMENT.md)
- [데이터베이스 스키마](../DATABASE_SCHEMA.md)
- [마이그레이션 가이드](../web/supabase/migrations/README.md)

---

## 📚 참고 자료

- [Supabase Backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase Point-in-Time Recovery](https://supabase.com/docs/guides/platform/backups#point-in-time-recovery)
- [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

