import * as Sentry from "@sentry/nextjs";

type AuditLogLevel = "info" | "error";

interface AuditLogOptions {
  actorId?: string;
  metadata?: Record<string, unknown>;
  tags?: Record<string, string>;
  error?: unknown;
}

interface AuditLogEntry {
  level: AuditLogLevel;
  action: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
  tags?: Record<string, string>;
  timestamp: string;
}

const logToConsole = (entry: AuditLogEntry, error?: unknown) => {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const payload = {
    ...entry,
    error: error instanceof Error ? error.message : error,
  };

  if (entry.level === "error") {
    console.error("[audit]", payload);
  } else {
    console.info("[audit]", payload);
  }
};

const logToSentry = (entry: AuditLogEntry, error?: unknown) => {
  if (entry.level === "error") {
    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: {
          ...entry.tags,
          audit_action: entry.action,
          audit_level: entry.level,
        },
        extra: entry.metadata,
      });
    } else {
      Sentry.captureMessage(`audit:${entry.action}`, {
        tags: {
          ...entry.tags,
          audit_level: entry.level,
        },
        level: "error",
        extra: {
          ...entry.metadata,
          error,
        },
      });
    }
    return;
  }

  Sentry.captureMessage(`audit:${entry.action}`, {
    tags: {
      ...entry.tags,
      audit_level: entry.level,
    },
    level: "info",
    extra: entry.metadata,
  });
};

function log(level: AuditLogLevel, action: string, options?: AuditLogOptions) {
  const entry: AuditLogEntry = {
    level,
    action,
    actorId: options?.actorId,
    metadata: options?.metadata,
    tags: options?.tags,
    timestamp: new Date().toISOString(),
  };

  logToConsole(entry, options?.error);

  try {
    logToSentry(entry, options?.error);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[audit] Sentry 로깅 실패", error);
    }
  }

  return entry;
}

export const auditLogger = {
  info(action: string, options?: AuditLogOptions) {
    return log("info", action, options);
  },
  error(action: string, options?: AuditLogOptions) {
    return log("error", action, options);
  },
};

export type { AuditLogEntry, AuditLogOptions };
