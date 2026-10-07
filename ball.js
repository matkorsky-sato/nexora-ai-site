/* NEXORA results sculpture — selected geometry from the supplied Abstract_Circle.fbx.
   FBXLoader + fflate are loaded by index.html. The four satellites respond to the four metrics. */
window.NXBall = { spin: 0, run() {}, setAct() {}, pulse() {}, assemble() {}, ready: false };

(() => {
  const canvas = document.getElementById('ball-view');
  if (!canvas || !window.THREE || !THREE.FBXLoader || !window.fflate) return;
  const stage = canvas.parentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileScene = matchMedia('(max-width: 999px)').matches;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (_) { stage.classList.add('model-failed'); return; }
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .86;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  camera.position.set(0, 0, 5.8);
  scene.add(new THREE.HemisphereLight(0xe2a9b0, 0x23050e, .48));
  const key = new THREE.DirectionalLight(0xe9a9ad, 1.05); key.position.set(-3, 4, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9b213b, 1.5); rim.position.set(3, 1, -4); scene.add(rim);
  const root = new THREE.Group(); scene.add(root);
  const materials = [];
  const satelliteNames = ['Sphere002', 'Icosphere001', 'Sphere', 'Sphere001'];
  const active = [0, 0, 0, 0], targets = [0, 0, 0, 0];
  let sculpture = null, visible = false, requested = false, revealed = false, revealPending = false, firstFrame = false;
  let prev = performance.now(), spin = 0, tYaw = 0, tPitch = 0, yaw = 0, pitch = 0, gyro = false;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const parts = [], wires = [], wireAmt = [0, 0, 0, 0], wireTgt = [0, 0, 0, 0], wireScroll = [0, 0, 0, 0, 0], debris = [], allParts = [];
  const shatU = { value: 0 }, timeU = { value: 0 };
  let domFocus = -1, curFocus = -1, missT = 0; const ptr = { x: -1, y: -1, inside: false };
  let shat = 0, shatT = 0, zoom = 0, zoomT = 0, fi = 0, camBaseZ = 5, hoverZoomOK = false;
  const ease = x => x * x * (3 - 2 * x);
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();   // metric i -> part i (0 = the big sphere): hover turns it into a wire cage

  const baseMaterial = () => new THREE.MeshPhysicalMaterial({
    color: 0x530e25, emissive: 0x200511, emissiveIntensity: .14,
    metalness: .18, roughness: .36, clearcoat: .65, clearcoatRoughness: .18,
    side: THREE.DoubleSide
  });

  function resize() {
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobileScene ? 1.35 : 1.7));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    camBaseZ = 5.8 * (w / h < .9 ? .9 / (w / h) : 1) * (w >= 900 ? .85 : 1); camera.position.z = camBaseZ;
    hoverZoomOK = w >= 900 && matchMedia('(hover: hover)').matches;
  }
  new ResizeObserver(resize).observe(canvas); resize();

  /* shards: every (sub-sampled) triangle of a part flies off on its own vector, spinning; all motion is in the vertex shader */
  const shardMat = () => new THREE.ShaderMaterial({
    uniforms: { uT: shatU, uTime: timeU, uR: { value: 1 }, uC: { value: new THREE.Vector3() } }, side: THREE.DoubleSide, transparent: true,
    vertexShader: `attribute vec3 aCentroid; attribute vec4 aRand; uniform float uT, uTime, uR; uniform vec3 uC; varying vec3 vN; varying float vTint; varying float vA;
      void main() {
        float t = clamp(uT * 1.35 - aRand.w * .35, 0.0, 1.0), e = 1.0 - exp(-4.5 * t);
        vec3 dir = normalize(aCentroid - uC + (aRand.xyz - .5) * .9 * uR);
        vec3 drift = vec3(sin(uTime * .5 + aRand.x * 6.28), cos(uTime * .43 + aRand.y * 6.28), sin(uTime * .37 + aRand.z * 6.28)) * .09 * uR * t;
        float ang = e * (2.0 + aRand.w * 7.0); vec3 axis = normalize(aRand.xyz * 2.0 - 1.0 + vec3(.001));
        float cs = cos(ang), sn = sin(ang);
        vec3 p = position - aCentroid; p = p * cs + cross(axis, p) * sn + axis * dot(axis, p) * (1.0 - cs);
        vec3 n = normal; n = n * cs + cross(axis, n) * sn + axis * dot(axis, n) * (1.0 - cs);
        vec3 world = aCentroid + dir * e * uR * (.7 + aRand.w * 2.3) + drift + p;
        vN = normalMatrix * n; vTint = aRand.z; vA = smoothstep(0.0, .08, uT);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
      }`,
    fragmentShader: `varying vec3 vN; varying float vTint; varying float vA;
      void main() {
        vec3 n = normalize(vN); float l = .3 + .7 * max(dot(n, normalize(vec3(-.4, .7, .6))), 0.0), rim = pow(1.0 - abs(n.z), 2.2);
        vec3 base = mix(vec3(.16, .02, .05), vec3(1.0, .24, .5), step(.9, vTint));
        gl_FragColor = vec4(base * l + rim * .35 * vec3(1.0, .38, .42), vA);
      }`
  });
  function makeDebris(part) {
    let g = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry;
    if (!part.geometry.boundingSphere) part.geometry.computeBoundingSphere();
    const bs = part.geometry.boundingSphere, src = g.attributes.position, nTri = Math.floor(src.count / 3), step = Math.max(1, Math.ceil(nTri / 2400));
    const P = [], N = [], C = [], R = [];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
    for (let t = 0; t < nTri; t += step) {
      a.fromBufferAttribute(src, t * 3); b.fromBufferAttribute(src, t * 3 + 1); c.fromBufferAttribute(src, t * 3 + 2);
      const ce = tmp.copy(a).add(b).add(c).multiplyScalar(1 / 3);
      n.copy(b).sub(a).cross(tmp2.copy(c).sub(a)).normalize();
      const r = [Math.random(), Math.random(), Math.random(), Math.random()];
      for (const v of [a, b, c]) { P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); C.push(ce.x, ce.y, ce.z); R.push(...r); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    geo.setAttribute('aCentroid', new THREE.Float32BufferAttribute(C, 3)); geo.setAttribute('aRand', new THREE.Float32BufferAttribute(R, 4));
    const m = shardMat(); m.uniforms.uR.value = bs.radius; m.uniforms.uC.value.copy(bs.center);
    const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; mesh.visible = false;
    mesh.position.copy(part.position); mesh.quaternion.copy(part.quaternion); mesh.scale.copy(part.scale); part.parent.add(mesh);   // sibling, not child: the part itself gets hidden
    return mesh;
  }

  new THREE.FBXLoader().load('muo35ju2-Abstract_Circle.fbx', model => {
    const selected = new THREE.Group();
    const main = model.children.find(child => child.isMesh && child.name === 'Icosphere');
    if (!main) { stage.classList.add('model-failed'); return; }
    [main, ...satelliteNames.map(name => model.children.find(child => child.isMesh && child.name === name))]
      .filter(Boolean).forEach((part, i) => {
        part.material = baseMaterial();
        if (part.geometry && !part.geometry.attributes.normal) part.geometry.computeVertexNormals();
        selected.add(part); allParts[i] = part;
        if (i < 4) {
          materials[i] = part.material; parts[i] = part; part.material.transparent = true;
          if (!mobileScene) {
            const wire = new THREE.LineSegments(new THREE.EdgesGeometry(part.geometry, 1), new THREE.LineBasicMaterial({ color: 0x6a0f26, transparent: true, opacity: 0 }));
            wire.visible = false; part.add(wire); wires[i] = wire;
          }
        }
      });
    const box = new THREE.Box3().setFromObject(selected);
    const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    const scale = 2.75 / Math.max(size.x, size.y, size.z) * (mobileScene ? 1 : .7);
    selected.scale.setScalar(scale);
    selected.position.copy(center).multiplyScalar(-scale);
    if (!mobileScene) allParts.forEach(p => p && debris.push(makeDebris(p)));
    sculpture = selected; root.add(selected);
    resize();
    if (revealPending) NXBall.assemble();
  }, undefined, () => stage.classList.add('model-failed'));

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { rootMargin: '100px 0px' }).observe(stage);
  } else {
    const check = () => { const r = stage.getBoundingClientRect(); visible = r.bottom > -100 && r.top < innerHeight + 100; };
    addEventListener('scroll', check, { passive: true }); addEventListener('resize', check); check();
  }
  /* steering: cursor position relative to the sculpture (whole window), or the phone's tilt */
  addEventListener('pointermove', e => {
    { const cr = canvas.getBoundingClientRect(); ptr.x = e.clientX; ptr.y = e.clientY; ptr.inside = e.clientX >= cr.left && e.clientX <= cr.right && e.clientY >= cr.top && e.clientY <= cr.bottom; }
    if (gyro || e.pointerType === 'touch') return;
    const r = stage.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    tYaw = clamp((e.clientX - (r.left + r.width / 2)) / (innerWidth / 2), -1, 1) * .9;
    tPitch = clamp((e.clientY - (r.top + r.height / 2)) / (innerHeight / 2), -1, 1) * .16;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { tYaw = 0; tPitch = 0; });
  const onTilt = e => { if (e.gamma == null) return; gyro = true; tYaw = clamp(e.gamma / 35, -1, 1) * .9; tPitch = clamp(((e.beta || 0) - 50) / 35, -1, 1) * .16; };
  let gyroAsked = false;
  const askGyro = () => {   // iOS only hands out orientation after a user gesture
    if (gyroAsked || !matchMedia('(pointer: coarse)').matches) return; gyroAsked = true;
    const DO = window.DeviceOrientationEvent;
    if (DO && typeof DO.requestPermission === 'function') DO.requestPermission().then(s => s === 'granted' && addEventListener('deviceorientation', onTilt, { passive: true })).catch(() => {});
    else addEventListener('deviceorientation', onTilt, { passive: true });
  };
  addEventListener('touchend', askGyro, { passive: true }); addEventListener('click', askGyro);

  NXBall.run = on => { requested = on; };
  NXBall.setAct = (i, value) => { if (i >= 0 && i < 4) targets[i] = value; };
  /* one focus state for the whole diagram: a sphere (pointer over its disc) or its number card (DOM hover) */
  const focusSet = i => {
    if (i === curFocus) return; curFocus = i;
    for (let k = 0; k < 4; k++) { wireTgt[k] = k === i ? 1 : 0; targets[k] = k === i ? .75 : 0; }
    if (i >= 0) { fi = i; zoomT = 1; } else zoomT = 0;
    dispatchEvent(new CustomEvent('nx:focus', { detail: i }));
  };
  NXBall.setWire = (i, on) => { if (i < 0 || i > 3 || !hoverZoomOK) return; if (on) { domFocus = i; focusSet(i); } else if (domFocus === i) { domFocus = -1; focusSet(-1); } };
  document.addEventListener('pointerleave', () => { ptr.inside = false; });
  const discOf = (p, rect) => {
    const bs = p.geometry.boundingSphere || (p.geometry.computeBoundingSphere(), p.geometry.boundingSphere);
    tmp.copy(bs.center); p.localToWorld(tmp);
    const Rw = bs.radius * tmp2.setFromMatrixScale(p.matrixWorld).x, d = camera.position.distanceTo(tmp), ppu = rect.height / (2 * d * Math.tan(camera.fov * Math.PI / 360));
    tmp.project(camera);
    return { x: (tmp.x * .5 + .5) * rect.width + rect.left, y: (-tmp.y * .5 + .5) * rect.height + rect.top, r: Rw * ppu };
  };
  /* Keep the mobile sculpture solid throughout the section; scrolling still steers its rotation. */
  NXBall.setScroll = () => {};
  NXBall.pulse = i => { if (i >= 0 && i < 4) active[i] = 1.5; };
  NXBall.assemble = () => {
    if (reduce || revealed) return;
    if (!sculpture) { revealPending = true; return; }
    revealed = true;
    root.scale.setScalar(.76);
    if (window.gsap) gsap.to(root.scale, { x: 1, y: 1, z: 1, duration: 1.5, ease: 'power3.out' });
    else root.scale.setScalar(1);
  };

  (function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min((now - prev) / 1000, .05); prev = now;
    if (!sculpture || document.hidden || !(visible || requested)) return;
    timeU.value = now / 1000;
    zoom += (zoomT - zoom) * Math.min(1, dt * 3); shat += (shatT - shat) * Math.min(1, dt * 5);
    if (!reduce) spin += dt * .3 * (1 - .7 * zoom);
    const fk = Math.min(1, dt * 5); yaw += (tYaw - yaw) * fk; pitch += (tPitch - pitch) * fk;
    root.rotation.y = spin + NXBall.spin * .2 + yaw;
    root.rotation.x += ((reduce ? 0 : Math.sin(now * .00037) * .05) + pitch - root.rotation.x) * .1;
    const gone = clamp(shat / .12, 0, 1);
    for (let i = 0; i < parts.length; i++) {
      wireAmt[i] += (wireTgt[i] - wireAmt[i]) * Math.min(1, dt * 3.2);
      const w = ease(Math.max(wireAmt[i], wireScroll[i])), dim = 1;   // only the focused sphere turns into a cage; the others stay solid
      parts[i].material.opacity = (1 - w * .86) * dim * (1 - gone); parts[i].material.depthWrite = w < .5; parts[i].visible = shat < .004;
      if (wires[i]) { wires[i].visible = w > .01 && shat < .004; wires[i].material.opacity = w * (1 - gone) * (i === fi ? 1 : dim); }
    }
    if (allParts[4]) allParts[4].visible = shat < .004 && (1 - .55 * zoom) > .05;
    for (const d of debris) d.visible = shat > .002;
    /* desktop hover: the camera pushes in on the caged sphere and pulls back out */
    root.updateMatrixWorld(true);
    let cx = 0, cy = 0, cz = camBaseZ;
    if (zoom > .002 && allParts[fi]) {
      const p = allParts[fi], bs = p.geometry.boundingSphere || (p.geometry.computeBoundingSphere(), p.geometry.boundingSphere);
      tmp.copy(bs.center); p.localToWorld(tmp);
      const Rw = bs.radius * tmp2.setFromMatrixScale(p.matrixWorld).x, k = ease(zoom);
      cx = tmp.x * k * .8; cy = tmp.y * k * .8; cz = camBaseZ + (clamp(Rw * 5.4, 1.7, camBaseZ * .8) - camBaseZ) * k;
    }
    camera.position.set(cx, cy, cz); camera.lookAt(cx, cy, 0);
    for (let i = 0; i < materials.length; i++) {
      active[i] += (targets[i] - active[i]) * Math.min(1, dt * 3.2);
      materials[i].emissive.setHex(active[i] > .08 ? 0x8f1733 : 0x200511);
      materials[i].emissiveIntensity = .11 + active[i] * .7;
    }
    renderer.render(scene, camera);
    if (!firstFrame) { firstFrame = true; NXBall.ready = true; stage.classList.add('model-ready'); }
  })(prev);
})();
