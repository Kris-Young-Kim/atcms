import { z } from "zod";

const clientSchemaStrict = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  NEXT_PUBLIC_SENTRY_DSN: z.union([z.string().url(), z.literal("")]).optional(),
});

const serverSchemaStrict = z.object({
  CLERK_SECRET_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

const isProduction = process.env.NODE_ENV === "production";
const shouldRelaxValidation = !isProduction && process.env.SKIP_ENV_VALIDATION !== "false";

const clientSchema = shouldRelaxValidation
  ? clientSchemaStrict.partial({ NEXT_PUBLIC_APP_ENV: true })
  : clientSchemaStrict;
const serverSchema = shouldRelaxValidation ? serverSchemaStrict.partial() : serverSchemaStrict;

const clientEnvResult = clientSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

if (!clientEnvResult.success) {
  console.error(
    "[env] 클라이언트 환경 변수 검증 실패",
    clientEnvResult.error.flatten().fieldErrors,
  );
  throw new Error("필수 클라이언트 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.");
}

const serverEnvResult = serverSchema.safeParse({
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
});

if (!serverEnvResult.success) {
  console.error("[env] 서버 환경 변수 검증 실패", serverEnvResult.error.flatten().fieldErrors);
  throw new Error("필수 서버 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.");
}

type StrictClientEnv = z.infer<typeof clientSchemaStrict>;
type StrictServerEnv = z.infer<typeof serverSchemaStrict>;

type ClientEnvRecord = Record<keyof StrictClientEnv, string | undefined> & {
  NEXT_PUBLIC_APP_ENV?: StrictClientEnv["NEXT_PUBLIC_APP_ENV"];
};
type ServerEnvRecord = Record<keyof StrictServerEnv, string | undefined>;

const toRecord = <TKey extends string>(
  data: Record<TKey, unknown>,
): Record<TKey, string | undefined> =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value === undefined ? undefined : String(value),
    ]),
  ) as Record<TKey, string | undefined>;

const clientEnvData = toRecord(clientEnvResult.data as Record<string, unknown>) as ClientEnvRecord;
if (!clientEnvData.NEXT_PUBLIC_APP_ENV) {
  clientEnvData.NEXT_PUBLIC_APP_ENV = "development";
}
const serverEnvData = toRecord(serverEnvResult.data as Record<string, unknown>) as ServerEnvRecord;

const createAccessor = <TKey extends string>(
  scope: "client" | "server",
  source: Record<TKey, string | undefined>,
) =>
  function getEnvValue<TKeyInner extends TKey>(key: TKeyInner): string {
    const value = source[key];
    if (!value) {
      throw new Error(`[env] ${scope} 환경 변수 ${String(key)}가 설정되지 않았습니다.`);
    }
    return value;
  };

export const env = {
  isValidationRelaxed: shouldRelaxValidation,
  client: clientEnvData,
  server: serverEnvData,
  getClientEnv: createAccessor("client", clientEnvData),
  getServerEnv: createAccessor("server", serverEnvData),
};

export type AppEnvironment = StrictClientEnv["NEXT_PUBLIC_APP_ENV"];
