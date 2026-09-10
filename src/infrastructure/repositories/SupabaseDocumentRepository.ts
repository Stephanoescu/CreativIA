// ============================================================
// infrastructure/repositories/SupabaseDocumentRepository.ts
// Implementación concreta de IDocumentRepository usando Supabase.
// Incluye control de versiones completo.
// ============================================================

import type { TypedSupabaseClient } from "@/infrastructure/supabase/supabaseTypes";
import type {
  IDocumentRepository,
  PaginationOptions,
  PaginatedResult,
} from "@/domain/repositories/IDocumentRepository";
import type { Document, CreateDocumentDTO, UpdateDocumentDTO, DocumentStatus } from "@/domain/entities/Document";
import type { Version, CreateVersionDTO } from "@/domain/entities/Version";
import { mapRowToDocument, mapRowToVersion } from "@/infrastructure/supabase/mappers";
import { NotFoundError } from "@/domain/errors/DomainErrors";

export class SupabaseDocumentRepository implements IDocumentRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async findById(id: string): Promise<Document | null> {
    const { data, error } = await this.supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapRowToDocument(data);
  }

  async findByOrganization(
    organizationId: string,
    options?: PaginationOptions & { status?: DocumentStatus }
  ): Promise<PaginatedResult<Document>> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase
      .from("documents")
      .select("*", { count: "exact" })
      .eq("organization_id", organizationId)
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`Error obteniendo documentos: ${error.message}`);

    const total = count ?? 0;
    return {
      data: (data ?? []).map(mapRowToDocument),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByAuthor(
    authorId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Document>> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await this.supabase
      .from("documents")
      .select("*", { count: "exact" })
      .eq("author_id", authorId)
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Error obteniendo documentos: ${error.message}`);

    const total = count ?? 0;
    return {
      data: (data ?? []).map(mapRowToDocument),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async create(dto: CreateDocumentDTO): Promise<Document> {
    const { data, error } = await this.supabase
      .from("documents")
      .insert({
        organization_id: dto.organizationId,
        author_id: dto.authorId,
        title: dto.title,
        content: dto.content,
        tags: dto.tags,
      })
      .select()
      .single();

    if (error || !data)
      throw new Error(`Error creando documento: ${error?.message}`);

    // Crear la versión inicial (v1)
    await this.createVersion({
      documentId: data.id,
      authorId: dto.authorId,
      versionNumber: 1,
      title: dto.title,
      content: dto.content,
      changeDescription: "Versión inicial",
    });

    return mapRowToDocument(data);
  }

  async update(id: string, dto: UpdateDocumentDTO): Promise<Document> {
    const updatePayload: Record<string, unknown> = {};
    if (dto.title !== undefined) updatePayload.title = dto.title;
    if (dto.content !== undefined) updatePayload.content = dto.content;
    if (dto.status !== undefined) updatePayload.status = dto.status;
    if (dto.tags !== undefined) updatePayload.tags = dto.tags;
    if (dto.approverId !== undefined) updatePayload.approver_id = dto.approverId;

    const { data, error } = await this.supabase
      .from("documents")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) throw new NotFoundError("Documento", id);
    return mapRowToDocument(data);
  }

  async archive(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("documents")
      .update({ status: "archived" })
      .eq("id", id);

    if (error) throw new Error(`Error archivando documento: ${error.message}`);
  }

  // ─── Control de Versiones ─────────────────────────────────

  async createVersion(dto: CreateVersionDTO): Promise<Version> {
    const { data, error } = await this.supabase
      .from("document_versions")
      .insert({
        document_id: dto.documentId,
        author_id: dto.authorId,
        version_number: dto.versionNumber,
        title: dto.title,
        content: dto.content,
        change_description: dto.changeDescription,
      })
      .select()
      .single();

    if (error || !data)
      throw new Error(`Error creando versión: ${error?.message}`);

    return mapRowToVersion(data);
  }

  async getVersionHistory(documentId: string): Promise<Version[]> {
    const { data, error } = await this.supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false });

    if (error) throw new Error(`Error obteniendo historial: ${error.message}`);
    return (data ?? []).map(mapRowToVersion);
  }

  async getVersion(versionId: string): Promise<Version | null> {
    const { data, error } = await this.supabase
      .from("document_versions")
      .select("*")
      .eq("id", versionId)
      .single();

    if (error || !data) return null;
    return mapRowToVersion(data);
  }

  async revertToVersion(documentId: string, versionId: string): Promise<Document> {
    // 1. Obtener la versión objetivo
    const version = await this.getVersion(versionId);
    if (!version) throw new NotFoundError("Versión", versionId);

    // 2. Calcular el siguiente número de versión
    const history = await this.getVersionHistory(documentId);
    const nextVersionNumber = (history[0]?.versionNumber ?? 0) + 1;

    // 3. Obtener quién está haciendo el revert (autor del doc)
    const doc = await this.findById(documentId);
    if (!doc) throw new NotFoundError("Documento", documentId);

    // 4. Actualizar el documento con el contenido de la versión antigua
    const updated = await this.update(documentId, {
      title: version.title,
      content: version.content,
    });

    // 5. Crear una nueva versión que documenta el revert
    await this.createVersion({
      documentId,
      authorId: doc.authorId,
      versionNumber: nextVersionNumber,
      title: version.title,
      content: version.content,
      changeDescription: `Revertido a la versión ${version.versionNumber}`,
    });

    return updated;
  }
}
