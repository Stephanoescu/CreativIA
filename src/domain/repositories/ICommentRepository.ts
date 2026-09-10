// ============================================================
// domain/repositories/ICommentRepository.ts
// Puerto de repositorio para la entidad Comment.
// ============================================================

import type {
  Comment,
  CommentWithAuthor,
  CreateCommentDTO,
  UpdateCommentDTO,
  CommentResourceType,
} from "../entities/Comment";

/**
 * Contrato del repositorio de comentarios colaborativos.
 */
export interface ICommentRepository {
  findById(id: string): Promise<Comment | null>;

  /**
   * Obtiene todos los comentarios de un recurso (documento o imagen),
   * incluyendo los datos del autor y los hilos de respuesta anidados.
   */
  findByResource(
    resourceType: CommentResourceType,
    resourceId: string
  ): Promise<CommentWithAuthor[]>;

  create(data: CreateCommentDTO): Promise<Comment>;

  update(id: string, data: UpdateCommentDTO): Promise<Comment>;

  /**
   * Marca el comentario como resuelto y registra quién lo resolvió.
   */
  resolve(commentId: string, resolvedById: string): Promise<Comment>;

  /** Soft delete: cambia status a 'deleted' */
  delete(id: string): Promise<void>;

  /** Cuenta comentarios abiertos de un recurso (para badges en UI) */
  countOpen(resourceType: CommentResourceType, resourceId: string): Promise<number>;
}

