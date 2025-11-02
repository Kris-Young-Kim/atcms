# 의존성 취약점 점검 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

프로젝트의 의존성 패키지에 대한 보안 취약점을 정기적으로 점검하고 관리하는 방법을 안내합니다.

---

## 🔍 취약점 점검 명령어

### 기본 점검

```bash
# 웹 디렉토리로 이동
cd web

# 취약점 점검 실행
pnpm audit
```

**출력 예시**:
```
Packages:    123
High:        2
Medium:      5
Low:         8
```

### 심각도별 점검

```bash
# Moderate 이상 취약점만 확인 (기본)
pnpm audit --audit-level=moderate

# High 이상 취약점만 확인
pnpm audit --audit-level=high

# Critical 취약점만 확인
pnpm audit --audit-level=critical
```

### 자동 수정 시도

```bash
# 자동으로 수정 가능한 취약점 수정
pnpm audit --fix
```

**주의**: 자동 수정은 주의 깊게 진행해야 합니다. 주요 버전 업데이트 시 호환성 문제가 발생할 수 있습니다.

### 리포트 생성

```bash
# JSON 형식으로 리포트 생성
pnpm audit --json > audit-report.json

# 또는 HTML 형식으로 리포트 생성 (도구 사용)
pnpm audit --json | npx audit-ci --report-type=json --report-file=audit-report.json
```

---

## 📅 정기 점검 일정

### 권장 점검 주기

1. **주간 점검** (매주 월요일)
   - 개발 리더가 실행
   - Moderate 이상 취약점 확인
   - 긴급 취약점 즉시 대응

2. **월간 점검** (매월 첫째 주)
   - 전체 취약점 점검
   - 리포트 생성 및 공유
   - 장기 대응 계획 수립

3. **신규 의존성 추가 시**
   - 패키지 추가 후 즉시 점검
   - PR 생성 전 필수 확인

4. **릴리스 전**
   - 모든 취약점 해결 확인
   - Critical/High 취약점 0개 확인

---

## 🛠️ npm 스크립트 사용

### package.json에 추가된 스크립트

```json
{
  "scripts": {
    "audit": "pnpm audit --audit-level=moderate",
    "audit:fix": "pnpm audit --fix",
    "audit:report": "pnpm audit --json > audit-report.json"
  }
}
```

### 사용 방법

```bash
# 기본 점검 (Moderate 이상)
pnpm audit

# 자동 수정 시도
pnpm audit:fix

# 리포트 생성
pnpm audit:report
```

---

## 🔄 CI/CD 통합

### GitHub Actions에 통합

`.github/workflows/ci.yml`에 취약점 점검 단계가 추가되었습니다:

```yaml
- name: Check for security vulnerabilities
  run: pnpm --filter web audit --audit-level=moderate
  continue-on-error: true
```

**동작 방식**:
- 모든 PR 및 push 시 자동 실행
- Moderate 이상 취약점 발견 시 경고
- 빌드 실패는 방지 (`continue-on-error: true`)
- 취약점 발견 시 GitHub Security Alerts에도 자동 등록

---

## 📊 취약점 심각도 기준

### Critical (치명적)

- **설명**: 즉시 조치가 필요한 취약점
- **조치**: 즉시 수정 또는 임시 우회 방안 적용
- **예시**: 원격 코드 실행, 인증 우회

### High (높음)

- **설명**: 빠른 조치가 필요한 취약점
- **조치**: 1주일 이내 수정
- **예시**: 권한 상승, 정보 유출

### Moderate (중간)

- **설명**: 조치가 필요한 취약점
- **조치**: 다음 스프린트 내 수정
- **예시**: 서비스 거부 공격, 데이터 변조

### Low (낮음)

- **설명**: 정보성 취약점
- **조치**: 장기 계획에 포함
- **예시**: 정보 노출, 추적 가능성

---

## 🔧 취약점 대응 프로세스

### 1. 취약점 발견

```bash
# 취약점 점검 실행
pnpm audit

# 취약점 상세 정보 확인
pnpm audit --json
```

### 2. 취약점 분석

- **영향도 분석**: 프로젝트에 미치는 영향 확인
- **패치 버전 확인**: 업데이트 가능한 버전 확인
- **호환성 검토**: 업데이트 시 호환성 문제 확인

### 3. 대응 방안 결정

#### 옵션 1: 패키지 업데이트

