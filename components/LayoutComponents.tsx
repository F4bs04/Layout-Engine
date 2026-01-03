
import React, { useState, useEffect, useRef } from 'react';
import { PageContent } from '../types';
import { ArrowRight, Star, CheckCircle, Zap, Layout, Quote, Pencil, Image as ImageIcon, ImageOff, Users, List, TrendingUp, DollarSign, HelpCircle as FAQIcon, ArrowRightCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

type EditImageHandler = (field: 'main' | 'background' | 'item', index?: number) => void;
type EditIconHandler = (itemIndex: number) => void;
type UpdateContentHandler = (updates: Partial<PageContent>) => void;

interface LayoutProps {
  content: PageContent;
  onEditImage?: EditImageHandler;
  onEditIcon?: EditIconHandler;
  onUpdate?: UpdateContentHandler;
}

const EditableText = ({ 
  value, 
  onSave, 
  className = "", 
  multiline = false,
  tag: Tag = "div" as any,
  children
}: { 
  value?: string, 
  onSave: (val: string) => void, 
  className?: string, 
  multiline?: boolean,
  tag?: any,
  children?: React.ReactNode
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (currentValue !== value) onSave(currentValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) handleBlur();
    if (e.key === 'Escape') {
      setCurrentValue(value || "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return multiline ? (
      <textarea
        ref={inputRef}
        autoFocus
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-blue-50/50 border-b-2 border-blue-500 outline-none p-1 rounded transition-all resize-none ${className}`}
        rows={4}
      />
    ) : (
      <input
        ref={inputRef}
        autoFocus
        type="text"
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-blue-50/50 border-b-2 border-blue-500 outline-none p-1 rounded transition-all ${className}`}
      />
    );
  }

  return (
    <Tag 
      onClick={() => setIsEditing(true)}
      className={`cursor-text hover:bg-blue-500/10 hover:ring-2 hover:ring-blue-400 transition-all rounded px-1 -mx-1 group relative ${className}`}
    >
      {children || currentValue || <span className="opacity-30 italic">Clique para editar...</span>}
      <Pencil size={12} className="absolute -right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none no-print text-blue-500" />
    </Tag>
  );
};

const DynamicIcon = ({ name, className, size = 24 }: { name?: string, className?: string, size?: number }) => {
  if (!name) return <CheckCircle size={size} className={className} />;
  // @ts-ignore
  const IconComp = LucideIcons[name];
  return IconComp ? <IconComp size={size} className={className} /> : <CheckCircle size={size} className={className} />;
};

const ImagePlaceholder = ({ 
  prompt, 
  customUrl,
  className = "h-64", 
  overlay = false,
  onEdit
}: { 
  prompt?: string, 
  customUrl?: string,
  className?: string,
  overlay?: boolean,
  onEdit?: () => void
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const imageUrl = React.useMemo(() => {
    if (customUrl) return customUrl;
    const basePrompt = (prompt || "professional abstract background").split(',')[0];
    const encodedPrompt = encodeURIComponent(basePrompt);
    const seed = basePrompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&seed=${seed}&nologo=true&model=flux`;
  }, [prompt, customUrl]);

  useEffect(() => {
    setHasError(false);
    setImageLoaded(false);
  }, [imageUrl]);

  return (
    <div className={`relative overflow-hidden bg-slate-200 group ${className}`}>
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4">
           <ImageOff size={48} className="mb-2 opacity-50" />
           <span className="text-xs font-bold opacity-50 uppercase tracking-widest text-center">Imagem indisponível</span>
        </div>
      ) : (
        <>
           <div className={`absolute inset-0 bg-slate-300 animate-pulse transition-opacity duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`} />
           <img 
            src={imageUrl} 
            alt={prompt || "Layout image"} 
            crossOrigin="anonymous"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 ${imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'}`} 
          />
        </>
      )}
      
      {overlay && <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />}
      
      {onEdit && (
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-800 p-3 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all z-20 hover:scale-110 no-print border border-slate-200"
        >
          <ImageIcon size={18} />
        </button>
      )}
    </div>
  );
};

