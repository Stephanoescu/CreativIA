// ============================================================
// domain/repositories/IImageRepository.ts
// Puerto de repositorio para la entidad Image.
// ============================================================

import type {
  Image,
  CreateImageDTO,
  UpdateImageDTO,
  ImageGenerationStatus,
} from "../entities/Image";
import type { PaginationOptions, PaginatedResult } from "./IDocumentRepository";

/**
 * Contrato del repositorio de imágenes generadas por IA.
 */
export interface IImageRepository {
  findById(id: string): Promise<Image | null>;

  findByOrganization(
    organizationId: string,
    options?: PaginationOptions & { status?: ImageGenerationStatus }
  ): Promise<PaginatedResult<Image>>;

  findByAuthor(
    authorId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Image>>;

  create(data: CreateImageDTO): Promise<Image>;

  /**
   * Actualiza el estado y/o URL de la imagen una vez que
   * el proceso de generación (async) ha terminado.
   */
  update(id: string, data: UpdateImageDTO): Promise<Image>;

  /** Elimina la imagen y su archivo en Supabase Storage */
  delete(id: string): Promise<void>;
}

