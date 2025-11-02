import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@clerk/nextjs", "@supabase/supabase-js"],
  },
};

// TODO: Sentry가 Next.js 15를 공식 지원하면 다시 활성화
// import { withSentryConfig } from "@sentry/nextjs";
// const sentryConfig = { silent: true, tunnelRoute: "/monitoring" };
// export default withSentryConfig(nextConfig, sentryConfig);

export default nextConfig;
