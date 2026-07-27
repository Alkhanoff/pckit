# PACK & RELAX
## Normativ Gameplay və Texniki Qərarlar

Bu sənəd Game Intro, Gameplay, Technical və Steps sənədlərindəki ziddiyyətləri aradan qaldıran **əsas qərar sənədidir**.

Rəqəmlər, scoring formulları, unlock şərtləri və gameplay limitləri implementasiya zamanı yalnız kod daxilindəki mərkəzi config fayllarında saxlanmalıdır. Digər sənədlər izahedici xarakter daşıyır.

---

# 1. Tək həqiqət mənbəyi

Normativ məlumatlar aşağıdakı fayllarda saxlanmalıdır:

- `src/config/balance.ts`
- `src/config/progression.ts`
- `src/data/products.ts`
- `src/data/materials.ts`
- `src/data/orders.ts`
- `src/data/recipes.ts`

Sənədlərdəki rəqəmlər bu config faylları ilə ziddiyyət təşkil edərsə, **kod config-i əsas qəbul edilir**.

Development mərhələlərinin əsas və yeganə mənbəyi:

- `Steps.txt`

Technical sənədində ayrıca təkrarlanan mərhələ siyahısı saxlanmamalıdır. Orada yalnız arxitektura və texnologiya qaydaları qalmalıdır.

---

# 2. Scoring terminləri

Oyunda üç əsas scoring oxu olacaq:

1. **Presentation** — UI-də Azərbaycan dilində “Səliqə”
2. **Protection** — UI-də “Qoruma”
3. **Efficiency** — UI-də “Material səmərəliliyi”

`Presentation` ayrıca dördüncü bal deyil. Səliqə, simmetriya, qırışlar, etiket və möhürün yerləşməsi `Presentation` daxilində hesablanır.

Internal field adları:

- `presentationScore`
- `protectionScore`
- `efficiencyScore`

Müştəri prioritetləri də eyni terminlərdən istifadə etməlidir:

- Presentation
- Protection
- Efficiency

---

# 3. Coverage və wrap zonaları

Bütün məhsullar üçün sabit və bərabər çəkili 6 zona istifadə edilməməlidir.

Hər `PackagingRecipe` öz:

- required zones;
- zone weights;
- coverage target;
- wrap passes

məlumatlarını müəyyən etməlidir.

## Telefon qutusu + streç film

İki əsas sarıma keçidi olmalıdır:

### Pass 1 — Horizontal wrap

Örtür:

- front;
- back;
- left;
- right.

### Pass 2 — Vertical wrap

Örtür:

- top;
- bottom;
- front və back səthlərinin əlavə qoruma hissəsi.

Məhsul ilk keçiddən sonra avtomatik 90 dərəcə fırlanır.

Zone çəkiləri:

- front: 20
- back: 20
- left: 15
- right: 15
- top: 15
- bottom: 15

Cəmi: 100

Protection balı bütün tələb olunan zonaların çəkili coverage nəticəsindən hesablanır.

Oyunçu görmədiyi zonaya görə xəbərsiz cəzalandırılmamalıdır.

---

# 4. Inspection mərhələsi

Qablaşdırma bitdikdən sonra `inspecting` state başlamalıdır.

Məhsul:

- 2–3 saniyə ərzində avtomatik dönməli;
- ön, yan, arxa və alt hissələri göstərməli;
- qüsurlu zonaları yumşaq şəkildə vurğulamalıdır.

Inspection tamamlandıqdan sonra `repairing` state başlamalıdır.

Bu mərhələ həm ədalətli scoring, həm də satisfying final reveal üçün istifadə edilir.

---

# 5. Material uyğunluğu recipe əsaslıdır

Material uyğunluğu yalnız məhsul səviyyəsində müəyyən edilməməlidir.

Uyğunluq aşağıdakılardan asılıdır:

- məhsul;
- müştəri sifarişi;
- tələb olunan qoruma;
- tələb olunan görünüş;
- istifadə olunan recipe.

