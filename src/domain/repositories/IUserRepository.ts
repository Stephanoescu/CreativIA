// ============================================================
// domain/repositories/IUserRepository.ts
// Puerto de repositorio para la entidad User.
// Define el contrato que la capa de infraestructura debe cumplir.
// ============================================================

import type { User, CreateUserDTO, UpdateUserDTO } from "../entities/User";

/**
 * Contrato del repositorio de usuarios.
 * La implementación concreta vive en infrastructure/repositories/
 */
export interface IUserRepository {
  /** Obtiene un usuario por su UUID de Supabase Auth */
  findById(id: string): Promise<User | null>;

  /** Obtiene un usuario por su email */
  findByEmail(email: string): Promise<User | null>;

  /** Lista todos los usuarios de una organización */
  findByOrganization(organizationId: string): Promise<User[]>;

  /** Lista usuarios de una organización filtrados por rol */
  findByRole(organizationId: string, role: string): Promise<User[]>;

  /** Crea el perfil del usuario (llamado post-registro en Supabase Auth) */
  create(data: CreateUserDTO): Promise<User>;

  /** Actualiza datos del perfil del usuario */
  update(id: string, data: UpdateUserDTO): Promise<User>;

  /** Desactiva la cuenta (soft delete) */
  deactivate(id: string): Promise<void>;
}

