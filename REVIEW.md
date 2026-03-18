# REVIEW

## Kisa Sonuc

Bu proje tamamen cop degil. Yerel bundling denemesinde JS tarafi derlenebildi; sorun daha cok deploy/build zincirinde ve gizli anahtar yonetiminde.

En kisa ve en optimum yol olarak sunu oneriyorum:

1. Gemini cagrisini istemciden cikarip Vercel serverless function'a tasimak.
2. Projeyi once web olarak Vercel'e deploy etmek.
3. Kardesinin telefonda linkten kullanmasini, isterse "Add to Home Screen" ile ana ekrana eklemesini saglamak.

Neden bu yol:

- APK yolu zaten EAS tarafinda `Prepare project build phase` asamasinda kirilmis.
- Web deploy, APK imzalama, sideload ve cihaz bazli kurulum sorunlarini ortadan kaldirir.
- Mevcut mimaride Gemini anahtari APK icinde de guvende olmayacak; backend'e tasimak her iki senaryoda da gerekli.

APK daha sonra yine alinabilir; ama ilk hedef "calisir hale getirmek" ise Vercel yolu daha hizli.

## Mevcut Durum

- Uygulama Expo tabanli bir React Native proje.
- Ana akis mantikli: soru resmi seciliyor, Gemini'den aciklama aliniyor, Supabase'e sonuc yaziliyor, istatistik ekrani bunu okuyor.
- Yerel Android export denemesinde bundler `index.js` icin 961 modul bundle etti. Yani temel JS kodu bariz syntax hatasi yuzunden patlamiyor.
- Ayni deneme Hermes bytecode asamasinda `spawn EPERM` ile durdu. Bu buyuk olasilikla sandbox kaynakli; uygulama kodunun kirik olduguna dair dogrudan bir kanit degil.
- Kaydedilmis EAS build kaydi ise `ERRORED` ve `Prepare project build phase` seviyesinde kalmis.

## Kritik Bulgular

### 1. Gemini anahtari istemcide acik durumda

Kanit:

- `.env:1`
- `src/screens/QuestionScreen.js:10`
- `src/screens/QuestionScreen.js:119`

Yorum:

- `EXPO_PUBLIC_*` degiskenleri istemci bundle'ina girer.
- Bu anahtar su an repo icinde duruyor ve uygulama cihaza/web'e dagitildiginda disariya aciliyor.
- APK yapsan da, web deploy etsen de bu hali guvenli degil.

Etkisi:

- Anahtar kopyalanabilir.
- Kota suistimali olabilir.
- Bir gun uygulama hicbir kod degisikligi olmadan "neden calismiyor" noktasina gelir.

Karar:

- Gemini istegini Vercel `api/` endpoint'ine tasimak gerekiyor.

### 2. `.env` dosyasi git tarafinda korunmuyor

Kanit:

- `.gitignore:34` sadece `.env*.local` ignore ediyor.
- Projede gercek `.env` dosyasi var.

Yorum:

- Bu durum anahtarlarin tekrar commit edilmesini cok kolaylastiriyor.

Karar:

- `.gitignore` icine `.env` ve gerekirse `.env.*` eklenmeli.
- Mevcut Gemini key rotate edilmeli.

### 3. Expo paket versiyonlari SDK ile tam hizali degil

Kanit:

- `package.json:23` `react-native-safe-area-context` -> `^5.7.0`
- `package.json:24` `react-native-screens` -> `^4.24.0`
- Yerel Expo bundled surum beklentisi:
  - `react-native-safe-area-context` -> `~5.6.2`
  - `react-native-screens` -> `~4.23.0`

Yorum:

- Expo projelerinde caret (`^`) ile ileri kacmak bazen cloud build'de sorun cikarir.
- `Prepare project build phase` hatasinin tek sebebi oldugu kesin degil, ama ciddi bir risk.

Karar:

- Paketleri `expo install` ile Expo SDK 55'in destekledigi surumlere sabitlemek lazim.

### 4. Proje metadata'si tutarsiz

Kanit:

- `package.json:2` -> `yks-koc-temp`
- `app.json:4` -> `yks-koc`
- `build_info.json:26-27` seviyesinde kayitli remote proje de `yks-koc-temp`
- `app.json:31` icinde baska bir EAS `projectId` var

Yorum:

