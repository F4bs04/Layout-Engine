import OpenAI from "openai";
import { EbookData, StyleConfig, Page, AIConfig } from "../types";

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

export const generateWithOpenAI = async (
  rawText: string,
  styleConfig: StyleConfig,
  aiConfig: AIConfig
): Promise<EbookData> => {
  const apiKey = aiConfig.apiKey || import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Chave da API da OpenAI não configurada");

  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const model = aiConfig.model || "gpt-4o";

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION(styleConfig) },
      { role: "user", content: `CONTEÚDO PARA DIAGRAMAÇÃO:\n\n${rawText}` }
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Resposta vazia da OpenAI");

  return JSON.parse(sanitizeJSON(content)) as EbookData;
};

export const regeneratePageWithOpenAI = async (
  page: Page,
  styleConfig: StyleConfig,
  aiConfig: AIConfig
): Promise<Page> => {
  const apiKey = aiConfig.apiKey || import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Chave da API da OpenAI não configurada");

  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const model = aiConfig.model || "gpt-4o";

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: REGENERATE_PAGE_INSTRUCTION(styleConfig, page.layout_type) },
      { role: "user", content: JSON.stringify(page) }
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Resposta vazia da OpenAI");

  const newPage = JSON.parse(sanitizeJSON(content)) as Page;
  newPage.pagina_numero = page.pagina_numero;
  return newPage;
};

export const chunkContentWithOpenAI = async (
  rawText: string,
  aiConfig: AIConfig
): Promise<Array<{ title: string, summary: string, content: string }>> => {
  const apiKey = aiConfig.apiKey || import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Chave da API da OpenAI não configurada");

  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const model = aiConfig.model || "gpt-4o";

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

  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  const data = JSON.parse(sanitizeJSON(content || '[]'));
  return Array.isArray(data) ? data : (data.sections || data.chunks || []);
};

export const generatePageWithOpenAI = async (
  section: { title: string, content: string },
  layoutType: string,
  styleConfig: StyleConfig,
  aiConfig: AIConfig
): Promise<Page> => {
  const apiKey = aiConfig.apiKey || import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Chave da API da OpenAI não configurada");

  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const model = aiConfig.model || "gpt-4o";

  const prompt = `
    Crie o conteúdo para um slide do tipo "${layoutType}" baseado no seguinte conteúdo:
    
    TÍTULO: ${section.title}
    CONTEÚDO: ${section.content}
    
    Siga as instruções do sistema para preencher o objeto "conteudo" corretamente para este tipo de layout.
  `;

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION(styleConfig) },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const content = response.choices[0]?.message?.content;
  const pageData = JSON.parse(sanitizeJSON(content || '{}'));
  
  if (pageData.paginas && pageData.paginas.length > 0) return pageData.paginas[0];
  return {
    pagina_numero: 0,
    layout_type: layoutType as any,
    conteudo: pageData.conteudo || pageData
  };
};
