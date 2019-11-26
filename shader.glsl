#define MOD3 vec3(.16532, .17369, .15787)
#define MOD2 vec2(.16632, .17369)

precision highp float;
uniform float t;
uniform float xOffset;
uniform float yOffset;
uniform float zoom;

// palette
uniform sampler2D palette;

// previous frame (?)
uniform sampler2D lastFrame;

const float PI = 3.14159265359;
float minPositiveFloat = 0.00006;

float satan(float a, float b)
{
    if (a==b && a==0.0)
        return 1.0;
    return atan(a, b);
}

float sclamp(float a, float b, float c)
{
    return clamp(a, min(b, c), max(b, c));
}

float dot2(vec3 v)
{
    return dot(v, v);
}
float dot2(vec2 v) { return dot(v, v); }

float hash12(vec2 p)
{
    p  = fract(p * MOD2);
    p += dot(p.xy, p.yx+19.19);
    return fract(p.x * p.y);
}

float Hash(vec3 p)
{
    p  = fract(p * MOD3);
    p += dot(p.xyz, p.yzx + 19.19);
    return fract(p.x * p.y * p.z);
}

float Noise3d(vec3 p)
{
    vec2 add = vec2(1.0, 0.0);
    p *= 10.0;
    float h = 0.0;
    float a = .3;
    for (int n = 0; n < 4; n++)
    {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f *= f * (3.0-2.0*f);

        h += mix(
        mix(mix(Hash(i), Hash(i + add.xyy), f.x),
        mix(Hash(i + add.yxy), Hash(i + add.xxy), f.x),
        f.y),
        mix(mix(Hash(i + add.yyx), Hash(i + add.xyx), f.x),
        mix(Hash(i + add.yxx), Hash(i + add.xxx), f.x),
        f.y),
        f.z)*a;
        a*=.5;
        p += p;
    }
    return h;
}

float pModPolar(vec2 p, float repetitions) {
    float angle = 2./repetitions*PI;
    float a = satan(p.y, p.x) + angle/2.;
    float r = length(p);
    float c = floor(a/angle);
    a = mod(a, angle) - angle/2.;
    p = vec2(cos(a), sin(a))*r;
    if (abs(c) >= (repetitions/2.)) c = abs(c);
    return c;
}

float fOpUnionRound(float a, float b, float r) {
    vec2 u = max(vec2(r - a, r - b), vec2(0));
    return max(r, min (a, b)) - length(u);
}

float smoothAdd(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5*(d2-d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k*h*(1.0-h);
}

float pyramid(vec3 p, float h) {
    vec3 q=abs(p);
    return max(-p.y, (q.x*1.5+q.y+q.z*1.5-h)/3.0);
}

//------------------------------------------------------------------ NOISE
//AshimaOptim https://www.shadertoy.com/view/Xd3GRf
vec4 permute(vec4 x){ return mod(x*x*34.0+x, 289.); }
float snoise(vec3 v){
    const vec2  C = vec2(0.166666667, 0.33333333333);
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.);
    vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    vec3 ns = 0.142857142857 * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = floor(j - 7.0 * x_) *ns.x + ns.yyyy;
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
    vec4 norm = inversesqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m * m;
    return .5 + 12.0 * dot(m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float sR(float x, float y)
{
    return texture2D(lastFrame, vec2(x,y)).r;
}

float sG(float x, float y)
{
    return texture2D(lastFrame, vec2(x,y)).g;
}

float sB(float x, float y)
{
    return texture2D(lastFrame, vec2(x,y)).b;
}

float minp(float a)
{
    return max(minPositiveFloat, a);
}

float ssmoothstep(float a, float b, float c)
{
    return smoothstep(min(a, b), max(a, b)+minPositiveFloat, sclamp(c, min(a,b), max(a,b) + minPositiveFloat));
}

float sdBox(in vec3 p, in float b)
{
    vec3 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

float sdSphere(in vec3 p, in float r)
{
    return length(p)-r;
}

float sdRoundBox(in vec3 p, in vec3 b, in float r)
{
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0)-r;
}

float sdTorus(in vec3 p, in vec2 r)
{
    vec2 q = vec2(length(p.xz)-r.x, p.y);
    return length(q)-r.y;
}

float sdCappedTorus(vec3 p, vec2 sc, float ra, float rb)
{
    p.x = abs(p.x);
    float k = (sc.y*p.x>sc.x*p.y) ? dot(p.xy, sc) : length(p.xy);
    return sqrt(dot(p, p) + ra*ra - 2.0*ra*k) - rb;
}

float sdLink(vec3 p, float le, float r1, float r2)
{
    vec3 q = vec3(p.x, max(abs(p.y)-le, 0.0), p.z);
    return length(vec2(length(q.xy)-r1, q.z)) - r2;
}

float sdCylinder(vec3 p, vec3 c)
{
    return length(p.xz-c.xy)-c.z;
}

float sdCone(vec3 p, vec2 c)
{
    // c is the sin/cos of the angle
    float q = length(p.xy);
    return dot(c, vec2(q, p.z));
}

float sdPlane(vec3 p, vec4 n)
{
    // n must be normalized
    return dot(p, n.xyz) + n.w;
}

float sdHexPrism(vec3 p, vec2 h)
{
    const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
    p = abs(p);
    p.xy -= 2.0*min(dot(k.xy, p.xy), 0.0)*k.xy;
    vec2 d = vec2(
    length(p.xy-vec2(clamp(p.x, -k.z*h.x, k.z*h.x), h.x))*sign(p.y-h.x),
    p.z-h.y);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdTriPrism(vec3 p, vec2 h)
{
    vec3 q = abs(p);
    return max(q.z-h.y, max(q.x*0.866025+p.y*0.5, -p.y)-h.x*0.5);
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r)
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba)/dot(ba, ba), 0.0, 1.0);
    return length(pa - ba*h) - r;
}

