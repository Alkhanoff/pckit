# PACK & RELAX — BALANCE

**Status:** Normativ · **Versiya:** 1.0 · **Tarix:** 2026-07-28

Bu sənəd bütün ədədi dəyərlərin və formulların normativ mənbəyidir.
Kod qarşılığı: `src/config/balance.ts`, `src/config/progression.ts`, `src/config/gameplay.ts`.

**Qayda:** burada olmayan rəqəm kodda görünməməlidir. Rəqəm dəyişirsə, əvvəlcə bu sənəd, sonra config, sonra test yenilənir.

---

## 1. Overall score

```ts
overall = round(
  presentationScore * w.presentation +
    protectionScore * w.protection +
    efficiencyScore * w.efficiency,
);
```

Çəki dəsti sifarişin **müştəri prioritetindən** asılıdır:

| `customerPriority`     | `w.presentation` | `w.protection` | `w.efficiency` |
| ---------------------- | ---------------: | -------------: | -------------: |
| `balanced` _(default)_ |             0.35 |           0.40 |           0.25 |
| `protection`           |             0.25 |           0.55 |           0.20 |
| `presentation`         |             0.50 |           0.30 |           0.20 |
| `efficiency`           |             0.25 |           0.35 |           0.40 |

Hər dəst 1.00-ə bərabərdir (test: `sum(weights) === 1`).

> Çəkilər yalnız `overall`-a və mükafata təsir edir. **Perfect qapısı çəkidən asılı deyil** — üç oxun minimumları həmişə eyni qalır. Bu, oyunçunun prioritetdən asılı olmayaraq keyfiyyətli iş görməsini tələb edir.

### Nəticə səviyyələri

| Nəticə         | Şərt                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Perfect**    | `overall ≥ 90` **və** `presentation ≥ 90` **və** `protection ≥ 90` **və** `efficiency ≥ 85` **və** `openCriticalDefects === 0` |
| **Good**       | `overall ≥ 70` (Perfect şərtləri ödənmirsə)                                                                                    |
| **Acceptable** | `overall < 70`                                                                                                                 |

### Yuvarlaqlaşdırma

Hər üç ox balı və `overall` **tam ədəd** kimi saxlanılır (`Math.round`, 0–100 aralığında kəsilir).

Səbəb: Result ekranında göstərilən bal ilə Perfect qapısında yoxlanılan bal **eyni olmalıdır** — "90 göstərib Perfect verməmək" qəbuledilməzdir. Əlavə olaraq float qalığı (`46.000000000000014`) həm testləri, həm də UI-ni pozur.

---

## 2. Tension modeli

Normallaşdırılmış tension `t ∈ [0, 1]`, drag məsafəsi və sürətindən UI thread-də hesablanır.

| Band            | Aralıq            | Haptic                               | Vizual                                                 |
| --------------- | ----------------- | ------------------------------------ | ------------------------------------------------------ |
| `loose`         | `t < 0.35`        | —                                    | film boş, qırış path-ləri görünür, indikator **dairə** |
| `optimal`       | `0.35 ≤ t ≤ 0.75` | `selection` (banda girişdə bir dəfə) | film hamar + specular highlight, indikator **kvadrat** |
| `overstretched` | `t > 0.75`        | `warning` (max 1 / 2 s)              | yumşaq qırmızı halo, indikator **üçbucaq**             |

- Optimal band **40% enindədir** — bilərəkdən geniş, stresssiz dizayn tələbi.
- İndikatorun forması rənglə birlikdə dəyişir (accessibility: yalnız rəngə əsaslanma qadağandır).
- `tensionStateChanged` intent-i yalnız band dəyişəndə, ≥120 ms debounce ilə atılır.
- MVP-də film **cırılmır**.

---

## 3. Presentation score

```
presentation = clamp(100 - Σ penalty, 0, 100)
```

| Defect                                          |            Cəza | Maksimum sayılan | Maks. təsir |
| ----------------------------------------------- | --------------: | ---------------: | ----------: |
| `wrinkle`                                       |               4 |                5 |         −20 |
| `airBubble`                                     |               5 |                4 |         −20 |
| `openCorner` (minor)                            |               6 |                3 |         −18 |
| `looseEnd`                                      |               8 |                2 |         −16 |
| `crookedSeal` / `crookedLabel` / `crookedStamp` |               6 |                3 |         −18 |
| `thinFilm` (overstretch)                        |               5 |                2 |         −10 |
| `excessMaterial`                                |               5 |                1 |          −5 |
| `asymmetry` (fold recipe-ləri)                  | 0–10 (kəsilməz) |                — |         −10 |