## Tutorial sifarişi

Telefon qutusu + streç film tutorial üçün **tam uyğun recipe** sayılır.

Tutorial sifarişinin məqsədi:

- tozdan və səthi zədədən qoruma;
- səliqəli rəf görünüşü.

Bu sifarişdə material uyğunsuzluğu cəzası yoxdur və yeni oyunçu Perfect nəticə ala bilər.

Telefon qutusu üçün bubble wrap isə kuryer və daşınma sifarişlərində ideal materialdır.

---

# 6. Perfect, Good və Acceptable

## Perfect

Bütün şərtlər ödənməlidir:

- overall score: 90–100;
- Presentation: minimum 90;
- Protection: minimum 90;
- Efficiency: minimum 85;
- açıq critical defect: 0.

## Good

- overall score: 70–89;
- critical defect ola bilər, amma məhsul tam açıq və istifadəsiz vəziyyətdə olmamalıdır.

## Acceptable

- overall score: 0–69.

Acceptable nəticə sifarişi bloklamır və progression-u dayandırmır. Sadəcə daha az mükafat verir.

Bütün hədlər `balance.ts` daxilində saxlanmalıdır.

---

# 7. Critical defect tərifi

Aşağıdakılar critical defect sayılır:

- tələb olunan ümumi coverage 80%-dən aşağıdır;
- əsas seal və ya film ucu bağlanmayıb;
- məhsulun vacib qoruma zonası tam açıqdır;
- qırılan məhsulun həssas zonası qorunmayıb;
- paket açıqdır və məhsul qablaşdırmadan çıxa bilər.

Aşağıdakılar minor defect sayılır:

- kiçik qırış;
- kiçik hava qabarcığı;
- yüngül asimmetriya;
- etiketin azca əyri olması;
- optimaldan bir qədər artıq material.

Minor defect Perfect balını azalda bilər, amma avtomatik olaraq Perfect-i bloklamamalıdır.

---

# 8. Optimal material istifadəsi

Real santimetr və ya metr ölçüsü MVP-də tələb olunmur.

Hər recipe üçün normallaşdırılmış `targetMaterialUnits` istifadə edilməlidir.

## Telefon qutusu + streç film

- target material: 100 units;
- optimal range: 90–110 units;
- optimal wrap passes: 2;
- hər zone üçün ideal coverage: 100%;
- 125%-dən yuxarı over-coverage artıq material sayılır.

Efficiency:

- 90–110 units: yüksək bal;
- 111–125 units: tədricən azalan bal;
- 125-dən çox: ciddi efficiency itkisi;
- 90-dan az: coverage və protection itkisi.

Formula və limitlər `balance.ts` daxilində saxlanmalıdır.

---

# 9. Reputasiya formulu

Hər tamamlanmış sifariş üçün baza reputasiya:

- `10 reputation`

Nəticə multiplikatorları:

- Perfect: ×1.5
- Good: ×1.0
- Acceptable: ×0.7

Yuvarlaqlaşdırma tam ədədə aparılır.

Nəticə:

- Perfect: 15 reputation
- Good: 10 reputation
- Acceptable: 7 reputation

Reputasiya xərclənmir.

---

# 10. Coin və reputasiya fərqli funksiyalar daşıyır

## Reputasiya

Yeni kontentin görünməsini və sifariş kateqoriyalarının açılmasını təmin edir.

## Coin

Görünən material, alət və workshop upgrade-lərini satın almaq üçün istifadə edilir.

Bu iki sistem eyni kontenti iki dəfə kilidləməməlidir.

## İlkin progression

| Reputasiya | Açılan imkan |
|---:|---|
| 0 | Telefon qutusu + streç tutorial |
| 50 | Bubble wrap mağazada görünür |
| 100 | Parfüm sifarişləri açılır |
| 250 | Premium kağız mağazada görünür |
| 300 | Hədiyyə qutusu sifarişləri açılır |
| 500 | Folqa mağazada görünür |
| 600 | Yemək qabı sifarişləri açılır |
| 1000 | Premium müştəri sifarişləri açılır |

