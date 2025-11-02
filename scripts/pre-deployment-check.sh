#!/bin/bash

# 배포 전 체크리스트 자동화 스크립트
# 
# 사용법:
#   ./scripts/pre-deployment-check.sh [environment]
# 
# 환경:
#   - staging: Staging 배포 전 체크
#   - production: Production 배포 전 체크 (기본값)

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CHECKLIST_FILE="$PROJECT_ROOT/deployment-checklist.md"

echo "🔍 배포 전 체크리스트 실행 중..."
echo "환경: $ENVIRONMENT"
echo ""

# 체크리스트 초기화
cat > "$CHECKLIST_FILE" << EOF
# 배포 전 체크리스트

**환경**: $ENVIRONMENT
**생성 시간**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**브랜치**: ${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-unknown}}
**커밋**: ${GITHUB_SHA:-unknown}

---

## 코드 품질

EOF

# 1. ESLint 체크
echo "📝 ESLint 검사 중..."
if pnpm --filter web lint >> /dev/null 2>&1; then
  echo "- [x] ESLint 통과" >> "$CHECKLIST_FILE"
  echo "✅ ESLint 통과"
else
  echo "- [ ] ESLint 실패" >> "$CHECKLIST_FILE"
  echo "❌ ESLint 실패"
  if [ "$ENVIRONMENT" = "production" ]; then
    exit 1
  fi
fi

# 2. TypeScript 타입 체크
echo "🔷 TypeScript 타입 체크 중..."
if pnpm --filter web type-check >> /dev/null 2>&1; then
  echo "- [x] TypeScript 타입 체크 통과" >> "$CHECKLIST_FILE"
  echo "✅ TypeScript 타입 체크 통과"
else
  echo "- [ ] TypeScript 타입 체크 실패" >> "$CHECKLIST_FILE"
  echo "❌ TypeScript 타입 체크 실패"
  if [ "$ENVIRONMENT" = "production" ]; then
    exit 1
  fi
fi

# 3. Prettier 포맷팅 체크
echo "💅 Prettier 포맷팅 체크 중..."
if pnpm --filter web format:check >> /dev/null 2>&1; then
  echo "- [x] Prettier 포맷팅 통과" >> "$CHECKLIST_FILE"
  echo "✅ Prettier 포맷팅 통과"
else
  echo "- [ ] Prettier 포맷팅 실패" >> "$CHECKLIST_FILE"
  echo "⚠️ Prettier 포맷팅 실패 (경고)"
fi

# 4. 테스트 실행
echo "🧪 테스트 실행 중..."
if pnpm --filter web test:ci >> /dev/null 2>&1; then
  echo "- [x] 테스트 통과" >> "$CHECKLIST_FILE"
  echo "✅ 테스트 통과"
else
  echo "- [ ] 테스트 실패" >> "$CHECKLIST_FILE"
  echo "❌ 테스트 실패"
  exit 1
fi

# 5. 빌드 체크
echo "🏗️ 빌드 중..."
if pnpm --filter web build >> /dev/null 2>&1; then
  echo "- [x] 빌드 성공" >> "$CHECKLIST_FILE"
  echo "✅ 빌드 성공"
else
  echo "- [ ] 빌드 실패" >> "$CHECKLIST_FILE"
  echo "❌ 빌드 실패"
  exit 1
fi

# 6. 보안 취약점 검사
echo "" >> "$CHECKLIST_FILE"
echo "## 보안" >> "$CHECKLIST_FILE"
echo "🔒 보안 취약점 검사 중..."
AUDIT_OUTPUT=$(pnpm --filter web audit --audit-level=moderate 2>&1 || true)
if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
  echo "- [x] 보안 취약점 검사 통과" >> "$CHECKLIST_FILE"
  echo "✅ 보안 취약점 없음"
else
  echo "- [ ] 보안 취약점 발견" >> "$CHECKLIST_FILE"
  echo "⚠️ 보안 취약점 발견"
  echo "" >> "$CHECKLIST_FILE"
  echo "### 보안 취약점 상세" >> "$CHECKLIST_FILE"
  echo '```' >> "$CHECKLIST_FILE"
  echo "$AUDIT_OUTPUT" >> "$CHECKLIST_FILE"
  echo '```' >> "$CHECKLIST_FILE"
  if [ "$ENVIRONMENT" = "production" ]; then
    echo "❌ Production 배포는 보안 취약점 해결 후 진행해주세요."
    exit 1
  fi
