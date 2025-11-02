import * as Sentry from "@sentry/nextjs";
import { createClient } from "@supabase/supabase-js";

import { env } from "@/config/env";

/**
 * 감사 로그 레벨
 */
type AuditLogLevel = "info" | "warn" | "error";

/**
 * 감사 로그 옵션
 */
interface AuditLogOptions {
  /** 실행자 ID (Clerk User ID) */
  actorId?: string;

  /** 추가 메타데이터 */
  metadata?: Record<string, unknown>;

  /** 분류 태그 */
  tags?: Record<string, string>;

  /** 에러 객체 (에러 발생 시) */
  error?: unknown;
}

/**
 * 감사 로그 엔트리
 */
interface AuditLogEntry {
  /** 로그 레벨 */
  level: AuditLogLevel;

  /** 작업 이름 (예: "client_created", "equipment_status_updated") */
  action: string;

  /** 실행자 ID */
  actorId?: string;

  /** 추가 메타데이터 */
  metadata?: Record<string, unknown>;

  /** 분류 태그 */
  tags?: Record<string, string>;

  /** 타임스탬프 (ISO 8601 형식) */
  timestamp: string;
}

/**
 * 콘솔에 감사 로그를 출력합니다.
 *
 * 테스트 환경에서는 로그를 출력하지 않습니다.
 *
 * @param {AuditLogEntry} entry - 감사 로그 엔트리
 * @param {unknown} [error] - 에러 객체 (있는 경우)
 */
const logToConsole = (entry: AuditLogEntry, error?: unknown) => {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  // entry 객체에서 undefined 값 제거
  const payload: Record<string, unknown> = {
    level: entry.level,
    action: entry.action,
    timestamp: entry.timestamp,
  };

  if (entry.actorId) {
    payload.actorId = entry.actorId;
  }

  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    payload.metadata = entry.metadata;
  }

  if (entry.tags && Object.keys(entry.tags).length > 0) {
    payload.tags = entry.tags;
  }

  if (error) {
    payload.error = error instanceof Error ? error.message : String(error);
  }

  // payload가 비어있지 않은 경우에만 로그 출력
  if (Object.keys(payload).length === 0) {
    return;
  }

  if (entry.level === "error") {
    console.error("[audit]", payload);
  } else if (entry.level === "warn") {
    console.warn("[audit]", payload);
  } else if (process.env.NODE_ENV === "development") {
    // 개발 환경에서만 정보 로그 출력
    console.warn("[audit]", payload);
  }
};

/**
 * Supabase 데이터베이스에 감사 로그를 저장합니다.
 *
 * 비동기로 실행되며, 실패해도 예외를 던지지 않습니다 (fire-and-forget).
 * 환경 변수가 설정되지 않은 경우 경고만 출력하고 건너뜁니다.
 *
 * @param {AuditLogEntry} entry - 감사 로그 엔트리
 * @param {unknown} [error] - 에러 객체 (있는 경우)
 */
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
      // 개발 환경에서만 경고 출력 (프로덕션에서는 조용히 무시)
      if (process.env.NODE_ENV === "development") {
        console.warn("[audit] Supabase insert 실패:", insertError);
      }
    }
  } catch (err) {
    // 개발 환경에서만 경고 출력 (프로덕션에서는 조용히 무시)
    if (process.env.NODE_ENV === "development") {
      console.warn("[audit] Supabase 로깅 중 예외:", err);
    }
  }
};

/**
 * Sentry에 감사 로그를 전송합니다.
 *
 * 현재는 비활성화 상태입니다.
 * Sentry가 Next.js 16을 지원하면 다시 활성화할 예정입니다.
 *
 * @param {AuditLogEntry} entry - 감사 로그 엔트리
 * @param {unknown} [error] - 에러 객체 (있는 경우)
 */
const logToSentry = (entry: AuditLogEntry, error?: unknown) => {
  // Sentry는 현재 비활성화 상태이므로 조용히 건너뜁니다.
  // TODO: Sentry가 Next.js 16을 지원하면 다시 활성화
  if (process.env.NODE_ENV === "development") {
    console.warn("[audit] Sentry 로깅 건너뜀 (비활성화 상태)");
  }
};

/**
 * 감사 로그를 기록합니다.
 *
 * 콘솔, Supabase, Sentry(비활성화)에 로그를 기록합니다.
 *
 * @param {AuditLogLevel} level - 로그 레벨
 * @param {string} action - 작업 이름
 * @param {AuditLogOptions} [options] - 로그 옵션
 * @returns {AuditLogEntry} 생성된 로그 엔트리
 */
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
    // 개발 환경에서만 경고 출력 (프로덕션에서는 조용히 무시)
    if (process.env.NODE_ENV === "development") {
      console.warn("[audit] Supabase 로깅 실패:", err);
    }
  });

  // Sentry는 현재 비활성화 상태
  try {
    logToSentry(entry, options?.error);
  } catch (error) {
    // 조용히 무시
  }

  return entry;
}

/**
 * 감사 로거 유틸리티
 *
 * 모든 중요한 작업(CRUD, 상태 변경 등)을 기록합니다.
 *
 * @example
 * ```typescript
 * // 정보 로그
 * auditLogger.info("client_created", {
 *   actorId: userId,
 *   metadata: { clientId: "uuid", clientName: "홍길동" },
 *   tags: { module: "cms", action_type: "create" }
 * });
 *
 * // 에러 로그
 * auditLogger.error("client_create_failed", {
 *   actorId: userId,
 *   metadata: { error: "Database connection failed" },
 *   error: new Error("Connection timeout")
 * });
 * ```
 */
export const auditLogger = {
  /**
   * 정보 레벨 로그를 기록합니다.
   *
   * @param {string} action - 작업 이름
   * @param {AuditLogOptions} [options] - 로그 옵션
   * @returns {AuditLogEntry} 생성된 로그 엔트리
   */
  info(action: string, options?: AuditLogOptions) {
    return log("info", action, options);
  },

  /**
   * 경고 레벨 로그를 기록합니다.
   *
   * @param {string} action - 작업 이름
   * @param {AuditLogOptions} [options] - 로그 옵션
   * @returns {AuditLogEntry} 생성된 로그 엔트리
   */
  warn(action: string, options?: AuditLogOptions) {
    return log("warn", action, options);
  },

  /**
   * 에러 레벨 로그를 기록합니다.
   *
   * @param {string} action - 작업 이름
   * @param {AuditLogOptions} [options] - 로그 옵션
   * @returns {AuditLogEntry} 생성된 로그 엔트리
   */
  error(action: string, options?: AuditLogOptions) {
    return log("error", action, options);
  },
};

export type { AuditLogEntry, AuditLogOptions };
