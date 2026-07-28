/**
 * VİZUAL YOXLAMA ALƏTİ
 *
 * Gameplay səhnəsini Node-da headless render edir və PNG yazır.
 *
 * Səbəb: web preview brauzeri frame kompozisiya etmədiyi üçün Skia-nın
 * nə çəkdiyini orada görmək mümkün deyil. Bu skript eyni həndəsə və
 * `src/config/visuals.ts`-dəki EYNİ rəngləri istifadə edir — beləliklə
 * render aləti ilə tətbiqin görünüşü ayrılmır.
 *
 *   npm run render
 *
 * Nəticə: renders/*.png
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { CAMERA } from '../src/config/gameplay';
import { FACE_TINT, FILM, PRODUCT, ROLL, SHADOW, TABLE } from '../src/config/visuals';
import type { ShadowLayer } from '../src/config/visuals';
import { PRODUCTS } from '../src/data/products';
import type { ZoneId } from '../src/types/game';
import { computeFilmSheet, filmOpacity, filmTipHalfWidth, wrinklePaths } from '../src/utils/film';
import {
  applyTransform,
  faceUVToWorld,
  fitToRect,
  litEdgesPath,
  polygonToSvgPath,
  project,
  projectBox,
  roundedPolygonPath,
} from '../src/utils/projection';
import type { Point, Polygon } from '../src/utils/projection';

const require = createRequire(import.meta.url);
const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit.js');
const CK = await CanvasKitInit({});

const W = 472;
const H = 496;
const PRODUCT_AREA_RATIO = 0.74;

const col = (c: string) => CK.parseColorString(c);

/**
 * DİQQƏT: CanvasKit-də `setColor()` alfanı da təyin edir və əvvəlki
 * `setAlphaf()` çağırışını sıfırlayır. Buna görə şəffaflıq HƏMİŞƏ rəngdən
 * SONRA verilməlidir.
 */
function newPaint() {
  const p = new CK.Paint();
  p.setAntiAlias(true);
  return p;
}

function gradient(from: Point, to: Point, stops: readonly string[]) {
  return CK.Shader.MakeLinearGradient(
    [from.x, from.y],
    [to.x, to.y],
    stops.map(col),
    stops.map((_, i) => i / (stops.length - 1)),
    CK.TileMode.Clamp,
  );
}

type Canvas = ReturnType<ReturnType<typeof CK.MakeSurface>['getCanvas']>;

function fillPath(
  canvas: Canvas,
  d: string,
  o: { color?: string; shader?: unknown; opacity?: number },
) {
  const path = CK.Path.MakeFromSVGString(d);
  if (!path) return;
  const p = newPaint();
  p.setStyle(CK.PaintStyle.Fill);
  if (o.shader) p.setShader(o.shader as never);
  if (o.color) p.setColor(col(o.color));
  if (o.opacity !== undefined) p.setAlphaf(o.opacity);
  canvas.drawPath(path, p);
  p.delete();
  path.delete();
}

function strokePath(canvas: Canvas, d: string, color: string, width: number, opacity: number) {
  const path = CK.Path.MakeFromSVGString(d);
  if (!path) return;
  const p = newPaint();
  p.setStyle(CK.PaintStyle.Stroke);
  p.setStrokeWidth(width);
  p.setColor(col(color));
  p.setAlphaf(opacity);
  canvas.drawPath(path, p);
  p.delete();
  path.delete();
}

// ── Səhnə həndəsəsi (useSceneGeometry ilə eyni) ───────────────
const shape = PRODUCTS['phone-box'].shape;
const size = { width: shape.width, depth: shape.depth, height: shape.height };
const projected = projectBox(size, CAMERA.angleDeg, CAMERA.azimuthDeg);
const transform = fitToRect(
  projected.visibleFaces.map((z) => projected.faces[z]),
  { x: 0, y: H * (1 - PRODUCT_AREA_RATIO) * 0.5, width: W, height: H * PRODUCT_AREA_RATIO },
  24,
);
const screenFaces = Object.fromEntries(
  (Object.keys(projected.faces) as ZoneId[]).map((z) => [
    z,
    applyTransform(projected.faces[z], transform),
  ]),
) as Record<ZoneId, Polygon>;

const bx = screenFaces.bottom.map((p) => p.x);
const by = screenFaces.bottom.map((p) => p.y);
const footprint = {
  x: Math.min(...bx) - (Math.max(...bx) - Math.min(...bx)) * 0.06,
  y: Math.min(...by) + (Math.max(...by) - Math.min(...by)) * 0.25,
  width: (Math.max(...bx) - Math.min(...bx)) * 1.12,
  height: (Math.max(...by) - Math.min(...by)) * 0.9,
};

const rollWidth = Math.max(W * 0.075, 22);
const rollHeight = Math.max(H * 0.24, 68);
const anchor = { x: rollWidth + 4, y: H * 0.8 };
const anchorHalfWidth = rollHeight * 0.42;

