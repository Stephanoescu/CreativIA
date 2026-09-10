// ============================================================
// infrastructure/ai/ModerationService.ts
// Implementación del servicio de moderación de contenido.
// Funciona SIN llamar a la IA — es un filtro local síncrono.
// ============================================================

import type {
  IModerationService,
  BiasPolicy,
  ModerationCategory,
} from "@/domain/services/IModerationService";

/**
 * Lista de palabras y patrones prohibidos con su categoría.
 * En producción esta lista puede cargarse desde la base de datos.
 */
const FORBIDDEN_PATTERNS: Array<{
  pattern: RegExp;
  keyword: string;
  category: ModerationCategory;
}> = [
  // Violencia
  { pattern: /\b(matar|asesinar|torturar|violencia extrema)\b/gi, keyword: "violencia", category: "violence" },
  // Discurso de odio
  { pattern: /\b(odio racial|supremacía|discriminar)\b/gi, keyword: "discurso_odio", category: "hate-speech" },
  // Contenido sexual explícito
  { pattern: /\b(pornografía|contenido adulto explícito)\b/gi, keyword: "contenido_sexual", category: "sexual-content" },
  // Spam / phishing
  { pattern: /\b(haz clic aquí para ganar|gana dinero fácil|oferta limitada)\b/gi, keyword: "spam", category: "spam" },
  // Self-harm
  { pattern: /\b(suicidio instructivo|cómo hacerse daño)\b/gi, keyword: "autolesion", category: "self-harm" },
];

/**
 * Políticas de mitigación de sesgos que se inyectan en cada system prompt.
 */
const BIAS_POLICIES: BiasPolicy[] = [
  {
    id: "gender-neutral",
    name: "Lenguaje neutro en género",
    systemPromptAddition:
      "Usa lenguaje inclusivo y neutro en género. Evita estereotipos de género en el contenido generado.",
  },
  {
    id: "cultural-sensitivity",
    name: "Sensibilidad cultural",
    systemPromptAddition:
      "Sé sensible a las diferencias culturales. Evita estereotipos culturales y representa diversas perspectivas equitativamente.",
  },
  {
    id: "factual-accuracy",
    name: "Precisión factual",
    systemPromptAddition:
      "Proporciona información factual y objetiva. Cuando no estés seguro, indícalo claramente en lugar de especular.",
  },
  {
    id: "professional-tone",
    name: "Tono profesional",
    systemPromptAddition:
      "Mantén un tono profesional y respetuoso en todo el contenido generado.",
  },
];

export class ModerationService implements IModerationService {
  checkForbiddenContent(text: string): {
    passed: boolean;
    violations: Array<{ keyword: string; category: ModerationCategory }>;
  } {
    const violations: Array<{ keyword: string; category: ModerationCategory }> = [];

    for (const { pattern, keyword, category } of FORBIDDEN_PATTERNS) {
      // Resetear el regex antes de cada prueba (flag g requiere reset)
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        violations.push({ keyword, category });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  getActiveBiasPolicies(): BiasPolicy[] {
    return BIAS_POLICIES;
  }

  buildSystemPrompt(basePrompt: string): string {
    const policyAdditions = BIAS_POLICIES.map((p) => p.systemPromptAddition).join(" ");
    return `${basePrompt}\n\nPolíticas de contenido: ${policyAdditions}`;
  }
}

