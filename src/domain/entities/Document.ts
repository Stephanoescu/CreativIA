// ============================================================
// domain/entities/Document.ts
// Documento de texto editable (artículos, copys, scripts).
// Soporta control de versiones y flujo de aprobación.
// ============================================================

/**
 * Estado del documento en el flujo de trabajo editorial.
 * draft → in_review → approved | rejected → archived
 */
export type DocumentStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "rejected"
  | "archived";

/**
 * Entidad Documento — refleja la tabla `documents` en Supabase.
 * Contiene el contenido actual y metadatos del proceso editorial.
 */
export interface Document {
  id: string;
  organizationId: string;
  authorId: string;       // FK → profiles.id
  approverId: string | null; // FK → profiles.id (rol approver)
  title: string;
  content: string;        // Texto plano / Markdown
  status: DocumentStatus;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateDocumentDTO = Pick<
  Document,
  "organizationId" | "authorId" | "title" | "content" | "tags"
>;

export type UpdateDocumentDTO = Partial<
  Pick<Document, "title" | "content" | "status" | "tags" | "approverId">
>;

