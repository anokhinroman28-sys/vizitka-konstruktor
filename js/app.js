/*
 * Стейт, форма, переключение сценариев, живое превью и экспорт.
 * Форма конкретного сценария рендерится один раз при переключении таба (не на каждую
 * клавишу — иначе слетал бы фокус в полях и сбрасывались crop-виджеты). Ввод в полях
 * мутирует state и вызывает только updatePreview()/updateExportState().
 *
 * Телефон/email/telegram в «Личной» и «Нетворкинге» — независимо-опциональные поля
 * (можно заполнить сразу все три, показываются только заполненные). Это осознанное
 * отступление от исходного правила брифа «один канал контакта» — по явному запросу.
 */

const state = {
  scenario: 'personal',
  personal: { name: '', role: '', phone: '', email: '', telegram: '', base: 'dark', accentId: 'blue', fontId: 'jetbrains', monogramDataUrl: null },
  networking: { name: '', anchor: '', phone: '', email: '', telegram: '', qrUrl: '', accentId: 'blue', fontId: 'inter', qrDataUrl: null },
  project: { projectName: '', location: '', qrUrl: '', phone: '', bar: 'light', accentId: 'sun', fontId: 'inter', illustrationDataUrl: null, qrDataUrl: null },
};

function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function accentPicker(fieldName, options, current) {
  return `
    <div class="accent-picker">
      ${options.map(a => `
        <button type="button" class="accent-swatch ${current === a.id ? 'active' : ''}" style="background:${a.hex}"
          data-field="${fieldName}" data-value="${a.id}" title="${a.label}"></button>`).join('')}
    </div>`;
}

/* Каждая кнопка показывает своё название, набранное этим же шрифтом — как в v9. */
function fontPicker(group, current) {
  const options = FONT_CATALOG[group];
  return `
    <div class="font-picker">
      ${options.map(f => `
        <button type="button" class="font-swatch ${current === f.id ? 'active' : ''}"
          style="font-family:'${FONT_FILES[f.regular].cssFamily}'"
          data-field="fontId" data-value="${f.id}">${f.label}</button>`).join('')}
    </div>`;
}

function contactFieldset(s) {
  return `
    <div class="field"><label>Телефон (опционально)</label><input type="text" data-field="phone" value="${esc(s.phone)}" placeholder="+7 900 000-00-00"></div>
    <div class="field"><label>Email (опционально)</label><input type="text" data-field="email" value="${esc(s.email)}" placeholder="name@mail.com"></div>
    <div class="field"><label>Telegram (опционально)</label><input type="text" data-field="telegram" value="${esc(s.telegram)}" placeholder="username (без @)"></div>
  `;
}

/* ---------- Рендер формы по сценарию (вызывается только при переключении таба) ---------- */

