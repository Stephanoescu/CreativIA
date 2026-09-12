// ============================================================
// presentation/actions/auth.actions.ts
// Server Actions de autenticación (registro, login, logout).
// ============================================================
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

// ─── Schemas de validación ────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const RegisterSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  organizationId: z.string().uuid("ID de organización inválido"),
  role: z.enum(["designer", "writer", "approver", "admin"]).default("writer"),
});

// ─── Tipo de respuesta estándar ───────────────────────────────

export interface ActionResult {
  success: boolean;
  error?: string;
}

// ─── Login ───────────────────────────────────────────────────

export async function loginAction(
  formData: FormData
): Promise<ActionResult> {
  const validation = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (error) {
    return {
      success: false,
      error: "Credenciales incorrectas. Verifica tu email y contraseña.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// ─── Registro ────────────────────────────────────────────────

export async function registerAction(
  formData: FormData
): Promise<ActionResult> {
  const validation = RegisterSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    organizationId: formData.get("organizationId"),
    role: formData.get("role") ?? "writer",
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
    };
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: validation.data.email,
    password: validation.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: validation.data.fullName,
      organization_id: validation.data.organizationId,
      role: validation.data.role,
    },
  });

  if (error) {
    return {
      success: false,
      error: `Error en el registro: ${error.message}`,
    };
  }

  // El trigger handle_new_user en Supabase creará automáticamente el perfil
  revalidatePath("/", "layout");
  redirect("/auth/login?registered=true");
}

// ─── Logout ──────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

