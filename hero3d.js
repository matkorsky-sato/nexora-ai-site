/* NEXORA — hero molecule (Three.js r128), v5 "plum ink".
   Bridge: window.NX = { scroll 0..1, boostTarget 0|1, holding bool, hold 0..1 (eased), ready }.
   Holding the wordmark charges the scene: plum-black metal → hot raspberry/gold, big particle cloud. */
window.NX = { scroll: 0, boostTarget: 0, holding: false, hold: 0, ready: false };

(() => {
  const canvas = document.getElementById('model-view');
  const ryEl = document.getElementById('ry'), rxEl = document.getElementById('rx');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const done = () => { NX.ready = true; window.dispatchEvent(new Event('nx:model')); };
  if (!window.THREE || !THREE.OBJLoader) { canvas.style.display = 'none'; return done(); }

  let renderer, scene, camera, holder, pivot, dust, cloud, glow, material;
  let mScale = 1.75, mY = 0;   // portrait: the molecule is fitted into the free space above the hero text
  let framing = .9, aspect = 1, tx = 0, ty = 0, cx = 0, cy = 0, spin = 0, boost = 0, frame = 0;
  const C = { navy: new THREE.Color('#07172e'), rasp: new THREE.Color('#ff3d7f'), emis0: new THREE.Color('#11355b'), emis1: new THREE.Color('#ffb347') };

  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (_) { canvas.style.display = 'none'; return done(); }
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .78;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(34, 1, .01, 100);
  scene.add(new THREE.HemisphereLight('#bfd9ff', '#061020', .55));
  const key = new THREE.DirectionalLight('#bfdcff', 1.25); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight('#4f88c5', 2.2); rim.position.set(4, 1, -3); scene.add(rim);
  glow = new THREE.PointLight('#3b79bd', 1.3, 0, 2); glow.position.set(1.4, .8, 1.6); scene.add(glow);
  holder = new THREE.Group(); pivot = new THREE.Group(); holder.add(pivot); scene.add(holder);
  material = new THREE.MeshPhysicalMaterial({ color: 0x07172e, emissive: C.emis0, emissiveIntensity: .08, metalness: .22, roughness: .13, clearcoat: .8, clearcoatRoughness: .06, transmission: 0, opacity: 1, side: THREE.FrontSide });

  // soft round sprite for particles
  const sprite = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();

  function resize() {
    const w = Math.max(1, innerWidth), h = Math.max(1, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7)); renderer.setSize(w, h, false);
    aspect = w / h; camera.aspect = aspect; camera.updateProjectionMatrix();
    const v = camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(v / 2) * aspect);
    camera.position.set(0, 0, framing / Math.sin(Math.min(v, hf) / 2) * (aspect > 1.15 ? 1.7 : 1.9));
    holder.position.x = aspect > 1.15 ? framing * 1.8 : 0;
  }
  function fitPortrait() {
    if (aspect > 1.15) { mScale = 1.85; mY = 0; return; }
    const body = document.querySelector('.hero-body'); if (!body) return;
    const hdr = 68, free = Math.max(120, body.offsetTop - hdr - 12);
    const halfH = camera.position.z * Math.tan(camera.fov * Math.PI / 360), wpp = 2 * halfH / Math.max(1, innerHeight);
    mScale = clamp(free * 1.6 * wpp / (2 * framing * .95), .9, 2.3);
    mY = (1 - 2 * (hdr + free / 2 + 6) / Math.max(1, innerHeight)) * halfH;
  }
  addEventListener('resize', resize, { passive: true }); addEventListener('load', fitPortrait); resize();
  addEventListener('pointermove', e => { ty = ((e.clientX / innerWidth) * 2 - 1) * 1.1; tx = clamp(((e.clientY / innerHeight) * 2 - 1) * .5, -.5, .5); }, { passive: true });

  function makePoints(n, rMin, rMax, size, opacity, colors) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = framing * (rMin + Math.random() * (rMax - rMin)), th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
      const c = colors[Math.floor(Math.random() * colors.length)]; col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ size, map: sprite, vertexColors: true, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  }

  new THREE.OBJLoader().load('Molocule_01.obj', obj => {
    const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
    const s = (2.2 * 2 / 3) / (Math.max(size.x, size.y, size.z) || 1);
    obj.scale.setScalar(s); obj.position.copy(new THREE.Vector3(0, 1.74, 0)).multiplyScalar(-s);
    framing = new THREE.Box3().setFromObject(obj).getBoundingSphere(new THREE.Sphere()).radius;
    obj.traverse(c => { if (!c.isMesh) return; if (c.geometry && !c.geometry.attributes.normal) c.geometry.computeVertexNormals(); c.material = material; });
    pivot.add(obj);
    dust = makePoints(420, 1.1, 1.9, .05, .55, [new THREE.Color('#efe6dc'), new THREE.Color('#c9a45c')]); pivot.add(dust);
    cloud = makePoints(2600, .7, 1.7, .11, 0, [new THREE.Color('#ff3d7f'), new THREE.Color('#ffb347'), new THREE.Color('#c9a45c'), new THREE.Color('#ff7aa8')]); cloud.scale.setScalar(.3); pivot.add(cloud);
    resize(); done();
  }, undefined, () => done());

  let prev = performance.now();
  (function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min((now - prev) / 1000, .05); prev = now;
    const sc = clamp(NX.scroll, 0, 1);
    NX.hold += ((NX.holding ? 1 : 0) - NX.hold) * (1 - Math.exp(-dt * (NX.holding ? 2.6 : 3.2)));
    if (NX.hold < .001) NX.hold = 0;
    const h = NX.hold;
    canvas.style.opacity = String(aspect > 1.15 ? 1 - clamp((sc - .32) / .26, 0, 1) : 1 - clamp((sc - .04) / .26, 0, 1));   // desktop: gone before the manifesto; phone timing unchanged
    if (sc >= 1) return;
    const k = 1 - Math.exp(-dt * 5);
    cx += (tx - cx) * k; cy += (ty - cy) * k;
    boost += (NX.boostTarget - boost) * (1 - Math.exp(-dt * 4));
    if (!reduce) spin += dt * (.09 + boost * .9 + h * 2.2);
    pivot.rotation.x = cx + sc * .9 + (reduce ? 0 : Math.sin(now * .0006) * .04);
    pivot.rotation.y = cy + spin + sc * Math.PI * 1.5;
    pivot.rotation.z = -.42;
    if (frame % 30 === 0) fitPortrait();
    pivot.scale.setScalar(mScale * (1 + boost * .05 + h * .1) * (1 - sc * .3));
    holder.position.y = mY + sc * framing * 1.4 + (reduce ? 0 : Math.sin(now * .0011) * .02) + (h > .2 ? (Math.random() - .5) * .012 * h : 0);
    material.color.lerpColors(C.navy, C.rasp, h * .65);
    material.emissive.lerpColors(C.emis0, C.emis1, h);
    material.emissiveIntensity = .12 + boost * .15 + h * .8;
    glow.intensity = 1.3 + boost * 1.8 + h * 7;
    if (dust) { dust.rotation.y = -spin * .35; dust.material.opacity = .5 + h * .3; dust.material.size = .05 + h * .04; }
    if (cloud) { cloud.material.opacity = clamp(h * 1.15, 0, .95); cloud.scale.setScalar(.3 + h * 2.3); cloud.rotation.y = spin * .6; cloud.visible = h > .01; }
    if (++frame % 6 === 0) {
      const deg = r => String(Math.round(((r * 180 / Math.PI) % 360 + 360) % 360)).padStart(3, '0') + '°';
      if (ryEl) ryEl.textContent = deg(pivot.rotation.y); if (rxEl) rxEl.textContent = deg(pivot.rotation.x);
    }
    renderer.render(scene, camera);
  })(prev);
})();
