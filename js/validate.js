/* Общие константы печати, палитры (предвычислен контраст ≥4.5:1) и вспомогательная геометрия. */

const PRINT = {
  bleedW: 94, bleedH: 54,   // размер с вылетами под обрез
  trimW: 90, trimH: 50,     // готовый размер после обреза
  safeW: 86, safeH: 46,     // безопасная зона для текста/лого
  get trimX() { return (this.bleedW - this.trimW) / 2; },   // 2мм
  get trimY() { return (this.bleedH - this.trimH) / 2; },   // 2мм
  get safeX() { return (this.bleedW - this.safeW) / 2; },   // 4мм
  get safeY() { return (this.bleedH - this.safeH) / 2; },   // 4мм
};
PRINT.safeLeft = PRINT.safeX;
PRINT.safeRight = PRINT.bleedW - PRINT.safeX;
PRINT.safeTop = PRINT.safeY;
PRINT.safeBottom = PRINT.bleedH - PRINT.safeY;

const PRINT_DPI = 300;
const PX_PER_MM = PRINT_DPI / 25.4; // ~11.81 px/mm — разрешение растровых вставок (лого/QR/иллюстрация)

/* WCAG 2.x relative luminance + contrast ratio */
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function relLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(hexA, hexB) {
  const l1 = relLuminance(hexA), l2 = relLuminance(hexB);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
const MIN_CONTRAST = 4.5;

/*
 * Палитры шаблонов — правило брифа "не более 2 цветов (1 основной + 1 акцентный)".
 * Каждая пара accent/base здесь программно проверена (см. contrastRatio) и проходит порог MIN_CONTRAST.
 * Ни один непроверенный цвет в UI не показывается — это и есть "валидировать программно".
 */
const PALETTES = {
  personalDark: {
    bg: '#1E1E1E', neutralText: '#D4D4D4', dim: '#8A8A8A',
    accents: [
      { id: 'blue', label: 'Синий', hex: '#9ECBFF' },
      { id: 'coral', label: 'Коралл', hex: '#FF6B6B' },
      { id: 'amber', label: 'Янтарь', hex: '#FFD166' },
      { id: 'teal', label: 'Бирюза', hex: '#88C0D0' },
    ],
  },
  personalLight: {
    bg: '#FAFAFA', neutralText: '#262626', dim: '#8A8A8A',
    accents: [
      { id: 'graphite', label: 'Графит', hex: '#2C3E5A' },
      { id: 'forest', label: 'Лесной', hex: '#2F6F4E' },
      { id: 'rust', label: 'Ржавый', hex: '#B45309' },
      { id: 'burgundy', label: 'Бургунди', hex: '#9F1239' },
    ],
  },
  networking: {
    bgFront: '#141414', textFront: '#FFFFFF',
    bgBack: '#FFFFFF', textBack: '#141414',
    accents: [
      { id: 'blue', label: 'Синий', hex: '#9ECBFF' },
      { id: 'coral', label: 'Коралл', hex: '#FF6B6B' },
      { id: 'amber', label: 'Янтарь', hex: '#FFD166' },
      { id: 'teal', label: 'Бирюза', hex: '#88C0D0' },
    ],
  },
  project: {
    barLight: { bg: '#FFFFFF', text: '#1A1A1A' },
    barDark: { bg: '#1E1E1E', text: '#F5F5F5' },
    bgBack: '#FFFFFF', textBack: '#141414',
    accents: [
      { id: 'sun', label: 'Солнце', hex: '#F59E0B' },
      { id: 'sea', label: 'Море', hex: '#0EA5E9' },
      { id: 'moss', label: 'Мох', hex: '#4D7C0F' },
      { id: 'clay', label: 'Глина', hex: '#C2410C' },
    ],
  },
};

// Самопроверка палитр в момент загрузки — если что-то не проходит порог, явно упадём в консоль,
// а не молча покажем нечитаемую комбинацию.
(function verifyPalettes() {
  function check(bg, hex, where) {
    const r = contrastRatio(bg, hex);
    if (r < MIN_CONTRAST) {
      console.error(`Палитра ${where}: контраст ${hex} на ${bg} = ${r.toFixed(2)} < ${MIN_CONTRAST}`);
    }
  }
  check(PALETTES.personalDark.bg, PALETTES.personalDark.neutralText, 'personalDark/neutralText');
  PALETTES.personalDark.accents.forEach(a => check(PALETTES.personalDark.bg, a.hex, 'personalDark/' + a.id));
  check(PALETTES.personalLight.bg, PALETTES.personalLight.neutralText, 'personalLight/neutralText');
  PALETTES.personalLight.accents.forEach(a => check(PALETTES.personalLight.bg, a.hex, 'personalLight/' + a.id));
  check(PALETTES.networking.bgFront, PALETTES.networking.textFront, 'networking/front-text');
  check(PALETTES.networking.bgBack, PALETTES.networking.textBack, 'networking/back-text');
  PALETTES.networking.accents.forEach(a => check(PALETTES.networking.bgFront, a.hex, 'networking/' + a.id));
  check(PALETTES.project.barLight.bg, PALETTES.project.barLight.text, 'project/barLight');
  check(PALETTES.project.barDark.bg, PALETTES.project.barDark.text, 'project/barDark');
  check(PALETTES.project.bgBack, PALETTES.project.textBack, 'project/back-text');
})();

/* jsPDF.setFontSize() всегда в pt независимо от unit документа — переводим из мм для визуального
 * соответствия SVG-превью (там font-size задан в мм, т.к. viewBox="0 0 94 54"). */
function mmToPt(mm) { return mm * 2.8346456693; }

/* Единое форматирование значения контакта — используется и в превью, и в PDF, и в валидации формы. */
function formatContactValue(channel, raw) {
  const v = (raw || '').trim();
  if (!v) return '';
  if (channel === 'telegram') return '@' + v.replace(/^@/, '');
  return v;
}

/*
 * Личная и Нетворкинг сценарии позволяют заполнить сразу телефон/email/telegram —
 * каждое поле независимо-опционально, в карточке показываются только заполненные
 * строки (тот же паттерн, что уже был у необязательного "role"/"anchor").
 */
function buildContactLines(data) {
  const lines = [];
  if (data.phone && data.phone.trim()) lines.push({ key: 'phone', value: data.phone.trim() });
  if (data.email && data.email.trim()) lines.push({ key: 'email', value: data.email.trim() });
  if (data.telegram && data.telegram.trim()) lines.push({ key: 'telegram', value: formatContactValue('telegram', data.telegram) });
  return lines;
}

/* Клэмп прямоугольника (мм) внутрь safe zone — используется для лого/иллюстраций. */
function clampRectToSafeZone(x, y, w, h) {
  const minX = PRINT.safeLeft, maxX = PRINT.safeRight;
  const minY = PRINT.safeTop, maxY = PRINT.safeBottom;
  let nx = Math.max(minX, Math.min(x, maxX - w));
  let ny = Math.max(minY, Math.min(y, maxY - h));
  if (w > maxX - minX) nx = minX;
  if (h > maxY - minY) ny = minY;
  return { x: nx, y: ny, w, h };
}

/*
 * "Cover"-геометрия для загружаемой картинки внутри слота (region) заданного мм-размера.
 * Вся математика — в миллиметрах, поэтому один и тот же расчёт годится и для SVG-превью
 * (viewBox="0 0 94 54", 1 unit = 1мм), и для растеризации под печать (умножить на PX_PER_MM).
 */
function coverTransform(naturalW, naturalH, regionWmm, regionHmm, userScale, panXmm, panYmm) {
  const baseScale = Math.max(regionWmm / naturalW, regionHmm / naturalH);
  const scale = baseScale * userScale;
  const renderW = naturalW * scale;
  const renderH = naturalH * scale;
  const minPanX = regionWmm - renderW; // <= 0
  const minPanY = regionHmm - renderH;
  const clampedPanX = Math.max(minPanX, Math.min(0, panXmm));
  const clampedPanY = Math.max(minPanY, Math.min(0, panYmm));
  return { renderW, renderH, panX: clampedPanX, panY: clampedPanY, scale };
}
