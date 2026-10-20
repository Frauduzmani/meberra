# AP MEBERRA — İçerik Ajanı Ortak Kuralları (PM, Tur 2)

1. **Soru şeması değişmez:** {id, number, topic, difficulty, source, question, options:[{id,text,isCorrect,errorTag,remediation}], generalRemediation, stepByStepSolution}. Mount: `initInteractiveQuiz(containerId, data)`.
   - Her ünitenin kendine ait yeni bir container'ı ve benzersiz bir dizi adı olmalı.
   - Mount satırını mevcut DOMContentLoaded bloğuna ekle.
   - Ünitenin quiz bölümündeki `panel-title` başlığı "Unit N ...: İnteraktif Soru İstasyonu" biçiminde olsun. İlerleme sayfası ünite adını buradan okuyor.
2. **Biçim:**
   - Konu anlatımı ve soru metni İngilizce (Kural 13).
   - errorTag, remediation ve çözüm metinleri mevcut düzeni izlesin: Türkçe açıklama, içinde İngilizce terimler.
   - MathJax `$...$` kullan; JS string'lerinde ters bölü çift yazılır (`\\frac`, `\\text`, `\\Delta`). Tek ters bölü `\t`, `\n` gibi kaçış karakterine dönüşüp formülü bozar.
   - Kalın yazı için `<strong>` kullan; Markdown `**` YASAK.
   - Satır içi sabit renk kullanma (`color:#fff` gibi); mevcut CSS sınıflarını ve `var(--...)` değişkenlerini kullan, yoksa açık tema bozulur.
3. **Doğruluk (PM kapısı):**
   - Her cevabı bağımsız hesapla. Python için proje klasörünün DIŞINDAN `C:\Users\hp\AppData\Local\Programs\Python\Python311\python.exe` çalıştır (anaconda proje klasöründe bozuk); sympy mevcut. node da kullanılabilir.
   - Her soruda tam bir doğru şık olsun. Doğru şıkların konumu A–D arasında dengeli dağılsın.
   - **Doğru şık sistematik olarak en uzun şık olmasın**; çeldiricilerin uzunluğu doğru şıkla benzer olsun.
   - Her çeldirici gerçek bir öğrenci hatasını temsil etsin ve sayısal değeri o hatanın gerçek sonucu olsun.
4. **Kaynak dürüstlüğü:** source = `"AP-style original (CED Topic x.y)"`. İstersen sonuna `— Abitur-style` gibi bir stil notu ekleyebilirsin. "Official", "Past Exam" ve "College Board Exam" ifadeleri YASAK. Quiz açıklamalarında "çıkmış sınavlardan derlenmiştir" deme.
5. **Müfredat:** Güncel College Board CED ünite ve konu numaralarını kullan.
6. **Son kontrol:**
   - Inline script'leri node `vm` ile çalıştır.
   - Şunları doğrula: tek isCorrect, A–D sırası, benzersiz id, yanlış şıklarda errorTag ve remediation, kontrol karakteri olmaması, `$` dengesi, `**` olmaması, source'ta yasak kelime olmaması.
   - Başlamadan önce dosyanın bir yedeğini oturumun geçici (scratchpad) klasörüne al.
7. **Rapor (Türkçe, kısa):** yeni ve genişletilen soru sayıları, düzeltilen hatalar (id ile), doğrulama yöntemi, sayfadaki toplam soru.
