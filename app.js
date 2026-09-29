/* VIP Training Gym — lee data/*.json (editable en /admin), arma la página y la anima */
(async () => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const fmt = n => Math.round(n).toLocaleString('es-CL');
  const pad = n => String(n).padStart(2, '0');

  /* ---------- Utilidades ---------- */
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else n.setAttribute(k, v === true ? '' : v);
    }
    n.append(...kids.flat().filter(k => k !== null && k !== undefined && k !== ''));
    return n;
  };
  const src = p => String(p || '').replace(/^\//, '');
  const isVideo = p => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(String(p || ''));
  // Foto o video (los videos se reproducen solos, sin sonido y en loop)
  const media = (path, alt = '', lazy = true) => {
    if (!isVideo(path)) return el('img', { src: src(path), alt, loading: lazy ? 'lazy' : null });
    const v = el('video', { src: src(path), autoplay: true, loop: true, playsinline: true, preload: 'metadata', 'aria-label': alt });
    v.muted = true;
    videoObserver?.observe(v);
    return v;
  };
  // Los videos se reproducen solo mientras se ven en pantalla
  const videoObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) e.target.play().catch(() => {});
    else e.target.pause();
  }), { threshold: .15 }) : null;
  const toHour = s => { const [h, m] = String(s || '0:0').split(':').map(Number); return (h || 0) + (m || 0) / 60; };

  async function load(name, fallback = {}) {
    try {
      const r = await fetch(`data/${name}.json`, { cache: 'no-cache' });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (e) {
      console.warn(`No se pudo leer data/${name}.json`, e);
      return fallback;
    }
  }

  /* ---------- 1. Datos ---------- */
  const [ajustes, portada, flyer, disciplinas, equipo, primer, espacio, comunidad, cierre] = await Promise.all(
    ['ajustes', 'portada', 'flyer', 'disciplinas', 'equipo', 'primer-dia', 'espacio', 'comunidad', 'cierre'].map(n => load(n))
  );
  const D = { ajustes, portada, flyer, disciplinas, equipo, primer, espacio, comunidad, cierre };
  const wa = String(ajustes.whatsapp || '').replace(/\D/g, '');
  const ig = String(ajustes.instagram || '').replace(/^@/, '');
  const waLink = msg => `https://wa.me/${wa}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;
  const H = ajustes.horario || {};
  const hours = {
    semana: [H.semana_abre, H.semana_cierra],
    sabado: [H.sabado_abre, H.sabado_cierra],
    domingo: [H.domingo_abre, H.domingo_cierra],
  };

  /* ---------- 2. Textos simples ---------- */
  $$('[data-t]').forEach(n => {
    const [grupo, campo] = n.dataset.t.split('.');
    n.textContent = D[grupo]?.[campo] ?? '';
  });
  $$('[data-wa]').forEach(a => (a.href = waLink(a.dataset.wa)));
  $$('[data-ig]').forEach(n => (n.textContent = ig));
  $$('[data-ig-link]').forEach(a => (a.href = `https://www.instagram.com/${ig}/`));
  $$('[data-hours]').forEach(n => { const [a, c] = hours[n.dataset.hours] || []; n.textContent = a && c ? `${a} — ${c}` : 'Cerrado'; });
  $$('[data-phone]').forEach(n => (n.textContent = wa.replace(/^56(\d)(\d{4})(\d{4})$/, '+56 $1 $2 $3')));
  const mapsQ = encodeURIComponent(ajustes.mapa || `${ajustes.direccion}, ${ajustes.comuna}`);
  $$('[data-maps]').forEach(a => (a.href = `https://maps.google.com/?q=${mapsQ}`));
  $('.map iframe').src = `https://maps.google.com/maps?q=${mapsQ}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  $('[data-cierre-wa]').href = waLink(cierre.mensaje_whatsapp);
  $('#year').textContent = new Date().getFullYear();

  const coaches = (equipo.coaches || []).filter(c => c.visible !== false && c.nombre);
  const counts = {
    seguidores: +ajustes.seguidores || 0,
    coaches: coaches.length,
    horas: Math.max(0, toHour(H.semana_cierra) - toHour(H.semana_abre)),
  };
  $$('[data-count-key]').forEach(n => (n.dataset.count = counts[n.dataset.countKey]));

  /* ---------- 3. Secciones ---------- */
  // Franjas
  $$('[data-franja]').forEach(t => {
    const frases = portada[t.dataset.franja] || [];
    const sep = t.dataset.franja === 'franja1' ? '✦' : '●';
    for (let r = 0; r < 2; r++) frases.forEach(f => t.append(el('span', { text: f }), el('i', { text: sep })));
  });

  // Historias de la portada
  const historias = (portada.historias || []).filter(h => h.archivo);
  const storyMedia = $('.story-media'), storyBars = $('.story-bars');
  historias.forEach((h, i) => {
    const m = media(h.archivo, h.descripcion || h.etiqueta, i > 0);
    m.dataset.label = h.etiqueta || '';
    storyMedia.append(m);
    storyBars.append(el('i'));
  });

  // Disciplinas
  const track = $('.disc-track');
  (disciplinas.lista || []).forEach((d, i) => track.append(
    el('article', { class: 'panel' },
      el('div', { class: 'panel-media' }, media(d.foto, d.titulo)),
      el('div', { class: 'panel-body' },
        el('span', { class: 'panel-num', text: pad(i + 1) }),
        el('h3', {}, d.titulo, d.subtitulo ? el('span', { text: d.subtitulo }) : null),
        el('p', { text: d.texto }),
        el('ul', { class: 'tags' }, (d.etiquetas || []).map(t => el('li', { text: t })))
      )
    )
  ));

  // Flyer (se oculta solo si está apagado o si ya pasó la fecha de término)
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date());
  const flyerOn = flyer.mostrar !== false && flyer.imagen && !(flyer.vence && String(flyer.vence).slice(0, 10) < hoy);
  if (flyerOn) {
    const sec = $('#promo');
    sec.hidden = false;
    $('.flyer-media', sec).replaceChildren(media(flyer.imagen, flyer.titulo));
    $$('[data-flyer-wa]').forEach(a => (a.href = waLink(flyer.mensaje_whatsapp)));
    if (flyer.vence) {
      const [y, m, d] = String(flyer.vence).slice(0, 10).split('-');
      $('[data-flyer-until]').textContent = `Válido hasta el ${d}/${m}/${y}`;
    }
    if (flyer.popup !== false && !isVideo(flyer.imagen)) {
      const pop = $('.popup');
      let seen = false;
      try { seen = sessionStorage.getItem('vip-popup') === flyer.imagen; } catch {}
      if (!seen) {
        $('img', pop).src = src(flyer.imagen);
        $('img', pop).alt = flyer.titulo || 'Promoción';
        const close = () => { pop.hidden = true; try { sessionStorage.setItem('vip-popup', flyer.imagen); } catch {} };
        $('.popup-close', pop).addEventListener('click', close);
        pop.addEventListener('click', e => { if (e.target === pop) close(); });
        $('a', pop).addEventListener('click', close);
        addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
        setTimeout(() => (pop.hidden = false), 4200);
      }
    }
  }

  // Coaches
  $('.coach-list').append(...coaches.map((c, i) => {
    const user = String(c.instagram || '').replace(/^@/, '');
    const first = c.nombre.split(' ')[0];
    const link = user
      ? el('a', { class: 'mono', href: `https://www.instagram.com/${user}/`, target: '_blank', rel: 'noreferrer', text: `@${user} ↗` })
      : el('a', { class: 'mono', href: waLink(`Hola, quiero entrenar con ${first}`), target: '_blank', rel: 'noreferrer', text: `Agenda con ${first} ↗` });
    return el('li', { class: 'coach' },
      el('button', { class: 'coach-row', 'aria-expanded': 'false' },
        el('span', { class: 'c-num mono', text: pad(i + 1) }),
        el('span', { class: 'c-name', text: c.nombre }),
        el('span', { class: 'c-role mono', text: c.rol }),
        el('span', { class: 'c-plus', text: '+' })
      ),
      el('div', { class: 'coach-detail' }, el('div', {}, el('div', { class: 'coach-inner' },
        c.foto ? el('span', { class: 'coach-photo' }, el('img', { src: src(c.foto), alt: `${c.nombre}, ${c.rol}`, loading: 'lazy' })) : null,
        el('p', { text: c.descripcion }),
        link
      )))
    );
  }));

  // Pasos del primer día
  $('.steps').append(...(primer.pasos || []).map((p, i) => el('li', {},
    el('span', { class: 'mono', text: `PASO ${pad(i + 1)}` }), el('h3', { text: p.titulo }), el('p', { text: p.texto }))));

  // El espacio (fotos y videos)
  const bento = $('.bento');
  const sizes = { grande: 't-big', alta: 't-tall', ancha: 't-wide', normal: '' };
  (espacio.galeria || []).filter(g => g.archivo).forEach(g => bento.append(
    el('figure', { class: `tile spot ${sizes[g.tamano] || ''}` },
      media(g.archivo, g.descripcion || g.titulo),
      isVideo(g.archivo) ? el('span', { class: 'tile-badge mono', text: '● VIDEO' }) : null,
      (g.titulo || g.texto) ? el('figcaption', {}, el('b', { text: g.titulo }), el('span', { text: g.texto })) : null
    )
  ));
  if ((espacio.incluido || []).length) bento.append(el('div', { class: 'tile t-list' },
    el('p', { class: 'mono', text: espacio.incluido_titulo || '' }),
    el('ul', {}, espacio.incluido.map(t => el('li', {}, el('i', { text: '✓' }), ` ${t}`)))
  ));

  // Comunidad: reparte las publicaciones en 4 columnas
  const wall = $('.wall');
  const cols = [-60, 50, -90, 40].map(s => el('div', { class: 'wall-col', 'data-speed': s }));
  (comunidad.publicaciones || []).filter(p => p.archivo).forEach((p, i) => cols[i % 4].append(
    el(p.enlace ? 'a' : 'div', { class: `reel${isVideo(p.archivo) ? ' is-video' : ''}`, href: p.enlace || null, target: p.enlace ? '_blank' : null, rel: p.enlace ? 'noreferrer' : null },
      media(p.archivo, p.descripcion || p.texto), p.texto ? el('span', { text: p.texto }) : null)
  ));
  wall.append(...cols);

  /* ---------- Estado abierto / cerrado (hora de Santiago) ---------- */
  const HOURS = {};
  [0, 1, 2, 3, 4, 5, 6].forEach(d => {
    const [a, c] = hours[d === 0 ? 'domingo' : d === 6 ? 'sabado' : 'semana'];
    HOURS[d] = a && c ? [toHour(a), toHour(c), a, c] : null;
  });
  function santiagoNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Santiago', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')), h: +get('hour') % 24, m: +get('minute') };
  }
  function nextOpen(day) {
    for (let i = 1; i <= 7; i++) { const d = HOURS[(day + i) % 7]; if (d) return i === 1 ? `mañana ${d[2]}` : d[2]; }
    return '';
  }
  function updateStatus() {
    const { day, h, m } = santiagoNow();
    const t = h + m / 60;
    const today = HOURS[day];
    const open = !!today && t >= today[0] && t < today[1];
    const label = open ? `Abierto · cierra ${today[3]}`
      : today && t < today[0] ? `Cerrado · abre ${today[2]}` : `Cerrado · abre ${nextOpen(day)}`;
    $$('[data-status]').forEach(n => {
      n.classList.toggle('open', open);
      n.classList.toggle('closed', !open);
      n.querySelector('b').textContent = label;
    });
    $$('[data-now]').forEach(n => (n.textContent = `${pad(h)}:${pad(m)}`));
    $$('.tl-row').forEach(row => {
      const isToday = row.dataset.days.split(',').map(Number).includes(day);
      row.classList.toggle('today', isToday);
      if (isToday) $('.tl-now', row).style.left = `${(t / 24) * 100}%`;
    });
  }
  $$('.tl-row').forEach(row => {
    const [a, c] = hours[row.dataset.key];
    const bar = $('.tl-open', row);
    if (!a || !c) return (bar.style.display = 'none');
    bar.style.left = `${(toHour(a) / 24) * 100}%`;
    bar.style.width = `${((toHour(c) - toHour(a)) / 24) * 100}%`;
  });
  updateStatus();
  setInterval(updateStatus, 30000);

  /* ---------- Menú móvil ---------- */
  const burger = $('.burger'), menu = $('.mobile-menu');
  const toggleMenu = force => {
    const open = force ?? !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', !open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  };
  burger.addEventListener('click', () => toggleMenu());
  $$('a', menu).forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* ---------- Player de historias ---------- */
  const story = $('.story');
  const slides = [...storyMedia.children];
  const bars = [...storyBars.children];
  const storyLabel = $('[data-story-label]');
  const DUR = 4200;
  let idx = 0, start = performance.now();
  function showSlide(i) {
    slides.forEach((s, k) => s.classList.toggle('on', k === i));
    bars.forEach((b, k) => b.style.setProperty('--p', k < i ? 1 : 0));
    storyLabel.textContent = slides[i]?.dataset.label || '';
  }
  if (slides.length) {
    showSlide(0);
    if (!reduced && slides.length > 1) {
      (function tick(now) {
        const p = (now - start) / DUR;
        if (p >= 1) { idx = (idx + 1) % slides.length; start = now; showSlide(idx); }
        else bars[idx].style.setProperty('--p', p.toFixed(3));
        requestAnimationFrame(tick);
      })(start);
    }
    story.addEventListener('click', e => {
      const back = e.clientX < story.getBoundingClientRect().left + story.offsetWidth / 3;
      idx = (idx + (back ? slides.length - 1 : 1)) % slides.length;
      start = performance.now();
      showSlide(idx);
    });
  }

  /* ---------- Tilt 3D de la historia y luz en las fotos ---------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced) {
    const stage = $('.hero-stage');
    stage.addEventListener('mousemove', e => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      story.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 12}deg)`;
    });
    stage.addEventListener('mouseleave', () => (story.style.transform = ''));
    $$('.spot').forEach(n => n.addEventListener('mousemove', e => {
      const r = n.getBoundingClientRect();
      n.style.setProperty('--mx', `${e.clientX - r.left}px`);
      n.style.setProperty('--my', `${e.clientY - r.top}px`);
    }));
  }

  /* ---------- Coaches: acordeón ---------- */
  const coachEls = $$('.coach');
  coachEls.forEach(c => {
    const btn = $('.coach-row', c);
    btn.addEventListener('click', () => {
      const willOpen = !c.classList.contains('open');
      coachEls.forEach(o => { o.classList.remove('open'); $('.coach-row', o).setAttribute('aria-expanded', 'false'); });
      if (willOpen) { c.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
      if (hasGsap) setTimeout(() => ScrollTrigger.refresh(), 650);
    });
  });

  /* ---------- Frase palabra por palabra ---------- */
  $$('.reveal-words').forEach(p => {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part.trim()) return frag.append(part);
          frag.append(el('span', { class: 'w', text: part }));
        });
        n.replaceWith(frag);
      } else walk(n);
    });
    walk(p);
    $$('em .w', p).forEach(w => w.classList.add('grad'));
  });

  /* ---------- Sin GSAP: todo visible ---------- */
  const countUp = n => {
    const end = +n.dataset.count || 0;
    if (!hasGsap || reduced) return (n.textContent = fmt(end));
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => (n.textContent = fmt(o.v)) });
  };
  const finishLoader = () => { $('.loader')?.remove(); document.body.classList.remove('is-loading'); };

  if (!hasGsap || reduced) {
    finishLoader();
    $$('.reveal-words .w').forEach(w => (w.style.opacity = 1));
    $$('[data-count]').forEach(countUp);
    return;
  }

  /* ================= GSAP ================= */
  gsap.registerPlugin(ScrollTrigger);

  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    window.lenis = lenis;
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { offset: -20, duration: 1.4 }) : target.scrollIntoView({ behavior: 'smooth' });
  }));

  const nav = $('.nav');
  ScrollTrigger.create({
    start: 200, end: 'max',
    onUpdate: self => nav.classList.toggle('is-hidden', self.direction === 1 && !menu.classList.contains('open'))
  });
  gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  /* Loader → intro */
  const loadP = { v: 0 };
  const intro = gsap.timeline({ paused: true })
    .from('.hero-title .split', { yPercent: 115, rotate: 4, duration: 1.1, stagger: .09, ease: 'expo.out' })
    .from('.hero .kicker, .hero-sub, .hero-cta', { y: 30, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out' }, '-=.8')
    .from('.story', { y: 80, rotateX: 25, opacity: 0, duration: 1.2, ease: 'expo.out', clearProps: 'transform' }, '-=1')
    .from('.sticker', { scale: 0, opacity: 0, duration: .7, stagger: .12, ease: 'back.out(2)' }, '-=.6')
    .from('.hero-hud > *', { y: 20, opacity: 0, duration: .6, stagger: .06 }, '-=.6')
    .from('.nav', { y: -80, opacity: 0, duration: .8, ease: 'power3.out', clearProps: 'transform,opacity' }, 0)
    .add(() => $$('.hero [data-count]').forEach(countUp), '-=.4');

  gsap.timeline({ onComplete: () => { finishLoader(); lenis?.start(); intro.play(); } })
    .to('.plate', { y: 0, opacity: 1, duration: .45, stagger: { each: .08, from: 'center' }, ease: 'back.out(2.5)' })
    .to(loadP, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: () => { const n = $('#loadNum'); if (n) n.textContent = String(Math.round(loadP.v)).padStart(3, '0'); } }, 0)
    .to('.loader-bar', { y: -24, duration: .25, ease: 'power2.out' })
    .to('.loader-bar', { y: 0, duration: .25, ease: 'power2.in' })
    .to('.loader', { yPercent: -100, duration: .9, ease: 'expo.inOut' }, '+=.05');

  /* Franjas que aceleran con el scroll */
  const mqA = gsap.to('.mq-a .mq-track', { xPercent: -50, duration: 22, ease: 'none', repeat: -1 });
  const mqB = gsap.fromTo('.mq-b .mq-track', { xPercent: -50 }, { xPercent: 0, duration: 26, ease: 'none', repeat: -1 });
  let boost = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => (boost = Math.max(boost, Math.min(6, Math.abs(self.getVelocity()) / 300))) });
  gsap.ticker.add(() => { boost *= .92; mqA.timeScale(1 + boost); mqB.timeScale(1 + boost); });

  /* Disciplinas: scroll horizontal en escritorio */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 761px)', () => {
    const dist = () => track.scrollWidth - innerWidth;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.disc', pin: true, start: 'top top', end: () => `+=${dist()}`, scrub: 1, invalidateOnRefresh: true }
    });
    $$('.panel').forEach(p => gsap.from($('.panel-body', p).children, {
      y: 40, opacity: 0, stagger: .06, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 75%' }
    }));
  });
  mm.add('(max-width: 760px)', () => {
    $$('.panel').forEach(p => gsap.from(p, { y: 60, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 88%' } }));
  });

  $$('.sec-head').forEach(h => gsap.from(h.children, {
    y: 50, opacity: 0, duration: 1, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 82%' }
  }));
  ScrollTrigger.batch('.steps li, .tile, .info-card, .coach, .stat, .flyer-card', {
    start: 'top 90%', once: true,
    onEnter: els => gsap.from(els, { y: 50, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out' })
  });
  $$('.stats [data-count]').forEach(n => ScrollTrigger.create({ trigger: n, start: 'top 90%', once: true, onEnter: () => countUp(n) }));

  $$('.reveal-words').forEach(p => gsap.to($$('.w', p), {
    opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 50%', scrub: true }
  }));
  gsap.from('.q-mark', { scale: .3, rotate: -20, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.first', start: 'top 70%' } });

  $$('.wall-col').forEach(col => gsap.fromTo(col, { y: 0 }, {
    y: +col.dataset.speed * 3, ease: 'none', scrollTrigger: { trigger: '.wall', start: 'top bottom', end: 'bottom top', scrub: true }
  }));

  gsap.from('.tl-open', { scaleX: 0, duration: 1.2, stagger: .15, ease: 'expo.out', scrollTrigger: { trigger: '.clock-board', start: 'top 75%' } });

  /* Cuenta regresiva 5·4·3·2·1 → EMPIEZA HOY */
  const nums = $$('.countdown span');
  const cd = gsap.timeline({ scrollTrigger: { trigger: '.final', pin: true, start: 'top top', end: '+=160%', scrub: .6 } });
  gsap.set('.final-inner', { opacity: 0, scale: .85 });
  nums.forEach((n, i) => {
    cd.fromTo(n, { opacity: 0, scale: .5 }, { opacity: 1, scale: 1, duration: .5, ease: 'power2.out' }, i * .6)
      .to(n, { opacity: 0, scale: 1.6, duration: .4, ease: 'power2.in' }, i * .6 + .5);
  });
  cd.to('.final-inner', { opacity: 1, scale: 1, duration: .8, ease: 'expo.out' }, '-=.2');

  gsap.from('.footer-big', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
  setTimeout(() => ScrollTrigger.refresh(), 1500);
  setTimeout(() => { if ($('.loader')) { finishLoader(); lenis?.start(); intro.progress(1); } }, 6000);
})();
