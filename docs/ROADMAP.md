# PACK & RELAX — ROADMAP

**Status:** Normativ · **Versiya:** 1.0

Bu sənəd `Steps.txt`-in normativ və yenilənmiş versiyasıdır.
`Technical.txt §33`-dəki paralel mərhələ siyahısı **ləğv edilib** (DECISIONS §1).

---

## Hər mərhələdə icra ardıcıllığı

1. Mövcud kodu analiz et
2. Mərhələnin fayllarını yarat/dəyiş
3. `npm run typecheck` → `npm run lint` → `npm test`
4. Web preview yoxlaması (console error = 0)
5. Error-ları özün düzəlt
6. Keçid qapısını yoxla
7. Git commit
8. Bütün kriteriyalar keçirsə növbəti mərhələyə keç

Keçid qapısı ödənmədən növbəti mərhələyə keçilmir.

---

## Blok A — Texniki əsas

### ✅ Mərhələ 0 — Repository və iş mühiti *(tamamlandı 2026-07-28)*
Git repo, git identity, sənəd bazası, texnologiya versiyalarının təsbiti.

**Nəticə:** Node v22.13.0 · npm 10.9.2 · git 2.49.0 · Expo SDK 57 seçildi.

---

### Mərhələ 1 — Expo project foundation

- `npx create-expo-app` (SDK 57, TypeScript, Expo Router template)
- Portrait orientation, Safe Area
- `npx expo install`: skia, gesture-handler, reanimated, worklets, expo-audio, expo-haptics, expo-sqlite, expo-localization
- `npm i`: zustand, i18n-js
- ESLint + Prettier + Jest + RNTL
- **Test mock-ları (Skia, Reanimated, Worklets, Gesture Handler, Haptics, Audio)** — sonraya saxlanmır
- `app.config.ts`, `eas.json`, qovluq strukturu
- GitHub Actions CI (typecheck + lint + test + expo config validation)
- Main Menu placeholder

**Keçid qapısı**
- [ ] Web preview açılır, console error yoxdur
- [ ] Main Menu route-u görünür
- [ ] Portrait konfiqurasiyası mövcuddur
- [ ] typecheck / lint / test keçir
- [ ] CI workflow yaşıl

---

### Mərhələ 2 — Domain, data və save arxitekturası

- `ProductDefinition`, `MaterialDefinition`, `PackagingRecipe` tipləri
- `src/config/balance.ts`, `progression.ts`, `gameplay.ts` — **`BALANCE.md`-dən birbaşa**
- Gameplay state machine + `GameplayIntent` union
- Scoring modulları (presentation / protection / efficiency / overall)
- Altı store
- `StorageAdapter` + 3 implementasiya + migration sistemi
- İlk data: telefon qutusu, streç film, recipe, tutorial sifarişi

**Keçid qapısı**
- [ ] `BALANCE.md §13` fixture-ləri (F1/F2/F3) testdə eyni nəticəni verir
- [ ] state machine testləri keçir
- [ ] save yaradılır, oxunur, pozulmuş save crash etmir
- [ ] web və native adapter eyni interfeysi ödəyir
- [ ] yeni məhsul əlavə etmək gameplay kodunu dəyişmir

---

### Mərhələ 3 — Naviqasiya və UI axını

- 9 route
- Main Menu, Orders, Material Selection ekranları
- Seçim store-a yazılır, gameplay-ə yalnız `sessionId` ötürülür
- Safe Area + responsive portrait

**Keçid qapısı**
- [ ] Main Menu → Orders → Material Select → Gameplay axını işləyir
- [ ] Geri naviqasiya state-i pozmur
- [ ] Kiçik (SE) və uzun (Pro Max) ekranlarda UI pozulmur

---

## Blok B — İlk vertical slice

### Mərhələ 4 — 2.5D telefon qutusu və masa
Skia: masa, ön/üst/yan səthlər, kölgə, highlight, etiket, touch zonaları. Sabit 40° perspektiv.

- [ ] Məhsul həcmli görünür, düz rectangle deyil
- [ ] Fərqli ekran ölçülərində pozulmur
- [ ] Görünən frame drop yoxdur

### Mərhələ 5 — Gesture sistemi
Tap · Drag/Pan · Swipe · Hold · Release + `intentBridge` + mouse fallback.

- [ ] Gesture-lər conflict yaratmır
- [ ] `runOnJS` yalnız `intentBridge.ts`-dədir
- [ ] Gesture zamanı React re-render = 0
- [ ] UI toxunuşu gameplay gesture-i yaratmır

### Mərhələ 6 — Streç filmi tutmaq və dartmaq
Film ucu, rulondan açılma, stretch transform, üç tension bandı (`BALANCE.md §2`), audio + haptic.

- [ ] Üç tension bandı aydın fərqlənir (rəng **və** forma)
- [ ] Drag məsafəsi film uzunluğuna təsir edir
- [ ] Overstretch xəbərdarlığı spam etmir (max 1/2s)

