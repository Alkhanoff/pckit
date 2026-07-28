/**
 * NORMATIV GAMEPLAY PARAMETRLƏRİ
 * Mənbə: docs/BALANCE.md §10–12.
 */

// ─────────────────────────────────────────────────────────────
// §11 — Coverage irəliləməsi
// ─────────────────────────────────────────────────────────────

export const COVERAGE = {
  /** Zona 100%-ə çatmaq üçün lazım olan drag: zona eni × bu əmsal */
  zoneSpanMultiplier: 1.2,
  /** Drag istiqaməti zonanın wrap oxu ilə bu bucaq daxilində olmalıdır (dərəcə) */
  directionToleranceDeg: 35,
  /** Pass tamamlanmış sayılır: bütün zonaları bu səviyyəyə çatanda */
  passCompleteThreshold: 0.9,
  /** Zona bunu keçdikdə əlavə qat sayılır */
  extraLayerThreshold: 1.0,
} as const;

// ─────────────────────────────────────────────────────────────
// §12 — Timing və kamera
// ─────────────────────────────────────────────────────────────

export const TIMING = {
  /** Avtomatik 90° dönüş */
  rotationMs: 600,
  /** Inspection rotation — skip edilə bilər */
  inspectionMs: 2500,
  cutZoomMs: 350,
  sealZoomMs: 350,
  repairZoomMs: 300,
  /** Result ekranında üç oxun ardıcıl animasiyası */
  resultScoreMs: 800,
} as const;

export const CAMERA = {
  /** Sabit perspektiv bucağı — oyunçu kameranı idarə etmir */
  angleDeg: 40,
  cutScale: 1.25,
  sealScale: 1.2,
  repairScale: 1.3,
} as const;

// ─────────────────────────────────────────────────────────────
// §10 — Sifariş axını
// ─────────────────────────────────────────────────────────────

export const ORDERS = {
  /** Orders ekranında eyni anda göstərilən sifariş sayı */
  visibleCount: 3,
  /** İlk bu qədər sifariş sabit ardıcıllıqdadır */
  fixedSequenceLength: 6,
  /** Eyni recipe ardıcıl iki dəfə təklif edilmir */
  preventConsecutiveRepeat: true,
} as const;
