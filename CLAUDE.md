# 🎯 YKS KOÇ — Kardeşim İçin AI Destekli Sınav Asistanı

> Bu dosyayı Claude Code'a ver ve "Bu dosyadaki her adımı sırayla uygula" de. Claude Code sana her şeyi soracak, sen sadece cevapla.

---

## 📌 PROJE NEDİR?

Kardeşin için bir mobil uygulama yapıyoruz. Kardeşin telefonuyla sınav sorusunun fotoğrafını çekiyor, uygulama o soruyu adım adım, çok basit Türkçeyle açıklıyor. Hangi konularda zayıf olduğunu görüyor, her gün motivasyon sözü alıyor. Dershane yerine, ücretsiz.

**Uygulama şunları yapacak:**
1. 📸 Soru fotoğrafı yükle → AI adım adım açıklasın
2. 📊 Zayıf konuları görsün (hangi dersten çok hata yapıyor)
3. 📅 Kişisel günlük çalışma planı alsın
4. 💬 Her gün Atatürk / Yaşar Kemal / Muhammed Ali / Hidra'dan motivasyon sözü

---

## 🛠 KULLANILACAK ARAÇLAR (hepsi ücretsiz başlar)

| Araç | Ne İşe Yarar | Ücret |
|------|-------------|-------|
| **Expo (React Native)** | Android telefona uygulama yükler | Ücretsiz |
| **Supabase** | Veritabanı (soruları, hataları kaydeder) | Ücretsiz (başlangıç) |
| **Google Gemini API** | Soruları anlayan, açıklayan AI | Ücretsiz (günde 1500 istek) |

---

## 📋 ADIM ADIM YAPILACAKLAR

---

### ADIM 0 — Bilgisayarını Hazırla (Bir Kere Yapılır)

**Claude Code'a söyle:**
> "Bilgisayarımda Node.js, Git ve Expo CLI kurulu mu kontrol et. Eksik olanları kur."

**Claude Code ne yapacak:**
- `node --version` → Node.js var mı bakar
- `git --version` → Git var mı bakar  
- `npm install -g expo-cli` → Expo'yu kurar

**Sen ne yapacaksın:** Sadece terminale bak, Claude Code her şeyi yapar. Şifre isterse yaz.

---

### ADIM 1 — Projeyi Oluştur

**Claude Code'a söyle:**
> "yks-koc adında yeni bir Expo projesi oluştur ve gerekli paketleri kur."

**Claude Code ne yapacak:**
```bash
npx create-expo-app yks-koc --template blank
cd yks-koc
npx expo install expo-image-picker expo-notifications @supabase/supabase-js
npm install @react-navigation/native @react-navigation/stack
```

**Başarılı olduysa:** `yks-koc` adında bir klasör oluşur.

---

### ADIM 2 — Supabase Hesabı ve Veritabanı Kur

**Sen yapacaksın (Claude Code yardım eder):**