float sdVerticalCapsule(vec3 p, float h, float r)
{
    p.y -= clamp(p.y, 0.0, h);
    return length(p) - r;
}

float sdCappedCylinder(vec3 p, float h, float r)
{
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(h, r);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdRoundedCylinder(vec3 p, float ra, float rb, float h)
{
    vec2 d = vec2(length(p.xz)-2.0*ra+rb, abs(p.y) - h);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rb;
}

float sdCappedCone(vec3 p, float h, float r1, float r2)
{
    vec2 q = vec2(length(p.xz), p.y);

    vec2 k1 = vec2(r2, h);
    vec2 k2 = vec2(r2-r1, 2.0*h);
    vec2 ca = vec2(q.x-min(q.x, (q.y<0.0)?r1:r2), abs(q.y)-h);
    vec2 cb = q - k1 + k2*clamp(dot(k1-q, k2)/dot2(k2), 0.0, 1.0);
    float s = (cb.x<0.0 && ca.y<0.0) ? -1.0 : 1.0;
    return s*sqrt(min(dot2(ca), dot2(cb)));
}

float sdSolidAngle(vec3 p, vec2 c, float ra)
{
    // c is the sin/cos of the angle
    vec2 q = vec2(length(p.xz), p.y);
    float l = length(q) - ra;
    float m = length(q - c*clamp(dot(q, c), 0.0, ra));
    return max(l, m*sign(c.y*q.x-c.x*q.y));
}

float sdRoundCone(vec3 p, float r1, float r2, float h)
{
    vec2 q = vec2(length(p.xz), p.y);

    float b = (r1-r2)/h;
    float a = sqrt(1.0-b*b);
    float k = dot(q, vec2(-b, a));

    if (k < 0.0) return length(q) - r1;
    if (k > a*h) return length(q-vec2(0.0, h)) - r2;

    return dot(q, vec2(a, b)) - r1;
}

float sdEllipsoid(vec3 p, vec3 r)
{
    float k0 = length(p/r);
    float k1 = length(p/(r*r));
    return k0*(k0-1.0)/k1;
}

float sdOctahedron(vec3 p, float s)
{
    p = abs(p);
    return (p.x+p.y+p.z-s)*0.57735027;
}

float sdAxisAlignedRect(vec2 uv, vec2 tl, vec2 br)
{
    vec2 d = max(tl - uv, uv - br);
    return length(max(vec2(0.0), d)) + min(0.0, max(d.x, d.y));
}

mat2 rot2D(float r)
{
    float c = cos(r), s = sin(r);
    return mat2(c, s, -s, c);
}

float sdLineSegment(vec2 uv, vec2 a, vec2 b, float lineWidth)
{
    vec2 rectDimensions = b - a;
    float angle = satan(rectDimensions.x, rectDimensions.y);
    mat2 rotMat = rot2D(-angle);
    a *= rotMat;
    b *= rotMat;
    float halfLineWidth = lineWidth / 2.;
    a -= halfLineWidth;
    b += halfLineWidth;
    return sdAxisAlignedRect(uv * rotMat, a, b);
}

float rand(vec2 co)
{
  // This one-liner can be found in many places, including:
  // http://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
  // I can't find any explanation for it, but experimentally it does seem to
  // produce approximately uniformly distributed values in the interval [0,1].
  float r = fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);

  // Make sure that we don't return 0.0
  if(r == 0.0)
    return 0.000000000001;
  else
    return r;
}

float gaussrand(vec2 co, vec3 offsets, float mean, float stddev)
{
  // Box-Muller method for sampling from the normal distribution
  // http://en.wikipedia.org/wiki/Normal_distribution#Generating_values_from_normal_distribution
  // This method requires 2 uniform random inputs and produces 2
  // Gaussian random outputs.  We'll take a 3rd random variable and use it to
  // switch between the two outputs.

  float U, V, R, Z;
  // Add in the CPU-supplied random offsets to generate the 3 random values that
  // we'll use.
  U = rand(co + vec2(offsets.x, offsets.x));
  V = rand(co + vec2(offsets.y, offsets.y));
  R = rand(co + vec2(offsets.z, offsets.z));
  // Switch between the two random outputs.
  if(R < 0.5)
    Z = sqrt(-2.0 * log(U)) * sin(2.0 * PI * V);
  else
    Z = sqrt(-2.0 * log(U)) * cos(2.0 * PI * V);

  // Apply the stddev and mean.
  Z = Z * stddev + mean;

  // Return it as a vec4, to be added to the input ("true") color.
  return Z;
}

void main() {
    float x = (zoom * (gl_FragCoord[0]))+xOffset;
    float y = (zoom * (gl_FragCoord[1]))+yOffset;

    gl_FragColor = texture2D(palette, vec2(<<<showFunc>>>, 0.5));
    //gl_FragColor = vec4(sR() + 0.01, 0, 0, 1.0);
    //gl_FragColor.r += 1.0;
    //float r = sR()/256.0;
    //gl_FragColor = vec4(r+0.001, 0, 0, 1);
    //gl_FragColor.a = 1.0;
}