// ============================================================
// application/use-cases/ai/EditContentUseCase.ts
// Caso de uso para editar texto con IA (Claude / Mock).
// Aplica moderación ANTES de llamar a la IA.
// ============================================================

import type { IBedrockService, TextEditAction } from "@/domain/services/IBedrockService";
import type { IModerationService } from "@/domain/services/IModerationService";
import type { IDocumentRepository } from "@/domain/repositories/IDocumentRepository";
import type { IUserRepository } from "@/domain/repositories/IUserRepository";
import {
  ContentModerationError,
  ForbiddenRoleError,
  NotFoundError,
} from "@/domain/errors/DomainErrors";

export interface EditContentInput {
  documentId: string;
  authorId: string;
  action: TextEditAction;
  selectedText: string;       // Texto seleccionado en el editor
  fullContent?: string;       // Contexto completo del documento
  language?: string;          // Idioma de salida (default: "es")
}

export interface EditContentResult {
  originalText: string;
  generatedText: string;
  action: TextEditAction;
  tokensUsed: number;
  provider: "mock" | "bedrock";
}

export class EditContentUseCase {
  constructor(
    private readonly bedrockService: IBedrockService,
    private readonly moderationService: IModerationService,
    private readonly documentRepo: IDocumentRepository,
    private readonly userRepo: IUserRepository
  ) {}

  async execute(input: EditContentInput): Promise<EditContentResult> {
    // 1. Validar que el usuario existe y tiene permiso de edición
    const user = await this.userRepo.findById(input.authorId);
    if (!user) throw new NotFoundError("Usuario", input.authorId);

    // Todos los roles de la organización pueden usar la IA

    // 2. Verificar que el documento existe
    const doc = await this.documentRepo.findById(input.documentId);
    if (!doc) throw new NotFoundError("Documento", input.documentId);

    // 3. ⚠️ MODERACIÓN PREVIA — bloquear antes de tocar la IA
    const modResult = this.moderationService.checkForbiddenContent(
      input.selectedText
    );
    if (!modResult.passed) {
      throw new ContentModerationError(modResult.violations);
    }

    // 4. Llamar al servicio de IA con el system prompt de bias mitigation
    const result = await this.bedrockService.generateText({
      action: input.action,
      content: input.selectedText,
      context: input.fullContent,
      language: input.language ?? "es",
    });

    return {
      originalText: input.selectedText,
      generatedText: result.generatedText,
      action: input.action,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
    };
  }
}

