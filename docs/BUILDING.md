# PACK & RELAX — BUILDING

**Status:** Normativ · **Versiya:** 1.0

---

## 1. Texnologiya versiyaları

| | |
|---|---|
| Expo SDK | **57** (`expo@57.0.8`) |
| React Native | 0.86.x |
| Arxitektura | New Architecture (Fabric) — `react-native-reanimated@4` tələbi |
| Node | ≥ 22 (test: v22.13.0) |
| npm | ≥ 10 (test: 10.9.2) |

**Qayda:** bütün Expo paketləri `npx expo install` ilə quraşdırılır — `npm install` yalnız Expo-dan kənar paketlər üçün (`zustand`, `i18n-js`).

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

### Skia web qeydi
React Native Skia web-də CanvasKit (WASM) ilə işləyir. Mərhələ 1-də web bundler konfiqurasiyası yoxlanılmalı və CanvasKit asset-inin yükləndiyi təsdiqlənməlidir. Web-də render fərqi olarsa, **native davranış əsas götürülür**.

### SQLite web qeydi
`expo-sqlite` web-də əlavə konfiqurasiya tələb edir. Bu səbəbdən web-də `WebStorageAdapter` (localStorage) istifadə olunur — `expo-sqlite` web-ə heç vaxt yüklənmir.

---

## 3. EAS profilləri

`eas.json`:

| Profil | Platform | Məqsəd | Distribution |
|---|---|---|---|
| `development` | android, ios | dev client | internal |
| `preview` | android, ios | cihaz testi | internal (APK / ad-hoc) |
| `production` | android, ios | store | store (AAB / IPA) |

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

| Sahə | Dəyər |
|---|---|
| `name` | Pack & Relax *(müvəqqəti)* |
| `slug` | `pack-and-relax` |
| `orientation` | `portrait` |
| `scheme` | `packandrelax` |
| `android.package` | `com.alkha.packandrelax` |
| `ios.bundleIdentifier` | `com.alkha.packandrelax` |
| `newArchEnabled` | `true` |
| `userInterfaceStyle` | `light` |

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

| Addım | Nə vaxt lazımdır |
|---|---|
| Expo (EAS) hesabına giriş | ilk `eas build`-dən əvvəl |
| GitHub hesabına giriş / repo yaradılması | Mərhələ 1 |
| Apple Developer hesabı ($99/il) və giriş | iOS preview / TestFlight (Mərhələ 22) |
| Google Play Developer hesabı ($25 birdəfəlik) | Android store submit (Mərhələ 23) |
| İki mərhələli təsdiq kodları | hesab girişlərində |
| Hüquqi müqavilələrin qəbulu | developer hesabı yaradılışında |
| Fiziki telefonda vizual və toxunma testi | Mərhələ 12, 22, 24 |

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

| Risk | Təsir | Azaldılma |
|---|---|---|
| Skia web CanvasKit konfiqurasiyası | web preview axını dayanar | Mərhələ 1-də erkən yoxlanılır; native əsasdır |
| Reanimated 4 New Arch tələbi | köhnə arch ilə build sınar | `newArchEnabled: true` təsbit edilib |
| SDK 57 yenidir (sdk-56 daha çox patch alıb) | ekosistem uyğunsuzluğu | bütün expo-* paketlər 57.x-də mövcuddur; problem olarsa SDK 56-ya geri dönmə planı var |
| Layihə path-ində boşluq (`Pack it`) | bəzi Windows tooling-ində problem | EAS cloud build path-dən asılı deyil; problem çıxarsa layihə boşluqsuz path-ə köçürülür |
| Android haptic keyfiyyəti | əsas vəd zəifləyər | vizual + audio kompensasiya (`DECISIONS.md §17`) |
