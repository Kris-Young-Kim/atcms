import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next.js 16: Turbopack 기본 사용. 빈 설정을 명시해 webpack 구성과의 충돌 경고를 방지합니다.
  turbopack: {},
  experimental: {
    optimizePackageImports: ["@clerk/nextjs", "@supabase/supabase-js"],
  },
};

const sentryConfig = {
  silent: true,
  tunnelRoute: "/monitoring",
};

export default withSentryConfig(nextConfig, sentryConfig);
