import { DEFAULT_SHADER, PLASMA_SHADER } from './presets.js';

const $ = id => document.getElementById(id);
const source = $('source'), status = $('status'), errors = $('errors'), canvas = $('canvas');
const STORAGE_KEY = 'voxen-studio:shaders:v1';
const builtin = { 'Cosmic Vortex': DEFAULT_SHADER, 'Plasma': PLASMA_SHADER };
let saved;
try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); if (!saved || Array.isArray(saved) || typeof saved !== 'object') saved = {}; }
catch { saved = {}; }
let name = 'Cosmic Vortex';
source.value = DEFAULT_SHADER;
function options() {
  const all = { ...builtin, ...saved };
  $('presets').replaceChildren(...Object.keys(all).map(key => {
    const opt = document.createElement('option'); opt.value = key; opt.textContent = key; return opt;
  }));
  $('presets').value = name;
}
function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch (error) { alert('Local storage unavailable: ' + error.message); } }
options();
$('presets').onchange = event => { name = event.target.value; source.value = saved[name] ?? builtin[name]; compile(); };
$('new').onclick = () => { name = 'Untitled'; source.value = DEFAULT_SHADER; options(); compile(); };
$('save').onclick = () => { const choice = prompt('Shader name', name); if (!choice?.trim()) return; name = choice.trim(); saved[name] = source.value; persist(); options(); };
$('export').onclick = () => {
  const payload = JSON.stringify({ format:'voxen-studio/v1', name, target:'fragment-webgl2', source:source.value }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], {type:'application/json'}));
  const link = document.createElement('a'); link.href = url; link.download = name.toLowerCase().replace(/[^a-z0-9-]+/g,'-') + '.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('import').onclick = () => $('file').click();
$('file').onchange = async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    const text = await file.text();
    const data = file.name.endsWith('.json') ? JSON.parse(text) : { name:file.name.replace(/\.[^.]+$/,''), source:text };
    if (typeof data.source !== 'string') throw Error('Missing shader source');
    name = String(data.name || file.name); source.value = data.source; compile(); options();
  } catch (error) { errors.textContent = String(error); }
  event.target.value = '';
};

const gl = canvas.getContext('webgl2', {antialias:false, alpha:false});
let program = null, positionBuffer = null, uniforms = {}, positionLocation = -1;
let elapsed = 0, previous = performance.now(), paused = false, speed = 1;
$('speed').oninput = event => { speed = Number(event.target.value); $('speed-value').textContent = speed.toFixed(1) + '×'; };
$('pause').onclick = () => { paused = !paused; $('pause').textContent = paused ? 'Resume' : 'Pause'; };
$('reset').onclick = () => { elapsed = 0; };
if (!gl) { status.textContent = 'WebGL2 unsupported'; errors.textContent = 'This browser does not support WebGL2.'; }
else {
  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
}
function makeShader(type, code) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, code);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown GLSL compilation error';
    gl.deleteShader(shader); throw Error(message);
  }
  return shader;
}
function compile() {
  if (!gl) return;
  let vertex, fragment, candidate;
  try {
    const content = source.value.replace(/^\s*#version\s+300\s+es\s*\n/, '');
    vertex = makeShader(gl.VERTEX_SHADER, '#version 300 es\nin vec2 aPosition; void main(){gl_Position=vec4(aPosition,0.,1.);}');
    fragment = makeShader(gl.FRAGMENT_SHADER, '#version 300 es\n' + content);
    candidate = gl.createProgram(); gl.attachShader(candidate, vertex); gl.attachShader(candidate, fragment); gl.linkProgram(candidate);
    if (!gl.getProgramParameter(candidate, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(candidate) || 'Link failed');
    if (program) gl.deleteProgram(program);
    program = candidate; candidate = null;
    positionLocation = gl.getAttribLocation(program, 'aPosition');
    uniforms = { res:gl.getUniformLocation(program,'iResolution'), time:gl.getUniformLocation(program,'iTime') };
    errors.textContent = ''; status.textContent = 'Compiled ✓';
  } catch (error) { errors.textContent = error.message; status.textContent = 'Compilation failed'; }
  finally { if (candidate) gl.deleteProgram(candidate); if (vertex) gl.deleteShader(vertex); if (fragment) gl.deleteShader(fragment); }
}
let debounce;
source.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(compile, 230); });
source.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return; e.preventDefault();
  const at = source.selectionStart; source.setRangeText('  ', at, source.selectionEnd, 'end');
  source.dispatchEvent(new Event('input'));
});
compile();
function frame(now) {
  if (!gl) return;
  const delta = Math.min((now - previous) / 1000, .1); previous = now;
  if (!paused) elapsed += delta * speed;
  const scale = Math.min(devicePixelRatio || 1, 2);
  const width = Math.max(2, Math.round(canvas.clientWidth * scale));
  const height = Math.max(2, Math.round(canvas.clientHeight * scale));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  gl.viewport(0, 0, width, height);
  if (program) {
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    if (positionLocation >= 0) { gl.enableVertexAttribArray(positionLocation); gl.vertexAttribPointer(positionLocation,2,gl.FLOAT,false,0,0); }
    if (uniforms.res) gl.uniform2f(uniforms.res,width,height);
    if (uniforms.time) gl.uniform1f(uniforms.time,elapsed);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
