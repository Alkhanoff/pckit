/**
 * Naviqasiya köməkçiləri.
 *
 * Expo Router-in `back()` funksiyası stack boş olduqda heç nə etmir və
 * konsola `GO_BACK was not handled by any navigator` xətası yazır.
 * Bu, iki real halda baş verir:
 *   1. Result → Next Order (`dismissAll` + `replace`) — stack sıfırlanır;
 *   2. web-də route-un birbaşa URL ilə açılması.
 *
 * Hər iki halda geri düyməsi ölü qalır və oyunçu Main Menu-ya qayıda bilmir.
 */

/** Geri düyməsinin nə etməli olduğunu təyin edir — təmiz funksiya, test edilir. */
export function resolveBackAction(canGoBack: boolean): 'back' | 'home' {
  return canGoBack ? 'back' : 'home';
}

/** Stack boş olduqda qayıdılan route. */
export const HOME_ROUTE = '/' as const;
