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

export const chunkContent = async (
  rawText: string,
  aiConfig: AIConfig
): Promise<Array<{ title: string, summary: string, content: string }>> => {
  switch (aiConfig.provider) {
    case 'gemini':
      const { chunkContentWithGemini } = await import("./geminiService");
      return chunkContentWithGemini(rawText, aiConfig);
    case 'openai':
      const { chunkContentWithOpenAI } = await import("./openaiService");
      return chunkContentWithOpenAI(rawText, aiConfig);
    case 'local':
      const { chunkContentWithLocal } = await import("./localService");
      return chunkContentWithLocal(rawText, aiConfig);
    default:
      throw new Error(`Chunking não suportado para o provedor: ${aiConfig.provider}`);
  }
};

export const generatePageByLayout = async (
  section: { title: string, content: string },
  layoutType: string,
  styleConfig: StyleConfig,
  aiConfig: AIConfig
): Promise<Page> => {
  switch (aiConfig.provider) {
    case 'gemini':
      const { generatePageWithGemini } = await import("./geminiService");
      return generatePageWithGemini(section, layoutType, styleConfig, aiConfig);
    case 'openai':
      const { generatePageWithOpenAI } = await import("./openaiService");
      return generatePageWithOpenAI(section, layoutType, styleConfig, aiConfig);
    case 'local':
      const { generatePageWithLocal } = await import("./localService");
      return generatePageWithLocal(section, layoutType, styleConfig, aiConfig);
    default:
      throw new Error(`Geração por layout não suportada para o provedor: ${aiConfig.provider}`);
  }
};
