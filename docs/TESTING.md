# PACK & RELAX — TESTING

**Status:** Normativ · **Versiya:** 1.0

---

## 1. Test fəlsəfəsi

Test yükünün **əsas hissəsi təmiz TypeScript domain qatındadır**. Skia render-i və animasiya test edilmir — onlar vizual olaraq web preview və cihaz testi ilə yoxlanılır.

| Qat                                      | Test növü                            | Əhatə hədəfi    |
| ---------------------------------------- | ------------------------------------ | --------------- |
| `src/domain/**`                          | unit (Jest, React-siz)               | **≥ 90%**       |
| `src/config/**`                          | invariant testləri                   | 100%            |
| `src/stores/**`                          | unit                                 | ≥ 80%           |
| `src/repositories/**`, `src/database/**` | integration (`MemoryStorageAdapter`) | ≥ 80%           |
| `src/services/**`                        | unit + mock                          | ≥ 70%           |
| `app/**`, `src/features/**`              | smoke render (RNTL)                  | kritik ekranlar |
| `src/graphics/**`                        | test edilmir                         | —               |

---

## 2. Məcburi mock-lar

Mərhələ 1-də qurulur — sonraya saxlanılmır.

```
jest.setup.ts
├── @shopify/react-native-skia          → paket daxilindəki jest mock
├── react-native-reanimated             → LOKAL minimal mock (aşağıya bax)
├── react-native-worklets               → LOKAL mock (native modul yüklənməsin)
├── react-native-gesture-handler        → jestSetup
├── expo-haptics                        → manual mock (bütün funksiyalar no-op jest.fn)
├── expo-audio                          → manual mock
├── expo-sqlite                         → istifadə edilmir; MemoryStorageAdapter ilə əvəzlənir
└── expo-localization                   → sabit 'en' qaytarır
```

`jest.config.js`: `preset: 'jest-expo'`, `setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']`.

### ⚠️ RNTL 14 — `render` async-dir

React Native Testing Library **14.0.1**-də `render` artıq Promise qaytarır və sorğular `render`-in nəticəsində deyil, `screen` obyektində yaşayır. Köhnə pattern səssiz sınır (`getByText is not a function`).

```ts
// ❌ işləmir (RNTL ≤13 pattern-i)
const { getByText } = render(<Screen />);

// ✅ düzgün (RNTL 14)
await render(<Screen />);
expect(screen.getByText('Pack & Relax')).toBeTruthy();
```

`toBeOnTheScreen` kimi matcher-lər default aktivdir — `@testing-library/react-native/extend-expect` importu tələb olunmur (və RNTL 14-də mövcud deyil).

RNTL 14 `test-renderer@^1` peer paketini tələb edir — React 19-da `react-test-renderer`-in əvəzidir və ayrıca quraşdırılmalıdır.

### ⚠️ Reanimated 4 — paketin öz mock-u işləmir

`jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))` Reanimated 4-də **sınır**:

```
TypeError: Cannot read properties of undefined (reading 'loadUnpackers')
```

Səbəb: mock `react-native-worklets` paketini çəkir, o da Jest mühitində native modulu yükləməyə çalışır. Bu, yalnız Reanimated import edən ilk fayl yarandıqda üzə çıxır — ona qədər mock heç vaxt icra olunmur.

Həll: `jest.setup.ts`-də həm `react-native-worklets`, həm də `react-native-reanimated` üçün **lokal minimal mock**. Yeni Reanimated API-si istifadə edildikdə mock-a əlavə edilməlidir.

---

## 3. Normativ test dəstləri

### 3.1 Scoring — `src/domain/scoring/__tests__/`

**Məcburi:** `BALANCE.md §13` fixture-ləri birbaşa test kimi yazılır.

| Test                    | Gözlənilən                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| F1 Perfect              | presentation 96 · protection 100 · efficiency 100 · overall 99 · Perfect · 165 coin · 15 rep |
| F2 Good (yalnız Pass 1) | 100 · 70 · 75 · overall 82 · Good · 100 coin · 10 rep                                        |
| F3 Acceptable           | 72 · 60 · 46 · overall 61 · Acceptable · 70 coin · 7 rep                                     |

Əlavə:

- hər prioritet çəki dəsti üçün `sum(weights) === 1`
- Perfect qapısı çəkidən **asılı deyil**: eyni bal dəsti bütün prioritetlərdə eyni `Perfect` verir/vermir
- efficiency əyrisinin sərhəd nöqtələri: u = 0.90 / 1.10 / 1.25 / 1.50 / 1.75
- protection: yalnız Pass 1 → 70; seal yoxdursa −25; `poor` suitability → ×0.75
- `REPAIR_RESIDUAL`: 5 düzəldilmiş qırış → −4, 5 düzəldilməmiş → −20
- bütün ballar `[0, 100]` aralığında qalır (fuzz: 500 təsadüfi input)

