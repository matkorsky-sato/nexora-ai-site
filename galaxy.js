/* NEXORA — galaxy for the "pains" scene (Three.js r128).
   Default: a procedural spiral galaxy (GPU-rotated points, additive glow, plum → raspberry → gold).
   Drop a model at assets/galaxy.glb and it replaces the procedural one automatically.
   Bridge: window.NXGalaxy = { spin (radians, driven by the scene), boost 0..1, run(bool) } */
window.NXGalaxy = { spin: 0, boost: 0, run() {}, ready: false };

(() => {
  const canvas = document.getElementById('galaxy-view');
  if (!canvas || !window.THREE) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' }); } catch (_) { return; }
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38, 1, .1, 100), root = new THREE.Group();
  scene.add(root); root.rotation.x = -1.02; root.rotation.z = .22;

  /* ---- procedural spiral galaxy ---- */
  const N = 70000, ARMS = 3, R = 3;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), rad = new Float32Array(N), siz = new Float32Array(N);
  const inner = new THREE.Color('#ffd28a'), mid = new THREE.Color('#ff3d7f'), outer = new THREE.Color('#6b1a6e'), c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const r = Math.pow(Math.random(), 1.7) * R, branch = (i % ARMS) / ARMS * Math.PI * 2, spin = r * 1.35;
    const rnd = () => Math.pow(Math.random(), 3) * (Math.random() < .5 ? 1 : -1) * (.32 * r + .05);
    pos.set([Math.cos(branch + spin) * r + rnd(), rnd() * .35, Math.sin(branch + spin) * r + rnd()], i * 3);
    const t = r / R; c.copy(inner).lerp(mid, clamp(t * 1.7, 0, 1)).lerp(outer, clamp((t - .45) * 1.8, 0, 1));
    col.set([c.r, c.g, c.b], i * 3); rad[i] = r; siz[i] = .4 + Math.random() * 1.2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aRad', new THREE.BufferAttribute(rad, 1)); geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    uniforms: { uTime: { value: 0 }, uSize: { value: 26 }, uBoost: { value: 0 } },
    vertexShader: `uniform float uTime,uSize,uBoost; attribute float aRad,aSize; varying vec3 vC;
      void main(){ vC=color; float a=uTime*.22/(.35+aRad*.55); float s=sin(a),c=cos(a);
        vec3 p=vec3(position.x*c-position.z*s, position.y, position.x*s+position.z*c);
        vec4 mv=modelViewMatrix*vec4(p,1.); gl_PointSize=aSize*uSize*(1.+uBoost*.6)*(1./-mv.z); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vC; void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; float a=pow(1.-d*2.,2.2); gl_FragColor=vec4(vC*(1.15),a*.9); }`
  });
  const galaxy = new THREE.Points(geo, mat); root.add(galaxy);
  // bright core
  const coreCanvas = document.createElement('canvas'); coreCanvas.width = coreCanvas.height = 128; const g = coreCanvas.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,236,200,1)'); gr.addColorStop(.25, 'rgba(255,170,110,.55)'); gr.addColorStop(1, 'rgba(255,61,127,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(coreCanvas), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .9 })); core.scale.set(2.4, 2.4, 1); root.add(core);

  /* ---- optional custom model ---- */
  if (THREE.GLTFLoader) {
    fetch('assets/galaxy.glb', { method: 'HEAD' }).then(r => { if (!r.ok) return; new THREE.GLTFLoader().load('assets/galaxy.glb', gltf => {
      const m = gltf.scene, box = new THREE.Box3().setFromObject(m), s = new THREE.Vector3(); box.getSize(s); m.scale.setScalar(2 * R / Math.max(s.x, s.y, s.z, 1e-3)); box.setFromObject(m); const ctr = box.getCenter(new THREE.Vector3()); m.position.sub(ctr);
      m.traverse(o => { if (o.isMesh && o.material) { o.material.transparent = true; o.material.blending = THREE.AdditiveBlending; o.material.depthWrite = false; } });
      root.remove(galaxy); root.remove(core); root.add(m);
    }); }).catch(() => {});
  }

  function resize() {
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6)); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const v = camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(v / 2) * camera.aspect); camera.position.set(0, 0, R * 1.05 / Math.sin(Math.min(v, hf) / 2));
  }
  new ResizeObserver(resize).observe(canvas); resize();

  const t0 = performance.now(); let tilt = 0;
  // Rendering follows the visible canvas, including the approach to the pin and reverse scroll.
  NXGalaxy.run = () => {};
  addEventListener('pointermove', e => { tilt = ((e.clientY / innerHeight) * 2 - 1) * .12; }, { passive: true });
  (function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden || !canvas.getClientRects().length) return;
    const bounds = canvas.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top >= innerHeight) return;
    mat.uniforms.uTime.value = reduce ? 0 : (now - t0) / 1000; mat.uniforms.uBoost.value += (NXGalaxy.boost - mat.uniforms.uBoost.value) * .08;
    root.rotation.y = NXGalaxy.spin * .5 + (reduce ? 0 : (now - t0) * .00004); root.rotation.x += (-1.02 + tilt - root.rotation.x) * .05;
    renderer.render(scene, camera);
  })(t0);
  NXGalaxy.ready = true;
})();
