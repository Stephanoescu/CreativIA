// ============================================================
// domain/services/IModerationService.ts
// Puerto del servicio de moderación de contenido.
// Separado de IBedrockService para poder usarlo antes
// de cualquier llamada a la IA (filtrado previo).
// ============================================================

/**
 * Lista de categorías de contenido que pueden ser moderadas.
 */
export type ModerationCategory =
  | "violence"
  | "hate-speech"
  | "sexual-content"
  | "self-harm"
  | "misinformation"
  | "spam"
  | "prohibited-keywords";

/**
 * Política de sesgo a aplicar en la generación de contenido.
 * Se inyecta en el system prompt antes de cada llamada a la IA.
 */
export interface BiasPolicy {
  id: string;
  name: string;
  systemPromptAddition: string; // Texto que se agrega al system prompt
}

export interface IModerationService {
  /**
   * Verifica si el texto contiene palabras o patrones prohibidos.
   * Es síncrono y no necesita llamar a la IA para funcionar.
   */
  checkForbiddenContent(text: string): {
    passed: boolean;
    violations: Array<{
      keyword: string;
      category: ModerationCategory;
    }>;
  };

  /**
   * Retorna las políticas de mitigación de sesgos activas
   * que deben incluirse en el system prompt.
   */
  getActiveBiasPolicies(): BiasPolicy[];

  /**
   * Construye el system prompt completo con las políticas
   * de sesgo aplicadas, listo para enviar a la IA.
   */
  buildSystemPrompt(basePrompt: string): string;
}