fi

# 7. 환경 변수 검증
echo "" >> "$CHECKLIST_FILE"
echo "## 환경 변수" >> "$CHECKLIST_FILE"
echo "🔐 환경 변수 검증 중..."

REQUIRED_ENV_VARS=(
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  "CLERK_SECRET_KEY"
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_ENV_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
  echo "- [x] 필수 환경 변수 확인 완료" >> "$CHECKLIST_FILE"
  echo "✅ 환경 변수 확인 완료"
else
  echo "- [ ] 필수 환경 변수 누락" >> "$CHECKLIST_FILE"
  echo "❌ 다음 환경 변수가 누락되었습니다:"
  for var in "${MISSING_VARS[@]}"; do
    echo "  - $var"
    echo "  - $var" >> "$CHECKLIST_FILE"
  done
  if [ "$ENVIRONMENT" = "production" ]; then
    exit 1
  fi
fi

# 8. 데이터베이스 마이그레이션 확인
echo "" >> "$CHECKLIST_FILE"
echo "## 데이터베이스" >> "$CHECKLIST_FILE"
echo "🗄️ 데이터베이스 마이그레이션 확인 중..."

# 마이그레이션 파일 존재 여부 확인
if [ -d "web/supabase/migrations" ] && [ "$(ls -A web/supabase/migrations 2>/dev/null)" ]; then
  echo "- [x] 마이그레이션 파일 존재 확인" >> "$CHECKLIST_FILE"
  echo "✅ 마이그레이션 파일 확인 완료"
else
  echo "- [ ] 마이그레이션 파일 없음 (선택사항)" >> "$CHECKLIST_FILE"
  echo "ℹ️ 마이그레이션 파일 없음"
fi

# 9. 번들 크기 확인
echo "" >> "$CHECKLIST_FILE"
echo "## 성능" >> "$CHECKLIST_FILE"
echo "📦 번들 크기 확인 중..."

if [ -f "web/.next/analyze/client.html" ]; then
  echo "- [x] 번들 분석 리포트 생성됨" >> "$CHECKLIST_FILE"
  echo "✅ 번들 분석 리포트 생성됨"
else
  echo "- [ ] 번들 분석 리포트 없음 (선택사항)" >> "$CHECKLIST_FILE"
  echo "ℹ️ 번들 분석 리포트 없음"
fi

# 10. 의존성 확인
echo "" >> "$CHECKLIST_FILE"
echo "## 의존성" >> "$CHECKLIST_FILE"
echo "📚 의존성 확인 중..."

if [ -f "web/pnpm-lock.yaml" ]; then
  echo "- [x] pnpm-lock.yaml 존재 확인" >> "$CHECKLIST_FILE"
  echo "✅ 의존성 잠금 파일 확인 완료"
else
  echo "- [ ] pnpm-lock.yaml 없음" >> "$CHECKLIST_FILE"
  echo "⚠️ pnpm-lock.yaml 없음"
fi

# 체크리스트 요약
echo "" >> "$CHECKLIST_FILE"
echo "---" >> "$CHECKLIST_FILE"
echo "" >> "$CHECKLIST_FILE"
echo "## 승인 전 확인사항" >> "$CHECKLIST_FILE"
echo "" >> "$CHECKLIST_FILE"
echo "### 필수 확인사항" >> "$CHECKLIST_FILE"
echo "- [ ] 변경사항 검토 완료" >> "$CHECKLIST_FILE"
echo "- [ ] 핵심 기능 테스트 완료" >> "$CHECKLIST_FILE"
echo "- [ ] 환경 변수 확인 완료" >> "$CHECKLIST_FILE"
echo "- [ ] 롤백 계획 확인 완료" >> "$CHECKLIST_FILE"
echo "" >> "$CHECKLIST_FILE"
echo "### 선택 확인사항" >> "$CHECKLIST_FILE"
echo "- [ ] 성능 테스트 완료" >> "$CHECKLIST_FILE"
echo "- [ ] 보안 테스트 완료" >> "$CHECKLIST_FILE"
echo "- [ ] 접근성 테스트 완료" >> "$CHECKLIST_FILE"

echo ""
echo "✅ 배포 전 체크리스트 생성 완료"
echo "📄 체크리스트 파일: $CHECKLIST_FILE"
echo ""

# 체크리스트 내용 출력
cat "$CHECKLIST_FILE"

