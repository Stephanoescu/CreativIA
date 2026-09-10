// ============================================================
// infrastructure/supabase/mappers.ts
// Funciones puras para convertir filas de Supabase (snake_case)
// a entidades del dominio (camelCase) y viceversa.
// ============================================================

import type { Database } from "./database.types";
import type { User } from "@/domain/entities/User";
import type { Document } from "@/domain/entities/Document";
import type { Version } from "@/domain/entities/Version";
import type { Image } from "@/domain/entities/Image";
import type { Comment } from "@/domain/entities/Comment";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
type VersionRow = Database["public"]["Tables"]["document_versions"]["Row"];
type ImageRow = Database["public"]["Tables"]["images"]["Row"];
type CommentRow = Database["public"]["Tables"]["comments"]["Row"];

// ─── User / Profile ───────────────────────────────────────────

export function mapProfileToUser(
  row: ProfileRow & { email?: string }
): User {
  return {
    id: row.id,
    email: row.email ?? "",
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    status: row.status,
    organizationId: row.organization_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ─── Document ────────────────────────────────────────────────

export function mapRowToDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    organizationId: row.organization_id,
    authorId: row.author_id,
    approverId: row.approver_id,
    title: row.title,
    content: row.content,
    status: row.status,
    tags: row.tags,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ─── Version ─────────────────────────────────────────────────

export function mapRowToVersion(row: VersionRow): Version {
  return {
    id: row.id,
    documentId: row.document_id,
    authorId: row.author_id,
    versionNumber: row.version_number,
    title: row.title,
    content: row.content,
    changeDescription: row.change_description,
    createdAt: new Date(row.created_at),
  };
}

// ─── Image ───────────────────────────────────────────────────

export function mapRowToImage(row: ImageRow): Image {
  return {
    id: row.id,
    organizationId: row.organization_id,
    authorId: row.author_id,
    prompt: row.prompt,
    negativePrompt: row.negative_prompt,
    style: row.style,
    width: row.width,
    height: row.height,
    storageUrl: row.storage_url,
    thumbnailUrl: row.thumbnail_url,
    status: row.status,
    moderationPassed: row.moderation_passed,
    moderationFlags: row.moderation_flags,
    aiProvider: row.ai_provider,
    modelVersion: row.model_version,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ─── Comment ──────────────────────────────────────────────────

export function mapRowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    organizationId: row.organization_id,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    authorId: row.author_id,
    parentId: row.parent_id,
    body: row.body,
    status: row.status,
    resolvedById: row.resolved_by_id,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

