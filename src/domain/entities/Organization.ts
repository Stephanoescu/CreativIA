// ============================================================
// domain/entities/Organization.ts
// Organización (tenant) que agrupa usuarios y recursos.
// Permite múltiples organizaciones dentro del mismo SaaS.
// ============================================================

/**
 * Plan de suscripción de la organización.
 */
export type SubscriptionPlan = "free" | "pro" | "enterprise";

/**
 * Entidad Organización — refleja la tabla `organizations` en Supabase.
 * Actúa como tenant raíz para todos los usuarios y proyectos.
 */
export interface Organization {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier (e.g. "acme-marketing")
  logoUrl: string | null;
  plan: SubscriptionPlan;
  maxMembers: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateOrganizationDTO = Omit<
  Organization,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateOrganizationDTO = Partial<
  Pick<Organization, "name" | "logoUrl" | "plan" | "maxMembers">
>;

