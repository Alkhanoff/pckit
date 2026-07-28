# Pack & Relax

2.5D satisfying mobil qablaşdırma oyunu — React Native + Expo.

Oyunçu məhsulları toxunma hərəkətləri ilə qablaşdırır: materialı tutur, dartır, məhsulun ətrafına sarıyır, kəsir, yapışdırır və yaranan qüsurları düzəldir. Vaxt limiti yoxdur; əsas diqqət ASMR hissi, vizual təmizlik və toxunuşa dərhal reaksiyadır.

> **Status:** Mərhələ 2 tamamlanıb — domain qatı, scoring, state machine, data modelləri və save sistemi hazırdır (183 test). Vizual gameplay Mərhələ 3-dən başlayır.

---

## Stack

|                     |                                                          |
| ------------------- | -------------------------------------------------------- |
| Platform            | Expo SDK 57 · React Native 0.86 · TypeScript             |
| Naviqasiya          | Expo Router                                              |
| Qrafika             | React Native Skia (2.5D, proqrammatik — 3D model yoxdur) |
| Gesture / animasiya | Gesture Handler 2.32 · Reanimated 4.5 (New Architecture) |
| State               | Zustand                                                  |
| Save                | Expo SQLite (native) · localStorage (web)                |
| Audio / haptic      | expo-audio · expo-haptics                                |
| Test                | Jest · React Native Testing Library                      |
| Build               | EAS Build / Submit / Update · GitHub Actions             |

---

## Sənədlər

| Fayl                                           | Məzmun                                                  |
| ---------------------------------------------- | ------------------------------------------------------- |
| [`docs/DECISIONS.md`](docs/DECISIONS.md)       | **Normativ** dizayn və arxitektura qərarları            |
| [`docs/BALANCE.md`](docs/BALANCE.md)           | **Normativ** rəqəmlər, scoring formulları, iqtisadiyyat |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Qat modeli, qovluq strukturu, state machine             |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)           | Mərhələ 0–24 və keçid qapıları                          |
| [`docs/TESTING.md`](docs/TESTING.md)           | Test strategiyası və məcburi test dəstləri              |
| [`docs/BUILDING.md`](docs/BUILDING.md)         | Build, EAS, release, risklər                            |
| [`CLAUDE.md`](CLAUDE.md)                       | Claude Code üçün iş qaydaları                           |
| `docs/reference/`                              | İlkin spesifikasiyalar — **normativ deyil**             |

---

## Oyun haqqında qısa

**Əsas dövrə:** sifariş → material seçimi → qablaşdırma → inspection → qüsur düzəltmə → nəticə → coin + reputasiya

**Scoring — üç ox:**

- **Presentation** — qırış, hava qabarcığı, simmetriya, etiket düzgünlüyü
- **Protection** — zona coverage, seal, həssas zonalar, material uyğunluğu
- **Efficiency** — istifadə olunan material, artıq qat, tullantı

**Nəticələr:** Perfect · Good · Acceptable — sifariş heç vaxt uğursuz sayılmır.

**MVP kontenti:** 4 məhsul (telefon qutusu, parfüm, hədiyyə qutusu, yemək qabı) × 4 material (streç film, bubble wrap, premium kağız, folqa) · Orders + Zen Mode · vizual workshop progression.

---

## Development

```bash
npm run web
```

```bash
npm run typecheck && npm run lint && npm test
```

Ətraflı: [`docs/BUILDING.md`](docs/BUILDING.md).
