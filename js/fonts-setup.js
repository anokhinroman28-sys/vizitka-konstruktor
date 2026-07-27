/*
 * Шрифты — единственный источник байтов: fonts/font-data.js (base64 TTF).
 * Один и тот же файл шрифта используется и в @font-face (превью в браузере),
 * и в jsPDF addFileToVFS/addFont (векторный текст в PDF) — превью и печать не могут разойтись.
 * Оба семейства (Inter, JetBrains Mono) проверены офлайн (fontTools) на полное покрытие
 * кириллицы — не автосгенерированный fallback.
 *
 * jsPDF ищет шрифт по паре (family, style) без учёта числового веса, поэтому у каждого
 * начертания — свой pdfFamily; в CSS же используется общий family + font-weight, как обычно.
 */

const FONT_FILES = {
  'Inter-Regular': { cssFamily: 'Inter', cssWeight: 400, pdfFamily: 'Inter', pdfStyle: 'normal' },
  'Inter-Bold': { cssFamily: 'Inter', cssWeight: 700, pdfFamily: 'Inter', pdfStyle: 'bold' },
  'JetBrainsMono-Regular': { cssFamily: 'JetBrains Mono', cssWeight: 400, pdfFamily: 'JetBrains Mono', pdfStyle: 'normal' },
  'JetBrainsMono-Medium': { cssFamily: 'JetBrains Mono', cssWeight: 500, pdfFamily: 'JetBrains Mono Medium', pdfStyle: 'normal' },
  'FiraCode-Regular': { cssFamily: 'Fira Code', cssWeight: 400, pdfFamily: 'Fira Code', pdfStyle: 'normal' },
  'FiraCode-Medium': { cssFamily: 'Fira Code', cssWeight: 500, pdfFamily: 'Fira Code Medium', pdfStyle: 'normal' },
  'SourceCodePro-Regular': { cssFamily: 'Source Code Pro', cssWeight: 400, pdfFamily: 'Source Code Pro', pdfStyle: 'normal' },
  'SourceCodePro-Medium': { cssFamily: 'Source Code Pro', cssWeight: 500, pdfFamily: 'Source Code Pro Medium', pdfStyle: 'normal' },
  'IBMPlexMono-Regular': { cssFamily: 'IBM Plex Mono', cssWeight: 400, pdfFamily: 'IBM Plex Mono', pdfStyle: 'normal' },
  'IBMPlexMono-Medium': { cssFamily: 'IBM Plex Mono', cssWeight: 500, pdfFamily: 'IBM Plex Mono Medium', pdfStyle: 'normal' },
  'RobotoMono-Regular': { cssFamily: 'Roboto Mono', cssWeight: 400, pdfFamily: 'Roboto Mono', pdfStyle: 'normal' },
  'RobotoMono-Bold': { cssFamily: 'Roboto Mono', cssWeight: 700, pdfFamily: 'Roboto Mono', pdfStyle: 'bold' },
  'Manrope-Regular': { cssFamily: 'Manrope', cssWeight: 400, pdfFamily: 'Manrope', pdfStyle: 'normal' },
  'Manrope-Bold': { cssFamily: 'Manrope', cssWeight: 700, pdfFamily: 'Manrope', pdfStyle: 'bold' },
  'PTSans-Regular': { cssFamily: 'PT Sans', cssWeight: 400, pdfFamily: 'PT Sans', pdfStyle: 'normal' },
  'PTSans-Bold': { cssFamily: 'PT Sans', cssWeight: 700, pdfFamily: 'PT Sans', pdfStyle: 'bold' },
  'GolosText-Regular': { cssFamily: 'Golos Text', cssWeight: 400, pdfFamily: 'Golos Text', pdfStyle: 'normal' },
  'GolosText-Bold': { cssFamily: 'Golos Text', cssWeight: 700, pdfFamily: 'Golos Text', pdfStyle: 'bold' },
};

/*
 * Каталог шрифтов по стилю шаблона — каждый пункт ссылается на ключи FONT_FILES выше.
 * "regular"/"bold" — что использовать для обычного и акцентного/жирного начертания
 * (не более 2 начертаний одного семейства на карточке — правило брифа соблюдается
 * тем, что шаблон всегда берёт максимум "regular" + "bold" одного и того же fontId).
 */
const FONT_CATALOG = {
  mono: [
    { id: 'jetbrains', label: 'JetBrains Mono', regular: 'JetBrainsMono-Regular', bold: 'JetBrainsMono-Medium' },
    { id: 'firacode', label: 'Fira Code', regular: 'FiraCode-Regular', bold: 'FiraCode-Medium' },
    { id: 'sourcecodepro', label: 'Source Code Pro', regular: 'SourceCodePro-Regular', bold: 'SourceCodePro-Medium' },
    { id: 'ibmplexmono', label: 'IBM Plex Mono', regular: 'IBMPlexMono-Regular', bold: 'IBMPlexMono-Medium' },
    { id: 'robotomono', label: 'Roboto Mono', regular: 'RobotoMono-Regular', bold: 'RobotoMono-Bold' },
  ],
  sans: [
    { id: 'inter', label: 'Inter', regular: 'Inter-Regular', bold: 'Inter-Bold' },
    { id: 'manrope', label: 'Manrope', regular: 'Manrope-Regular', bold: 'Manrope-Bold' },
    { id: 'ptsans', label: 'PT Sans', regular: 'PTSans-Regular', bold: 'PTSans-Bold' },
    { id: 'golostext', label: 'Golos Text', regular: 'GolosText-Regular', bold: 'GolosText-Bold' },
  ],
};

function fontCatalogEntry(group, id) {
  const list = FONT_CATALOG[group];
  return list.find(f => f.id === id) || list[0];
}

function injectFontFaceCss() {
  const rules = Object.entries(FONT_FILES).map(([key, meta]) => {
    const b64 = window.VIZITKA_FONTS[key];
    return `@font-face{
      font-family:'${meta.cssFamily}';
      font-weight:${meta.cssWeight};
      font-style:normal;
      src:url(data:font/ttf;base64,${b64}) format('truetype');
      font-display:swap;
    }`;
  }).join('\n');
  const style = document.createElement('style');
  style.textContent = rules;
  document.head.appendChild(style);
}

/* Регистрирует все начертания в конкретном документе jsPDF, чтобы doc.setFont() их видел. */
function registerPdfFonts(doc) {
  Object.entries(FONT_FILES).forEach(([key, meta]) => {
    const filename = key + '.ttf';
    const b64 = window.VIZITKA_FONTS[key];
    doc.addFileToVFS(filename, b64);
    doc.addFont(filename, meta.pdfFamily, meta.pdfStyle);
  });
}

/* [pdfFamily, pdfStyle] для doc.setFont(...) по ключу FONT_FILES. */
function pdfFontOf(key) {
  const m = FONT_FILES[key];
  return [m.pdfFamily, m.pdfStyle];
}
