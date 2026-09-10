// ============================================================
// domain/entities/Image.ts
// Imagen generada por IA (Stable Diffusion / Mock).
// Incluye el prompt, estilo, y metadatos de moderación.
// ============================================================

/**
 * Estilos artísticos disponibles para la generación de imágenes.
 * Coinciden con los parámetros de Stable Diffusion en Bedrock.
 */
export type ImageStyle =
  | "anime"
  | "photorealism"
  | "oil-painting"
  | "watercolor"
  | "digital-art"
  | "sketch";

/**
 * Estado del proceso de generación de la imagen.
 */
export type ImageGenerationStatus =
  | "pending"    // En cola para generarse
  | "generating" // Procesando en el servicio de IA
  | "completed"  // Imagen lista y disponible
  | "failed"     // Error en generación
  | "moderated"; // Rechazada por el sistema de moderación

/**
 * Entidad Imagen — refleja la tabla `images` en Supabase.
 * Contiene el prompt, metadatos de generación y la URL de la imagen.
 */
export interface Image {
  id: string;
  organizationId: string;
  authorId: string;         // FK → profiles.id
  prompt: string;           // Prompt original del usuario
  negativePrompt: string | null; // Elementos a excluir de la imagen
  style: ImageStyle;
  width: number;            // Dimensión en píxeles (e.g., 1024)
  height: number;           // Dimensión en píxeles (e.g., 1024)
  storageUrl: string | null; // URL en Supabase Storage (null si no completó)
  thumbnailUrl: string | null;
  status: ImageGenerationStatus;
  moderationPassed: boolean;
  moderationFlags: string[]; // Palabras/categorías que dispararon moderación
  aiProvider: "mock" | "bedrock";
  modelVersion: string;     // e.g., "stable-diffusion-xl-v1" o "mock-v1"
  createdAt: Date;
  updatedAt: Date;
}

export type CreateImageDTO = Pick<
  Image,
  | "organizationId"
  | "authorId"
  | "prompt"
  | "negativePrompt"
  | "style"
  | "width"
  | "height"
>;

export type UpdateImageDTO = Partial<
  Pick<
    Image,
    | "storageUrl"
    | "thumbnailUrl"
    | "status"
    | "moderationPassed"
    | "moderationFlags"
  >
>;

