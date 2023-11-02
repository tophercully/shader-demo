#ifdef GL_ES
precision highp float;
#endif

// grab texcoords from vert shader
varying vec2 vTexCoord;

//textures and uniforms from p5
uniform sampler2D p;
uniform sampler2D g;
uniform sampler2D c;
uniform vec2 u_resolution;
uniform float seed;
uniform vec3 bgc;
uniform vec3 frameCol;
uniform float marg;
uniform float pxSize;
uniform bool firstPass;
uniform bool lastPass;

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

vec3 adjustContrast(vec3 color, float value) {
  return 0.5 + (1.0 + value) * (color - 0.5);
}
vec3 adjustExposure(vec3 color, float value) {
  return (1.0 + value) * color;
}
vec3 adjustSaturation(vec3 color, float value) {
  const vec3 luminosityFactor = vec3(0.2126, 0.7152, 0.0722);
  vec3 grayscale = vec3(dot(color, luminosityFactor));

  return mix(grayscale, color, 1.0 + value);
}
vec3 adjustBrightness(vec3 color, float value) {
  return color + value;
}

mat2 rotate(float angle){
    return mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
}

float noise( in vec2 p )
{
    vec2 id = floor( p );
    vec2 f = fract( p );
	
	vec2 u = f*f*(3.0-2.0*f);

    return mix(mix(random(id + vec2(0.0,0.0)), 
                   random(id + vec2(1.0,0.0)), u.x),
               mix(random(id + vec2(0.0,1.0)), 
                   random(id + vec2(1.0,1.0)), u.x), 
               u.y);
}

float fbm( vec2 p )
{
    float f = 0.0;
    float gat = 0.0;
    
    for (float octave = 0.; octave < 6.; ++octave)
    {
        float la = pow(2.0, octave);
        float ga = pow(0.5, octave + 1.);
        f += ga*noise( la * p ); 
        gat += ga;
    }
    
    f = f/gat;
    
    return f;
}

float noise_fbm(vec2 p)
{
    float h = fbm(0.09 + p + fbm(0.065 + 2.0 * p - 5.0 * fbm(4.0 * p)));  
    return h; 
}

//inspired by jorgemaog on shadertoy https://www.shadertoy.com/view/WslcR2
float outline(vec2 p, float eps)
{
    float f = noise_fbm(p - vec2(0.0, 0.0));
    
    float ft = noise_fbm(p - vec2(0.0, eps));
    float fl = noise_fbm(p - vec2(eps, 0.0));
    float fb = noise_fbm(p + vec2(0.0, eps));
    float fr = noise_fbm(p + vec2(eps, 0.0));
    
    float gg = clamp(abs(4. * f - ft - fr - fl - fb), 0., 1.);
    
    return gg;
}


void main() {
  vec2 uv = vTexCoord*u_resolution;
  vec2 st = vTexCoord;
  vec2 stDebug = vTexCoord;
  vec2 stB = vTexCoord;
  vec2 stPaper = vTexCoord;

  //flip the upside down image
  st.y = 1.0 - st.y;
  stB.y = 1.0 - stB.y;
  stDebug.y = 1.0 - stDebug.y;
  
  if(lastPass == true) {
    //shrink stB so there is margin
    stB.x = map(st.x, 0.0, 1.0, -marg, 1.0+marg);
    stB.y = map(st.y, 0.0, 1.0, -(marg*0.8), 1.0+(marg*0.8));
  }
  
  
  //pull in our main textures
  vec4 texC = texture2D(c, st);
  vec4 texG = texture2D(g, st);
  vec4 texP = texture2D(p, st);
  vec4 debugP = texture2D(p, stDebug);
  
  //map luminance as a y value on our gradient
  vec2 lum = vec2(0.5, texP.r);
  //pick the color off of g based on luminance
  vec4 colVal = texture2D(g, lum);

  //initialize color
  vec3 color = vec3(0.0);
  
  color = texP.rgb;

  

  //Draw margin, use 0 and 1 since we shrunk stB
  if(stB.x <= 0.0 || stB.x >= 1.0 || stB.y <= 0.0 || stB.y >= 1.0) {
    color = bgc;
  }

  if(lastPass == true) {
    if(texP.r > 0.5) {
      if(texC.r < 1.0) {
        color = adjustSaturation(color, 0.5);
      }
    } 

    //color noise
    float noiseGray = random(st.xy)*0.1;
    color += noiseGray;
  }


  //default+debug
  color = debugP.rgb;

  gl_FragColor = vec4(color, 1.0);
}
