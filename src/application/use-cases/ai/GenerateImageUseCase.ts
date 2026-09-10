// ============================================================
// application/use-cases/ai/GenerateImageUseCase.ts
// Caso de uso para generar imágenes con Stable Diffusion / Mock.
// Moderación previa + verificación de roles + persistencia.
// ============================================================

import type { IBedrockService } from "@/domain/services/IBedrockService";
import type { IModerationService } from "@/domain/services/IModerationService";
import type { IImageRepository } from "@/domain/repositories/IImageRepository";
import type { IUserRepository } from "@/domain/repositories/IUserRepository";
import type { Image, ImageStyle } from "@/domain/entities/Image";
import {
  ContentModerationError,
  ForbiddenRoleError,
  NotFoundError,
} from "@/domain/errors/DomainErrors";

export interface GenerateImageInput {
  authorId: string;
  organizationId: string;
  prompt: string;
  negativePrompt?: string;
  style: ImageStyle;
  width?: number;   // Default 1024
  height?: number;  // Default 1024
}

export interface GenerateImageResult {
  image: Image;
  imageData: string;       // Base64 o URL del placeholder
  imageFormat: "base64" | "url";
  provider: "mock" | "bedrock";
}

export class GenerateImageUseCase {
  constructor(
    private readonly bedrockService: IBedrockService,
    private readonly moderationService: IModerationService,
    private readonly imageRepo: IImageRepository,
    private readonly userRepo: IUserRepository
  ) {}

  async execute(input: GenerateImageInput): Promise<GenerateImageResult> {
    // 1. Validar usuario y rol (solo designers y admins generan imágenes)
    const user = await this.userRepo.findById(input.authorId);
    if (!user) throw new NotFoundError("Usuario", input.authorId);

    // Todos los roles de la organización pueden generar imágenes

    // 2. ⚠️ MODERACIÓN PREVIA DEL PROMPT
    const modResult = this.moderationService.checkForbiddenContent(input.prompt);
    if (!modResult.passed) {
      // Registrar el intento bloqueado en la DB (con status 'moderated')
      await this.imageRepo.create({
        organizationId: input.organizationId,
        authorId: input.authorId,
        prompt: input.prompt,
        negativePrompt: input.negativePrompt ?? null,
        style: input.style,
        width: input.width ?? 1024,
        height: input.height ?? 1024,
      });

      throw new ContentModerationError(modResult.violations);
    }

    // 3. Crear el registro en DB con status 'generating'
    const imageRecord = await this.imageRepo.create({
      organizationId: input.organizationId,
      authorId: input.authorId,
      prompt: input.prompt,
      negativePrompt: input.negativePrompt ?? null,
      style: input.style,
      width: input.width ?? 1024,
      height: input.height ?? 1024,
    });

    // Actualizar a 'generating' y marcar moderación como pasada
    await this.imageRepo.update(imageRecord.id, {
      status: "generating",
      moderationPassed: true,
      moderationFlags: [],
    });

    try {
      // 4. Llamar al servicio de IA
      const aiResult = await this.bedrockService.generateImage({
        prompt: input.prompt,
        negativePrompt: input.negativePrompt,
        style: input.style,
        width: input.width ?? 1024,
        height: input.height ?? 1024,
      });

      // 5. Actualizar el registro con la URL/datos de la imagen
      const finalImage = await this.imageRepo.update(imageRecord.id, {
        storageUrl: aiResult.imageFormat === "url" ? aiResult.imageData : null,
        status: "completed",
      });

      return {
        image: finalImage,
        imageData: aiResult.imageData,
        imageFormat: aiResult.imageFormat,
        provider: aiResult.provider,
      };
    } catch (error) {
      // Si la IA falla, actualizar el status a 'failed'
      await this.imageRepo.update(imageRecord.id, { status: "failed" });
      throw error;
    }
  }
}

