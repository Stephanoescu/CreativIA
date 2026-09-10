// ============================================================
// infrastructure/repositories/SupabaseCommentRepository.ts
// Implementación concreta de ICommentRepository usando Supabase.
// Soporta hilos anidados y resolución por Approvers.
// ============================================================

import type { TypedSupabaseClient } from "@/infrastructure/supabase/supabaseTypes";
import type { ICommentRepository } from "@/domain/repositories/ICommentRepository";
import type {
  Comment,
  CommentWithAuthor,
  CreateCommentDTO,
  UpdateCommentDTO,
  CommentResourceType,
} from "@/domain/entities/Comment";
import { mapRowToComment } from "@/infrastructure/supabase/mappers";
import { NotFoundError } from "@/domain/errors/DomainErrors";

export class SupabaseCommentRepository implements ICommentRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async findById(id: string): Promise<Comment | null> {
    const { data, error } = await this.supabase
      .from("comments")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapRowToComment(data);
  }

  async findByResource(
    resourceType: CommentResourceType,
    resourceId: string
  ): Promise<CommentWithAuthor[]> {
    // Obtener solo comentarios raíz (sin parent) con datos del autor
    const { data, error } = await this.supabase
      .from("comments")
      .select(
        `
        *,
        author:profiles!comments_author_id_fkey (
          id,
          full_name,
          avatar_url,
          role
        )
      `
      )
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .is("parent_id", null)
      .neq("status", "deleted")
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Error obteniendo comentarios: ${error.message}`);

    const rootComments = data ?? [];

    // Para cada comentario raíz, obtener sus respuestas
    const commentsWithReplies = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rootComments.map(async (comment: any) => {
        const { data: replies } = await this.supabase
          .from("comments")
          .select(
            `
            *,
            author:profiles!comments_author_id_fkey (
              id,
              full_name,
              avatar_url,
              role
            )
          `
          )
          .eq("parent_id", comment.id)
          .neq("status", "deleted")
          .order("created_at", { ascending: true });

        return this.mapToCommentWithAuthor(comment, replies ?? []);
      })
    );

    return commentsWithReplies;
  }

  private mapToCommentWithAuthor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    row: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    replies: any[] = []
  ): CommentWithAuthor {
    return {
      ...mapRowToComment(row),
      author: {
        id: row.author.id,
        fullName: row.author.full_name,
        avatarUrl: row.author.avatar_url,
        role: row.author.role,
      },
      replies: replies.map((r) => this.mapToCommentWithAuthor(r)),
    };
  }

  async create(dto: CreateCommentDTO): Promise<Comment> {
    const { data, error } = await this.supabase
      .from("comments")
      .insert({
        organization_id: dto.organizationId,
        resource_type: dto.resourceType,
        resource_id: dto.resourceId,
        author_id: dto.authorId,
        parent_id: dto.parentId ?? null,
        body: dto.body,
      })
      .select()
      .single();

    if (error || !data)
      throw new Error(`Error creando comentario: ${error?.message}`);

    return mapRowToComment(data);
  }

  async update(id: string, dto: UpdateCommentDTO): Promise<Comment> {
    const updatePayload: Record<string, unknown> = {};
    if (dto.body !== undefined) updatePayload.body = dto.body;
    if (dto.status !== undefined) updatePayload.status = dto.status;
    if (dto.resolvedById !== undefined)
      updatePayload.resolved_by_id = dto.resolvedById;

    const { data, error } = await this.supabase
      .from("comments")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) throw new NotFoundError("Comentario", id);
    return mapRowToComment(data);
  }

  async resolve(commentId: string, resolvedById: string): Promise<Comment> {
    const { data, error } = await this.supabase
      .from("comments")
      .update({
        status: "resolved",
        resolved_by_id: resolvedById,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select()
      .single();

    if (error || !data) throw new NotFoundError("Comentario", commentId);
    return mapRowToComment(data);
  }

  async delete(id: string): Promise<void> {
    // Soft delete: cambia el status a 'deleted'
    const { error } = await this.supabase
      .from("comments")
      .update({ status: "deleted" })
      .eq("id", id);

    if (error) throw new Error(`Error eliminando comentario: ${error.message}`);
  }

  async countOpen(
    resourceType: CommentResourceType,
    resourceId: string
  ): Promise<number> {
    const { count, error } = await this.supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .eq("status", "open");

    if (error) return 0;
    return count ?? 0;
  }
}
