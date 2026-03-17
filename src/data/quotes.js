export const quotes = [
  // Ataturk
  { text: "Basari, hicbir seyle olculemez. Basari, imkansiz denileni basarmaktir.", author: "Mustafa Kemal Ataturk", emoji: "🏆" },
  { text: "Hayatta en hakiki mursit ilimdir.", author: "Mustafa Kemal Ataturk", emoji: "📚" },
  { text: "Bir sey yapilabilir degil mi? O halde yapilacak.", author: "Mustafa Kemal Ataturk", emoji: "💪" },
  { text: "Yurtta sulh, cihanda sulh. Ama once kendi sinavinla baris.", author: "Mustafa Kemal Ataturk", emoji: "🕊️" },
  { text: "Guclugun, cesaretlinin ve calisilanin onunde hicbir engel duramaz.", author: "Mustafa Kemal Ataturk", emoji: "⚡" },
  { text: "Egitimdir ki bir milleti ya ozgur, bagimsiz, sanli bir toplum halinde yasatir ya da tutsakliga surukler.", author: "Mustafa Kemal Ataturk", emoji: "🎓" },
  { text: "Benim icin dunya vatandasi olmak, Turk vatandasi olmaktan sonra gelir.", author: "Mustafa Kemal Ataturk", emoji: "🌍" },

  // Yasar Kemal — Ince Memed temasi
  { text: "Ince Memed daglarda yalniz kaldi ama yilmadi. Sen de yalniz hissedebilirsin, ama bu yolculuk senindir.", author: "Yasar Kemal'den ilham", emoji: "🏔️" },
  { text: "Koy cocugu Ince Memed imkansizlikla buyudu ve efsane oldu. Sen simdi sinavla savasiyorsun — bu senin dagin.", author: "Yasar Kemal'den ilham", emoji: "🌄" },
  { text: "Toprak insani ezer ama kiramaz. Sinav da seni ezemez.", author: "Yasar Kemal ruhundan", emoji: "🌱" },
  { text: "Memed karanliga ragmen yuruyordu. Sen de bugunku yorgunluga ragmen calis. Isik yaklasyor.", author: "Yasar Kemal'den ilham", emoji: "🔥" },
  { text: "Hicbir dag Memed'i durduramadi. Hicbir konu seni durduramaz.", author: "Yasar Kemal'den ilham", emoji: "🗻" },
  { text: "Ince Memed silaha degil iradeye guvenirdi. Sen de zekana guven.", author: "Yasar Kemal'den ilham", emoji: "🧠" },

  // Muhammed Ali
  { text: "Imkansiz bir dusuncedir. Imkansiz bir gorustur. Imkansiz cesaret degildir. Imkansiz kalici degildir. Imkansiz mumkundur.", author: "Muhammed Ali", emoji: "🥊" },
  { text: "Antrenman yaparken aci cek ki yarisma gunu aci cekmeyesin.", author: "Muhammed Ali", emoji: "🏋️" },
  { text: "Sampiyon olmak icin antrenman yapmak zorunda degilim. Ben zaten sampiyonum. Sampiyon gibi davranmam yeterli.", author: "Muhammed Ali", emoji: "👑" },
  { text: "Saymaya aciktan basladim. Agryana kadar. Cunku o zaman basliyor.", author: "Muhammed Ali", emoji: "💥" },
  { text: "Risk almayan hicbir sey kazanamaz.", author: "Muhammed Ali", emoji: "🎯" },
  { text: "Ben harika oldugumu soyledigimde kimse inanmadi. Simdi hepsi anlatiyor.", author: "Muhammed Ali", emoji: "🌟" },

  // Hidra
  { text: "Hayat ters gidince, yeniden basla. Sistemin disina cikamiyorsan, sistemi icinden degistir.", author: "Hidra", emoji: "🎤" },
  { text: "Sifirdan zirveye yol var, sadece calismak lazim.", author: "Hidra", emoji: "📈" },
  { text: "Herkes konusuyor, sen calis. Herkes uyurken sen kalkiyor ol.", author: "Hidra", emoji: "🌙" },
  { text: "Dusmanin senin basarindir. Basarinca herkes dost olur.", author: "Hidra", emoji: "🐺" },
  { text: "Bir gun diyeceksin ki iyi ki o gece uyumadim ve calistim.", author: "Hidra", emoji: "🌃" },
  { text: "Sokagin cocugu olabilirsin ama zirvede olursun. Yeter ki birakma.", author: "Hidra", emoji: "🚀" },

  // Ekstra — Farkli kaynaklar
  { text: "Bugunku terin, yarinin gulus sebebi olacak.", author: "Anonim", emoji: "😊" },
  { text: "Dun cok gec. Yarin cok erken. Bugun tam zamani.", author: "Anonim", emoji: "⏰" },
  { text: "Bir adim at. Sonra bir tane daha. Zirve adimlardan olusur.", author: "Anonim", emoji: "🪜" },
  { text: "Sinav senin hikayenin bir sayfasi, tamamini degil.", author: "Anonim", emoji: "📖" },
  { text: "Herkesin gizli bir savasi var. Seninki bu sinav. Ve kazanacaksin.", author: "Anonim", emoji: "🛡️" },
  { text: "Yorulunca dur, ama birakma.", author: "Anonim", emoji: "🧭" },
  { text: "Denemeden basarisiz olamazsin. Denedikten sonra ise sadece tecrube kazanirsin.", author: "Anonim", emoji: "🎲" },
  { text: "Beynin bir kas gibidir. Ne kadar calistirirsan o kadar guclenir.", author: "Anonim", emoji: "💡" },
  { text: "Basarili insanlar farkli seyler yapmaz, ayni seyleri farkli yapar.", author: "Anonim", emoji: "🔑" },
  { text: "Sinav bir maraton. Hizli baslamak degil, istikrarli devam etmek kazandirir.", author: "Anonim", emoji: "🏃" },
];

// Her gun farkli soz goster — hepsi bitince basa donmek yerine
// gun + yil kombinasyonuyla karistirarak farkli sira olustur
export const getTodayQuote = () => {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const year = now.getFullYear();
  // Yila gore farkli offset ekle — boylece her yil farkli sira olur
  const offset = (year * 7) % quotes.length;
  const index = (dayOfYear + offset) % quotes.length;
  return quotes[index];
};
