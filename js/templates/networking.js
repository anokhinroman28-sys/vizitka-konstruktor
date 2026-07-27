/*
 * Шаблон «Нетворкинг» — front+back (94x54 каждая сторона).
 * Front: максимальный контраст (белый на почти чёрном, ~19:1) для читаемости при плохом
 * освещении на мероприятии; фраза-якорь вместо должности; телефон/email/telegram —
 * независимо-опциональны (заполнены — показаны, каждый на своей строке).
 * Back: QR на одну ссылку — обязательно чёрное на белом (см. qr-helper.js), не инвертировать.
 */
TEMPLATES.networking = (function () {
  const L = {
    topBarH: 3,
    anchorY: 14, anchorSize: 3.2,
    nameY: 27, nameSize: 8,
    dot: { x: 8, r: 1 },
    contactStartY: 36, lineHeight: 4.3, contactSize: 3.6, contactX: 12.5,
    textX: 8,
    back: {
      qr: { x: 61, y: 14, w: 25, h: 25 },
      captionY: 42,
    },
  };

  function accentHex(data) {
    const found = PALETTES.networking.accents.find(a => a.id === data.accentId);
    return (found || PALETTES.networking.accents[0]).hex;
  }
  function font(data) { return fontCatalogEntry('sans', data.fontId); }
  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function renderPreview(data) {
    const pal = PALETTES.networking;
    const accent = accentHex(data);
    const f = font(data);
    const ffReg = FONT_FILES[f.regular].cssFamily;
    const contacts = buildContactLines(data);
    const b = L.back;

    const contactSvg = contacts.map((c, i) => {
      const y = L.contactStartY + i * L.lineHeight;
      return `<circle cx="${L.dot.x}" cy="${y - 1}" r="${L.dot.r}" fill="${accent}"/>
        <text x="${L.contactX}" y="${y}" font-family="${ffReg}" font-size="${L.contactSize}" fill="${pal.textFront}">${esc(c.value)}</text>`;
    }).join('');

    const front = `
      <svg viewBox="0 0 ${PRINT.bleedW} ${PRINT.bleedH}" xmlns="http://www.w3.org/2000/svg" class="card-svg">
        <rect x="0" y="0" width="${PRINT.bleedW}" height="${PRINT.bleedH}" fill="${pal.bgFront}"/>
        <rect x="0" y="0" width="${PRINT.bleedW}" height="${L.topBarH}" fill="${accent}"/>
        ${data.anchor ? `<text x="${L.textX}" y="${L.anchorY}" font-family="${ffReg}" font-size="${L.anchorSize}" fill="${pal.textFront}">${esc(data.anchor)}</text>` : ''}
        <text x="${L.textX}" y="${L.nameY}" font-family="${ffReg}" font-weight="700" font-size="${L.nameSize}" fill="${pal.textFront}">${esc(data.name || 'Имя Фамилия')}</text>
        ${contactSvg}
        <rect x="${PRINT.safeLeft}" y="${PRINT.safeTop}" width="${PRINT.safeW}" height="${PRINT.safeH}" fill="none" stroke="#FF3B30" stroke-opacity="0.35" stroke-width="0.25" stroke-dasharray="1.2,1"/>
      </svg>`;

    const back = `
      <svg viewBox="0 0 ${PRINT.bleedW} ${PRINT.bleedH}" xmlns="http://www.w3.org/2000/svg" class="card-svg">
        <rect x="0" y="0" width="${PRINT.bleedW}" height="${PRINT.bleedH}" fill="${pal.bgBack}"/>
        ${data.qrDataUrl ? `<image x="${b.qr.x}" y="${b.qr.y}" width="${b.qr.w}" height="${b.qr.h}" href="${data.qrDataUrl}"/>` : `<rect x="${b.qr.x}" y="${b.qr.y}" width="${b.qr.w}" height="${b.qr.h}" fill="none" stroke="${pal.textBack}" stroke-opacity="0.25" stroke-width="0.2" stroke-dasharray="1,1"/>`}
        <text x="${b.qr.x + b.qr.w / 2}" y="${b.captionY}" font-family="${ffReg}" font-size="2.6" fill="${pal.textBack}" text-anchor="middle">Отсканируйте QR</text>
        <rect x="${PRINT.safeLeft}" y="${PRINT.safeTop}" width="${PRINT.safeW}" height="${PRINT.safeH}" fill="none" stroke="#FF3B30" stroke-opacity="0.25" stroke-width="0.25" stroke-dasharray="1.2,1"/>
      </svg>`;

    return { front, back };
  }

  function buildPdf(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [PRINT.bleedW, PRINT.bleedH], orientation: 'landscape' });
    registerPdfFonts(doc);
    const pal = PALETTES.networking;
    const accent = hexToRgb(accentHex(data));
    const f = font(data);
    const [regFamily] = pdfFontOf(f.regular);
    const [boldFamily] = pdfFontOf(f.bold);
    const bgF = hexToRgb(pal.bgFront), textF = hexToRgb(pal.textFront);
    const bgB = hexToRgb(pal.bgBack), textB = hexToRgb(pal.textBack);

    // --- FRONT ---
    doc.setFillColor(bgF.r, bgF.g, bgF.b);
    doc.rect(0, 0, PRINT.bleedW, PRINT.bleedH, 'F');
    doc.setFillColor(accent.r, accent.g, accent.b);
    doc.rect(0, 0, PRINT.bleedW, L.topBarH, 'F');

    doc.setTextColor(textF.r, textF.g, textF.b);
    if (data.anchor) {
      doc.setFont(regFamily, 'normal');
      doc.setFontSize(mmToPt(L.anchorSize));
      doc.text(data.anchor, L.textX, L.anchorY);
    }
    doc.setFont(boldFamily, 'normal');
    doc.setFontSize(mmToPt(L.nameSize));
    doc.text(data.name || 'Имя Фамилия', L.textX, L.nameY);

    const contacts = buildContactLines(data);
    doc.setFont(regFamily, 'normal');
    doc.setFontSize(mmToPt(L.contactSize));
    contacts.forEach((c, i) => {
      const y = L.contactStartY + i * L.lineHeight;
      doc.setFillColor(accent.r, accent.g, accent.b);
      doc.circle(L.dot.x, y - 1, L.dot.r, 'F');
      doc.setTextColor(textF.r, textF.g, textF.b);
      doc.text(c.value, L.contactX, y);
    });

    // --- BACK ---
    doc.addPage([PRINT.bleedW, PRINT.bleedH], 'landscape');
    doc.setFillColor(bgB.r, bgB.g, bgB.b);
    doc.rect(0, 0, PRINT.bleedW, PRINT.bleedH, 'F');
    if (data.qrDataUrl) {
      const q = L.back.qr;
      doc.addImage(data.qrDataUrl, 'PNG', q.x, q.y, q.w, q.h);
    }
    doc.setTextColor(textB.r, textB.g, textB.b);
    doc.setFont(regFamily, 'normal');
    doc.setFontSize(mmToPt(2.6));
    doc.text('Отсканируйте QR', L.back.qr.x + L.back.qr.w / 2, L.back.captionY, { align: 'center' });

    return doc;
  }

  return { id: 'networking-1', scenario: 'networking', sides: ['front', 'back'], layout: L, renderPreview, buildPdf };
})();
