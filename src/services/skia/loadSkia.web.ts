import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

/**
 * Web-də CanvasKit (WASM) AÇIQ ŞƏKİLDƏ yüklənməlidir.
 *
 * `LoadSkiaWeb()` çağırılmasa `global.CanvasKit` təyin olunmur və Skia
 * canvas-ı SƏSSİZCƏ boş qalır — element və WebGL context yaranır, amma
 * heç bir piksel çəkilmir. Bəzi brauzerlərdə konsola xəta belə düşmür:
 *
 *   Cannot find variable: CanvasKit
 *   Cannot read properties of undefined (reading 'PictureRecorder')
 *
 * Buna görə "canvas mövcuddur" yoxlaması KİFAYƏT DEYİL — piksel yoxlanmalıdır
 * (docs/TESTING.md §6).
 */

let ready = false;

export async function loadSkia(): Promise<void> {
  if (ready) return;

  try {
    // `canvaskit.wasm` `public/` qovluğundan serve olunur (scripts/copy-canvaskit.mjs).
    // Ünvan göstərilməsə Skia onu `node_modules` daxilində axtarır və tapmır.
    await LoadSkiaWeb({ locateFile: (file: string) => `/${file}` });
    ready = true;
  } catch (error) {
    // Skia yüklənməsə oyun açılmalıdır — yalnız qrafika görünməyəcək.
    console.warn('[skia] CanvasKit yüklənmədi, qrafika göstərilməyəcək:', error);
  }
}

export function isSkiaReady(): boolean {
  return ready;
}
