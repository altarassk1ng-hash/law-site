/* Дополнительные блоки: ситуации, процесс, отзывы, калькулятор, запись, поиск по FAQ, копирование. */
window.initFeatures = function (App) {
  'use strict';
  const { S, $, $$, esc, goForm, toast, reduce } = App;
  const P = S.person;
  const nb = s => String(s).replace(/ /g, ' ');
  const rub = n => Math.round(n / 500) * 500;
  const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/\s/g, ' ');

  /* ---------- ситуации ---------- */
  const sit = $('#sit');
  sit.innerHTML = S.situations.map((c, i) =>
    '<article class="sc rv" style="--i:' + i + '"><button class="sc-h" aria-expanded="false" aria-controls="sc' + i + '">' +
    '<span class="sc-n">' + String(i + 1).padStart(2, '0') + '</span><span class="sc-t"><b>' + esc(c.title) + '</b><small>' + esc(c.short) + '</small></span><span class="pm"></span></button>' +
    '<div class="sc-b" id="sc' + i + '"><div><ol>' + c.steps.map(t => '<li>' + esc(t) + '</li>').join('') + '</ol>' +
    '<div class="sc-f"><button class="btn fill sm" data-svc="' + c.svc + '" data-t="' + esc(c.title) + '">Обсудить с юристом</button><span class="sc-w">Общая памятка, не заключение по вашему делу</span></div></div></div></article>'
  ).join('');
  sit.addEventListener('click', e => {
    const go = e.target.closest('[data-svc]');
    if (go) { App.openBot('Моя ситуация: ' + go.dataset.t.toLowerCase() + '. Что делать?', { svc: go.dataset.svc }); return; }
    const h = e.target.closest('.sc-h'); if (!h) return;
    const c = h.parentElement, was = c.classList.contains('open');
    $$('.sc.open', sit).forEach(x => { x.classList.remove('open'); $('.sc-h', x).setAttribute('aria-expanded', 'false'); });
    if (!was) { c.classList.add('open'); h.setAttribute('aria-expanded', 'true'); App.snd('tick'); }
  });

  /* ---------- как проходит работа ---------- */
  $('#proc').innerHTML = S.process.map((p, i) =>
    '<li class="rv" style="--i:' + i + '"><span class="pn">' + (i + 1) + '</span><h3>' + esc(p.t) + '</h3><p>' + esc(p.d) + '</p><span class="pt">' + esc(p.time) + '</span></li>').join('');

  /* ---------- отзывы ---------- */
  const rvw = $('#rvw');
  rvw.innerHTML = '<div class="rv-track" id="rvt" tabindex="0" aria-label="Отзывы клиентов">' +
    S.reviews.map(r => '<figure class="rv-c"><span class="qm">“</span><blockquote>' + esc(r.text) + '</blockquote><figcaption><b>' + esc(r.name) + '</b><span class="rd" tabindex="0" title="Нажмите, чтобы показать">' + esc(r.role) + '</span></figcaption>' +
      (r.sample ? '<em class="smp">Пример</em>' : '') + '</figure>').join('') +
    '</div><div class="rv-nav"><button class="rv-b" data-d="-1" aria-label="Назад">←</button><div class="rv-dots" id="rvd">' + S.reviews.map(() => '<i></i>').join('') + '</div><button class="rv-b" data-d="1" aria-label="Вперёд">→</button></div>';
  const rvt = $('#rvt'), dots = $$('#rvd i');
  const cardW = () => { const c = rvt.firstElementChild; return c ? c.getBoundingClientRect().width + 20 : 1; };
  function rvUpd() { const k = Math.round(rvt.scrollLeft / cardW()); dots.forEach((d, i) => d.classList.toggle('on', i === Math.min(k, dots.length - 1))); }
  rvt.addEventListener('scroll', rvUpd, { passive: true }); rvUpd();
  /* если все отзывы помещаются на экране, листать нечего: стрелки и точки прячем */
  const rvnav = $('.rv-nav', rvw);
  const rvFit = () => { rvnav.hidden = rvt.scrollWidth <= rvt.clientWidth + 2; };
  rvFit(); addEventListener('resize', rvFit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rvFit);
  rvw.addEventListener('click', e => { const b = e.target.closest('.rv-b'); if (b) rvt.scrollBy({ left: +b.dataset.d * cardW(), behavior: reduce ? 'auto' : 'smooth' }); });
  dots.forEach((d, i) => d.onclick = () => rvt.scrollTo({ left: i * cardW(), behavior: reduce ? 'auto' : 'smooth' }));
  // перетаскивание мышью
  let drag = null;
  rvt.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; drag = { x: e.clientX, l: rvt.scrollLeft }; rvt.classList.add('drag'); });
  addEventListener('pointermove', e => { if (drag) rvt.scrollLeft = drag.l - (e.clientX - drag.x); });
  addEventListener('pointerup', () => { if (drag) { drag = null; rvt.classList.remove('drag'); } });

  /* ---------- калькулятор ---------- */
  const C = S.calc;
  const st = { type: 0, cx: 0, inst: 0, urgent: false };
  const calc = $('#calc');
  calc.innerHTML =
    '<div class="cc-l"><span class="eyebrow">Калькулятор</span><h3>Сколько это может стоить</h3><p>Выберите параметры, и получите ориентир по цене. Точная сумма определяется после анализа документов.</p>' +
    '<div class="cc-r"><small>Ориентировочно</small><div class="cc-v"><b id="cmin">0</b><i>—</i><b id="cmax">0</b><span id="cu">₽</span></div><p id="cn">' + esc(C.note) + '</p>' +
    '<div class="cc-a"><button class="btn light" id="cgo">Обсудить расчёт</button><button class="btn ghost" id="cask">Спросить помощника</button></div></div></div>' +
    '<div class="cc-f">' +
    '<div class="cf1"><label>Тип дела</label><div class="seg" id="ctype">' + C.types.map((t, i) => '<button data-i="' + i + '">' + esc(t.t) + '</button>').join('') + '</div></div>' +
    '<div class="cf1"><label>Сложность</label><input type="range" id="ccx" min="0" max="2" step="0.001" value="0" aria-label="Сложность дела"><div class="rl">' + C.complexity.map((c, i) => '<button data-i="' + i + '">' + esc(c.t) + '</button>').join('') + '</div></div>' +
    '<div class="cf1" id="cinst"><label>Инстанция</label><div class="seg" id="cins">' + C.instance.map((t, i) => '<button data-i="' + i + '">' + esc(t.t) + '</button>').join('') + '</div></div>' +
    '<label class="sw"><input type="checkbox" id="curg"><span class="sw-t"></span><span>Срочно (в течение нескольких дней)</span></label>' +
    '</div>';
  let shown = { a: 0, b: 0 }, raf;
  function tween(to) {
    cancelAnimationFrame(raf);
    const from = { ...shown }, t0 = performance.now(), d = reduce ? 0 : 450;
    (function f(t) {
      const p = d ? Math.min((t - t0) / d, 1) : 1, e = 1 - Math.pow(1 - p, 3);
      shown = { a: from.a + (to.a - from.a) * e, b: from.b + (to.b - from.b) * e };
      $('#cmin').textContent = fmt(shown.a); $('#cmax').textContent = fmt(shown.b);
      if (p < 1) raf = requestAnimationFrame(f);
    })(t0);
  }
  function calcUpdate() {
    const t = C.types[st.type];
    $('#cinst').style.display = t.inst ? '' : 'none';
    st.cx = Math.min(2, Math.max(0, st.cx));
    const lo = Math.floor(st.cx), hi = Math.ceil(st.cx), kc = C.complexity[lo].k + (C.complexity[hi].k - C.complexity[lo].k) * (st.cx - lo);
    let k = kc * (t.inst ? C.instance[st.inst].k : 1) * (st.urgent ? C.urgent : 1);
    tween({ a: rub(t.min * k), b: rub(t.max * k) });
    $('#cu').textContent = t.id === 'biz' ? '₽/мес' : '₽';
    $$('#ctype button').forEach((b, i) => b.classList.toggle('on', i === st.type));
    $$('#cins button').forEach((b, i) => b.classList.toggle('on', i === st.inst));
    const near = Math.round(st.cx);
    $$('.rl button', calc).forEach((b, i) => b.classList.toggle('on', i === near));
    $('#ccx').style.setProperty('--p', (st.cx * 50) + '%');
    $('#ccx').setAttribute('aria-valuetext', C.complexity[near].t);
  }
  calc.addEventListener('click', e => {
    const tb = e.target.closest('#ctype button'), ib = e.target.closest('#cins button'), rb = e.target.closest('.rl button');
    if (tb) { st.type = +tb.dataset.i; App.snd('tick'); calcUpdate(); }
    if (ib) { st.inst = +ib.dataset.i; App.snd('tick'); calcUpdate(); }
    if (rb) { snapTo(+rb.dataset.i); }
  });
  /* ползунок: следует за рукой плавно, а после отпускания «примагничивается» в сторону движения */
  const sl = $('#ccx');
  let dragging = false, startV = 0, lastV = 0, dir = 0, snapRaf = 0;
  function snapTo(to) {
    cancelAnimationFrame(snapRaf);
    const from = st.cx;
    if (Math.abs(to - from) < .001 || reduce) { st.cx = to; sl.value = to; calcUpdate(); App.snd('tick'); return; }
    const t0 = performance.now(), d = 320;
    (function f(t) {
      const p = Math.min((t - t0) / d, 1), e = 1 - Math.pow(1 - p, 3);
      st.cx = from + (to - from) * e; sl.value = st.cx; calcUpdate();
      if (p < 1) snapRaf = requestAnimationFrame(f); else App.snd('tick');
    })(t0);
  }
  function release() {
    if (!dragging) return;
    dragging = false;
    const v = st.cx, d = dir || Math.sign(v - startV);
    const to = Math.abs(v - Math.round(v)) < .001 ? Math.round(v) : (d > 0 ? Math.ceil(v) : d < 0 ? Math.floor(v) : Math.round(v));
    snapTo(Math.min(2, Math.max(0, to)));
  }
  sl.addEventListener('pointerdown', () => { cancelAnimationFrame(snapRaf); dragging = true; startV = st.cx; lastV = st.cx; dir = 0; });
  sl.addEventListener('input', e => {
    st.cx = +e.target.value;
    if (Math.abs(st.cx - lastV) > .004) { dir = Math.sign(st.cx - lastV); lastV = st.cx; }
    calcUpdate();
    if (!dragging) snapTo(Math.round(st.cx));   // значение пришло не от мыши (например, от вспомогательных технологий)
  });
  /* движение клавишами: ровно на одно положение */
  sl.addEventListener('keydown', e => {
    const m = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageUp: 1, PageDown: -1 }[e.key];
    if (m !== undefined) { e.preventDefault(); snapTo(Math.min(2, Math.max(0, Math.round(st.cx) + m))); }
    else if (e.key === 'Home') { e.preventDefault(); snapTo(0); }
    else if (e.key === 'End') { e.preventDefault(); snapTo(2); }
  });
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  sl.addEventListener('lostpointercapture', release);
  $('#curg').addEventListener('change', e => { st.urgent = e.target.checked; App.snd('tick'); calcUpdate(); });
  const calcText = () => {
    const t = C.types[st.type];
    return 'Расчёт стоимости: ' + t.t.toLowerCase() + ', сложность — ' + C.complexity[Math.round(st.cx)].t.toLowerCase() +
      (t.inst ? ', ' + C.instance[st.inst].t.toLowerCase() : '') + (st.urgent ? ', срочно' : '') +
      '. Ориентир: ' + nb($('#cmin').textContent) + '–' + nb($('#cmax').textContent) + ' ' + $('#cu').textContent + '.';
  };
  $('#cgo').onclick = () => goForm(calcText());
  $('#cask').onclick = () => App.openBot(calcText() + ' Что скажете?');
  calcUpdate();

  /* ---------- запись на консультацию ---------- */
  const B = S.booking, bk = $('#bk');
  let slot = null;
  function workDays() {
    const out = []; const d = new Date(); d.setHours(0, 0, 0, 0);
    while (out.length < B.days) {
      d.setDate(d.getDate() + 1);
      const wd = d.getDay(), cfg = wd === 0 ? B.sunday : wd === 6 ? B.saturday : B.weekday;
      if (cfg) out.push({ date: new Date(d), cfg });
    }
    return out;
  }
  const days = workDays();
  const dShort = d => d.toLocaleDateString('ru-RU', { weekday: 'short' }).replace('.', '');
  const dMon = d => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');
  const dLong = d => d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  bk.innerHTML = '<label class="bk-l">Удобное время для консультации <small>необязательно</small></label>' +
    '<div class="bk-d" id="bkd">' + days.map((x, i) => '<button type="button" data-i="' + i + '"><small>' + dShort(x.date) + '</small><b>' + dMon(x.date) + '</b></button>').join('') + '</div>' +
    '<div class="bk-t" id="bkt"></div><div class="bk-s" id="bks"></div>';
  let dayI = -1;
  $('#bkd').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    dayI = +b.dataset.i; slot = null; App.snd('tick');
    $$('#bkd button').forEach(x => x.classList.toggle('on', x === b));
    const cfg = days[dayI].cfg; let h = '';
    for (let t = cfg.from; t < cfg.to; t++) h += '<button type="button" data-h="' + t + '">' + t + ':00</button>';
    $('#bkt').innerHTML = h; $('#bks').textContent = '';
  });
  $('#bkt').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const d = days[dayI].date; slot = dLong(d) + ', ' + b.dataset.h + ':00'; App.snd('tick');
    $$('#bkt button').forEach(x => x.classList.toggle('on', x === b));
    $('#bks').innerHTML = 'Выбрано: <b>' + esc(slot) + '</b> · время подтвердит юрист <button type="button" id="bkx">сбросить</button>';
  });
  bk.addEventListener('click', e => {
    if (e.target.id !== 'bkx') return;
    slot = null; dayI = -1; $$('#bkd button,#bkt button').forEach(x => x.classList.remove('on')); $('#bkt').innerHTML = ''; $('#bks').textContent = '';
  });
  App.getSlot = () => slot || '';

  /* ---------- копирование контактов ---------- */
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const v = P[b.dataset.copy];
    try { await navigator.clipboard.writeText(v); }
    catch (e) { const t = document.createElement('textarea'); t.value = v; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (x) {} t.remove(); }
    b.classList.add('done'); setTimeout(() => b.classList.remove('done'), 1400);
    toast('Скопировано: ' + v); App.snd('ok');
  }));

  /* ---------- поиск по FAQ ---------- */
  const fq = $('#fq'), items = $$('#faqlist .qa'), nores = $('#nores');
  fq.addEventListener('input', () => {
    const q = nb(fq.value).trim().toLowerCase(); let n = 0;
    items.forEach(it => { const hit = !q || nb(it.textContent).toLowerCase().includes(q); it.hidden = !hit; if (hit) n++; });
    nores.hidden = n > 0;
  });

  /* новые блоки тоже получают плавное появление */
  $$('#sit .rv,#proc .rv').forEach(App.observe);
};
