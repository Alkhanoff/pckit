import { useCallback, useMemo } from 'react';

import { CAMERA } from '@/config/gameplay';
import type { ProductDefinition } from '@/types/definitions';
import type { ZoneId } from '@/types/game';
import type { BoxSize, FitTransform, Point, Polygon, ProjectedBox } from '@/utils/projection';
import { applyTransform, fitToRect, hitTestFace, projectBox } from '@/utils/projection';

/**
 * Səhnənin həndəsəsi.
 *
 * Həm render (GameplayScene), həm də toxunuş həlli (gesture qatı) eyni
 * hesablamaya ehtiyac duyur — buna görə həndəsə ayrıca hook-dadır və
 * ekran onu hər iki tərəfə ötürür.
 */

/** Məhsulun səhnədə tutduğu sahə — qalanı masa üçün boşluqdur. */
const PRODUCT_AREA_RATIO = 0.62;
const PRODUCT_PADDING = 24;

export type SceneShadow = { x: number; y: number; width: number; height: number };

export type SceneGeometry = {
  size: BoxSize;
  projected: ProjectedBox;
  transform: FitTransform;
  /** Ekran koordinatlarındakı üzlər */
  screenFaces: Record<ZoneId, Polygon>;
  shadow: SceneShadow;
  hitTest: (point: Point) => ZoneId | undefined;
  /** Dartılma üçün istinad məsafəsi — səhnə ölçüsünə uyğunlaşır */
  referenceDragDistance: number;
};

export function useSceneGeometry(
  product: ProductDefinition,
  width: number,
  height: number,
): SceneGeometry {
  const size = useMemo(
    () => ({
      width: product.shape.width,
      depth: product.shape.depth,
      height: product.shape.height,
    }),
    [product.shape.width, product.shape.depth, product.shape.height],
  );

  const projected = useMemo(() => projectBox(size, CAMERA.angleDeg, CAMERA.azimuthDeg), [size]);

  const transform = useMemo(
    () =>
      fitToRect(
        projected.visibleFaces.map((z) => projected.faces[z]),
        {
          x: 0,
          y: height * (1 - PRODUCT_AREA_RATIO) * 0.5,
          width,
          height: height * PRODUCT_AREA_RATIO,
        },
        PRODUCT_PADDING,
      ),
    [projected, width, height],
  );

  const screenFaces = useMemo(() => {
    const entries = (Object.keys(projected.faces) as ZoneId[]).map((zone) => [
      zone,
      applyTransform(projected.faces[zone], transform),
    ]);
    return Object.fromEntries(entries) as Record<ZoneId, Polygon>;
  }, [projected, transform]);

  /** Qutunun altındakı yumşaq kölgə — alt üzün ekran sərhədlərindən. */
  const shadow = useMemo(() => {
    const base = screenFaces.bottom;
    const xs = base.map((p) => p.x);
    const ys = base.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      x: minX - (maxX - minX) * 0.06,
      y: minY + (maxY - minY) * 0.25,
      width: (maxX - minX) * 1.12,
      height: (maxY - minY) * 0.9,
    };
  }, [screenFaces]);

  const hitTest = useCallback(
    (point: Point) => hitTestFace(point, screenFaces, projected.visibleFaces),
    [screenFaces, projected.visibleFaces],
  );

  /**
   * Optimal dartılmaya çatmaq üçün lazım olan drag məsafəsi.
   * Qutunun ekran enindən götürülür ki, kiçik ekranda dartma çox uzun olmasın.
   */
  const referenceDragDistance = useMemo(() => {
    const xs = projected.visibleFaces.flatMap((z) => screenFaces[z].map((p) => p.x));
    const span = Math.max(...xs) - Math.min(...xs);
    return Math.max(span, 80);
  }, [projected.visibleFaces, screenFaces]);

  return { size, projected, transform, screenFaces, shadow, hitTest, referenceDragDistance };
}
