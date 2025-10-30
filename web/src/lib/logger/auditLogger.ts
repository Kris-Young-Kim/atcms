import * as Sentry from "@sentry/nextjs";
import { createClient } from "@supabase/supabase-js";

import { env } from "@/config/env";

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

const logToSupabase = async (entry: AuditLogEntry, error?: unknown) => {
  try {
    // Supabase 클라이언트는 서버/브라우저 양쪽에서 사용 가능하도록 설정
    const supabaseUrl = env.client.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.client.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("[audit] Supabase 환경 변수가 설정되지 않아 DB 로깅을 건너뜁니다.");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = {
      actor_id: entry.actorId || null,
      action: entry.action,
      metadata: {
        ...entry.metadata,
        level: entry.level,
        ...(error ? { error: error instanceof Error ? error.message : String(error) } : {}),
      },
      tags: entry.tags || {},
    };

    const { error: insertError } = await supabase.from("audit_logs").insert(payload);

    if (insertError) {
      console.error("[audit] Supabase insert 실패:", insertError);
    }
  } catch (err) {
    console.error("[audit] Supabase 로깅 중 예외:", err);
  }
};

const logToSentry = (entry: AuditLogEntry, error?: unknown) => {
  // Sentry는 현재 비활성화 상태이므로 조용히 건너뜁니다.
  // TODO: Sentry가 Next.js 16을 지원하면 다시 활성화
  if (process.env.NODE_ENV !== "production") {
    console.debug("[audit] Sentry 로깅 건너뜀 (비활성화 상태)");
  }
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

  // Supabase에 비동기 로깅 (fire-and-forget)
  logToSupabase(entry, options?.error).catch((err) => {
    console.error("[audit] Supabase 로깅 실패:", err);
  });

  // Sentry는 현재 비활성화 상태
  try {
    logToSentry(entry, options?.error);
  } catch (error) {
    // 조용히 무시
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
