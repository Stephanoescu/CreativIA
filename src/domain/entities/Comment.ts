// ============================================================
// domain/entities/Comment.ts
// Comentario o nota dentro del flujo creativo colaborativo.
// Puede estar asociado a un documento o a una imagen.
// ============================================================

/**
 * Tipo de recurso al que pertenece el comentario.
 */
export type CommentResourceType = "document" | "image";

/**
 * Estado del comentario en el flujo de revisión.
 */
export type CommentStatus = "open" | "resolved" | "deleted";

/**
 * Entidad Comentario — refleja la tabla `comments` en Supabase.
 * Soporta hilos de respuesta (parentId para sub-comentarios).
 */
export interface Comment {
  id: string;
  organizationId: string;
  resourceType: CommentResourceType;
  resourceId: string;      // ID del documento o imagen
  authorId: string;        // FK → profiles.id
  parentId: string | null; // null = comentario raíz; uuid = respuesta
  body: string;            // Texto del comentario (max 2000 chars)
  status: CommentStatus;
  resolvedById: string | null; // FK → profiles.id (quien resolvió)
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCommentDTO = Pick<
  Comment,
  "organizationId" | "resourceType" | "resourceId" | "authorId" | "body" | "parentId"
>;

export type UpdateCommentDTO = Partial<Pick<Comment, "body" | "status">> & {
  resolvedById?: string;
};

/**
 * Comentario con información del autor expandida (para UI).
 */
export interface CommentWithAuthor extends Comment {
  author: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    role: string;
  };
  replies?: CommentWithAuthor[];
}