export const CoverPage: React.FC<LayoutProps> = ({ content, onEditImage, onUpdate }) => {
  const hasBgImage = !!content.prompt_imagem || !!content.custom_image_url;
  return (
    <div className="h-full relative overflow-hidden flex flex-col justify-center items-center text-center p-8 animate-in fade-in duration-1000">
      {hasBgImage && <div className="absolute inset-0 z-0"><ImagePlaceholder prompt={content.prompt_imagem} customUrl={content.custom_image_url} className="h-full w-full" overlay={true} onEdit={() => onEditImage?.('background')} /></div>}
      <div className={`absolute inset-0 z-0 ${hasBgImage ? 'bg-gradient-to-t from-black/90 via-black/40 to-black/10' : 'bg-slate-50'}`}></div>
      <div className="relative z-10 flex flex-col items-center max-w-4xl px-4 animate-in slide-in-from-bottom-12 duration-1000">
        <div className={`mb-10 p-6 rounded-3xl shadow-2xl ${hasBgImage ? 'bg-white/10 backdrop-blur-lg border border-white/20 text-white' : 'bg-blue-600 text-white shadow-blue-200'}`}><Layout size={56} /></div>
        <EditableText value={content.titulo} onSave={(v) => onUpdate?.({ titulo: v })} tag="h1" className={`text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight ${hasBgImage ? 'text-white drop-shadow-2xl' : 'text-slate-900'}`} />
        <EditableText value={content.subtitulo} onSave={(v) => onUpdate?.({ subtitulo: v })} className={`text-2xl md:text-3xl font-light mb-12 max-w-2xl mx-auto ${hasBgImage ? 'text-white/80' : 'text-slate-600'}`} />
        <EditableText value={content.autor} onSave={(v) => onUpdate?.({ autor: v })} className={`mt-12 text-sm font-black uppercase tracking-[0.4em] ${hasBgImage ? 'text-white/60' : 'text-slate-400'}`} />
      </div>
    </div>
  );
};

export const SectionCover: React.FC<LayoutProps> = ({ content, onEditImage, onUpdate }) => {
  const hasBgImage = !!content.prompt_imagem || !!content.custom_image_url;
  return (
    <div className="h-full flex flex-col justify-center items-start p-16 relative overflow-hidden text-white animate-in slide-in-from-left duration-700">
       <div className="absolute inset-0 z-0 bg-blue-600">
          {hasBgImage && <ImagePlaceholder prompt={content.prompt_imagem} customUrl={content.custom_image_url} className="h-full w-full" overlay={true} onEdit={() => onEditImage?.('background')} />}
          <div className="absolute inset-0 bg-blue-900/50 mix-blend-multiply"></div>
       </div>
      <div className="absolute top-0 right-0 p-48 opacity-10 transform translate-x-20 -translate-y-20 z-0"><Star size={400} fill="currentColor" /></div>
      <div className="relative z-10 max-w-4xl animate-in fade-in zoom-in duration-1000">
        <div className="text-xs font-black uppercase tracking-[0.5em] opacity-80 mb-8 border-l-4 border-white/50 pl-6">Capítulo</div>
        <EditableText value={content.titulo_secao} onSave={(v) => onUpdate?.({ titulo_secao: v })} tag="h1" className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tighter" />
        <EditableText value={content.breve_descricao} onSave={(v) => onUpdate?.({ breve_descricao: v })} multiline className="text-2xl md:text-3xl opacity-90 font-light border-t border-white/20 pt-10 leading-relaxed" />
      </div>
    </div>
  );
};

