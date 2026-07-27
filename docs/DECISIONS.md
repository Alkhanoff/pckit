# PACK & RELAX — DECISIONS

**Status:** Normativ · **Versiya:** 1.0 · **Tarix:** 2026-07-28

Bu sənəd layihənin **yeganə normativ qərar mənbəyidir**.

`docs/reference/` altındakı sənədlər (`Game-Intro.txt`, `Gameplay.txt`, `Technical.txt`, `Steps.txt`, `Pack_and_Relax_DECISIONS.md`) **izahedici (non-normative)** statusdadır. Onlarla bu sənəd arasında ziddiyyət olarsa, bu sənəd əsas götürülür.

Konkret rəqəmlər və formullar üçün: [`docs/BALANCE.md`](BALANCE.md).
Mərhələ ardıcıllığı üçün: [`docs/ROADMAP.md`](ROADMAP.md).

---

## 0. Qərar mənbələrinin iyerarxiyası

```
1. src/config/*.ts          ← runtime həqiqət (kod)
2. docs/BALANCE.md          ← rəqəmlərin normativ mənbəyi
3. docs/DECISIONS.md        ← dizayn və arxitektura qərarları (bu sənəd)
4. docs/ROADMAP.md          ← icra ardıcıllığı
5. docs/reference/*         ← izahedici, tarixi kontekst
```

Kod və `BALANCE.md` ayrılarsa, `BALANCE.md` yenilənir və commit-də qeyd edilir.

---

## 1. Tək həqiqət mənbəyi

Normativ runtime dəyərləri yalnız bu fayllarda saxlanılır:

| Fayl | Məzmun |
|---|---|
| `src/config/balance.ts` | scoring çəkiləri, formul limitləri, tension bandları, defect cəzaları |
| `src/config/progression.ts` | reputasiya hədləri, coin qiymətləri, unlock qaydaları |
| `src/config/gameplay.ts` | state machine limitləri, timing, kamera |
| `src/data/products.ts` | `ProductDefinition[]` |
| `src/data/materials.ts` | `MaterialDefinition[]` |
| `src/data/recipes.ts` | `PackagingRecipe[]` |
| `src/data/orders.ts` | sifariş şablonları və ardıcıllıq |

Heç bir balans rəqəmi komponent və ya feature faylında hardcode edilmir.
Bütün testlər həmin config-lərdən import edir — testlərdə rəqəm təkrarlanmır.

---

## 2. Scoring terminologiyası

Üç scoring oxu vardır. Dördüncü ox yoxdur.

| Internal field | UI (en, MVP) | UI (az, sonra) | Nəyi ölçür |
|---|---|---|---|
| `presentationScore` | Presentation | Səliqə | qırış, hava qabarcığı, simmetriya, etiket/möhür düzgünlüyü, vizual təmizlik |
| `protectionScore` | Protection | Qoruma | zona coverage, seal, həssas zonalar, material uyğunluğu |
| `efficiencyScore` | Efficiency | Səmərəlilik | istifadə olunan material, artıq qat, tullantı |

Müştəri prioritetləri **eyni üç termini** istifadə edir: `presentation` \| `protection` \| `efficiency`.

> **Qeyd:** `Pack_and_Relax_DECISIONS.md` §2 "Presentation" oxunun az UI adını "Səliqə" kimi verir. MVP UI dili English olduğu üçün ekranda `Presentation` yazılır; "Səliqə" yalnız gələcək `az` localization faylındakı dəyərdir.

---

## 3. Coverage və wrap zonaları

Zona sxemi **recipe-ə məxsusdur**, məhsula deyil. Hər `PackagingRecipe` özündə saxlayır:
`requiredZones`, `zoneWeights`, `coverageTarget`, `wrapPasses`.

### Telefon qutusu + streç film (tutorial / vertical slice)

| Zona | Çəki | Pass |
|---|---:|---|
| front | 20 | 1 + 2 (reinforcement) |
| back | 20 | 1 + 2 (reinforcement) |
| left | 15 | 1 |
| right | 15 | 1 |
| top | 15 | 2 |
| bottom | 15 | 2 |
| **Cəmi** | **100** | |

- **Pass 1 — horizontal wrap:** front, back, left, right (çəki cəmi 70)
- **Pass 2 — vertical wrap:** top, bottom + front/back əlavə qat (çəki cəmi 30)
- Pass 1 tamamlandıqda məhsul avtomatik 90° fırlanır.

Protection = zonaların çəkili coverage nəticəsi. Yalnız Pass 1 ilə maksimum **70** alınır → Perfect (`protection ≥ 90`) üçün Pass 2 məcburidir. Bu, əvvəlki spesifikasiyadakı "Perfect riyazi olaraq mümkünsüz" problemini həll edir.

Oyunçu **görmədiyi zonaya görə xəbərsiz cəzalandırılmır** (bax §4).

