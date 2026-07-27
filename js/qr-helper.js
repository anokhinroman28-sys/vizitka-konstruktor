/*
 * QR — фиксированная, ранее отлаженная реализация (см. vizitka_json_qr_tech.md):
 * qrcode-generator (вшита, без CDN), ECC уровня M, тихая зона >=4 модуля,
 * ЧЁРНОЕ НА БЕЛОМ всегда (инверсия ломает сканирование на части устройств — не переопределять
 * даже на тёмных карточках; тёмные шаблоны кладут QR на белую плашку-подложку).
 * Рендер через canvas -> toDataURL() -> <img>/<image>, не голый <canvas> (важно для экспорта).
 */
const QR_QUIET_MODULES = 4;

function buildQrDataUrl(text, targetPx) {
  const value = (text && text.trim()) ? text.trim() : 'https://t.me/';
  const qr = qrcode(0, 'M'); // авто-версия, ECC=M
  qr.addData(value);
  qr.make();
  const count = qr.getModuleCount();
  const totalModules = count + QR_QUIET_MODULES * 2;
  const cell = Math.max(1, Math.round(targetPx / totalModules));
  const dim = totalModules * cell;

  const cv = document.createElement('canvas');
  cv.width = dim; cv.height = dim;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, dim, dim);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect((c + QR_QUIET_MODULES) * cell, (r + QR_QUIET_MODULES) * cell, cell, cell);
      }
    }
  }
  return { dataUrl: cv.toDataURL('image/png'), size: dim };
}
