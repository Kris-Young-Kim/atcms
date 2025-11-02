# 도메인 및 SSL 인증서 설정 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

AT-CMP 프로젝트의 도메인 및 SSL 인증서 설정 가이드입니다. 이 문서는 Vercel에서 커스텀 도메인을 추가하고 SSL 인증서를 설정하는 방법을 설명합니다.

---

## 🎯 목표

1. **커스텀 도메인 설정**: 프로덕션 도메인 연결
2. **SSL 인증서 자동 발급**: Let's Encrypt를 통한 자동 SSL 설정
3. **HTTPS 강제**: 모든 트래픽을 HTTPS로 리디렉션
4. **도메인 관리**: DNS 설정 및 도메인 관리 방법

---

## 🌐 도메인 설정

### 1. 기본 도메인 (Vercel 자동 제공)

**현재 사용 가능한 도메인:**
- **Production**: `atcmp.vercel.app` (또는 프로젝트 이름)
- **Preview**: `atcmp-<branch-name>-<username>.vercel.app`

**특징:**
- 자동으로 생성됨
- HTTPS 기본 지원
- 추가 설정 불필요

### 2. 커스텀 도메인 추가

**절차:**

1. **Vercel Dashboard 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택 (`atcmp`)

2. **Settings → Domains**
   - **Add Domain** 버튼 클릭

3. **도메인 입력**
   - 예: `atcmp.example.com` 또는 `atcmp.co.kr`
   - 서브도메인 또는 루트 도메인 모두 가능

4. **DNS 설정 안내 확인**
   - Vercel이 DNS 설정 방법을 안내합니다
   - 설정 방법에 따라 DNS 레코드 추가

5. **SSL 인증서 자동 발급**
   - DNS 설정 완료 후 자동으로 SSL 인증서 발급
   - 일반적으로 몇 분~몇 시간 소요

### 3. DNS 설정 방법

#### A Record 설정 (루트 도메인)

**예시**: `example.com`을 Vercel에 연결

**DNS 레코드:**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600 (또는 자동)
```

**Vercel IP 주소** (2025년 기준):
- `76.76.21.21` (Vercel IPv4 주소)

**주의사항:**
- Vercel IP 주소는 변경될 수 있으므로 공식 문서 확인 권장
- Vercel Dashboard의 DNS 설정 안내에 표시된 IP 주소 사용

#### CNAME Record 설정 (서브도메인)

**예시**: `atcmp.example.com`을 Vercel에 연결

**DNS 레코드:**
```
Type: CNAME
Name: atcmp
Value: cname.vercel-dns.com
TTL: 3600 (또는 자동)
```

**장점:**
- IP 주소 변경 시 자동 반영
- 설정이 더 간단함

#### WWW 서브도메인 설정 (선택사항)

**루트 도메인과 www 모두 연결:**

1. **루트 도메인**: A Record 설정
2. **www 서브도메인**: CNAME Record 설정
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

**자동 리디렉션:**
- Vercel이 자동으로 `www` ↔ 루트 도메인 리디렉션 설정

### 4. DNS 설정 확인

**설정 확인 방법:**

1. **DNS 전파 확인**:
   ```bash
   # nslookup 사용
   nslookup atcmp.example.com
   
   # dig 사용
   dig atcmp.example.com
   ```

2. **Vercel Dashboard 확인**:
   - Settings → Domains
   - 도메인 상태 확인
   - "Valid Configuration" 상태가 되면 완료

**예상 소요 시간:**
- DNS 전파: 1분~24시간 (일반적으로 몇 분~1시간)
- SSL 인증서 발급: DNS 설정 완료 후 몇 분~몇 시간

---

## 🔒 SSL 인증서 설정

### 1. 자동 SSL 발급

**Vercel 자동 SSL:**
- Vercel이 자동으로 Let's Encrypt 인증서 발급
- DNS 설정 완료 후 자동으로 처리됨
- 추가 설정 불필요

**발급 과정:**
1. DNS 설정 완료 확인
2. Vercel이 자동으로 SSL 인증서 요청
3. Let's Encrypt 인증서 발급
4. HTTPS 활성화

### 2. SSL 인증서 확인

**인증서 확인 방법:**

1. **브라우저에서 확인**:
   - `https://atcmp.example.com` 접속
   - 주소창의 자물쇠 아이콘 확인
   - 인증서 정보 확인

2. **Vercel Dashboard 확인**:
   - Settings → Domains
   - 도메인 옆에 "SSL Valid" 표시 확인

3. **온라인 도구 사용**:
   - SSL Labs: https://www.ssllabs.com/ssltest/
   - SSL Checker: https://www.sslshopper.com/ssl-checker.html

### 3. SSL 인증서 자동 갱신

**자동 갱신:**
- Vercel이 자동으로 인증서 갱신
- 만료 전 자동 갱신 (일반적으로 90일 주기)
- 다운타임 없음

**갱신 확인:**
- Vercel Dashboard → Domains에서 인증서 만료일 확인
- 자동 갱신 로그 확인 (필요시)

---

