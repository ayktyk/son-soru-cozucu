# SON CLAUDE DOKUNUSU - YKS KOC Gelistirme Plani

> Tarih: 2026-03-18
> Her adim sirayla uygulanacak. Bir adim bitmeden sonrakine gecilmez.

---

## ADIM 1: Turkce Karakter Sorununu Kok Cozum ile Duzelt

### Sorun
QuestionScreen.js ve StatsScreen.js'de Turkce karakterler Unicode escape (`\u00E7`, `\u011F` vb.) ile yazilmis.
Bu yaklasim:
- Kodu okunaksiz yapar
- Bakim zorlar
- Yeni metin eklerken hata riski olusturur

HomeScreen.js ve MotivationScreen.js'de ise duz Turkce karakter var ve sorunsuz calisiyor.

quotes.js'de ise tam tersi sorun var: Turkce karakterler ASCII'ye cevirilmis (ornegin "calisma" yerine "calışma" olmali).

### Yapilacaklar
1. **QuestionScreen.js**: Tum Unicode escape'leri duz Turkce karakterlere cevir
   - `\u00C7` → `C` (buyuk C-cedilla), `\u00E7` → `c` (kucuk c-cedilla)
   - `\u011F` → `g`, `\u0131` → `i` (noktasiz i), `\u00F6` → `o`
   - `\u015F` → `s`, `\u00FC` → `u`, `\u0130` → `I` (buyuk noktali I)
   - Hem SYSTEM_PROMPT hem UI metinleri duzeltilecek

2. **StatsScreen.js**: Ayni Unicode escape temizligi

3. **App.js**: Header title'lardaki escape'ler duzeltilecek

