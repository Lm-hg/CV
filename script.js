/* ============================================================
   1. WEBGL SHADER BACKGROUND
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

    // Smooth noise
    float hash(vec2 p) {
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1,0)), f.x),
        mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
        f.y
      );
    }
    float fbm(vec2 p) {
      float v = 0.0; float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = p * 2.1 + vec2(1.3, 2.7);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;
      uv.x *= u_res.x / u_res.y;

      float t = u_time * 0.12;

      // Animated FBM nebula
      vec2 q = vec2(fbm(uv + t * 0.3), fbm(uv + vec2(1.0, 1.2) + t * 0.2));
      vec2 r = vec2(fbm(uv + 4.0 * q + vec2(1.7, 9.2) + t * 0.15),
                    fbm(uv + 4.0 * q + vec2(8.3, 2.8) + t * 0.10));
      float f = fbm(uv + 4.0 * r);

      // Color palette: deep indigo → purple → dark teal
      vec3 col = mix(vec3(0.02, 0.02, 0.08), vec3(0.18, 0.10, 0.40), clamp(f * 2.0, 0.0, 1.0));
      col = mix(col, vec3(0.04, 0.22, 0.30), clamp(length(q), 0.0, 1.0));
      col = mix(col, vec3(0.39, 0.40, 0.90), clamp(f * f * 4.0, 0.0, 1.0));

      // Vignette
      vec2 vctr = uv - vec2(u_res.x / u_res.y * 0.5, 0.5);
      float vig = 1.0 - smoothstep(0.4, 1.2, length(vctr));
      col *= vig * 0.8 + 0.1;

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