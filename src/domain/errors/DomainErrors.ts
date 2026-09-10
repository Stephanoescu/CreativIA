// ============================================================
// domain/errors/DomainErrors.ts
// Errores tipados del dominio de negocio.
// Permite distinguir errores de negocio de errores de sistema.
// ============================================================

/**
 * Error base del dominio. Todos los errores de negocio extienden de aquí.
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "DomainError";
  }
}

// ─── Autenticación y Autorización ────────────────────────────

export class UnauthorizedError extends DomainError {
  constructor(message = "No tienes permisos para realizar esta acción.") {
    super(message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenRoleError extends DomainError {
  constructor(requiredRole: string) {
    super(
      `Se requiere el rol '${requiredRole}' para esta operación.`,
      "FORBIDDEN_ROLE"
    );
    this.name = "ForbiddenRoleError";
  }
}

// ─── Recursos no encontrados ──────────────────────────────────

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} con ID '${id}' no encontrado.`, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

// ─── Moderación de Contenido ──────────────────────────────────

export class ContentModerationError extends DomainError {
  constructor(
    public readonly violations: Array<{ keyword: string; category: string }>
  ) {
    super(
      `El contenido fue bloqueado por el sistema de moderación. ` +
        `Palabras detectadas: ${violations.map((v) => v.keyword).join(", ")}`,
      "CONTENT_MODERATION_FAILED"
    );
    this.name = "ContentModerationError";
  }
}

// ─── Generación IA ───────────────────────────────────────────

export class AIGenerationError extends DomainError {
  constructor(
    message: string,
    public readonly provider: "mock" | "bedrock"
  ) {
    super(message, "AI_GENERATION_FAILED");
    this.name = "AIGenerationError";
  }
}

// ─── Documentos y Versiones ──────────────────────────────────

export class DocumentLockedError extends DomainError {
  constructor(documentId: string) {
    super(
      `El documento '${documentId}' está bloqueado para edición porque está en revisión.`,
      "DOCUMENT_LOCKED"
    );
    this.name = "DocumentLockedError";
  }
}

export class VersionNotFoundError extends DomainError {
  constructor(versionId: string) {
    super(`Versión '${versionId}' no encontrada.`, "VERSION_NOT_FOUND");
    this.name = "VersionNotFoundError";
  }
}

// ─── Organización ────────────────────────────────────────────

export class OrganizationMemberLimitError extends DomainError {
  constructor(maxMembers: number) {
    super(
      `La organización ha alcanzado el límite máximo de ${maxMembers} miembros.`,
      "MEMBER_LIMIT_REACHED"
    );
    this.name = "OrganizationMemberLimitError";
  }
}

