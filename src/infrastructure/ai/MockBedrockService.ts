// ============================================================
// infrastructure/ai/MockBedrockService.ts
// Implementación MOCK de IBedrockService.
// Devuelve respuestas simuladas sin llamar a AWS.
// COSTO: $0.00 — seguro para desarrollo local.
// ============================================================

import type {
  IBedrockService,
  TextGenerationRequest,
  TextGenerationResult,
  ImageGenerationRequest,
  ImageGenerationResult,
  ModerationRequest,
  ModerationResult,
} from "@/domain/services/IBedrockService";
import { ModerationService } from "./ModerationService";

// Respuestas mock para cada acción de texto
const TEXT_RESPONSES: Record<string, string[]> = {
  summarize: [
    "Este texto trata sobre los aspectos más relevantes del tema en cuestión, destacando los puntos clave de manera concisa y efectiva.",
    "En resumen, el contenido aborda los elementos fundamentales con claridad, proporcionando una visión general completa del tema.",
    "El texto puede resumirse en los siguientes puntos clave: innovación, creatividad y aplicación práctica de conceptos modernos.",
  ],
  expand: [
    "Ampliando el concepto presentado, podemos explorar múltiples dimensiones que enriquecen nuestra comprensión. En primer lugar, es importante considerar el contexto histórico y cómo ha evolucionado este tema a lo largo del tiempo. Además, las implicaciones prácticas son numerosas y variadas, afectando diferentes sectores de la industria y la sociedad en general.",
    "Para desarrollar este punto con mayor profundidad, debemos analizar varios factores interconectados. La perspectiva global nos muestra tendencias emergentes que están redefiniendo el panorama actual. Investigaciones recientes sugieren que los enfoques tradicionales están siendo complementados con nuevas metodologías más eficientes.",
  ],
  "fix-grammar": [
    "[Texto corregido] El contenido ha sido revisado y corregido gramaticalmente, mejorando la fluidez y coherencia del texto original.",
    "[Texto corregido] Se han ajustado la puntuación, ortografía y estructura sintáctica para lograr una comunicación más clara y profesional.",
  ],
  "generate-variations": [
    "Variación 1: Una perspectiva fresca y renovada del concepto original, manteniendo la esencia pero con un enfoque más dinámico.\n\nVariación 2: Un enfoque alternativo que destaca los mismos puntos clave desde un ángulo diferente, adaptado para distintas audiencias.\n\nVariación 3: Una versión más concisa y directa que captura la idea central de manera impactante y memorable.",
  ],
};

export class MockBedrockService implements IBedrockService {
  private readonly moderationService = new ModerationService();

  async generateText(
    request: TextGenerationRequest
  ): Promise<TextGenerationResult> {
    // Simular latencia de red (300-800ms)
    await this.simulateDelay(300, 800);

    const responses = TEXT_RESPONSES[request.action] ?? TEXT_RESPONSES.expand;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // El mock aplica las políticas de sesgo al system prompt (demo)
    const systemPrompt = this.moderationService.buildSystemPrompt(
      `Eres un asistente de escritura creativa para una agencia de marketing.`
    );
    console.log("[MockBedrock] System prompt con bias policies aplicadas:", systemPrompt);

    return {
      generatedText: randomResponse,
      tokensUsed: Math.floor(Math.random() * 500) + 50, // Simular uso de tokens
      provider: "mock",
      modelId: "mock-claude-v1",
    };
  }

  async generateImage(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResult> {
    // Simular latencia más larga para generación de imagen (1-2s)
    await this.simulateDelay(1000, 2000);

    // Usar placehold.co para imágenes placeholder según el estilo
    const styleColors: Record<string, string> = {
      anime: "e879f9/ffffff",
      photorealism: "6366f1/ffffff",
      "oil-painting": "f59e0b/ffffff",
      watercolor: "22d3ee/ffffff",
      "digital-art": "10b981/ffffff",
      sketch: "94a3b8/1e293b",
    };

    const colorPair = styleColors[request.style] ?? "6366f1/ffffff";
    const seed = Math.floor(Math.random() * 1000000);

    // Generar URL de placeholder con dimensiones y estilo
    const placeholderUrl = `https://placehold.co/${request.width}x${request.height}/${colorPair}?text=${encodeURIComponent(request.style.toUpperCase())}+MOCK`;

    return {
      imageData: placeholderUrl,
      imageFormat: "url",
      seed,
      provider: "mock",
      modelId: "mock-stable-diffusion-xl-v1",
    };
  }

  async moderateContent(
    request: ModerationRequest
  ): Promise<ModerationResult> {
    // Usar el ModerationService local
    const result = this.moderationService.checkForbiddenContent(request.content);

    return {
      passed: result.passed,
      flags: result.violations.map((v) => v.category),
      reason: result.passed
        ? null
        : `Contenido bloqueado: ${result.violations.map((v) => v.keyword).join(", ")}`,
    };
  }

  private simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

