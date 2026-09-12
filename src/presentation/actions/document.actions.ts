// ============================================================
// presentation/actions/document.actions.ts
// Server Actions para documentos: CRUD + versiones + revisión.
// Instancia los repositorios y casos de uso en el servidor.
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { SupabaseDocumentRepository } from "@/infrastructure/repositories/SupabaseDocumentRepository";
import { SupabaseUserRepository } from "@/infrastructure/repositories/SupabaseUserRepository";
import { ManageDocumentUseCase } from "@/application/use-cases/document/ManageDocumentUseCase";
import type { ActionResult } from "./auth.actions";
import type { Document } from "@/domain/entities/Document";
import type { Version } from "@/domain/entities/Version";

// ─── Schemas ────────────────────────────────────────────────

const SaveDocumentSchema = z.object({
  documentId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  content: z.string(),
  tags: z.string().optional(), // JSON string array
  changeDescription: z.string().optional(),
});

const ReviewSchema = z.object({
  documentId: z.string().uuid(),
  approverId: z.string().uuid(),
});

const ApproveRejectSchema = z.object({
  documentId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});

// ─── Helper: crear instancias de repositorios y caso de uso ──

async function buildUseCase() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createSupabaseServerClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  const { createSupabaseAdminClient } = await import("@/infrastructure/supabase/server");
  const supabaseAdmin = (await createSupabaseAdminClient()) as any;

  const documentRepo = new SupabaseDocumentRepository(supabaseAdmin);
  const userRepo = new SupabaseUserRepository(supabaseAdmin);
  const useCase = new ManageDocumentUseCase(documentRepo, userRepo);

  return { useCase, userId: user.id, supabase, supabaseAdmin };
}

// ─── Actions ─────────────────────────────────────────────────

export async function saveDocumentAction(
  formData: FormData
): Promise<ActionResult & { document?: Document }> {
  try {
    const { useCase, userId, supabase, supabaseAdmin } = await buildUseCase();

    // Obtener organización del perfil actual usando Admin client
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!profile) return { success: false, error: "Perfil no encontrado" };

    const validation = SaveDocumentSchema.safeParse({
      documentId: formData.get("documentId") || undefined,
      title: formData.get("title"),
      content: formData.get("content"),
      tags: formData.get("tags") || undefined,
      changeDescription: formData.get("changeDescription") || undefined,
    });

    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message };
    }

    const tags = validation.data.tags
      ? (JSON.parse(validation.data.tags) as string[])
      : [];

    const document = await useCase.saveDocument({
      documentId: validation.data.documentId,
      authorId: userId,
      organizationId: profile.organization_id,
      title: validation.data.title,
      content: validation.data.content,
      tags,
      changeDescription: validation.data.changeDescription,
    });

    revalidatePath("/dashboard/documents");
    revalidatePath(`/dashboard/documents/${document.id}`);

    return { success: true, document };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function submitForReviewAction(
  formData: FormData
): Promise<ActionResult & { document?: Document }> {
  try {
    const { useCase, userId } = await buildUseCase();

    const validation = ReviewSchema.safeParse({
      documentId: formData.get("documentId"),
      approverId: formData.get("approverId"),
    });

    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message };
    }

    const document = await useCase.submitForReview({
      documentId: validation.data.documentId,
      authorId: userId,
      approverId: validation.data.approverId,
    });

    revalidatePath(`/dashboard/documents/${document.id}`);
    return { success: true, document };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function approveRejectDocumentAction(
  formData: FormData
): Promise<ActionResult & { document?: Document }> {
  try {
    const { useCase, userId } = await buildUseCase();

    const validation = ApproveRejectSchema.safeParse({
      documentId: formData.get("documentId"),
      decision: formData.get("decision"),
    });

    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message };
    }

    const document = await useCase.approveOrReject({
      documentId: validation.data.documentId,
      approverId: userId,
      decision: validation.data.decision,
    });

    revalidatePath(`/dashboard/documents/${document.id}`);
    return { success: true, document };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getVersionHistoryAction(
  documentId: string
): Promise<ActionResult & { versions?: Version[] }> {
  try {
    const { useCase } = await buildUseCase();
    const versions = await useCase.getVersionHistory(documentId);
    return { success: true, versions };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function revertVersionAction(
  documentId: string,
  versionId: string
): Promise<ActionResult & { document?: Document }> {
  try {
    const { useCase, userId } = await buildUseCase();
    const document = await useCase.revertVersion(documentId, versionId, userId);
    revalidatePath(`/dashboard/documents/${documentId}`);
    return { success: true, document };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
