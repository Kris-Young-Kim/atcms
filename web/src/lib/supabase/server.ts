import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/config/env";

export function createSupabaseServerClient() {
  const supabaseUrl = env.getClientEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = env.getClientEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async get(name) {
        const store = await cookies();
        return store.get(name)?.value ?? null;
      },
    },
  });
}
