import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * CanvasKit WASM faylını `public/` qovluğuna köçürür.
 *
 * Səbəb: React Native Skia web-də `canvaskit.wasm` faylını HTTP ilə çəkir,
 * amma Metro `node_modules` daxilindəki `.wasm` faylını serve etmir. Fayl
 * serve edilmədikdə Skia canvas-ı SƏSSİZCƏ boş qalır — element və WebGL
 * context yaranır, sadəcə heç nə çəkilmir.
 *
 * Fayl 8 MB-dır və git-ə əlavə edilmir; bu skript `postinstall`-da işləyir.
 */

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const source = join(root, 'node_modules', 'canvaskit-wasm', 'bin', 'full', 'canvaskit.wasm');
const targetDir = join(root, 'public');
const target = join(targetDir, 'canvaskit.wasm');

if (!existsSync(source)) {
  console.warn('[canvaskit] mənbə tapılmadı, keçilir:', source);
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });
copyFileSync(source, target);
console.log('[canvaskit] public/canvaskit.wasm hazırdır');