---

## 4. Inspection mərhələsi

`sealing` → **`inspecting`** → `repairing` → `completed` → `result`

`inspecting` state-i:
- 2.5 saniyə avtomatik dönüş; ön → sağ → arxa → sol → üst → alt;
- qüsurlu zonalar yumşaq halo ilə vurğulanır;
- skip edilə bilər (tap);
- audio: yüngül ambient sweep, haptic yoxdur.

Bu mərhələ həm ədalətli scoring üçün, həm də final reveal kimi lazımdır.

---

## 5. Material uyğunluğu recipe əsaslıdır

Uyğunluq `product × material` cütündən deyil, **recipe + sifarişin məqsədindən** hesablanır.

`PackagingRecipe.suitability` üç dəyər alır:

| Dəyər | Protection multiplikatoru | Mənası |
|---|---:|---|
| `ideal` | 1.00 | sifarişin məqsədinə tam uyğun |
| `alternative` | 0.90 | işləyir, amma optimal deyil |
| `poor` | 0.75 | uyğunsuz seçim |

**Tutorial sifarişi (telefon qutusu + streç film) = `ideal`.**
Sifarişin məqsədi: *tozdan və səthi cızıqdan qoruma + səliqəli rəf görünüşü*.
Bu sifarişdə material cəzası yoxdur və yeni oyunçu Perfect ala bilər.

Telefon qutusu üçün bubble wrap ayrıca **kuryer/daşınma** sifarişində `ideal` sayılır.

Yanlış material heç vaxt gameplay-i bloklamır — yalnız `protectionScore`-a təsir edir.

---

## 6. Nəticə səviyyələri

### Perfect — bütün şərtlər ödənməlidir
- `overall` 90–100
- `presentationScore` ≥ 90
- `protectionScore` ≥ 90
- `efficiencyScore` ≥ 85
- açıq **critical defect** sayı = 0

### Good
- `overall` 70–89
- critical defect ola bilər

### Acceptable
- `overall` 0–69
- sifariş bloklanmır, progression dayanmır, yalnız mükafat azalır

Sifariş **heç vaxt** uğursuz sayılmır. "Fail" state-i mövcud deyil.

---

## 7. Critical vs minor defect

**Critical** (Perfect-i bloklayır):
- tələb olunan ümumi coverage < 80%
- əsas seal / film ucu bağlanmayıb
- vacib qoruma zonası tam açıqdır (coverage < 25%)
- həssas zona (parfüm şüşəsi, qapaq) qorunmayıb
- paket açıqdır, məhsul çıxa bilər

**Minor** (bal azaldır, Perfect-i avtomatik bloklamır):
- kiçik qırış
- kiçik hava qabarcığı
- yüngül asimmetriya
- etiket/möhürün azca əyriliyi
- optimaldan bir qədər artıq material
- overstretch nəticəsində nazilmiş film

---

## 8. Material istifadəsi

Real ölçü vahidi yoxdur. Hər recipe normallaşdırılmış `targetMaterialUnits` istifadə edir.

Telefon qutusu + streç film: `target = 100 units`, optimal aralıq **90–110**, optimal pass sayı **2**.

**Tension birbaşa material sərfini dəyişir** (ayrıca cəza yoxdur — səbəb-nəticə zənciri təbii qalır):

| Tension | Unit sərfi | Yan təsir |
|---|---:|---|
| Loose | ×1.35 | qırış ehtimalı ↑ |
| Optimal | ×1.00 | — |
| Overstretched | ×0.85 | nazilmiş film → presentation ↓, protection ↓ |

Bu, real trade-off yaradır: overstretch efficiency-ni yaxşılaşdırır, amma digər iki oxu pisləşdirir.

Dəqiq əyrilər: [`BALANCE.md §5`](BALANCE.md).

---

## 9. Reputasiya

Baza: **10 reputasiya / tamamlanmış sifariş**, nəticə multiplikatoru ilə:

| Nəticə | Multiplikator | Reputasiya |
|---|---:|---:|
| Perfect | ×1.5 | 15 |
| Good | ×1.0 | 10 |
| Acceptable | ×0.7 | 7 |

Tam ədədə yuvarlaqlaşdırılır. Reputasiya **xərclənmir**. Zen Mode reputasiya vermir.

---

## 10. Coin və reputasiya fərqli funksiya daşıyır

| Sistem | Funksiya |
|---|---|
| **Reputasiya** | kontentin *görünməsi* — sifariş kateqoriyaları və mağaza rəflərinin açılması |
| **Coin** | görünən materialın və workshop upgrade-lərinin *satın alınması* |

Eyni kontent iki dəfə kilidlənmir:
- **Məhsul sifarişləri** yalnız reputasiya ilə açılır, coin tələb etmir.
- **Materiallar** reputasiya həddindən sonra mağazada görünür və coin ilə alınır.
- **Workshop** yalnız coin ilə alınır, reputasiya tələb etmir.

