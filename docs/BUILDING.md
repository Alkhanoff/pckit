# PACK & RELAX — BUILDING

**Status:** Normativ · **Versiya:** 1.0

---

## 1. Texnologiya versiyaları

Mərhələ 1-də təsbit edilmiş faktiki versiyalar:

| Paket                           | Versiya          | Qeyd                                                     |
| ------------------------------- | ---------------- | -------------------------------------------------------- |
| `expo`                          | ~57.0.8          |                                                          |
| `react-native`                  | 0.86.0           |                                                          |
| `react`                         | 19.2.3           |                                                          |
| `expo-router`                   | ~57.0.8          | typed routes aktiv                                       |
| `@shopify/react-native-skia`    | 2.6.2            | Expo-nun pinlədiyi versiya (latest 2.10 deyil)           |
| `react-native-reanimated`       | 4.5.0            | New Architecture tələb edir                              |
| `react-native-worklets`         | 0.10.0           | Reanimated 4 üçün ayrıca paket                           |
| `react-native-gesture-handler`  | ~2.32.0          | Expo-nun pinlədiyi versiya (latest 3.1 deyil)            |
| `zustand`                       | ^5.0.14          |                                                          |
| `jest-expo`                     | ~57.0.2          |                                                          |
| `@testing-library/react-native` | ^14.0.1          | `render` **async**-dir — bax TESTING.md §2               |
| `test-renderer`                 | ^1.2.0           | RNTL 14 peer (React 19 üçün `react-test-renderer` əvəzi) |
| `typescript`                    | ~6.0.3           |                                                          |
| Node / npm                      | 22.13.0 / 10.9.2 |                                                          |

**Qayda:** bütün Expo paketləri `npx expo install` ilə quraşdırılır — `npm install` yalnız Expo-dan kənar paketlər üçün (`zustand`, `i18n-js`).
`expo install` bilərəkdən latest-dən aşağı versiya seçirsə, o seçim əsasdır — manual yüksəltmə edilmir.

### New Architecture

SDK 57-də New Architecture **defaultdur**; `app.config.ts`-də `newArchEnabled` bayrağı artıq `ExpoConfig` tipində yoxdur və yazılmır.

---

## 2. Lokal development

```bash
npm run web
```

```bash
npm run android
```

```bash
npm run ios
```

Web preview yalnız vizual və məntiq yoxlaması üçündür — native performansı və haptic keyfiyyətini əvəz etmir (`DECISIONS.md §15`).

### ⚠️ Skia web — iki addım MƏCBURİDİR

Web-də Skia özü işə düşmür. İki şey lazımdır:

**1. `LoadSkiaWeb()` açıq çağırılmalıdır** (`src/services/skia/loadSkia.web.ts`, root layout-dan). Çağırılmasa `global.CanvasKit` təyin olunmur.

**2. `canvaskit.wasm` serve edilməlidir.** Metro `node_modules` daxilindəki `.wasm` faylını vermir. `scripts/copy-canvaskit.mjs` onu `public/` qovluğuna köçürür (`postinstall`-da avtomatik), `LoadSkiaWeb({ locateFile })` isə ünvanı göstərir. Fayl 8 MB-dır və git-ə əlavə edilmir.

**Niyə bu vacibdir:** hər iki addım olmadan Skia canvas-ı **səssizcə boş qalır** — `<canvas>` elementi və WebGL context yaranır, konsolda görünən xəta olmaya bilər, sadəcə heç nə çəkilmir. Mərhələ 1–6 boyu vəziyyət məhz belə idi və yalnız telefonun brauzeri xətanı üzə çıxardı.

**Yoxlama qaydası:** "canvas mövcuddur" KİFAYƏT DEYİL. Yoxlanmalı:

- `typeof globalThis.CanvasKit === 'object'`
- dev server konsolunda `PictureRecorder` / `CanvasKit` xətası yoxdur
- və nəhayət — ekrana baxmaq

WebGL canvas-ından `drawImage` ilə piksel oxumaq **etibarsızdır** (`preserveDrawingBuffer` olmadan həmişə boş qaytarır) — bu üsulla yoxlamaq olmaz.

### SQLite web qeydi

`expo-sqlite` web-də `wa-sqlite.wasm` faylını import edir və Metro bunu resolve edə bilmir:

```
Unable to resolve module ./wa-sqlite/wa-sqlite.wasm
```

Bu səbəbdən web-də `WebStorageAdapter` (localStorage) istifadə olunur.

⚠️ **Şərti `require()` bu problemi HƏLL ETMİR.** Metro statik analiz aparır və

```ts
if (Platform.OS === 'web') { ... } else { require('./sqlite'); }
```

yazılsa belə `expo-sqlite`-ı web bundle-ına salır. Mərhələ 3-də bu, web preview-i tamamilə sındırdı.

**Düzgün həll — platform fayl uzantıları:**

```
src/services/storage/adapter.native.ts   → SqliteStorageAdapter
src/services/storage/adapter.web.ts      → WebStorageAdapter
src/services/storage/adapter.ts          → fallback (Jest/node)
```

`index.ts` yalnız `./adapter`-i import edir; platformu Metro seçir. Yeni native-only paket əlavə edilərkən eyni yanaşma tətbiq edilməlidir.

