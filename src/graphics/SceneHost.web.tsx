import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import type { GameplaySceneProps } from '@/graphics/sceneProps';

/**
 * Web-də səhnə YALNIZ CanvasKit yükləndikdən SONRA import edilir.
 *
 * Səbəb — Skia-nın web giriş faylı:
 *
 *   // Skia.web.js
 *   export const Skia = JsiSkApi(global.CanvasKit);
 *
 * Bu sətir modul QİYMƏTLƏNDİRİLƏN anda işləyir və `global.CanvasKit`-i həmin
 * an tutur. CanvasKit sonradan yüklənsə belə, tutulmuş `undefined` dəyişmir və
 * hər frame `Cannot read properties of undefined (reading 'PictureRecorder')`
 * xətası verir.
 *
 * `WithSkiaWeb` modulu `React.lazy` ilə gecikdirir: əvvəlcə `LoadSkiaWeb()`
 * gözlənilir, yalnız sonra səhnə modulu import olunur.
 *
 * Buna görə bu fayl `GameplayScene`-i STATİK import ETMİR — statik import
 * bütün mexanizmi pozardı.
 */
export function SceneHost(props: GameplaySceneProps) {
  return (
    <WithSkiaWeb<GameplaySceneProps>
      getComponent={() => import('@/graphics/GameplayScene')}
      componentProps={props}
      // `canvaskit.wasm` `public/` qovluğundan serve olunur.
      opts={{ locateFile: (file: string) => `/${file}` }}
      fallback={null}
    />
  );
}
