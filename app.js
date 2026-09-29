/* VIP Training Gym — interacciones y animaciones */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const fmt = n => Math.round(n).toLocaleString('es-CL');

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Estado abierto / cerrado (hora de Santiago) ---------- */
  const HOURS = { 0: [9, 15], 1: [6, 22], 2: [6, 22], 3: [6, 22], 4: [6, 22], 5: [6, 22], 6: [8, 16] };
  const pad = n => String(n).padStart(2, '0');
  function santiagoNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Santiago', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, h: +get('hour') % 24, m: +get('minute') };
  }
  function updateStatus() {
    const { day, h, m } = santiagoNow();
    const t = h + m / 60;
    const [o, c] = HOURS[day];
    const open = t >= o && t < c;
    let label;
    if (open) label = `Abierto · cierra ${pad(c)}:00`;
    else if (t < o) label = `Cerrado · abre ${pad(o)}:00`;
    else label = `Cerrado · abre mañana ${pad(HOURS[(day + 1) % 7][0])}:00`;
    $$('[data-status]').forEach(el => {
      el.classList.toggle('open', open);
      el.classList.toggle('closed', !open);
      el.querySelector('b').textContent = label;
    });
    $$('[data-now]').forEach(el => (el.textContent = `${pad(h)}:${pad(m)}`));
    $$('.tl-row').forEach(row => {
      const days = row.dataset.days.split(',').map(Number);
      const isToday = days.includes(day);
      row.classList.toggle('today', isToday);
      if (isToday) $('.tl-now', row).style.left = `${(t / 24) * 100}%`;
    });
  }
  $$('.tl-row').forEach(row => {
    const bar = $('.tl-open', row);
    bar.style.left = `${(row.dataset.open / 24) * 100}%`;
    bar.style.width = `${((row.dataset.close - row.dataset.open) / 24) * 100}%`;
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
  const slides = $$('.story-media img');
  const bars = $$('.story-bars i');
  const storyLabel = $('[data-story-label]');
  const DUR = 4200;
  let idx = 0, start = performance.now();
  function showSlide(i) {
    slides.forEach((s, k) => s.classList.toggle('on', k === i));
    bars.forEach((b, k) => b.style.setProperty('--p', k < i ? 1 : 0));
    storyLabel.textContent = slides[i].dataset.label;
  }
  showSlide(0);
  if (!reduced) {
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

  /* ---------- Tilt 3D de la historia ---------- */
  if (finePointer && !reduced) {
    const stage = $('.hero-stage');
    stage.addEventListener('mousemove', e => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      story.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 12}deg)`;
    });
    stage.addEventListener('mouseleave', () => (story.style.transform = ''));
  }

  /* ---------- Cursor + botones magnéticos ---------- */
  if (finePointer && !reduced) {
    const cursor = $('.cursor');
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      cx += (tx - cx) * .2; cy += (ty - cy) * .2;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    })();
    $$('a, button, .story').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      el.addEventListener('mouseleave', () => (el.style.transform = ''));
    });
    $$('.spot').forEach(el => el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    }));
  }

  /* ---------- Coaches: acordeón + foto flotante ---------- */
  const coaches = $$('.coach');
  coaches.forEach(c => {
    const btn = $('.coach-row', c);
    btn.addEventListener('click', () => {
      const willOpen = !c.classList.contains('open');
      coaches.forEach(o => { o.classList.remove('open'); $('.coach-row', o).setAttribute('aria-expanded', 'false'); });
      if (willOpen) { c.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
      if (hasGsap) setTimeout(() => ScrollTrigger.refresh(), 650);
    });
  });
  if (finePointer && innerWidth > 760) {
    const float = $('.coach-float'), fImg = $('img', float), list = $('.coach-list');
    let fx = 0, fy = 0, px = 0, py = 0, on = false;
    coaches.forEach(c => c.addEventListener('mouseenter', () => { fImg.src = c.dataset.img; float.classList.add('show'); on = true; }));
    list.addEventListener('mouseleave', () => { float.classList.remove('show'); on = false; });
    list.addEventListener('mousemove', e => { px = e.clientX; py = e.clientY; });
    (function follow() {
      if (on) { fx += (px + 170 - fx) * .15; fy += (py - fy) * .15; float.style.left = `${fx}px`; float.style.top = `${fy}px`; }
      requestAnimationFrame(follow);
    })();
  }

  /* ---------- Palabras que se encienden ---------- */
  $$('.reveal-words').forEach(p => {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part.trim()) return frag.append(part);
          const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.append(s);
        });
        n.replaceWith(frag);
      } else walk(n);
    });
    walk(p);
    $$('em .w', p).forEach(w => w.classList.add('grad'));
  });

  /* ---------- Sin GSAP: todo visible y funcional ---------- */
  const countUp = el => {
    const end = +el.dataset.count;
    if (!hasGsap || reduced) return (el.textContent = fmt(end));
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(o.v)) });
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

  /* Nav que se oculta al bajar */
  const nav = $('.nav');
  ScrollTrigger.create({
    start: 200, end: 'max',
    onUpdate: self => nav.classList.toggle('is-hidden', self.direction === 1 && !menu.classList.contains('open'))
  });
  gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  /* Loader → intro */
  const load = { v: 0 };
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
    .to(load, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: () => { const n = $('#loadNum'); if (n) n.textContent = String(Math.round(load.v)).padStart(3, '0'); } }, 0)
    .to('.loader-bar', { y: -24, duration: .25, ease: 'power2.out' })
    .to('.loader-bar', { y: 0, duration: .25, ease: 'power2.in' })
    .to('.loader', { yPercent: -100, duration: .9, ease: 'expo.inOut' }, '+=.05');

  /* Marquee con reacción a la velocidad del scroll */
  const mqA = gsap.to('.mq-a .mq-track', { xPercent: -50, duration: 22, ease: 'none', repeat: -1 });
  const mqB = gsap.fromTo('.mq-b .mq-track', { xPercent: -50 }, { xPercent: 0, duration: 26, ease: 'none', repeat: -1 });
  let boost = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => (boost = Math.max(boost, Math.min(6, Math.abs(self.getVelocity()) / 300))) });
  gsap.ticker.add(() => { boost *= .92; mqA.timeScale(1 + boost); mqB.timeScale(1 + boost); });

  const mm = gsap.matchMedia();

  /* Disciplinas: scroll horizontal (escritorio) */
  mm.add('(min-width: 761px)', () => {
    const track = $('.disc-track');
    const dist = () => track.scrollWidth - innerWidth;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.disc', pin: true, start: 'top top', end: () => `+=${dist()}`, scrub: 1, invalidateOnRefresh: true }
    });
    $$('.panel').forEach(p => {
      gsap.from($('.panel-body', p).children, {
        y: 40, opacity: 0, stagger: .06, duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 75%' }
      });
    });
  });
  mm.add('(max-width: 760px)', () => {
    $$('.panel').forEach(p => gsap.from(p, { y: 60, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 88%' } }));
  });

  /* Encabezados y bloques que suben */
  $$('.sec-head').forEach(h => gsap.from(h.children, {
    y: 50, opacity: 0, duration: 1, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 82%' }
  }));
  ScrollTrigger.batch('.steps li, .tile, .info-card, .coach, .stat', {
    start: 'top 90%', once: true,
    onEnter: els => gsap.from(els, { y: 50, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out' })
  });

  /* Contadores */
  $$('.stats [data-count]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => countUp(el) }));

  /* Frase palabra por palabra */
  $$('.reveal-words').forEach(p => gsap.to($$('.w', p), {
    opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 50%', scrub: true }
  }));
  gsap.from('.q-mark', { scale: .3, rotate: -20, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.first', start: 'top 70%' } });

  /* Muro de comunidad con columnas a distinta velocidad */
  $$('.wall-col').forEach(col => gsap.fromTo(col, { y: 0 }, {
    y: +col.dataset.speed * 3, ease: 'none', scrollTrigger: { trigger: '.wall', start: 'top bottom', end: 'bottom top', scrub: true }
  }));

  /* Barras del horario */
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

  /* Footer */
  gsap.from('.footer-big', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
  setTimeout(() => { if ($('.loader')) { finishLoader(); lenis?.start(); intro.progress(1); } }, 6000);
})();
