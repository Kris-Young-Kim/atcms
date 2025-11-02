import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/config/env";

export async function createSupabaseServerClient() {
  // Next.js 15에서는 동적 API(cookies, headers)를 먼저 호출해야 함
  const cookieStore = await cookies();
  
  const supabaseUrl = env.getClientEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = env.getClientEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
