// ============================================================
// infrastructure/supabase/server.ts
// Cliente Supabase para Server Components, Route Handlers
// y Server Actions. Lee/escribe cookies a través de next/headers.
// ============================================================

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Crea un cliente Supabase para uso en el servidor.
 * Debe llamarse dentro de un Server Component o Server Action
 * porque necesita acceso a `cookies()`.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll puede fallar en Server Components (solo lectura).
            // El middleware se encarga de refrescar la sesión.
          }
        },
      },
    }
  );
}

import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con SERVICE ROLE para operaciones administrativas
 * que requieren bypassear RLS (ej. triggers, admin actions).
 * ⚠️  NUNCA expongas SUPABASE_SERVICE_ROLE_KEY al cliente.
 */
export async function createSupabaseAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
