import type { SharedValue } from 'react-native-reanimated';

import type { AnyGesture } from '@/gestures/types';
import type { SceneGeometry } from '@/hooks/useSceneGeometry';
import type { ZoneId } from '@/types/game';

/**
 * Səhnənin propsları ayrıca fayldadır: `SceneHost` bu tipi Skia modulunu
 * IMPORT ETMƏDƏN tanımalıdır (web-də Skia yalnız CanvasKit hazır olandan
 * sonra yüklənir — bax `SceneHost.web.tsx`).
 */
export type GameplaySceneProps = {
  geometry: SceneGeometry;
  width: number;
  height: number;
  gesture: AnyGesture;
  highlightedZone?: ZoneId;
  film: {
    dragX: SharedValue<number>;
    dragY: SharedValue<number>;
    tension: SharedValue<number>;
    active: SharedValue<boolean>;
  };
};
