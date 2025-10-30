import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/config/env";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    env.getClientEnv("NEXT_PUBLIC_SUPABASE_URL"),
    env.getClientEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options) => {
          cookieStore.set({ name, value, ...options });
        },
        remove: (name: string, options) => {
          cookieStore.delete({ name, ...options });
        },
      },
    },
  );
}
