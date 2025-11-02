# .env.local 파일 문제 해결 가이드

## 문제 발견

`.env.local` 파일의 5번째 줄에 있는 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 값이 정상적인 Clerk 키 형식이 아닙니다.

**현재 값**:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_b2JsaWdpbmctbGVtdXItMTEuY2xlcmsuYWNjb3VudHMuZGV2JA
```

**문제점**:
- `pk_test_` 뒤의 값이 정상적인 Clerk 키 형식이 아님
- Base64 인코딩된 도메인 이름처럼 보임 (`obliging-lemur-11.clerk.accounts.dev`)
- 실제 Clerk Publishable Key가 아님

## 해결 방법

### 1단계: Clerk Dashboard에서 실제 키 확인

1. **Clerk Dashboard** 접속: https://dashboard.clerk.com
2. 프로젝트 선택 (obliging-lemur-11)
3. **API Keys** 메뉴로 이동
4. **Publishable Key** 복사
   - 올바른 형식: `pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`
   - 또는 Live 키: `pk_live_51...`

### 2단계: .env.local 파일 수정

**수정 전**:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_b2JsaWdpbmctbGVtdXItMTEuY2xlcmsuYWNjb3VudHMuZGV2JA
```

**수정 후** (Clerk Dashboard에서 복사한 실제 키로 교체):
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_실제키값
```

### 3단계: 올바른 형식 확인

**✅ 올바른 형식**:
- `pk_test_` 또는 `pk_live_`로 시작
- 뒤에 약 50자 이상의 영숫자 문자열
- 예: `pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`

**❌ 잘못된 형식**:
- Base64 인코딩된 문자열
- 도메인 이름
- 플레이스홀더 (`pk_test_placeholder`)

### 4단계: 개발 서버 재시작

```bash
cd web
pnpm dev
```

## 확인 사항

수정 후 다음을 확인하세요:

1. **콘솔 경고 확인**:
   - ❌ "Clerk has been loaded with development keys" 경고가 사라져야 함
   - ✅ 인증 기능이 정상 작동해야 함

2. **로그인 테스트**:
   - `/sign-in` 페이지 접속
   - 로그인 기능 정상 작동 확인

## 추가 확인

6번째 줄의 `CLERK_SECRET_KEY`도 확인하세요:
- 형식: `sk_test_...` 또는 `sk_live_...`
- Clerk Dashboard의 **Secret Key**와 일치해야 함

## 참고

- Clerk 키는 프로젝트별로 고유합니다
- Test 키는 개발/테스트용, Live 키는 프로덕션용입니다
- 키는 절대 공유하거나 커밋하지 마세요

