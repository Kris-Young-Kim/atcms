# 릴리스 노트 템플릿

**버전**: [버전 번호]  
**릴리스 날짜**: [YYYY-MM-DD]  
**프로젝트 코드**: ATCMP-2026

---

## 📋 개요

이 릴리스는 [주요 변경사항 요약]을 포함합니다.

---

## 🎉 주요 변경사항

### 새로운 기능

- [기능 1]: [설명]
- [기능 2]: [설명]

### 개선사항

- [개선사항 1]: [설명]
- [개선사항 2]: [설명]

### 버그 수정

- [버그 1]: [설명]
- [버그 2]: [설명]

### 보안

- [보안 수정 1]: [설명]

### 폐기 예정

- [기능]: [버전]에서 제거 예정

---

## 📊 통계

- **추가된 기능**: [N]개
- **수정된 버그**: [N]개
- **보안 수정**: [N]개
- **코드 변경**: [N]줄 추가, [N]줄 삭제

---

## 🔄 마이그레이션 가이드

### 데이터베이스 마이그레이션

```bash
# 마이그레이션 파일 적용
supabase db push
```

**마이그레이션 순서:**
1. `YYYYMMDD_description1.sql`
2. `YYYYMMDD_description2.sql`

### 환경 변수 변경

다음 환경 변수가 추가/변경되었습니다:

```bash
# 새로 추가된 환경 변수
NEW_ENV_VAR=value

# 변경된 환경 변수
UPDATED_ENV_VAR=new_value
```

### 코드 변경

#### API 변경

**Breaking Changes:**

- `GET /api/old-endpoint` → `GET /api/new-endpoint`
- 요청 형식 변경: [설명]

**호환성:**

- 기존 API는 [버전]까지 지원됩니다.

#### 컴포넌트 변경

- `OldComponent` → `NewComponent` (Props 변경)
- 사용 예시:

```tsx
// 이전
<OldComponent prop1={value} />

// 이후
<NewComponent prop1={value} newProp={value} />
```

---

## 📚 문서 업데이트

- [ARCHITECTURE.md](./ARCHITECTURE.md): 아키텍처 변경사항 반영
- [API_DOCS.md](./API_DOCS.md): API 변경사항 문서화
- [DEVELOPMENT.md](./DEVELOPMENT.md): 개발 가이드 업데이트

---

## 🧪 테스트

### 테스트 커버리지

- **전체 커버리지**: [XX]%
- **단위 테스트**: [N]개 통과
- **통합 테스트**: [N]개 통과
- **E2E 테스트**: [N]개 통과

### 테스트 환경

- **Node.js**: [버전]
- **pnpm**: [버전]
- **브라우저**: Chrome, Firefox, Safari 최신 버전

---

## 🔗 관련 링크

- [CHANGELOG](./CHANGELOG.md)
- [GitHub Release](https://github.com/Kris-Young-Kim/atcmp/releases/tag/[tag])
- [배포 가이드](./DEPLOYMENT.md)

---

## 🙏 기여자

- [@username1](https://github.com/username1)
- [@username2](https://github.com/username2)

---

## 📝 참고사항

### 알려진 이슈

- [이슈 설명] (#[이슈 번호])

### 향후 계획

- [계획된 기능 1]
- [계획된 기능 2]

---

**다운로드**: [GitHub Releases](https://github.com/Kris-Young-Kim/atcmp/releases/tag/[tag])  
**문의**: [GitHub Issues](https://github.com/Kris-Young-Kim/atcmp/issues)

