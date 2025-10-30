import { createClient } from "@supabase/supabase-js";

import { env } from "@/config/env";

export function createSupabaseServiceRoleClient() {
  return createClient(
    env.getClientEnv("NEXT_PUBLIC_SUPABASE_URL"),
    env.getServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
      },
    },
  );
}
