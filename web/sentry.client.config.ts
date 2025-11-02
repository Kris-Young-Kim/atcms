import * as Sentry from "@sentry/nextjs";

import { env } from "./src/config/env";

const dsn = env.client.NEXT_PUBLIC_SENTRY_DSN;
const appEnv = env.client.NEXT_PUBLIC_APP_ENV ?? "development";

Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  tracesSampleRate: appEnv === "production" ? 0.2 : 0.05,
  replaysSessionSampleRate: appEnv === "production" ? 0.05 : 0,
  replaysOnErrorSampleRate: 1.0,
  // 성능 모니터링 활성화
  enableTracing: true,
  // Web Vitals 자동 수집 활성화
  integrations: [
    Sentry.browserTracingIntegration({
      // Core Web Vitals 자동 수집
      enableInp: true,
      enableLongTask: true,
    }),
  ],
});
