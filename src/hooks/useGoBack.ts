import { router } from 'expo-router';
import { useCallback } from 'react';

import { HOME_ROUTE, resolveBackAction } from '@/utils/navigation';

/**
 * Təhlükəsiz geri naviqasiyası.
 *
 * Stack boş olduqda `router.back()` heç nə etmir və konsola xəta yazır —
 * bunun əvəzinə Main Menu-ya qayıdılır (bax `src/utils/navigation.ts`).
 */
export function useGoBack() {
  return useCallback(() => {
    if (resolveBackAction(router.canGoBack()) === 'back') {
      router.back();
      return;
    }
    router.replace(HOME_ROUTE);
  }, []);
}
