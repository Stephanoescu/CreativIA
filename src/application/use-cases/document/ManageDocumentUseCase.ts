// ============================================================
// application/use-cases/document/ManageDocumentUseCase.ts
// Caso de uso para CRUD de documentos con control de versiones.
// Aplica reglas de negocio: roles, estados, versioning.
// ============================================================

import type { IDocumentRepository } from "@/domain/repositories/IDocumentRepository";
import type { IUserRepository } from "@/domain/repositories/IUserRepository";
import type { Document, CreateDocumentDTO } from "@/domain/entities/Document";
import type { Version } from "@/domain/entities/Version";
import {
  ForbiddenRoleError,
  DocumentLockedError,
  NotFoundError,
} from "@/domain/errors/DomainErrors";

interface SaveDocumentInput {
  documentId?: string;         // Undefined = crear nuevo
  authorId: string;
  organizationId: string;
  title: string;
  content: string;
  tags?: string[];
  changeDescription?: string;
}

interface SubmitForReviewInput {
  documentId: string;
  authorId: string;
  approverId: string;
}

interface ApproveRejectInput {
  documentId: string;
  approverId: string;
  decision: "approved" | "rejected";
}

export class ManageDocumentUseCase {
  constructor(
    private readonly documentRepo: IDocumentRepository,
    private readonly userRepo: IUserRepository
  ) {}

  /**
   * Crea un nuevo documento o guarda una nueva versión del existente.
   * Solo writers, designers y admins pueden crear/editar.
   * Documentos en revisión están bloqueados para el autor.
   */
  async saveDocument(input: SaveDocumentInput): Promise<Document> {
    const author = await this.userRepo.findById(input.authorId);
    if (!author) throw new NotFoundError("Usuario", input.authorId);

    // Todos los usuarios pueden guardar documentos en modo colaborativo

    // ─── Crear nuevo documento ────────────────────────────────
    if (!input.documentId) {
      const dto: CreateDocumentDTO = {
        organizationId: input.organizationId,
        authorId: input.authorId,
        title: input.title,
        content: input.content,
        tags: input.tags ?? [],
      };
      return this.documentRepo.create(dto);
    }

    // ─── Actualizar documento existente ───────────────────────
    const existingDoc = await this.documentRepo.findById(input.documentId);
    if (!existingDoc) throw new NotFoundError("Documento", input.documentId);

    // Los documentos en revisión están bloqueados para el autor (no admin)
    if (
      existingDoc.status === "in_review" &&
      author.role !== "admin" &&
      author.role !== "approver"
    ) {
      throw new DocumentLockedError(input.documentId);
    }

    // Actualizar el documento
    const updated = await this.documentRepo.update(input.documentId, {
      title: input.title,
      content: input.content,
      tags: input.tags,
    });

    // Crear nueva versión en el historial
    const history = await this.documentRepo.getVersionHistory(input.documentId);
    const nextVersionNumber = (history[0]?.versionNumber ?? 0) + 1;

    await this.documentRepo.createVersion({
      documentId: input.documentId,
      authorId: input.authorId,
      versionNumber: nextVersionNumber,
      title: input.title,
      content: input.content,
      changeDescription: input.changeDescription ?? null,
    });

    return updated;
  }

  /**
   * Envía el documento a revisión y asigna un aprobador.
   */
  async submitForReview(input: SubmitForReviewInput): Promise<Document> {
    const doc = await this.documentRepo.findById(input.documentId);
    if (!doc) throw new NotFoundError("Documento", input.documentId);

    // Solo el autor puede enviar a revisión
    if (doc.authorId !== input.authorId) {
      throw new ForbiddenRoleError("autor del documento");
    }

    // Verificar que el aprobador existe (todos pueden aprobar ahora)
    const approver = await this.userRepo.findById(input.approverId);
    if (!approver) {
      throw new Error("Aprobador no encontrado");
    }

    return this.documentRepo.update(input.documentId, {
      status: "in_review",
      approverId: input.approverId,
    });
  }

  /**
   * El aprobador acepta o rechaza un documento.
   */
  async approveOrReject(input: ApproveRejectInput): Promise<Document> {
    const approver = await this.userRepo.findById(input.approverId);
    if (!approver) {
      throw new Error("Aprobador no encontrado");
    }

    const doc = await this.documentRepo.findById(input.documentId);
    if (!doc) throw new NotFoundError("Documento", input.documentId);

    if (doc.status !== "in_review") {
      throw new Error("Solo se pueden aprobar/rechazar documentos en revisión.");
    }

    return this.documentRepo.update(input.documentId, {
      status: input.decision,
    });
  }

  /**
   * Obtiene el historial de versiones completo de un documento.
   */
  async getVersionHistory(documentId: string): Promise<Version[]> {
    return this.documentRepo.getVersionHistory(documentId);
  }

  /**
   * Revierte el documento a una versión anterior.
   * Solo el autor o admins pueden revertir.
   */
  async revertVersion(
    documentId: string,
    versionId: string,
    requesterId: string
  ): Promise<Document> {
    const requester = await this.userRepo.findById(requesterId);
    if (!requester) throw new NotFoundError("Usuario", requesterId);

    const doc = await this.documentRepo.findById(documentId);
    if (!doc) throw new NotFoundError("Documento", documentId);

    if (doc.authorId !== requesterId && requester.role !== "admin") {
      throw new ForbiddenRoleError("autor del documento o admin");
    }

    return this.documentRepo.revertToVersion(documentId, versionId);
  }
}

