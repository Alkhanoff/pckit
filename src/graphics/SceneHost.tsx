import { GameplayScene } from '@/graphics/GameplayScene';
import type { GameplaySceneProps } from '@/graphics/sceneProps';

/**
 * Native platformada Skia hazır gəlir — səhnə birbaşa render olunur.
 * Web versiyası `SceneHost.web.tsx` faylındadır.
 */
export function SceneHost(props: GameplaySceneProps) {
  return <GameplayScene {...props} />;
}
