// ============================================================
// domain/repositories/IDocumentRepository.ts
// Puerto de repositorio para la entidad Document y Version.
// ============================================================

import type {
  Document,
  CreateDocumentDTO,
  UpdateDocumentDTO,
  DocumentStatus,
} from "../entities/Document";
import type { Version, CreateVersionDTO } from "../entities/Version";

/**
 * Opciones de paginación reutilizables.
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Resultado paginado genérico.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Contrato del repositorio de documentos.
 */
export interface IDocumentRepository {
  findById(id: string): Promise<Document | null>;

  findByOrganization(
    organizationId: string,
    options?: PaginationOptions & { status?: DocumentStatus }
  ): Promise<PaginatedResult<Document>>;

  findByAuthor(
    authorId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Document>>;

  create(data: CreateDocumentDTO): Promise<Document>;

  update(id: string, data: UpdateDocumentDTO): Promise<Document>;

  /** Soft delete: cambia status a 'archived' */
  archive(id: string): Promise<void>;

  // --- Control de versiones ---

  /** Crea un snapshot de la versión actual del documento */
  createVersion(data: CreateVersionDTO): Promise<Version>;

  /** Lista todas las versiones de un documento (más reciente primero) */
  getVersionHistory(documentId: string): Promise<Version[]>;

  /** Obtiene una versión específica */
  getVersion(versionId: string): Promise<Version | null>;

  /**
   * Revierte el documento a una versión específica.
   * Internamente crea una nueva versión con el contenido antiguo.
   */
  revertToVersion(documentId: string, versionId: string): Promise<Document>;
}