Materiallar reputasiya həddindən sonra coin ilə alınır.

Məhsul sifarişləri reputasiya ilə açılır və ayrıca coin ilə satın alınmır.

---

# 11. İlkin coin balansı

## Material qiymətləri

| Material | Coin |
|---|---:|
| Bubble wrap | 500 |
| Premium kağız | 1,000 |
| Folqa | 1,500 |

Streç film başlanğıcdan açıqdır.

## Workshop qiymətləri

| Upgrade | Coin |
|---|---:|
| Workshop Level 2 | 1,500 |
| Workshop Level 3 | 3,000 |
| Workshop Level 4 | 4,500 |

Workshop Level 4 MVP-də saxlanıla bilər, amma progression testində çox gec açılırsa post-MVP-yə keçirilə bilər.

## Reward multiplier

- Perfect: ×1.5
- Good: ×1.0
- Acceptable: ×0.7

---

# 12. Bubble pop qaydası

Bubble wrap səhnəsinin sonunda 2–3 qabarcıq partlatmaq:

- tamamilə optional-dır;
- scoring-ə təsir etmir;
- coin və reputasiya vermir;
- yalnız ASMR və satisfying feedback üçündür.

Oyunçu bubble pop etmədən sifarişi tamamlaya bilər.

---

# 13. Jumbo rulon qərarı

Jumbo rulon səhnəsi ilk vertical slice və əsas MVP gameplay üçün məcburi deyil.

Qərar:

- `Post-MVP / Stretch Goal` kimi saxlanılır;
- material ehtiyatı əsas sifarişləri bloklamır;
- enerji sistemi kimi işləmir.

Əlavə edilərsə:

- vizual stock refill göstərir;
- kiçik bir dəfəlik coin bonusu verə bilər;
- əsas progression üçün məcburi olmamalıdır.

MVP Definition of Done siyahısından çıxarılmalıdır.

---

# 14. Recipe müddətləri

Bütün recipe-lər 30–60 saniyə ilə məhdudlaşdırılmamalıdır.

## Basic recipes

- Telefon qutusu + streç: 30–60 saniyə
- Telefon qutusu + bubble wrap: 40–70 saniyə
- Yemək qabı + streç: 30–60 saniyə
- Yemək qabı + folqa: 40–70 saniyə

## Premium recipes

- Parfüm + bubble wrap: 50–80 saniyə
- Hədiyyə qutusu + premium kağız: 60–90 saniyə

Vaxt məhdudiyyəti yoxdur. Bunlar yalnız hədəf sessiya müddətləridir.

---

# 15. Gesture və state machine sərhədi

Davamlı gesture koordinatları UI thread-də qalmalıdır.

React/Reanimated-dan JavaScript domain qatına yalnız diskret intent hadisələri göndərilməlidir:

- `materialGrabbed`
- `materialReleased`
- `tensionStateChanged`
- `wrapZoneCompleted`
- `wrapPassCompleted`
- `cutCompleted`
- `sealPlaced`
- `inspectionCompleted`
- `defectDetected`
- `defectRepaired`
- `recipeCompleted`

`runOnJS` hər frame çağırılmamalıdır.

Drag koordinatları və animasiya dəyərləri Zustand-a yazılmamalıdır.

---

# 16. Web və native storage adapterləri

Storage sistemi platform adapteri ilə qurulmalıdır.

Interface:

- `StorageAdapter`

Implementasiyalar:

- Native Android/iOS: Expo SQLite
- Web preview: localStorage və ya IndexedDB adapteri

UI və gameplay kodu storage implementasiyasını birbaşa tanımamalıdır.

Web preview yalnız vizual və məntiq testi üçündür. Native performans və haptic keyfiyyətini əvəz etmir.

---

# 17. Test konfiqurasiyası

İlk project setup mərhələsində aşağıdakılar qurulmalıdır:

