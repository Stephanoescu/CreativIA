// ============================================================
// domain/services/IBedrockService.ts
// Puerto (interfaz) del servicio de IA Generativa.
//
// Este es el contrato que tanto MockBedrockService como
// RealBedrockService deben implementar.
// La selección se hace por variable de entorno NEXT_PUBLIC_AI_PROVIDER.
// ============================================================

import type { ImageStyle } from "../entities/Image";

// ─── Text Generation (Claude) ────────────────────────────────

/**
 * Tipos de acción de edición de texto disponibles en el editor.
 */
export type TextEditAction =
  | "summarize"      // Resumir el texto
  | "expand"         // Ampliar y desarrollar
  | "fix-grammar"    // Corregir gramática y ortografía
  | "generate-variations"; // Generar alternativas creativas

export interface TextGenerationRequest {
  action: TextEditAction;
  content: string;    // Texto de entrada del usuario
  context?: string;   // Contexto adicional (título del doc, instrucciones)
  language?: string;  // Idioma de salida (default: "es")
}

export interface TextGenerationResult {
  generatedText: string;
  tokensUsed: number;
  provider: "mock" | "bedrock";
  modelId: string;
}

// ─── Image Generation (Stable Diffusion) ─────────────────────

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  style: ImageStyle;
  width: number;     // Must be multiple of 64; e.g., 512, 768, 1024
  height: number;
  seed?: number;     // Para reproducibilidad (optional)
  cfgScale?: number; // Guidance scale (default: 7)
  steps?: number;    // Inference steps (default: 30)
}

export interface ImageGenerationResult {
  /**
   * En modo mock: URL de una imagen placeholder (placehold.co).
   * En modo real: Base64 encoded PNG o URL de Supabase Storage.
   */
  imageData: string;
  imageFormat: "base64" | "url";
  seed: number;
  provider: "mock" | "bedrock";
  modelId: string;
}

// ─── Content Moderation ───────────────────────────────────────

export interface ModerationRequest {
  content: string;
  contentType: "text" | "image-prompt";
}

export interface ModerationResult {
  passed: boolean;
  flags: string[]; // Lista de categorías o palabras que fallaron
  reason: string | null;
}

// ─── Main Service Interface ───────────────────────────────────

/**
 * Contrato principal del servicio de IA Generativa.
 * Implementado por:
 *  - MockBedrockService (src/infrastructure/ai/MockBedrockService.ts)
 *  - RealBedrockService (src/infrastructure/ai/RealBedrockService.ts)
 */
export interface IBedrockService {
  /**
   * Genera o transforma texto usando Claude.
   * Incluye system prompts con mitigación de sesgos.
   */
  generateText(request: TextGenerationRequest): Promise<TextGenerationResult>;

  /**
   * Genera una imagen usando Stable Diffusion.
   */
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult>;

  /**
   * Modera el contenido antes de enviarlo a la IA.
   * Bloquea prompts con palabras prohibidas o contenido dañino.
   */
  moderateContent(request: ModerationRequest): Promise<ModerationResult>;
}

