import pptxgen from "pptxgenjs";
import { EbookData, Page, AspectRatio, StyleConfig } from "../types";

const PALETTES = [
  { id: 'corporate', colors: { bg: '#eff6ff', primary: '#2563eb', secondary: '#1e40af', text: '#0f172a' } },
  { id: 'forest', colors: { bg: '#f0fdf4', primary: '#16a34a', secondary: '#14532d', text: '#052e16' } },
  { id: 'sunset', colors: { bg: '#fff7ed', primary: '#ea580c', secondary: '#9a3412', text: '#431407' } },
  { id: 'dark', colors: { bg: '#0f172a', primary: '#38bdf8', secondary: '#0ea5e9', text: '#f8fafc' } },
];

const getImageUrl = (prompt?: string, customUrl?: string) => {
  if (customUrl) return customUrl;
  if (!prompt) return null;
  const basePrompt = prompt.split(',')[0];
  const encodedPrompt = encodeURIComponent(basePrompt);
  const seed = basePrompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&seed=${seed}&nologo=true&model=flux`;
};

// Função para converter imagem em Base64 para garantir compatibilidade no PPTX
const fetchImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Erro ao carregar imagem para PPTX:", err);
    return url; // Fallback para URL original se falhar
  }
};

export const exportToPptx = async (ebookData: EbookData, styleConfig: StyleConfig, aspectRatio: AspectRatio) => {
  const pres = new pptxgen();
  
  // Configurar Aspect Ratio
  if (aspectRatio === '16:9') {
    pres.layout = 'LAYOUT_16x9';
  } else if (aspectRatio === '9:16') {
    pres.defineLayout({ name: 'LAYOUT_9x16', width: 7.5, height: 13.33 });
    pres.layout = 'LAYOUT_9x16';
  } else {
    pres.defineLayout({ name: 'A4', width: 8.27, height: 11.69 });
    pres.layout = 'A4';
  }

  const palette = PALETTES.find(p => p.id === styleConfig.palette) || PALETTES[0];
  const colors = palette.colors;

  for (const page of ebookData.paginas) {
    const slide = pres.addSlide();
    slide.background = { color: colors.bg.replace('#', '') };

    switch (page.layout_type) {
      case 'capa_principal':
        await renderCoverPage(pres, slide, page, colors);
        break;
      case 'capa_secao':
        await renderSectionCover(pres, slide, page, colors);
        break;
      case 'texto_imagem_split':
        await renderTextImageSplit(pres, slide, page, colors);
        break;
      case 'grid_informativo':
        renderGridInfo(pres, slide, page, colors);
        break;
      case 'destaque_numero':
        await renderStatHighlight(pres, slide, page, colors);
        break;
      case 'conclusao_cta':
        renderConclusionCTA(pres, slide, page, colors);
        break;
      case 'full_image_quote':
        await renderFullImageQuote(pres, slide, page, colors);
        break;
      case 'three_column':
        await renderThreeColumn(pres, slide, page, colors);
        break;
      case 'timeline':
        renderTimeline(pres, slide, page, colors);
        break;
      case 'comparison_table':
        renderComparisonTable(pres, slide, page, colors);
        break;
      case 'feature_list':
        renderFeatureList(pres, slide, page, colors);
        break;
      case 'process_steps':
        renderProcessSteps(pres, slide, page, colors);
        break;
      case 'team_grid':
        await renderTeamGrid(pres, slide, page, colors);
        break;
      case 'pricing_table':
        renderPricingTable(pres, slide, page, colors);
        break;
      case 'faq_section':
        renderFAQSection(pres, slide, page, colors);
        break;
      default:
        slide.addText("Layout não suportado: " + page.layout_type, { x: 1, y: 1, color: colors.text.replace('#', '') });
    }
  }

  return pres.writeFile({ fileName: `${ebookData.metadados.titulo_gerado || 'ebook'}.pptx` });
};

const renderCoverPage = async (pres: pptxgen, slide: pptxgen.Slide, page: Page, colors: any) => {
  const imgUrl = getImageUrl(page.conteudo.prompt_imagem, page.conteudo.custom_image_url);
  
  if (imgUrl) {
    const base64 = await fetchImageAsBase64(imgUrl);
    slide.addImage({ data: base64, x: 0, y: 0, w: '100%', h: '100%' });
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '000000', transparency: 50 } });
  }

  const textColor = imgUrl ? 'FFFFFF' : colors.text.replace('#', '');
  
  slide.addText(page.conteudo.titulo || "", {
    x: '10%', y: '35%', w: '80%', h: 1.5,
    fontSize: 44, bold: true, color: textColor, align: 'center', fontFace: 'Arial Black'
  });

  slide.addText(page.conteudo.subtitulo || "", {
    x: '10%', y: '55%', w: '80%', h: 1,
    fontSize: 24, color: textColor, align: 'center', fontFace: 'Arial'
  });

  slide.addText(page.conteudo.autor || "", {
    x: '10%', y: '80%', w: '80%', h: 0.5,
    fontSize: 14, color: textColor, align: 'center', fontFace: 'Arial', italic: true
  });
};

const renderSectionCover = (pres: pptxgen, slide: pptxgen.Slide, page: Page, colors: any) => {
  slide.background = { color: colors.primary.replace('#', '') };
  
  const imgUrl = getImageUrl(page.conteudo.prompt_imagem, page.conteudo.custom_image_url);
  if (imgUrl) {
    slide.addImage({ path: imgUrl, x: 0, y: 0, w: '100%', h: '100%' });
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: colors.primary.replace('#', ''), transparency: 40 } });
  }

  slide.addText("CAPÍTULO", {
    x: 0.5, y: 1, w: 2, h: 0.3,
    fontSize: 12, bold: true, color: 'FFFFFF', fontFace: 'Arial'
  });

  slide.addText(page.conteudo.titulo_secao || "", {
    x: 0.5, y: 1.5, w: '90%', h: 2,
    fontSize: 60, bold: true, color: 'FFFFFF', fontFace: 'Arial Black'
  });

  slide.addText(page.conteudo.breve_descricao || "", {
    x: 0.5, y: 4, w: '80%', h: 1.5,
    fontSize: 24, color: 'FFFFFF', fontFace: 'Arial'
  });
};

const renderTextImageSplit = (pres: pptxgen, slide: pptxgen.Slide, page: Page, colors: any) => {
  const isRight = page.conteudo.lado_imagem === 'right';
  const imgUrl = getImageUrl(page.conteudo.prompt_imagem, page.conteudo.custom_image_url);

  const textX = isRight ? 0.5 : 5.5;
  const imgX = isRight ? 5.5 : 0;

  if (imgUrl) {
    slide.addImage({ path: imgUrl, x: imgX, y: 0, w: 5, h: '100%' });
  }

  slide.addText(page.conteudo.titulo || "", {
    x: textX, y: 1.5, w: 4, h: 1,
    fontSize: 32, bold: true, color: colors.text.replace('#', ''), fontFace: 'Arial Black'
  });

  slide.addText(page.conteudo.texto_adaptado || "", {
    x: textX, y: 3, w: 4, h: 3,
    fontSize: 18, color: colors.text.replace('#', ''), fontFace: 'Arial', align: 'left'
  });
};

const renderGridInfo = (pres: pptxgen, slide: pptxgen.Slide, page: Page, colors: any) => {
  slide.addText(page.conteudo.titulo || "", {
    x: 0.5, y: 0.5, w: '90%', h: 0.5,
    fontSize: 28, bold: true, color: colors.text.replace('#', ''), fontFace: 'Arial Black'
  });

  const items = page.conteudo.itens || [];
  items.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.5 + (col * 4.75);
    const y = 1.5 + (row * 2.5);

    slide.addShape('rect' as any, {
      x, y, w: 4.25, h: 2.25,
      fill: { color: 'FFFFFF' },
      line: { color: colors.primary.replace('#', ''), width: 1 }
    });

    slide.addText(item.titulo_item, {
      x: x + 0.2, y: y + 0.2, w: 3.8, h: 0.4,
      fontSize: 18, bold: true, color: colors.primary.replace('#', ''), fontFace: 'Arial'
    });

    slide.addText(item.desc_item, {
      x: x + 0.2, y: y + 0.7, w: 3.8, h: 1.3,
      fontSize: 12, color: colors.text.replace('#', ''), fontFace: 'Arial'
    });
  });
};

const renderStatHighlight = async (pres: pptxgen, slide: pptxgen.Slide, page: Page, colors: any) => {
  slide.background = { color: '0f172a' };
  
  const imgUrl = getImageUrl(page.conteudo.prompt_fundo_abstrato, page.conteudo.custom_image_url);
  if (imgUrl) {
    const base64 = await fetchImageAsBase64(imgUrl);
    slide.addImage({ data: base64, x: 0, y: 0, w: '100%', h: '100%' });
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '0f172a', transparency: 70 } });
  }

  slide.addText(page.conteudo.numero_grande || "", {
    x: 0, y: '25%', w: '100%', h: 2,
    fontSize: 120, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial Black'
  });

  slide.addText(page.conteudo.texto_explicativo || "", {
    x: '10%', y: '60%', w: '80%', h: 1,
    fontSize: 32, color: 'CCCCCC', align: 'center', fontFace: 'Arial'
  });
};

const renderConclusionCTA = (pres: pptxgen, slide: pptxgen.Slide, page: Page, colors: any) => {
  slide.background = { color: 'f0fdf4' };
  
  slide.addText(page.conteudo.titulo_final || "", {
    x: 0, y: 1.5, w: '100%', h: 1.5,
    fontSize: 54, bold: true, color: colors.text.replace('#', ''), align: 'center', fontFace: 'Arial Black'
  });

  slide.addText(page.conteudo.texto_resumo || "", {
    x: '10%', y: 3.5, w: '80%', h: 1.5,
    fontSize: 24, color: colors.text.replace('#', ''), align: 'center', fontFace: 'Arial'
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 3.5, y: 5.5, w: 3, h: 0.8,
    fill: { color: colors.primary.replace('#', '') },
    rectRadius: 0.4,
    shadow: { type: 'outer', color: '000000', blur: 10, offset: 5, opacity: 0.2 }
  });

  slide.addText(page.conteudo.texto_botao_acao || "", {
    x: 3.5, y: 5.5, w: 3, h: 0.8,
    fontSize: 18, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial'
  });
};

const renderFullImageQuote = async (pres: pptxgen, slide: pptxgen.Slide, page: Page, colors: any) => {
  const imgUrl = getImageUrl(page.conteudo.prompt_imagem, page.conteudo.custom_image_url);
  if (imgUrl) {
    const base64 = await fetchImageAsBase64(imgUrl);
    slide.addImage({ data: base64, x: 0, y: 0, w: '100%', h: '100%' });
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '000000', transparency: 60 } });
  }

  slide.addText(page.conteudo.citacao || page.conteudo.texto_adaptado || "", {
    x: '10%', y: '30%', w: '80%', h: 2.5,
    fontSize: 36, italic: true, color: 'FFFFFF', align: 'center', fontFace: 'Georgia'
  });

  slide.addText(page.conteudo.autor_citacao || page.conteudo.autor || "", {
    x: '10%', y: '65%', w: '80%', h: 0.5,
    fontSize: 20, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial'
  });
};

const renderThreeColumn = async (pres: pptxgen, slide: pptxgen.Slide, page: Page, colors: any) => {
  slide.addText(page.conteudo.titulo || "", {
    x: 0, y: 0.5, w: '100%', h: 0.8,
    fontSize: 32, bold: true, color: colors.text.replace('#', ''), align: 'center', fontFace: 'Arial Black'
  });

  const items = page.conteudo.itens?.slice(0, 3) || [];
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const x = 0.5 + (idx * 3.1);
    const y = 1.5;

    // Card background
    slide.addShape(pres.ShapeType.rect, {
      x, y, w: 2.8, h: 4.5,
      fill: { color: 'FFFFFF' },
      rectRadius: 0.15,
      shadow: { type: 'outer', color: '64748B', blur: 8, offset: 4, opacity: 0.1 }
    });

    const imgUrl = getImageUrl(item.icone_keyword, item.custom_image_url);
    if (imgUrl) {
      const base64 = await fetchImageAsBase64(imgUrl);
      slide.addImage({ data: base64, x: x + 0.1, y: y + 0.1, w: 2.6, h: 1.8 });
    }

    slide.addText(item.titulo_item, {
      x: x + 0.1, y: y + 2.1, w: 2.6, h: 0.4,
      fontSize: 16, bold: true, color: colors.text.replace('#', ''), fontFace: 'Arial'
    });

    slide.addText(item.desc_item, {
      x: x + 0.1, y: y + 2.6, w: 2.6, h: 1.5,
      fontSize: 11, color: colors.text.replace('#', ''), fontFace: 'Arial'
    });
  }
};

const renderTimeline = (pres: pptxgen, slide: pptxgen.Slide, page: Page, colors: any) => {
  slide.addText(page.conteudo.titulo || "", {
    x: 0.5, y: 0.5, w: '90%', h: 0.6,
    fontSize: 32, bold: true, color: colors.text.replace('#', ''), fontFace: 'Arial Black'
  });

  const steps = page.conteudo.steps || [];
  steps.forEach((step, idx) => {
    const y = 1.5 + (idx * 1.2);
    
    slide.addShape(pres.ShapeType.ellipse, {
      x: 0.5, y, w: 0.6, h: 0.6,
      fill: { color: colors.primary.replace('#', '') },
      shadow: { type: 'outer', color: '000000', blur: 5, offset: 2, opacity: 0.2 }
    });

    slide.addText((idx + 1).toString(), {
      x: 0.5, y, w: 0.6, h: 0.6,
      fontSize: 18, bold: true, color: 'FFFFFF', align: 'center'
    });

    slide.addText(step.step_title, {
      x: 1.3, y, w: 8, h: 0.4,
      fontSize: 20, bold: true, color: colors.text.replace('#', ''), fontFace: 'Arial'
    });

    slide.addText(step.step_desc, {
      x: 1.3, y: y + 0.4, w: 8, h: 0.6,
      fontSize: 12, color: colors.text.replace('#', ''), fontFace: 'Arial'
    });
  });
};

const renderComparisonTable = (pres: pptxgen, slide: pptxgen.Slide, page: Page, colors: any) => {
  slide.addText(page.conteudo.titulo || "", {
    x: 0.5, y: 0.5, w: '90%', h: 0.6,
    fontSize: 28, bold: true, color: colors.text.replace('#', ''), fontFace: 'Arial Black'
  });

  const items = page.conteudo.itens || [];
  const rows = [['Recurso', 'Descrição']];
  items.forEach(item => rows.push([item.titulo_item, item.desc_item]));

  slide.addTable(rows as any, {
    x: 0.5, y: 1.5, w: 9,
    border: { type: 'solid', color: 'E2E8F0', pt: 1 },
    fill: { color: 'F8FAFC' },
    fontSize: 12,
    color: colors.text.replace('#', ''),
    autoPage: true
  });
};

const renderFeatureList = (pres: pptxgen, slide: pptxgen.Slide, page: Page, colors: any) => {
  slide.addText(page.conteudo.titulo || "", {
    x: 0.5, y: 0.5, w: '90%', h: 0.6,
    fontSize: 32, bold: true, color: colors.text.replace('#', ''), fontFace: 'Arial Black'
  });

  const items = page.conteudo.itens || [];
  items.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.5 + (col * 4.75);
    const y = 1.3 + (row * 1.8);

    slide.addShape(pres.ShapeType.rect, {
      x, y, w: 4.5, h: 1.6,
      fill: { color: 'FFFFFF' },
      rectRadius: 0.2,
      shadow: { type: 'outer', color: '64748B', blur: 10, offset: 5, opacity: 0.1 }
    });

    slide.addText(item.titulo_item, {
      x: x + 0.2, y: y + 0.2, w: 4.1, h: 0.4,
      fontSize: 16, bold: true, color: colors.primary.replace('#', '')
    });

    slide.addText(item.desc_item, {
      x: x + 0.2, y: y + 0.6, w: 4.1, h: 0.8,
      fontSize: 11, color: colors.text.replace('#', '')
    });
  });
};

const renderProcessSteps = (pres: pptxgen, slide: pptxgen.Slide, page: Page, colors: any) => {
  slide.addText(page.conteudo.titulo || "", {
    x: 0, y: 0.5, w: '100%', h: 0.6,
    fontSize: 32, bold: true, color: colors.text.replace('#', ''), align: 'center'
  });

  const steps = page.conteudo.steps || [];
  const stepWidth = 9 / (steps.length || 1);

  steps.forEach((step, idx) => {
    const x = 0.5 + (idx * stepWidth);
    
    slide.addShape(pres.ShapeType.ellipse, {
      x: x + (stepWidth/2) - 0.4, y: 1.5, w: 0.8, h: 0.8,
      fill: { color: colors.primary.replace('#', '') },
      shadow: { type: 'outer', color: '000000', blur: 5, offset: 2, opacity: 0.2 }
    });

    slide.addText((idx + 1).toString(), {
      x: x + (stepWidth/2) - 0.4, y: 1.5, w: 0.8, h: 0.8,
      fontSize: 24, bold: true, color: 'FFFFFF', align: 'center'
    });

    slide.addText(step.step_title, {
      x, y: 2.5, w: stepWidth, h: 0.4,
      fontSize: 16, bold: true, color: colors.text.replace('#', ''), align: 'center'
    });

    slide.addText(step.step_desc, {
      x, y: 3, w: stepWidth, h: 1,
      fontSize: 10, color: colors.text.replace('#', ''), align: 'center'
    });
  });
};

const renderTeamGrid = async (pres: pptxgen, slide: pptxgen.Slide, page: Page, colors: any) => {
  slide.background = { color: '0f172a' };
  slide.addText(page.conteudo.titulo || "", {
    x: 0, y: 0.5, w: '100%', h: 0.6,
    fontSize: 32, bold: true, color: 'FFFFFF', align: 'center'
  });

  const items = page.conteudo.itens || [];
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const x = 0.5 + (col * 2.3);
    const y = 1.5 + (row * 2.5);

    const imgUrl = getImageUrl(item.titulo_item, item.custom_image_url);
    if (imgUrl) {
      const base64 = await fetchImageAsBase64(imgUrl);
      slide.addImage({ data: base64, x: x + 0.4, y, w: 1.5, h: 1.5, rounding: true });
    }

    slide.addText(item.titulo_item, {
      x, y: y + 1.6, w: 2.3, h: 0.3,
      fontSize: 14, bold: true, color: 'FFFFFF', align: 'center'
    });

    slide.addText(item.desc_item, {
      x, y: y + 1.9, w: 2.3, h: 0.3,
      fontSize: 10, color: '38bdf8', align: 'center', bold: true
    });
  }
};

const renderPricingTable = (pres: pptxgen, slide: pptxgen.Slide, page: Page, colors: any) => {
  slide.addText(page.conteudo.titulo || "", {
    x: 0, y: 0.5, w: '100%', h: 0.6,
    fontSize: 32, bold: true, color: colors.text.replace('#', ''), align: 'center'
  });

  const items = page.conteudo.itens || [];
  items.forEach((item, idx) => {
    const x = 0.5 + (idx * 3.1);
    const isFeatured = idx === 1;

    slide.addShape(pres.ShapeType.rect, {
      x, y: 1.5, w: 2.8, h: 4.5,
      fill: { color: isFeatured ? colors.primary.replace('#', '') : 'FFFFFF' },
      rectRadius: 0.2,
      shadow: { type: 'outer', color: '64748B', blur: 15, offset: 8, opacity: 0.15 }
    });

    const textColor = isFeatured ? 'FFFFFF' : colors.text.replace('#', '');

    slide.addText(item.titulo_item, {
      x, y: 1.8, w: 2.8, h: 0.4,
      fontSize: 20, bold: true, color: textColor, align: 'center'
    });

    const price = item.desc_item.split('|')[0];
    slide.addText(`$${price}`, {
      x, y: 2.3, w: 2.8, h: 0.6,
      fontSize: 36, bold: true, color: textColor, align: 'center'
    });

    const features = item.desc_item.split('|')[1]?.split(',') || [];
    features.forEach((feat, fidx) => {
      slide.addText(`• ${feat}`, {
        x: x + 0.2, y: 3.2 + (fidx * 0.3), w: 2.4, h: 0.3,
        fontSize: 10, color: textColor
      });
    });
  });
};

const renderFAQSection = (pres: pptxgen, slide: pptxgen.Slide, page: Page, colors: any) => {
  slide.addText(page.conteudo.titulo || "", {
    x: 0.5, y: 0.5, w: '90%', h: 0.6,
    fontSize: 32, bold: true, color: colors.text.replace('#', '')
  });

  const items = page.conteudo.itens || [];
  items.forEach((item, idx) => {
    const y = 1.3 + (idx * 1.1);

    slide.addShape(pres.ShapeType.rect, {
      x: 0.5, y, w: 9, h: 1,
      fill: { color: 'F8FAFC' },
      rectRadius: 0.1,
      line: { color: 'E2E8F0', width: 1 }
    });

    slide.addText(`Q: ${item.titulo_item}`, {
      x: 0.7, y: y + 0.1, w: 8.6, h: 0.3,
      fontSize: 14, bold: true, color: colors.text.replace('#', '')
    });

    slide.addText(item.desc_item, {
      x: 0.7, y: y + 0.4, w: 8.6, h: 0.5,
      fontSize: 11, color: '64748B'
    });
  });
};
