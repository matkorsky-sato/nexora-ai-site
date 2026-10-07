/* NEXORA glass — shared studio environment + cast-glass material (Three.js r128).
   Glass only reads as glass when it has something to reflect, so we bake a small "photo studio"
   (softbox above, two strip lights, a warm kicker, dark floor) into a PMREM env map per renderer. */
window.NXGlass = {
  env(renderer) {
    const pm = new THREE.PMREMGenerator(renderer), s = new THREE.Scene();
    s.background = new THREE.Color(0x0d0710);                 // site ground: plum ink
    panel(9, 7, 8, 1, 2, '#ff3d7f', 1.5);                     // raspberry key, large + soft (hero glow)
    panel(6, 3, -6, -4, 3, '#c9a45c', 1.4);                   // gold kicker, lower left (hero gold wash)
    panel(10, 3, 0, 8, 0, '#efe6dc', .6);                     // dim bone from above
    panel(12, 12, 0, -8, 0, '#1a0c20', .7);                   // plum floor
    const t = pm.fromScene(s, .035).texture; pm.dispose(); return t;
  },
  /* Polished plum lacquer / obsidian: opaque, colours come from the site's own palette via the env map. */
  mat(color, env, o = {}) {
    return new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: o.roughness == null ? .24 : o.roughness, reflectivity: .5,
      clearcoat: 1, clearcoatRoughness: .08, envMap: env, envMapIntensity: o.env == null ? 1 : o.env,
      emissive: o.emissive || 0x000000, emissiveIntensity: o.emissiveIntensity || 0, side: o.side || THREE.FrontSide });
  },
  sync() {},
  addBack() {}
};
