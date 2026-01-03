import { GoogleGenAI } from "@google/genai";
import { EbookData, StyleConfig, Page, PageContent, AIConfig } from "../types";

// Função para sanitizar JSON removendo caracteres de controle inválidos
const sanitizeJSON = (jsonString: string): string => {
  // Remove caracteres de controle (0x00-0x1F) exceto \n, \r, \t
  return jsonString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
};

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
- 'capa_principal': Apenas início (Título, Subtítulo, Autor).
- 'capa_secao': Transição entre temas (Título da Seção, Descrição).
- 'texto_imagem_split': Explicações conceituais com suporte visual lateral.
- 'grid_informativo': Listas de 4 a 6 itens com ícones e descrições curtas.
- 'three_column': Comparações, tripés conceituais ou 3 pilares com imagens.
- 'destaque_numero': Estatísticas impactantes ou um único número gigante.
- 'timeline': Processos seqüenciais, história ou passo-a-passo (máx 5 steps).
- 'full_image_quote': Insights poderosos, citações ou reflexões curtas sobre imagem.
- 'conclusao_cta': Encerramento com resumo e botão de ação.
- 'comparison_table': Tabelas de comparação entre recursos ou conceitos.
- 'feature_list': Lista detalhada de funcionalidades com ícones grandes.
- 'process_steps': Fluxo horizontal de etapas de um processo.
- 'team_grid': Apresentação de pessoas, membros da equipe ou perfis.
- 'pricing_table': Planos de preços ou níveis de serviço (use | para separar preço de features).
- 'faq_section': Perguntas e respostas frequentes.

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

  return JSON.parse(sanitizeJSON(response.text || '{}')) as EbookData;
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

  const newPage = JSON.parse(sanitizeJSON(response.text || '{}')) as Page;
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

  return JSON.parse(sanitizeJSON(response.text || '{}')) as EbookData;
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

  const newPage = JSON.parse(sanitizeJSON(response.text || '{}')) as Page;
  newPage.pagina_numero = page.pagina_numero;
  return newPage;
};

export const chunkContentWithGemini = async (
  rawText: string,
  aiConfig: AIConfig
): Promise<Array<{ title: string, summary: string, content: string }>> => {
  const apiKey = aiConfig.apiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("Chave da API do Gemini não configurada");

  const ai = new GoogleGenAI({ apiKey });
  const model = aiConfig.model || "gemini-3-flash-preview";

  const prompt = `
    Analise o texto abaixo e divida-o em seções lógicas para um ebook/apresentação.
    Cada seção deve ter um título curto, um resumo do que será abordado e o conteúdo original adaptado para aquela seção.
    
    TEXTO:
    ${rawText}
    
    Retorne APENAS um JSON no formato:
    [
      { "title": "Título da Seção", "summary": "Breve resumo", "content": "Conteúdo da seção" }
    ]
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  return JSON.parse(sanitizeJSON(response.text || '[]'));
};

export const generatePageWithGemini = async (
  section: { title: string, content: string },
  layoutType: string,
  styleConfig: StyleConfig,
  aiConfig: AIConfig
): Promise<Page> => {
  const apiKey = aiConfig.apiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("Chave da API do Gemini não configurada");

  const ai = new GoogleGenAI({ apiKey });
  const model = aiConfig.model || "gemini-3-pro-preview";

  const prompt = `
    Crie o conteúdo para um slide do tipo "${layoutType}" baseado no seguinte conteúdo:
    
    TÍTULO: ${section.title}
    CONTEÚDO: ${section.content}
    
    Siga as instruções do sistema para preencher o objeto "conteudo" corretamente para este tipo de layout.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION(styleConfig),
      responseMimeType: "application/json",
      temperature: 0.5,
    },
  });

  const pageData = JSON.parse(sanitizeJSON(response.text || '{}'));
  // Se a IA retornar o objeto completo do ebook, pegamos a primeira página
  if (pageData.paginas && pageData.paginas.length > 0) return pageData.paginas[0];
  // Se retornar apenas o conteúdo, montamos a página
  return {
    pagina_numero: 0,
    layout_type: layoutType as any,
    conteudo: pageData.conteudo || pageData
  };
};