```bash
# 특정 패키지 업데이트
pnpm update package-name@latest

# 모든 패키지 업데이트 (주의)
pnpm update --latest
```

#### 옵션 2: 취약점 우회 (임시)

```bash
# 취약점이 있는 패키지의 보안 패치만 적용
pnpm audit --fix
```

#### 옵션 3: 패키지 교체

- 취약점이 지속되는 경우 대체 패키지 검토
- 프로젝트에 미치는 영향 최소화

### 4. 테스트 및 검증

```bash
# 업데이트 후 테스트 실행
pnpm test:ci

# 빌드 확인
pnpm build

# 취약점 재점검
pnpm audit
```

### 5. 문서화 및 커밋

```bash
# 변경 사항 커밋
git add package.json pnpm-lock.yaml
git commit -m "security: fix vulnerabilities in dependencies"

# 취약점 리포트 업데이트 (필요 시)
pnpm audit:report
```

---

## 📋 취약점 점검 체크리스트

### 주간 점검 (매주 월요일)

- [ ] `pnpm audit` 실행
- [ ] Critical/High 취약점 확인
- [ ] 취약점 발견 시 즉시 대응
- [ ] 팀에 알림 (필요 시)

### 월간 점검 (매월 첫째 주)

- [ ] 전체 취약점 점검
- [ ] `pnpm audit:report` 실행
- [ ] 취약점 리포트 생성
- [ ] 장기 대응 계획 수립
- [ ] 이해관계자 보고 (필요 시)

### 신규 의존성 추가 시

- [ ] 패키지 추가 후 `pnpm audit` 실행
- [ ] Critical/High 취약점 확인
- [ ] 취약점 발견 시 대체 패키지 검토
- [ ] PR 설명에 취약점 점검 결과 포함

### 릴리스 전

- [ ] 모든 Critical/High 취약점 해결 확인
- [ ] `pnpm audit` 실행 후 0개 확인
- [ ] 취약점 리포트 생성 및 보관

---

## 🚨 긴급 취약점 대응

### Critical 취약점 발견 시

1. **즉시 보고**
   - 개발 리더에게 즉시 알림
   - PM에게 보고 (필요 시)

2. **긴급 대응**
   - 즉시 패치 적용 또는 임시 우회
   - 프로덕션 환경 점검
   - 사용자 알림 (필요 시)

3. **문서화**
   - 취약점 상세 정보 기록
   - 대응 방안 기록
   - 향후 예방 방안 수립

### High 취약점 발견 시

1. **빠른 대응**
   - 1주일 이내 수정 계획 수립
   - 임시 우회 방안 적용 (필요 시)

2. **모니터링**
   - 취약점 추적
   - 패치 적용 일정 관리

---

## 📈 취약점 추적

### GitHub Security Alerts

GitHub는 자동으로 취약점을 감지하고 알림을 제공합니다:

1. **설정 확인**
   - Repository Settings → Security → Dependabot alerts 활성화
   - 취약점 발견 시 자동 알림 설정

2. **알림 확인**
   - GitHub 알림 또는 이메일 알림 확인
   - Security 탭에서 취약점 목록 확인

### 수동 추적

- **스프레드시트**: 취약점 목록 및 대응 상태 추적
- **이슈 트래킹**: GitHub Issues에 취약점 이슈 생성
- **월간 리포트**: 취약점 점검 결과 문서화

---

## 💡 베스트 프랙티스

### 1. 정기적 점검

- 주간 점검을 통한 조기 발견
- 자동화된 CI/CD 통합으로 지속적 모니터링

### 2. 패키지 선택 시 주의

- 신뢰할 수 있는 패키지 선택
- 활발히 유지보수되는 패키지 선택
- 취약점 이력 확인

### 3. 버전 고정

- `package.json`에서 버전 명시
- `pnpm-lock.yaml`으로 잠금 파일 관리
- 주요 버전 업데이트 시 신중히 검토

### 4. 자동 업데이트 신중히

- `pnpm audit --fix`는 신중하게 사용
- 업데이트 후 테스트 필수
- 주요 버전 업데이트는 수동 검토

---

## 📚 참고 자료

- [pnpm audit 문서](https://pnpm.io/cli/audit)
- [GitHub Security Advisories](https://github.com/advisories)
- [npm Security Best Practices](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)

---

## 🔄 업데이트 이력

| 버전 | 날짜 | 변경 사항 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2025-11-01 | 초안 작성 | PM |

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 매주 월요일 (주간 점검)

