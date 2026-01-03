
import React, { useState, useRef, useEffect } from 'react';
import { generateEbookLayout, regeneratePage } from './services/aiService';
import { EbookData, Page, AspectRatio, StyleConfig, PageContent, AIProvider, AIConfig } from './types';
import { 
  CoverPage, 
  SectionCover, 
  TextImageSplit, 
  GridInfo, 
  StatHighlight, 
  ConclusionCTA, 
  FullImageQuote, 
  ThreeColumn, 
  Timeline,
  ComparisonTable,
  FeatureList,
  ProcessSteps,
  TeamGrid,
  PricingTable,
  FAQSection,
  LayoutPreview
} from './components/LayoutComponents';
import { chunkContent, generatePageByLayout } from './services/aiService';
import { ImagePicker } from './components/ImagePicker';
import { IconPicker } from './components/IconPicker';
import { 
  Loader2, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  FileText, 
  Smartphone, 
  Monitor, 
  File, 
  Sparkles, 
  FileType, 
  Shuffle, 
  Settings, 
  Key, 
  Info, 
  HelpCircle, 
  CheckCircle,
  Lock,
  Save,
  Download,
  X,
  Trash2,
  ExternalLink,
  Layers,
  MousePointer2,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
// @ts-ignore
import * as mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { exportToPptx } from './services/exportService';

// --- CONFIGURAÇÕES TÉCNICAS DE PÁGINA (PONTOS PDF) ---
const ASPECT_RATIO_CONFIG: Record<AspectRatio, { 
  width: number, 
  height: number, 
  orientation: 'p' | 'l',
  renderWidth: number // Largura de renderização no browser para escala
}> = {
  'A4': { width: 595.28, height: 841.89, orientation: 'p', renderWidth: 1240 },
  '16:9': { width: 841.89, height: 473.56, orientation: 'l', renderWidth: 1600 },
  '9:16': { width: 473.56, height: 841.89, orientation: 'p', renderWidth: 900 }
};

const FONTS = [
  { id: 'inter', label: 'Modern Sans', family: '"Inter", sans-serif' },
  { id: 'serif', label: 'Classic Serif', family: '"Playfair Display", serif' },
  { id: 'tech', label: 'Tech Mono', family: '"Space Grotesk", sans-serif' },
];

const PALETTES = [
  { id: 'corporate', label: 'Corporate', colors: { bg: '#eff6ff', primary: '#2563eb', secondary: '#1e40af', text: '#0f172a' } },
  { id: 'forest', label: 'Eco Forest', colors: { bg: '#f0fdf4', primary: '#16a34a', secondary: '#14532d', text: '#052e16' } },
  { id: 'sunset', label: 'Vibrant', colors: { bg: '#fff7ed', primary: '#ea580c', secondary: '#9a3412', text: '#431407' } },
  { id: 'dark', label: 'Cyber Dark', colors: { bg: '#0f172a', primary: '#38bdf8', secondary: '#0ea5e9', text: '#f8fafc' } },
];

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("");
  const [exportFinished, setExportFinished] = useState(false);
  const [ebookData, setEbookData] = useState<EbookData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [unsplashKey, setUnsplashKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [localAiUrl, setLocalAiUrl] = useState('http://localhost:1234');
  const [selectedModel, setSelectedModel] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [activeImageEdit, setActiveImageEdit] = useState<{pageIndex: number, field: string, itemIndex?: number} | null>(null);
  const [activeIconEdit, setActiveIconEdit] = useState<{pageIndex: number, itemIndex: number} | null>(null);
  const [regeneratingPage, setRegeneratingPage] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<jsPDF | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [workflowStep, setWorkflowStep] = useState<'input' | 'selection' | 'result'>('input');
  const [contentChunks, setContentChunks] = useState<Array<{ title: string, summary: string, content: string }>>([]);
  const [selectedLayouts, setSelectedLayouts] = useState<Record<number, string>>({});

  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('A4');
  const [styleConfig, setStyleConfig] = useState<StyleConfig>({
    font: 'inter', palette: 'corporate', vibe: 'Professional'
  });

  const exportBufferRef = useRef<HTMLDivElement>(null);
  // Fix: Declare missing fileInputRef
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('idle_project');
    if (saved) setEbookData(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (ebookData) localStorage.setItem('idle_project', JSON.stringify(ebookData));
  }, [ebookData]);

  // Carregar configurações salvas
  useEffect(() => {
    const savedConfig = localStorage.getItem('idle_ai_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setAiProvider(config.provider || 'gemini');
      setGeminiKey(config.geminiKey || '');
      setOpenaiKey(config.openaiKey || '');
      setLocalAiUrl(config.localAiUrl || 'http://localhost:11434');
      setSelectedModel(config.model || '');
      setUnsplashKey(config.unsplashKey || '');
    }
  }, []);

  const handleSaveConfig = () => {
    const config = {
      provider: aiProvider,
      geminiKey,
      openaiKey,
      localAiUrl,
      model: selectedModel,
      unsplashKey
    };
    localStorage.setItem('idle_ai_config', JSON.stringify(config));
    setConnectionStatus('success');
    setConnectionMessage('✅ Configurações salvas com sucesso!');
    setTimeout(() => {
      setConnectionStatus('idle');
      setConnectionMessage('');
    }, 3000);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');
    setConnectionMessage('');

    try {
      const aiConfig: AIConfig = {
        provider: aiProvider,
        apiKey: aiProvider === 'gemini' ? geminiKey : aiProvider === 'openai' ? openaiKey : undefined,
        baseUrl: aiProvider === 'local' ? localAiUrl : undefined,
        model: selectedModel || undefined,
      };

      // Validar configuração
      if (aiProvider === 'gemini' && !geminiKey) {
        throw new Error('Chave do Gemini não configurada');
      }
      if (aiProvider === 'openai' && !openaiKey) {
        throw new Error('Chave da OpenAI não configurada');
      }
      if (aiProvider === 'local' && !selectedModel) {
        throw new Error('Modelo não especificado');
      }

      // Testar com um prompt simples
      const testPrompt = "Teste de conexão";
      await generateEbookLayout(testPrompt, styleConfig, aiConfig);

      setConnectionStatus('success');
      setConnectionMessage(`✅ Conexão com ${aiProvider === 'gemini' ? 'Gemini' : aiProvider === 'openai' ? 'OpenAI' : 'IA Local'} estabelecida com sucesso!`);
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionMessage(`❌ Erro na conexão: ${err.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    
    // Validar configuração da API
    if (aiProvider === 'gemini' && !geminiKey) {
      setError("⚠️ Configure sua chave do Gemini nas configurações (ícone ⚙️)");
      return;
    }
    if (aiProvider === 'openai' && !openaiKey) {
      setError("⚠️ Configure sua chave da OpenAI nas configurações (ícone ⚙️)");
      return;
    }
    if (aiProvider === 'local' && !selectedModel) {
      setError("⚠️ Configure o modelo da IA local nas configurações (ícone ⚙️)");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const aiConfig: AIConfig = {
        provider: aiProvider,
        apiKey: aiProvider === 'gemini' ? geminiKey : aiProvider === 'openai' ? openaiKey : undefined,
        baseUrl: aiProvider === 'local' ? localAiUrl : undefined,
        model: selectedModel || undefined,
      };
      
      const chunks = await chunkContent(inputText, aiConfig);
      setContentChunks(chunks);
      
      // Pré-selecionar layouts sugeridos
      const initialLayouts: Record<number, string> = {};
      chunks.forEach((_, i) => {
        if (i === 0) initialLayouts[i] = 'capa_principal';
        else if (i === chunks.length - 1) initialLayouts[i] = 'conclusao_cta';
        else initialLayouts[i] = 'texto_imagem_split';
      });
      setSelectedLayouts(initialLayouts);
      setWorkflowStep('selection');
    } catch (err: any) {
      setError("❌ Erro na análise: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeLayout = async () => {
    setLoading(true);
    setError(null);
    try {
      const aiConfig: AIConfig = {
        provider: aiProvider,
        apiKey: aiProvider === 'gemini' ? geminiKey : aiProvider === 'openai' ? openaiKey : undefined,
        baseUrl: aiProvider === 'local' ? localAiUrl : undefined,
        model: selectedModel || undefined,
      };

      const pages: Page[] = [];
      for (let i = 0; i < contentChunks.length; i++) {
        setExportStatus(`Diagramando Seção ${i + 1} de ${contentChunks.length}...`);
        const page = await generatePageByLayout(
          contentChunks[i],
          selectedLayouts[i],
          styleConfig,
          aiConfig
        );
        page.pagina_numero = i + 1;
        pages.push(page);
      }

      setEbookData({
        metadados: {
          titulo_gerado: contentChunks[0].title,
          estimativa_leitura_minutos: contentChunks.length,
          paleta_sugerida: styleConfig.palette
        },
        paginas: pages
      });
      setWorkflowStep('result');
      setCurrentPage(0);
    } catch (err: any) {
      setError("❌ Erro na diagramação: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegeneratePage = async () => {
    if (!ebookData) return;
    setRegeneratingPage(true);
    try {
      const aiConfig: AIConfig = {
        provider: aiProvider,
        apiKey: aiProvider === 'gemini' ? geminiKey : aiProvider === 'openai' ? openaiKey : undefined,
        baseUrl: aiProvider === 'local' ? localAiUrl : undefined,
        model: selectedModel || undefined,
      };
      const newPage = await regeneratePage(ebookData.paginas[currentPage], styleConfig, aiConfig);
      const newPages = [...ebookData.paginas];
      newPages[currentPage] = newPage;
      setEbookData({ ...ebookData, paginas: newPages });
    } catch (err: any) {
      setError("Erro ao remixar: " + err.message);
    } finally {
      setRegeneratingPage(false);
    }
  };

  // Fix: Implement handleFileUpload for different file types
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setInputText(result.value);
      } else {
        const text = await file.text();
        setInputText(text);
      }
    } catch (err) {
      setError("Erro ao ler arquivo.");
    }
  };

  // Função para converter cor RGB string para array [r, g, b]
  const parseColor = (colorStr: string): [number, number, number] => {
    const rgb = colorStr.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      return [parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2])];
    }
    return [0, 0, 0];
  };

  // Mapeamento de fontes CSS para fontes PDF
  const mapFontFamily = (fontFamily: string): { family: string, style: string } => {
    const lowerFont = fontFamily.toLowerCase();
    
    // Fontes serifadas
    if (lowerFont.includes('playfair') || lowerFont.includes('serif') || lowerFont.includes('times')) {
      return { family: 'times', style: 'normal' };
    }
    
    // Fontes monoespaçadas
    if (lowerFont.includes('mono') || lowerFont.includes('courier') || lowerFont.includes('code')) {
      return { family: 'courier', style: 'normal' };
    }
    
    // Padrão: sans-serif (helvetica)
    return { family: 'helvetica', style: 'normal' };
  };

  // Técnica Canva/Gamma: Imagem de fundo + Camada de texto invisível
  const exportPageToPDF = async (element: HTMLElement, doc: jsPDF, cfg: any) => {
    const scale = cfg.width / cfg.renderWidth;
    const parentRect = element.getBoundingClientRect();
    const renderHeight = cfg.renderWidth * (cfg.height / cfg.width);

    // PASSO 1: Captura a página inteira como imagem de alta qualidade
    const pageCanvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: cfg.renderWidth,
      height: renderHeight,
      windowWidth: cfg.renderWidth,
      windowHeight: renderHeight,
      scrollX: 0,
      scrollY: 0
    });

    const pageImage = pageCanvas.toDataURL('image/jpeg', 0.95);
    doc.addImage(pageImage, 'JPEG', 0, 0, cfg.width, cfg.height, undefined, 'FAST');

    // PASSO 2: Adiciona camadas de texto invisíveis
    const textElements = element.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, label, li, td, th');
    
    for (const el of Array.from(textElements)) {
      const textElement = el as HTMLElement;
      
      // Pega apenas elementos que têm texto direto (não apenas filhos)
      const directText = Array.from(textElement.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent?.trim())
        .filter(text => text && text.length > 0)
        .join(' ');
      
      if (!directText) continue;

      const rect = textElement.getBoundingClientRect();
      const style = window.getComputedStyle(textElement);
      
      // Calcula posição relativa ao container pai
      const x = (rect.left - parentRect.left) * scale;
      const y = (rect.top - parentRect.top) * scale;
      const width = rect.width * scale;
      const fontSize = parseFloat(style.fontSize) * scale;
      
      // Mapeia família de fonte
      const fontMap = mapFontFamily(style.fontFamily);
      const fontWeight = style.fontWeight;
      const fontStyle = (fontWeight === 'bold' || parseInt(fontWeight) >= 600) ? 'bold' : fontMap.style;
      
      // Configura fonte
      doc.setFont(fontMap.family, fontStyle);
      doc.setFontSize(fontSize);

      // Texto invisível (opacidade 0 ou cor branca)
      doc.setTextColor(255, 255, 255, 0);
      
      // Calcula baseline correto
      const baselineOffset = fontSize * 0.82;
      
      try {
        doc.text(directText, x, y + baselineOffset, {
          maxWidth: width,
          align: style.textAlign as 'left' | 'center' | 'right',
          baseline: 'top'
        });
      } catch (e) {
        try {
          doc.text(directText, x, y + baselineOffset, {
            maxWidth: width
          });
        } catch (err) {
          // Ignora erros de texto
        }
      }
    }
  };

  const runExport = async () => {
    if (!ebookData || !exportBufferRef.current) return;
    
    setShowExportModal(false);
    setExporting(true);
    setExportFinished(false);
    setExportProgress(0);
    setExportStatus("Iniciando Engine de Exportação em Camadas...");

    const cfg = ASPECT_RATIO_CONFIG[selectedRatio];
    const doc = new jsPDF({
      orientation: cfg.orientation,
      unit: 'pt',
      format: [cfg.width, cfg.height]
    });

    const buffer = exportBufferRef.current;
    buffer.style.display = 'block';
    buffer.style.width = `${cfg.renderWidth}px`;

    try {
      for (let i = 0; i < ebookData.paginas.length; i++) {
        const pageIdx = i + 1;
        setExportStatus(`Processando Página ${pageIdx} de ${ebookData.paginas.length} (Extraindo Camadas)...`);
        setExportProgress(Math.round((i / ebookData.paginas.length) * 100));

        if (i > 0) doc.addPage([cfg.width, cfg.height], cfg.orientation);

        // Renderiza apenas a página atual no buffer
        setCurrentPage(i); 
        await new Promise(r => setTimeout(r, 1500)); // Tempo para as animações e imagens carregarem

        const element = buffer.querySelector('.active-slide') as HTMLElement;
        if (!element) throw new Error("Falha ao localizar slide no buffer");

        // Exporta página com fidelidade visual
        await exportPageToPDF(element, doc, cfg);
      }

      setExportStatus("Finalizando Documento em Camadas...");
      setExportProgress(100);
      setGeneratedPdf(doc);
      setExportFinished(true);
    } catch (err: any) {
      setError("Erro na exportação: " + err.message);
      console.error("Erro detalhado na exportação:", err);
      setExporting(false);
    } finally {
      buffer.style.display = 'none';
    }
  };

  const downloadPdf = () => {
    if (generatedPdf) {
      generatedPdf.save(`${ebookData?.metadados.titulo_gerado || 'ebook'}.pdf`);
      setExporting(false);
    }
  };

  const handleExportPptx = async () => {
    if (!ebookData) return;
    setExporting(true);
    setExportFinished(false);
    setExportProgress(0);
    setExportStatus("Gerando Arquitetura para Google Slides...");
    
    try {
      setExportProgress(30);
      await exportToPptx(ebookData, styleConfig, selectedRatio);
      setExportProgress(100);
      setExportFinished(true);
      setExportStatus("PPTX Gerado com Sucesso!");
    } catch (err: any) {
      setError("Erro ao exportar PPTX: " + err.message);
      setExporting(false);
    }
  };

  const openPdf = () => {
    if (generatedPdf) {
      const blob = generatedPdf.output('bloburl');
      window.open(blob, '_blank');
      setExporting(false);
    }
  };

  const renderPage = (page: Page, isBuffer = false) => {
    const props = {
      content: page.conteudo,
      onEditImage: isBuffer ? undefined : (f: any, i?: number) => { setActiveImageEdit({pageIndex: page.pagina_numero-1, field: f, itemIndex: i}); setImagePickerOpen(true); },
      onEditIcon: isBuffer ? undefined : (i: number) => { setActiveIconEdit({pageIndex: page.pagina_numero-1, itemIndex: i}); setIconPickerOpen(true); },
      onUpdate: isBuffer ? undefined : (u: any) => {
          if(!ebookData) return;
          const newData = {...ebookData};
          newData.paginas[page.pagina_numero-1].conteudo = {...newData.paginas[page.pagina_numero-1].conteudo, ...u};
          setEbookData(newData);
      }
    };
    
    return (
      <div className={`h-full w-full ${isBuffer ? 'active-slide' : ''}`}>
        {(() => {
          switch (page.layout_type) {
            case 'capa_principal': return <CoverPage {...props} />;
            case 'capa_secao': return <SectionCover {...props} />;
            case 'texto_imagem_split': return <TextImageSplit {...props} />;
            case 'grid_informativo': return <GridInfo {...props} />;
            case 'destaque_numero': return <StatHighlight {...props} />;
            case 'conclusao_cta': return <ConclusionCTA {...props} />;
            case 'full_image_quote': return <FullImageQuote {...props} />;
            case 'three_column': return <ThreeColumn {...props} />;
            case 'timeline': return <Timeline {...props} />;
            case 'comparison_table': return <ComparisonTable {...props} />;
            case 'feature_list': return <FeatureList {...props} />;
            case 'process_steps': return <ProcessSteps {...props} />;
            case 'team_grid': return <TeamGrid {...props} />;
            case 'pricing_table': return <PricingTable {...props} />;
            case 'faq_section': return <FAQSection {...props} />;
            default: return <div className="p-8">Layout {page.layout_type}</div>;
          }
        })()}
      </div>
    );
  };

  const currentPalette = PALETTES.find(p => p.id === styleConfig.palette)!;
  const currentFont = FONTS.find(f => f.id === styleConfig.font)!;

  const themeStyles = {
    '--theme-bg': currentPalette.colors.bg, 
    '--theme-primary': currentPalette.colors.primary,
    '--theme-secondary': currentPalette.colors.secondary, 
    '--theme-text': currentPalette.colors.text,
    fontFamily: currentFont.family,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden" style={themeStyles}>
      <ImagePicker isOpen={imagePickerOpen} onClose={() => setImagePickerOpen(false)} initialQuery="professional" onSelect={(url) => {
          if(!ebookData || !activeImageEdit) return;
          const newData = {...ebookData};
          const page = newData.paginas[activeImageEdit.pageIndex];
          if(activeImageEdit.field === 'item') page.conteudo.itens![activeImageEdit.itemIndex!].custom_image_url = url;
          else page.conteudo.custom_image_url = url;
          setEbookData(newData);
          setImagePickerOpen(false);
      }} unsplashAccessKey={unsplashKey} />

      {/* Export UI */}
      {showExportModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 border-8 border-white">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Exportar Projeto</h3>
                <button onClick={() => setShowExportModal(false)} className="p-2 bg-slate-100 rounded-full"><X/></button>
             </div>
             <div className="bg-blue-50 p-6 rounded-3xl mb-8 flex items-center gap-4">
                <div className="bg-blue-600 text-white p-4 rounded-2xl"><FileType size={32}/></div>
                <div>
                   <p className="font-bold text-slate-900">Modo Arquitetura Master</p>
                   <p className="text-xs text-slate-500">Escolha o formato ideal para sua necessidade.</p>
                </div>
             </div>
             <div className="flex flex-col gap-4">
                <button onClick={runExport} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                  <FileType size={24}/> Exportar PDF Master
                </button>
                <button onClick={handleExportPptx} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                  <Monitor size={24}/> Exportar para Google Slides
                </button>
             </div>
          </div>
        </div>
      )}

      {exporting && (
        <div className="fixed inset-0 z-[600] bg-slate-950 flex flex-col items-center justify-center p-10 text-white animate-in fade-in">
           {!exportFinished ? (
             <div className="max-w-md w-full text-center">
                <div className="text-6xl font-black mb-8 animate-pulse">{exportProgress}%</div>
                <div className="w-full h-4 bg-white/10 rounded-full mb-6 overflow-hidden">
                   <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${exportProgress}%` }}></div>
                </div>
                <p className="text-blue-400 font-bold uppercase tracking-widest text-xs">{exportStatus}</p>
             </div>
           ) : (
             <div className="text-center animate-in zoom-in">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/40"><CheckCircle size={48}/></div>
                <h2 className="text-5xl font-black mb-12">{generatedPdf ? "Ebook Pronto!" : "Slides Prontos!"}</h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                   {generatedPdf ? (
                     <>
                       <button onClick={openPdf} className="bg-blue-600 px-10 py-5 rounded-3xl font-bold flex items-center gap-3 hover:bg-blue-700 transition-all"><ExternalLink/> Abrir em Nova Aba</button>
                       <button onClick={downloadPdf} className="bg-white text-slate-900 px-10 py-5 rounded-3xl font-bold flex items-center gap-3 hover:bg-slate-100 transition-all"><Download/> Baixar PDF</button>
                     </>
                   ) : (
                     <div className="bg-white/10 p-8 rounded-[2rem] border border-white/20 max-w-md">
                       <p className="text-xl font-light mb-4 text-white/80">O arquivo <b>.pptx</b> foi gerado e o download deve ter iniciado automaticamente.</p>
                       <p className="text-sm text-blue-400 font-bold uppercase tracking-widest">Dica: Importe este arquivo no Google Slides para edição total.</p>
                     </div>
                   )}
                </div>
                <button onClick={() => setExporting(false)} className="mt-12 text-white/30 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Voltar ao Editor</button>
             </div>
           )}
        </div>
      )}

      {/* Hidden Buffer for PDF Generation */}
      <div ref={exportBufferRef} className="fixed left-[-9999px] top-0 bg-white" style={{ 
        display: 'none',
        width: `${ASPECT_RATIO_CONFIG[selectedRatio].renderWidth}px`,
        height: `${ASPECT_RATIO_CONFIG[selectedRatio].renderWidth * (ASPECT_RATIO_CONFIG[selectedRatio].height / ASPECT_RATIO_CONFIG[selectedRatio].width)}px`,
        overflow: 'hidden'
      }}>
          {ebookData && (
            <div className="active-slide" style={{
              width: '100%',
              height: '100%'
            }}>
              {renderPage(ebookData.paginas[currentPage], true)}
            </div>
          )}
      </div>

      {/* Main Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 p-6 no-print">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setEbookData(null)}>
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><BookOpen size={28} /></div>
              <div>
                  <h1 className="font-black text-xl tracking-tighter text-slate-900">IDLE Engine</h1>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Master Edition v6.5</p>
              </div>
          </div>
          <div className="flex items-center gap-4">
              {ebookData && <div className="px-6 py-2 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 border hidden md:block">{ebookData.metadados.titulo_gerado}</div>}
              <button onClick={() => setShowSettings(!showSettings)} className="p-4 bg-white border rounded-2xl hover:bg-slate-50"><Settings size={20}/></button>
          </div>
        </div>
        {showSettings && (
            <div className="absolute right-6 top-full mt-4 w-96 bg-white rounded-3xl shadow-2xl border p-8 z-50 animate-in slide-in-from-top-4 max-h-[80vh] overflow-y-auto">
                <h4 className="font-black mb-6 text-lg flex items-center gap-2 border-b pb-4"><Key size={18}/> Configurações</h4>
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">🤖 Provedor de IA</label>
                        <select value={aiProvider} onChange={e => setAiProvider(e.target.value as AIProvider)} className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 text-sm outline-none font-bold hover:border-blue-400 focus:border-blue-500 transition-colors">
                            <option value="gemini">🔷 Google Gemini</option>
                            <option value="openai">🟢 OpenAI (GPT-4)</option>
                            <option value="local">💻 IA Local (Ollama/LM Studio)</option>
                        </select>
                    </div>
                    
                    {aiProvider === 'gemini' && (
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                            <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2 block">Gemini API Key</label>
                            <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="Sua chave Gemini..." className="w-full bg-white p-4 rounded-xl border border-blue-200 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                            <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2 block mt-3">Modelo (opcional)</label>
                            <input type="text" value={selectedModel} onChange={e => setSelectedModel(e.target.value)} placeholder="gemini-3-pro-preview" className="w-full bg-white p-4 rounded-xl border border-blue-200 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                            <p className="text-[9px] text-blue-600 mt-2">Obtenha sua chave em: ai.google.dev</p>
                        </div>
                    )}
                    
                    {aiProvider === 'openai' && (
                        <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
                            <label className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-2 block">OpenAI API Key</label>
                            <input type="password" value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} placeholder="sk-..." className="w-full bg-white p-4 rounded-xl border border-green-200 text-sm outline-none focus:ring-2 focus:ring-green-400" />
                            <label className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-2 block mt-3">Modelo (opcional)</label>
                            <input type="text" value={selectedModel} onChange={e => setSelectedModel(e.target.value)} placeholder="gpt-4o" className="w-full bg-white p-4 rounded-xl border border-green-200 text-sm outline-none focus:ring-2 focus:ring-green-400" />
                            <p className="text-[9px] text-green-600 mt-2">Obtenha sua chave em: platform.openai.com</p>
                        </div>
                    )}
                    
                    {aiProvider === 'local' && (
                        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
                            <label className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-2 block">URL da IA Local</label>
                            <input type="text" value={localAiUrl} onChange={e => setLocalAiUrl(e.target.value)} placeholder="http://localhost:1234" className="w-full bg-white p-4 rounded-xl border border-purple-200 text-sm outline-none focus:ring-2 focus:ring-purple-400" />
                            <p className="text-[9px] text-purple-600 mt-1">LM Studio: :1234 | Ollama: :11434</p>
                            <label className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-2 block mt-3">Modelo</label>
                            <input type="text" value={selectedModel} onChange={e => setSelectedModel(e.target.value)} placeholder="gemma-3-4b, llama3.2, etc" className="w-full bg-white p-4 rounded-xl border border-purple-200 text-sm outline-none focus:ring-2 focus:ring-purple-400" />
                            <p className="text-[9px] text-purple-600 mt-2">✅ Detecta automaticamente Ollama ou LM Studio</p>
                            <p className="text-[9px] text-purple-600">🔒 Privacidade total - sem envio de dados</p>
                        </div>
                    )}
                    
                    <div className="border-t pt-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">📷 Unsplash Access Key (Opcional)</label>
                        <input type="password" value={unsplashKey} onChange={e => setUnsplashKey(e.target.value)} placeholder="Para buscar imagens online..." className="w-full bg-slate-50 p-4 rounded-2xl border text-sm outline-none focus:ring-2 focus:ring-slate-400" />
                        <p className="text-[9px] text-slate-400 mt-2">Deixe vazio para usar apenas imagens locais</p>
                    </div>

                    {/* Status da Conexão */}
                    {connectionMessage && (
                        <div className={`p-4 rounded-2xl border-2 animate-in fade-in slide-in-from-top-2 ${
                            connectionStatus === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                            connectionStatus === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                            'bg-blue-50 border-blue-200 text-blue-700'
                        }`}>
                            <p className="text-sm font-bold">{connectionMessage}</p>
                        </div>
                    )}

                    {/* Botões de Ação */}
                    <div className="flex gap-3 border-t pt-4">
                        <button
                            onClick={handleTestConnection}
                            disabled={testingConnection}
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-4 px-6 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {testingConnection ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Testando...
                                </>
                            ) : (
                                <>
                                    <HelpCircle size={16} />
                                    Testar Conexão
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleSaveConfig}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={16} />
                            Salvar
                        </button>
                    </div>
                </div>
            </div>
        )}
      </header>

      {/* Main UI */}
      <main className="max-w-7xl mx-auto p-6 py-12">
        {workflowStep === 'input' && !loading ? (
          <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-12">
             <div className="text-center space-y-6">
                <h2 className="text-7xl font-black text-slate-900 tracking-tighter leading-none">Design Inteligente.<br/>Páginas Reais.</h2>
                <p className="text-xl text-slate-500 max-w-xl mx-auto">Converta textos brutos em ebooks diagramados com texto vetorial e fidelidade de impressão.</p>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-6">
                   <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Formato de Saída</label>
                      <div className="space-y-3">
                         {(['A4', '16:9', '9:16'] as AspectRatio[]).map(r => (
                            <button key={r} onClick={() => setSelectedRatio(r)} className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl border-2 transition-all font-black text-sm ${selectedRatio === r ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' : 'bg-slate-50 border-transparent hover:border-slate-200 text-slate-600'}`}>
                               <div className="flex items-center gap-3">
                                  {r === '16:9' ? <Monitor size={18}/> : r === '9:16' ? <Smartphone size={18}/> : <File size={18}/>}
                                  {r === 'A4' ? 'Documento A4' : r === '16:9' ? 'Apresentação 16:9' : 'Vertical 9:16'}
                                </div>
                               {selectedRatio === r && <CheckCircle size={18}/>}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>
                <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] shadow-2xl border flex flex-col group">
                   <div className="flex justify-between items-center mb-6">
                      <span className="flex items-center gap-2 font-black text-slate-900 uppercase text-xs tracking-widest"><FileText size={16}/> Seu Texto</span>
                      <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:underline"><Upload size={14}/> Importar Arquivo</button>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md,.docx" onChange={handleFileUpload}/>
                   </div>
                   <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Cole o conteúdo bruto aqui para diagramação automática..." className="w-full flex-1 min-h-[400px] p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-100 outline-none text-xl resize-none font-sans transition-all focus:bg-white"></textarea>
                   {error && (
                     <div className="mt-4 p-6 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                       <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-1" />
                       <div className="flex-1">
                         <p className="font-bold text-red-900 text-lg mb-1">Erro</p>
                         <p className="text-red-700">{error}</p>
                       </div>
                       <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 p-1">
                         <X size={20} />
                       </button>
                     </div>
                   )}
                   <button onClick={handleGenerate} disabled={!inputText.trim()} className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-8 rounded-[2rem] font-black text-3xl shadow-2xl disabled:opacity-30 hover:-translate-y-1 transition-all flex items-center justify-center gap-4"><Sparkles size={32}/> Analisar Conteúdo</button>
                </div>
             </div>
          </div>
        ) : workflowStep === 'selection' && !loading ? (
          <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in zoom-in-95">
             <div className="flex justify-between items-end">
                <div>
                   <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Escolha os Layouts</h2>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Personalize a diagramação de cada seção</p>
                </div>
                <button onClick={handleFinalizeLayout} className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-6 rounded-[2rem] font-black text-2xl shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-4">
                   <CheckCircle size={28}/> Finalizar Diagramação
                </button>
             </div>
             
             <div className="grid grid-cols-1 gap-8">
                {contentChunks.map((chunk, idx) => (
                   <div key={idx} className="bg-white p-10 rounded-[3rem] shadow-xl border flex flex-col lg:flex-row gap-10 items-start group hover:border-blue-200 transition-all">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-blue-200">{idx + 1}</div>
                        <div className="hidden lg:block w-px h-full bg-slate-100" />
                      </div>
                      
                      <div className="flex-1 space-y-4">
                         <div className="space-y-1">
                            <h4 className="font-black text-2xl text-slate-900 tracking-tight">{chunk.title}</h4>
                            <p className="text-slate-500 text-lg leading-relaxed">{chunk.summary}</p>
                         </div>
                         <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Conteúdo Original</p>
                            <p className="text-slate-600 text-sm line-clamp-3 italic">"{chunk.content}"</p>
                         </div>
                      </div>

                      <div className="w-full lg:w-80 space-y-6">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Visualização do Modelo</label>
                            <LayoutPreview type={selectedLayouts[idx]} />
                         </div>
                         
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Selecione o Layout</label>
                            <select 
                               value={selectedLayouts[idx]} 
                               onChange={e => setSelectedLayouts({...selectedLayouts, [idx]: e.target.value})}
                               className="w-full bg-white p-5 rounded-2xl border-2 border-slate-200 font-bold text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none shadow-sm"
                               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1.5em' }}
                            >
                               <optgroup label="Capas">
                                  <option value="capa_principal">Capa Principal</option>
                                  <option value="capa_secao">Capa de Seção</option>
                               </optgroup>
                               <optgroup label="Conteúdo Base">
                                  <option value="texto_imagem_split">Texto + Imagem (Split)</option>
                                  <option value="grid_informativo">Grid de Informações</option>
                                  <option value="three_column">Três Colunas</option>
                               </optgroup>
                               <optgroup label="Destaques & Dados">
                                  <option value="destaque_numero">Destaque Numérico</option>
                                  <option value="timeline">Linha do Tempo</option>
                                  <option value="full_image_quote">Citação com Imagem</option>
                               </optgroup>
                               <optgroup label="Estruturas Avançadas">
                                  <option value="comparison_table">Tabela Comparativa</option>
                                  <option value="feature_list">Lista de Recursos</option>
                                  <option value="process_steps">Etapas do Processo</option>
                                  <option value="team_grid">Grade de Equipe</option>
                                  <option value="pricing_table">Tabela de Preços</option>
                                  <option value="faq_section">Seção de FAQ</option>
                               </optgroup>
                               <optgroup label="Finalização">
                                  <option value="conclusao_cta">Conclusão & CTA</option>
                               </optgroup>
                            </select>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
             <button onClick={() => setWorkflowStep('input')} className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600 transition-colors">← Voltar para o texto</button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
             <Loader2 size={80} className="animate-spin text-blue-600 mb-8" />
             <h3 className="text-4xl font-black text-slate-900 tracking-tight">IDLE Processando...</h3>
             <p className="text-slate-400 font-bold uppercase tracking-[0.4em] mt-2">{exportStatus || "Diagramando Arquitetura de Informação"}</p>
          </div>
        ) : workflowStep === 'result' && ebookData && (
          <div className="flex flex-col xl:flex-row gap-12">
             <div className="flex-[3] flex flex-col items-center">
                <div className={`bg-white shadow-[0_50px_100px_rgba(0,0,0,0.15)] rounded-[3rem] overflow-hidden relative border-[12px] border-white transition-all duration-500 
                   ${selectedRatio === '16:9' ? 'aspect-video w-full max-w-4xl' : selectedRatio === '9:16' ? 'aspect-[9/16] h-[800px]' : 'aspect-[210/297] w-full max-w-2xl'}`}>
                   {regeneratingPage && <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-xl flex items-center justify-center"><Loader2 size={64} className="animate-spin text-blue-600"/></div>}
                   {renderPage(ebookData.paginas[currentPage])}
                </div>
                <div className="mt-12 flex items-center gap-8 bg-white p-4 px-10 rounded-full shadow-2xl border">
                   <button disabled={currentPage === 0} onClick={() => setCurrentPage(c => c - 1)} className="p-3 hover:bg-slate-100 rounded-2xl disabled:opacity-10"><ChevronLeft size={32}/></button>
                   <div className="text-center min-w-[100px]">
                      <p className="text-4xl font-black text-slate-900 leading-none">{currentPage + 1}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">de {ebookData.paginas.length}</p>
                   </div>
                   <button disabled={currentPage === ebookData.paginas.length - 1} onClick={() => setCurrentPage(c => c + 1)} className="p-3 hover:bg-slate-100 rounded-2xl disabled:opacity-10"><ChevronRight size={32}/></button>
                </div>
             </div>
             
             <div className="flex-1 space-y-6">
                <button onClick={() => setShowExportModal(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-8 rounded-[2.5rem] font-black text-2xl shadow-xl flex items-center justify-center gap-4 transition-all hover:-translate-y-1"><FileType size={32}/> Exportar Master</button>
                <button onClick={handleRegeneratePage} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-3xl font-black flex items-center justify-center gap-4 shadow-lg transition-all"><Shuffle size={20}/> Remix Layout</button>
                <button onClick={() => setWorkflowStep('selection')} className="w-full bg-white border-2 border-slate-200 text-slate-600 py-4 rounded-3xl font-black flex items-center justify-center gap-4 hover:bg-slate-50 transition-all text-sm uppercase tracking-widest"><Layers size={18}/> Alterar Layouts</button>
                
                <div className="bg-white p-6 rounded-[3rem] border shadow-sm max-h-[400px] overflow-y-auto space-y-2 custom-scrollbar">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-4 border-b pb-4">Estrutura de Páginas</p>
                   {ebookData.paginas.map((p, i) => (
                      <button key={i} onClick={() => setCurrentPage(i)} className={`w-full text-left p-4 rounded-2xl transition-all ${currentPage === i ? 'bg-blue-600 text-white shadow-lg scale-105 z-10' : 'hover:bg-slate-50'}`}>
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">Pág {i+1}</span>
                            {p.locked && <Lock size={12}/>}
                         </div>
                         <p className="font-black text-sm truncate">{p.conteudo.titulo || p.conteudo.titulo_secao || "Conteúdo"}</p>
                      </button>
                   ))}
                </div>
             </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-2xl border-t p-5 px-12 flex justify-between items-center z-40 no-print">
          <div className="flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <div className={`w-3 h-3 rounded-full shadow-lg ${ebookData ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
              {ebookData ? 'Projeto Ativo' : 'Pronto para Diagramar'}
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.8em] flex items-center gap-4">
              <HelpCircle size={14} />
              Editorial Engine v6.5 Master HD
          </div>
      </footer>
    </div>
  );
};

export default App;
