/* NEXORA v5 — interaction layer. body[data-page] = home | service | contact.
   0 chrome · 1 sound · 2 glitch · 3 scroll/menu · 4 cursor · 5 reveals (words, diamond-nodes) · 6 header · 7 pages.
   Everything degrades: no GSAP → static, fully readable page; no motion → constellation becomes a plain list. */
(() => {
  const D = window.NX_DATA || { services: [], homeFaq: [] };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const page = document.body.dataset.page;
  const gsapOK = !!(window.gsap && window.ScrollTrigger);
  const svcLink = s => `service.html?s=${s.slug}`;

  /* ---------- 0 · chrome ---------- */
  document.body.insertAdjacentHTML('afterbegin', `
    <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><filter id="gf" x="-10%" y="-20%" width="120%" height="140%" color-interpolation-filters="sRGB"><feTurbulence id="gf-turb" type="fractalNoise" baseFrequency="0.0005 0.3" numOctaves="1" seed="4" result="n"/><feDisplacementMap id="gf-disp" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg>
    <div class="cursor" aria-hidden="true"><span class="cursor-label"></span></div><div class="cursor-dot" aria-hidden="true"></div>
    <header class="hdr" data-od-id="header">
      <a class="logo" href="index.html#top" data-cursor="link" aria-label="Nexora — на главную"><span data-glitch>NEXORA</span></a>
      <nav class="nav" aria-label="Навигация">
        <div class="has-mega"><a href="index.html#services">Услуги</a><div class="mega">${D.services.map(s => `<a href="${svcLink(s)}"><b>${s.name}</b><span>${s.tag}</span></a>`).join('')}</div></div>
        <a href="index.html#results">Результаты</a><a href="index.html#process">Процесс</a><a href="index.html#faq">Вопросы</a>
      </nav>
      <div class="hdr-r"><button class="snd" id="snd" type="button" aria-pressed="false" aria-label="Включить звук" title="Включить звук"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3Z"/><path class="sound-wave" d="M16 9a4 4 0 0 1 0 6M18.5 6a8 8 0 0 1 0 12"/><path class="sound-off" d="m17 9 5 6m0-6-5 6"/></svg></button>
        <a class="btn" href="contact.html">Обсудить проект</a>
        <button class="menu-btn" id="menu-btn" aria-expanded="false" aria-controls="menu"><span id="menu-label">Меню</span><i></i></button></div>
    </header>
    <div class="menu" id="menu" aria-hidden="true"><ul>
      <li><a href="index.html#services"><i class="dm"></i>Услуги</a></li><li><a href="index.html#results"><i class="dm"></i>Результаты</a></li><li><a href="index.html#process"><i class="dm"></i>Процесс</a></li>
      <li><a href="index.html#faq"><i class="dm"></i>Вопросы</a></li><li><a href="contact.html"><i class="dm"></i>Контакты</a></li></ul></div>`);
  const fm = $('#footer-mount');
  if (fm) fm.outerHTML = `
    <footer class="footer" data-od-id="footer"><div class="wrap"><div class="footer-grid">
      <div><a class="logo" href="index.html#top">NEXORA</a><p style="margin-top:18px">Интеллект, который умножает бизнес. Помогаем продавать умнее, строить быстрее и расти без перегрузки.</p></div>
      <div><h4>Услуги</h4><ul>${D.services.map(s => `<li><a href="${svcLink(s)}">${s.name}</a></li>`).join('')}</ul></div>
      <div><h4>Компания</h4><ul><li><a href="contact.html">Контакты</a></li><li><a href="mailto:hello@nexora.ai">hello@nexora.ai</a></li></ul></div></div></div>
      <div class="wrap"><div class="footer-base"><span>© ${new Date().getFullYear()} Nexora AI. Все права защищены.</span><span>Работаем удалённо по всему миру</span></div></div></footer>`;

  /* ---------- 1 · tactile sound (off by default, synthesised, no assets) ---------- */
  const Snd = {
    on: localStorage.getItem('nx-snd') === '1', ctx: null, master: null, noise: null, hold: null,
    init() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
        const c = this.ctx = new AC(), limiter = c.createDynamicsCompressor(), master = this.master = c.createGain();
        limiter.threshold.value = -24; limiter.knee.value = 14; limiter.ratio.value = 8; limiter.attack.value = .004; limiter.release.value = .18;
        master.gain.value = .72; master.connect(limiter).connect(c.destination);
        const noise = this.noise = c.createBuffer(1, c.sampleRate, c.sampleRate), data = noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    },
    blip(f = 660, dur = .14, g = .03, type = 'sine') {
      if (!this.on || !this.init()) return;
      const c = this.ctx, t = c.currentTime, root = clamp(f / 6, 48, 130), length = clamp(dur, .13, .72), level = clamp(g, .008, .04);
      const body = c.createOscillator(), bodyGain = c.createGain();
      body.type = 'triangle'; body.frequency.setValueAtTime(root * 1.55, t); body.frequency.exponentialRampToValueAtTime(root * .82, t + Math.min(.16, length));
      bodyGain.gain.setValueAtTime(.0001, t); bodyGain.gain.exponentialRampToValueAtTime(level * 1.35, t + .008); bodyGain.gain.exponentialRampToValueAtTime(.0001, t + length);
      body.connect(bodyGain).connect(this.master); body.start(t); body.stop(t + length + .02);

      const metal = c.createOscillator(), metalFilter = c.createBiquadFilter(), metalGain = c.createGain();
      metal.type = type === 'triangle' ? 'triangle' : 'sawtooth';
      metal.frequency.setValueAtTime(root * 3.31, t); metal.frequency.exponentialRampToValueAtTime(root * 2.73, t + length);
      metalFilter.type = 'bandpass'; metalFilter.frequency.value = root * 4.1; metalFilter.Q.value = 1.7;
      metalGain.gain.setValueAtTime(.0001, t); metalGain.gain.exponentialRampToValueAtTime(level * .7, t + .004); metalGain.gain.exponentialRampToValueAtTime(.0001, t + length * .78);
      metal.connect(metalFilter).connect(metalGain).connect(this.master); metal.start(t); metal.stop(t + length + .02);

      const grit = c.createBufferSource(), gritFilter = c.createBiquadFilter(), gritGain = c.createGain();
      grit.buffer = this.noise; gritFilter.type = 'bandpass'; gritFilter.frequency.value = 720 + root * 3; gritFilter.Q.value = .8;
      gritGain.gain.setValueAtTime(.0001, t); gritGain.gain.exponentialRampToValueAtTime(level * .55, t + .003); gritGain.gain.exponentialRampToValueAtTime(.0001, t + .065);
      grit.connect(gritFilter).connect(gritGain).connect(this.master); grit.start(t, Math.random() * .7); grit.stop(t + .08);
    },
    open(i = 0) {
      this.blip(410 + i * 17, .38, .03);
      setTimeout(() => this.blip(310 + i * 13, .24, .014, 'triangle'), 86);
    },
    holdStart() {
      if (!this.on || !this.init() || this.hold) return;
      const c = this.ctx, t = c.currentTime, body = c.createOscillator(), overtone = c.createOscillator(), lfo = c.createOscillator();
      const filter = c.createBiquadFilter(), bodyGain = c.createGain(), overtoneGain = c.createGain(), wobble = c.createGain();
      body.type = 'sawtooth'; body.frequency.value = 46; filter.type = 'lowpass'; filter.frequency.value = 160; filter.Q.value = 2.8;
      overtone.type = 'triangle'; overtone.frequency.value = 139; lfo.type = 'sine'; lfo.frequency.value = 18; wobble.gain.value = 28;
      bodyGain.gain.value = 0; overtoneGain.gain.value = 0;
      body.connect(filter).connect(bodyGain).connect(this.master);
      overtone.connect(overtoneGain).connect(this.master);
      lfo.connect(wobble).connect(filter.frequency);
      [body, overtone, lfo].forEach(o => o.start(t));
      this.hold = { body, overtone, lfo, filter, bodyGain, overtoneGain };
    },
    holdUpdate(h) {
      if (!this.hold) return;
      const t = this.ctx.currentTime, s = this.hold, depth = clamp(h, 0, 1);
      s.body.frequency.setTargetAtTime(46 + depth * 52, t, .045);
      s.overtone.frequency.setTargetAtTime(139 + depth * 123, t, .05);
      s.filter.frequency.setTargetAtTime(160 + depth * 790, t, .045);
      s.bodyGain.gain.setTargetAtTime(.028 * depth, t, .045);
      s.overtoneGain.gain.setTargetAtTime(.011 * depth, t, .06);
    },
    holdStop() {
      if (!this.hold) return;
      const { body, overtone, lfo, bodyGain, overtoneGain } = this.hold, t = this.ctx.currentTime;
      bodyGain.gain.setTargetAtTime(0, t, .065); overtoneGain.gain.setTargetAtTime(0, t, .065);
      [body, overtone, lfo].forEach(o => o.stop(t + .42));
      this.hold = null; this.blip(460, .62, .026, 'triangle');
    }
  };
  const sndBtn = $('#snd');
  const paintSound = () => { const label = Snd.on ? 'Выключить звук' : 'Включить звук'; sndBtn.setAttribute('aria-pressed', String(Snd.on)); sndBtn.setAttribute('aria-label', label); sndBtn.title = label; };
  paintSound();
  sndBtn.addEventListener('click', () => { Snd.on = !Snd.on; localStorage.setItem('nx-snd', Snd.on ? '1' : '0'); paintSound(); if (Snd.on) { Snd.init(); Snd.blip(540, .24, .03); } else Snd.holdStop(); });

  /* ---------- 2 · digital glitch ---------- */
  const GLYPHS = '▓▒░█#@%&01<>/\\|=+';
  const dispEl = $('#gf-disp'), turbEl = $('#gf-turb');
  const glitchEls = $$('[data-glitch]');
  glitchEls.forEach(el => {
    const txt = el.textContent.trim(); el.dataset.text = txt; el.classList.add('gl'); el.textContent = txt;
    ['a', 'b'].forEach(k => { const s = document.createElement('span'); s.className = 'gl-l gl-' + k; s.setAttribute('aria-hidden', 'true'); s.textContent = txt; el.appendChild(s); });
  });
  const setText = (el, str) => { el.firstChild.nodeValue = str; el.querySelectorAll('.gl-l').forEach(l => (l.textContent = str)); };
  const setGlitchText = (el, str, stable) => { if (!stable) el.firstChild.nodeValue = str; el.querySelectorAll('.gl-l').forEach(l => (l.textContent = str)); };
  function burst(el, ms = 380, power = 1) {
    if (reduce || !el || el._busy) return; el._busy = true;
    const layers = el.querySelectorAll('.gl-l'), orig = el.dataset.text, stable = el.classList.contains('hero-brand') || !!el.closest('.logo'), fs = parseFloat(getComputedStyle(el).fontSize) || 16, t0 = performance.now(); let last = 0;
    (function step(now) {
      const p = (now - t0) / ms;
      if (p >= 1) { layers.forEach(l => { l.style.opacity = 0; l.style.clipPath = ''; l.style.transform = ''; }); el.style.translate = ''; el.style.filter = ''; setGlitchText(el, orig, stable); el._busy = false; return; }
      if (now - last > 42) {
        last = now;
        if (Math.random() < .8) {
          layers.forEach((l, i) => { const a = rand(0, 92), b = Math.min(100, a + rand(5, 32)); l.style.opacity = 1; l.style.clipPath = `inset(${a}% 0 ${100 - b}% 0)`; l.style.transform = `translateX(${(i ? 1 : -1) * rand(.03, .15) * fs * power}px)`; });
          if (!stable) { el.style.translate = `${rand(-.03, .03) * fs * power}px 0`; dispEl.setAttribute('scale', String(rand(16, 80) * power)); turbEl.setAttribute('baseFrequency', `0.0005 ${rand(.05, .7).toFixed(3)}`); el.style.filter = 'url(#gf)'; }
          if (Math.random() < .5 && orig.length > 1) { const arr = [...orig]; for (let n = 0; n < 1 + (Math.random() < .4); n++) arr[Math.floor(rand(0, arr.length))] = GLYPHS[Math.floor(rand(0, GLYPHS.length))]; setGlitchText(el, arr.join(''), stable); } else setGlitchText(el, orig, stable);
        } else { layers.forEach(l => (l.style.opacity = 0)); el.style.translate = ''; el.style.filter = ''; setGlitchText(el, orig, stable); }
      }
      requestAnimationFrame(step);
    })(t0);
  }
  if (fine) glitchEls.forEach(el => el.addEventListener('pointerenter', () => { const hb = el.classList.contains('hero-brand'); if (hb && NX.holding) return; burst(el, hb ? 200 : el.classList.contains('contact-title') ? 260 : 440, hb ? .55 : el.classList.contains('contact-title') ? .3 : .7); }));
  if (!reduce) setInterval(() => { const vis = glitchEls.filter(e => (e.classList.contains('hero-brand') || e.classList.contains('footer-word')) && e.getBoundingClientRect().bottom > 0 && e.getBoundingClientRect().top < innerHeight); if (vis.length) burst(vis[0], rand(200, 340), .8); }, 4500);

  let lenis = null, closeMenu = () => {};
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href*="#"]'); if (!a) return;
    const raw = a.getAttribute('href'), m = raw.match(/^(?:index\.html)?(#.+)$/);
    if (!m || (!raw.startsWith('#') && page !== 'home')) return;
    const url = { hash: m[1] };
    const target = document.querySelector(url.hash); if (!target) return;
    e.preventDefault(); closeMenu(true);
    const top = Math.max(0, target.getBoundingClientRect().top + scrollY - (url.hash === '#top' ? 0 : 68));
    if (lenis && !reduce) lenis.scrollTo(top, { lerp: 0, duration: 1.25, easing: t => 1 - Math.pow(1 - t, 3), immediate: false });
    else window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', url.hash);
  });

  if (!gsapOK) {
    const loader = $('.loader'); if (loader) loader.style.display = 'none';
    const fallbackMenu = $('#menu'), fallbackButton = $('#menu-btn');
    closeMenu = () => { fallbackButton.setAttribute('aria-expanded', 'false'); fallbackMenu.setAttribute('aria-hidden', 'true'); fallbackMenu.style.visibility = 'hidden'; fallbackMenu.style.clipPath = 'inset(0 0 100% 0)'; };
    fallbackButton.addEventListener('click', () => {
      const open = fallbackButton.getAttribute('aria-expanded') !== 'true';
      fallbackButton.setAttribute('aria-expanded', String(open)); fallbackMenu.setAttribute('aria-hidden', String(!open));
      fallbackMenu.style.visibility = open ? 'visible' : 'hidden'; fallbackMenu.style.clipPath = open ? 'inset(0)' : 'inset(0 0 100% 0)';
    });
    if (page === 'home' && window.NXBall) NXBall.run(true);
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  /* phones: the URL bar sliding in/out fires resize; without this every slide of it re-measures the pin and the page jumps */
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- 3 · smooth scroll, menu ---------- */
  if (window.Lenis && !reduce) { lenis = new Lenis({ lerp: .085, wheelMultiplier: .9 }); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  const menu = $('#menu'), menuBtn = $('#menu-btn'), menuLabel = $('#menu-label'); let menuOpen = false;
  closeMenu = function(now) { if (!menuOpen) return; menuOpen = false; menuBtn.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true'); menuLabel.textContent = 'Меню'; lenis && lenis.start(); gsap.killTweensOf(menu); gsap.killTweensOf('#menu li a'); gsap.to(menu, { clipPath: 'inset(0% 0% 100% 0%)', duration: now ? .01 : matchMedia('(max-width: 1039px)').matches ? .24 : .7, ease: 'power2.in', onComplete: () => { if (!menuOpen) menu.style.visibility = 'hidden'; } }); };
  menuBtn.addEventListener('click', () => {
    if (menuOpen) return closeMenu();
    const mobileMenu = matchMedia('(max-width: 1039px)').matches;
    gsap.killTweensOf(menu); gsap.killTweensOf('#menu li a');
    menuOpen = true; menu.style.visibility = 'visible'; menuBtn.setAttribute('aria-expanded', 'true'); menu.setAttribute('aria-hidden', 'false'); menuLabel.textContent = 'Закрыть'; lenis && lenis.stop();
    gsap.to(menu, { clipPath: 'inset(0% 0% 0% 0%)', duration: mobileMenu ? .28 : .8, ease: mobileMenu ? 'power2.out' : 'power4.inOut' });
    gsap.fromTo('#menu li a', { yPercent: mobileMenu ? 24 : 110 }, { yPercent: 0, duration: mobileMenu ? .32 : .9, ease: 'power4.out', stagger: mobileMenu ? .035 : .07, delay: mobileMenu ? 0 : .25 });
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- 4 · cursor lens ---------- */
  if (fine) {
    const cur = $('.cursor'), dot = $('.cursor-dot'), lab = $('.cursor-label');
    document.documentElement.classList.add('has-cursor');
    gsap.set([cur, dot], { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    const qx = gsap.quickTo(cur, 'x', { duration: .55, ease: 'power3' }), qy = gsap.quickTo(cur, 'y', { duration: .55, ease: 'power3' });
    addEventListener('pointermove', e => { qx(e.clientX); qy(e.clientY); gsap.set(dot, { x: e.clientX, y: e.clientY }); cur.classList.remove('is-hidden'); dot.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', () => { cur.classList.add('is-hidden'); dot.classList.add('is-hidden'); });
    addEventListener('pointerdown', () => cur.classList.add('is-down')); addEventListener('pointerup', () => cur.classList.remove('is-down'));
    document.addEventListener('pointerover', e => { const t = e.target.closest('[data-cursor], a, button, summary, .card'); cur.classList.remove('is-link', 'has-label'); lab.textContent = ''; if (!t) return; if (t.dataset.cursor === 'label') { lab.textContent = t.dataset.cursorText || ''; cur.classList.add('has-label'); } else cur.classList.add('is-link'); });
  }
  const bindMagnetic = root => fine && $$('[data-magnetic]', root).forEach(el => {
    if (el._mag) return; el._mag = true; const s = parseFloat(el.dataset.magnetic) || .3;
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * s, y: (e.clientY - r.top - r.height / 2) * s, duration: .4, ease: 'power3' }); });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1,.4)' }));
  });

  /* ---------- 5 · reveals: words, diamond-nodes, counters ---------- */
  function splitWords(el) {
    (function walk(node) { [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) { const frag = document.createDocumentFragment(); n.nodeValue.split(/(\s+)/).forEach(tok => { if (!tok) return; if (/^\s+$/.test(tok)) return frag.appendChild(document.createTextNode(' ')); const w = document.createElement('span'); w.className = 'w'; const i = document.createElement('span'); i.className = 'wi'; i.textContent = tok; w.appendChild(i); frag.appendChild(w); }); n.replaceWith(frag); }
      else if (n.nodeType === 1) walk(n); }); })(el);
    return $$('.wi', el);
  }
  /* a diamond appears on its axis, turns 45°, then a wipe opens from it and the text rises in */
  function revealNode(el) {
    const dm = $(':scope > .dm', el), nb = $('.nb', el); if (!nb) return;
    const words = []; $$('h3, p', nb).forEach(t => words.push(...splitWords(t)));
    gsap.set(dm, { rotation: 0, scale: 0 }); gsap.set(nb, { clipPath: 'inset(0 100% 0 0)' }); gsap.set(words, { yPercent: 110 });
    ScrollTrigger.create({ trigger: el, start: 'top 82%', once: true, onEnter: () => {
      const tl = gsap.timeline(); tl.to(dm, { rotation: 45, scale: 1, duration: .8, ease: 'back.out(2.2)' })
        .to(nb, { clipPath: 'inset(0 0% 0 0)', duration: .9, ease: 'power3.out' }, '-=.35').to(words, { yPercent: 0, duration: .9, ease: 'power4.out', stagger: .012 }, '-=.7');
      Snd.blip(520 + Math.random() * 200, .18, .015);
    } });
  }
  function initReveals(root = document) {
    $$('[data-split]', root).forEach(el => { const words = splitWords(el); gsap.set(words, { yPercent: 118 }); if (el.closest('.hero')) { el._words = words; return; } const servicesTitle = !!el.closest('#services'); ScrollTrigger.create({ trigger: servicesTitle ? '#services' : el, start: servicesTitle ? 'top 98%' : 'top 88%', once: true, onEnter: () => gsap.to(words, { yPercent: 0, duration: servicesTitle ? .55 : 1, ease: 'power4.out', stagger: servicesTitle ? .02 : .04 }) }); });
    $$('[data-node]', root).forEach(revealNode);
    $$('[data-reveal]', root).forEach(el => { const servicesLead = !!el.closest('#services .sec-head'); gsap.set(el, { opacity: 0, y: 26 }); ScrollTrigger.create({ trigger: servicesLead ? '#services' : el, start: servicesLead ? 'top 98%' : 'top 90%', once: true, onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: servicesLead ? .55 : .9, ease: 'power3.out', delay: parseFloat(el.dataset.delay) || 0, clearProps: 'opacity,transform' }) }); });
    $$('[data-stagger]', root).forEach(box => { const kids = [...box.children]; gsap.set(kids, { opacity: 0, y: 34 }); ScrollTrigger.create({ trigger: box, start: 'top 86%', once: true, onEnter: () => gsap.to(kids, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .09, clearProps: 'opacity,transform' }) }); });
    if (!reduce) $$('[data-parallax]', root).forEach(el => gsap.fromTo(el, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    $$('.card', root).forEach(c => { c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }); c.addEventListener('click', () => c.classList.toggle('open')); });
    $$('.num-item', root).forEach(it => {
      const b = $('[data-count]', it), poly = $('.draw', it), end = parseFloat(b.dataset.count), o = { v: 0 };
      poly.setAttribute('pathLength', '1'); gsap.set(poly, { strokeDasharray: 1, strokeDashoffset: 1 });
      ScrollTrigger.create({ trigger: it, start: 'top 88%', once: true, onEnter: () => { gsap.to(poly, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' }); gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: () => (b.textContent = Math.round(o.v)) }); } });
    });
    bindMagnetic(root);
  }

  /* ---------- 6 · header ---------- */
  const hdr = $('.hdr'); let lastY = 0;
  gsap.ticker.add(() => { const y = window.scrollY; hdr.classList.toggle('solid', y > 40); if (!menuOpen) hdr.classList.toggle('hide', y > lastY && y > 480 && y - lastY > 2); if (Math.abs(y - lastY) > 2) lastY = y; });

  function faq(root, items) {
    root.innerHTML = items.map(f => `<details><summary data-cursor="link"><i class="dm"></i><span>${f.q}</span></summary><div class="ans"><p>${f.a}</p></div></details>`).join('');
    $$('details', root).forEach(d => { const sum = $('summary', d), ans = $('.ans', d);
      sum.addEventListener('click', e => { e.preventDefault();
        if (d.open) gsap.to(ans, { height: 0, duration: .5, ease: 'power3.inOut', onComplete: () => { d.open = false; gsap.set(ans, { height: 'auto' }); } });
        else { d.open = true; Snd.blip(600, .12, .015); gsap.fromTo(ans, { height: 0 }, { height: 'auto', duration: .6, ease: 'power3.out', onComplete: () => ScrollTrigger.refresh() }); } }); });
  }

  /* ---------- 7 · pages ---------- */
  const PAGES = {
    home() {
      const hero = $('.hero'), brand = $('#brand'), h1 = $('.hero .h1');
      const loader = $('.loader'), count = $('.loader-count'), ldm = $('.loader-dm');
      const skipIntro = !!location.hash || (() => { try { const v = sessionStorage.getItem('nxNoIntro'); sessionStorage.removeItem('nxNoIntro'); return !!v; } catch (_) { return false; } })(); if (skipIntro) loader.style.display = 'none';

      /* loader → intro */
      if (!skipIntro) lenis && lenis.stop();
      const st = { n: 0 }; let model = NX.ready, minT = false, shown = -1, lastB = 0;
      addEventListener('nx:model', () => (model = true)); setTimeout(() => (minT = true), reduce ? 100 : 1500); setTimeout(() => (model = true), 6500);
      const heroBits = ['.hero-body .lead', '.hero-cta', '.hold-hint', '.hero-meta', '.hdr'];
      if (!skipIntro) { gsap.set(heroBits, { opacity: 0 }); gsap.set(['.hero-body .lead', '.hero-cta', '.hold-hint'], { y: 20 }); gsap.set(brand, { clipPath: 'inset(0 0 100% 0)' }); }
      const tick = () => {
        if (model && minT) st.n += (100 - st.n) * .15 + .6; else st.n = Math.min(90, st.n + .9);
        if (st.n > 99.5) st.n = 100; const v = Math.floor(st.n);
        if (v !== shown) { shown = v; const s = String(v).padStart(3, '0'); count.dataset.text = s; setText(count, s); ldm.style.transform = `rotate(${45 + v * 1.8}deg)`; }
        if (performance.now() - lastB > 520) { lastB = performance.now(); burst(count, 220, .8); }
        if (st.n >= 100) { gsap.ticker.remove(tick); intro(); }
      };
      if (!skipIntro) gsap.ticker.add(tick);
      function intro() {
        const tl = gsap.timeline();
        tl.to('.loader-core', { opacity: 0, duration: .3 })
          .to('.loader .panel', { scaleY: 0, duration: 1, ease: 'power4.inOut' }, '>-.05')
          .add(() => { loader.style.display = 'none'; lenis && lenis.start(); })
          .to('.hdr', { opacity: 1, duration: .8 }, '<-.5')
          .to(brand, { clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'power4.out' }, '<')
          .add(() => { burst(brand, 700, 1.8); NX.boostTarget = 1; setTimeout(() => (NX.boostTarget = 0), 900); }, '<.2')
          .to(h1._words || [], { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: .05 }, '<.1')
          .to(['.hero-body .lead', '.hero-cta', '.hold-hint'], { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .1 }, '<.2')
          .to('.hero-meta', { opacity: 1, duration: .8 }, '<.3');
        if (reduce) tl.progress(1);
      }

      /* hold the wordmark: charge the molecule (colour flip + particle cloud) */
      const setHold = on => { if (on === NX.holding) return; NX.holding = on; on ? Snd.holdStart() : Snd.holdStop(); };
      brand.addEventListener('pointerdown', e => { e.preventDefault(); setHold(true); brand.setPointerCapture && brand.setPointerCapture(e.pointerId); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => brand.addEventListener(t, () => setHold(false)));
      brand.addEventListener('contextmenu', e => e.preventDefault());
      brand.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); setHold(true); } });
      brand.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') setHold(false); });
      brand.addEventListener('pointerenter', () => (NX.boostTarget = 1)); brand.addEventListener('pointerleave', () => (NX.boostTarget = 0));
      let hb = 0;
      gsap.ticker.add(() => {
        const h = NX.hold; hero.style.setProperty('--hold', h.toFixed(3)); document.documentElement.classList.toggle('charged', h > .5); Snd.holdUpdate(h);
        if (NX.holding && performance.now() - hb > 380) { hb = performance.now(); burst(brand, 300, 1 + h); }
      });
      ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', scrub: true, onUpdate: s => (NX.scroll = s.progress) });
      let cool = 0; ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => { if (Math.abs(s.getVelocity()) > 2800 && performance.now() - cool > 1500) { cool = performance.now(); burst(brand, 260, 1.2); } } });

      initReveals();
      /* Reveal the whole constellation as soon as the section reaches the viewport. */
      if (!reduce) {
        const servicesContent = $('#services > .wrap');
        gsap.set(servicesContent, { opacity: 0 });
        ScrollTrigger.create({
          trigger: '#services', start: 'top 98%', once: true,
          onEnter: () => gsap.to(servicesContent, { opacity: 1, duration: .55, ease: 'power2.out', overwrite: 'auto', clearProps: 'opacity' })
        });
      }
      if (skipIntro) {
        loader.style.display = 'none';
        gsap.set(h1._words || [], { yPercent: 0 });
        gsap.set(heroBits, { opacity: 1, y: 0 });
        gsap.set(brand, { clipPath: 'none' });
        lenis && lenis.start();
      }

      /* results: readable static numbers first, then the light reveal and the ball's response */
      /* one ground: the "why" block turns from plum to paper as slides 3-4 arrive; text colours flip with it (.why.lit) */
      const whyEl = $('.why'), processEl = $('#process'), resultsEl = $('#results'), processGeo = $('.geo', processEl); let wl = 0, hdrIn = false;
      let processInWhy = false;
      const placeMobileProcess = () => {
        const mobile = matchMedia('(max-width: 999px)').matches;
        if (mobile === processInWhy) return;
        if (mobile) {
          whyEl.insertBefore(processGeo, $('.why-mobile', whyEl));
          whyEl.insertBefore(processEl, $('.why-roi', whyEl));
        } else {
          processEl.prepend(processGeo);
          resultsEl.after(processEl);
        }
        processInWhy = mobile;
        requestAnimationFrame(() => ScrollTrigger.refresh());
      };
      placeMobileProcess();
      addEventListener('resize', placeMobileProcess);
      const setHdr = () => hdr.classList.toggle('lite', hdrIn && wl >= .47);
      const setWl = v => { wl = v; whyEl.style.setProperty('--wl', v.toFixed(3)); whyEl.classList.toggle('lit', v >= .47); whyEl.classList.toggle('changing', v > .3 && v < .7); setHdr(); };
      (function resultsScene() {
        const lite = $('#lite'), results = $('#results'), process = $('#process'), stage = $('.orbit-stage', results);
        const orbs = $$('.orb', stage);

        /* the light band is always light now: the "why" block below fades into it (see setWl), so there is no seam */
        ScrollTrigger.create({ trigger: '.why', endTrigger: lite, start: 'top top', end: 'bottom top', onToggle: s => { hdrIn = s.isActive; setHdr(); } });
        ScrollTrigger.create({ trigger: results, start: 'top bottom', end: 'bottom top',
          onEnter: () => NXBall.assemble(),
          onToggle: s => NXBall.run(s.isActive),
          onUpdate: s => { NXBall.spin = s.progress * .6; } });

        orbs.forEach((orb, i) => {
          const active = on => { NXBall.setWire(i, on); if (innerWidth < 1000) NXBall.setAct(i, on ? .75 : 0); };
          orb.addEventListener('pointerenter', () => active(true)); orb.addEventListener('pointerleave', () => active(false));
          orb.addEventListener('focus', () => active(true)); orb.addEventListener('blur', () => active(false));
        });
        /* desktop diagram: whichever sphere is in focus (pointer over it, or over its number) lights its card, dims the rest and replays the count */
        addEventListener('nx:focus', e => { const f = e.detail; stage.classList.toggle('has-focus', f >= 0); orbs.forEach((o, k) => o.classList.toggle('focus', k === f));
          if (f >= 0 && !reduce) { const o = orbs[f], b = $('[data-count]', o), end = Number(b.dataset.count), st = { v: 0 }; gsap.killTweensOf(st);
            gsap.to(st, { v: end, duration: .9, ease: 'power3.out', onUpdate: () => (b.textContent = Math.round(st.v)), onComplete: () => (b.textContent = String(end)) });
            gsap.fromTo($('.orb-bar i', o), { scaleX: 0 }, { scaleX: 1, duration: .9, ease: 'power3.out' }); } });
        if (!reduce) ScrollTrigger.create({ trigger: results, start: 'top 70%', once: true, onEnter: () => {
          orbs.forEach((orb, i) => {
            const number = $('[data-count]', orb), end = Number(number.dataset.count), state = { value: 0 };
            gsap.to(state, { value: end, duration: 1.45, delay: i * .12, ease: 'power3.out',
              onUpdate: () => (number.textContent = Math.round(state.value)),
              onComplete: () => { number.textContent = String(end); NXBall.pulse(i); } });
          });
        } });

        ScrollTrigger.matchMedia({ '(min-width: 1000px)': () => {
          if (reduce) return;
          const groups = $$('.geo .rot > g', process);
          gsap.set(groups, { opacity: 0 });
          gsap.to(groups, { opacity: 1, ease: 'none', stagger: .28,
            scrollTrigger: { trigger: process, start: 'top 85%', end: 'bottom 25%', scrub: 1 } });
        } });

      })();

      /* The segmented ornament keeps its silhouette while its ten contours briefly trade places on hover. */
      if (fine && !reduce) {
        const ornament = $('.results-ornament');
        const pieces = ornament && $$('.ornament-piece', ornament);
        if (pieces && pieces.length && pieces[0].animate) {
          const drift = [[-7, -4], [6, -3], [-5, 4], [6, 5], [0, -7], [-4, -5], [1, 6], [7, 3], [-6, 3], [5, -4]];
          let running = false;
          ornament.addEventListener('pointerenter', () => {
            if (running) return;
            running = true;
            Promise.allSettled(pieces.map((piece, i) => {
              const [x, y] = drift[i], turn = i % 2 ? 5 : -5;
              return piece.animate([
                { transform: 'translate(0, 0) rotate(0deg)', offset: 0 },
                { transform: `translate(${x}px, ${y}px) rotate(${turn}deg)`, offset: .28 },
                { transform: `translate(${-x * .55}px, ${-y * .55}px) rotate(${-turn * .6}deg)`, offset: .62 },
                { transform: 'translate(0, 0) rotate(0deg)', offset: 1 }
              ], { duration: 820, delay: i * 26, easing: 'cubic-bezier(.77, 0, .175, 1)' }).finished;
            })).then(() => { running = false; });
          });
        }
      }

      /* manifesto scrub */
      const man = $('#manifesto'); man.innerHTML = [...man.textContent].map(c => (c === ' ' ? ' ' : `<span class="ch">${c}</span>`)).join('');
      /* power-on: rails grow → text lights up → diamond turns once → note appears */
      const chs = $$('#manifesto .ch'), mdm = $('.manifesto-note .dm'), mp = $('.manifesto-note p');
      if (!reduce) {
        gsap.set(chs, { opacity: 0 }); gsap.set(mp, { opacity: 0, y: 24 }); gsap.set(mdm, { scale: 0, rotation: -135 });
        gsap.set('.manifesto-signal .signal-ext', { opacity: 0 }); gsap.set('.manifesto-signal .signal-line', { strokeDashoffset: 1 }); gsap.set('.manifesto-signal .signal-node', { opacity: 0 });
        gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.manifesto', start: 'top 60%', end: 'bottom 72%', scrub: .6 } })
          .to('.manifesto-signal .signal-line', { strokeDashoffset: 0, duration: .4, stagger: .04 }, 0)
          .to('.manifesto-signal .signal-ext', { opacity: 1, duration: .45 }, 0)
          .to('.manifesto-signal .signal-node', { opacity: .85, duration: .1, stagger: .05 }, .3)
          .to(chs, { opacity: 1, duration: .35, stagger: { each: .35 / chs.length, from: 'start' } }, .25)
          .to(mdm, { scale: 1, rotation: 45, duration: .12, ease: 'back.out(1.6)' }, .72)
          .to(mp, { opacity: 1, y: 0, duration: .16 }, .82);
      }

      /* constellation: floating diamonds with spring physics, pointer repulsion, elastic hairlines */
      (function field() {
        const box = $('#field'); if (!box) return;
        const items = $$('.dmd', box).map((el, i) => ({ el, i, fx: +el.dataset.x, fy: +el.dataset.y, x: 0, y: 0, vx: 0, vy: 0, lockX: 0, lockY: 0, ph: rand(0, 6.28), sp: rand(.7, 1.3), open: false, pinned: false }));
        const edges = [[0, 2], [0, 1], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5], [5, 6], [3, 6]];
        const setOpen = (it, on, pin) => { if (on && !it.open) { it.lockX = it.x; it.lockY = it.y; it.vx = it.vy = 0; } it.open = on; it.el.classList.toggle('open', on); $('.dmd-node', it.el).setAttribute('aria-expanded', String(on)); if (on) Snd.open(it.i); if (!on) it.pinned = false; if (pin !== undefined) it.pinned = pin; it.el.classList.toggle('held', it.pinned); };
        const closeAll = except => items.forEach(o => { if (o !== except) setOpen(o, false); });
        const live = !reduce && innerWidth >= 720;
        matchMedia('(min-width: 720px)').addEventListener('change', () => { try { sessionStorage.setItem('nxNoIntro', '1'); } catch (_) {} location.reload(); });
        if (live) {
          box.classList.add('live');
          items.forEach(it => it.el.classList.toggle('flip', it.fx > .5));
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'field-lines'); svg.setAttribute('aria-hidden', 'true'); box.prepend(svg);
          const lines = edges.map(([a, b]) => { const l = document.createElementNS('http://www.w3.org/2000/svg', 'line'); svg.appendChild(l); return { l, a: items[a], b: items[b] }; });
          let W = 0, H = 0; const measure = () => { const r = box.getBoundingClientRect(); W = r.width; H = r.height; items.forEach(it => { if (!it.x && !it.y) { it.x = it.fx * (W - 64); it.y = it.fy * (H - 44); } }); };
          measure(); addEventListener('resize', measure);
          const pm = { x: -999, y: -999, on: false };
          box.addEventListener('pointermove', e => { const r = box.getBoundingClientRect(); pm.x = e.clientX - r.left; pm.y = e.clientY - r.top; pm.on = e.pointerType === 'mouse'; });
          box.addEventListener('pointerleave', () => (pm.on = false));
          let running = false; ScrollTrigger.create({ trigger: box, start: 'top bottom', end: 'bottom top', onToggle: s => (running = s.isActive) });
          gsap.ticker.add(() => {
            if (!running) return; const t = performance.now();
            items.forEach(it => {
              if (it.open) {
                it.x = it.lockX; it.y = it.lockY; it.vx = it.vy = 0;
                it.el.style.transform = `translate3d(${it.x}px,${it.y}px,0)`;
                return;
              }
              const tx = it.fx * (W - 64) + Math.sin(t * .00035 * it.sp + it.ph) * 22, ty = it.fy * (H - 44) + Math.cos(t * .0003 * it.sp + it.ph * 1.7) * 16;
              // pointer gives a bounded, soft nudge (≤ 24px) that fades to zero when you are on the node, so it can always be caught
              let ox = 0, oy = 0;
              if (pm.on) { const dx = it.x + 32 - pm.x, dy = it.y + 32 - pm.y, d = Math.hypot(dx, dy) || 1; const k = d >= 150 ? 0 : d >= 70 ? 1 - (d - 70) / 80 : d / 70; ox = dx / d * 24 * k; oy = dy / d * 24 * k; }
              let ax = (tx + ox - it.x) * .05, ay = (ty + oy - it.y) * .05;
              items.forEach(o => { if (o === it) return; const dx = it.x - o.x, dy = it.y - o.y, d = Math.hypot(dx, dy) || 1; if (d < 150) { const f = (1 - d / 150) * .5; ax += dx / d * f; ay += dy / d * f; } });
              it.vx = (it.vx + ax) * .78; it.vy = (it.vy + ay) * .78; it.x = clamp(it.x + it.vx, 0, W - 44); it.y = clamp(it.y + it.vy, 0, H - 44);
              it.el.style.transform = `translate3d(${it.x}px,${it.y}px,0)`;
            });
            lines.forEach(({ l, a, b }) => { l.setAttribute('x1', a.x + 32); l.setAttribute('y1', a.y + 32); l.setAttribute('x2', b.x + 32); l.setAttribute('y2', b.y + 32); l.classList.toggle('hot', a.open || b.open); });
          });
          items.forEach(it => { let tm;
            it.el.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; clearTimeout(tm); closeAll(it); setOpen(it, true); });
            it.el.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse' || it.pinned) return; tm = setTimeout(() => setOpen(it, false), 260); });
            $('.dmd-node', it.el).addEventListener('click', () => { if (it.pinned) setOpen(it, false); else { closeAll(it); setOpen(it, true, true); } });
          });
          addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
          document.addEventListener('pointerdown', e => { if (!e.target.closest('.dmd')) closeAll(); });
        } else items.forEach(it => setOpen(it, true));
      })();

      /* mobile power-on flourish: nested diamonds draw themselves and turn as the manifesto lights up */
      if (!reduce && innerWidth < 1000) {
        const NS = 'http://www.w3.org/2000/svg', mg = document.createElementNS(NS, 'svg'); mg.setAttribute('class', 'man-geo'); mg.setAttribute('viewBox', '0 0 400 400'); mg.setAttribute('aria-hidden', 'true');
        [190, 140, 90].forEach(r => { const p = document.createElementNS(NS, 'polygon'); p.setAttribute('points', `200,${200 - r} ${200 + r},200 200,${200 + r} ${200 - r},200`); p.setAttribute('pathLength', '1'); mg.appendChild(p); });
        $('.manifesto').prepend(mg);
        gsap.set('.man-geo polygon', { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.manifesto', start: 'top 80%', end: 'bottom 30%', scrub: .6 } })
          .to('.man-geo polygon', { strokeDashoffset: 0, duration: .45, stagger: .12 }, 0)
          .fromTo('.man-geo', { rotation: -60, scale: .65, opacity: 0 }, { rotation: 120, scale: 1.05, opacity: .5, duration: 1 }, 0);
      }

      /* axis: the line draws down as diamonds arrive */
      /* pains: galaxy in the middle-right, six diamonds ride a left semicircle around it; scroll turns the wheel,
         the diamond at the leftmost point unfolds into its full text. Below 1000px / reduced motion: plain axis list. */
      (function pains() {
        const sec = $('.pains'), stage = $('.pains-pin'), items = $$('.pn'), panel = $('.pains-panel'), pnum = $('.num', panel), ph3 = $('h3', panel), pp = $('p', panel), link = $('.pains-link line');
        const live = !reduce;
        const mob = () => innerWidth < 1000;
        if (!live) { items.forEach(revealNode); return; }
        sec.classList.add('live');
        const ICONS = ['M3 5h18l-7 8v6l-4-2v-4L3 5z', 'M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9', 'M4 5h16v11H9l-5 4V5zM8 10h.01M12 10h.01M16 10h.01', 'M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6zM12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5M4 4l16 16', 'M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3', 'M3 20h18M6 16l4-5 3 3 5-8M15 6h3v3'];
        const SOLVE = ['marketing', 'automation', 'workforce', 'marketing', 'automation', 'backend'];
        const pIc = document.createElement('span'), pFix = document.createElement('a'); pIc.className = 'pains-ic'; pIc.setAttribute('aria-hidden', 'true'); pFix.className = 'pains-fix'; panel.prepend(pIc); panel.append(pFix);
        let W = 0, H = 0, Cx = 0, Cy = 0, Rr = 0, panelR = 0;
        const STEP = 26, N = items.length; let posT = 0, pos = 0, cur = -1, st;
        const measure = () => { const r = stage.getBoundingClientRect(); W = r.width; H = r.height; if (mob()) { Cx = W / 2; return; } Cx = W * .35 + W * .65 / 2; Cy = H * .53; Rr = Math.min(W * .27, H * .40); const left = Cx - Rr; panel.style.width = Math.max(240, Math.min(440, left - panel.offsetLeft - 90)) + 'px'; };
        measure(); addEventListener('resize', measure);
        const fill = i => { const src = items[i]; pIc.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[i % 6]}"/></svg>`; const sv = D.services.find(s => s.slug === SOLVE[i % 6]); if (sv) { pFix.href = svcLink(sv); pFix.innerHTML = `Как решаем: <b>${sv.name}</b> →`; } pnum.textContent = $('.num', src).textContent; ph3.textContent = $('h3', src).textContent; pp.textContent = $('p', src).textContent;
          const words = [ph3, pp].flatMap(el => { el.innerHTML = el.textContent.split(/\s+/).map(w => `<span class="w"><span class="wi">${w}</span></span>`).join(' '); return $$('.wi', el); });
          gsap.fromTo(panel, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: .8, ease: 'power3.out' });
          gsap.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: .8, ease: 'power4.out', stagger: .012 }); gsap.fromTo(pnum, { opacity: 0 }, { opacity: 1, duration: .6 }); Snd.blip(420 + i * 60, .2, .02); NXGalaxy.boost = 1; setTimeout(() => (NXGalaxy.boost = 0), 500); };
        /* phones: NO js pin (its fixed<->absolute swap is what jumped). The section is simply tall and the stage is natively position:sticky, so it lets go smoothly. */
        if (mob()) sec.style.height = `calc(100svh + ${(N - 1) * 84}vh)`;
        st = ScrollTrigger.create({ trigger: sec, start: 'top top', end: mob() ? 'bottom bottom' : () => '+=' + (N - 1) * 160 + 'vh', ...(mob() ? {} : { pin: stage, anticipatePin: 1 }), scrub: mob() ? .6 : true, snap: mob() ? false : { snapTo: 1 / (N - 1), duration: { min: .3, max: .6 }, delay: .2, ease: 'power2.inOut' }, invalidateOnRefresh: true, onUpdate: s => { const h = mob() ? .12 : 0; posT = clamp((s.progress - h) / (1 - 2 * h), 0, 1) * (N - 1); }   /* phones: dead zones at both ends so the block lands on item 1 and lets go after the last one */, onRefresh: measure });
        items.forEach((it, i) => $('.pn-hit', it).addEventListener('click', () => { const hh = mob() ? .12 : 0, y = st.start + (hh + (i / (N - 1)) * (1 - 2 * hh)) * (st.end - st.start); lenis ? lenis.scrollTo(y, { duration: 1.1 }) : scrollTo({ top: y, behavior: 'smooth' }); }));
        gsap.ticker.add(() => {
          if (!sec.classList.contains('live')) return;
          const cap = mob() ? .022 : .045; pos += clamp((posT - pos) * .1, -cap, cap); NXGalaxy.spin = pos * .9;
          const act = Math.round(pos); let ax = 0, ay = 0;
          if (mob()) {
            const pr = panel.getBoundingClientRect(), sr = stage.getBoundingClientRect(), rowY = pr.top - sr.top - 34;
            items.forEach((it, i) => { const d = i - pos, a = Math.abs(d), op = clamp(1 - a * .28, 0, 1);
              it.style.transform = `translate3d(${Cx + d * 54}px,${rowY}px,0)`; it.style.opacity = op.toFixed(3); it.style.visibility = op < .02 ? 'hidden' : 'visible'; it.classList.toggle('on', i === act); });
            if (act !== cur) { cur = act; fill(act); }
            return;
          }
          items.forEach((it, i) => {
            const phi = (i - pos) * STEP, rad = phi * Math.PI / 180, x = Cx - Rr * Math.cos(rad), y = Cy + Rr * Math.sin(rad), a = Math.abs(phi);
            const op = a <= 56 ? 1 : clamp(1 - (a - 56) / 22, 0, 1);
            it.style.transform = `translate3d(${x}px,${y}px,0)`; it.style.opacity = op.toFixed(3); it.style.visibility = op < .02 ? 'hidden' : 'visible';
            it.classList.toggle('far', a > 40); if (i === act) { it.classList.add('on'); ax = x; ay = y; } else it.classList.remove('on');
          });
          if (act !== cur) { cur = act; fill(act); }
          const pr = panel.getBoundingClientRect(), sr = stage.getBoundingClientRect();
          link.setAttribute('x1', pr.right - sr.left + 14); link.setAttribute('y1', pr.top - sr.top + pr.height / 2); link.setAttribute('x2', ax - 10); link.setAttribute('y2', ay);
        });
      })();

      /* why: pinned scene, frame turns, slides change (desktop); stacked list elsewhere */
      const slides = $$('.why-slide'), tabs = $$('.why-tabs .dm'), fr = $$('.why-stage .frame');
      const mobileWhyItems = $$('.why-mobile details');
      let disclosureTimer = 0;
      const scheduleRefresh = ms => { clearTimeout(disclosureTimer); disclosureTimer = setTimeout(() => { try { if (lenis && lenis.resize) lenis.resize(); } catch (_) {} try { if (lenis) lenis.stop(); } catch (_) {} try { ScrollTrigger.refresh(); } catch (_) {} try { if (lenis) lenis.start(); } catch (_) {} }, ms); };
      const accOpen = (el, det) => {
        if (el.open) return;
        gsap.killTweensOf(det);
        if (reduce) { el.open = true; scheduleRefresh(100); return; }
        el.open = true;
        gsap.fromTo(det, { height: 0 }, { height: 'auto', duration: .5, ease: 'power3.out', overwrite: 'auto',
          onComplete: () => { gsap.set(det, { clearProps: 'height' }); scheduleRefresh(0); } });
      };
      const accClose = (el, det, done) => {
        if (!el.open) { if (done) done(); return; }
        gsap.killTweensOf(det);
        if (reduce) { el.open = false; if (done) done(); return; }
        gsap.to(det, { height: 0, duration: .45, ease: 'power3.inOut', overwrite: 'auto',
          onComplete: () => { el.open = false; gsap.set(det, { clearProps: 'height' }); if (done) done(); } });
      };
      const bindAccordion = (items, bodySel) => {
        items.forEach(item => {
          item.querySelector('summary').addEventListener('click', e => {
            e.preventDefault();
            const det = item.querySelector(bodySel);
            if (gsap.isTweening(det)) return;
            if (item.open) { accClose(item, det, () => scheduleRefresh(550)); return; }
            const other = items.find(o => o !== item && o.open);
            if (other) { accClose(other, other.querySelector(bodySel), () => accOpen(item, item.querySelector(bodySel))); return; }
            accOpen(item, det);
          });
        });
      };
      bindAccordion(mobileWhyItems, '.why-mobile-detail');
      const mobileProcessItems = $$('.process-mobile-list details');
      bindAccordion(mobileProcessItems, '.proc-detail');
      ScrollTrigger.matchMedia({ '(min-width: 1000px)': () => { if (reduce) return; let cur = 0;
        ScrollTrigger.create({ trigger: '.why-pin', start: 'top top', end: '+=260%', pin: true, scrub: true, onUpdate: s => {
          setWl(clamp((s.progress - .45) / .5, 0, 1));
          const i = Math.min(3, Math.floor(s.progress * 4));
          if (i !== cur) { slides[cur].classList.remove('on'); tabs[cur].classList.remove('on'); cur = i; slides[i].classList.add('on'); tabs[i].classList.add('on'); Snd.blip(440 + i * 110, .25, .02); }
          gsap.set(fr[0], { rotation: 45 + s.progress * 90 }); gsap.set(fr[1], { rotation: 45 - s.progress * 140 }); gsap.set(fr[2], { rotation: 45 + s.progress * 220 }); } }); },
        '(max-width: 999px)': () => { slides.forEach(s => s.classList.add('on')); document.body.classList.add('why-static'); setWl(1); } });

      /* mobile dressing: service signals draw with scroll, parchment reveals, static geo */
      ScrollTrigger.matchMedia({ '(max-width: 999px)': () => {
        if (reduce) return;
        $$('.svc-signal').forEach(svg => {
          const lines = $$('.sig-line', svg), nodes = $$('.sig-node', svg);
          gsap.set(lines, { strokeDashoffset: 1 });
          gsap.set(nodes, { opacity: 0 });
          gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: svg, start: 'top 94%', end: 'bottom 35%', scrub: .5 } })
            .to(lines, { strokeDashoffset: 0, duration: .5, stagger: .08 }, 0)
            .to(nodes, { opacity: .9, duration: .15, stagger: .1 }, .35);
        });
        const parch = $$('#process .sec-head, .process-mobile-list details, .why-pin .sec-head, .why-mobile .sec-head, .why-mobile details');
        parch.forEach(el => {
          gsap.set(el, { opacity: 0, y: 30 });
          ScrollTrigger.create({ trigger: el, start: 'top 92%', toggleActions: 'play none none reverse',
            onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: .5, ease: 'power3.out', overwrite: 'auto' }),
            onLeaveBack: () => gsap.to(el, { opacity: 0, y: 30, duration: .35, ease: 'power2.in', overwrite: 'auto' }) });
        });
      } });

      /* process line */
      ScrollTrigger.matchMedia({ '(min-width: 1000px)': () => {
        gsap.to('.steps-line', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 80%', end: 'bottom 65%', scrub: true } });
      } });


      /* works gallery: three slanted panels; hover one and it widens while the rest blur back; drag / wheel / buttons scroll sideways */
      const gTrack = $('.gal-track');
      if (gTrack) {
        const cards = $$('.work', gTrack), gBar = $('.gal-bar i');
        if (fine) {
          cards.forEach(c => c.addEventListener('pointerenter', () => { gTrack.classList.add('hovering'); cards.forEach(o => o.classList.toggle('on', o === c)); }));
          gTrack.addEventListener('pointerleave', () => { gTrack.classList.remove('hovering'); cards.forEach(o => o.classList.remove('on')); });
        }
        let down = false, sx = 0, sl = 0, moved = false;
        gTrack.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = gTrack.scrollLeft; });
        addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; gTrack.classList.add('drag'); } gTrack.scrollLeft = sl - dx; });
        addEventListener('pointerup', () => { down = false; gTrack.classList.remove('drag'); });
        gTrack.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
        gTrack.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { gTrack.scrollLeft += e.deltaX; e.preventDefault(); e.stopPropagation(); } }, { passive: false });   // sideways gestures stay here, vertical ones scroll the page
        const upd = () => { const m = gTrack.scrollWidth - gTrack.clientWidth, p = m > 0 ? gTrack.scrollLeft / m : 0; gBar.style.transform = `scaleX(${(.15 + .85 * p).toFixed(3)})`; };
        gTrack.addEventListener('scroll', upd, { passive: true }); upd();
        $$('.gal-btn').forEach(b => b.addEventListener('click', () => gTrack.scrollBy({ left: Number(b.dataset.dir) * (cards[0].offsetWidth + 12), behavior: reduce ? 'auto' : 'smooth' })));
        if (!reduce) gsap.from(cards, { opacity: 0, y: 40, duration: .9, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: gTrack, start: 'top 85%' } });
      }

      /* contact (legacy-red look): title glitches in, the round button pops and follows the cursor, clock ticks */
      const cTitle = $('.contact-title'), cBtn = $('.contact-btn'), clk = $('#clock2');
      if (cTitle) ScrollTrigger.create({ trigger: cTitle, start: 'top 88%', onEnter: () => burst(cTitle, 450, .5), onEnterBack: () => burst(cTitle, 300, .35) });
      if (cBtn && !reduce) gsap.from(cBtn, { scale: .4, opacity: 0, duration: 1.2, ease: 'elastic.out(1,.5)', scrollTrigger: { trigger: cBtn, start: 'top 92%' } });
      if (clk) { const tick = () => (clk.textContent = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })); tick(); setInterval(tick, 20000); }

      faq($('.faq'), D.homeFaq);
      addEventListener('load', () => ScrollTrigger.refresh());
    },

    service() {
      const slug = new URLSearchParams(location.search).get('s') || 'marketing';
      const i = Math.max(0, D.services.findIndex(s => s.slug === slug)), s = D.services[i], nx = D.services[(i + 1) % D.services.length];
      document.title = `${s.name} — Nexora AI`;
      const cards = list => list.map((f, k) => `<article class="card" tabindex="0"><div class="top"><span class="n">${String(k + 1).padStart(2, '0')}</span><i class="dm"></i></div><h3>${f.t}</h3><div class="d"><p>${f.d}</p></div></article>`).join('');
      const head = (kick, title, n) => `<div class="sec-head"><div class="kick"><i class="dm"></i><span class="label gold">${kick}</span></div><h2 class="h2" data-split>${title}</h2></div>`;
      $('#app').innerHTML = `
        <section class="s-hero" data-od-id="service-hero"><div class="wrap">
          <div class="txt"><span class="s-code">${s.code}</span><span class="label gold">${s.name} · ${s.tag}</span>
            <h1 class="h1" data-split>${s.h1[0]} <span class="rasp">${s.h1[1]}</span></h1>
            <p class="lead" data-reveal>${s.lead}</p>
            <div class="hero-cta" data-reveal><a class="btn solid" href="contact.html?service=${s.slug}" data-magnetic="0.2">${s.cta} <span class="ar">→</span></a>${s.cta2 ? `<a class="link" href="#features">${s.cta2}</a>` : ''}</div>
            <ul class="badges" data-reveal>${s.badges.map(b => `<li>${b}</li>`).join('')}</ul></div>
          <div class="s-art" data-reveal data-delay=".15"><div class="tint"><img data-parallax src="assets/${s.img}.jpg" alt=""></div></div></div></section>
        <section class="sec alt" id="features" data-od-id="service-features"><div class="wrap">${head('01', s.featTitle)}<div class="cards" data-stagger>${cards(s.features)}</div></div></section>
        ${s.phases ? `<section class="sec" data-od-id="service-phases"><div class="wrap">${head('02', 'От идеи до <span class="rasp">продакшена</span>')}<div class="cards" data-stagger>${cards(s.phases)}</div></div></section>` : ''}
        ${s.extra ? `<section class="sec ${s.phases ? 'alt' : ''}" data-od-id="service-extra"><div class="wrap">${head(s.phases ? '03' : '02', s.extraTitle)}<div class="cards" data-stagger>${cards(s.extra)}</div></div></section>` : ''}
        ${s.faq.length ? `<section class="sec" data-od-id="service-faq"><div class="wrap">${head('FAQ', 'Частые <span class="rasp">вопросы</span>')}<div class="faq"></div></div></section>` : ''}
        <section class="cta" data-od-id="service-cta"><div class="wrap"><span class="label gold">Бесплатная 30-минутная сессия</span><h2 class="h2" data-split>Обсудим <span class="rasp">${s.name.toLowerCase()}</span>?</h2>
          <a class="btn solid" href="contact.html?service=${s.slug}" data-magnetic="0.3">Записаться на сессию <span class="ar">→</span></a></div></section>
        <a class="next wrap" href="${svcLink(nx)}" data-cursor="label" data-cursor-text="Далее"><span class="label">Следующая услуга</span><div class="h2">${nx.name}</div></a>`;
      initReveals(); if (s.faq.length) faq($('.faq'), s.faq);
      addEventListener('load', () => ScrollTrigger.refresh()); lenis && lenis.start();
    },

    contact() {
      initReveals();
      const q = new URLSearchParams(location.search).get('service'), sel = $('#interest');
      D.services.forEach(s => sel.insertAdjacentHTML('beforeend', `<option value="${s.slug}" ${q === s.slug ? 'selected' : ''}>${s.name}</option>`));
      sel.insertAdjacentHTML('beforeend', '<option value="guidance">Пока не уверен, нужна подсказка</option>');
      const box = $('.form'), form = $('form', box);
      form.addEventListener('submit', e => { e.preventDefault(); let ok = true;
        $$('[required]', form).forEach(f => { const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value)); f.closest('.field').classList.toggle('bad', bad); if (bad) ok = false; });
        if (!ok) return; box.classList.add('sent'); Snd.open(2); gsap.from('.done', { opacity: 0, y: 20, duration: .8, ease: 'power3.out' }); }); // отправка пока не подключена к бэкенду
      $('#again').addEventListener('click', () => { box.classList.remove('sent'); form.reset(); });
      lenis && lenis.start();
    }
  };
  (PAGES[page] || (() => {}))();
})();
