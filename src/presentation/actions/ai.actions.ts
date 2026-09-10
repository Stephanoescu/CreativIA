"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { SupabaseDocumentRepository } from "@/infrastructure/repositories/SupabaseDocumentRepository";
import { SupabaseUserRepository } from "@/infrastructure/repositories/SupabaseUserRepository";
import { EditContentUseCase } from "@/application/use-cases/ai/EditContentUseCase";
import { getBedrockService } from "@/infrastructure/ai/bedrockServiceFactory";
import { ModerationService } from "@/infrastructure/ai/ModerationService";
import type { ActionResult } from "./auth.actions";
import type { EditContentResult } from "@/application/use-cases/ai/EditContentUseCase";

const EditContentSchema = z.object({
  documentId: z.string().uuid(),
  text: z.string().min(1),
  action: z.enum(["summarize", "expand", "fix-grammar", "generate-variations"]),
});

export async function editContentAction(
  formData: FormData
): Promise<ActionResult & { result?: EditContentResult }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createSupabaseServerClient()) as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const validation = EditContentSchema.safeParse({
      documentId: formData.get("documentId"),
      text: formData.get("text"),
      action: formData.get("action"),
    });

    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message };
    }

    const docRepo = new SupabaseDocumentRepository(supabase);
    const userRepo = new SupabaseUserRepository(supabase);
    const bedrockService = getBedrockService();
    const moderationService = new ModerationService();

    const useCase = new EditContentUseCase(
      bedrockService,
      moderationService,
      docRepo,
      userRepo
    );

    const result = await useCase.execute({
      authorId: user.id,
      documentId: validation.data.documentId,
      selectedText: validation.data.text,
      action: validation.data.action,
    });

    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al procesar contenido con IA",
    };
  }
}