### Düzəldilmiş qüsur

```ts
effectivePenalty = repaired ? basePenalty * REPAIR_RESIDUAL : basePenalty;
REPAIR_RESIDUAL = 0.2;
```

Yəni düzəliş cəzanın **80%-ini geri qaytarır**, 20% qalır.

**Səbəb:** tam sıfırlama səliqəli oyunla səliqəsiz+düzəliş oyununu eyniləşdirir və bacarıq ifadəsini öldürür. 20% qalıq isə Perfect-i bloklamayacaq qədər kiçikdir:

> 5 qırış yaradıb hamısını düzəltmək → `5 × 4 × 0.20 = −4` → presentation **96** → Perfect mümkündür ✓
> 5 qırışı düzəltməmək → `−20` → presentation **80** → Perfect bloklanır ✓

### Limitin tətbiq sırası

Bir qrupun limiti (`maksimum sayılan`) daxilində qüsurlar **effektiv cəzaya görə azalan sırada** sayılır. Yəni limit "ən pis N qüsur" deməkdir.

**Səbəb:** əks halda düzəldilmiş qüsurlar limiti "doldurub" düzəldilməmişləri cəzadan qoruyardı və oyunçu qəsdən çox qüsur yaratmaqda maraqlı olardı.

> 5 düzəldilməmiş + 5 düzəldilmiş qırış → yalnız 5 düzəldilməmiş sayılır → `−20` → presentation **80**

---

## 4. Protection score

```ts
zoneCoverage = Σ(zoneWeight[i] * clamp(coverage[i], 0, 1)); // maks 100

protection = clamp((zoneCoverage + sealModifier + sensitiveModifier) * suitability, 0, 100);
```

### Modifikatorlar

| Modifikator                                    | Dəyər |
| ---------------------------------------------- | ----: |
| seal düzgün zonada                             |     0 |
| seal yanlış zonada                             |   −10 |
| seal ümumiyyətlə yoxdur                        |   −25 |
| hər qorunmamış həssas zona (`coverage < 0.50`) |   −15 |

### `suitability` multiplikatoru

| Dəyər         | Multiplikator |
| ------------- | ------------: |
| `ideal`       |          1.00 |
| `alternative` |          0.90 |
| `poor`        |          0.75 |

### Telefon qutusu + streç film — zona çəkiləri

| Zona   | Çəki | Pass |
| ------ | ---: | ---- |
| front  |   20 | 1, 2 |
| back   |   20 | 1, 2 |
| left   |   15 | 1    |
| right  |   15 | 1    |
| top    |   15 | 2    |
| bottom |   15 | 2    |

**Yoxlama:** yalnız Pass 1 → `zoneCoverage = 70` → Perfect (≥90) mümkün deyil.
Hər iki pass + düzgün seal + `ideal` → `100` ✓

---

## 5. Efficiency score

```ts
u = materialUnitsUsed / targetMaterialUnits; // hədəf: u = 1.00
```

| Aralıq            | Formul                                | Sərhəd dəyərləri         |
| ----------------- | ------------------------------------- | ------------------------ |
| `0.90 ≤ u ≤ 1.10` | `100`                                 | —                        |
| `1.10 < u ≤ 1.25` | `100 - ((u-1.10)/0.15) * 30`          | u=1.25 → 70              |
| `u > 1.25`        | `max(0, 70 - ((u-1.25)/0.25) * 40)`   | u=1.50 → 30, u=1.75 → 0  |
| `u < 0.90`        | `max(40, 100 - ((0.90-u)/0.20) * 25)` | u=0.70 → 75, u=0.50 → 50 |

Az material istifadəsi efficiency-də yumşaq cəzalanır, çünki coverage itkisi artıq `protection`-ı sərt cəzalandırır — ikiqat cəza olmamalıdır.

### Material sərfi

```ts
materialUnitsUsed += (dragDelta / referenceDragDistance) * 100 * tensionFactor;
```