Cədvəllər: [`BALANCE.md §8–9`](BALANCE.md).

---

## 11. Bubble pop

Tamamilə optional. Scoring-ə, coin-ə və reputasiyaya **təsir etmir**. Yalnız ASMR feedback-dir.
Oyunçu heç bir qabarcıq partlatmadan Perfect ala bilər.

> Bu qərar `Steps.txt` Mərhələ 13-dəki "bubble-specific scoring" tələbini ləğv edir. Bubble wrap-ın öz scoring-i **qatlama simmetriyası və lent mövqeyi** üzərindən gəlir, pop üzərindən yox.

---

## 12. Jumbo rulon → Post-MVP

Jumbo səhnəsi və material ehtiyatı sistemi **MVP Definition of Done-dan çıxarılıb**.

- `useInventoryStore` scaffold kimi yaradılır, amma MVP-də gameplay-ə təsir etmir;
- material ehtiyatı sifarişi bloklamır, enerji sistemi kimi işləmir;
- `Steps.txt` Mərhələ 19 → `Post-MVP / Stretch Goal`.

---

## 13. Recipe hədəf müddətləri

Vaxt limiti **yoxdur**. Bunlar yalnız dizayn hədəfləridir.

| Recipe | Hədəf |
|---|---|
| Telefon qutusu + streç | 30–60 s |
| Telefon qutusu + bubble wrap | 40–70 s |
| Yemək qabı + streç | 30–60 s |
| Yemək qabı + folqa | 40–70 s |
| Parfüm + bubble wrap | 50–80 s |
| Hədiyyə qutusu + premium kağız | 60–90 s |

---

## 14. Gesture ↔ domain sərhədi

Davamlı koordinatlar və animasiya dəyərləri **UI thread-də qalır** (Reanimated shared values).
Zustand-a və React state-ə heç vaxt yazılmır.

JS domain qatına yalnız bu **diskret intent hadisələri** göndərilir:

```
materialGrabbed      materialReleased     tensionStateChanged
wrapZoneCompleted    wrapPassCompleted    cutCompleted
sealPlaced           inspectionCompleted  defectDetected
defectRepaired       recipeCompleted
```

Qaydalar:
- `runOnJS` hər frame çağırılmır;
- `tensionStateChanged` yalnız band dəyişdikdə (loose↔optimal↔overstretched) atılır, ≥120 ms debounce ilə;
- hadisələr `GameplayIntent` union tipi kimi `src/domain/gameplay/intents.ts` faylında saxlanılır;
- state machine yalnız intent qəbul edir, raw koordinat qəbul etmir.

---

## 15. Storage adapteri

```
StorageAdapter (interface)
├── SqliteStorageAdapter    → Android / iOS  (expo-sqlite)
├── WebStorageAdapter       → web preview    (localStorage, JSON snapshot)
└── MemoryStorageAdapter    → Jest testləri
```

- UI və gameplay kodu implementasiyanı tanımır, yalnız repository çağırır;
- adapter seçimi `Platform.OS` əsasında `src/services/storage/index.ts`-də bir dəfə edilir;
- schema versiyası və migration siyahısı hər iki native/web adapterdə eyni məntiqlə işləyir;
- **pozulmuş save:** backup faylı saxlanılır, default profil yaradılır, tətbiq çökmür, `console.warn` verilir.

**Save yazma nöqtələri:** sifariş tamamlandıqda, settings dəyişdikdə, satınalma edildikdə, tutorial addımı bitdikdə. Gameplay ortasında save yoxdur.

Web preview yalnız vizual və məntiq testi üçündür — native performansı və haptic keyfiyyətini əvəz etmir.

---

## 16. Test konfiqurasiyası

Mərhələ 1-də qurulur (sonraya saxlanılmır):

- `@shopify/react-native-skia/jest` mock
- `react-native-reanimated` mock + `react-native-worklets` jest setup
- `react-native-gesture-handler/jestSetup`
- `expo-haptics`, `expo-audio` manual mock-ları
- `MemoryStorageAdapter`

Əsas test yükü **pure TypeScript** qatındadır: scoring, state machine, recipe validation, progression, unlock, reputation, reward, defect qaydaları, storage migration.
Skia render testi aparılmır — yalnız smoke render.

---

## 17. Android haptic fallback

Android-də haptic tipləri arasında fərq zəif hiss oluna bilər. Gameplay **yalnız haptic-ə əsaslanmır**.
Hər haptic event-i eyni zamanda ən azı bir vizual və bir audio siqnalla müşayiət olunur:

- qısa scale/highlight micro-animation;
- tension indikatorunda **forma** dəyişməsi (yalnız rəng yox — accessibility tələbi);
- materiala uyğun audio.

