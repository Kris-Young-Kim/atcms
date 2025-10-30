import * as Sentry from "@sentry/nextjs";

import { env } from "./src/config/env";

const dsn = env.server.SENTRY_DSN ?? env.client.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  tracesSampleRate: 0.2,
});
