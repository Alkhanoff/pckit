import { MIN_TOUCH_SIZE, colors, radius, spacing, typography } from '../theme';

/**
 * Config invariantları — docs/TESTING.md §4.
 * Balans config-ləri Mərhələ 2-də əlavə olunacaq; bu fayl invariant nümunəsini qurur.
 */

describe('theme config', () => {
  it('bütün rənglər hex formatındadır', () => {
    for (const [name, value] of Object.entries(colors)) {
      expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(name).not.toHaveLength(0);
    }
  });

  it('spacing addımları artan sıradadır', () => {
    const values = Object.values(spacing);
    const sorted = [...values].sort((a, b) => a - b);
    expect(values).toEqual(sorted);
  });

  it('radius dəyərləri müsbətdir', () => {
    for (const value of Object.values(radius)) {
      expect(value).toBeGreaterThan(0);
    }
  });

  it('minimum toxunma sahəsi 44 px-dən kiçik deyil', () => {
    // Böyük touch zonaları tələbi — docs/reference UI prinsipləri
    expect(MIN_TOUCH_SIZE).toBeGreaterThanOrEqual(44);
  });

  it('tipoqrafiya ölçüləri oxunaqlı hədddədir', () => {
    for (const style of Object.values(typography)) {
      expect(style.fontSize).toBeGreaterThanOrEqual(12);
    }
  });
});
