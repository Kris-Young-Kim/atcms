export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 py-24">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 font-sans">
        <div className="flex flex-col gap-6">
          <span className="w-fit rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">
            AT-Care MVP 환경
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-900">
            보조공학 사례관리 · 대여관리 MVP 개발을 위한 기반이 준비되었습니다.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
            Clerk 인증, Supabase 데이터 계층, 감사 로그 유틸, Prettier/ESLint 규칙을 갖춘 Next.js 16
            애플리케이션으로 Phase 1 핵심 기능을 빠르게 구현할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "인증 · 권한",
              description: [
                "ClerkProvider와 환경 변수 검증을 기본 제공해",
                "조직·역할 기반 RBAC 구현을 준비했습니다.",
              ].join(" "),
            },
            {
              title: "Supabase 연동",
              description: [
                "브라우저·서버·서비스 롤 클라이언트 유틸을 분리해",
                "CMS/ERM API 개발을 단순화했습니다.",
              ].join(" "),
            },
            {
              title: "감사 로그",
              description: [
                "auditLogger가 Sentry와 연동되어",
                "모든 핵심 트랜잭션에 대한 추적 로그를 남길 수 있습니다.",
              ].join(" "),
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur"
            >
              <h2 className="text-xl font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6">
          <h3 className="text-lg font-semibold text-slate-900">다음 단계 가이드</h3>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li>`.env`를 `.env.example` 기준으로 작성하고 유효성 검증을 통과시키세요.</li>
            <li>`pnpm lint`와 `pnpm type-check`로 코딩 표준을 확인하세요.</li>
            <li>백로그에 정의된 CMS/ERM 스토리부터 UI · API · 테스트 작업을 시작하세요.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
