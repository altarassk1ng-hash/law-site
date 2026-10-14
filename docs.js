/* Оформление «как документ»: шапка дела, печать, подпись, счётчик страниц, штамп. */
(function () {
  'use strict';
  const A = window.App; if (!A) return;
  const $ = A.$, $$ = A.$$, P = A.S.person, reduce = A.reduce;
  const NS = 'http://www.w3.org/2000/svg';
  const MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const now = new Date(), p2 = n => String(n).padStart(2, '0');
  const dateRu = now.getDate() + ' ' + MON[now.getMonth()] + ' ' + now.getFullYear() + ' г.';

  /* шапка дела над первым экраном */
  const grid = $('.hero .grid');
  if (grid) {
    const h = document.createElement('div');
    h.className = 'casehd fade';
    h.innerHTML = '<span>Дело <b>№ ' + p2(now.getDate()) + p2(now.getMonth() + 1) + '/' + now.getFullYear() + '</b></span>' +
      '<span>Исх. <b>№ 001</b></span><span>' + A.esc(dateRu) + '</span><span>Приём заявок · <b>открыт</b></span>';
    grid.parentNode.insertBefore(h, grid);
  }

  /* печать на портрете */
  const portrait = $('.portrait');
  if (portrait) {
    const name = (P.short || P.full || '').toUpperCase();
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 150 150'); s.setAttribute('class', 'seal'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<defs><path id="sealp" d="M75 75 m-54 0 a54 54 0 1 1 108 0 a54 54 0 1 1 -108 0"/></defs>' +
      '<circle cx="75" cy="75" r="70" stroke-width="2"/><circle cx="75" cy="75" r="64" stroke-width=".8"/><circle cx="75" cy="75" r="40" stroke-width=".8"/>' +
      '<text><textPath href="#sealp" startOffset="0">' + A.esc(name) + ' · ЮРИСТ · С ' + A.esc(String(P.since || '')) + ' · </textPath></text>' +
      '<text class="c" x="75" y="90">§</text>';
    portrait.appendChild(s);
  }

  /* подпись, прорисовывающаяся при появлении */
  const D1 = 'M4 40 C12 6 26 4 24 28 C23 42 34 40 42 18 C46 8 50 34 58 28 C66 22 70 12 78 22 C86 34 92 40 100 24 C106 12 112 18 112 28 C112 36 120 36 130 22 C138 12 146 26 160 20 C170 16 176 20 186 14';
  const D2 = 'M12 50 C60 42 120 48 184 36';
  function sig(host) {
    if (!host) return;
    const d = document.createElement('div');
    d.innerHTML = '<svg class="sig" viewBox="0 0 192 56" aria-hidden="true"><path pathLength="1" d="' + D1 + '"/><path pathLength="1" d="' + D2 + '"/></svg><span class="sig-cap">' + A.esc(P.short || '') + '</span>';
    host.appendChild(d);
    const el = $('.sig', d);
    if (reduce || !('IntersectionObserver' in window)) { el.classList.add('go'); return; }
    new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { setTimeout(() => el.classList.add('go'), 500); o.disconnect(); } }, { threshold: .6 }).observe(el);
  }
  sig($('.c-quote'));
  sig($('#contacts .ci'));

  /* «Стр. N / M» в боковой рейке */
  const rail = $('#rail');
  if (rail) {
    const links = $$('a', rail), pg = document.createElement('span');
    pg.className = 'pg'; rail.insertBefore(pg, rail.firstChild);
    const upd = () => {
      const i = Math.max(0, links.findIndex(a => a.classList.contains('on')));
      pg.innerHTML = 'Стр. <b>' + (i + 1) + '</b> / ' + links.length;
    };
    upd();
    new MutationObserver(upd).observe(rail, { subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  /* пометки на полях: в левой колонке под «Статья N» */
  const NT = A.S.notes || {};
  Object.keys(NT).forEach((id, i) => {
    const sh = $('#' + id + ' .sh'); if (!sh) return;
    const n = document.createElement('aside');
    n.className = 'mn'; n.innerHTML = '<b>Прим. ' + (i + 1) + '</b>' + A.esc(NT[id]);
    sh.appendChild(n);
  });

  /* вымарки: нажатие или фокус открывают/закрывают полосу */
  document.addEventListener('click', e => { const r = e.target.closest('.rd'); if (r) r.classList.toggle('open'); });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('rd')) { e.preventDefault(); e.target.classList.toggle('open'); } });

  /* штамп «ПРИНЯТО» вместо конфетти */
  window.confetti = function () {
    const g = $('#glass'); if (!g) return;
    const old = $('.stamp', g); if (old) old.remove();
    const st = document.createElement('div');
    st.className = 'stamp';
    st.innerHTML = '<b>Принято</b><small>' + p2(now.getDate()) + '.' + p2(now.getMonth() + 1) + '.' + now.getFullYear() + ' · № ' + Math.floor(1000 + Math.random() * 9000) + '</small>';
    g.appendChild(st);
    if (!reduce) { setTimeout(() => { g.classList.add('thud'); A.snd && A.snd('tick'); }, 280); setTimeout(() => g.classList.remove('thud'), 700); }
    setTimeout(() => st.remove(), 5800);
  };
})();