---

## 3. EAS profilləri

`eas.json`:

| Profil        | Platform     | Məqsəd      | Distribution            |
| ------------- | ------------ | ----------- | ----------------------- |
| `development` | android, ios | dev client  | internal                |
| `preview`     | android, ios | cihaz testi | internal (APK / ad-hoc) |
| `production`  | android, ios | store       | store (AAB / IPA)       |

EAS Update kanalları: `preview` və `production` — ayrı saxlanılır.

**EAS Update ilə göndərilə bilən:** UI dəyişiklikləri, balans, scoring, mətnlər, asset-lər, kiçik gameplay düzəlişləri.
**Yeni build tələb edir:** native dependency əlavəsi/dəyişikliyi, SDK yüksəltməsi, permission dəyişikliyi.

---

## 4. Build əmrləri

```bash
npx eas build --profile preview --platform android
```

```bash
npx eas build --profile preview --platform ios
```

```bash
npx eas build --profile production --platform android
```

```bash
npx eas update --channel preview --message "balance tuning"
```

---

## 5. Tətbiq konfiqurasiyası

`app.config.ts` daxilində:

| Sahə                   | Dəyər                      |
| ---------------------- | -------------------------- |
| `name`                 | Pack & Relax _(müvəqqəti)_ |
| `slug`                 | `pack-and-relax`           |
| `orientation`          | `portrait`                 |
| `scheme`               | `packandrelax`             |
| `android.package`      | `com.alkha.packandrelax`   |
| `ios.bundleIdentifier` | `com.alkha.packandrelax`   |
| `userInterfaceStyle`   | `light`                    |
| `experiments`          | typedRoutes, reactCompiler |

Version və build number `app.config.ts`-də mərkəzləşdirilir; EAS `autoIncrement` istifadə edir.

**Permission:** MVP-də heç bir həssas permission tələb olunmur (kamera, mikrofon, məkan, bildiriş yoxdur). Mərhələ 23-də permission audit aparılır və artıq permission-lar silinir.

---

## 6. CI (GitHub Actions)

`.github/workflows/ci.yml` — hər push və PR-da:

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm test`
5. `npx expo config --type public` (validasiya)

Production build **hər commit-də yaradılmır**. Build yalnız manual workflow dispatch, xüsusi branch və ya release tag ilə başladılır.

---

## 7. İstifadəçidən tələb olunan addımlar

Aşağıdakılar Claude tərəfindən edilə bilməz və istifadəçi müdaxiləsi tələb edir:

| Addım                                         | Nə vaxt lazımdır                      |
| --------------------------------------------- | ------------------------------------- |
| Expo (EAS) hesabına giriş                     | ilk `eas build`-dən əvvəl             |
| GitHub hesabına giriş / repo yaradılması      | Mərhələ 1                             |
| Apple Developer hesabı ($99/il) və giriş      | iOS preview / TestFlight (Mərhələ 22) |
| Google Play Developer hesabı ($25 birdəfəlik) | Android store submit (Mərhələ 23)     |
| İki mərhələli təsdiq kodları                  | hesab girişlərində                    |
| Hüquqi müqavilələrin qəbulu                   | developer hesabı yaradılışında        |
| Fiziki telefonda vizual və toxunma testi      | Mərhələ 12, 22, 24                    |

Android preview build **Apple hesabı olmadan** yaradıla bilər — iOS yalnız Mərhələ 22-də tələb olunur.

---

## 8. Release ardıcıllığı

1. `npm run typecheck && npm run lint && npm test` — hamısı yaşıl
2. Web preview yoxlaması
3. `preview` build → fiziki cihaz testi
4. Version artırılır (`app.config.ts`)
5. `production` build (Android AAB + iOS IPA)
6. `eas submit` konfiqurasiyası ilə store-a göndərilir
7. Release tag + `docs/` yenilənməsi

---

## 9. Məlum risklər

| Risk                                        | Təsir                              | Azaldılma                                                                               |
| ------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| ~~Skia web CanvasKit~~                      | —                                  | ✅ **Bağlandı** — Mərhələ 1-də WebGL context ilə render təsdiqləndi                     |
| ~~Reanimated 4 New Arch tələbi~~            | —                                  | ✅ **Bağlandı** — SDK 57-də New Arch defaultdur; web export uğurlu                      |
| SDK 57 yenidir (sdk-56 daha çox patch alıb) | ekosistem uyğunsuzluğu             | bütün expo-\* paketlər 57.x-də mövcuddur; problem olarsa SDK 56-ya geri dönmə planı var |
| Layihə path-ində boşluq (`Pack it`)         | bəzi Windows tooling-ində problem  | Mərhələ 1-də problem yaratmadı (install, bundle, export, test hamısı keçdi); nəzarətdə  |
| Android haptic keyfiyyəti                   | əsas vəd zəifləyər                 | vizual + audio kompensasiya (`DECISIONS.md §17`)                                        |
| React Compiler aktivdir (SDK 57 default)    | Reanimated worklet-lərlə kənar hal | Mərhələ 5-6-da gesture ilə birlikdə yoxlanılacaq; problem olarsa config-dən söndürülür  |
