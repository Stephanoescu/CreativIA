// ============================================================
// infrastructure/ai/RealBedrockService.ts
// Implementación REAL del SDK de Amazon Bedrock.
// (Desactivada por defecto por la variable NEXT_PUBLIC_AI_PROVIDER)
// ============================================================

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type {
  IBedrockService,
  TextGenerationRequest,
  TextGenerationResult,
  ImageGenerationRequest,
  ImageGenerationResult,
} from "@/domain/services/IBedrockService";
import { ModerationService } from "./ModerationService";

export class RealBedrockService implements IBedrockService {
  private readonly client: BedrockRuntimeClient;
  private readonly moderationService = new ModerationService();

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
  }

  async generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    const modResult = this.moderationService.checkForbiddenContent(request.content);
    if (!modResult.passed) {
      throw new Error(`Moderation failed: ${modResult.violations.join(", ")}`);
    }

    const prompt = this.buildPrompt(request.action, request.content, request.context, request.language);

    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
      temperature: 0.7,
    };

    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return {
      generatedText: responseBody.content[0].text,
      tokensUsed: responseBody.usage.input_tokens + responseBody.usage.output_tokens,
      provider: "bedrock",
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
    };
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const modResult = this.moderationService.checkForbiddenContent(request.prompt);
    if (!modResult.passed) {
      throw new Error(`Moderation failed: ${modResult.violations.join(", ")}`);
    }

    const payload = {
      taskType: "TEXT_IMAGE",
      textToImageParams: {
        text: `Style: ${request.style}. ${request.prompt}`,
      },
      imageGenerationConfig: {
        numberOfImages: 1,
        quality: "standard",
        cfgScale: request.cfgScale || 8.0,
        height: request.height || 1024,
        width: request.width || 1024,
        seed: request.seed || Math.floor(Math.random() * 2147483647),
      },
    };

    const command = new InvokeModelCommand({
      modelId: "amazon.titan-image-generator-v1",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const base64Image = responseBody.images[0];

    return {
      imageData: base64Image,
      imageFormat: "base64",
      seed: payload.imageGenerationConfig.seed,
      provider: "bedrock",
      modelId: "amazon.titan-image-generator-v1",
    };
  }

  async moderateContent(request: { content: string; contentType: "text" | "image-prompt" }) {
    const modResult = this.moderationService.checkForbiddenContent(request.content);
    return {
      passed: modResult.passed,
      flags: modResult.violations.map(v => v.category),
      reason: modResult.passed ? null : "Contiene palabras prohibidas",
    };
  }

  private buildPrompt(action: string, content: string, context?: string, language = "es"): string {
    let instruction = "";
    switch (action) {
      case "summarize":
        instruction = "Resume el siguiente texto extrayendo los puntos clave.";
        break;
      case "expand":
        instruction = "Expande el siguiente texto agregando más detalles y profundidad, manteniendo el tono original.";
        break;
      case "fix-grammar":
        instruction = "Corrige la ortografía y gramática del siguiente texto sin cambiar su significado central.";
        break;
      case "generate-variations":
        instruction = "Genera 3 variaciones distintas del siguiente texto, cada una con un tono ligeramente diferente.";
        break;
      default:
        instruction = "Procesa el siguiente texto:";
    }

    return `
      Instrucción: ${instruction}
      Idioma de salida: ${language}
      Contexto adicional: ${context || "Ninguno"}
      
      Texto a procesar:
      """
      ${content}
      """
      
      Responde SOLO con el resultado procesado, sin explicaciones adicionales.
    `;
  }
}
