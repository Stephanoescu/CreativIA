// ============================================================
// infrastructure/supabase/supabaseTypes.ts
// Tipos helper para el cliente de Supabase.
// ============================================================

// Re-exportar los tipos de DB para uso en los repositorios
export type { Database } from "./database.types";

/**
 * Tipo del cliente Supabase para los repositorios.
 * Usamos 'any' para el schema interno porque el tipo preciso de
 * createServerClient varía entre versiones de @supabase/ssr y
 * @supabase/supabase-js, causando incompatibilidades de inferencia.
 * La seguridad de tipos se garantiza a través de las interfaces
 * de dominio (IUserRepository, IDocumentRepository, etc.)
 * y los tipos Row/Insert/Update en database.types.ts.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TypedSupabaseClient = any;

