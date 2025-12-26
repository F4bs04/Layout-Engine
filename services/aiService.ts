import { EbookData, StyleConfig, Page, AIConfig } from "../types";
import { generateWithGemini, regeneratePageWithGemini } from "./geminiService";
import { generateWithOpenAI, regeneratePageWithOpenAI } from "./openaiService";
import { generateWithLocal, regeneratePageWithLocal } from "./localService";

export const generateEbookLayout = async (
  rawText: string,
  styleConfig: StyleConfig,
  aiConfig: AIConfig
): Promise<EbookData> => {
  switch (aiConfig.provider) {
    case 'gemini':
      return generateWithGemini(rawText, styleConfig, aiConfig);
    case 'openai':
      return generateWithOpenAI(rawText, styleConfig, aiConfig);
    case 'local':
      return generateWithLocal(rawText, styleConfig, aiConfig);
    default:
      throw new Error(`Provedor de IA não suportado: ${aiConfig.provider}`);
  }
};

export const regeneratePage = async (
  page: Page,
  styleConfig: StyleConfig,
  aiConfig: AIConfig
): Promise<Page> => {
  switch (aiConfig.provider) {
    case 'gemini':
      return regeneratePageWithGemini(page, styleConfig, aiConfig);
    case 'openai':
      return regeneratePageWithOpenAI(page, styleConfig, aiConfig);
    case 'local':
      return regeneratePageWithLocal(page, styleConfig, aiConfig);
    default:
      throw new Error(`Provedor de IA não suportado: ${aiConfig.provider}`);
  }
};
