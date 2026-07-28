import { HOME_ROUTE, resolveBackAction } from '@/utils/navigation';

/**
 * Geri naviqasiyası — docs/ROADMAP.md Mərhələ 3 keçid qapısı.
 *
 * Bu qayda real bug-dan sonra əlavə edildi: Result → Next Order axınından
 * sonra stack sıfırlanır və şərtsiz `router.back()` konsola
 * `GO_BACK was not handled by any navigator` yazıb heç nə etmirdi.
 */
describe('geri naviqasiyası', () => {
  it('stack doludursa adi geri hərəkəti', () => {
    expect(resolveBackAction(true)).toBe('back');
  });

  it('stack boşdursa Main Menu-ya qayıdır — düymə ÖLÜ QALMIR', () => {
    expect(resolveBackAction(false)).toBe('home');
  });

  it('ev route-u kök səhifədir', () => {
    expect(HOME_ROUTE).toBe('/');
  });
});
