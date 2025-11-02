# AT-CMP (Assistive Technology Case Management Platform)

**프로젝트 코드**: ATCMP-2026  
**프로젝트 기간**: 2025년 11월 ~ 2026년 8월 (9개월)  
**현재 상태**: 기획 단계 → 개발 단계

---

## 📋 프로젝트 개요

AT-CMP는 보조기기 사례관리 플랫폼으로, 대상자 등록부터 대여기기 관리, 맞춤제작까지의 전 과정을 디지털화하여 효율성을 높이는 시스템입니다.

## 🎯 주요 기능

- **사례관리 (CMS)**: 대상자 등록, 상담 기록, 평가 기록 관리
- **대여기기 관리 (ERM)**: 기기 재고 관리, 대여/반납 프로세스
- **맞춤제작 (CDM)**: 제작 요청 생성 및 추적

## 🛠️ 기술 스택

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **인증**: Clerk
- **배포**: Vercel
- **모니터링**: Sentry

## 🚀 빠른 시작

자세한 개발 가이드는 [web/README.md](./web/README.md)를 참고하세요.

```bash
# 1. 저장소 클론
git clone https://github.com/Kris-Young-Kim/atcms.git
cd atcms

# 2. 의존성 설치
cd web
pnpm install

# 3. 환경 변수 설정
# .env.local 파일 생성 (web/ENV_SETUP.md 참고)

# 4. 개발 서버 실행
pnpm dev
```

## 📚 문서

- [프로젝트 관리 시스템](./PROJECT_MANAGEMENT_SYSTEM.md)
- [기여 가이드](./CONTRIBUTING.md)
- [시스템 아키텍처](./ARCHITECTURE.md)
- [API 문서](./API_DOCS.md)
- [배포 가이드](./DEPLOYMENT.md)
- [데이터베이스 스키마](./DATABASE_SCHEMA.md)
- [개발 가이드](./DEVELOPMENT.md)
- [변경 기록](./CHANGELOG.md)
- [JSDoc 주석 가이드](./docs/jsdoc-guide.md)
- [Git Flow 가이드](./docs/git-flow-guide.md)
- [커밋 메시지 가이드](./docs/commit-message-guide.md)
- [이슈 관리 가이드](./docs/issue-management-guide.md)
- [보안 체크리스트](./docs/security-checklist.md)

## 🌿 브랜치 전략

프로젝트는 **Git Flow** 전략을 사용합니다.

- `main`: 프로덕션 배포용 브랜치
- `develop`: 개발 통합 브랜치
- `feature/ATCMP-XXX-xxx`: 기능 개발 브랜치
- `bugfix/ATCMP-XXX-xxx`: 버그 수정 브랜치

자세한 내용은 [Git Flow 가이드](./docs/git-flow-guide.md)를 참고하세요.

## 📝 라이선스

[라이선스 정보 추가 예정]

---

**문의**: 프로젝트 관련 문의는 GitHub Issues를 통해 제출해주세요.