- Isim/slug/EAS baglantisi parca parca degismis gorunuyor.
- Bu, build pipeline'inda "hangi proje icin ne deploy ediliyor" karmasasi yaratir.

Karar:

- Tek isim secilmeli.
- `package.json`, `app.json` ve EAS baglantisi ayni kimlige cekilmeli.

### 5. Istatistikler kullaniciya ozel degil ve hatalar sessizce yutuluyor

Kanit:

- `src/screens/QuestionScreen.js:228`
- `src/screens/QuestionScreen.js:234`
- `src/screens/StatsScreen.js:24`
- `src/screens/StatsScreen.js:53`

Yorum:

- `sessions` tablosuna yazilan verilerde kullanici/device ayirimi yok.
- Web'e acarsan herkes ayni havuza yazabilir.
- Supabase hata verirse ekran sessizce devam ediyor; kullanici "kaydedildi" sanabilir.

Karar:

- En azindan `device_id` veya tekil `student_id` eklenmeli.
- Kisa vadede tek kullanici olacaksa bile hata gorunur hale getirilmeli.

## Kritik Olmayan Ama Toparlanmasi Gerekenler

- `expo-notifications` kullanilmiyor gorunuyor; gereksiz bagimlilik.
- `@expo/ngrok` da su an zorunlu degil.
- Projede build/test/doctor icin net script yok; tekrar edilebilirlik zayif.

## Onerilen Yol: Web + Vercel

Bu proje icin ilk hedef "kardesim kullansin" ise en mantikli yol bu:

1. Expo uygulamasini web olarak yayinla.
2. Gemini istegini Vercel serverless function uzerinden gecir.
3. Supabase'i sadece veri katmani olarak kullan.
4. Telefon tarafinda URL acilsin; isterse ana ekrana kisayol eklensin.

Avantajlar:

- APK, signing, EAS queue ve cihaz kurulum sorunlari yok.
- Yeni surumler aninda yayina alinir.
- Hata ayiklamak daha kolay.
- Ayni kod tabani sonra tekrar APK'ya da donusturulebilir.

Dezavantaj:

- Native uygulama hissi biraz daha zayif olur.
- Kamera/galeri deneyimi browser sinirlari icinde kalir.

Bu trade-off burada kabul edilebilir, cunku oncelik hizli sekilde calisir hale getirmek.

## Toparlama Plani

### Faz 1 - Guvenlik ve stabilizasyon

1. Gemini key'i rotate et.
2. `.gitignore` icine `.env` ekle.
3. `.env.example` olustur.
4. Gemini fetch mantigini istemciden cikar.
5. Vercel `api/gemini` endpoint'i yaz.
6. Mobil/web istemcisi sadece bu endpoint'i cagsin.

### Faz 2 - Bagimlilik ve config temizligi

1. `package.json` ismini kalici bir ada cek.
2. `app.json` slug/name/package bilgisini ayni kimlige getir.
3. `expo install react-native-safe-area-context react-native-screens react-native-gesture-handler react-dom react-native-web`
4. Kullanilmayan paketleri temizle.

### Faz 3 - Veri modelini minimum saglam hale getir

1. `sessions` tablosuna `device_id` veya `student_id` ekle.
2. Insert ve select sorgularini buna gore filtrele.
3. Sessiz `catch` bloklarina en azindan kullaniciya gorunen bir hata mesaji ekle.

### Faz 4 - Deploy

1. Repo'yu GitHub'a push et.
2. Vercel'e bagla.
3. Vercel environment variables tanimla.
4. Web build'i al.
5. Android telefonda test et.

## APK Hala Istiyorsan

Web surumu ayaga kalktiktan sonra APK icin ikinci asama olarak su yol mantikli:

1. Once yukaridaki guvenlik ve paket sabitleme islerini bitir.
2. EAS proje baglantisini tek kimlige indir.
3. `eas build --platform android --profile preview` ile tekrar dene.

Ama once APK ile baslamak, mevcut durumda daha fazla zaman yakar.

## Net Karar

Su an icin onerim:

- `APK first` degil
- `GitHub + Vercel first`
- Gemini backend proxy zorunlu
- Expo mobil kod tabani korunacak

Yani en dogru kisa yol:

`Expo app + Vercel API + Vercel web deploy`

Bu yol projeyi en kisa surede kullanilir hale getirir. Sonra istenirse ayni temizlenmis tabandan APK tekrar alinir.
