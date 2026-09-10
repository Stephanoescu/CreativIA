// ============================================================
// infrastructure/supabase/client.ts
// Cliente Supabase para componentes del lado del CLIENTE (browser).
// Usa createBrowserClient de @supabase/ssr para manejar cookies.
// ============================================================

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Singleton del cliente Supabase para el browser.
 * Úsalo en Client Components ("use client").
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