function renderForm(scenario) {
  const el = document.getElementById('form-fields');
  if (scenario === 'personal') {
    const s = state.personal;
    el.innerHTML = `
      <div class="field"><label>Имя *</label><input type="text" data-field="name" value="${esc(s.name)}" placeholder="Роман Анохин"></div>
      <div class="field"><label>Сфера деятельности (опционально)</label><input type="text" data-field="role" value="${esc(s.role)}" placeholder="операционные процессы"></div>
      <div class="field"><label>Контакты (заполните хотя бы один)</label></div>
      ${contactFieldset(s)}
      <div class="field"><label>Фон</label>
        <div class="seg-picker">
          <button type="button" class="seg-opt ${s.base === 'dark' ? 'active' : ''}" data-field="base" data-value="dark">Графит</button>
          <button type="button" class="seg-opt ${s.base === 'light' ? 'active' : ''}" data-field="base" data-value="light">Белый</button>
        </div>
      </div>
      <div class="field"><label>Акцентный цвет</label>${accentPicker('accentId', (s.base === 'light' ? PALETTES.personalLight : PALETTES.personalDark).accents, s.accentId)}</div>
      <div class="field"><label>Шрифт</label>${fontPicker('mono', s.fontId)}</div>
      <div class="field"><label>Монограмма / инициалы (опционально)</label><div id="crop-monogram"></div></div>
    `;
    createCropControl({
      container: document.getElementById('crop-monogram'),
      regionWmm: TEMPLATES.personal.layout.monogram.w, regionHmm: TEMPLATES.personal.layout.monogram.h,
      maxScale: 2, label: 'монограмму', required: false,
      onChange: (dataUrl) => { state.personal.monogramDataUrl = dataUrl; updatePreview(); },
    });
  }

  if (scenario === 'networking') {
    const s = state.networking;
    el.innerHTML = `
      <div class="field"><label>Имя *</label><input type="text" data-field="name" value="${esc(s.name)}" placeholder="Роман Анохин"></div>
      <div class="field"><label>Фраза-якорь (вместо должности)</label><input type="text" data-field="anchor" value="${esc(s.anchor)}" placeholder="Помогаю внедрять AI-агентов в операционку"></div>
      <div class="field"><label>Контакты (заполните хотя бы один)</label></div>
      ${contactFieldset(s)}
      <div class="field"><label>Куда ведёт QR на обороте (ссылка) *</label><input type="text" data-field="qrUrl" value="${esc(s.qrUrl)}" placeholder="https://t.me/username"></div>
      <div class="field"><label>Акцентный цвет</label>${accentPicker('accentId', PALETTES.networking.accents, s.accentId)}</div>
      <div class="field"><label>Шрифт</label>${fontPicker('sans', s.fontId)}</div>
    `;
  }

  if (scenario === 'project') {
    const s = state.project;
    el.innerHTML = `
      <div class="field"><label>Название проекта / сообщества *</label><input type="text" data-field="projectName" value="${esc(s.projectName)}" placeholder="SUP-школа «Течение»"></div>
      <div class="field"><label>Локация / формат встреч</label><input type="text" data-field="location" value="${esc(s.location)}" placeholder="Химкинское вдхр., по сб в 10:00"></div>
      <div class="field"><label>QR на группу/чат (ссылка) *</label><input type="text" data-field="qrUrl" value="${esc(s.qrUrl)}" placeholder="https://t.me/joinchat/..."></div>
      <div class="field"><label>Телефон на обороте (опционально)</label><input type="text" data-field="phone" value="${esc(s.phone)}" placeholder="+7 900 000-00-00"></div>
      <div class="field"><label>Плашка с текстом</label>
        <div class="seg-picker">
          <button type="button" class="seg-opt ${s.bar === 'light' ? 'active' : ''}" data-field="bar" data-value="light">Светлая</button>
          <button type="button" class="seg-opt ${s.bar === 'dark' ? 'active' : ''}" data-field="bar" data-value="dark">Тёмная</button>
        </div>
      </div>
      <div class="field"><label>Акцентный цвет</label>${accentPicker('accentId', PALETTES.project.accents, s.accentId)}</div>
      <div class="field"><label>Шрифт</label>${fontPicker('sans', s.fontId)}</div>
      <div class="field"><label>Иллюстрация / фото *</label><div id="crop-illustration"></div></div>
    `;
    createCropControl({
      container: document.getElementById('crop-illustration'),
      regionWmm: TEMPLATES.project.layout.illustration.w, regionHmm: TEMPLATES.project.layout.illustration.h,
      maxScale: 2.5, label: 'иллюстрацию', required: true,
      onChange: (dataUrl) => { state.project.illustrationDataUrl = dataUrl; updatePreview(); updateExportState(); },
    });
  }
}

/* ---------- Делегированные обработчики (живут на стабильном родителе, форма может перерисовываться) ---------- */

