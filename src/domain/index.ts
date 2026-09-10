// ============================================================
// domain/index.ts
// Barrel export — punto de entrada único para la capa Domain.
// Importa desde aquí en capas superiores (application, infrastructure).
// ============================================================

// Entities
export * from "./entities/User";
export * from "./entities/Organization";
export * from "./entities/Document";
export * from "./entities/Version";
export * from "./entities/Image";
export * from "./entities/Comment";

// Repository Ports
export * from "./repositories/IUserRepository";
export * from "./repositories/IDocumentRepository";
export * from "./repositories/IImageRepository";
export * from "./repositories/ICommentRepository";

// Service Ports
export * from "./services/IBedrockService";
export * from "./services/IModerationService";

// Domain Errors
export * from "./errors/DomainErrors";