## 🔄 HTTPS 강제 설정

### 1. 자동 HTTPS 리디렉션

**Vercel 기본 설정:**
- Vercel은 기본적으로 HTTP → HTTPS 리디렉션을 자동으로 처리합니다
- 추가 설정 불필요

**리디렉션 확인:**
- `http://atcmp.example.com` 접속 시 자동으로 `https://atcmp.example.com`으로 리디렉션

### 2. 수동 설정 (필요시)

**Next.js에서 HTTPS 강제:**

`next.config.ts`에 추가:
```typescript
const nextConfig: NextConfig = {
  // ... 기타 설정
  
  // Production 환경에서 HTTPS 강제
  async headers() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains',
            },
          ],
        },
      ];
    }
    return [];
  },
};
```

**참고**: Vercel은 자동으로 HTTPS를 강제하므로 일반적으로 추가 설정이 필요 없습니다.

### 3. HSTS (HTTP Strict Transport Security)

**Vercel 자동 설정:**
- Vercel이 자동으로 HSTS 헤더 추가
- 브라우저가 자동으로 HTTPS 연결 강제

---

## 📋 도메인 관리

### 1. 여러 도메인 연결

**동일 프로젝트에 여러 도메인 연결:**

1. **루트 도메인**: `atcmp.example.com`
2. **www 서브도메인**: `www.atcmp.example.com`
3. **다른 도메인**: `atcmp.co.kr` (선택사항)

**설정 방법:**
- 각 도메인을 Vercel Dashboard에서 개별적으로 추가
- 모든 도메인에 동일한 SSL 인증서 발급

### 2. 도메인 삭제

**도메인 제거 절차:**

1. **Vercel Dashboard**:
   - Settings → Domains
   - 제거할 도메인 선택
   - **Remove** 버튼 클릭
   - 확인

2. **DNS 설정 제거** (선택사항):
   - DNS 제공업체에서 A Record 또는 CNAME Record 제거
   - 도메인을 다른 곳에서 사용할 경우 필요

### 3. 도메인 전송

**다른 Vercel 프로젝트로 이동:**

1. 기존 프로젝트에서 도메인 제거
2. 새 프로젝트에서 도메인 추가
3. DNS 설정은 변경 불필요 (동일한 Vercel 계정인 경우)

---

## 🔍 문제 해결

### 도메인 연결 실패

**확인 사항:**
1. DNS 설정이 올바른지 확인
2. DNS 전파 대기 (최대 24시간)
3. DNS 레코드 형식 확인 (대소문자, 공백 등)

**해결 방법:**
- Vercel Dashboard의 DNS 설정 안내 재확인
- DNS 제공업체 설정 확인
- DNS 전파 확인 도구 사용 (예: https://dnschecker.org/)

### SSL 인증서 발급 실패

**일반적인 원인:**
- DNS 설정이 완료되지 않음
- DNS 전파 지연
- 잘못된 DNS 레코드

**해결 방법:**
1. DNS 설정 완료 확인
2. DNS 전파 대기
3. Vercel Dashboard에서 "Retry" 클릭
4. 몇 시간 후에도 실패 시 Vercel 지원팀 문의

### HTTPS 리디렉션 작동 안 함

**확인 사항:**
- Vercel Dashboard에서 SSL 인증서 상태 확인
- 브라우저 캐시 삭제 후 재시도
- 다른 브라우저에서 테스트

**해결 방법:**
- Vercel은 기본적으로 HTTPS를 강제하므로 일반적으로 문제 없음
- 문제 지속 시 Vercel 지원팀 문의

---

## 📋 도메인 및 SSL 설정 체크리스트

### 초기 설정
- [ ] 도메인 구매 또는 기존 도메인 준비
- [ ] Vercel Dashboard에서 도메인 추가
- [ ] DNS 레코드 설정 (A 또는 CNAME)
- [ ] DNS 전파 확인
- [ ] SSL 인증서 발급 확인
- [ ] HTTPS 연결 테스트

### 정기 점검 (분기별)
- [ ] SSL 인증서 만료일 확인
- [ ] 도메인 상태 확인
- [ ] HTTPS 연결 확인
- [ ] DNS 레코드 상태 확인

### 문제 발생 시
- [ ] DNS 설정 확인
- [ ] SSL 인증서 상태 확인
- [ ] Vercel Dashboard 로그 확인
- [ ] 필요한 경우 Vercel 지원팀 문의

---

## 🔗 관련 문서

- [Vercel 배포 가이드](./vercel-deployment-guide.md)
- [Vercel Secrets 가이드](./vercel-secrets-guide.md)
- [배포 가이드](../DEPLOYMENT.md)

---

## 📚 참고 자료

- [Vercel Domains](https://vercel.com/docs/concepts/projects/domains)
- [Vercel SSL Certificates](https://vercel.com/docs/concepts/projects/domains/ssl-certificates)
- [Let's Encrypt](https://letsencrypt.org/)
- [DNS 설정 가이드](https://vercel.com/docs/concepts/projects/domains/dns-records)

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

