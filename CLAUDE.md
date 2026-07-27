# CLAUDE.md

Bu fayl Claude Code üçün layihə qaydalarıdır. Hər sessiyanın əvvəlində oxunur.

---

## Layihə

**Pack & Relax** — React Native / Expo ilə hazırlanan 2.5D satisfying mobil qablaşdırma oyunu.
Oyunçu məhsulları toxunma hərəkətləri ilə qablaşdırır: dartır, sarıyır, kəsir, yapışdırır, qüsurları düzəldir.

---

## Sənəd iyerarxiyası

Ziddiyyət olarsa yuxarıdakı qalib gəlir:

1. `src/config/*.ts` — runtime həqiqət
2. `docs/BALANCE.md` — bütün rəqəmlər və formullar
3. `docs/DECISIONS.md` — dizayn və arxitektura qərarları
4. `docs/ROADMAP.md` — mərhələ ardıcıllığı
5. `docs/ARCHITECTURE.md` — qat modeli və struktur
6. `docs/reference/*` — **izahedici, normativ deyil**

`docs/reference/` altındakı `Game-Intro.txt`, `Gameplay.txt`, `Technical.txt`, `Steps.txt` tarixi kontekstdir. Onlardakı rəqəmlər köhnəlib — `BALANCE.md` istifadə et.

---

## İş qaydası

Hər mərhələdə:

1. Mövcud kodu analiz et
2. Faylları yarat/dəyiş
3. `npm run typecheck` → `npm run lint` → `npm test`
4. Web preview yoxla (console error = 0)
5. Error-ları özün düzəlt
6. `ROADMAP.md`-dəki keçid qapısını yoxla
7. Git commit
8. Keçirsə növbəti mərhələyə keç

**İstifadəçidən terminal əmri işlətməyi, kod yazmağı, fayl yaratmağı və ya dependency quraşdırmağı istəmə.**

İstifadəçi müdaxiləsi yalnız bunlarda: hesab girişləri (Expo/GitHub/Apple/Google), 2FA, developer hesabı ödənişi, hüquqi müqavilə, credential/API key, fiziki cihaz testi.

Hesabat formatı: nə hazırlandı · əsas fayllar · test nəticələri · qalan məhdudiyyətlər · istifadəçidən tələb olunan. Tam fayl kodunu chat-də göstərmə.

---

## Dəmir qaydalar

### Arxitektura
- `src/domain/**` təmiz TypeScript — React, Skia, Reanimated, Expo importu **yoxdur**
- `runOnJS` **yalnız** `src/gestures/intentBridge.ts` faylında
- Gesture koordinatları Zustand-a və React state-ə **heç vaxt** yazılmır
- Balans rəqəmi yalnız `src/config/`-dən gəlir — komponentdə hardcode yoxdur
- UI komponenti birbaşa SQL yazmır — repository çağırır
- Görünən mətn hardcode edilmir — localization key istifadə edilir
- Yeni məhsul/material `src/data/` dəyişikliyi ilə əlavə edilir, gameplay kodu dəyişmir

### Texnologiya
- Expo SDK 57, New Architecture aktiv
- Expo paketləri `npx expo install` ilə
- **İstifadə etmə:** Unity, Unreal, Godot, Three.js, R3F, WebView, HTML Canvas, real-time cloth simulation, ağır physics, backend, multiplayer

### Gameplay
- Vaxt limiti yoxdur, enerji sistemi yoxdur, çoxvalyutalılıq yoxdur
- Sifariş **heç vaxt** uğursuz sayılmır — "fail" state-i mövcud deyil
- Yanlış material gameplay-i bloklamır, yalnız bala təsir edir
- Qüsurlar cəza deyil, əlavə satisfying mini-game-dir
- Təsadüfi qüsur MVP-də **0%**
- Oyunçu görmədiyi qüsura görə cəzalandırılmır (buna görə `inspecting` state-i var)

---

## Prioritet sırası

1. Toxunma hissi
2. Vizual reaksiya
3. ASMR audio
4. Axıcı animasiya
5. Stabil gameplay
6. Mobil performans
7. Scoring və progression
8. Workshop
9. Final qrafik polish

> Gözəl görünən natamam demo yox — sadə görünən, amma tam işləyən vertical slice.

---

## Vertical slice qaydası

Telefon qutusu + streç film axını `DECISIONS.md §23`-ə görə tam stabil olmadan **yeni material əlavə etmə**.

---

## Commit qaydası

Conventional commits, Azərbaycan dilində izah yox — ingiliscə qısa mesaj:

```
chore: initialize Expo project
feat: add phone box 2.5D visual
feat: implement stretch film tension bands
fix: prevent gesture state conflict
docs: update balance thresholds
test: add scoring fixtures F1-F3
```

Böyük və əlaqəsiz dəyişiklikləri bir commit-də qarışdırma.

---

## Rəqəm dəyişdirmə proseduru

1. `docs/BALANCE.md` yenilə
2. `src/config/*.ts` yenilə
3. Testləri yenilə (`docs/TESTING.md §4` invariantları)
4. Commit mesajında səbəbi yaz

Config və sənəd ayrılarsa — bu bug-dır, düzəlt.
