# CDN 전략 및 설정 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

AT-CMP 프로젝트의 CDN (Content Delivery Network) 전략 및 설정 가이드입니다. 이 문서는 CDN 필요성 검토, 옵션 비교, 설정 방법을 설명합니다.

---

## 🎯 목표

1. **성능 최적화**: 정적 자산 전역 배포로 로딩 속도 개선
2. **비용 효율성**: CDN 도입 효과 분석
3. **트래픽 분산**: 서버 부하 감소
4. **전략 수립**: 현재는 Vercel Edge Network 활용, 향후 필요시 추가 CDN 검토

---

## 🔍 CDN 필요성 검토

### 현재 상태 분석

**Vercel 기본 기능:**
- ✅ **Vercel Edge Network**: Vercel이 자동으로 제공하는 전역 CDN
- ✅ **자동 최적화**: 정적 자산 자동 캐싱 및 최적화
- ✅ **Edge Functions**: API Routes를 Edge로 배포 가능

**현재 트래픽 수준:**
- 프로젝트 초기 단계
- 사용자 수: 제한적
- 트래픽: 낮음

**결론:**
- **현재는 추가 CDN 불필요**
- Vercel Edge Network로 충분
- 향후 트래픽 증가 시 재검토

### CDN 도입 필요 시점

**도입 고려 시점:**
- 월간 트래픽 100GB 이상
- 전역 사용자 증가 (특히 아시아/유럽)
- 정적 자산 로딩 시간 2초 이상
- 서버 부하 증가

---

## 🛠️ 현재 활용 중인 CDN

### 1. Vercel Edge Network

**특징:**
- Vercel이 자동으로 제공
- 전역 CDN 포함
- 추가 설정 불필요

**제공 기능:**
- 정적 자산 (CSS, JS, 이미지) 자동 캐싱
- 전역 엣지 서버 배포
- 자동 압축 및 최적화
- HTTP/2 및 HTTP/3 지원

**설정:**
- 별도 설정 불필요
- Vercel 배포 시 자동 활성화

### 2. Next.js Image 최적화

**특징:**
- Next.js Image 컴포넌트 사용 시 자동 최적화
- Vercel Image Optimization 서비스 활용
- WebP 형식 자동 변환

**사용 예시:**
```tsx
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  // 자동으로 최적화 및 CDN 배포
/>
```

### 3. Supabase Storage CDN

**현재 상태:**
- Supabase Storage는 자체 CDN 사용
- 파일 업로드 시 자동으로 CDN 배포
- 추가 설정 불필요

**활용:**
- 첨부파일 (이미지, PDF 등)
- 계약서 PDF
- 상담 기록 첨부파일

---

## 📊 CDN 옵션 비교

### 1. Vercel Edge Network (현재 사용)

**장점:**
- ✅ 추가 비용 없음
- ✅ 자동 설정 및 관리
- ✅ Next.js와 완벽 통합
- ✅ 전역 배포

**단점:**
- Vercel 플랜에 따라 제한 가능
- 세밀한 설정 제한

**비용:**
- 포함됨 (Vercel 플랜에 포함)

### 2. Cloudflare CDN (선택사항)

**장점:**
- ✅ 무료 플랜 제공
- ✅ 고급 캐싱 설정 가능
- ✅ DDoS 방어 포함
- ✅ 전역 네트워크

**단점:**
- 추가 설정 필요
- Vercel과 별도 관리

**비용:**
- 무료 플랜: 월 100GB
- Pro 플랜: $20/월

**도입 시점:**
- Vercel Edge Network로 부족할 때
- 추가 DDoS 방어 필요 시
- 고급 캐싱 전략 필요 시

### 3. AWS CloudFront (선택사항)

**장점:**
- ✅ AWS 서비스와 통합 용이
- ✅ 고급 설정 가능
- ✅ 전역 네트워크

**단점:**
- 설정 복잡
- 비용 구조 복잡
- Vercel과 별도 관리

**비용:**
- 데이터 전송량 기준 (첫 1TB: $0.085/GB)

**도입 시점:**
- AWS 인프라 사용 시
- 대규모 트래픽 예상 시

---

## ⚙️ 현재 최적화 전략

### 1. Vercel Edge Network 활용

**자동 최적화:**
- 정적 자산 자동 캐싱
- 전역 엣지 서버 배포
- 자동 압축 (Gzip, Brotli)

**추가 설정 불필요:**
- Vercel이 자동으로 처리

### 2. Next.js 최적화

