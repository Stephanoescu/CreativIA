// ============================================================
// infrastructure/repositories/SupabaseImageRepository.ts
// Implementación concreta de IImageRepository usando Supabase.
// ============================================================

import type { TypedSupabaseClient } from "@/infrastructure/supabase/supabaseTypes";
import type { IImageRepository } from "@/domain/repositories/IImageRepository";
import type {
  Image,
  CreateImageDTO,
  UpdateImageDTO,
  ImageGenerationStatus,
} from "@/domain/entities/Image";
import type {
  PaginationOptions,
  PaginatedResult,
} from "@/domain/repositories/IDocumentRepository";
import { mapRowToImage } from "@/infrastructure/supabase/mappers";
import { NotFoundError } from "@/domain/errors/DomainErrors";

export class SupabaseImageRepository implements IImageRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async findById(id: string): Promise<Image | null> {
    const { data, error } = await this.supabase
      .from("images")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapRowToImage(data);
  }

  async findByOrganization(
    organizationId: string,
    options?: PaginationOptions & { status?: ImageGenerationStatus }
  ): Promise<PaginatedResult<Image>> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 24; // Grid de galería
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase
      .from("images")
      .select("*", { count: "exact" })
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`Error obteniendo imágenes: ${error.message}`);

    const total = count ?? 0;
    return {
      data: (data ?? []).map(mapRowToImage),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByAuthor(
    authorId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Image>> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 24;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await this.supabase
      .from("images")
      .select("*", { count: "exact" })
      .eq("author_id", authorId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Error obteniendo imágenes: ${error.message}`);

    const total = count ?? 0;
    return {
      data: (data ?? []).map(mapRowToImage),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async create(dto: CreateImageDTO): Promise<Image> {
    const aiProvider = process.env.NEXT_PUBLIC_AI_PROVIDER === "real"
      ? "bedrock"
      : "mock";

    const { data, error } = await this.supabase
      .from("images")
      .insert({
        organization_id: dto.organizationId,
        author_id: dto.authorId,
        prompt: dto.prompt,
        negative_prompt: dto.negativePrompt ?? null,
        style: dto.style,
        width: dto.width,
        height: dto.height,
        status: "pending",
        moderation_passed: false,
        ai_provider: aiProvider,
        model_version: aiProvider === "mock" ? "mock-v1" : "stable-diffusion-xl-v1",
      })
      .select()
      .single();

    if (error || !data)
      throw new Error(`Error creando imagen: ${error?.message}`);

    return mapRowToImage(data);
  }

  async update(id: string, dto: UpdateImageDTO): Promise<Image> {
    const updatePayload: Record<string, unknown> = {};
    if (dto.storageUrl !== undefined) updatePayload.storage_url = dto.storageUrl;
    if (dto.thumbnailUrl !== undefined) updatePayload.thumbnail_url = dto.thumbnailUrl;
    if (dto.status !== undefined) updatePayload.status = dto.status;
    if (dto.moderationPassed !== undefined) updatePayload.moderation_passed = dto.moderationPassed;
    if (dto.moderationFlags !== undefined) updatePayload.moderation_flags = dto.moderationFlags;

    const { data, error } = await this.supabase
      .from("images")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) throw new NotFoundError("Imagen", id);
    return mapRowToImage(data);
  }

  async delete(id: string): Promise<void> {
    // Primero obtener la imagen para saber su storage_url
    const image = await this.findById(id);
    if (!image) throw new NotFoundError("Imagen", id);

    // Eliminar de Supabase Storage si tiene archivo
    if (image.storageUrl) {
      const path = image.storageUrl.split("/storage/v1/object/public/images/")[1];
      if (path) {
        await this.supabase.storage.from("images").remove([path]);
      }
    }

    // Eliminar el registro de la DB
    const { error } = await this.supabase
      .from("images")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Error eliminando imagen: ${error.message}`);
  }
}
