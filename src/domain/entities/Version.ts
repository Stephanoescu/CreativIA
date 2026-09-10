// ============================================================
// domain/entities/Version.ts
// Snapshot inmutable de un documento en un momento dado.
// Permite revertir a cualquier versión anterior.
// ============================================================

/**
 * Entidad Versión — refleja la tabla `document_versions` en Supabase.
 * Cada vez que se guarda un documento, se crea una nueva versión.
 * Las versiones son inmutables una vez creadas.
 */
export interface Version {
  id: string;
  documentId: string;    // FK → documents.id
  authorId: string;      // FK → profiles.id (quien hizo el cambio)
  versionNumber: number; // Número secuencial (1, 2, 3...)
  title: string;         // Snapshot del título en este momento
  content: string;       // Snapshot del contenido en este momento
  changeDescription: string | null; // Nota opcional sobre qué cambió
  createdAt: Date;       // Inmutable: momento exacto del snapshot
}

export type CreateVersionDTO = Omit<Version, "id" | "createdAt">;

/**
 * Resultado de una operación de reversión de versión.
 */
export interface RevertVersionResult {
  documentId: string;
  revertedToVersion: number;
  newVersion: Version;
}

