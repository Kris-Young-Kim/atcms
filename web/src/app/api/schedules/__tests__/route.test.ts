import type { POST as PostHandler } from "@/app/api/schedules/route";
import { ReadableStream, TransformStream, WritableStream } from "stream/web";
import { TextDecoder, TextEncoder } from "util";

if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = TextDecoder;
}
if (typeof globalThis.ReadableStream === "undefined") {
  globalThis.ReadableStream = ReadableStream;
}
if (typeof globalThis.WritableStream === "undefined") {
  globalThis.WritableStream = WritableStream;
}
if (typeof globalThis.TransformStream === "undefined") {
  globalThis.TransformStream = TransformStream;
}

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: jest.fn(),
}));

jest.mock("@/lib/logger/auditLogger", () => ({
  auditLogger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const { auth } = jest.requireMock("@clerk/nextjs/server");
const { createSupabaseServerClient } = jest.requireMock("@/lib/supabase/server");

describe("/api/schedules POST", () => {
  let POST: PostHandler;

  const createJsonRequest = (body: unknown) =>
    ({
      json: async () => body,
      headers: {
        get: (key: string) => (key.toLowerCase() === "content-type" ? "application/json" : null),
      },
    }) as unknown as Request;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    const EdgeFetch = await import("next/dist/compiled/@edge-runtime/primitives/fetch");
    const edgeGlobal = globalThis as typeof globalThis & {
      Request: typeof EdgeFetch.Request;
      Response: typeof EdgeFetch.Response;
      Headers: typeof EdgeFetch.Headers;
    };

    if (!edgeGlobal.Request) {
      edgeGlobal.Request = EdgeFetch.Request;
    }
    if (!edgeGlobal.Response) {
      edgeGlobal.Response = EdgeFetch.Response;
    }
    if (!edgeGlobal.Headers) {
      edgeGlobal.Headers = EdgeFetch.Headers;
    }

    const scheduleModule = await import("@/app/api/schedules/route");
    POST = scheduleModule.POST;
  });

  it("401 응답: 인증 정보가 없을 때", async () => {
    auth.mockResolvedValue({ userId: null });

    const response = await POST(createJsonRequest({}));

    expect(response.status).toBe(401);
  });

  it("400 응답: 반복 일정인데 recurrence_rule 누락", async () => {
    auth.mockResolvedValue({
      userId: "user_1",
      sessionClaims: { metadata: { role: "admin" } },
    });

    const response = await POST(
      createJsonRequest({
        schedule_type: "consultation",
        title: "반복 일정",
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        is_recurring: true,
      }),
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Validation failed");
  });

  it("201 응답: 반복 일정 템플릿 생성 성공", async () => {
    auth.mockResolvedValue({
      userId: "user_1",
      sessionClaims: { metadata: { role: "admin" } },
    });

    let insertedPayload: Record<string, unknown> | null = null;

    const mockSupabaseClient = {
      from: jest.fn((table: string) => {
        if (table === "schedules") {
          return {
            insert: (payload: Record<string, unknown>) => {
              insertedPayload = payload;
              return {
                select: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        id: "schedule_123",
                        ...payload,
                      },
                      error: null,
                    }),
                }),
              };
            },
          };
        }

        // 기본 mock: 존재 여부 확인 시 사용
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { id: "dummy" } }),
            }),
          }),
        };
      }),
    };

    createSupabaseServerClient.mockResolvedValue(mockSupabaseClient);

    const payload = {
      schedule_type: "consultation",
      title: "주간 상담 템플릿",
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      is_recurring: true,
      recurrence_rule: "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO",
      recurrence_exception_dates: [],
    };

    const response = await POST(createJsonRequest(payload));

    expect(response.status).toBe(201);
    const json = await response.json();

    expect(json.id).toBe("schedule_123");
    expect(insertedPayload).not.toBeNull();
    expect(insertedPayload?.is_recurring).toBe(true);
    expect(insertedPayload?.recurrence_rule).toBe(payload.recurrence_rule);
    expect(insertedPayload?.recurrence_parent_id).toBeUndefined();
  });
});
