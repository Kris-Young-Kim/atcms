import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next.js 16: Turbopack 기본 사용. 빈 설정을 명시해 webpack 구성과의 충돌 경고를 방지합니다.
  turbopack: {},
  experimental: {
    optimizePackageImports: ["@clerk/nextjs", "@supabase/supabase-js"],
  },
};

// TODO: Sentry가 Next.js 16을 공식 지원하면 다시 활성화
// import { withSentryConfig } from "@sentry/nextjs";
// const sentryConfig = { silent: true, tunnelRoute: "/monitoring" };
// export default withSentryConfig(nextConfig, sentryConfig);

export default nextConfig;