`referenceDragDistance` = optimal tension ilə 2 pass-ı tamamlamaq üçün lazım olan ümumi drag məsafəsi.
Bu normallaşdırma `target = 100 units`-i **tərifə görə** doğru edir.

| Tension         | `tensionFactor` |
| --------------- | --------------: |
| `loose`         |            1.35 |
| `optimal`       |            1.00 |
| `overstretched` |            0.85 |

**Trade-off:** overstretch material qənaət etdirir, amma `thinFilm` qüsuru yaradaraq presentation və protection-ı pisləşdirir.

### Recipe hədəfləri

| Recipe                   | `targetMaterialUnits` | Optimal pass |
| ------------------------ | --------------------: | -----------: |
| phone-box + stretch-film |                   100 |            2 |
| phone-box + bubble-wrap  |                   110 |  1 (qatlama) |
| perfume + bubble-wrap    |                   130 |            1 |
| gift-box + premium-paper |                   120 |            1 |
| food-tray + foil         |                   100 |            1 |
| food-tray + stretch-film |                    80 |            1 |

---

## 6. Qüsur yaranma qaydaları

Bütün triggerlər **deterministikdir**. `randomDefectChance = 0` (MVP).

| Defect             | Trigger                                                          | Severity                           |
| ------------------ | ---------------------------------------------------------------- | ---------------------------------- |
| `wrinkle`          | zona tamamlanır, həmin zonadakı orta tension `loose` bandındadır | minor                              |
| `thinFilm`         | tension fasiləsiz > 1.2 s `overstretched` bandındadır            | minor                              |
| `airBubble`        | zona tamamlanır, drag path-ın yan sapması > zona eninin 18%-i    | minor                              |
| `openCorner`       | **pass bağlanır**, zonanın örtülməsi < 90%                       | minor (≥25%) / **critical** (<25%) |
| `looseEnd`         | `cutCompleted` sonra `sealPlaced` yoxdur                         | **critical**                       |
| `looseEnd`         | seal zonadan kənarda yerləşdirilib                               | minor                              |
| `excessMaterial`   | `u > 1.25`                                                       | minor                              |
| `crookedSeal`      | seal bucaq sapması > 12°                                         | minor                              |
| `asymmetry`        | qatlama recipe-lərində sol/sağ fold fərqi > 8%                   | minor (davamlı 0–10)               |
| `coverageCritical` | ümumi çəkili coverage < 80%                                      | **critical**                       |

### Trigger anları

Qüsurlar iki fərqli anda yoxlanılır və bu fərq vacibdir:

| An                     | Yoxlanan                             |
| ---------------------- | ------------------------------------ |
| **Zona sarımı bitir**  | `wrinkle`, `airBubble`               |
| **Pass bağlanır**      | `openCorner`                         |
| Overstretch davam edir | `thinFilm`                           |
| Seal qoyulur           | `looseEnd`, `crookedSeal`            |
| Sessiya bitir          | `excessMaterial`, `coverageCritical` |

`openCorner` zona sarımı bitəndə YOX, **pass bağlananda** yoxlanılır. Səbəb: zona 40%-də ikən qüsur yaratmaq səhv olardı — oyunçu həmin zonaya qayıdıb tamamlaya bilər. Qüsur yalnız zona artıq bərpa edilə bilməyəndə yaranır.

### Düzəltmə gesture-ləri

| Defect           | Gesture                             | Uğur şərti                                |
| ---------------- | ----------------------------------- | ----------------------------------------- |
| `wrinkle`        | qırış path-i üzərində swipe         | swipe path-ın ≥70%-i qırış zonasına düşür |
| `airBubble`      | qabarcıqdan kənara doğru drag       | drag ≥ 40 px, kənara doğru istiqamət ±45° |
| `openCorner`     | küncə doğru material drag           | zona coverage ≥ 90%-ə çatır               |
| `looseEnd`       | ucu seal zonasına drag + release    | release nöqtəsi seal zonası daxilində     |
| `excessMaterial` | artıq material üzərində kəsim swipe | swipe kəsim xəttini keçir                 |
| `crookedSeal`    | seal-i tutub fırlatmaq              | bucaq sapması ≤ 5°                        |

