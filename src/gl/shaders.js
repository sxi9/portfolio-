// GLSL for the two post passes.
//
//   scene (supersampled, linear)  ->  CELLS pass  ->  one texel per character
//   cell texture + glyph atlas    ->  GLYPH pass  ->  canvas, 1:1 device pixels
//
// The scene uses colour as three semantic channels rather than as colour:
// grey = primary ink, red = "hot" accent, blue = "cool" accent. The cells pass
// turns that into theme colours, so a theme switch never touches a material.

export const FULLSCREEN_VERT = /* glsl */ `
in vec3 position;
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const CELLS_FRAG = /* glsl */ `
precision highp float;
precision highp sampler2D;

uniform sampler2D tScene;
uniform sampler2D tDepth;
uniform vec2 uGrid;        // cols, rows
uniform vec2 uSS;          // supersample factors per cell
uniform float uLevels;     // number of ramp glyphs
uniform vec3 uInk;
uniform vec3 uHot;
uniform vec3 uCool;
uniform float uTime;
uniform float uGlitch;
uniform float uRowOrigin;  // document row of the target's top row (stable hashing)
uniform vec2 uMouse;       // cursor in cells: x, row from top
uniform float uMouseOn;
uniform float uGamma;
uniform float uGain;
uniform float uBlack;
uniform float uDither;
uniform float uInkFloor;
uniform float uEdge;
uniform float uNear;
uniform float uFar;