document.addEventListener('input', (e) => {
  const field = e.target.dataset.field;
  if (!field) return;
  state[state.scenario][field] = e.target.value;
  updatePreview();
  updateExportState();
});

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-field][data-value]');
  if (!btn) return;
  const field = btn.dataset.field, value = btn.dataset.value;
  const s = state[state.scenario];
  s[field] = value;

  // Смена базового фона личной визитки меняет допустимый набор акцентов (другая палитра) —
  // старый accentId может не существовать в новой палитре, поэтому форму перерисовываем целиком.
  if (state.scenario === 'personal' && field === 'base') {
    const pal = value === 'light' ? PALETTES.personalLight : PALETTES.personalDark;
    s.accentId = pal.accents[0].id;
    renderForm('personal');
  } else {
    btn.parentElement.querySelectorAll('[data-field="' + field + '"]').forEach(b => b.classList.toggle('active', b === btn));
  }
  updatePreview();
});

document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-scenario-tab]');
  if (tab) switchScenario(tab.dataset.scenarioTab);
});

/* ---------- Переключение сценария ---------- */

function switchScenario(scenario) {
  state.scenario = scenario;
  document.querySelectorAll('[data-scenario-tab]').forEach(t => t.classList.toggle('active', t.dataset.scenarioTab === scenario));
  renderForm(scenario);
  updatePreview();
  updateExportState();
}

/* ---------- Превью ---------- */

function updatePreview() {
  const tpl = TEMPLATES[state.scenario];
  const s = state[state.scenario];

  if (tpl.layout.back && tpl.layout.back.qr && 'qrUrl' in s) {
    const qrPx = Math.round(tpl.layout.back.qr.w * PX_PER_MM);
    s.qrDataUrl = s.qrUrl.trim() ? buildQrDataUrl(s.qrUrl, qrPx).dataUrl : null;
  }

  const { front, back } = tpl.renderPreview(s);
  document.getElementById('preview-front').innerHTML = front;
  const backWrap = document.getElementById('preview-back-wrap');
  if (back) {
    backWrap.style.display = '';
    document.getElementById('preview-back').innerHTML = back;
  } else {
    backWrap.style.display = 'none';
  }
}

/* ---------- Валидация экспорта ---------- */

function hasAnyContact(s) {
  return !!((s.phone && s.phone.trim()) || (s.email && s.email.trim()) || (s.telegram && s.telegram.trim()));
}

function missingFieldsFor(scenario) {
  const s = state[scenario];
  const missing = [];
  if (scenario === 'personal') {
    if (!s.name.trim()) missing.push('имя');
    if (!hasAnyContact(s)) missing.push('хотя бы один контакт (телефон, email или telegram)');
  }
  if (scenario === 'networking') {
    if (!s.name.trim()) missing.push('имя');
    if (!hasAnyContact(s)) missing.push('хотя бы один контакт (телефон, email или telegram)');
    if (!s.qrUrl.trim()) missing.push('ссылка для QR');
  }
  if (scenario === 'project') {
    if (!s.projectName.trim()) missing.push('название проекта');
    if (!s.qrUrl.trim()) missing.push('ссылка для QR');
    if (!s.illustrationDataUrl) missing.push('иллюстрация (обязательный элемент этого сценария)');
  }
  return missing;
}

function updateExportState() {
  const missing = missingFieldsFor(state.scenario);
  const btn = document.getElementById('btn-export');
  const hint = document.getElementById('export-hint');
  btn.disabled = missing.length > 0;
  hint.textContent = missing.length ? `Заполните перед экспортом: ${missing.join(', ')}.` : '';
}

document.getElementById('btn-export') && document.getElementById('btn-export').addEventListener('click', () => {
  const tpl = TEMPLATES[state.scenario];
  const s = state[state.scenario];
  const doc = tpl.buildPdf(s);
  const nameSlug = (s.name || s.projectName || 'vizitka').toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-+|-+$/g, '');
  doc.save(`vizitka-${state.scenario}-${nameSlug || 'card'}.pdf`);
});

/* ---------- Инициализация ---------- */

window.addEventListener('load', () => {
  injectFontFaceCss();
  switchScenario('personal');
});
