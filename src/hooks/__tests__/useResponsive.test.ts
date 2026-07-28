import { computeResponsive } from '../useResponsive';

/** Hədəf cihazlar — docs/ROADMAP.md Mərhələ 3 keçid qapısı. */
const DEVICES: [string, number, number][] = [
  ['iPhone SE', 375, 667],
  ['iPhone 13 mini', 375, 812],
  ['iPhone 15', 393, 852],
  ['iPhone 15 Pro Max', 430, 932],
  ['iPad mini portrait', 744, 1133],
];

describe('responsive hesablaması', () => {
  it.each(DEVICES)('%s — ölçülər ağlabatan hədddə qalır', (_name, width, height) => {
    const r = computeResponsive(width, height);

    expect(r.scale).toBeGreaterThanOrEqual(0.9);
    expect(r.scale).toBeLessThanOrEqual(1.15);
    expect(r.contentWidth).toBeLessThanOrEqual(width);
    expect(r.contentWidth).toBeGreaterThan(0);
    expect(r.verticalScale).toBeGreaterThan(0);
  });

  it('alçaq ekranda şaquli boşluqlar sıxılır', () => {
    const r = computeResponsive(375, 667);
    expect(r.isCompact).toBe(true);
    expect(r.verticalScale).toBeLessThan(1);
  });

  it('uzun ekranda boşluqlar sıxılmır', () => {
    const r = computeResponsive(430, 932);
    expect(r.isCompact).toBe(false);
    expect(r.verticalScale).toBe(1);
  });

  it('planşetdə kontent eni məhdudlaşdırılır', () => {
    const r = computeResponsive(744, 1133);
    expect(r.isWide).toBe(true);
    expect(r.contentWidth).toBeLessThan(744);
  });

  it('telefon ekranında kontent tam eni tutur', () => {
    const r = computeResponsive(393, 852);
    expect(r.isWide).toBe(false);
    expect(r.contentWidth).toBe(393);
  });

  it('size() tam ədəd qaytarır', () => {
    const r = computeResponsive(375, 812);
    expect(Number.isInteger(r.size(16))).toBe(true);
    expect(Number.isInteger(r.size(13))).toBe(true);
  });

  it('çox kiçik və çox böyük ekranda scale kəsilir', () => {
    expect(computeResponsive(200, 400).scale).toBe(0.9);
    expect(computeResponsive(2000, 2000).scale).toBeLessThanOrEqual(1.15);
  });
});