---

## 18. Audio variasiyası

Real-time pitch shifting MVP-də istifadə edilmir (platformalar arası davranış qeyri-stabil).

Əvəzinə:
- hər təkrarlanan action üçün **2–3 audio variant**, növbə ilə/təsadüfi seçim;
- ±10% volume modulyasiyası;
- lazım olduqda ±5% playback rate.

Audio davranışı platformalar arasında fərqlənərsə gameplay pozulmur.

---

## 19. Lokalizasiya

Stack: `expo-localization` + `i18n-js`.
İlk dil: **English**. Sonrakılar: Azerbaijani, Turkish, Russian.
Bütün görünən mətn localization key ilə idarə edilir; komponentdə hardcode string qadağandır (ESLint qaydası ilə yoxlanılır).

---

## 20. Analytics və env

- Xarici analytics provider MVP-də **yoxdur**; `src/services/analytics/` qovluğu yaradılmır.
- Lazım olarsa yalnız lokal debug event logger (`__DEV__` altında).
- `.env.example` real environment dəyişəni yaranana qədər yaradılmır.

---

## 21. Texnologiya versiyaları (Mərhələ 0-da təsbit edilib)

| | |
|---|---|
| Expo SDK | **57** (`expo@57.0.8`) |
| React Native | 0.86.x |
| Arxitektura | New Architecture (Fabric) — Reanimated 4 tələbi |
| Node | ≥ 22 |

Paketlər `npx expo install` ilə quraşdırılır. Manual `npm install` yalnız Expo-dan kənar paketlər üçün (zustand, i18n-js).

---

## 22. MVP Definition of Done (yenilənmiş)

**Məhsullar:** telefon qutusu, parfüm, hədiyyə qutusu, yemək qabı
**Materiallar:** streç film, bubble wrap, premium kağız, alüminium folqa
**Rejimlər:** Orders, Zen Mode

**Sistemlər:** gesture layer · state machine · inspection · defect + repair · 3-oxlu scoring · coin · reputasiya · progression · lokal save (native + web) · tutorial · audio · haptic · workshop (vizual) · settings · Android preview build · iOS build konfiqurasiyası

**Çıxarılıb:** jumbo rulon səhnəsi, material ehtiyatı gameplay-i.

---

## 23. Vertical slice qəbul şərtləri

Telefon qutusu + streç film slice-ı yalnız hamısı işlədikdə tamamlanmış sayılır:

- [ ] tutorial sifarişində material cəzası yoxdur
- [ ] iki wrap pass işləyir
- [ ] bütün tələb olunan zonalar 100%-ə çata bilir
- [ ] avtomatik 90° dönüş axıcıdır
- [ ] inspection rotation bütün zonaları göstərir
- [ ] critical və minor defect fərqlənir
- [ ] oyunçu Perfect nəticə ala bilir
- [ ] reward və reputation düzgün hesablanır
- [ ] progress save edilir və restart-dan sonra qalır
- [ ] web preview console error-suz açılır
- [ ] Android preview build telefonda test edilib
- [ ] gameplay haptic söndürülmüş halda da aydın hiss edilir

---

## 24. Əsas qərar

Oyunun məqsədi real qablaşdırma fizikasını simulyasiya etmək deyil.

> Oyunçunun hər toxunuşuna dərhal cavab verən, **ədalətli** scoring sistemi olan, rahatlaşdırıcı və vizual olaraq qənaətbəxş qablaşdırma illüziyası yaratmaq.

---

## Əlavə A — Bu sənəddə əlavə həll edilmiş məsələlər

`Pack_and_Relax_DECISIONS.md`-də açıq qalan və burada qərara bağlanan məsələlər:

| # | Məsələ | Qərar |
|---|---|---|
| A1 | Üç oxun `overall`-a çəkisi | müştəri prioritetinə görə dəyişən çəki dəsti — `BALANCE.md §1` |
| A2 | Düzəldilmiş qüsurun qalıq cəzası | cəzanın **80%-i geri qaytarılır**, 20% qalır — `BALANCE.md §3` |
| A3 | Tension bandlarının ədədi sərhədləri | 0.35 / 0.75 — `BALANCE.md §2` |
| A4 | Qüsur yaranma şərtləri | deterministik trigger cədvəli — `BALANCE.md §6` |
| A5 | Təsadüfi qüsur | MVP-də **0%** (`randomDefectChance: 0`) |
| A6 | Coin formulu və priority bonusu | `BALANCE.md §7` |
| A7 | Zen Mode-un save-ə təsiri | yalnız settings save edilir, progress toxunulmur |
| A8 | Save yazma nöqtələri | §15 |
| A9 | Expo SDK versiyası | 57 |
| A10 | UI dili vs scoring adları | UI English, "Səliqə" yalnız az localization |
