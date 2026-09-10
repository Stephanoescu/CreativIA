// ============================================================
// infrastructure/supabase/database.types.ts
// Tipos TypeScript que mapean el esquema de Supabase.
// Generados manualmente para coincidir con schema.sql.
// En producción puedes auto-generarlos con:
//   npx supabase gen types typescript --project-id <id>
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enums del esquema ────────────────────────────────────────

export type UserRole = "designer" | "writer" | "approver" | "admin";
export type UserStatus = "active" | "inactive" | "suspended";
export type SubscriptionPlan = "free" | "pro" | "enterprise";
export type DocumentStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "rejected"
  | "archived";
export type ImageStyle =
  | "anime"
  | "photorealism"
  | "oil-painting"
  | "watercolor"
  | "digital-art"
  | "sketch";
export type ImageGenerationStatus =
  | "pending"
  | "generating"
  | "completed"
  | "failed"
  | "moderated";
export type CommentResourceType = "document" | "image";
export type CommentStatus = "open" | "resolved" | "deleted";
export type AiProvider = "mock" | "bedrock";

// ─── Definición de la Base de Datos ──────────────────────────

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          plan: SubscriptionPlan;
          max_members: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          plan?: SubscriptionPlan;
          max_members?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          logo_url?: string | null;
          plan?: SubscriptionPlan;
          max_members?: number;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          avatar_url: string | null;
          role: UserRole;
          status: UserStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          full_name: string;
          avatar_url?: string | null;
          role?: UserRole;
          status?: UserStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          avatar_url?: string | null;
          role?: UserRole;
          status?: UserStatus;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          organization_id: string;
          author_id: string;
          approver_id: string | null;
          title: string;
          content: string;
          status: DocumentStatus;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          author_id: string;
          approver_id?: string | null;
          title: string;
          content?: string;
          status?: DocumentStatus;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          approver_id?: string | null;
          title?: string;
          content?: string;
          status?: DocumentStatus;
          tags?: string[];
          updated_at?: string;
        };
      };
      document_versions: {
        Row: {
          id: string;
          document_id: string;
          author_id: string;
          version_number: number;
          title: string;
          content: string;
          change_description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          author_id: string;
          version_number: number;
          title: string;
          content: string;
          change_description?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>; // Inmutable
      };
      images: {
        Row: {
          id: string;
          organization_id: string;
          author_id: string;
          prompt: string;
          negative_prompt: string | null;
          style: ImageStyle;
          width: number;
          height: number;
          storage_url: string | null;
          thumbnail_url: string | null;
          status: ImageGenerationStatus;
          moderation_passed: boolean;
          moderation_flags: string[];
          ai_provider: AiProvider;
          model_version: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          author_id: string;
          prompt: string;
          negative_prompt?: string | null;
          style: ImageStyle;
          width?: number;
          height?: number;
          storage_url?: string | null;
          thumbnail_url?: string | null;
          status?: ImageGenerationStatus;
          moderation_passed?: boolean;
          moderation_flags?: string[];
          ai_provider?: AiProvider;
          model_version?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          storage_url?: string | null;
          thumbnail_url?: string | null;
          status?: ImageGenerationStatus;
          moderation_passed?: boolean;
          moderation_flags?: string[];
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          organization_id: string;
          resource_type: CommentResourceType;
          resource_id: string;
          author_id: string;
          parent_id: string | null;
          body: string;
          status: CommentStatus;
          resolved_by_id: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          resource_type: CommentResourceType;
          resource_id: string;
          author_id: string;
          parent_id?: string | null;
          body: string;
          status?: CommentStatus;
          resolved_by_id?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          status?: CommentStatus;
          resolved_by_id?: string | null;
          resolved_at?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
        [_ in never]: never;
      };
    Functions: {
      get_my_organization_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_my_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      subscription_plan: SubscriptionPlan;
      document_status: DocumentStatus;
      image_style: ImageStyle;
      image_generation_status: ImageGenerationStatus;
      comment_resource_type: CommentResourceType;
      comment_status: CommentStatus;
      ai_provider: AiProvider;
    };
  };
}