const toScreen = (z: ZoneId, u: number, v: number) =>
  applyTransform(
    [project(faceUVToWorld(z, size, u, v), CAMERA.angleDeg, CAMERA.azimuthDeg)],
    transform,
  )[0];

const quadPts = (z: ZoneId, [u0, v0, u1, v1]: readonly [number, number, number, number]) => [
  toScreen(z, u0, v0),
  toScreen(z, u1, v0),
  toScreen(z, u1, v1),
  toScreen(z, u0, v1),
];

type FilmState = { tip: Point | null; tension: number };

function renderScene(state: FilmState): Uint8Array {
  const surface = CK.MakeSurface(W, H)!;
  const canvas = surface.getCanvas();

  // Masa
  {
    const p = newPaint();
    p.setShader(gradient({ x: 0, y: 0 }, { x: 0, y: H }, [TABLE.gradientFrom, TABLE.gradientTo]));
    canvas.drawRect(CK.XYWHRect(0, 0, W, H), p);
    p.delete();
  }
  {
    const p = newPaint();
    p.setAlphaf(TABLE.vignetteOpacity);
    p.setShader(
      CK.Shader.MakeRadialGradient(
        [W / 2, H / 2],
        Math.max(W, H) * 0.6,
        [col('#00000000'), col(TABLE.vignetteColor)],
        [0, 1],
        CK.TileMode.Clamp,
      ),
    );
    canvas.drawRect(CK.XYWHRect(0, 0, W, H), p);
    p.delete();
  }
  {
    const p = newPaint();
    p.setAlphaf(TABLE.lightPoolOpacity);
    p.setShader(
      CK.Shader.MakeRadialGradient(
        [W / 2, H * TABLE.lightPoolCenterY],
        Math.max(W, H) * TABLE.lightPoolRadius,
        [col(TABLE.lightPoolColor), col('#FFFFFF00')],
        [0, 1],
        CK.TileMode.Clamp,
      ),
    );
    canvas.drawRect(CK.XYWHRect(0, 0, W, H), p);
    p.delete();
  }

  // Kölgə — geniş ambient + dar təmas
  for (const cfg of [SHADOW.ambient, SHADOW.contact] as ShadowLayer[]) {
    const p = newPaint();
    p.setColor(col(SHADOW.color));
    p.setAlphaf(cfg.opacity);
    p.setMaskFilter(CK.MaskFilter.MakeBlur(CK.BlurStyle.Normal, cfg.blur / 2, true));
    canvas.drawOval(
      CK.XYWHRect(
        footprint.x + (footprint.width * (1 - cfg.widthScale)) / 2,
        footprint.y +
          footprint.height * cfg.offsetYRatio -
          (footprint.height * cfg.heightScale) / 2,
        footprint.width * cfg.widthScale,
        footprint.height * cfg.heightScale,
      ),
      p,
    );
    p.delete();
  }

  // Qutu
  for (const zone of projected.visibleFaces) {
    const s = screenFaces[zone];
    const d = roundedPolygonPath(s, PRODUCT.cornerRadius);
    fillPath(canvas, d, { shader: gradient(s[3], s[1], FACE_TINT[zone]) });

    if (zone !== 'top' && zone !== 'bottom') {
      // Ambient occlusion
      fillPath(canvas, d, {
        shader: gradient(s[3], s[0], ['#00000000', PRODUCT.aoColor]),
        opacity: PRODUCT.aoOpacity,
      });
      // Qapaq tikişi
      const [bl, br, tr, tl] = s;
      const r = PRODUCT.seamRatio;
      strokePath(
        canvas,
        `M${tl.x + (bl.x - tl.x) * r},${tl.y + (bl.y - tl.y) * r} L${tr.x + (br.x - tr.x) * r},${tr.y + (br.y - tr.y) * r}`,
        PRODUCT.seamColor,
        1,
        PRODUCT.seamOpacity,
      );
    }

    strokePath(canvas, d, PRODUCT.edgeStroke, PRODUCT.edgeStrokeWidth, PRODUCT.edgeStrokeOpacity);
  }
  fillPath(canvas, roundedPolygonPath(quadPts('top', PRODUCT.specularUV), 10), {
    color: PRODUCT.specularColor,
    opacity: PRODUCT.specularOpacity,
  });
  const label = roundedPolygonPath(quadPts('top', PRODUCT.labelUV), 4);
  fillPath(canvas, label, { color: PRODUCT.labelFill, opacity: PRODUCT.labelFillOpacity });
  strokePath(canvas, label, PRODUCT.labelStroke, 1, PRODUCT.labelStrokeOpacity);
  {
    const [u0, v0, u1] = PRODUCT.labelUV;
    fillPath(
      canvas,
      roundedPolygonPath(
        [
          toScreen('top', u0 + 0.05, v0 + 0.055),
          toScreen('top', u1 - 0.3, v0 + 0.055),
          toScreen('top', u1 - 0.3, v0 + 0.085),
          toScreen('top', u0 + 0.05, v0 + 0.085),
        ],
        2,
      ),
      { color: PRODUCT.labelAccent, opacity: PRODUCT.labelAccentOpacity },
    );
  }

  // Rim light — işığa baxan yuxarı kənarlar
  strokePath(
    canvas,
    litEdgesPath(screenFaces.top),
    PRODUCT.rimColor,
    PRODUCT.rimWidth,
    PRODUCT.rimOpacity,
  );

  // Rulon
  const bodyX = anchor.x - rollWidth;
  const capRx = rollWidth * 0.42;
  const top = anchor.y - rollHeight / 2;
  const bot = anchor.y + rollHeight / 2;

  fillPath(canvas, `M${bodyX},${top} L${anchor.x},${top} L${anchor.x},${bot} L${bodyX},${bot} Z`, {
    shader: gradient({ x: bodyX, y: anchor.y }, { x: anchor.x, y: anchor.y }, ROLL.body),
  });
  const capPath = `M${anchor.x},${top} A${capRx},${rollHeight / 2} 0 1 1 ${anchor.x},${bot} A${capRx},${rollHeight / 2} 0 1 1 ${anchor.x},${top} Z`;
  fillPath(canvas, capPath, {
    shader: gradient({ x: anchor.x, y: top }, { x: anchor.x, y: bot }, ROLL.cap),
  });
  const coreRy = (rollHeight / 2) * ROLL.coreRatio;
  for (let i = 1; i <= ROLL.windingCount; i += 1) {
    const t = i / (ROLL.windingCount + 1);
    const ry = coreRy + (rollHeight / 2 - coreRy) * t;
    const rx = capRx * ROLL.coreRatio + (capRx - capRx * ROLL.coreRatio) * t;
    strokePath(
      canvas,
      `M${anchor.x},${anchor.y - ry} A${rx},${ry} 0 1 1 ${anchor.x},${anchor.y + ry} A${rx},${ry} 0 1 1 ${anchor.x},${anchor.y - ry} Z`,
      ROLL.windingColor,
      1,
      ROLL.windingOpacity,
    );
  }
  fillPath(
    canvas,
    `M${anchor.x},${anchor.y - coreRy} A${capRx * ROLL.coreRatio},${coreRy} 0 1 1 ${anchor.x},${anchor.y + coreRy} A${capRx * ROLL.coreRatio},${coreRy} 0 1 1 ${anchor.x},${anchor.y - coreRy} Z`,
    { color: ROLL.coreColor, opacity: ROLL.coreOpacity },
  );
  strokePath(canvas, capPath, ROLL.stroke, 1, ROLL.strokeOpacity);

  // Film
  if (state.tip) {
    const half = filmTipHalfWidth(anchorHalfWidth, state.tension);
    const sheet = computeFilmSheet(anchor, state.tip, anchorHalfWidth, half);
    const d = polygonToSvgPath(sheet.quad);
    const alpha = filmOpacity(state.tension);

    fillPath(canvas, d, {
      shader: gradient(
        { x: anchor.x, y: anchor.y - anchorHalfWidth },
        { x: anchor.x, y: anchor.y + anchorHalfWidth },
        FILM.gradient,
      ),
      opacity: alpha,
    });
    strokePath(canvas, d, FILM.edgeStroke, FILM.edgeStrokeWidth, FILM.edgeStrokeOpacity * alpha);

    const sheen = computeFilmSheet(anchor, state.tip, anchorHalfWidth * 0.34, half * 0.34);
    fillPath(canvas, polygonToSvgPath(sheen.quad), {
      color: FILM.sheenColor,
      opacity: FILM.sheenOpacity * alpha,
    });

    strokePath(
      canvas,
      wrinklePaths(sheet, state.tension, 7, 9),
      FILM.wrinkleColor,
      FILM.wrinkleWidth,
      FILM.wrinkleOpacity * alpha,
    );

    const warn = Math.max(0, (state.tension - 0.75) / 0.25) * 0.6;
    if (warn > 0) strokePath(canvas, d, FILM.warningColor, FILM.warningWidth, warn);
  }

  surface.flush();
  const png = surface.makeImageSnapshot().encodeToBytes();
  if (!png) throw new Error('PNG kodlanmadı');
  return png;
}

const STATES: Record<string, FilmState> = {
  '1-idle': { tip: null, tension: 0 },
  '2-loose': { tip: { x: 190, y: 300 }, tension: 0.18 },
  '3-optimal': { tip: { x: 300, y: 250 }, tension: 0.55 },
  '4-overstretched': { tip: { x: 400, y: 200 }, tension: 0.95 },
};

mkdirSync('renders', { recursive: true });
for (const [name, state] of Object.entries(STATES)) {
  writeFileSync(`renders/${name}.png`, Buffer.from(renderScene(state)));
  console.log(`renders/${name}.png`);
}
console.log('\ngörünən üzlər:', projected.visibleFaces.join(', '));
