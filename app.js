/* ============================================================
   НАСТРОЙКИ. Единственное место, где подключаются внешние сервисы.
   ============================================================ */
const CONFIG = {
  // Куда отправлять заявки (форма и бот). null — заявки никуда не уходят,
  // форма просто показывает «Заявка принята», данные пишутся в консоль.
  // Позже сюда ставится адрес (свой сервер, Telegram-прокси, почтовый сервис).
  leadEndpoint: null,
  // Адрес прокси для ИИ-бота (его даёт server.py). Если недоступен,
  // бот отвечает по заготовленным правилам.
  botApi: '/api/chat'
};

(function () {
  'use strict';
  const S = window.SITE;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const sess = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const snd = k => { try { window.UIsound && window.UIsound(k); } catch (e) {} };

  /* типографика: неразрывные пробелы после коротких слов и перед тире */
  const NB = '\u00A0';
  const typoStr = t => t
    .replace(/(^|[\s(«„])(в|во|на|по|с|со|к|ко|у|о|об|от|до|из|за|и|а|но|не|ни|для|при|без|над|под|про|или|как|что)\s+(?=\S)/gi, '$1$2' + NB)
    .replace(/\s+([—–])\s/g, NB + '$1 ')
    .replace(/(\d)\s+(₽|%|лет|года|дн|мин)/g, '$1' + NB + '$2');
  function typo(root) {
    if (!root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => /^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(n.parentNode.nodeName) || !n.nodeValue.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const list = []; while (w.nextNode()) list.push(w.currentNode);
    list.forEach(n => { const v = typoStr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; });
  }
  let toastT;
  function toast(t) {
    const el = $('#toast'); if (!el) return;
    el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ---------- подстановка данных ---------- */
  const P = S.person;
  $$('[data-b]').forEach(el => { el.textContent = P[el.dataset.b] != null ? P[el.dataset.b] : ''; });
  $$('[data-href]').forEach(el => {
    const v = el.dataset.href;
    if (v.startsWith('tel:')) el.href = 'tel:' + P[v.slice(4)];
    else if (v.startsWith('mailto:')) el.href = 'mailto:' + P[v.slice(7)];
    else el.href = P[v] || '#';
  });
  $('#yr').textContent = new Date().getFullYear();
  const f1 = $('.f1 b'); if (f1) f1.dataset.n = Math.floor((new Date().getFullYear() - P.since) / 5) * 5;

  /* ---------- hero ---------- */
  const frame = $('#frame');
  if (P.photo) frame.innerHTML = '<img src="' + esc(P.photo) + '" alt="' + esc(P.full) + '">';
  else {
    frame.classList.add('ph');
    frame.innerHTML = '<svg viewBox="0 0 400 500" fill="none" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".32"/><stop offset="1" stop-color="var(--acc)" stop-opacity=".03"/></linearGradient></defs><circle cx="200" cy="180" r="62" fill="url(#g)"/><path d="M60 500c0-92 62-150 140-150s140 58 140 150z" fill="url(#g)"/></svg>';
  }
  $('#stats').innerHTML = S.stats.map(s => '<div><b><i data-n="' + s.n + '">0</i>' + (s.suf ? '<sup>' + esc(s.suf) + '</sup>' : '') + '</b><span>' + esc(s.label) + '</span></div>').join('');
  const items = S.marquee.map(t => '<span>' + esc(t) + '</span>').join('');
  $('#tr').innerHTML = items + items;

  /* ---------- тема ---------- */
  $('#theme').onclick = () => {
    const d = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = d; store.set('theme', d);
  };

  /* ---------- шапка, меню, навигация ---------- */
  const hd = $('#hd');
  const bg = $('#bg'), nav = $('#nav');
  const closeNav = () => { bg.classList.remove('on'); nav.classList.remove('open'); bg.setAttribute('aria-expanded', 'false'); };
  bg.onclick = () => { const o = nav.classList.toggle('open'); bg.classList.toggle('on', o); bg.setAttribute('aria-expanded', o); };
  $$('a', nav).forEach(a => a.addEventListener('click', closeNav));
  const rl = $$('#rail a'), secs = rl.map(a => $(a.getAttribute('href')));
  const tlEl = $('#tl'), tlf = $('#tlf');
  function onScroll() {
    hd.classList.toggle('scrolled', scrollY > 20);
    let i = 0; secs.forEach((s, k) => { if (s && s.getBoundingClientRect().top < innerHeight * .4) i = k; });
    rl.forEach((a, k) => a.classList.toggle('on', k === i));
    const r = tlEl.getBoundingClientRect();
    const p = Math.min(Math.max((innerHeight * .65 - r.top) / r.height, 0), 1);
    tlf.style.height = (p * 100) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* магнитные кнопки */
  if (matchMedia('(hover:hover)').matches && !reduce) $$('.mag').forEach(b => {
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * .18 + 'px,' + (e.clientY - r.top - r.height / 2) * .28 + 'px)'; });
    b.addEventListener('mouseleave', () => b.style.transform = '');
  });

  /* ---------- обо мне ---------- */
  const A = S.about;
  $('#bento').innerHTML =
    '<div class="cell c-quote rv"><q>' + esc(A.quote) + '</q><div class="who">' + esc(P.full) + '</div></div>' +
    '<div class="cell c-text rv"><span class="lab">Кратко</span><h3>Работаю предметно</h3>' + A.text.map(t => '<p>' + esc(t) + '</p>').join('') + '</div>' +
    '<div class="cell c-dir rv"><span class="lab">Практика</span><h3>Ключевые направления</h3><ul>' + A.directions.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></div>' +
    '<div class="cell c-ai rv"><span class="lab">Современные технологии</span><h3>ИИ-инструменты в работе над делом</h3><ul>' + A.ai.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul><p class="note">* ' + esc(A.aiNote) + '</p></div>' +
    '<div class="cell c-edu rv"><b>' + A.education.year + '</b><div><span class="lab">Образование</span><h3 style="margin:0">' + esc(A.education.school) + '</h3><span>' + esc(A.education.text) + '</span></div></div>';

  /* ---------- опыт ---------- */
  tlEl.insertAdjacentHTML('beforeend', S.experience.map(j =>
    '<div class="job rv' + (j.now ? ' now' : '') + '"><div class="yr">' + esc(j.years) + (j.now ? '<small>по настоящее время</small>' : '') + '</div>' +
    '<div class="card"><h3>' + esc(j.title) + '</h3><div class="pl">' + esc(j.place) + '</div><p>' + esc(j.text) + '</p><ul>' + j.points.map(p => '<li>' + esc(p) + '</li>').join('') + '</ul></div></div>'
  ).join(''));

  /* ---------- услуги ---------- */
  const pills = $('#pills'), ind = $('#ind'), cards = $('#cards');
  S.categories.forEach((c, i) => {
    const b = document.createElement('button');
    b.textContent = c.title; b.dataset.id = c.id; b.setAttribute('role', 'tab');
    b.onclick = () => setCat(c.id);
    pills.appendChild(b);
  });
  function setCat(id) {
    $$('button', pills).forEach(b => {
      const on = b.dataset.id === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on);
      if (on) { ind.style.left = b.offsetLeft + 'px'; ind.style.width = b.offsetWidth + 'px'; }
    });
    const list = S.services.filter(s => id === 'all' || s.cat === id);
    cards.innerHTML = list.map((s, i) =>
      '<article class="sv" style="animation-delay:' + i * 40 + 'ms"><h3>' + esc(s.title) + '</h3><p>' + esc(s.desc) + '</p>' +
      '<div class="meta"><span class="term">' + esc(s.term) + '</span><span class="price">' + esc(s.price) + '</span></div>' +
      '<button class="ask" data-svc="' + s.id + '">Спросить</button></article>').join('');
  }
  setCat('all');
  addEventListener('resize', () => { const on = $('button.on', pills); if (on) { ind.style.left = on.offsetLeft + 'px'; ind.style.width = on.offsetWidth + 'px'; } });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { const on = $('button.on', pills); if (on) { ind.style.left = on.offsetLeft + 'px'; ind.style.width = on.offsetWidth + 'px'; } });
  cards.addEventListener('click', e => { const b = e.target.closest('[data-svc]'); if (b) openBot('Расскажите про услугу «' + svcById(b.dataset.svc).title + '»', { svc: b.dataset.svc }); });
  $('#pnote').textContent = S.priceNote;
  $('#pk').innerHTML = S.packages.map(p =>
    '<div class="pkg rv' + (p.feat ? ' feat' : '') + '"><span class="tag">' + esc(p.tag) + '</span><h3>' + esc(p.title) + '</h3><p>' + esc(p.desc) + '</p><span class="badge">' + esc(p.badge) + '</span><div class="price">' + esc(p.price) + '</div>' +
    '<button class="btn ' + (p.feat ? 'light' : 'fill') + '" data-pkg="' + p.id + '">Оформить</button></div>').join('');
  $('#pk').addEventListener('click', e => {
    const b = e.target.closest('[data-pkg]'); if (!b) return;
    const p = S.packages.find(x => x.id === b.dataset.pkg);
    goForm('Хочу оформить пакет «' + p.title + '» (' + p.price + ').');
  });
  function svcById(id) { return S.services.find(s => s.id === id); }

  /* ---------- подбор услуги ---------- */
  const qbox = $('#qbox'); let qa = {}, qlabels = [], qi = 0;
  function renderQ() {
    const st = S.quiz.steps[qi];
    qbox.innerHTML = '<div class="qprog">' + S.quiz.steps.map((_, k) => '<i class="' + (k <= qi ? 'on' : '') + '"></i>').join('') + '</div>' +
      '<div class="qq">' + esc(st.q) + '</div><div class="qo">' + st.opts.map((o, k) => '<button data-k="' + k + '">' + esc(o.t) + '</button>').join('') + '</div>';
  }
  function renderRes() {
    const s = svcById(S.quiz.pick(qa));
    qbox.innerHTML = '<div class="qres"><span class="lab">Вам подойдёт</span>' +
      '<p class="det"><b>Установлено.</b> ' + esc(qlabels.join('; ')) + '.</p><p class="det"><b>Рекомендовано.</b></p>' +
      '<h4>' + esc(s.title) + '</h4><p>' + esc(s.desc) + '</p>' +
      '<div class="row"><span class="price">' + esc(s.price) + '</span><button class="btn fill" id="qgo">Оставить заявку</button><button class="btn ghost" id="qask">Спросить помощника</button></div>' +
      '<button class="again" id="qagain">Пройти заново</button></div>';
    $('#qgo').onclick = () => goForm('Подбор услуги: «' + s.title + '». Ответы: ' + qlabels.join('; ') + '.');
    $('#qask').onclick = () => openBot('Расскажите про услугу «' + s.title + '»', { svc: s.id });
    $('#qagain').onclick = () => { qa = {}; qlabels = []; qi = 0; renderQ(); };
  }
  qbox.addEventListener('click', e => {
    const b = e.target.closest('.qo button'); if (!b) return;
    const st = S.quiz.steps[qi], o = st.opts[+b.dataset.k];
    qa[st.key] = o.v; qlabels.push(o.t);
    qi++; qi < S.quiz.steps.length ? renderQ() : renderRes();
  });
  renderQ();

  /* ---------- FAQ ---------- */
  $('#faqlist').innerHTML = S.faq.map((f, i) =>
    '<div class="qa rv"><button aria-expanded="false" aria-controls="a' + i + '">' + esc(f.q) + '<span class="pm"></span></button><div class="ans" id="a' + i + '"><div><p>' + esc(f.a) + '</p></div></div></div>').join('');
  $('#faqlist').addEventListener('click', e => {
    const b = e.target.closest('.qa > button'); if (!b) return;
    const qaEl = b.parentElement, was = qaEl.classList.contains('open');
    $$('.qa.open').forEach(x => { x.classList.remove('open'); $('button', x).setAttribute('aria-expanded', 'false'); });
    if (!was) { qaEl.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
  });

  /* ---------- API для модулей features.js / fx.js ---------- */
  let io;
  const api = { S, $, $$, esc, goForm, toast, typo, svcById, reduce, store, sess, snd, observe: el => io && io.observe(el), openBot: (t, o) => window.openBot(t, o) };
  window.App = api;
  /* ---------- появление при прокрутке и счётчики ---------- */
  function count(el) {
    const to = +el.dataset.n, suf = el.dataset.s || '', t0 = performance.now(), d = 1600;
    if (reduce) { el.textContent = to + suf; return; }
    (function f(t) { const p = Math.min((t - t0) / d, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e) + (p === 1 ? suf : ''); if (p < 1) requestAnimationFrame(f); })(t0);
  }
  io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    if (en.target.dataset.n) setTimeout(() => count(en.target), en.target.closest('.hero') ? 700 : 0);
    io.unobserve(en.target);
  }), { threshold: .12 });
  if (window.initFeatures) window.initFeatures(api);
  typo(document.querySelector('main')); typo(document.querySelector('footer'));
  $$('.rv,[data-n]').forEach(el => io.observe(el));

  /* ---------- форма заявки ---------- */
  async function submitLead(data) {
    data.page = location.href; data.time = new Date().toISOString();
    if (!CONFIG.leadEndpoint) { console.info('[lead]', data); return true; }
    try {
      const r = await fetch(CONFIG.leadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      return r.ok;
    } catch (e) { return false; }
  }
  const phoneIn = $('#f-phone');
  phoneIn.addEventListener('input', () => {
    let d = phoneIn.value.replace(/\D/g, '');
    if (d[0] === '7' || d[0] === '8') d = d.slice(1);
    d = d.slice(0, 10);
    let o = d.length ? '+7 (' + d.slice(0, 3) : '';
    if (d.length >= 3) o += ') ' + d.slice(3, 6);
    if (d.length >= 6) o += '-' + d.slice(6, 8);
    if (d.length >= 8) o += '-' + d.slice(8, 10);
    phoneIn.value = o;
  });
  function goForm(text) {
    $('#f-msg').value = text;
    $('#contacts').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(() => $('#f-name').focus({ preventScroll: true }), 700);
  }
  const lead = $('#lead');
  const setBad = (el, bad) => el.closest('.fld,.agree').classList.toggle('bad', bad);
  lead.addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#f-name'), ok = $('#f-ok');
    const nameOk = name.value.trim().length >= 2;
    const phOk = phoneIn.value.replace(/\D/g, '').length === 11;
    setBad(name, !nameOk); setBad(phoneIn, !phOk); $('#agree').classList.toggle('bad', !ok.checked);
    [!nameOk && name, !phOk && phoneIn, !ok.checked && ok].filter(Boolean).forEach(x => { const f = x.closest('.fld,.agree'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); });
    if (!nameOk || !phOk || !ok.checked) { (!nameOk ? name : !phOk ? phoneIn : ok).focus(); return; }
    const btn = $('button[type=submit]', lead); btn.disabled = true; btn.classList.add('loading');
    if (lead.website.value) { $('#glass').classList.add('sent'); return; }   // ловушка для ботов
    const sent = await submitLead({ source: 'form', name: name.value.trim(), phone: phoneIn.value, message: $('#f-msg').value.trim(), slot: api.getSlot ? api.getSlot() : '' });
    btn.disabled = false; btn.classList.remove('loading');
    if (sent) {
      btn.classList.add('okd'); snd('ok'); window.confetti && window.confetti(btn);
      setTimeout(() => { $('#glass').classList.add('sent'); btn.classList.remove('okd'); }, 900);
    } else { toast('Не удалось отправить. Позвоните: ' + P.phone); }
  });
  $$('input', lead).forEach(i => i.addEventListener('input', () => {
    const f = i.closest('.fld'); if (f) f.classList.remove('bad'); $('#agree').classList.remove('bad');
    if (i.id === 'f-name') f.classList.toggle('ok', i.value.trim().length >= 2);
    if (i.id === 'f-phone') f.classList.toggle('ok', i.value.replace(/\D/g, '').length === 11);
  }));

  /* ---------- чат ---------- */
  const cw = $('#cw'), cbtn = $('#chatbtn'), msgs = $('#msgs'), chips = $('#chips'), cin = $('#ci'), hint = $('#hint');
  let hist = sess.get('chat') || [], leadSt = null, apiDown = false, busy = false, opened = false;
  const badge = $('b', cbtn);

  let userName = sess.get('name') || '';
  function addMsg(role, text, save) {
    const d = document.createElement('div'); d.className = 'm ' + role; d.textContent = text; msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    if (save !== false) { hist.push({ r: role, t: text }); sess.set('chat', hist.slice(-40)); }
    return d;
  }
  function typeInto(d, text) {
    if (reduce || document.hidden || text.length > 500) { d.textContent = text; return Promise.resolve(); }
    const total = Math.min(1700, text.length * 14), t0 = performance.now();
    return new Promise(res => (function f(t) {
      const p = Math.min((t - t0) / total, 1);
      d.textContent = text.slice(0, Math.ceil(text.length * p)); msgs.scrollTop = msgs.scrollHeight;
      p < 1 ? requestAnimationFrame(f) : res();
    })(t0));
  }
  function addCard(s) {
    const c = document.createElement('div'); c.className = 'mcard';
    c.innerHTML = '<b>' + esc(s.title) + '</b><span>' + esc(s.price) + ' · ' + esc(s.term) + '</span><button>Оставить заявку</button>';
    c.querySelector('button').onclick = () => { closeChat(); goForm('Интересует услуга «' + s.title + '» (' + s.price + ').'); };
    msgs.appendChild(c); msgs.scrollTop = msgs.scrollHeight;
  }
  function setChips(list) {
    chips.innerHTML = (list || []).map(t => '<button>' + esc(t) + '</button>').join('');
  }
  const JUMP = { '↗ Калькулятор стоимости': '#calc', '↗ Подбор услуги': '#quiz', '↗ Как проходит работа': '#how', '↗ Частые ситуации': '#cases' };
  chips.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const j = JUMP[b.textContent];
    if (j) { if (innerWidth <= 640) closeChat(); const el = $(j); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); return; }
    userSays(b.textContent);
  });
  function typing() { const d = document.createElement('div'); d.className = 'm bot typing'; d.innerHTML = '<i></i><i></i><i></i>'; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d; }
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  async function botSays(text, chipList, svc) {
    const t = typing(); await wait(Math.min(300 + text.length * 3, 800)); t.remove();
    const d = addMsg('bot', '', false); snd('msg');
    await typeInto(d, text);
    hist.push({ r: 'bot', t: text }); sess.set('chat', hist.slice(-40));
    if (svc) addCard(svc);
    setChips(chipList);
  }

  if (hist.length) { hist.forEach(m => addMsg(m.r, m.t, false)); setChips(S.botChips); }
  else { addMsg('bot', S.botGreeting); setChips(S.botChips); }

  const SEC_CHIPS = {
    cases: ['Получил повестку в суд', 'Выписали штраф', 'Мне не платят по договору', 'Оставить заявку'],
    price: ['Сколько стоит консультация?', '↗ Калькулятор стоимости', '↗ Подбор услуги', 'Как проходит оплата?'],
    how: ['Как быстро вы ответите?', 'Какие документы нужны?', 'Оставить заявку'],
    faq: ['Первая консультация платная?', 'Работаете ли вы онлайн?', 'Оставить заявку'],
    contacts: ['Оставить заявку', 'Как быстро вы ответите?']
  };
  function sectionChips() {
    let id = ''; ['cases', 'price', 'how', 'faq', 'contacts'].forEach(k => { const e = $('#' + k); if (!e) return; const r = e.getBoundingClientRect(); if (r.top < innerHeight * .5 && r.bottom > innerHeight * .3) id = k; });
    return SEC_CHIPS[id] || S.botChips;
  }
  function openChat() {
    if (!hist.some(m => m.r === 'me')) setChips(sectionChips());
    cw.classList.add('open'); cbtn.classList.add('hide'); hint.classList.remove('show'); opened = true;
    if (badge && badge.parentElement) badge.remove();
    if (innerWidth > 640) setTimeout(() => cin.focus(), 300);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function closeChat() { cw.classList.remove('open'); cbtn.classList.remove('hide'); }
  cbtn.onclick = openChat; $('#cx').onclick = closeChat;
  addEventListener('keydown', e => { if (e.key === 'Escape' && cw.classList.contains('open')) closeChat(); });
  setTimeout(() => { if (!opened && !sess.get('hint') && innerWidth > 640) { hint.classList.add('show'); sess.set('hint', 1); setTimeout(() => hint.classList.remove('show'), 8000); } }, 12000);

  window.openBot = function (text, opt) { openChat(); userSays(text, opt); };
  $$('[data-bot]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); closeNav(); openBot(el.dataset.bot); }));

  $('#cf').addEventListener('submit', e => { e.preventDefault(); const v = cin.value.trim(); if (!v) return; cin.value = ''; userSays(v); });

  async function userSays(text, opt) {
    if (busy) return;
    busy = true; addMsg('me', text); setChips([]);
    try {
      if (leadSt) await leadStep(text);
      else if (opt && opt.svc) await botSays(svcAnswer(svcById(opt.svc), true), ['Оставить заявку', 'Какие документы нужны?', '↗ Калькулятор стоимости'], svcById(opt.svc));
      else {
        const loc = localAnswer(text);
        if (loc.lead) { leadSt = { step: 'name' }; await botSays('Передам вашу заявку юристу. Как к вам обращаться?', ['Отмена']); }
        else if (loc.confident || !CONFIG.botApi || apiDown) await botSays(loc.text, loc.chips);
        else {
          const t = typing();
          const r = await askApi();
          t.remove();
          if (r) { addMsg('bot', r); setChips(['Оставить заявку', 'Услуги и цены']); }
          else await botSays(loc.text, loc.chips);
        }
      }
    } finally { busy = false; }
  }

  async function leadStep(text) {
    if (/^(отмена|не надо|стоп)$/i.test(text.trim())) { leadSt = null; return botSays('Хорошо, не буду оформлять заявку. Чем ещё помочь?', S.botChips); }
    if (leadSt.step === 'name') {
      if (text.trim().length < 2) return botSays('Напишите, пожалуйста, имя.', ['Отмена']);
      leadSt.name = text.trim().slice(0, 80); leadSt.step = 'phone'; userName = leadSt.name; sess.set('name', userName);
      return botSays('Приятно познакомиться, ' + leadSt.name + '. Оставьте номер телефона, по которому удобно связаться.', ['Отмена']);
    }
    const digits = text.replace(/\D/g, '');
    if (digits.length < 10) return botSays('Не вижу полного номера. Напишите телефон в формате +7 900 000-00-00.', ['Отмена']);
    const ctx = hist.filter(m => m.r === 'me').slice(-4).map(m => m.t).join(' | ');
    const ok = await submitLead({ source: 'bot', name: leadSt.name, phone: text.trim(), message: ctx });
    const nm = leadSt.name; leadSt = null;
    return botSays(ok ? 'Спасибо, ' + nm + '! Заявка передана. Юрист свяжется с вами в течение рабочего дня.' : 'Не получилось отправить заявку. Позвоните, пожалуйста: ' + P.phone + '.', S.botChips);
  }

  function svcAnswer(s, card) {
    return card ? s.desc + '\nТочная цена фиксируется в договоре до начала работы. Оформить заявку?'
      : s.title + '\n' + s.desc + '\nСрок: ' + s.term + '. Стоимость: ' + s.price + '. Точная цена фиксируется в договоре до начала работы.\nОформить заявку?';
  }
  const ws = (s, kw) => new RegExp('(^|[^а-яёa-z0-9])' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(s);
  function bestBy(list, kwOf, s) {
    let best = null, sc = 0;
    list.forEach(x => kwOf(x).forEach(k => { if (ws(s, k) && k.length > sc) { sc = k.length; best = x; } }));
    return best;
  }
  function localAnswer(text) {
    const s = text.toLowerCase().replace(/ё/g, 'е');
    if (/заявк|перезвон|свяжитесь|связаться|записат|записа[тт]ься|оставить/.test(s)) return { lead: true };
    const sv = bestBy(S.services, x => x.kw, s);
    if (/цен|стоит|стоимост|сколько|прайс|тариф/.test(s)) {
      if (sv) return { confident: true, text: svcAnswer(sv), chips: ['Оставить заявку', 'Как проходит оплата?'] };
      return { confident: true, text: 'Консультация: от 2 000 ₽ за 60 минут. Документы: от 5 000 ₽. Ведение дела в суде под ключ: от 45 000 ₽. Полный прайс — в разделе «Услуги и цены». Назовите услугу, и подскажу точнее.', chips: ['Оставить заявку', '↗ Калькулятор стоимости', '↗ Подбор услуги'] };
    }
    if (sv) return { confident: true, text: svcAnswer(sv), chips: ['Оставить заявку', 'Какие документы нужны?'] };
    const fq = bestBy(S.faq, x => x.kw || [], s);
    if (fq) return { confident: true, text: fq.a, chips: ['Оставить заявку', 'Услуги и цены'] };
    if (/подбор/.test(s)) { $('#quiz').scrollIntoView({ behavior: 'smooth', block: 'center' }); return { confident: true, text: 'Подбор услуги по трём вопросам — в блоке под тарифами. Я прокрутил страницу к нему.', chips: S.botChips }; }
    if (/услуг/.test(s)) return { confident: true, text: 'Все услуги и цены собраны в разделе «Услуги и цены», есть фильтр по темам. Назовите вашу ситуацию, и я подскажу подходящую.', chips: S.botChips };
    if (/телефон|позвон|почт|email|e-mail|адрес|контакт|график|часы/.test(s)) return { confident: true, text: 'Телефон: ' + P.phone + '\nПочта: ' + P.email + '\nЧасы работы: ' + P.hours, chips: ['Оставить заявку'] };
    if (/калькулятор|рассчита|посчита/.test(s)) { $('#calc').scrollIntoView({ behavior: 'smooth', block: 'center' }); return { confident: true, text: 'Калькулятор стоимости — в разделе «Услуги и цены». Я прокрутил страницу к нему.', chips: S.botChips }; }
    if (/привет|здравств|добрый|добрая/.test(s)) return { confident: true, text: 'Здравствуйте' + (userName ? ', ' + userName : '') + '! Что вас интересует: услуги, цены, сроки или документы?', chips: S.botChips };
    if (/спасибо|благодар/.test(s)) return { confident: true, text: 'Пожалуйста! Если появятся вопросы, пишите.', chips: S.botChips };
    return { text: 'Не уверен, что правильно понял вопрос. Могу передать его юристу, он ответит лично. Оставить заявку?', chips: ['Оставить заявку', 'Услуги и цены'] };
  }

  function ctxText() {
    return 'УСЛУГИ:\n' + S.services.map(s => '- ' + s.title + ': ' + s.price + ', ' + s.term + '. ' + s.desc).join('\n') +
      '\nПАКЕТЫ:\n' + S.packages.map(p => '- ' + p.title + ': ' + p.price + '. ' + p.desc).join('\n') +
      '\nЧАСТЫЕ ВОПРОСЫ:\n' + S.faq.map(f => '- ' + f.q + ' ' + f.a).join('\n') +
      '\nКОНТАКТЫ: ' + P.phone + ', ' + P.email + ', ' + P.hours + '\nЮРИСТ: ' + P.full + ', практика с ' + P.since + ' года.';
  }
  async function askApi() {
    const m = hist.slice(-10).map(x => ({ role: x.r === 'me' ? 'user' : 'assistant', content: x.t }));
    while (m.length && m[0].role !== 'user') m.shift();
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(CONFIG.botApi, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: m, context: ctxText() }), signal: ctl.signal });
      if (!r.ok) { if (r.status === 404 || r.status === 405 || r.status === 501 || r.status === 503) apiDown = true; return null; }
      const j = await r.json(); return j.reply || null;
    } catch (e) { apiDown = true; return null; } finally { clearTimeout(to); }
  }

  /* ---------- cookie ---------- */
  const ck = $('#ck');
  if (!store.get('ck')) setTimeout(() => ck.classList.add('show'), 900);
  $('#ckok').onclick = () => { store.set('ck', '1'); ck.classList.remove('show'); };
})();
