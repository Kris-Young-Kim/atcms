import * as Sentry from "@sentry/nextjs";

import { env } from "./src/config/env";

const dsn = env.server.SENTRY_DSN ?? env.client.NEXT_PUBLIC_SENTRY_DSN;
const appEnv = env.client.NEXT_PUBLIC_APP_ENV ?? "development";

Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  tracesSampleRate: appEnv === "production" ? 0.2 : 0.05,
});
