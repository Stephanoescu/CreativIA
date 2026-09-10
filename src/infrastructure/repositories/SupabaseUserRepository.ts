// ============================================================
// infrastructure/repositories/SupabaseUserRepository.ts
// Implementación concreta del IUserRepository usando Supabase.
// ============================================================

import type { TypedSupabaseClient } from "@/infrastructure/supabase/supabaseTypes";
import type {
  IUserRepository,
} from "@/domain/repositories/IUserRepository";
import type {
  User,
  CreateUserDTO,
  UpdateUserDTO,
} from "@/domain/entities/User";
import { mapProfileToUser } from "@/infrastructure/supabase/mappers";
import { NotFoundError } from "@/domain/errors/DomainErrors";

export class SupabaseUserRepository implements IUserRepository {
  constructor(
    private readonly supabase: TypedSupabaseClient
  ) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    // Obtenemos el email desde auth.users via la sesión actual
    const {
      data: { user: authUser },
    } = await this.supabase.auth.getUser();

    return mapProfileToUser({
      ...data,
      email: authUser?.id === id ? authUser.email : undefined,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    // Buscar por email requiere join con auth.users (solo service role)
    // En el cliente anon, buscamos por la sesión actual
    const {
      data: { user: authUser },
    } = await this.supabase.auth.getUser();

    if (!authUser || authUser.email !== email) return null;
    return this.findById(authUser.id);
  }

  async findByOrganization(organizationId: string): Promise<User[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .order("full_name", { ascending: true });

    if (error || !data) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => mapProfileToUser(row));
  }

  async findByRole(organizationId: string, role: string): Promise<User[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("role", role)
      .eq("status", "active");

    if (error || !data) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => mapProfileToUser(row));
  }

  async create(dto: CreateUserDTO): Promise<User> {
    // El perfil se crea automáticamente por el trigger handle_new_user.
    // Esta función actualiza los datos extra después del registro.
    const { data, error } = await this.supabase
      .from("profiles")
      .insert({
        id: crypto.randomUUID(),
        organization_id: dto.organizationId,
        full_name: dto.fullName,
        avatar_url: dto.avatarUrl,
        role: dto.role,
        status: dto.status,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Error creando perfil: ${error?.message}`);
    }

    return mapProfileToUser(data);
  }

  async update(id: string, dto: UpdateUserDTO): Promise<User> {
    const updatePayload: Record<string, unknown> = {};
    if (dto.fullName !== undefined) updatePayload.full_name = dto.fullName;
    if (dto.avatarUrl !== undefined) updatePayload.avatar_url = dto.avatarUrl;
    if (dto.role !== undefined) updatePayload.role = dto.role;
    if (dto.status !== undefined) updatePayload.status = dto.status;

    const { data, error } = await this.supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundError("Usuario", id);
    }

    return mapProfileToUser(data);
  }

  async deactivate(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("profiles")
      .update({ status: "inactive" })
      .eq("id", id);

    if (error) throw new Error(`Error desactivando usuario: ${error.message}`);
  }
}