out vec4 outColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float linDepth(vec2 uv) {
  float z = texture(tDepth, uv).r * 2.0 - 1.0;
  return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy);            // x, row from the bottom
  float rowTop = uGrid.y - 1.0 - cell.y;
  vec2 docCell = vec2(cell.x, rowTop + uRowOrigin);

  // Box-filter the supersampled block that belongs to this character cell.
  // Each tap sits on a texel corner, so bilinear filtering averages 2x2.
  vec2 texel = 1.0 / (uGrid * uSS);
  vec2 base = cell * uSS * texel;
  vec3 col = vec3(0.0);
  for (int y = 0; y < 4; y++) {
    for (int x = 0; x < 2; x++) {
      col += texture(tScene, base + (vec2(float(x), float(y)) * 2.0 + 1.0) * texel).rgb;
    }
  }
  col *= 0.125;

  float mx = max(col.r, max(col.g, col.b));
  float hot = clamp((col.r - max(col.g, col.b)) / (mx + 1e-4) * 1.6, 0.0, 1.0);
  float cool = clamp((col.b - max(col.r, col.g)) / (mx + 1e-4) * 1.6, 0.0, 1.0);
  vec3 ink = mix(uInk, uCool, cool);
  ink = mix(ink, uHot, hot);

  float v = pow(clamp((mx * uGain - uBlack) / (1.0 - uBlack), 0.0, 1.0), uGamma);

  // Cursor "torch": lifts whatever is there and stirs up a little static.
  vec2 mc = vec2(cell.x, rowTop) + 0.5 - uMouse;
  mc.y *= 2.0;
  float torch = uMouseOn * smoothstep(11.0, 0.0, length(mc));
  float staticN = hash21(docCell + floor(uTime * 3.0) * 1.37);
  v = v * (1.0 + torch * 0.6) + torch * torch * step(0.86, staticN) * 0.14;
  v = clamp(v, 0.0, 1.0);

  // Stable per-cell noise keeps large flat areas from banding into stripes.
  float n = hash21(docCell) - 0.5;
  float level = v * (uLevels - 1.0) + n * uDither * step(0.02, v);
  float gi = clamp(floor(level + 0.5), 0.0, uLevels - 1.0);

  // Silhouettes. A cell whose neighbour is clearly *nearer* sits just outside
  // a shape: it gets a line glyph that follows the boundary, in the colour of
  // the shape. Drawing the contour outside keeps every cell of the shape
  // itself free for shading, so thin parts stay solid instead of hollow.
  if (uEdge > 0.0) {
    vec2 cuv = (cell + 0.5) / uGrid;
    vec2 dx = vec2(1.0 / uGrid.x, 0.0);
    vec2 dy = vec2(0.0, 1.0 / uGrid.y);
    float dC = linDepth(cuv);
    float thr = 0.2 + min(dC, 12.0) * 0.02;
    float nL = step(thr, dC - linDepth(cuv - dx));
    float nR = step(thr, dC - linDepth(cuv + dx));
    float nU = step(thr, dC - linDepth(cuv + dy));   // +v is up on screen
    float nD = step(thr, dC - linDepth(cuv - dy));
    if (max(max(nL, nR), max(nU, nD)) > 0.5) {
      float gx = nR - nL;
      float gy = nD - nU;                             // screen space, y down
      float e;
      if (gx != 0.0 && gy != 0.0) e = (gx * gy > 0.0) ? 1.0 : 3.0;  // '/' or '\\'
      else if (gx != 0.0) e = 0.0;                                   // '|'
      else if (gy != 0.0) e = 2.0;                                   // '-'
      else e = (nL + nR > nU + nD) ? 0.0 : 2.0;                      // squeezed between two shapes
      // take the colour from the shape, not from this (mostly empty) cell
      vec2 toward = nL > 0.5 ? -dx : (nR > 0.5 ? dx : (nU > 0.5 ? dy : -dy));
      vec3 nc = texture(tScene, cuv + toward).rgb;
      float nmx = max(nc.r, max(nc.g, nc.b));
      float nhot = clamp((nc.r - max(nc.g, nc.b)) / (nmx + 1e-4) * 1.6, 0.0, 1.0);
      float ncool = clamp((nc.b - max(nc.r, nc.g)) / (nmx + 1e-4) * 1.6, 0.0, 1.0);
      ink = mix(mix(uInk, uCool, ncool), uHot, nhot);
      float nv = pow(clamp((nmx * uGain - uBlack) / (1.0 - uBlack), 0.0, 1.0), uGamma);
      gi = uLevels + e;
      v = clamp(nv * 0.8 + 0.3, 0.0, 1.0) * uEdge;
    }
  }

  // Decode / glitch burst: a fraction of the cells show random glyphs.
  if (uGlitch > 0.0) {
    float r = hash21(docCell * 1.31 + floor(uTime * 22.0));
    if (r < uGlitch) {
      gi = floor(hash21(docCell * 2.17 + floor(uTime * 22.0) * 0.61) * (uLevels - 1.0)) + 1.0;
      v = 0.25 + 0.75 * hash21(docCell * 0.77 + uTime);
      ink = mix(uInk, uCool, step(0.8, r / max(uGlitch, 1e-3)));
    }
  }

  float b = mix(uInkFloor, 1.0, v) * step(0.5, gi);
  outColor = vec4(ink * b, gi / 255.0);
}
`;

export const GLYPH_FRAG = /* glsl */ `
precision highp float;
precision highp sampler2D;

uniform sampler2D tCells;
uniform sampler2D tAtlas;
uniform vec2 uCanvasPx;
uniform vec2 uCellPx;
uniform vec2 uGrid;
uniform float uSubY;       // canvas top, in device px, relative to the cell grid
uniform vec3 uBg;
uniform float uCellGlow;
uniform float uFade;

out vec4 outColor;

void main() {
  ivec2 px = ivec2(int(gl_FragCoord.x), int(uCanvasPx.y) - 1 - int(gl_FragCoord.y));
  px.y += int(uSubY);
  ivec2 cs = ivec2(uCellPx);
  ivec2 cell = px / cs;
  ivec2 inCell = px - cell * cs;
  ivec2 grid = ivec2(uGrid);
  cell = min(cell, grid - 1);

  vec4 c = texelFetch(tCells, ivec2(cell.x, grid.y - 1 - cell.y), 0);
  int gi = int(c.a * 255.0 + 0.5);
  float m = texelFetch(tAtlas, ivec2(gi * cs.x + inCell.x, inCell.y), 0).r;

  vec3 col = uBg + c.rgb * (m + uCellGlow) * uFade;
  outColor = vec4(col, 1.0);
}
`;
