// ============================================================
// infrastructure/ai/bedrockServiceFactory.ts
// Factory Function — selecciona Mock o Real según env var.
// Este es el punto de conmutación del patrón Adapter.
// ============================================================

import type { IBedrockService } from "@/domain/services/IBedrockService";
import { MockBedrockService } from "./MockBedrockService";
import { RealBedrockService } from "./RealBedrockService";
// import { RealBedrockService } from "./RealBedrockService"; // Fase 3

let serviceInstance: IBedrockService | null = null;

/**
 * Retorna el servicio de IA correcto según NEXT_PUBLIC_AI_PROVIDER.
 * Usa el patrón Singleton para evitar crear múltiples instancias.
 *
 * - "mock"  → MockBedrockService (sin costo, para desarrollo)
 * - "real"  → RealBedrockService (AWS Bedrock, solo producción)
 */
export function getBedrockService(): IBedrockService {
  if (serviceInstance) return serviceInstance;

  const provider = process.env.NEXT_PUBLIC_AI_PROVIDER || "mock";

  if (provider === "bedrock") {
    console.log("🚀 Usando REAL Amazon Bedrock Service (AWS SDK)");
    serviceInstance = new RealBedrockService();
  } else {
    console.log("🛡️ Usando MOCK Bedrock Service (Costo $0)");
    serviceInstance = new MockBedrockService();
  }

  return serviceInstance as IBedrockService;
}

export function resetBedrockServiceInstance(): void {
  serviceInstance = null;
}