Hər uğurlu düzəlişdə: qısa ASMR səsi + `selection` haptic + yumşaq parıltı.
Uğursuz cəhd **cəzalandırılmır**, sadəcə effekt vermir.

---

## 7. Mükafat

```ts
coin = round(baseReward * resultMultiplier * priorityBonus);
reputation = round(10 * resultMultiplier);
```

| Nəticə     | `resultMultiplier` | Coin (baza 100) | Reputasiya |
| ---------- | -----------------: | --------------: | ---------: |
| Perfect    |                1.5 |             150 |         15 |
| Good       |                1.0 |             100 |         10 |
| Acceptable |                0.7 |              70 |          7 |

**`priorityBonus`** = `1.10` — əgər müştərinin prioritet oxu ≥ 90 baldırsa; əks halda `1.00`.
`balanced` prioritetdə bonus yalnız hər üç ox ≥ 90 olduqda verilir.

### Sifariş baza mükafatları

| Recipe                   | `baseReward` |
| ------------------------ | -----------: |
| phone-box + stretch-film |          100 |
| phone-box + bubble-wrap  |          130 |
| food-tray + stretch-film |          140 |
| food-tray + foil         |          160 |
| perfume + bubble-wrap    |          180 |
| gift-box + premium-paper |          220 |

**Zen Mode:** coin = 0, reputation = 0, progress save edilmir.

---

## 8. Progression — reputasiya hədləri

| Reputasiya | Açılan                                                                      |
| ---------: | --------------------------------------------------------------------------- |
|          0 | telefon qutusu sifarişləri + streç film (başlanğıc)                         |
|         50 | bubble wrap **mağazada görünür**                                            |
|        100 | parfüm sifarişləri                                                          |
|        250 | premium kağız **mağazada görünür**                                          |
|        300 | hədiyyə qutusu sifarişləri                                                  |
|        500 | folqa **mağazada görünür**                                                  |
|        600 | yemək qabı sifarişləri                                                      |
|       1000 | premium müştəri sifarişləri _(tuning namizədi — playtest uzun gələrsə 800)_ |

Məhsul sifarişləri **yalnız** reputasiya ilə açılır, coin tələb etmir.

---

## 9. Progression — coin qiymətləri

### Materiallar

| Material        |          Coin | Reputasiya şərti |
| --------------- | ------------: | ---------------: |
| Streç film      | 0 (başlanğıc) |                0 |
| Bubble wrap     |           500 |               50 |
| Premium kağız   |         1,000 |              250 |
| Alüminium folqa |         1,500 |              500 |

### Workshop

| Səviyyə |          Coin |
| ------- | ------------: |
| Level 1 | 0 (başlanğıc) |
| Level 2 |         1,500 |
| Level 3 |         3,000 |
| Level 4 |         4,500 |

**Ümumi xərc: 12,000 coin.**

### Yoxlanmış iqtisadiyyat əyrisi

|                                               |                                |
| --------------------------------------------- | ------------------------------ |
| Orta baza mükafat                             | ~150                           |
| Orta effektiv mükafat (Good/Perfect qarışığı) | ~180 coin / sifariş            |
| Hər şeyi açmaq                                | **~66 sifariş** ≈ 70–75 dəqiqə |
| İlk unlock (bubble wrap, 500 coin + 50 rep)   | ~4 sifariş ≈ 4 dəqiqə          |
| Sonuncu məhsul (yemək qabı, 600 rep)          | ~52 sifariş                    |
| Reputasiya 1000                               | ~87 sifariş                    |

Coin əyrisi reputasiya əyrisindən sürətlidir — bu **qəsdəndir**: oyunçu materialı reputasiya həddinə çatan kimi ala bilir, coin darboğaz olmur.

---

## 10. Sifariş axını

- İlk **6 sifariş** sabit ardıcıllıqdadır (öyrənmə əyrisi):
  1. telefon qutusu + streç film _(tutorial)_
  2. telefon qutusu + bubble wrap
  3. parfüm + bubble wrap
  4. hədiyyə qutusu + premium kağız
  5. yemək qabı + folqa
  6. yemək qabı + streç film
- Sonra sifarişlər açılmış recipe pool-undan təsadüfi seçilir.
- Orders ekranında eyni anda **3 sifariş** göstərilir.
- Eyni recipe ardıcıl iki dəfə təklif edilmir.
- Sifariş tamamlandıqda yerinə yenisi gəlir.