### Mərhələ 7 — Sarımaq və coverage
6 zona, çəkili coverage, **iki wrap pass**, avtomatik 90° dönüş, material unit hesablaması.

- [ ] Pass 1 → 70 çəki, Pass 1+2 → 100 çəki
- [ ] Coverage mask mərhələli artır
- [ ] `materialUnitsUsed` tension faktoru ilə hesablanır
- [ ] Dönüş axıcıdır (600 ms)

### Mərhələ 8 — Kəsim və sealing
Kəsim xətti, swipe validation, sərbəst film ucu, seal zonası.

- [ ] Film yalnız `cutting` state-də kəsilir
- [ ] Seal düzgün və yanlış zonaya qoyula bilir
- [ ] Yanlış seal bloklamır, yalnız bal azaldır

### Mərhələ 9 — Inspection, qüsurlar və düzəltmə
`inspecting` rotation (2.5 s) → qüsur aşkarlanması → `repairing`.
Minimum: `wrinkle`, `airBubble`, `openCorner`, `looseEnd`, `excessMaterial`.

- [ ] Inspection bütün 6 zonanı göstərir
- [ ] Ən azı 3 qüsur real gameplay-dən yaranır (deterministik)
- [ ] Critical və minor fərqlənir
- [ ] Hər qüsurun öz düzəltmə gesture-i var
- [ ] Düzəliş cəzanın 80%-ini geri qaytarır

### Mərhələ 10 — Audio və haptic
Registry, service, kateqoriya mute, 2–3 variant, preload, Android vizual kompensasiya.

- [ ] Əsas interaction-lar səssiz qalmır
- [ ] Audio və animasiya sinxrondur
- [ ] Haptic söndürüləndə gameplay aydın qalır
- [ ] Preload gameplay-i bloklamır

### Mərhələ 11 — Scoring, coin və Result
Üç ox, prioritet çəkiləri, Perfect/Good/Acceptable, coin, reputasiya, Result Screen.

- [ ] F1/F2/F3 fixture-ləri real gameplay-də təkrarlana bilir
- [ ] Düzəliş balı artırır, artıq material azaldır
- [ ] Coin və reputasiya save edilir
- [ ] Next Order yeni session yaradır

### Mərhələ 12 — Tutorial və vertical slice
10 addımlıq tutorial, skip, save, restart. Tam axın + Android preview build.

**Keçid qapısı = `DECISIONS.md §23` siyahısı.**
Bu tamamlanmadan yeni material əlavə edilmir.

---

## Blok C — Yeni məhsul və materiallar

| Mərhələ | Məzmun | Əsas keçid şərti |
|---|---|---|
| 13 | Bubble wrap | qatlama streç filmdən fərqli hiss edilir; lent işləyir; **pop scoring-ə təsir etmir** |
| 14 | Parfüm | həssas zonalar (üst/alt/yan) protection-a təsir edir |
| 15 | Premium kağız + hədiyyə qutusu | künc fold-ları, lent, möhür, `asymmetry` scoring-i |
| 16 | Folqa + yemək qabı | folqa dartılmır, əzilir; pressure əsaslı wrinkle |

---

## Blok D — Meta sistemlər

| Mərhələ | Məzmun | Əsas keçid şərti |
|---|---|---|
| 17 | Zen Mode | progress, coin, reputasiya **dəyişmir** |
| 18 | Workshop | 4 vizual səviyyə, coin ilə upgrade, save |
| ~~19~~ | ~~Jumbo rulon~~ | **Post-MVP** (DECISIONS §12) |

---

## Blok E — Tamamlama

| Mərhələ | Məzmun |
|---|---|
| 20 | UI/UX polish — design token-lər, transition-lar, Safe Area, Dynamic Island, accessibility label-ları |
| 21 | Performans — re-render audit, Skia optimizasiyası, audio pool, memory, `ARCHITECTURE.md §10` büdcəsi |
| 22 | Android + iOS preview build, install link |
| 23 | Production hazırlığı — icon, splash, identifier, EAS profilləri, AAB, TestFlight, privacy audit |
| 24 | Son MVP testləri — `DECISIONS.md §22` Definition of Done |

---

## Post-MVP backlog

- Jumbo rulon bonus səhnəsi + material ehtiyatı iqtisadiyyatı
- Workshop Level 4+ (playtest nəticəsinə görə)
- Localization: az / tr / ru
- Daily challenge, cloud save, monetizasiya — yalnız core gameplay sübut edildikdən sonra

---

## Mərhələ hesabatı formatı

Hər mərhələnin sonunda yalnız bunlar bildirilir:

1. **Hazırlandı** — tamamlanan sistemlər
2. **Əsas fayllar** — yalnız path-lər
3. **Test nəticələri** — typecheck / lint / test / web preview / build
4. **Qalan məhdudiyyətlər** — dürüst
5. **İstifadəçidən tələb olunan** — yalnız login, credential, ödəniş, hüquqi təsdiq, fiziki cihaz testi
