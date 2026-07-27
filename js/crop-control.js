/*
 * Переиспользуемый виджет загрузки лого/иллюстрации с pan/zoom, зажатым внутри слота
 * фиксированного мм-размера (моногамма — маленький слот в личной визитке, иллюстрация —
 * большая зона в карточке проекта). Вся геометрия — в мм (coverTransform из validate.js),
 * поэтому один и тот же расчёт используется для интерактивного превью и для растеризации
 * под печать (PX_PER_MM). Слот всегда меньше "тела" карточки и не может обогнать имя по
 * ощутимой площади — это заложено конфигурацией слота, а не рантайм-измерением.
 *
 * Приём файлов: только SVG или PNG (см. бриф) — JPG с непрозрачным фоном не предлагаем.
 */
function createCropControl(opts) {
  const { container, regionWmm, regionHmm, maxScale = 2.5, label, required = false, onChange } = opts;
  const stagePxPerMm = Math.min(9, 260 / Math.max(regionWmm, regionHmm));
  const stageW = regionWmm * stagePxPerMm;
  const stageH = regionHmm * stagePxPerMm;

  container.innerHTML = `
    <div class="crop-widget">
      <div class="crop-stage" style="width:${stageW}px;height:${stageH}px;">
        <img class="crop-img" draggable="false" alt="${label}">
        <div class="crop-empty">${label}${required ? ' (обязательно)' : ' (опционально)'}</div>
      </div>
      <div class="crop-controls">
        <input type="file" class="crop-file" accept="image/png,image/svg+xml">
        <label class="crop-zoom-label">Масштаб
          <input type="range" class="crop-zoom" min="1" max="${maxScale}" step="0.01" value="1" disabled>
        </label>
        <button type="button" class="crop-clear" disabled>Удалить</button>
      </div>
    </div>
  `;

  const stageEl = container.querySelector('.crop-stage');
  const imgEl = container.querySelector('.crop-img');
  const emptyEl = container.querySelector('.crop-empty');
  const fileEl = container.querySelector('.crop-file');
  const zoomEl = container.querySelector('.crop-zoom');
  const clearEl = container.querySelector('.crop-clear');

  const st = { hasImage: false, naturalW: 0, naturalH: 0, userScale: 1, panXmm: 0, panYmm: 0 };
  let dragging = false, dragStartX = 0, dragStartY = 0, panStartX = 0, panStartY = 0;

  function currentTransform() {
    return coverTransform(st.naturalW, st.naturalH, regionWmm, regionHmm, st.userScale, st.panXmm, st.panYmm);
  }

  function layout() {
    if (!st.hasImage) return;
    const t = currentTransform();
    st.panXmm = t.panX; st.panYmm = t.panY;
    imgEl.style.width = (t.renderW * stagePxPerMm) + 'px';
    imgEl.style.height = (t.renderH * stagePxPerMm) + 'px';
    imgEl.style.left = (t.panX * stagePxPerMm) + 'px';
    imgEl.style.top = (t.panY * stagePxPerMm) + 'px';
  }

  function emit() {
    if (!st.hasImage) { onChange(null, { hasImage: false }); return; }
    const t = currentTransform();
    const outW = Math.round(regionWmm * PX_PER_MM);
    const outH = Math.round(regionHmm * PX_PER_MM);
    const cv = document.createElement('canvas');
    cv.width = outW; cv.height = outH;
    const ctx = cv.getContext('2d');
    ctx.drawImage(imgEl, t.panX * PX_PER_MM, t.panY * PX_PER_MM, t.renderW * PX_PER_MM, t.renderH * PX_PER_MM);
    onChange(cv.toDataURL('image/png'), { hasImage: true });
  }

  fileEl.addEventListener('change', () => {
    const file = fileEl.files && fileEl.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        imgEl.src = reader.result;
        st.naturalW = image.naturalWidth || image.width;
        st.naturalH = image.naturalHeight || image.height;
        st.hasImage = true;
        st.userScale = 1; st.panXmm = 0; st.panYmm = 0;
        emptyEl.style.display = 'none';
        imgEl.style.display = 'block';
        zoomEl.disabled = false; zoomEl.value = 1;
        clearEl.disabled = false;
        layout();
        emit();
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  clearEl.addEventListener('click', () => {
    st.hasImage = false;
    imgEl.removeAttribute('src');
    imgEl.style.display = 'none';
    emptyEl.style.display = 'flex';
    zoomEl.disabled = true; zoomEl.value = 1;
    clearEl.disabled = true;
    fileEl.value = '';
    emit();
  });

  zoomEl.addEventListener('input', () => {
    st.userScale = parseFloat(zoomEl.value);
    layout();
    emit();
  });

  stageEl.addEventListener('pointerdown', (e) => {
    if (!st.hasImage) return;
    dragging = true;
    dragStartX = e.clientX; dragStartY = e.clientY;
    panStartX = st.panXmm; panStartY = st.panYmm;
    stageEl.setPointerCapture(e.pointerId);
  });
  stageEl.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dxMm = (e.clientX - dragStartX) / stagePxPerMm;
    const dyMm = (e.clientY - dragStartY) / stagePxPerMm;
    st.panXmm = panStartX + dxMm;
    st.panYmm = panStartY + dyMm;
    layout();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(evt => {
    stageEl.addEventListener(evt, () => { if (dragging) { dragging = false; emit(); } });
  });

  imgEl.style.display = 'none';

  return {
    hasImage: () => st.hasImage,
  };
}
