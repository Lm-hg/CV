/* ============================================================
   1. WEBGL SHADER BACKGROUND fond
   ============================================================ */
(function () {
  const canvas = document.getElementById('shader-bg');
  if (!canvas) return;
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) { canvas.style.display = 'none'; return; }

  const vert = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const frag = `
    precision mediump float;
    uniform float u_time;
    uniform vec2  u_res;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 cell = floor(p);
      vec2 local = fract(p);
      local = local * local * (3.0 - 2.0 * local);
      return mix(
        mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
        mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), local.x),
        local.y
      );
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;
      uv.x *= u_res.x / u_res.y;

      float time = u_time * 0.55;
      float turbulence = noise(vec2(uv.x * 4.0, uv.y * 2.5 - time));
      turbulence += noise(vec2(uv.x * 8.0 + 4.0, uv.y * 4.0 - time * 1.3)) * 0.45;

      float flameShape = 1.0 - uv.y;
      float flame = smoothstep(0.25, 1.0, flameShape + (turbulence - 0.55) * 0.42);
      flame *= smoothstep(1.0, 0.12, uv.y);

      vec3 smoke = vec3(0.025, 0.028, 0.027);
      vec3 ember = mix(vec3(0.22, 0.035, 0.008), vec3(0.95, 0.30, 0.055), flame);
      vec3 col = mix(smoke, ember, flame * 0.72);
      col += vec3(1.0, 0.53, 0.16) * pow(flame, 5.0) * 0.30;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uRes  = gl.getUniformLocation(prog, 'u_res');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  let start = null;
  function render(ts) {
    if (!start) start = ts;
    const t = (ts - start) / 1000;
    gl.uniform1f(uTime, t);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();


/* ============================================================
   2. CUSTOM CURSOR
   ============================================================ */
(function () {
  const cursor = document.getElementById('cursor');
  const trail  = document.getElementById('cursor-trail');
  if (!cursor || !trail) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  let mx = -100, my = -100, tx = -100, ty = -100;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  function loop() {
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
    tx += (mx - tx) * 0.12;
    ty += (my - ty) * 0.12;
    trail.style.left = tx + 'px';
    trail.style.top  = ty + 'px';
    requestAnimationFrame(loop);
  }
  loop();
})();


/* ============================================================
   3. TYPED ROLE EFFECT
   ============================================================ */
(function () {
  const el = document.getElementById('typed-role');
  if (!el) return;
  const words = ['Full Stack', 'React / Node', 'Mobile Flutter', 'Freelance'];
  let wi = 0, ci = 0, del = false, paused = false;

  function tick() {
    const word = words[wi];
    if (!del) {
      el.textContent = word.slice(0, ci + 1);
      ci++;
      if (ci === word.length) { del = true; setTimeout(tick, 1600); return; }
    } else {
      el.textContent = word.slice(0, ci - 1);
      ci--;
      if (ci === 0) { del = false; wi = (wi + 1) % words.length; }
    }
    setTimeout(tick, del ? 60 : 90);
  }
  tick();
})();


/* ============================================================
   4. NAVBAR — scroll state + active section
   ============================================================ */
(function () {
  const navbar = document.getElementById('navbar');
  const links  = document.querySelectorAll('[data-nav]');
  const sections = document.querySelectorAll('section');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);

    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 100) current = s.id;
    });
    links.forEach(l => {
      const href = l.getAttribute('href').replace('#', '');
      l.classList.toggle('active', href === current);
    });
  }, { passive: true });
})();


/* ============================================================
   5. MOBILE SIDEBAR
   ============================================================ */
(function () {
  const burger   = document.getElementById('burger');
  const sidebar  = document.getElementById('mobile-sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const closeBtn = document.getElementById('sidebar-close');
  if (!burger || !sidebar) return;

  function open()  { sidebar.classList.add('open'); overlay.classList.add('visible'); burger.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function close() { sidebar.classList.remove('open'); overlay.classList.remove('visible'); burger.classList.remove('open'); document.body.style.overflow = ''; }

  burger.addEventListener('click', () => sidebar.classList.contains('open') ? close() : open());
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
})();


/* ============================================================
   6. INTERSECTION OBSERVER — REVEAL ON SCROLL
   ============================================================ */
(function () {
  const els = document.querySelectorAll('[data-reveal], [data-reveal-delay]');
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay ? parseInt(el.dataset.delay) * 100 : 0;
        setTimeout(() => el.classList.add('visible'), delay);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => obs.observe(el));
})();


/* ============================================================
   7. SMOOTH ANCHOR SCROLL
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});