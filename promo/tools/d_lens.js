// BLADE RAID promo v3 : WebGL lens (threshold bloom / anamorphic streak / radial blur / chromatic aberration / glitch / grade / impact frame)
(() => {
  'use strict';
  const V = window.__V, FW = 1920, FH = 1080;
  const cv = document.createElement('canvas'); cv.width = FW; cv.height = FH;
  const gl = cv.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('no webgl2');
  gl.getExtension('EXT_color_buffer_float'); gl.getExtension('OES_texture_float_linear');
  const VS = `#version 300 es
layout(location=0) in vec2 p; out vec2 uv; void main(){ uv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;
  const HEAD = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + '\n' + src.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n')); return s; };
  const prog = fs => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, HEAD + fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
    return { p, u };
  };
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const mkTex = (w, h, f16) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    if (f16) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const mkFbo = (w, h) => { const t = mkTex(w, h, true), f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('fbo incomplete'); return { t, f, w, h }; };
  const tScene = mkTex(FW, FH, false);
  const LV = []; { let w = FW / 2, h = FH / 2; for (let i = 0; i < 5; i++) { LV.push({ a: mkFbo(w, h), b: mkFbo(w, h), w, h }); w = Math.round(w / 2); h = Math.round(h / 2); } }
  const SK = { a: mkFbo(480, 270), b: mkFbo(480, 270) };

  const P_BRIGHT = prog(`uniform sampler2D t; uniform vec2 px; uniform float thr, knee;
void main(){
  vec3 c = (texture(t, uv + px*vec2(-1.,-1.)).rgb + texture(t, uv + px*vec2(1.,-1.)).rgb + texture(t, uv + px*vec2(-1.,1.)).rgb + texture(t, uv + px*vec2(1.,1.)).rgb) * .25;
  float l = max(c.r, max(c.g, c.b));
  float s = clamp(l - thr + knee, 0., 2.*knee); s = s*s/(4.*knee + 1e-4);
  float k = max(s, l - thr) / max(l, 1e-4);
  o = vec4(c * k, 1.);
}`);
  const P_BLUR = prog(`uniform sampler2D t; uniform vec2 dir;
void main(){
  vec3 c = texture(t, uv).rgb * 0.2270270270;
  c += (texture(t, uv + dir*1.3846153846).rgb + texture(t, uv - dir*1.3846153846).rgb) * 0.3162162162;
  c += (texture(t, uv + dir*3.2307692308).rgb + texture(t, uv - dir*3.2307692308).rgb) * 0.0702702703;
  o = vec4(c, 1.);
}`);
  const P_STREAK = prog(`uniform sampler2D t; uniform vec2 dir; uniform float fall, gain;
void main(){
  vec3 c = texture(t, uv).rgb; float ws = 1.;
  for (int i = 1; i <= 28; i++){ float w = exp(-float(i)*fall); vec2 d = dir*float(i); c += (texture(t, uv+d).rgb + texture(t, uv-d).rgb)*w; ws += 2.*w; }
  o = vec4(c/ws*gain, 1.);
}`);
  const P_FINAL = prog(`uniform sampler2D tS, tB1, tB2, tB3, tB4, tB5, tK;
uniform vec2 res; uniform float time;
uniform float bloom, streak; uniform vec3 streakTint;
uniform float ca, rblur; uniform vec2 center;
uniform float dist; uniform vec2 shake; uniform float roll, zoom;
uniform float glitch;
uniform float expo, contrast, sat, split; uniform vec3 tint, lift;
uniform float vig, grain;
uniform float impact; uniform vec3 impA, impB;
uniform float flash; uniform vec3 flashCol; uniform float fade;
uniform float bars, scan, mirror;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
void main(){
  vec2 u = uv - 0.5;
  float asp = res.x/res.y;
  vec2 q = vec2(u.x*asp, u.y);
  float cs = cos(roll), sn = sin(roll);
  q = vec2(q.x*cs - q.y*sn, q.x*sn + q.y*cs) / zoom;
  q *= 1.0 + dist * dot(q,q);
  u = vec2(q.x/asp, q.y) + shake/res;
  if (glitch > 0.001) {
    float tt = floor(time*30.0);
    float row = floor((u.y+0.5) * 16.0 + tt*3.0);
    float n = h21(vec2(row, tt)), n2 = h21(vec2(row*1.7, tt+3.0));
    u.x += (n - 0.5) * 0.14 * glitch * step(0.5, n2);
    float row2 = floor((u.y+0.5) * 90.0);
    u.x += (h21(vec2(row2, tt+7.0)) - 0.5) * 0.012 * glitch;
  }
  if (mirror > 0.5) u.x = -abs(u.x);
  vec2 c0 = center - 0.5;
  vec2 d = u - c0;
  vec3 col = vec3(0.);
  float jit = h21(uv*res + fract(time)*61.0);
  for (int i = 0; i < 14; i++){
    float t = (float(i) + jit) / 14.0;
    vec2 p = c0 + d * (1.0 - rblur * t);
    vec2 cad = p * (ca / res.x) * (0.5 + 3.0*dot(p,p)) * (1.0 + glitch*3.0);
    col.r += texture(tS, p + cad + 0.5).r;
    col.g += texture(tS, p + 0.5).g;
    col.b += texture(tS, p - cad + 0.5).b;
  }
  col /= 14.0;
  vec2 ub = u + 0.5;
  vec3 bl = (texture(tB1,ub).rgb*0.8 + texture(tB2,ub).rgb*1.0 + texture(tB3,ub).rgb*1.1 + texture(tB4,ub).rgb*1.2 + texture(tB5,ub).rgb*1.3) / 5.4;
  col += bl * bloom;
  col += texture(tK, ub).rgb * streak * streakTint;
  col *= expo;
  vec3 hi = 0.78 + 0.22 * tanh((col - 0.78) / 0.22 * 0.75);
  col = mix(col, hi, step(0.78, col));
  col = (col - 0.5) * contrast + 0.5;
  float l = dot(col, vec3(.2126,.7152,.0722));
  col = mix(vec3(l), col, sat);
  col *= tint;
  col += lift * (1.0 - clamp(l, 0., 1.));
  col += split * (vec3(-0.012, 0.006, 0.03) * (1.0 - clamp(l*1.6, 0., 1.)) + vec3(0.03, 0.012, -0.025) * clamp(l*1.3 - 0.3, 0., 1.));
  if (impact > 0.001) {
    float l2 = dot(col, vec3(.299,.587,.114));
    float t2 = smoothstep(0.30, 0.52, l2);
    col = mix(col, mix(impA, impB, t2), impact);
  }
  float vd = length(vec2(uv.x - 0.5, (uv.y - 0.5) * 0.92)) * 1.28;
  col *= 1.0 - vig * smoothstep(0.42, 1.0, vd);
  if (scan > 0.001) col *= 1.0 - scan * (0.5 + 0.5 * sin(uv.y * res.y * 3.14159));
  col += (h21(uv*res + fract(time*1.37)*113.0) - 0.5) * grain;
  col += flashCol * flash;
  col *= 1.0 - fade;
  if (abs(uv.y - 0.5) > 0.5 - bars) col = vec3(0.);
  o = vec4(clamp(col, 0., 1.), 1.);
}`);

  const draw = (P, dst, w, h) => { gl.bindFramebuffer(gl.FRAMEBUFFER, dst); gl.viewport(0, 0, w, h); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  const bind = (unit, tex, loc) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(loc, unit); };

  V.L0 = {
    bloom: 0.85, thr: 0.60, knee: 0.22, streak: 0.30, streakTint: [0.55, 0.75, 1.0],
    ca: 2.0, rblur: 0, center: [0.5, 0.5], dist: 0.0, shake: [0, 0], roll: 0, zoom: 1.0, glitch: 0,
    expo: 1.03, contrast: 1.08, sat: 1.16, split: 0.6, tint: [1, 1, 1], lift: [0, 0, 0],
    vig: 0.42, grain: 0.045, impact: 0, impA: [0.02, 0.02, 0.05], impB: [1, 1, 1],
    flash: 0, flashCol: [1, 1, 1], fade: 0, bars: 0, scan: 0, mirror: 0, time: 0,
  };
  V.lensRender = (src, L) => {
    gl.bindVertexArray(vao); gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tScene);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    // bright pass -> L1.b , blur -> L1.a
    gl.useProgram(P_BRIGHT.p); bind(0, tScene, P_BRIGHT.u.t); gl.uniform2f(P_BRIGHT.u.px, 1 / FW, 1 / FH); gl.uniform1f(P_BRIGHT.u.thr, L.thr); gl.uniform1f(P_BRIGHT.u.knee, L.knee);
    draw(P_BRIGHT, LV[0].b.f, LV[0].w, LV[0].h);
    gl.useProgram(P_BLUR.p);
    bind(0, LV[0].b.t, P_BLUR.u.t); gl.uniform2f(P_BLUR.u.dir, 1 / LV[0].w, 0); draw(P_BLUR, LV[0].a.f, LV[0].w, LV[0].h);
    bind(0, LV[0].a.t, P_BLUR.u.t); gl.uniform2f(P_BLUR.u.dir, 0, 1 / LV[0].h); draw(P_BLUR, LV[0].b.f, LV[0].w, LV[0].h);
    // 이후 레벨 : 이전 레벨 결과(b) -> H(a) -> V(b)
    for (let i = 1; i < 5; i++) {
      bind(0, LV[i - 1].b.t, P_BLUR.u.t); gl.uniform2f(P_BLUR.u.dir, 1 / LV[i].w, 0); draw(P_BLUR, LV[i].a.f, LV[i].w, LV[i].h);
      bind(0, LV[i].a.t, P_BLUR.u.t); gl.uniform2f(P_BLUR.u.dir, 0, 1 / LV[i].h); draw(P_BLUR, LV[i].b.f, LV[i].w, LV[i].h);
    }
    // streak (L2.b 480x270 기준)
    gl.useProgram(P_STREAK.p);
    bind(0, LV[1].b.t, P_STREAK.u.t); gl.uniform2f(P_STREAK.u.dir, 1.6 / 480, 0); gl.uniform1f(P_STREAK.u.fall, 0.10); gl.uniform1f(P_STREAK.u.gain, 1.6); draw(P_STREAK, SK.a.f, 480, 270);
    bind(0, SK.a.t, P_STREAK.u.t); gl.uniform2f(P_STREAK.u.dir, 4.5 / 480, 0); gl.uniform1f(P_STREAK.u.fall, 0.085); gl.uniform1f(P_STREAK.u.gain, 1.5); draw(P_STREAK, SK.b.f, 480, 270);
    // final
    const P = P_FINAL, u = P.u; gl.useProgram(P.p);
    bind(0, tScene, u.tS); bind(1, LV[0].b.t, u.tB1); bind(2, LV[1].b.t, u.tB2); bind(3, LV[2].b.t, u.tB3); bind(4, LV[3].b.t, u.tB4); bind(5, LV[4].b.t, u.tB5); bind(6, SK.b.t, u.tK);
    gl.uniform2f(u.res, FW, FH); gl.uniform1f(u.time, L.time);
    for (const k of ['bloom', 'streak', 'ca', 'rblur', 'dist', 'roll', 'zoom', 'glitch', 'expo', 'contrast', 'sat', 'split', 'vig', 'grain', 'impact', 'flash', 'fade', 'bars', 'scan', 'mirror']) if (u[k]) gl.uniform1f(u[k], L[k]);
    for (const k of ['streakTint', 'tint', 'lift', 'impA', 'impB', 'flashCol']) if (u[k]) gl.uniform3f(u[k], L[k][0], L[k][1], L[k][2]);
    gl.uniform2f(u.center, L.center[0], 1 - L.center[1]); gl.uniform2f(u.shake, L.shake[0], -L.shake[1]);
    draw(P, null, FW, FH);
    return cv;
  };
  V.glcv = cv; V.gl = gl;
})();
'lens ok';
