// ============================================================
// presentation/actions/image.actions.ts
// Server Actions para generación de imágenes con IA.
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { SupabaseImageRepository } from "@/infrastructure/repositories/SupabaseImageRepository";
import { SupabaseUserRepository } from "@/infrastructure/repositories/SupabaseUserRepository";
import { GenerateImageUseCase } from "@/application/use-cases/ai/GenerateImageUseCase";
import { getBedrockService } from "@/infrastructure/ai/bedrockServiceFactory";
import { ModerationService } from "@/infrastructure/ai/ModerationService";
import type { ActionResult } from "./auth.actions";
import type { Image } from "@/domain/entities/Image";

const GenerateImageSchema = z.object({
  prompt: z.string().min(3, "El prompt debe tener al menos 3 caracteres").max(1000),
  negativePrompt: z.string().max(500).optional(),
  style: z.enum(["anime", "photorealism", "oil-painting", "watercolor", "digital-art", "sketch"]),
  width: z.coerce.number().int().min(512).max(1024).default(1024),
  height: z.coerce.number().int().min(512).max(1024).default(1024),
});

export async function generateImageAction(
  formData: FormData
): Promise<ActionResult & { image?: Image; imageData?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createSupabaseServerClient()) as any;
    const { createSupabaseAdminClient } = await import("@/infrastructure/supabase/server");
    const supabaseAdmin = (await createSupabaseAdminClient()) as any;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    // Fetch profile using Admin client to bypass RLS issues or caching
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) return { success: false, error: "Perfil no encontrado" };

    const validation = GenerateImageSchema.safeParse({
      prompt: formData.get("prompt"),
      negativePrompt: formData.get("negativePrompt") || undefined,
      style: formData.get("style"),
      width: formData.get("width") ? Number(formData.get("width")) : 1024,
      height: formData.get("height") ? Number(formData.get("height")) : 1024,
    });

    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message };
    }

    // Use Admin client for Repositories to bypass database RLS insert restrictions (since we flattened roles)
    const imageRepo = new SupabaseImageRepository(supabaseAdmin);
    const userRepo = new SupabaseUserRepository(supabaseAdmin);
    const bedrockService = getBedrockService();
    const moderationService = new ModerationService();

    const useCase = new GenerateImageUseCase(
      bedrockService,
      moderationService,
      imageRepo,
      userRepo
    );

    const result = await useCase.execute({
      authorId: user.id,
      organizationId: profile.organization_id,
      ...validation.data,
    });

    revalidatePath("/dashboard/gallery");

    return {
      success: true,
      image: result.image,
      imageData: result.imageData,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error generando imagen",
    };
  }
}

export async function deleteImageAction(
  imageId: string
): Promise<ActionResult> {
  try {
    const { createSupabaseAdminClient } = await import("@/infrastructure/supabase/server");
    const supabaseAdmin = (await createSupabaseAdminClient()) as any;
    const imageRepo = new SupabaseImageRepository(supabaseAdmin);
    await imageRepo.delete(imageId);
    revalidatePath("/dashboard/gallery");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error eliminando imagen",
    };
  }
}
