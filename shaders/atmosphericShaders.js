// Advanced shader materials for atmospheric and impact effects

export const plasmaTrailVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const plasmaTrailFragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 color1;
  uniform vec3 color2;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  // Noise function for plasma turbulence
  float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
  }
  
  void main() {
    // Create plasma effect with noise
    vec3 noisePos = vPosition * 2.0 + vec3(time * 2.0);
    float n = noise(noisePos);
    n += 0.5 * noise(noisePos * 2.0);
    n += 0.25 * noise(noisePos * 4.0);
    n /= 1.75;
    
    // Color gradient based on position and noise
    vec3 plasmaColor = mix(color1, color2, n);
    
    // Fresnel effect for edge glow
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    
    // Pulsating intensity
    float pulse = sin(time * 5.0) * 0.2 + 0.8;
    
    float alpha = (fresnel + n * 0.5) * intensity * pulse;
    
    gl_FragColor = vec4(plasmaColor, alpha);
  }
`;

export const shockwaveVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float time;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    // Ripple effect
    vec3 pos = position;
    float dist = length(pos.xy);
    float wave = sin(dist * 10.0 - time * 15.0) * 0.1;
    pos.z += wave;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const shockwaveFragmentShader = `
  uniform float time;
  uniform float progress;
  uniform vec3 color;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    float dist = length(vPosition.xy);
    
    // Ring pattern
    float ring = abs(sin(dist * 5.0 - time * 10.0));
    ring = pow(ring, 3.0);
    
    // Fade with progress
    float alpha = (1.0 - progress) * ring * 0.8;
    
    // Brighter at the edge
    float edgeGlow = smoothstep(0.8, 1.0, dist);
    alpha += edgeGlow * (1.0 - progress) * 0.5;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export const fireballVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fireballFragmentShader = `
  uniform float time;
  uniform float intensity;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  // 3D noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    // Turbulent fire using layered noise
    vec3 noiseCoord = vPosition * 2.0 + vec3(0.0, time * 2.0, 0.0);
    float noise1 = snoise(noiseCoord);
    float noise2 = snoise(noiseCoord * 2.0 + vec3(time, 0.0, time));
    float noise3 = snoise(noiseCoord * 4.0 - vec3(0.0, time * 3.0, 0.0));
    
    float combinedNoise = noise1 + noise2 * 0.5 + noise3 * 0.25;
    combinedNoise = (combinedNoise + 1.5) / 3.0; // Normalize to 0-1
    
    // Fire color gradient (red -> orange -> yellow -> white)
    vec3 color1 = vec3(0.5, 0.0, 0.0);  // Dark red
    vec3 color2 = vec3(1.0, 0.3, 0.0);  // Orange
    vec3 color3 = vec3(1.0, 0.8, 0.0);  // Yellow
    vec3 color4 = vec3(1.0, 1.0, 0.9);  // Hot white
    
    vec3 fireColor;
    if (combinedNoise < 0.33) {
      fireColor = mix(color1, color2, combinedNoise * 3.0);
    } else if (combinedNoise < 0.66) {
      fireColor = mix(color2, color3, (combinedNoise - 0.33) * 3.0);
    } else {
      fireColor = mix(color3, color4, (combinedNoise - 0.66) * 3.0);
    }
    
    // Add bright core
    float dist = length(vPosition);
    float core = smoothstep(0.7, 0.0, dist);
    fireColor = mix(fireColor, vec3(1.5, 1.5, 1.3), core);
    
    // Pulsating intensity
    float pulse = sin(time * 8.0) * 0.1 + 0.9;
    
    float alpha = (combinedNoise * 0.7 + 0.3) * intensity * pulse;
    
    gl_FragColor = vec4(fireColor, alpha);
  }
`;

export const atmosphericDistortionVertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphericDistortionFragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform sampler2D tDiffuse;
  
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv;
    
    // Heat distortion effect
    float wave1 = sin(uv.y * 20.0 + time * 5.0) * 0.01;
    float wave2 = cos(uv.x * 15.0 + time * 3.0) * 0.01;
    
    uv.x += wave1 * intensity;
    uv.y += wave2 * intensity;
    
    vec4 color = texture2D(tDiffuse, uv);
    
    gl_FragColor = color;
  }
`;
