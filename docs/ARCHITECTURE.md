# PACK & RELAX — ARCHITECTURE

**Status:** Normativ · **Versiya:** 1.0

---

## 1. Qat modeli

```
┌─────────────────────────────────────────────────────┐
│  app/            Expo Router route-ları (yalnız ekran) │
├─────────────────────────────────────────────────────┤
│  src/features/   Material-spesifik gameplay modulları  │
│  src/components/ Paylaşılan UI                        │
│  src/graphics/   Skia render primitivləri             │
├─────────────────────────────────────────────────────┤
│  src/gestures/   Gesture → Intent tərcüməsi (UI thread)│
├─────────────────────────────────────────────────────┤
│  src/domain/     Təmiz TypeScript qaydalar (React yox) │
│                  gameplay · scoring · orders · progression│
├─────────────────────────────────────────────────────┤
│  src/stores/     Zustand — ekranlararası state         │
├─────────────────────────────────────────────────────┤
│  src/repositories/ → src/services/storage/ → adapter   │
├─────────────────────────────────────────────────────┤
│  src/data/ + src/config/   Statik data və rəqəmlər     │
└─────────────────────────────────────────────────────┘
```

**Dəmir qaydalar:**

1. `src/domain/` **heç bir** React, Reanimated, Skia və ya Expo importu etmir. Tam təmiz TS — bu, testlərin sürətli və stabil olmasının səbəbidir.
2. `app/` route-ları gameplay məntiqi saxlamır; yalnız store oxuyur və feature komponenti render edir.
3. UI komponentləri birbaşa SQL yazmır — yalnız repository çağırır.
4. Balans rəqəmi yalnız `src/config/`-dən gəlir.
5. Yeni məhsul/material əlavə etmək üçün `src/data/` dəyişir, gameplay kodu dəyişmir.

---

## 2. Qovluq strukturu

```text
app/
  _layout.tsx
  index.tsx            /            Main Menu
  workshop.tsx         /workshop
  orders.tsx           /orders
  material-select.tsx  /material-select
  gameplay.tsx         /gameplay
  result.tsx           /result
  upgrades.tsx         /upgrades
  zen.tsx              /zen
  settings.tsx         /settings

src/
  config/
    balance.ts         scoring çəkiləri, cəzalar, tension, efficiency əyriləri
    progression.ts     reputasiya hədləri, coin qiymətləri, mükafat
    gameplay.ts        coverage, timing, kamera, sifariş axını
    theme.ts           design token-lər
  data/
    products.ts        materials.ts        recipes.ts        orders.ts
  domain/
    gameplay/
      machine.ts       state machine (təmiz reducer)
      intents.ts       GameplayIntent union
      session.ts       PackagingSession modeli
    scoring/
      presentation.ts  protection.ts  efficiency.ts  overall.ts
    defects/
      rules.ts         detect.ts  repair.ts
    orders/            generator.ts  rewards.ts
    progression/       unlocks.ts  reputation.ts
  features/
    stretch-film/  bubble-wrap/  foil/  gift-paper/
    defects/  tutorial/  workshop/  inspection/
  graphics/
    products/          PhoneBox.tsx  Perfume.tsx  FoodTray.tsx  GiftBox.tsx
    materials/         StretchFilmLayer.tsx  BubbleWrapLayer.tsx  ...
    effects/           Wrinkle.tsx  AirBubble.tsx  Specular.tsx  Shadow.tsx
    Table.tsx          gameplay masası + kamera perspektivi
  gestures/
    useDragGesture.ts  useSwipeGesture.ts  useTapGesture.ts  useHoldGesture.ts
    intentBridge.ts    worklet → JS intent körpüsü (runOnJS burada, başqa yerdə yox)
  stores/
    useProfileStore.ts      useProgressionStore.ts  useOrderStore.ts
    useGameplayStore.ts     useSettingsStore.ts     useInventoryStore.ts
  repositories/
    profileRepository.ts  progressRepository.ts  settingsRepository.ts
  services/
    storage/    StorageAdapter.ts  sqlite.ts  web.ts  memory.ts  index.ts
    audio/      registry.ts  AudioService.ts
    haptics/    HapticsService.ts
  database/
    schema.ts  migrations/  index.ts
  localization/
    i18n.ts  en.json  (sonra: az.json  tr.json  ru.json)
  hooks/  utils/  types/

assets/
  audio/  images/  icons/  fonts/

docs/
  DECISIONS.md  BALANCE.md  ARCHITECTURE.md  ROADMAP.md  TESTING.md  BUILDING.md
  reference/    (non-normative mənbə sənədləri)
```

