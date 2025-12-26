import { EbookData, StyleConfig, Page, AIConfig } from "../types";

// Função auxiliar para extrair JSON de uma resposta que pode conter texto adicional
const extractJSON = (text: string): string => {
  // Tenta encontrar JSON entre ```json e ``` ou entre { e }
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                    text.match(/```\s*([\s\S]*?)\s*```/) ||
                    text.match(/(\{[\s\S]*\})/);
  
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  
  return text.trim();
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

export const generateWithLocal = async (
  rawText: string,
  styleConfig: StyleConfig,
  aiConfig: AIConfig
): Promise<EbookData> => {
  const baseUrl = aiConfig.baseUrl || import.meta.env.VITE_LOCAL_AI_URL || "http://localhost:1234";
  const model = aiConfig.model || "llama3.2";

  // Detectar se é LM Studio (porta 1234) ou Ollama (porta 11434)
  const isLMStudio = baseUrl.includes(':1234');
  const endpoint = isLMStudio ? '/v1/chat/completions' : '/api/chat';

  const requestBody = isLMStudio ? {
    // Formato LM Studio (compatível com OpenAI)
    model,
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION(styleConfig) + "\n\nRETORNE APENAS JSON VÁLIDO, SEM TEXTO ADICIONAL." },
      { role: "user", content: `CONTEÚDO PARA DIAGRAMAÇÃO:\n\n${rawText}` }
    ],
    temperature: 0.4,
    max_tokens: -1
  } : {
    // Formato Ollama
    model,
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION(styleConfig) },
      { role: "user", content: `CONTEÚDO PARA DIAGRAMAÇÃO:\n\n${rawText}` }
    ],
    stream: false,
    format: "json",
    options: {
      temperature: 0.4,
    }
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na IA local (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  
  // LM Studio retorna no formato OpenAI
  const content = isLMStudio 
    ? data.choices?.[0]?.message?.content 
    : (data.message?.content || data.response);
  
  if (!content) throw new Error("Resposta vazia da IA local");

  // Extrair JSON limpo (remove markdown ou texto adicional)
  const cleanJSON = extractJSON(content);
  
  return JSON.parse(cleanJSON) as EbookData;
};

export const regeneratePageWithLocal = async (
  page: Page,
  styleConfig: StyleConfig,
  aiConfig: AIConfig
): Promise<Page> => {
  const baseUrl = aiConfig.baseUrl || import.meta.env.VITE_LOCAL_AI_URL || "http://localhost:1234";
  const model = aiConfig.model || "llama3.2";

  // Detectar se é LM Studio (porta 1234) ou Ollama (porta 11434)
  const isLMStudio = baseUrl.includes(':1234');
  const endpoint = isLMStudio ? '/v1/chat/completions' : '/api/chat';

  const requestBody = isLMStudio ? {
    // Formato LM Studio (compatível com OpenAI)
    model,
    messages: [
      { role: "system", content: REGENERATE_PAGE_INSTRUCTION(styleConfig, page.layout_type) + "\n\nRETORNE APENAS JSON VÁLIDO, SEM TEXTO ADICIONAL." },
      { role: "user", content: JSON.stringify(page) }
    ],
    temperature: 0.8,
    max_tokens: -1
  } : {
    // Formato Ollama
    model,
    messages: [
      { role: "system", content: REGENERATE_PAGE_INSTRUCTION(styleConfig, page.layout_type) },
      { role: "user", content: JSON.stringify(page) }
    ],
    stream: false,
    format: "json",
    options: {
      temperature: 0.8,
    }
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na IA local (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  
  // LM Studio retorna no formato OpenAI
  const content = isLMStudio 
    ? data.choices?.[0]?.message?.content 
    : (data.message?.content || data.response);
  
  if (!content) throw new Error("Resposta vazia da IA local");

  // Extrair JSON limpo (remove markdown ou texto adicional)
  const cleanJSON = extractJSON(content);
  
  const newPage = JSON.parse(cleanJSON) as Page;
  newPage.pagina_numero = page.pagina_numero;
  return newPage;
};