export const TextImageSplit: React.FC<LayoutProps> = ({ content, onEditImage, onUpdate }) => {
  const isRight = content.lado_imagem === 'right';
  return (
    <div className={`h-full flex flex-col md:flex-row items-stretch bg-white animate-in fade-in duration-700`}>
      <div className={`flex-[1.2] flex flex-col justify-center p-12 md:p-20 ${isRight ? 'order-1' : 'order-2'} animate-in slide-in-from-bottom-8 duration-1000`}>
        <EditableText value={content.titulo} onSave={(v) => onUpdate?.({ titulo: v })} tag="h3" className="text-4xl md:text-5xl font-black text-slate-900 mb-10 leading-tight tracking-tight" />
        <EditableText value={content.texto_adaptado} onSave={(v) => onUpdate?.({ texto_adaptado: v })} multiline className="text-xl md:text-2xl text-slate-500 leading-relaxed font-light" />
      </div>
      <div className={`flex-1 relative min-h-[400px] ${isRight ? 'order-2' : 'order-1'}`}>
        <ImagePlaceholder prompt={content.prompt_imagem} customUrl={content.custom_image_url} className="absolute inset-0 h-full w-full" onEdit={() => onEditImage?.('main')} />
      </div>
    </div>
  );
};

export const GridInfo: React.FC<LayoutProps> = ({ content, onEditIcon, onUpdate }) => {
  const handleItemUpdate = (idx: number, field: string, value: string) => {
    const newItems = [...(content.itens || [])];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onUpdate?.({ itens: newItems });
  };
  return (
    <div className="h-full flex flex-col p-12 md:p-16 bg-slate-50 animate-in fade-in duration-700 overflow-hidden">
      <EditableText value={content.titulo} onSave={(v) => onUpdate?.({ titulo: v })} tag="h3" className="text-4xl font-black text-slate-800 mb-12 border-b-4 border-blue-600/20 pb-8 inline-block" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 overflow-y-auto pr-4 custom-scrollbar">
        {content.itens?.map((item, idx) => (
          <div key={idx} style={{ animationDelay: `${idx * 150}ms` }} className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-white group relative animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both">
            <button onClick={() => onEditIcon?.(idx)} className="mb-8 w-16 h-16 rounded-[1.2rem] bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md transform group-hover:rotate-6"><DynamicIcon name={item.icon_name} size={32} /></button>
            <EditableText value={item.titulo_item} onSave={(v) => handleItemUpdate(idx, 'titulo_item', v)} tag="h4" className="font-bold text-2xl text-slate-900 mb-4 tracking-tight" />
            <EditableText value={item.desc_item} onSave={(v) => handleItemUpdate(idx, 'desc_item', v)} multiline className="text-slate-500 leading-relaxed text-base font-light" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ThreeColumn: React.FC<LayoutProps> = ({ content, onEditImage, onUpdate }) => {
  const handleItemUpdate = (idx: number, field: string, value: string) => {
    const newItems = [...(content.itens || [])];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onUpdate?.({ itens: newItems });
  };
  return (
    <div className="h-full flex flex-col p-12 md:p-16 bg-white animate-in fade-in duration-700">
      <EditableText value={content.titulo} onSave={(v) => onUpdate?.({ titulo: v })} tag="h3" className="text-4xl md:text-5xl font-black text-center text-slate-900 mb-16 tracking-tight" />
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-10">
        {content.itens?.slice(0, 3).map((item, idx) => (
          <div key={idx} style={{ animationDelay: `${idx * 200}ms` }} className="flex flex-col h-full bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-700 fill-mode-both shadow-lg">
            <div className="h-56 w-full relative"><ImagePlaceholder prompt={`${item.icone_keyword || ''} ${content.prompt_imagem || 'object'}`} customUrl={item.custom_image_url} className="h-full" onEdit={() => onEditImage?.('item', idx)} /></div>
            <div className="p-10 flex-1">
              <EditableText value={item.titulo_item} onSave={(v) => handleItemUpdate(idx, 'titulo_item', v)} tag="h4" className="font-bold text-xl text-slate-900 mb-4 tracking-tight" />
              <EditableText value={item.desc_item} onSave={(v) => handleItemUpdate(idx, 'desc_item', v)} multiline className="text-base text-slate-500 leading-relaxed font-light" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const FullImageQuote: React.FC<LayoutProps> = ({ content, onEditImage, onUpdate }) => (
  <div className="h-full relative flex flex-col justify-center items-center p-16 text-center rounded-lg overflow-hidden animate-in zoom-in duration-1000">
    <div className="absolute inset-0 z-0"><ImagePlaceholder prompt={content.prompt_imagem} customUrl={content.custom_image_url} className="h-full w-full" overlay={true} onEdit={() => onEditImage?.('background')} /></div>
    <div className="relative z-10 max-w-5xl animate-in fade-in slide-in-from-top-12 duration-1000">
      <Quote size={80} className="text-white/40 mx-auto mb-12" />
      <EditableText value={content.citacao || content.texto_adaptado} onSave={(v) => onUpdate?.({ citacao: v })} multiline className="text-4xl md:text-6xl font-serif italic text-white leading-tight mb-12 drop-shadow-2xl tracking-tight" />
      <div className="h-1 w-24 bg-blue-500 mx-auto mb-8"></div>
      <EditableText value={content.autor_citacao || content.autor} onSave={(v) => onUpdate?.({ autor_citacao: v })} className="text-2xl text-white font-black tracking-[0.3em] uppercase" />
    </div>
  </div>
);

export const Timeline: React.FC<LayoutProps> = ({ content, onUpdate }) => {
  const handleStepUpdate = (idx: number, field: string, value: string) => {
    const newSteps = [...(content.steps || [])];
    newSteps[idx] = { ...newSteps[idx], [field]: value };
    onUpdate?.({ steps: newSteps });
  };
  return (
    <div className="h-full flex flex-col p-12 md:p-20 bg-white animate-in fade-in duration-700">
      <EditableText value={content.titulo} onSave={(v) => onUpdate?.({ titulo: v })} tag="h3" className="text-4xl md:text-5xl font-black text-slate-900 mb-16 tracking-tighter" />
      <div className="flex-1 flex flex-col justify-center gap-10">
        {content.steps?.map((step, idx) => (
          <div key={idx} style={{ animationDelay: `${idx * 200}ms` }} className="flex gap-10 items-start group animate-in slide-in-from-left-8 duration-700 fill-mode-both">
            <div className="flex flex-col items-center gap-4">
               <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg transform group-hover:scale-110">{idx + 1}</div>
               {idx !== (content.steps?.length || 0) - 1 && <div className="w-1 h-full bg-slate-100 group-hover:bg-blue-100 transition-colors min-h-[50px]"></div>}
            </div>
            <div className="pb-12">
              <EditableText value={step.step_title} onSave={(v) => handleStepUpdate(idx, 'step_title', v)} tag="h4" className="text-3xl font-bold text-slate-900 mb-4 tracking-tight" />
              <EditableText value={step.step_desc} onSave={(v) => handleStepUpdate(idx, 'step_desc', v)} multiline className="text-xl text-slate-500 leading-relaxed max-w-4xl font-light" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatHighlight: React.FC<LayoutProps> = ({ content, onEditImage, onUpdate }) => (
  <div className="h-full flex flex-col justify-center items-center p-16 bg-slate-950 text-white relative overflow-hidden animate-in fade-in duration-1000">
    <div className="absolute inset-0 opacity-40"><ImagePlaceholder prompt={content.prompt_fundo_abstrato || "abstract background"} customUrl={content.custom_image_url} className="h-full w-full" onEdit={() => onEditImage?.('background')} /></div>
    <div className="absolute inset-0 bg-slate-950/80"></div>
    <div className="relative z-10 text-center max-w-5xl animate-in zoom-in duration-1200">
      <div className="inline-block px-8 py-3 rounded-full border border-blue-500/50 bg-blue-500/10 text-blue-400 text-sm font-black uppercase tracking-[0.5em] mb-12">Métrica Chave</div>
      <EditableText value={content.numero_grande} onSave={(v) => onUpdate?.({ numero_grande: v })} className="text-[12rem] md:text-[15rem] font-black text-white mb-8 tracking-tighter leading-none drop-shadow-2xl" />
      <EditableText value={content.texto_explicativo} onSave={(v) => onUpdate?.({ texto_explicativo: v })} multiline className="text-3xl md:text-5xl font-light text-slate-300 leading-tight tracking-tight" />
    </div>
  </div>
);

export const ConclusionCTA: React.FC<LayoutProps> = ({ content, onUpdate }) => (
  <div className="h-full flex flex-col justify-center items-center text-center p-20 bg-emerald-50 relative overflow-hidden animate-in slide-in-from-bottom-12 duration-1000">
    <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500"></div>
    <div className="mb-12 p-10 bg-white rounded-[2rem] text-emerald-600 shadow-2xl animate-bounce duration-[2000ms]"><Zap size={72} /></div>
    <EditableText value={content.titulo_final} onSave={(v) => onUpdate?.({ titulo_final: v })} tag="h2" className="text-6xl md:text-8xl font-black text-slate-900 mb-10 tracking-tighter leading-none" />
    <EditableText value={content.texto_resumo} onSave={(v) => onUpdate?.({ texto_resumo: v })} multiline className="text-2xl md:text-3xl text-slate-600 max-w-4xl mb-16 leading-relaxed font-light" />
    <button className="group flex items-center gap-6 bg-slate-900 hover:bg-emerald-600 text-white font-black py-6 px-16 rounded-[2rem] transition-all shadow-2xl hover:-translate-y-2 active:scale-95">
      <EditableText value={content.texto_botao_acao} onSave={(v) => onUpdate?.({ texto_botao_acao: v })} className="text-2xl" />
      <ArrowRight size={32} className="group-hover:translate-x-3 transition-transform" />
    </button>
  </div>
);

export const ComparisonTable: React.FC<LayoutProps> = ({ content, onUpdate }) => {
  const handleItemUpdate = (idx: number, field: string, value: string) => {
    const newItems = [...(content.itens || [])];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onUpdate?.({ itens: newItems });
  };
  return (
    <div className="h-full flex flex-col p-12 md:p-20 bg-white animate-in fade-in duration-700">
      <EditableText value={content.titulo} onSave={(v) => onUpdate?.({ titulo: v })} tag="h3" className="text-4xl font-black text-slate-900 mb-12 tracking-tight" />
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-6 text-left border-b-2 border-slate-200 font-black text-slate-400 uppercase tracking-widest text-xs">Recurso</th>
              <th className="p-6 text-left border-b-2 border-slate-200 font-black text-slate-400 uppercase tracking-widest text-xs">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {content.itens?.map((item, idx) => (
              <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                <td className="p-6 border-b border-slate-100">
                  <EditableText value={item.titulo_item} onSave={(v) => handleItemUpdate(idx, 'titulo_item', v)} className="font-bold text-slate-900" />
                </td>
                <td className="p-6 border-b border-slate-100">
                  <EditableText value={item.desc_item} onSave={(v) => handleItemUpdate(idx, 'desc_item', v)} className="text-slate-500" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const FeatureList: React.FC<LayoutProps> = ({ content, onEditIcon, onUpdate }) => {
  const handleItemUpdate = (idx: number, field: string, value: string) => {
    const newItems = [...(content.itens || [])];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onUpdate?.({ itens: newItems });
  };
  return (
    <div className="h-full flex flex-col p-12 md:p-20 bg-slate-50 animate-in slide-in-from-right duration-700">
      <EditableText value={content.titulo} onSave={(v) => onUpdate?.({ titulo: v })} tag="h3" className="text-5xl font-black text-slate-900 mb-16 tracking-tighter" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {content.itens?.map((item, idx) => (
          <div key={idx} className="flex items-start gap-6 p-8 bg-white rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
            <button onClick={() => onEditIcon?.(idx)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
              <DynamicIcon name={item.icon_name} size={28} />
            </button>
            <div>
              <EditableText value={item.titulo_item} onSave={(v) => handleItemUpdate(idx, 'titulo_item', v)} tag="h4" className="text-xl font-bold text-slate-900 mb-2" />
              <EditableText value={item.desc_item} onSave={(v) => handleItemUpdate(idx, 'desc_item', v)} multiline className="text-slate-500 leading-relaxed" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProcessSteps: React.FC<LayoutProps> = ({ content, onUpdate }) => {
  const handleStepUpdate = (idx: number, field: string, value: string) => {
    const newSteps = [...(content.steps || [])];
    newSteps[idx] = { ...newSteps[idx], [field]: value };
    onUpdate?.({ steps: newSteps });
  };
  return (
    <div className="h-full flex flex-col p-12 md:p-20 bg-white animate-in fade-in duration-700">
      <EditableText value={content.titulo} onSave={(v) => onUpdate?.({ titulo: v })} tag="h3" className="text-4xl font-black text-slate-900 mb-20 text-center tracking-tight" />
      <div className="flex flex-col md:flex-row justify-between items-start gap-10 relative">
        <div className="hidden md:block absolute top-10 left-0 right-0 h-1 bg-slate-100 z-0"></div>
        {content.steps?.map((step, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center text-center relative z-10 group">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl font-black mb-8 shadow-xl group-hover:scale-110 transition-transform">
              {idx + 1}
            </div>
            <EditableText value={step.step_title} onSave={(v) => handleStepUpdate(idx, 'step_title', v)} tag="h4" className="text-xl font-bold text-slate-900 mb-4" />
            <EditableText value={step.step_desc} onSave={(v) => handleStepUpdate(idx, 'step_desc', v)} multiline className="text-slate-500 text-sm leading-relaxed" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const TeamGrid: React.FC<LayoutProps> = ({ content, onEditImage, onUpdate }) => {
  const handleItemUpdate = (idx: number, field: string, value: string) => {
    const newItems = [...(content.itens || [])];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onUpdate?.({ itens: newItems });
  };
  return (
    <div className="h-full flex flex-col p-12 md:p-20 bg-slate-900 text-white animate-in zoom-in duration-700">
      <EditableText value={content.titulo} onSave={(v) => onUpdate?.({ titulo: v })} tag="h3" className="text-5xl font-black mb-16 text-center tracking-tighter" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
        {content.itens?.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center group">
            <div className="w-40 h-40 rounded-full overflow-hidden mb-6 border-4 border-white/10 group-hover:border-blue-500 transition-all relative">
              <ImagePlaceholder prompt={item.titulo_item} customUrl={item.custom_image_url} className="h-full w-full" onEdit={() => onEditImage?.('item', idx)} />
            </div>
            <EditableText value={item.titulo_item} onSave={(v) => handleItemUpdate(idx, 'titulo_item', v)} tag="h4" className="text-xl font-bold mb-1" />
            <EditableText value={item.desc_item} onSave={(v) => handleItemUpdate(idx, 'desc_item', v)} className="text-blue-400 text-sm font-black uppercase tracking-widest" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const PricingTable: React.FC<LayoutProps> = ({ content, onUpdate }) => {
  const handleItemUpdate = (idx: number, field: string, value: string) => {
    const newItems = [...(content.itens || [])];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onUpdate?.({ itens: newItems });
  };
  return (
    <div className="h-full flex flex-col p-12 md:p-20 bg-blue-50 animate-in slide-in-from-bottom duration-700">
      <EditableText value={content.titulo} onSave={(v) => onUpdate?.({ titulo: v })} tag="h3" className="text-4xl font-black text-slate-900 mb-16 text-center tracking-tight" />
      <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
        {content.itens?.map((item, idx) => (
          <div key={idx} className={`flex-1 max-w-sm p-10 rounded-[3rem] shadow-2xl flex flex-col ${idx === 1 ? 'bg-blue-600 text-white scale-105 z-10' : 'bg-white text-slate-900'}`}>
            <EditableText value={item.titulo_item} onSave={(v) => handleItemUpdate(idx, 'titulo_item', v)} tag="h4" className="text-2xl font-black mb-4" />
            <div className="text-5xl font-black mb-8 flex items-baseline gap-1">
              <span className="text-2xl">$</span>
              <EditableText value={item.desc_item.split('|')[0]} onSave={(v) => handleItemUpdate(idx, 'desc_item', v + '|' + item.desc_item.split('|')[1])} />
              <span className="text-sm opacity-50">/mês</span>
            </div>
            <div className="flex-1 space-y-4 mb-10">
              {item.desc_item.split('|')[1]?.split(',').map((feat, fidx) => (
                <div key={fidx} className="flex items-center gap-3 text-sm opacity-80">
                  <CheckCircle size={16} className={idx === 1 ? 'text-blue-200' : 'text-blue-600'} />
                  {feat}
                </div>
              ))}
            </div>
            <button className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${idx === 1 ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>Selecionar</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const FAQSection: React.FC<LayoutProps> = ({ content, onUpdate }) => {
  const handleItemUpdate = (idx: number, field: string, value: string) => {
    const newItems = [...(content.itens || [])];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onUpdate?.({ itens: newItems });
  };
  return (
    <div className="h-full flex flex-col p-12 md:p-20 bg-white animate-in fade-in duration-700 overflow-hidden">
      <div className="flex items-center gap-6 mb-16">
        <div className="p-6 bg-blue-600 text-white rounded-[2rem] shadow-xl"><FAQIcon size={48} /></div>
        <EditableText value={content.titulo} onSave={(v) => onUpdate?.({ titulo: v })} tag="h3" className="text-5xl font-black text-slate-900 tracking-tighter" />
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
        {content.itens?.map((item, idx) => (
          <div key={idx} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
            <EditableText value={item.titulo_item} onSave={(v) => handleItemUpdate(idx, 'titulo_item', v)} tag="h4" className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <span className="text-blue-600">Q.</span> {item.titulo_item}
            </EditableText>
            <EditableText value={item.desc_item} onSave={(v) => handleItemUpdate(idx, 'desc_item', v)} multiline className="text-slate-500 leading-relaxed pl-8 border-l-2 border-blue-200" />
          </div>
        ))}
      </div>
    </div>
  );
};
export const LayoutPreview: React.FC<{ type: string }> = ({ type }) => {
  const renderMini = () => {
    switch (type) {
      case 'capa_principal':
        return (
          <div className="flex flex-col items-center justify-center h-full p-4 space-y-2 bg-slate-50">
            <div className="w-3/4 h-4 bg-blue-600 rounded" />
            <div className="w-1/2 h-2 bg-slate-300 rounded" />
            <div className="w-1/4 h-2 bg-slate-200 rounded mt-4" />
          </div>
        );
      case 'capa_secao':
        return (
          <div className="flex flex-col items-center justify-center h-full p-4 space-y-2 bg-blue-600">
            <div className="w-2/3 h-4 bg-white rounded" />
            <div className="w-1/2 h-2 bg-blue-200 rounded" />
          </div>
        );
      case 'texto_imagem_split':
        return (
          <div className="flex h-full bg-slate-50">
            <div className="w-1/2 p-4 space-y-2">
              <div className="w-full h-3 bg-slate-400 rounded" />
              <div className="w-full h-2 bg-slate-200 rounded" />
              <div className="w-full h-2 bg-slate-200 rounded" />
            </div>
            <div className="w-1/2 bg-slate-200 flex items-center justify-center">
              <ImageIcon size={24} className="text-slate-400" />
            </div>
          </div>
        );
      case 'grid_informativo':
        return (
          <div className="grid grid-cols-2 gap-2 h-full p-4 bg-slate-50">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-2 border border-slate-200 rounded bg-white space-y-1">
                <div className="w-4 h-4 bg-blue-100 rounded" />
                <div className="w-full h-1 bg-slate-300 rounded" />
              </div>
            ))}
          </div>
        );
      case 'three_column':
        return (
          <div className="flex gap-2 h-full p-4 bg-slate-50">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1 space-y-2">
                <div className="w-full aspect-video bg-slate-200 rounded" />
                <div className="w-full h-2 bg-slate-400 rounded" />
                <div className="w-full h-1 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        );
      case 'destaque_numero':
        return (
          <div className="flex flex-col items-center justify-center h-full p-4 bg-slate-50">
            <div className="text-4xl font-black text-blue-600">99%</div>
            <div className="w-2/3 h-2 bg-slate-300 rounded mt-2" />
          </div>
        );
      case 'timeline':
        return (
          <div className="flex flex-col h-full p-4 space-y-3 bg-slate-50">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-600 flex-shrink-0" />
                <div className="w-full h-2 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        );
      case 'full_image_quote':
        return (
          <div className="relative h-full bg-slate-800 flex items-center justify-center p-4">
            <ImageIcon size={40} className="absolute inset-0 m-auto text-slate-700" />
            <div className="relative z-10 w-full space-y-2">
              <div className="w-full h-2 bg-white rounded opacity-50" />
              <div className="w-2/3 h-2 bg-white rounded opacity-50 mx-auto" />
            </div>
          </div>
        );
      case 'comparison_table':
        return (
          <div className="flex flex-col h-full p-4 space-y-2 bg-slate-50">
            <div className="flex gap-2">
              <div className="flex-1 h-3 bg-slate-300 rounded" />
              <div className="flex-1 h-3 bg-slate-300 rounded" />
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-2 border-t border-slate-200 pt-1">
                <div className="flex-1 h-2 bg-slate-100 rounded" />
                <div className="flex-1 h-2 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        );
      case 'feature_list':
        return (
          <div className="grid grid-cols-1 gap-2 h-full p-4 bg-slate-50 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-2 bg-white rounded border border-slate-100">
                <div className="w-6 h-6 bg-blue-100 rounded flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="w-1/2 h-2 bg-slate-400 rounded" />
                  <div className="w-full h-1 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        );
      case 'process_steps':
        return (
          <div className="flex items-center justify-center gap-2 h-full p-4 bg-slate-50">
            {[1, 2, 3].map(i => (
              <React.Fragment key={i}>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0" />
                {i < 3 && <div className="w-4 h-0.5 bg-blue-200" />}
              </React.Fragment>
            ))}
          </div>
        );
      case 'team_grid':
        return (
          <div className="grid grid-cols-3 gap-2 h-full p-4 bg-slate-900">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-slate-700" />
                <div className="w-full h-1 bg-slate-600 rounded" />
              </div>
            ))}
          </div>
        );
      case 'pricing_table':
        return (
          <div className="flex gap-2 h-full p-4 bg-slate-50">
            {[1, 2, 3].map(i => (
              <div key={i} className={`flex-1 p-2 rounded border ${i === 2 ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'} space-y-2`}>
                <div className={`w-full h-2 rounded ${i === 2 ? 'bg-white' : 'bg-slate-300'}`} />
                <div className={`w-1/2 h-4 rounded mx-auto ${i === 2 ? 'bg-blue-200' : 'bg-blue-100'}`} />
                <div className="space-y-1">
                  <div className={`w-full h-1 rounded ${i === 2 ? 'bg-blue-300' : 'bg-slate-100'}`} />
                  <div className={`w-full h-1 rounded ${i === 2 ? 'bg-blue-300' : 'bg-slate-100'}`} />
                </div>
              </div>
            ))}
          </div>
        );
      case 'faq_section':
        return (
          <div className="flex flex-col h-full p-4 space-y-2 bg-slate-50">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-2 bg-white rounded border border-slate-200 space-y-1">
                <div className="w-2/3 h-2 bg-slate-400 rounded" />
                <div className="w-full h-1 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        );
      case 'conclusao_cta':
        return (
          <div className="flex flex-col items-center justify-center h-full p-4 space-y-3 bg-emerald-50">
            <div className="w-3/4 h-3 bg-slate-800 rounded" />
            <div className="w-1/2 h-8 bg-emerald-600 rounded-full" />
          </div>
        );
      default:
        return <div className="flex items-center justify-center h-full bg-slate-100 text-[10px] text-slate-400">Preview</div>;
    }
  };

  return (
    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border-2 border-slate-100 shadow-inner group-hover:border-blue-200 transition-colors">
      {renderMini()}
    </div>
  );
};
