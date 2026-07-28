/**
 * Native platformalarda Skia hazır gəlir — heç bir hazırlıq tələb olunmur.
 *
 * Web versiyası `loadSkia.web.ts` faylındadır (Metro platform uzantısına görə
 * seçir) — eyni yanaşma storage adapterində də istifadə olunur.
 */
export async function loadSkia(): Promise<void> {
  // no-op
}

export function isSkiaReady(): boolean {
  return true;
}
