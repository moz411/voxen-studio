export const DEFAULT_SHADER = `precision highp float;
uniform vec2 iResolution;
uniform float iTime;
out vec4 fragColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec3 palette(float t) {
  return .5 + .5*cos(6.2831853*(vec3(.05,.28,.55)+t));
}
void main() {
  vec2 uv=(gl_FragCoord.xy-.5*iResolution.xy)/iResolution.y;
  float t=iTime*.45, r=length(uv), a=atan(uv.y,uv.x);
  float depth=1./(r+.12), twist=a+t*.48+depth*1.8;
  float spiral=sin(twist*7.-log(r+.08)*22.+t*3.);
  float arms=pow(.5+.5*spiral,5.);
  float filaments=pow(max(0.,sin(twist*17.+depth*5.-t*2.2)),12.);
  float rings=pow(max(0.,sin(depth*9.-t*4.)),8.);
  float nebula=sin(uv.x*12.+sin(uv.y*9.+t)*2.)*
               sin(uv.y*11.-cos(uv.x*8.-t)*2.);
  nebula=.5+.5*nebula;
  float fade=exp(-r*2.6);
  vec3 col=vec3(.008,.006,.035);
  col+=palette(twist*.12+depth*.035+t*.08)*arms*fade*1.15;
  col+=vec3(.20,.75,1.)*filaments*fade*.55;
  col+=vec3(.85,.25,1.)*rings*fade*.38;
  col+=vec3(.12,.05,.32)*nebula*fade*.5;
  float core=exp(-r*17.)*(.85+.15*sin(t*5.));
  col+=vec3(.6,.85,1.)*core*1.8;
  vec2 pos=uv*45., cell=floor(pos), local=fract(pos)-.5;
  float rnd=hash21(cell);
  vec2 offset=vec2(hash21(cell+13.7),hash21(cell+27.3))-.5;
  float starDist=length(local-offset*.7);
  float stars=(1.-smoothstep(.005,.055,starDist))*step(.975,rnd);
  col+=stars*(.7+.3*sin(t*4.+rnd*30.))*vec3(.65,.8,1.);
  col+=vec3(.06,.025,.12)*exp(-r*4.);
  col*=1.-smoothstep(.35,1.4,r);
  col=col/(1.+col);
  col=pow(col,vec3(.85));
  fragColor=vec4(col,1.);
}`;
export const PLASMA_SHADER = `precision highp float;
uniform vec2 iResolution;
uniform float iTime;
out vec4 fragColor;
void main() {
  vec2 uv=gl_FragCoord.xy/iResolution.xy, p=uv*7.;
  float t=iTime*.5;
  float v=sin(p.x+t)+sin(p.y+t*.8);
  v+=sin((p.x+p.y+v)*1.5-t);
  v+=sin(length(p-3.5)*2.-t*2.);
  vec3 c=.5+.5*cos(v+vec3(0.,2.,4.));
  fragColor=vec4(c,1.);
}`;
