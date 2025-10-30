import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@clerk/nextjs", "@supabase/supabase-js"],
  },
};

const sentryConfig = {
  silent: true,
  tunnelRoute: "/monitoring",
};

export default withSentryConfig(nextConfig, sentryConfig);