> `src/services/analytics/` **yaradılmır** (DECISIONS §20).

---

## 3. Gameplay state machine

`src/domain/gameplay/machine.ts` — təmiz reducer, yan təsirsiz:

```ts
type GameplayState =
  | 'preparing' | 'selectingMaterial' | 'grabbingMaterial'
  | 'pulling'   | 'wrapping'          | 'cutting'
  | 'sealing'   | 'inspecting'        | 'repairing'
  | 'completed' | 'result'

reduce(state: PackagingSession, intent: GameplayIntent): PackagingSession
```

### Keçid cədvəli

| Cari                | Qəbul edilən intent            | Növbəti                  |
| ------------------- | ------------------------------ | ------------------------ |
| `preparing`         | — (`beginSession`)             | `selectingMaterial`      |
| `selectingMaterial` | `materialGrabbed`              | `grabbingMaterial`       |
| `grabbingMaterial`  | `tensionStateChanged`          | `pulling`                |
| `grabbingMaterial`  | `materialReleased`             | `selectingMaterial`      |
| `pulling`           | `tensionStateChanged`          | `pulling`                |
| `pulling`           | `wrapZoneCompleted`            | `wrapping`               |
| `wrapping`          | `wrapZoneCompleted`            | `wrapping`               |
| `wrapping`          | `wrapPassCompleted` (aralıq)   | `wrapping` _(90° dönüş)_ |
| `wrapping`          | `wrapPassCompleted` (son pass) | `cutting`                |
| `cutting`           | `cutCompleted`                 | `sealing`                |
| `sealing`           | `sealPlaced`                   | `inspecting`             |
| `inspecting`        | `inspectionCompleted`          | `repairing`              |
| `repairing`         | `defectRepaired`               | `repairing`              |
| `repairing`         | `recipeCompleted`              | `completed`              |
| `completed`         | — (avtomatik)                  | `result`                 |

`defectDetected` yuxarıdakı cədvəldə göstərilmir, çünki state dəyişmir — o, qablaşdırma boyu istənilən anda qəbul edilir: `pulling · wrapping · cutting · sealing · inspecting · repairing`.

**Qayda:** hər state yalnız öz siyahısındakı intent-i qəbul edir. İcazəsiz intent **səssizcə atılır** (throw yox) — gameplay heç vaxt istisna ilə dayanmır. Atılan intent `__DEV__`-də warn edilir və `session.rejectedIntents` sayğacı artır.

`preparing` → `selectingMaterial` keçidi oyunçu hərəkəti tələb etmir, amma səhnə hazır olmadan baş verməməlidir — buna görə `beginSession()` funksiyası ilə açıq şəkildə çağırılır. `completed` → `result` isə `reduce` daxilində avtomatikdir.

`repairing` state-indən `recipeCompleted` istənilən vaxt atıla bilər — oyunçu qüsurları düzəltməyə məcbur deyil.

---

## 4. Gesture → domain körpüsü

```
[UI thread — worklet]                    [JS thread]
 pan/tap/swipe
   ↓
 shared values (x, y, tension, coverage)
   ↓ (yalnız diskret hadisə)
 intentBridge.emit(intent) ──runOnJS──→ machine.reduce() → useGameplayStore
```

- `runOnJS` **yalnız** `src/gestures/intentBridge.ts` faylında çağırılır. Başqa yerdə `runOnJS` istifadəsi ESLint qaydası ilə qadağandır.
- Frame başına state update yoxdur; vizual dəyişikliklər `useAnimatedProps` / `useDerivedValue` ilə birbaşa Skia-ya gedir.
- `tensionStateChanged` ≥120 ms debounce ilə (bax `BALANCE.md §2`).
- Zustand-a koordinat yazılmır.

---

## 5. Store məsuliyyətləri