4. **quotes.js**: Tamamen yeniden yazilacak (Adim 2'de)

5. **Test**: Web + Android'de Turkce karakterlerin dogru gorundugunun dogrulanmasi

### Etkilenen Dosyalar
- `src/screens/QuestionScreen.js` (SYSTEM_PROMPT + tum UI metinleri)
- `src/screens/StatsScreen.js` (UI metinleri)
- `App.js` (header title'lar)

---

## ADIM 2: Motivasyon Sozlerini Tamamen Yeniden Yaz

### Sorun
Mevcut quotes.js:
- 102 soz var ama hepsi anonim, jenerik, "YKS Koc" imzali
- Turkce karakterler bozuk (ASCII — "calisma", "baslamak" vs.)
- Ilham verici degil, kaynak yok

### Yapilacaklar
1. **quotes.js tamamen silinip yeniden yazilacak**
2. Minimum 60 gercek, atfedilmis soz eklenecek
3. Her sozun `text`, `author`, `emoji` ve `category` alani olacak

### Soz Kaynaklari (siralama oncelik sirasi)
| Kisi | Kategori | Tahmini Soz Sayisi |
|------|----------|-------------------|
| Mustafa Kemal Ataturk | Liderlik, bilim, azim | 10-12 |
| Yasar Kemal | Mucadele, umut, halk | 6-8 |
| Muhammed Ali | Savascilik, ozguven | 6-8 |
| Eminem | Underdog hikayesi, asla pes etmeme | 6-8 |
| Hidra | Turkce rap, calisma, sistem | 6-8 |
| Albert Einstein | Bilim, merak, ogrenme | 4-5 |
| Nelson Mandela | Dayaniklilik, egitim | 4-5 |
| Steve Jobs | Yaraticilik, tutkuyla calisma | 3-4 |
| Bruce Lee | Disiplin, odak | 3-4 |
| Marcus Aurelius | Stoik disiplin | 3-4 |
| Nikola Tesla | Bilim, hayal gucu | 2-3 |
| Rumi (Mevlana) | Ic guc, degisim | 3-4 |

### Soz Formati
```javascript
{
  text: "Gercek soz metni — Turkce ceviri",
  author: "Kisi Adi",
  emoji: "uygun emoji",
  category: "azim" | "bilim" | "cesaret" | "disiplin" | "ozguven"
}
```

### Kurallar
- Her soz ya gercek alinti ya da acikca "ilham" olarak isaretlenmeli
- Turkce ceviriler dogal ve akici olmali
- Argo veya kufur icerik OLMAYACAK
- Eminem ve Hidra sozleri sarkilardan secilecek (motivasyon icerikliler)

---

## ADIM 3: Istatistik + Haftalik Egitim Modulu

### 3A: Ders/Konu Siniflandirmasini Guclendir

#### Mevcut Durum
- QuestionScreen.js'de `[KONU: Ders > Konu]` regex'i var ve calisiyor
- Supabase `sessions` tablosuna subject/topic kaydediliyor
- StatsScreen.js basit toplam/dogru/yanlis gosteriyor

#### Yapilacaklar
- SYSTEM_PROMPT'a daha kesin siniflandirma talimati ekle
- Konu listesini standartlastir (ornegin "Turev" ve "turev" ve "TUREV" ayni olmali)
- StatsScreen'e haftalik filtre ekle

### 3B: Haftalik Istatistik Ozeti
- Son 7 gunun verilerini ayri goster
- Haftalik trend: gecen haftaya gore iyilesme/kotulasme
- En cok yanlis yapilan 3 konu vurgulu gosterilecek

### 3C: Egitim Modulu (Yeni Ekran: LearnScreen)

#### Konsept
Istatistiklerde en zayif konulari tespit et → "Bu konuyu ogren" butonu →
Gemini API'ye o konuyu "ilkokul 4. sinifa anlatir gibi" anlattir

#### Akis
1. StatsScreen'de her zayif konunun yaninda "Konuyu Ogren" butonu
2. Butona basinca LearnScreen acilir
3. LearnScreen, Gemini API'ye su prompt'u gonderir:
   ```
   "[Ders] dersindeki [Konu] konusunu ilkokul 4. sinif ogrencisine
   anlatir gibi anlat. Cok basit Turkce kullan. Ornekler ver.
   Formul varsa adim adim goster. Sonunda 3 kolay pratik soru sor."
   ```
4. AI aciklamasi ekranda gosterilir
5. Pratik sorulari cevaplarsa chat devam eder

#### Teknik
- Yeni ekran: `src/screens/LearnScreen.js`
- Navigation'a eklenmeli (App.js)
- StatsScreen'den parametre ile navigate: `navigation.navigate('Learn', { subject, topic })`
- Gemini API'ye metin-bazli istek (gorsel yok)

### Etkilenen/Yeni Dosyalar
- `src/screens/StatsScreen.js` (haftalik filtre + "Konuyu Ogren" butonu)
- `src/screens/LearnScreen.js` (YENI)
- `App.js` (yeni ekran eklenmesi)
- `src/screens/QuestionScreen.js` (SYSTEM_PROMPT iyilestirmesi)

---

## ADIM 4: Premium UI Tasarim

### Renkler (DEGISMEYECEK)
```
background: #041E42 (koyu lacivert)
primary: #F6D30A (sari/altin)
surface: #0D3472 (acik lacivert)
text: #FFF9DB (krem beyaz)
```

### Premium Gorunum Iyilestirmeleri

> NOT: Kullanici bir template'ten bahsetti ama henuz paylasmaadi.
> Template gelince bu bolum guncellenecek.

#### Genel Iyilestirmeler (template bagmsiz)
1. **HomeScreen — Premium Karsilama**
   - Gradient arka plan (expo-linear-gradient)
   - Buyuk motivasyon karti: glassmorphism efekti (yari seffaf, blur)
   - Ana buton: gradient + golge
   - Alt butonlar: ikon + metin

2. **QuestionScreen — Temiz ve Modern**
   - Kart bazli layout
   - AI aciklamasi icin ozel tipografi
   - Daha iyi bosluk ve hiyerarsi
   - Animasyonlu "AI dusunuyor" gostergesi

3. **StatsScreen — Dashboard Hissi**
   - Ozet kartlari: ikonlu, golge efektli
   - Progress bar'lar: gradient renkli
   - Haftalik trend gosterimi

4. **MotivationScreen — Galeri Formati**
   - Her soz karti: hafif gradient arka plan
   - Yazar fotosu veya ikonu
   - Kategori etiketi (azim, bilim, cesaret vb.)

5. **Genel**
   - expo-linear-gradient paketi gerekli
   - Tum kartlara hafif golge (shadow)
   - Border radius tutarliligi (16px standart)
   - Tipografi hiyerarsisi: baslik/alt baslik/govde/etiket

### Etkilenen Dosyalar
- `src/theme/colors.js` (yeni renkler/gradientler eklenmesi)
- `src/screens/HomeScreen.js` (tamamen yeniden tasarim)
- `src/screens/QuestionScreen.js` (stil guncellemesi)
- `src/screens/StatsScreen.js` (dashboard tasarimi)
- `src/screens/MotivationScreen.js` (galeri formatı)
- `App.js` (navigation header stili)
- `package.json` (expo-linear-gradient eklenmesi)

---

## UYGULAMA SIRASI

```
ADIM 1 → Turkce karakter duzeltmesi (20 dk)
   ↓
ADIM 2 → Motivasyon sozleri (30 dk)
   ↓
ADIM 3A → Konu siniflandirma iyilestirmesi (15 dk)
   ↓
ADIM 3B → Haftalik istatistik (20 dk)
   ↓
ADIM 3C → Egitim modulu / LearnScreen (30 dk)
   ↓
ADIM 4 → Premium UI (template gelince — 45 dk)
   ↓
TEST → Tum ekranlarda Turkce + islevsellik testi
```

---

## KONTROL LISTESI

- [x] Adim 1: Turkce karakterler duz metin olarak duzeltildi ✓
- [x] Adim 2: 75 gercek motivasyon sozu eklendi (12 farkli kisi) ✓
- [x] Adim 3A: Konu siniflandirmasi guclendi ✓
- [x] Adim 3B: Haftalik istatistik ozeti eklendi (Tumu/Bu Hafta filtre) ✓
- [x] Adim 3C: LearnScreen olusturuldu ve calisiyor ✓
- [x] Adim 4: Premium UI uygulandı (21st.dev template ilham) ✓
- [x] Test: Web build basarili (sifir hata) ✓
- [ ] Test: Android'de Turkce karakterler dogru (kullanici testi gerekli)
- [ ] Test: Istatistikler dogru hesaplaniyor (kullanici testi gerekli)
- [ ] Test: Egitim modulu Gemini'den cevap aliyor (kullanici testi gerekli)
