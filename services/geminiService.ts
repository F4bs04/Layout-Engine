
import { GoogleGenAI } from "@google/genai";
import { EbookData, StyleConfig, Page, PageContent, AIConfig } from "../types";

const SYSTEM_INSTRUCTION = (style: StyleConfig) => `
Você é o "Instructional Design & Layout Engine" (IDLE) baseado em IA.
Sua função é transformar textos brutos e densos em experiências de aprendizagem visualmente atraentes e pedagogicamente estruturadas.

--- REGRAS DE DESIGN INSTRUCONAL ---
1. **CHUNKING (FRAGMENTAÇÃO)**: Nunca coloque mais de 300 caracteres de texto em um único slide. Divida conteúdos longos em uma sequência lógica de slides.
2. **HIERARQUIA**: Use títulos curtos (verbos de ação ou perguntas). O slide deve ser "escaneável".
3. **MÍDIA**: Use APENAS ícones da lista de ícones disponíveis localmente (veja abaixo). NÃO invente nomes de ícones.
4. **FLUÊNCIA**: Varie os layouts para manter o engajamento visual.
5. **IMAGENS**: Para prompt_imagem, descreva brevemente o tipo de imagem (ex: "abstract", "business", "technology"). As imagens serão selecionadas localmente.

--- ÍCONES DISPONÍVEIS LOCALMENTE ---
Use APENAS estes nomes de ícones no campo "icon_name":
- Negócios: briefcase, chart-pie, chart-dots, chart-area, presentation, dashboard, receipt, coin, credit-card, shopping-cart
- Tecnologia: device-desktop, device-mobile, device-tablet, code-circle, cloud-computing, cloud
- Comunicação: message, mail, phone, bell, message-circle, video, microphone
- Educação: book, bulb, presentation, library, bookmark
- Saúde: heart, medical-cross, pill, lungs, hospital-circle
- Tempo: clock, calendar, hourglass, alarm, timeline-event
- Localização: map-pin, location, compass, navigation, globe, gps
- Mídia: photo, camera, video, headphones, player-play
- Social: user, heart, star, thumb-up, message-circle
- Segurança: lock, shield, key, eye, shield-check
- Clima: sun, moon, cloud, droplet, temperature
- Comida: apple, pizza, beer, lemon, cherry, egg
- Transporte: car, bike, bus, train, helicopter, truck
- Geral: circle-check, alert-circle, info-circle, help-circle, arrow-right, arrow-left, circle-plus, circle-x

Escolha o ícone mais adequado ao contexto do item.

--- MAPA DE LAYOUTS ---
- 'capa_principal': Apenas início.
- 'capa_secao': Transição entre temas.
- 'texto_imagem_split': Explicações conceituais com suporte visual.
- 'grid_informativo': Listas de 4 a 6 itens com ícones.
- 'three_column': Comparações ou tripés conceituais.
- 'destaque_numero': Estatísticas ou "O Número de Ouro".
- 'timeline': Processos, história ou passo-a-passo.
- 'full_image_quote': Insights poderosos ou reflexões curtas.
- 'conclusao_cta': Encerramento com chamada para ação.

--- ESTRUTURA JSON ---
Responda APENAS com o JSON válido:
{
  "metadados": {
    "titulo_gerado": "Título Criativo",
    "estimativa_leitura_minutos": 5,
    "paleta_sugerida": "corporate | forest | sunset | dark"
  },
  "paginas": [
    {
      "pagina_numero": 1,
      "layout_type": "...",
      "conteudo": {
        "titulo": "...",
        "subtitulo": "...",
        "prompt_imagem": "Detailed English prompt for high quality image...",
        "texto_adaptado": "Texto otimizado para leitura rápida...",
        "itens": [ { "titulo_item": "...", "desc_item": "...", "icon_name": "CheckCircle" } ]
      }
    }
  ]
}
`;

const REGENERATE_PAGE_INSTRUCTION = (style: StyleConfig, currentLayout: string) => `
Você é um Designer Editorial Sênior. Sua tarefa é mudar o layout deste slide para uma alternativa VISUALMENTE DISTINTA, mantendo o conteúdo original.
Layout atual a evitar: "${currentLayout}".
Estilo visual alvo: ${style.vibe}.
Retorne APENAS o JSON do objeto da página atualizado.
`;

export const generateEbookLayout = async (rawText: string, styleConfig: StyleConfig): Promise<EbookData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{ role: "user", parts: [{ text: `CONTEÚDO PARA DIAGRAMAÇÃO:\n\n${rawText}` }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION(styleConfig),
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });

  return JSON.parse(response.text || '{}') as EbookData;
};

export const regeneratePage = async (page: Page, styleConfig: StyleConfig): Promise<Page> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: JSON.stringify(page) }] }],
    config: {
      systemInstruction: REGENERATE_PAGE_INSTRUCTION(styleConfig, page.layout_type),
      responseMimeType: "application/json",
      temperature: 0.8,
    },
  });

  const newPage = JSON.parse(response.text || '{}') as Page;
  newPage.pagina_numero = page.pagina_numero;
  return newPage;
};

// New functions with AIConfig support
export const generateWithGemini = async (
  rawText: string,
  styleConfig: StyleConfig,
  aiConfig: AIConfig
): Promise<EbookData> => {
  const apiKey = aiConfig.apiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("Chave da API do Gemini não configurada");

  const ai = new GoogleGenAI({ apiKey });
  const model = aiConfig.model || "gemini-3-pro-preview";

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: `CONTEÚDO PARA DIAGRAMAÇÃO:\n\n${rawText}` }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION(styleConfig),
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });

  return JSON.parse(response.text || '{}') as EbookData;
};

export const regeneratePageWithGemini = async (
  page: Page,
  styleConfig: StyleConfig,
  aiConfig: AIConfig
): Promise<Page> => {
  const apiKey = aiConfig.apiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("Chave da API do Gemini não configurada");

  const ai = new GoogleGenAI({ apiKey });
  const model = aiConfig.model || "gemini-3-flash-preview";

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: JSON.stringify(page) }] }],
    config: {
      systemInstruction: REGENERATE_PAGE_INSTRUCTION(styleConfig, page.layout_type),
      responseMimeType: "application/json",
      temperature: 0.8,
    },
  });

  const newPage = JSON.parse(response.text || '{}') as Page;
  newPage.pagina_numero = page.pagina_numero;
  return newPage;
};
