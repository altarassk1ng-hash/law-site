/* Эффекты и «шлифовка». Всё отключается при prefers-reduced-motion; на телефонах тяжёлое не включается. */
(function () {
  'use strict';
  const A = window.App, $ = A.$, $$ = A.$$, reduce = A.reduce;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const root = document.documentElement;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  /* ---------- заставка ---------- */
  const pre = $('#pre');
  function endPre() {
    root.classList.remove('pre-on');
    if (pre) { pre.classList.add('out'); setTimeout(() => pre.remove(), 700); }
    try { sessionStorage.setItem('pre', '1'); } catch (e) {}
  }
  if (root.classList.contains('pre-on') && !reduce) setTimeout(endPre, 1100); else endPre();

  /* ---------- инерционная прокрутка (колесо мыши/тачпад) ---------- */
  const maxY = () => root.scrollHeight - innerHeight;
  let target = scrollY, cur = scrollY, active = false;
  const smooth = fine && !reduce;
  function loop() {
    cur += (target - cur) * .11;
    if (Math.abs(target - cur) < .4) { cur = target; active = false; }
    scrollTo(0, cur);
    if (active) requestAnimationFrame(loop);
  }
  if (smooth) {
    root.style.scrollBehavior = 'auto';
    addEventListener('wheel', e => {
      if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.target.closest('.msgs,textarea,.cw,.rv-track,.pills,.bk-d,.bk-t,select')) return;
      e.preventDefault();
      const d = e.deltaMode === 1 ? e.deltaY * 34 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      if (!active) { cur = scrollY; target = scrollY; }
      target = clamp(target + d, 0, maxY());
      if (!active) { active = true; requestAnimationFrame(loop); }
    }, { passive: false });
    addEventListener('scroll', () => { if (!active) { target = cur = scrollY; } }, { passive: true });
  }
  function smoothTo(y) {
    y = clamp(y, 0, maxY());
    if (!smooth) { scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); return; }
    cur = scrollY; target = y;
    if (!active) { active = true; requestAnimationFrame(loop); }
  }
  window.smoothTo = smoothTo;
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href'); if (id === '#') return;
    const el = id === '#top' ? document.body : $(id); if (!el) return;
    e.preventDefault();
    smoothTo(id === '#top' ? 0 : el.getBoundingClientRect().top + scrollY - 70);
  });

  /* ---------- прогресс чтения, шапка, параллакс ---------- */
  const prog = $('#prog'), hd = $('#hd'), px = $$('[data-px]');
  let lastY = scrollY, tick = false;
  function onScroll() {
    tick = false;
    const y = scrollY, m = maxY();
    prog.style.transform = 'scaleX(' + (m > 0 ? y / m : 0) + ')';
    const dy = y - lastY;
    if (Math.abs(dy) > 6) {
      const navOpen = $('#nav').classList.contains('open');
      hd.classList.toggle('hide', dy > 0 && y > 500 && !navOpen);
      lastY = y;
    }
    if (y < 120) hd.classList.remove('hide');
    if (!reduce) px.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > innerHeight + 100) return;
      el.style.transform = 'translateY(' + ((r.top + r.height / 2 - innerHeight / 2) * -.09).toFixed(1) + 'px)';
    });
  }
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- каскад появления и пословное раскрытие заголовков ---------- */
  ['.cards', '.bento', '.pk', '.sit', '.proc', '#faqlist', '#tl', '.stats'].forEach(sel => {
    const p = $(sel); if (!p) return;
    $$(':scope > .rv, :scope > *', p).forEach((c, i) => c.style.setProperty('--d', (i * 90) + 'ms'));
  });
  $$('[data-split]').forEach(h => {
    const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT), nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    let n = 0;
    nodes.forEach(t => {
      const frag = document.createDocumentFragment();
      t.nodeValue.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const o = document.createElement('span'); o.className = 'w';
        const i = document.createElement('span'); i.textContent = part; i.style.transitionDelay = (n++ * 60) + 'ms';
        o.appendChild(i); frag.appendChild(o);
      });
      t.parentNode.replaceChild(frag, t);
    });
    h.classList.add('split');
  });

  /* ---------- наклон и блик карточек ---------- */
  if (fine && !reduce) {
    const SEL = '.sv,.cell,.pkg,.rv-c,.sc,.calc .cc-f';
    let last = null;
    addEventListener('pointermove', e => {
      const c = e.target.closest && e.target.closest(SEL);
      if (last && last !== c) { last.style.removeProperty('--tilt'); last.style.removeProperty('--mx'); last = null; }
      if (!c) return;
      last = c;
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', (x * 100) + '%'); c.style.setProperty('--my', (y * 100) + '%');
      if (c.classList.contains('sc') || c.classList.contains('cc-f')) return;   // у этих только блик
      const feat = c.classList.contains('feat') ? ' scale(1.04)' : '';
      c.style.transform = 'perspective(900px) rotateX(' + ((.5 - y) * 5).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 6).toFixed(2) + 'deg) translateY(-6px)' + feat;
      c.style.transition = 'transform .08s linear, box-shadow .3s, border-color .3s';
    }, { passive: true });
    addEventListener('pointerout', e => {
      const c = e.target.closest && e.target.closest(SEL);
      if (c && !c.contains(e.relatedTarget)) { c.style.transform = ''; c.style.transition = ''; }
    });
  }

  /* ---------- смена темы расходящимся кругом ---------- */
  const tb = $('#theme');
  tb.onclick = e => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const apply = () => {
      root.classList.add('no-tr');                       // на время смены гасим переходы цвета: иначе мелькают промежуточные цвета
      root.dataset.theme = next; A.store.set('theme', next);
      void root.offsetWidth;
    };
    const done = () => root.classList.remove('no-tr');
    if (!document.startViewTransition || reduce) { apply(); requestAnimationFrame(() => requestAnimationFrame(done)); return; }
    const r = tb.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(apply);
    t.ready.then(() => root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] },
      { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
    t.finished.then(done, done);
  };

  /* ---------- вкладка браузера ---------- */
  const title = document.title;
  document.addEventListener('visibilitychange', () => { document.title = document.hidden ? '⚖ Ждём вас — ' + A.S.person.short : title; });

  /* ---------- звуки интерфейса (по умолчанию выключены) ---------- */
  let ctx = null, on = A.store.get('snd', '0') === '1';
  const sb = $('#snd');
  const lab = () => { sb.textContent = 'Звуки интерфейса: ' + (on ? 'вкл' : 'выкл'); sb.setAttribute('aria-pressed', on); };
  lab();
  sb.onclick = () => { on = !on; A.store.set('snd', on ? '1' : '0'); lab(); if (on) window.UIsound('ok'); };
  const NOTES = { tick: [[880, 0, .035]], msg: [[660, 0, .06], [880, .07, .08]], ok: [[660, 0, .08], [990, .09, .14]] };
  window.UIsound = function (k) {
    if (!on || reduce) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      (NOTES[k] || []).forEach(n => {
        const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + n[1];
        o.type = 'sine'; o.frequency.value = n[0]; g.gain.setValueAtTime(.0001, t);
        g.gain.exponentialRampToValueAtTime(.04, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + n[2]);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + n[2] + .02);
      });
    } catch (e) {}
  };

  /* ---------- вибрация на телефоне ---------- */
  document.addEventListener('click', e => {
    if (navigator.vibrate && e.target.closest('.btn,.qo button,.pills button,.sc-h,.qa button,.chips button')) navigator.vibrate(6);
  });

  /* ---------- конфетти из тонких линий ---------- */
  window.confetti = function (el) {
    if (reduce) return;
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const cols = ['#E7A9B8', '#F0EEE7', '#C9647F', '#D9C28E'];
    for (let i = 0; i < 26; i++) {
      const p = document.createElement('i'); p.className = 'cfp';
      p.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;background:' + cols[i % cols.length] + ';height:' + (10 + Math.random() * 14) + 'px';
      document.body.appendChild(p);
      const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 150;
      p.animate([
        { transform: 'translate(0,0) rotate(' + (a * 57) + 'deg) scaleY(.3)', opacity: 1 },
        { transform: 'translate(' + Math.cos(a) * d + 'px,' + (Math.sin(a) * d + 30) + 'px) rotate(' + (a * 57 + 140) + 'deg) scaleY(1)', opacity: 0 }
      ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.1,.7,.3,1)' }).onfinish = () => p.remove();
    }
  };
})();