**이미지 최적화:**
```tsx
// next.config.ts에 이미 최적화 설정 포함
const nextConfig = {
  // 이미지 최적화 자동 활성화
  images: {
    domains: ['example.com'], // 외부 이미지 도메인 추가 시
  },
};
```

**정적 생성:**
```tsx
// 가능한 페이지는 정적 생성
export const dynamic = 'force-static';
```

### 3. 캐싱 전략

**Vercel 자동 캐싱:**
- 정적 페이지: 자동 캐싱
- API Routes: 설정 가능
- 이미지: 자동 최적화 및 캐싱

**캐싱 헤더 설정 (필요시):**
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

---

## 🚀 향후 CDN 도입 계획

### 단계별 도입 전략

**1단계: 모니터링 (현재)**
- Vercel Analytics로 성능 모니터링
- Core Web Vitals 측정
- 트래픽 패턴 분석

**2단계: 최적화 (필요시)**
- Vercel Edge Network 추가 설정
- 이미지 최적화 강화
- 캐싱 전략 조정

**3단계: 추가 CDN 검토 (트래픽 증가 시)**
- Cloudflare CDN 도입 검토
- 트래픽 및 비용 분석
- 도입 효과 측정

---

## 📋 CDN 설정 체크리스트

### 현재 상태 확인
- [x] Vercel Edge Network 자동 활성화 확인
- [x] Next.js Image 최적화 사용 확인
- [x] Supabase Storage CDN 활용 확인
- [ ] 성능 모니터링 설정 (Vercel Analytics)

### 향후 도입 시
- [ ] 트래픽 분석 및 필요성 검토
- [ ] CDN 옵션 비교
- [ ] 도입 계획 수립
- [ ] 테스트 및 검증
- [ ] 프로덕션 적용

---

## 🔍 성능 모니터링

### Vercel Analytics (Vercel Pro 플랜 이상)

**제공 기능:**
- Web Vitals 측정
- Real User Monitoring
- 성능 분석

**활성화 방법:**
1. Vercel Dashboard → 프로젝트 선택
2. Settings → Analytics
3. Analytics 활성화

**현재 상태:**
- Vercel Pro 플랜 필요
- 필요 시 활성화 예정

### Core Web Vitals 측정

**측정 지표:**
- **LCP (Largest Contentful Paint)**: 2.5초 이하 목표
- **FID (First Input Delay)**: 100ms 이하 목표
- **CLS (Cumulative Layout Shift)**: 0.1 이하 목표

**측정 도구:**
- Google PageSpeed Insights
- Chrome DevTools Lighthouse
- Vercel Analytics (Pro 플랜)

---

## 📊 비용 분석

### 현재 비용

**Vercel:**
- Hobby 플랜: 무료 (프로젝트 1개)
- Pro 플랜: $20/월 (필요시)

**추가 CDN 비용:**
- 현재 없음 (Vercel Edge Network 사용)

### 향후 예상 비용

**Cloudflare CDN 도입 시:**
- 무료 플랜: 월 100GB 무료
- 초과 시: $0.10/GB

**AWS CloudFront 도입 시:**
- 첫 1TB: $0.085/GB
- 이후: $0.080/GB

---

## 📋 결론 및 권장사항

### 현재 전략

**✅ 권장사항:**
- **Vercel Edge Network 활용**: 현재 충분함
- **Next.js 최적화 활용**: 이미지 및 정적 자산 최적화
- **성능 모니터링**: 정기적으로 Core Web Vitals 측정

**❌ 추가 CDN 도입:**
- 현재는 불필요
- 트래픽 증가 시 재검토

### 향후 검토 시점

**도입 검토 조건:**
1. 월간 트래픽 100GB 이상
2. 전역 사용자 증가
3. 성능 지표 저하 (LCP > 3초)
4. Vercel Edge Network로 부족할 때

**도입 우선순위:**
1. Vercel Edge Network 최적화 (현재)
2. Cloudflare CDN (트래픽 증가 시)
3. AWS CloudFront (대규모 트래픽 시)

---

## 🔗 관련 문서

- [Vercel 배포 가이드](./vercel-deployment-guide.md)
- [시스템 아키텍처](../ARCHITECTURE.md)
- [성능 최적화 가이드](./performance-optimization-guide.md) (향후 작성 예정)

---

## 📚 참고 자료

- [Vercel Edge Network](https://vercel.com/docs/concepts/edge-network)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Cloudflare CDN](https://www.cloudflare.com/cdn/)
- [Web Vitals](https://web.dev/vitals/)

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-05-01 (트래픽 증가 시)