- React Native Skia Jest mock;
- React Native Reanimated mock;
- Gesture Handler test setup;
- Expo Haptics mock;
- Expo Audio mock;
- StorageAdapter test implementation.

Əsas testlər pure TypeScript səviyyəsində aparılmalıdır:

- scoring;
- state machine;
- recipe validation;
- progression;
- unlock logic;
- reputation;
- reward calculation;
- defects;
- storage migrations.

---

# 18. Android haptic fallback

Haptic effektlərinin Android cihazlarda iOS qədər fərqli hiss edilməyə biləcəyi qəbul edilir.

Android-də haptic fərqini kompensasiya etmək üçün:

- daha aydın vizual micro-animation;
- qısa scale və highlight feedback;
- materiala uyğun audio;
- tension indikatorunda forma dəyişməsi

istifadə edilməlidir.

Gameplay yalnız haptic feedback-ə əsaslanmamalıdır.

---

# 19. Audio variasiyası

Real-time pitch shifting MVP üçün məcburi deyil.

Ən stabil yanaşma:

- eyni action üçün 2–3 audio variant;
- zəif volume modulyasiyası;
- lazım olduqda playback rate-in kiçik dəyişməsi.

Məsələn:

- `bubble_pop_01.wav`
- `bubble_pop_02.wav`
- `bubble_pop_03.wav`

Audio davranışı platformalar arasında fərqlənərsə gameplay pozulmamalıdır.

---

# 20. Lokalizasiya stack-i

MVP üçün istifadə edilməlidir:

- `expo-localization`
- `i18n-js`

İlk dil:

- English

Sonrakı dillər:

- Azerbaijani
- Turkish
- Russian

Bütün görünən mətnlər localization key ilə idarə edilməlidir.

---

# 21. Analytics və env qərarı

İlk MVP-də xarici analytics provider istifadə edilmir.

`src/services/analytics/` məcburi deyil və project foundation-dan çıxarıla bilər.

Lazım olarsa yalnız local debug event logger istifadə edilə bilər.

`.env.example` yalnız real environment dəyişənləri yaranarsa əlavə edilməlidir. Boş və istifadəsiz `.env.example` məcburi deyil.

---

# 22. Normativ development ardıcıllığı

Yeganə normativ mərhələ sənədi:

- `Steps.txt`

Technical sənədindəki təkrarlanan mərhələ siyahısı silinməli və ya `Steps.md` sənədinə yönləndirilməlidir.

Development başlamazdan əvvəl:

1. Bu qərarlar `docs/DECISIONS.md` daxilində saxlanılır.
2. Balance rəqəmləri `src/config/balance.ts` daxilində yaradılır.
3. Progression rəqəmləri `src/config/progression.ts` daxilində yaradılır.
4. Bütün testlər həmin config-lərdən istifadə edir.

---

# 23. İlk vertical slice-in qəbul şərtləri

Telefon qutusu + streç film vertical slice yalnız aşağıdakılar işlədikdə tamamlanmış sayılır:

- tutorial sifarişində material cəzası yoxdur;
- iki wrap pass işləyir;
- bütün tələb olunan zonalar 100%-ə çata bilir;
- avtomatik 90 dərəcə dönüş işləyir;
- inspection rotation bütün zonaları göstərir;
- critical və minor defect fərqlənir;
- oyunçu Perfect nəticə ala bilir;
- reward və reputation hesablanır;
- progress save edilir;
- web preview işləyir;
- Android preview build telefonda test edilir;
- gameplay haptic olmadan da aydın hiss edilir.

---

# 24. Əsas qərar

Oyunun məqsədi real qablaşdırma fizikasını tam simulyasiya etmək deyil.

Əsas məqsəd:

> Oyunçunun hər toxunuşuna dərhal cavab verən, ədalətli scoring sistemi olan, rahatlaşdırıcı və vizual olaraq qənaətbəxş qablaşdırma illüziyası yaratmaqdır.
