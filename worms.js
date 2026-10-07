/* NEXORA — "milk & ink": a soft white haze with barely-visible dark filaments crawling through it.
   One full-quad fragment shader (domain-warped noise, ridged into thin veins), rendered at low resolution
   so it reads as blur. Pointer parts the veins, scroll speed nudges them. Pauses when off screen. */
window.NXWorms = { run() {}, boost: 0 };
(() => {
  const canvas = document.querySelector('.worms');
  if (!canvas || !window.THREE) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer; try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' }); } catch (_) { return; }
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const U = { uT: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uMouse: { value: new THREE.Vector2(-9, -9) }, uBoost: { value: 0 } };
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader: `precision highp float; varying vec2 vUv; uniform float uT,uBoost; uniform vec2 uRes,uMouse;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*n(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return s; }
      void main(){
        vec2 uv=vUv*vec2(uRes.x/uRes.y,1.)*2.2; float t=uT*(.05+uBoost*.08);
        vec2 m=uMouse*vec2(uRes.x/uRes.y,1.)*2.2; float dm=length(uv-m); uv+=normalize(uv-m+1e-4)*smoothstep(.9,0.,dm)*.22;
        vec2 q=vec2(fbm(uv+t),fbm(uv+vec2(5.2,1.3)-t*.8));
        vec2 r=vec2(fbm(uv+3.*q+vec2(1.7,9.2)+t*.6),fbm(uv+3.*q+vec2(8.3,2.8)-t*.5));
        float f=fbm(uv+3.*r); float ridge=1.-abs(2.*f-1.); float vein=smoothstep(.90,.985,ridge);
        float vein2=smoothstep(.93,.99,1.-abs(2.*fbm(uv*1.9+r*2.-t)-1.));
        float haze=smoothstep(.2,.9,fbm(uv*.6+q));
        vec3 ink=vec3(.082,.043,.102), rasp=vec3(.85,.12,.39);
        float a=vein*.16+vein2*.09+haze*.045; vec3 c=mix(ink,rasp,haze*.35);
        gl_FragColor=vec4(c,a); }` })));
  let running = false, ptr = { x: -9, y: -9 };
  NXWorms.run = on => { running = on; };
  addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); ptr.x = (e.clientX - r.left) / r.width; ptr.y = 1 - (e.clientY - r.top) / r.height; }, { passive: true });
  function resize() { const w = Math.max(2, canvas.clientWidth), h = Math.max(2, canvas.clientHeight), s = .45; renderer.setPixelRatio(1); renderer.setSize(Math.round(w * s), Math.round(h * s), false); U.uRes.value.set(w * s, h * s); }
  new ResizeObserver(resize).observe(canvas); resize();
  const t0 = performance.now();
  (function tick(now) { requestAnimationFrame(tick); if (!running) return; U.uT.value = reduce ? 3 : (now - t0) / 1000; U.uMouse.value.lerp(new THREE.Vector2(ptr.x, ptr.y), .08); U.uBoost.value += (NXWorms.boost - U.uBoost.value) * .05; renderer.render(scene, cam); })(t0);
})();