| Store                 | Saxlayır                                                 | Persist     |
| --------------------- | -------------------------------------------------------- | ----------- |
| `useProfileStore`     | coin, reputasiya, ümumi statistika                       | ✓           |
| `useProgressionStore` | açılmış məhsul/material, workshop level, tutorial status | ✓           |
| `useOrderStore`       | mövcud sifarişlər, aktiv sifariş                         | qismən      |
| `useGameplayStore`    | aktiv `PackagingSession`, cari state, defect siyahısı    | ✗ (session) |
| `useSettingsStore`    | music, sound, haptic, reduceMotion, dil                  | ✓           |
| `useInventoryStore`   | material ehtiyatı _(MVP-də vizual, təsirsiz)_            | ✓           |

Route parametrlərində gameplay state saxlanılmır — yalnız `sessionId`.

---

## 6. Storage

```ts
interface StorageAdapter {
  init(): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  getSchemaVersion(): Promise<number>;
  setSchemaVersion(v: number): Promise<void>;
  transaction(fn: () => Promise<void>): Promise<void>;
}
```

| Platform      | Implementasiya                                    |
| ------------- | ------------------------------------------------- |
| Android / iOS | `SqliteStorageAdapter` (expo-sqlite)              |
| Web preview   | `WebStorageAdapter` (localStorage, JSON snapshot) |
| Jest          | `MemoryStorageAdapter`                            |

Seçim `src/services/storage/index.ts`-də `Platform.OS` ilə bir dəfə edilir.

**Migration:** `database/migrations/` altında nömrələnmiş, irəli-yalnız funksiyalar. Tətbiq açılışında cari versiya ilə hədəf versiya müqayisə edilir və aradakı migration-lar ardıcıl işlədilir.

**Pozulmuş save:** parse/schema xətası → mövcud data `save_backup_<timestamp>` açarına köçürülür → default profil yaradılır → `console.warn` → tətbiq normal açılır. Heç bir halda crash yoxdur.

---

## 7. Audio

```
AudioService
  preload(category)   play(id, {volume, rate})   loop(id)   stop(id)
  setCategoryMuted(category, muted)
```

- Bütün fayllar `src/services/audio/registry.ts`-də id → asset map kimi saxlanılır. Komponentdə birbaşa `require()` yoxdur.
- Kateqoriyalar: `stretch · cut · fold · foil · bubble · tape · label · stamp · machine · success · ambient · ui`
- Variasiya: hər təkrarlanan action üçün 2–3 variant, ±10% volume (bax `DECISIONS §18`).
- Preload gameplay ekranına girişdə, arxa planda; preload bitməsə gameplay bloklanmır.
- Asset yoxdursa `play()` səssizcə no-op edir — development dayanmır.

---

## 8. Haptics

```
HapticsService.trigger('light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error')
```

- `useSettingsStore.haptic === false` → no-op.
- Web / dəstəkləməyən cihaz → no-op (heç bir xəta atılmır).
- Komponentlər `expo-haptics`-i birbaşa import etmir.

| Event                   | Haptic               |
| ----------------------- | -------------------- |
| materialı tutmaq        | `light`              |
| optimal tension-a giriş | `selection`          |
| overstretch             | `warning` (max 1/2s) |
| kəsim                   | `medium`             |
| sealing                 | `light`              |
| bubble pop              | `light`              |
| möhür                   | `heavy`              |
| qüsur düzəltmək         | `selection`          |
| Perfect nəticə          | `success`            |

---

## 9. Skia render qaydaları

- Bir `<Canvas>` per gameplay ekranı. Çoxsaylı canvas yaradılmır.
- Layer sırası: masa → kölgə → məhsul səthləri → material layer → effektlər (qırış, qabarcıq, parıltı) → qüsur highlight-ları.
- Ağır `Path` obyektləri `useMemo` ilə cache edilir; hər frame yenidən yaradılmır.
- Blur və shader effektləri minimum; `BackdropFilter` istifadə edilmir.
- Coverage mask: `Group` + `clip` ilə, per-zona `RoundedRect` maskaları.
- Animasiya dəyərləri Reanimated shared value-lardan `useDerivedValue` vasitəsilə gəlir.

---

## 10. Performans büdcəsi

| Metrik                             | Hədəf                 |
| ---------------------------------- | --------------------- |
| FPS (orta cihaz)                   | 60, minimum stabil 30 |
| Gesture → vizual gecikmə           | < 50 ms               |
| Gameplay ekranında React re-render | gesture zamanı **0**  |
| `runOnJS` çağırışı                 | < 10 / saniyə         |
| Startup (soyuq)                    | < 3 s                 |
| Skia layer sayı                    | ≤ 25                  |