1. Tarayıcıda [supabase.com](https://supabase.com) aç
2. "Start for free" → GitHub ile giriş yap
3. "New Project" → isim: `yks-koc` → şifre yaz (unut ma!) → bölge: **EU West**
4. Proje açılınca sol menüden **SQL Editor**'e tıkla
5. Aşağıdaki kodu yapıştır ve "Run" a bas:

```sql
-- Kullanıcılar tablosu
create table profiles (
  id uuid references auth.users primary key,
  name text,
  created_at timestamp default now()
);

-- Çözülen sorular tablosu
create table sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  subject text,        -- ders: Matematik, Türkçe, Biyoloji...
  topic text,          -- konu: Türev, Paragraf, Hücre...
  is_correct boolean,  -- doğru mu yanlış mı
  question_photo text, -- fotoğraf linki
  ai_explanation text, -- AI'ın açıklaması
  duration_seconds int,
  created_at timestamp default now()
);

-- Zayıf konular özeti (otomatik hesaplanır)
create view weak_topics as
  select user_id, subject, topic, 
    count(*) as total,
    sum(case when is_correct = false then 1 else 0 end) as wrong_count
  from sessions
  group by user_id, subject, topic
  order by wrong_count desc;
```

6. Sol menüden **Settings → API** → şu iki şeyi kopyala:
   - `Project URL` (https://xyz.supabase.co gibi)
   - `anon public` key (çok uzun bir kod)

**Claude Code'a söyle:**
> "Projenin ana klasörüne .env dosyası oluştur. İçine SUPABASE_URL ve SUPABASE_ANON_KEY ekle."

```
SUPABASE_URL=buraya_project_url_yapistir
SUPABASE_ANON_KEY=buraya_anon_key_yapistir
```

---

### ADIM 3 — Gemini API Key Al

**Sen yapacaksın:**

1. [aistudio.google.com](https://aistudio.google.com) aç
2. Google hesabınla giriş yap
3. Sol menü → **Get API Key** → **Create API Key**
4. Çıkan kodu kopyala

**Claude Code'a söyle:**
> ".env dosyasına GEMINI_API_KEY ekle."

```
GEMINI_API_KEY=buraya_gemini_key_yapistir
```

---

### ADIM 4 — Ana Uygulama Yapısını Kur

**Claude Code'a söyle:**
> "src/screens klasörü oluştur. İçine şu ekranları ekle: HomeScreen, QuestionScreen, StatsScreen, MotivationScreen. Her ekran şimdilik sadece başlık göstersin."

**Ekranlar ne olacak:**
- 🏠 **HomeScreen** — Ana sayfa, günlük söz, hızlı soru çöz butonu
- 📸 **QuestionScreen** — Fotoğraf yükle, AI açıklasın
- 📊 **StatsScreen** — Zayıf konular grafik
- 💪 **MotivationScreen** — Motivasyon sözleri arşivi

---

### ADIM 5 — Soru Çözme Modülü (En Önemli Kısım)

**Claude Code'a söyle:**
> "QuestionScreen.js dosyasını yaz. Kullanıcı galeriden fotoğraf seçsin. Fotoğrafı base64'e çevirip Gemini API'ye göndersin. Gemini'den gelen cevabı ekranda göstersin. Aşağıdaki system prompt'u kullan:"

**Gemini'ye gönderilecek sistem promptu (bunu aynen kullan):**

```
Sen YKS'ye hazırlanan bir lise öğrencisinin en iyi arkadaşısın. 
Görevin bu soruyu çözmek değil, ÖĞRENCİNİN anlayıp kendisi çözmesini sağlamak.

KURALLARIN:
1. İlkokul 4. sınıf öğrencisine anlatır gibi konuş. Karmaşık kelime kullanma.
2. Önce "Bu soru aslında şunu soruyor:" diye başla. Soruyu çok basit anlat.
3. Öğrenci bu konudan korkuyorsa, "Bu soru senden çok daha kolay, seni kandırmaya çalışıyor" de.
4. Adım adım çöz. Her adımı numaralandır.
5. Sonunda "Bunun gibi sorularda şu numaraya dikkat et:" diye bir ipucu ver.
6. Her zaman Türkçe yaz.
7. Sonunda emojilerle teşvik et: "Bunu anladıysan 💪 Matematiğin %80'ini anladın demektir!"

ASLA yapma:
- Karmaşık matematiksel gösterim kullanma
- "Bu trivial bir soru" veya "Açıkça görülüyor ki" gibi şeyler söyleme
- Öğrenciyi aşağılama
```

**Claude Code yazacak kod (yaklaşık):**

```javascript
// QuestionScreen.js içinde olacak
const analyzeQuestion = async (imageBase64) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: SYSTEM_PROMPT },
            { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
          ]
        }]
      })
    }
  );
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};
```

---

### ADIM 6 — Motivasyon Sözleri Modülü

**Claude Code'a söyle:**
> "src/data/quotes.js dosyası oluştur. İçine Atatürk, Yaşar Kemal (İnce Memed temalı), Muhammed Ali ve Hidra'dan motivasyon sözleri ekle. Her gün otomatik farklı söz göstersin."

**Dosyaya eklenecek sözler (Claude Code'a ver):**

```javascript
export const quotes = [
  // Atatürk
  { text: "Başarı, hiçbir şeyle ölçülemez. Başarı, imkânsız denileni başarmaktır.", author: "Mustafa Kemal Atatürk", emoji: "🏆" },
  { text: "Hayatta en hakiki mürşit ilimdir.", author: "Mustafa Kemal Atatürk", emoji: "📚" },
  { text: "Bir şey yapılabilir değil mi? O halde yapılacak.", author: "Mustafa Kemal Atatürk", emoji: "💪" },
  
  // Yaşar Kemal — İnce Memed teması
  { text: "İnce Memed dağlarda yalnız kaldı ama yılmadı. Sen de yalnız hissedebilirsin, ama bu yolculuk senindir.", author: "Yaşar Kemal'den ilham", emoji: "🏔️" },
  { text: "Köy çocuğu İnce Memed imkânsızlıkla büyüdü ve efsane oldu. Sen şimdi sınavla savaşıyorsun — bu senin dağın.", author: "Yaşar Kemal'den ilham", emoji: "🌄" },
  { text: "Toprak insanı ezer ama kıramaz. Sınav da seni ezemez.", author: "Yaşar Kemal ruhundan", emoji: "🌱" },
  
  // Muhammed Ali
  { text: "İmkânsız bir düşüncedir. İmkânsız bir görüştür. İmkânsız cesaret değildir. İmkânsız kalıcı değildir. İmkânsız mümkündür.", author: "Muhammed Ali", emoji: "🥊" },
  { text: "Antrenman yaparken acı çek ki yarışma günü acı çekmeyesin.", author: "Muhammed Ali", emoji: "🏋️" },
  { text: "Şampiyon olmak için antrenman yapmak zorunda değilim. Ben zaten şampiyonum. Şampiyon gibi davranmam yeterli.", author: "Muhammed Ali", emoji: "👑" },
  
  // Hidra
  { text: "Hayat ters gidince, yeniden başla. Sistemin dışına çıkamıyorsan, sistemi içinden değiştir.", author: "Hidra", emoji: "🎤" },
  { text: "Sıfırdan zirveye yol var, sadece çalışmak lazım.", author: "Hidra", emoji: "📈" },
  { text: "Herkes konuşuyor, sen çalış. Herkes uyurken sen kalkıyor ol.", author: "Hidra", emoji: "🌙" },
];

// Her gün farklı söz göster
export const getTodayQuote = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return quotes[dayOfYear % quotes.length];
};
```

---

### ADIM 7 — İstatistik Ekranı

**Claude Code'a söyle:**
> "StatsScreen.js'i yaz. Supabase'den kullanıcının çözdüğü soruları çeksin. Hangi derste kaç yanlış yaptığını göstersin. En zayıf 3 konuyu 'Bunlara odaklan!' diye vurgula."

---

### ADIM 8 — Uygulamayı Telefona Yükle (Expo Go)

**Claude Code'a söyle:**
> "Uygulamayı Expo Go ile kardeşimin telefonunda çalıştır. Komutları ver."

**Adımlar:**
1. Kardeşinin Android telefonuna **Expo Go** uygulamasını Play Store'dan indir
2. Terminalde `npx expo start` yaz
3. QR kod çıkacak → Kardeşin Expo Go'yu açıp QR'ı tarasın
4. Uygulama telefonda açılır ✅

---

### ADIM 9 — Kardeşine Özel Kişiselleştirme

**Claude Code'a söyle:**
> "Uygulamada kullanıcı adı girilince 'Merhaba [isim]! Bugün hangi konuyu fethediyoruz?' diye karşılasın. Her doğru soruda küçük animasyon olsun."

**Ayrıca ekle:**
- Öğrenci adını kaydet (Supabase profiles tablosuna)
- Her gece 20:00'de bildirim: "Bugün kaç soru çözdün? Hedefin 5 soru!" 
- Hafta sonu özet: "Bu hafta X soru çözdün, en zayıf konun: Y"

---

### ADIM 10 — Birkaç Arkadaşına Da Açmak İstersen

Şimdilik sadece telefonda Expo Go ile çalışır (kurulum gerekmez). Birkaç arkadaşına da açmak istersen:

**Claude Code'a söyle:**
> "Uygulamayı APK olarak derleme adımlarını ver. EAS Build kullanacağız."

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

EAS sana bir APK linki verir → arkadaşların indirip kurar.

---

## 🎨 TASARIM REHBERİ

**Uygulama hissettirmeli:**
- Koyu arka plan (gece çalışırken göz yanmaması için)
- Turkuaz / altın vurgu renkleri (enerji verir)
- Büyük, okunaklı yazılar
- Her doğru soruda konfeti animasyonu 🎉
- Soruyu çözerken "AI düşünüyor..." animasyonu

**Claude Code'a söyle:**
> "Renk teması: arka plan #0D0D0D, ana renk #00D4FF (turkuaz), vurgu #FFD700 (altın). Tüm metinler açık renk. Expo Linear Gradient kullan."

---

## ⚠️ SIK YAPILAN HATALAR

| Hata | Çözüm |
|------|-------|
| `Gemini API error 400` | Fotoğraf çok büyük, boyutu küçült |
| `Supabase connection refused` | .env dosyasındaki URL'yi kontrol et |
| `expo: command not found` | `npm install -g expo-cli` yaz |
| QR kod çalışmıyor | Telefon ve bilgisayar aynı Wi-Fi'da olmalı |

---

## 🚀 CLAUDE CODE'A İLK VER DEDIKLERIN

Terminalde Claude Code'u başlat ve şunu yaz:

```
Bu CLAUDE.md dosyasını oku ve ADIM 0'dan başlayarak her adımı sırayla uygula. 
Her adım bitmeden bir sonrakine geçme. Bir şey sormam gerekirse sor.
Proje adı: yks-koc
Amaç: Kardeşim için YKS AI koç uygulaması
```

---

## 📞 YARDIM GEREKİRSE

Herhangi bir adımda takılırsan, Claude Code'a tam hata mesajını yapıştır ve:
> "Bu hatanın sebebi ne? Nasıl düzeltirim? Adım adım anlat."

De. Claude Code seni çıkarır.

---

*Bu uygulama kardeşin için. Başarısı senin katkındır. 💙*
