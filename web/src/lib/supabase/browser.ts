import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/config/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    env.getClientEnv("NEXT_PUBLIC_SUPABASE_URL"),
    env.getClientEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
