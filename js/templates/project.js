/*
 * Шаблон «Проект / хобби» — front+back. Иллюстрация — обязательный элемент (см. app.js:
 * кнопка экспорта задизейблена без неё). Текст всегда лежит на сплошной плашке (не поверх
 * фото) — так контраст 4.5:1 гарантирован независимо от того, что именно загрузил пользователь.
 * QR на группу/чат остаётся обязательным; телефон на обороте — независимо-опциональное
 * дополнение под подписью (не всегда удобно писать в чат, звонок — запасной вариант).
 */
TEMPLATES.project = (function () {
  const L = {
    illustration: { x: 0, y: 0, w: PRINT.bleedW, h: 36 },
    bar: { x: 0, y: 36, w: PRINT.bleedW, h: 18 },
    nameY: 44, nameSize: 6,
    locationY: 49, locationSize: 3,
    textX: 8,
    back: {
      nameY: 18, nameSize: 4.5,
      qr: { x: 61, y: 14, w: 25, h: 25 },
      captionY: 42,
      phoneY: 47, phoneSize: 3.2,
    },
  };

  function barPalette(data) {
    return data.bar === 'dark' ? PALETTES.project.barDark : PALETTES.project.barLight;
  }
  function accentHex(data) {
    const found = PALETTES.project.accents.find(a => a.id === data.accentId);
    return (found || PALETTES.project.accents[0]).hex;
  }
  function font(data) { return fontCatalogEntry('sans', data.fontId); }
  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function renderPreview(data) {
    const bar = barPalette(data);
    const accent = accentHex(data);
    const f = font(data);
    const ffReg = FONT_FILES[f.regular].cssFamily;
    const ill = L.illustration, barRect = L.bar, b = L.back;

    const front = `
      <svg viewBox="0 0 ${PRINT.bleedW} ${PRINT.bleedH}" xmlns="http://www.w3.org/2000/svg" class="card-svg">
        <rect x="0" y="0" width="${PRINT.bleedW}" height="${PRINT.bleedH}" fill="${bar.bg}"/>
        ${data.illustrationDataUrl
          ? `<image x="${ill.x}" y="${ill.y}" width="${ill.w}" height="${ill.h}" href="${data.illustrationDataUrl}" preserveAspectRatio="none"/>`
          : `<rect x="${ill.x}" y="${ill.y}" width="${ill.w}" height="${ill.h}" fill="#DDD"/><text x="${ill.w / 2}" y="${ill.h / 2}" font-family="${ffReg}" font-size="3" fill="#999" text-anchor="middle">Загрузите иллюстрацию</text>`}
        <rect x="${barRect.x}" y="${barRect.y}" width="${barRect.w}" height="${barRect.h}" fill="${bar.bg}"/>
        <text x="${L.textX}" y="${L.nameY}" font-family="${ffReg}" font-weight="700" font-size="${L.nameSize}" fill="${bar.text}">${esc(data.projectName || 'Название проекта')}</text>
        ${data.location ? `<text x="${L.textX}" y="${L.locationY}" font-family="${ffReg}" font-size="${L.locationSize}" fill="${accent}">${esc(data.location)}</text>` : ''}
        <rect x="${PRINT.safeLeft}" y="${PRINT.safeTop}" width="${PRINT.safeW}" height="${PRINT.safeH}" fill="none" stroke="#FF3B30" stroke-opacity="0.35" stroke-width="0.25" stroke-dasharray="1.2,1"/>
      </svg>`;

    const back = `
      <svg viewBox="0 0 ${PRINT.bleedW} ${PRINT.bleedH}" xmlns="http://www.w3.org/2000/svg" class="card-svg">
        <rect x="0" y="0" width="${PRINT.bleedW}" height="${PRINT.bleedH}" fill="${PALETTES.project.bgBack}"/>
        <text x="${L.textX}" y="${b.nameY}" font-family="${ffReg}" font-weight="700" font-size="${b.nameSize}" fill="${PALETTES.project.textBack}">${esc(data.projectName || 'Название проекта')}</text>
        ${data.qrDataUrl ? `<image x="${b.qr.x}" y="${b.qr.y}" width="${b.qr.w}" height="${b.qr.h}" href="${data.qrDataUrl}"/>` : `<rect x="${b.qr.x}" y="${b.qr.y}" width="${b.qr.w}" height="${b.qr.h}" fill="none" stroke="${PALETTES.project.textBack}" stroke-opacity="0.25" stroke-width="0.2" stroke-dasharray="1,1"/>`}
        <text x="${b.qr.x + b.qr.w / 2}" y="${b.captionY}" font-family="${ffReg}" font-size="2.6" fill="${PALETTES.project.textBack}" text-anchor="middle">Присоединяйтесь</text>
        ${data.phone ? `<text x="${b.qr.x + b.qr.w / 2}" y="${b.phoneY}" font-family="${ffReg}" font-size="${b.phoneSize}" fill="${accent}" text-anchor="middle">${esc(data.phone)}</text>` : ''}
        <rect x="${PRINT.safeLeft}" y="${PRINT.safeTop}" width="${PRINT.safeW}" height="${PRINT.safeH}" fill="none" stroke="#FF3B30" stroke-opacity="0.25" stroke-width="0.25" stroke-dasharray="1.2,1"/>
      </svg>`;

    return { front, back };
  }

  function buildPdf(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [PRINT.bleedW, PRINT.bleedH], orientation: 'landscape' });
    registerPdfFonts(doc);
    const bar = barPalette(data);
    const accent = hexToRgb(accentHex(data));
    const f = font(data);
    const [regFamily] = pdfFontOf(f.regular);
    const [boldFamily] = pdfFontOf(f.bold);
    const barRgb = hexToRgb(bar.bg), textRgb = hexToRgb(bar.text);
    const bgBack = hexToRgb(PALETTES.project.bgBack), textBack = hexToRgb(PALETTES.project.textBack);

    // --- FRONT ---
    const ill = L.illustration, barRect = L.bar;
    if (data.illustrationDataUrl) {
      doc.addImage(data.illustrationDataUrl, 'PNG', ill.x, ill.y, ill.w, ill.h);
    } else {
      doc.setFillColor(221, 221, 221);
      doc.rect(ill.x, ill.y, ill.w, ill.h, 'F');
    }
    doc.setFillColor(barRgb.r, barRgb.g, barRgb.b);
    doc.rect(barRect.x, barRect.y, barRect.w, barRect.h, 'F');

    doc.setFont(boldFamily, 'normal');
    doc.setFontSize(mmToPt(L.nameSize));
    doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
    doc.text(data.projectName || 'Название проекта', L.textX, L.nameY);

    if (data.location) {
      doc.setFont(regFamily, 'normal');
      doc.setFontSize(mmToPt(L.locationSize));
      doc.setTextColor(accent.r, accent.g, accent.b);
      doc.text(data.location, L.textX, L.locationY);
    }

    // --- BACK ---
    doc.addPage([PRINT.bleedW, PRINT.bleedH], 'landscape');
    doc.setFillColor(bgBack.r, bgBack.g, bgBack.b);
    doc.rect(0, 0, PRINT.bleedW, PRINT.bleedH, 'F');

    doc.setFont(boldFamily, 'normal');
    doc.setFontSize(mmToPt(L.back.nameSize));
    doc.setTextColor(textBack.r, textBack.g, textBack.b);
    doc.text(data.projectName || 'Название проекта', L.textX, L.back.nameY);

    if (data.qrDataUrl) {
      const q = L.back.qr;
      doc.addImage(data.qrDataUrl, 'PNG', q.x, q.y, q.w, q.h);
    }
    doc.setFont(regFamily, 'normal');
    doc.setFontSize(mmToPt(2.6));
    doc.setTextColor(textBack.r, textBack.g, textBack.b);
    doc.text('Присоединяйтесь', L.back.qr.x + L.back.qr.w / 2, L.back.captionY, { align: 'center' });

    if (data.phone) {
      doc.setFontSize(mmToPt(L.back.phoneSize));
      doc.setTextColor(accent.r, accent.g, accent.b);
      doc.text(data.phone, L.back.qr.x + L.back.qr.w / 2, L.back.phoneY, { align: 'center' });
    }

    return doc;
  }

  return { id: 'project-1', scenario: 'project', sides: ['front', 'back'], layout: L, renderPreview, buildPdf };
})();
