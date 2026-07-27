/*
 * Шаблон «Личная / Dev» — эволюция vizitka_v9.html под требования брифа:
 * safe zone, реальный векторный PDF вместо html2canvas-скриншота, имя — крупнейший
 * элемент карточки. Один сценарий = 1 сторона (94x54 мм).
 * По запросу пользователя: телефон/email/telegram теперь независимо-опциональны
 * (можно заполнить сразу все три), плюс выбор одного из нескольких моношрифтов.
 */
const TEMPLATES = window.TEMPLATES || {};
window.TEMPLATES = TEMPLATES;

TEMPLATES.personal = (function () {
  const L = {
    titlebarH: 7,
    dot: { x0: 6, y: 3.5, r: 1, gap: 3 },
    filenameY: 4.6, filenameSize: 2.4,
    roleY: 11, roleSize: 3,
    nameY: 24, nameSize: 7.2,
    braceOpenY: 29, braceSize: 3,
    contactStartY: 33.3, lineHeight: 4.3, contactSize: 3,
    textX: 6, codeIndentX: 9.5,
    monogram: { x: 73, y: 33, w: 13, h: 13 },
  };

  function palette(data) {
    return data.base === 'light' ? PALETTES.personalLight : PALETTES.personalDark;
  }
  function accentHex(data) {
    const pal = palette(data);
    const found = pal.accents.find(a => a.id === data.accentId);
    return (found || pal.accents[0]).hex;
  }
  function font(data) { return fontCatalogEntry('mono', data.fontId); }

  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function renderPreview(data) {
    const pal = palette(data);
    const accent = accentHex(data);
    const f = font(data);
    const ff = FONT_FILES[f.regular].cssFamily;
    const fname = 'vizitka.json';
    const roleLine = data.role ? `// ${esc(data.role)}` : '';
    const contacts = buildContactLines(data);
    const mono = L.monogram;

    const contactSvg = contacts.map((c, i) => {
      const y = L.contactStartY + i * L.lineHeight;
      return `<text x="${L.codeIndentX}" y="${y}" font-family="${ff}" font-size="${L.contactSize}" fill="${pal.dim}">"${c.key}": <tspan fill="${pal.neutralText}">"${esc(c.value)}"</tspan></text>`;
    }).join('');
    const braceCloseY = L.braceOpenY + (contacts.length + 1) * L.lineHeight;

    const front = `
      <svg viewBox="0 0 ${PRINT.bleedW} ${PRINT.bleedH}" xmlns="http://www.w3.org/2000/svg" class="card-svg">
        <rect x="0" y="0" width="${PRINT.bleedW}" height="${PRINT.bleedH}" fill="${pal.bg}"/>
        <rect x="0" y="0" width="${PRINT.bleedW}" height="${L.titlebarH}" fill="${pal.bg}" stroke="${pal.dim}" stroke-opacity="0.25" stroke-width="0.15"/>
        <circle cx="${L.dot.x0}" cy="${L.dot.y}" r="${L.dot.r}" fill="#FF5F57"/>
        <circle cx="${L.dot.x0 + L.dot.gap}" cy="${L.dot.y}" r="${L.dot.r}" fill="#FEBC2E"/>
        <circle cx="${L.dot.x0 + L.dot.gap * 2}" cy="${L.dot.y}" r="${L.dot.r}" fill="#28C840"/>
        <text x="${PRINT.bleedW / 2}" y="${L.filenameY}" font-family="${ff}" font-size="${L.filenameSize}" fill="${pal.dim}" text-anchor="middle">${fname}</text>
        ${roleLine ? `<text x="${L.textX}" y="${L.roleY}" font-family="${ff}" font-size="${L.roleSize}" fill="${pal.dim}">${roleLine}</text>` : ''}
        <text x="${L.textX}" y="${L.nameY}" font-family="${ff}" font-weight="500" font-size="${L.nameSize}" fill="${accent}">${esc(data.name || 'Имя Фамилия')}</text>
        <text x="${L.textX}" y="${L.braceOpenY}" font-family="${ff}" font-size="${L.braceSize}" fill="${pal.dim}">{</text>
        ${contactSvg}
        <text x="${L.textX}" y="${braceCloseY}" font-family="${ff}" font-size="${L.braceSize}" fill="${pal.dim}">}</text>
        ${data.monogramDataUrl ? `<image x="${mono.x}" y="${mono.y}" width="${mono.w}" height="${mono.h}" href="${data.monogramDataUrl}"/>` : `<rect x="${mono.x}" y="${mono.y}" width="${mono.w}" height="${mono.h}" fill="none" stroke="${pal.dim}" stroke-width="0.2" stroke-dasharray="1,1"/>`}
        <rect x="${PRINT.safeLeft}" y="${PRINT.safeTop}" width="${PRINT.safeW}" height="${PRINT.safeH}" fill="none" stroke="#FF3B30" stroke-opacity="0.35" stroke-width="0.25" stroke-dasharray="1.2,1"/>
      </svg>`;

    return { front, back: null };
  }

  function buildPdf(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [PRINT.bleedW, PRINT.bleedH], orientation: 'landscape' });
    registerPdfFonts(doc);
    const pal = palette(data);
    const accent = accentHex(data);
    const f = font(data);
    const [regFamily] = pdfFontOf(f.regular);
    const [boldFamily] = pdfFontOf(f.bold);
    const bg = hexToRgb(pal.bg), dim = hexToRgb(pal.dim), neutral = hexToRgb(pal.neutralText), acc = hexToRgb(accent);

    doc.setFillColor(bg.r, bg.g, bg.b);
    doc.rect(0, 0, PRINT.bleedW, PRINT.bleedH, 'F');

    [['#FF5F57', 0], ['#FEBC2E', L.dot.gap], ['#28C840', L.dot.gap * 2]].forEach(([hex, dx]) => {
      const c = hexToRgb(hex);
      doc.setFillColor(c.r, c.g, c.b);
      doc.circle(L.dot.x0 + dx, L.dot.y, L.dot.r, 'F');
    });
    doc.setFont(regFamily, 'normal');
    doc.setFontSize(mmToPt(L.filenameSize));
    doc.setTextColor(dim.r, dim.g, dim.b);
    doc.text('vizitka.json', PRINT.bleedW / 2, L.filenameY, { align: 'center' });

    if (data.role) {
      doc.setFontSize(mmToPt(L.roleSize));
      doc.text(`// ${data.role}`, L.textX, L.roleY);
    }

    doc.setFont(boldFamily, 'normal');
    doc.setFontSize(mmToPt(L.nameSize));
    doc.setTextColor(acc.r, acc.g, acc.b);
    doc.text(data.name || 'Имя Фамилия', L.textX, L.nameY);

    doc.setFont(regFamily, 'normal');
    doc.setFontSize(mmToPt(L.braceSize));
    doc.setTextColor(dim.r, dim.g, dim.b);
    doc.text('{', L.textX, L.braceOpenY);

    const contacts = buildContactLines(data);
    doc.setFontSize(mmToPt(L.contactSize));
    contacts.forEach((c, i) => {
      const y = L.contactStartY + i * L.lineHeight;
      doc.setTextColor(dim.r, dim.g, dim.b);
      const keyStr = `"${c.key}": `;
      doc.text(keyStr, L.codeIndentX, y);
      const keyWidth = doc.getTextWidth(keyStr);
      doc.setTextColor(neutral.r, neutral.g, neutral.b);
      doc.text(`"${c.value}"`, L.codeIndentX + keyWidth, y);
    });

    const braceCloseY = L.braceOpenY + (contacts.length + 1) * L.lineHeight;
    doc.setTextColor(dim.r, dim.g, dim.b);
    doc.text('}', L.textX, braceCloseY);

    if (data.monogramDataUrl) {
      const mono = L.monogram;
      doc.addImage(data.monogramDataUrl, 'PNG', mono.x, mono.y, mono.w, mono.h);
    }
    return doc;
  }

  return { id: 'personal-dev', scenario: 'personal', sides: ['front'], layout: L, renderPreview, buildPdf };
})();
