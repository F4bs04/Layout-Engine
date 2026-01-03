
export type LayoutType = 
  | "capa_principal"
  | "capa_secao"
  | "texto_imagem_split"
  | "grid_informativo"
  | "destaque_numero"
  | "conclusao_cta"
  | "full_image_quote"
  | "three_column"
  | "timeline"
  | "comparison_table"
  | "feature_list"
  | "process_steps"
  | "team_grid"
  | "pricing_table"
  | "faq_section";

export type AspectRatio = "16:9" | "9:16" | "A4";

export interface StyleConfig {
  font: string;
  palette: string; // ID of the palette
  vibe: string;
}

export interface PageContent {
  titulo?: string;
  subtitulo?: string;
  autor?: string;
  titulo_secao?: string;
  breve_descricao?: string;
  cor_fundo_hex?: string;
  texto_adaptado?: string;
  lado_imagem?: 'left' | 'right';
  prompt_imagem?: string;
  custom_image_url?: string; 
  itens?: Array<{
    titulo_item: string;
    desc_item: string;
    icone_keyword?: string;
    custom_image_url?: string; 
    icon_name?: string; 
  }>;
  numero_grande?: string;
  texto_explicativo?: string;
  prompt_fundo_abstrato?: string;
  titulo_final?: string;
  texto_resumo?: string;
  texto_botao_acao?: string;
  citacao?: string;
  autor_citacao?: string;
  steps?: Array<{
    step_title: string;
    step_desc: string;
  }>;
}

export interface Page {
  pagina_numero: number;
  layout_type: LayoutType;
  conteudo: PageContent;
  locked?: boolean; // New: prevents the slide from being changed by AI remixing
}

export interface EbookMetadata {
  titulo_gerado: string;
  estimativa_leitura_minutos: number;
  paleta_sugerida: string;
}

export interface EbookData {
  metadados: EbookMetadata;
  paginas: Page[];
}

// AI Provider Types
export type AIProvider = 'gemini' | 'openai' | 'local';

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}