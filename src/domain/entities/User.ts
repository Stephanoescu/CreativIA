// ============================================================
// domain/entities/User.ts
// Entidad central del usuario en el sistema CreativIA.
// Representa la identidad, rol y metadata de cada miembro.
// ============================================================

/**
 * Roles disponibles en la plataforma.
 * - designer:   Puede generar y editar imágenes.
 * - writer:     Puede crear y editar documentos de texto.
 * - approver:   Puede revisar, comentar y aprobar contenido.
 * - admin:      Acceso completo a toda la plataforma.
 */
export type UserRole = "designer" | "writer" | "approver" | "admin";

/**
 * Estado de la cuenta del usuario.
 */
export type UserStatus = "active" | "inactive" | "suspended";

/**
 * Entidad Usuario — refleja la tabla `profiles` en Supabase.
 * El `id` corresponde al UUID generado por Supabase Auth.
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO para crear un nuevo usuario (sin campos auto-generados).
 */
export type CreateUserDTO = Omit<User, "id" | "createdAt" | "updatedAt"> & {
  password: string;
};

/**
 * DTO para actualizar datos del perfil (todos los campos opcionales).
 */
export type UpdateUserDTO = Partial<
  Pick<User, "fullName" | "avatarUrl" | "role" | "status">
>;