### 3.2 State machine — `src/domain/gameplay/__tests__/`

- hər state yalnız icazəli intent-i qəbul edir
- naməlum intent **throw etmir**, state dəyişmir
- `pulling` state-ində `cutCompleted` təsirsizdir
- `cutting`-dən əvvəl film kəsilə bilmir
- `repairing` state-inə `inspecting` tamamlanmadan keçilmir
- `repairing`-dən `recipeCompleted` istənilən vaxt mümkündür (qüsur düzəltmək məcburi deyil)
- tam axın: `preparing → … → result` ardıcıllığı bir testdə keçir

### 3.3 Defects — `src/domain/defects/__tests__/`

- `BALANCE.md §6` cədvəlindəki hər trigger üçün bir test
- `randomDefectChance === 0` (MVP invarianti)
- critical vs minor təsnifatı
- coverage < 80% → `coverageCritical`
- düzəliş uğur şərtləri (swipe path 70%, drag 40 px, bucaq ≤5°)

### 3.4 Progression — `src/domain/progression/__tests__/`

- reputasiya hədləri düzgün kontent açır
- məhsul sifarişləri coin tələb etmir
- material reputasiya həddindən əvvəl mağazada görünmür
- kifayət etməyən coin ilə alış rədd edilir və balans dəyişmir
- reputasiya heç vaxt xərclənmir

### 3.5 Storage — `src/repositories/__tests__/`

- yaz → oxu → dəyər eyni
- boş database → default profil
- **pozulmuş JSON → crash yox, backup yaranır, default profil qayıdır**
- migration v0 → v1 → v2 ardıcıl işləyir
- migration idempotentdir (iki dəfə işləmək data pozmur)
- `MemoryStorageAdapter` və `WebStorageAdapter` eyni test dəstini keçir

### 3.6 Orders — `src/domain/orders/__tests__/`

- ilk 6 sifariş sabit ardıcıllıqdadır
- eyni recipe ardıcıl iki dəfə təklif edilmir
- yalnız açılmış recipe-lər pool-a düşür
- mükafat formulu (`baseReward × multiplier × priorityBonus`)

### 3.7 Smoke — `app/__tests__/`

Hər ekran crash-sız render olunur: Main Menu, Orders, Material Select, Result, Settings, Zen.
Gameplay ekranı üçün yalnız mount testi (Skia mock ilə).

---

## 4. Invariant testləri (`src/config/__tests__/`)

Bu testlər config faylı ilə `BALANCE.md` arasındakı sürüşməni tutur:

- hər prioritet çəki dəstinin cəmi = 1.00
- Perfect hədləri: overall 90, presentation 90, protection 90, efficiency 85
- reputasiya multiplikatorları: 1.5 / 1.0 / 0.7
- coin multiplikatorları: 1.5 / 1.0 / 0.7
- telefon qutusu zona çəkilərinin cəmi = 100
- Pass 1 zonalarının çəki cəmi = 70
- hər recipe-in `targetMaterialUnits > 0`
- hər recipe-in `requiredZones` siyahısı `zoneWeights` açarları ilə eynidir
- hər məhsulun ən azı bir recipe-i var
- hər recipe-in `productId` və `materialId` mövcud data-ya işarə edir

---

## 5. Əmrlər

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run test:coverage
```

CI (GitHub Actions) hər push və PR-da: install → typecheck → lint → test → `npx expo config --type public` validasiyası.

**Qayda:** testlər uğursuz olarsa mərhələ tamamlanmış sayılmır və növbəti mərhələyə keçilmir.

---

## 6. Manual yoxlama siyahısı (hər mərhələdən sonra)

**Web preview**

- [ ] səhifə açılır
- [ ] console error = 0 (warning qəbul edilir)
- [ ] **dev server konsolunda da error yoxdur** — Skia render xətaları yalnız orada görünür
- [ ] `typeof globalThis.CanvasKit === 'object'` (əks halda qrafika səssizcə boş qalır)
- [ ] qrafika GÖZLƏ yoxlanılıb — canvas elementinin mövcudluğu sübut deyil
- [ ] portrait layout pozulmur
- [ ] mouse ilə əsas gesture-lər işləyir

**Cihaz (preview build mövcud olduqda)**

- [ ] gesture gecikməsi hiss edilmir
- [ ] audio oynayır
- [ ] haptic işləyir və söndürülə bilir
- [ ] tətbiq bağlanıb açıldıqdan sonra progress qalır
- [ ] 10 dəqiqəlik sessiyada crash və istilik problemi yoxdur

---

## 7. Test edilməyən sahələr (bilərəkdən)

- Skia piksel çıxışı
- Reanimated animasiya vaxtlaması
- Real audio çıxışı
- Haptic fiziki hissi
- EAS build artefaktları

Bunlar manual cihaz testi ilə yoxlanılır və `DECISIONS.md §23` siyahısında qeyd edilir.