Sifariş kartında göstərilir: məhsul · tövsiyə olunan material · müştəri prioriteti · baza mükafat.

---

## 11. Coverage irəliləməsi

- Zona 100%-ə çatır: həmin zonanın ekran eninin **1.2 misli** drag məsafəsindən sonra.
- Coverage yalnız drag istiqaməti zonanın wrap oxu ilə **±35°** daxilində üst-üstə düşdükdə artır.
- Zona 100%-i keçdikdə əlavə qat sayılır (`layers++`) və material sərfi davam edir — bu, `excessMaterial` mənbəyidir.
- Pass tamamlanma şərti: həmin pass-ın bütün zonaları ≥ 90%.

---

## 12. Timing və kamera

| Parametr                      |                       Dəyər |
| ----------------------------- | --------------------------: |
| Avtomatik 90° dönüş           | 600 ms, `Easing.out(cubic)` |
| Inspection rotation           |   2500 ms, skip edilə bilər |
| Kəsim zoom-in                 |          350 ms, scale 1.25 |
| Seal zoom-in                  |          350 ms, scale 1.20 |
| Repair zoom-in                |          300 ms, scale 1.30 |
| Kamera bucağı (elevation)     |                   sabit 40° |
| Kamera azimutu                |                   sabit 25° |
| Result ekranı bal animasiyası |        800 ms, ardıcıl 3 ox |

**Azimut nə üçün 0 deyil:** 0° olsaydı yalnız ön və üst səth görünərdi və qutu yastı görünərdi. 25° yan səthi də açır — üç səth eyni anda görünür və həcm illüziyası yaranır. Görünürlük backface culling ilə hesablanır, ona görə inspection dönüşü (Mərhələ 9) istənilən bucaqda düzgün işləyir.

---

## 13. Test fixtures (normativ nümunələr)

Bu üç ssenari `scoring.test.ts` faylında birbaşa istifadə edilməlidir.

### F1 — Perfect

```
recipe: phone-box + stretch-film, priority: balanced, suitability: ideal
zones: hamısı 1.00 · seal: correct · units: 100 (u=1.00)
defects: 5 × wrinkle, hamısı repaired
→ presentation 96 · protection 100 · efficiency 100
→ overall = round(96*0.35 + 100*0.40 + 100*0.25) = round(98.6) = 99
→ Perfect · coin = round(100 * 1.5 * 1.10) = 165 · reputation = 15
```

### F2 — Good (yalnız Pass 1)

```
zones: front/back/left/right 1.00, top/bottom 0.00 · seal: correct · units: 70 (u=0.70)
defects: yoxdur
→ presentation 100 · protection 70 · efficiency 75
→ overall = round(100*0.35 + 70*0.40 + 75*0.25) = round(81.75) = 82
→ Good (protection < 90) · coin = 100 · reputation = 10
```

### F3 — Acceptable (loose + seal yoxdur)

```
zones: hamısı 0.85 · seal: missing · units: 140 (u=1.40)
defects: 6 × wrinkle (5 sayılır, düzəldilməyib), 1 × looseEnd (critical)
→ presentation = 100 - 20 - 8 = 72
→ protection = (85 - 25 + 0) * 1.00 = 60
→ efficiency = 70 - ((1.40-1.25)/0.25)*40 = 70 - 24 = 46
→ overall = round(72*0.35 + 60*0.40 + 46*0.25) = round(60.7) = 61
→ Acceptable · coin = 70 · reputation = 7
```

---

## 14. Config faylları arasında bölgü

| Fayl                        | Bu sənəddəki bölmələr                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `src/config/balance.ts`     | §1 çəkilər, §1 nəticə hədləri, §2 tension, §3 cəzalar, §4 modifikatorlar, §5 efficiency əyriləri, §6 defect triggerləri |
| `src/config/progression.ts` | §7 mükafat, §8 reputasiya, §9 coin                                                                                      |
| `src/config/gameplay.ts`    | §11 coverage, §12 timing/kamera, §10 sifariş axını                                                                      |
| `src/data/recipes.ts`       | §4 zona çəkiləri, §5 recipe hədəfləri, §7 baza mükafatlar                                                               |
