# İzin & Duyuru Portalı — Vercel Sürümü

Bu klasör, aynı Firebase tabanlı uygulamanın **Netlify yerine Vercel** ile
yayınlanacak halidir. Firebase (Auth + Firestore) tarafı hiç değişmedi —
sadece admin işlemlerini çalıştıran sunucu tarafı fonksiyonlar Netlify
Functions formatından Vercel'in `/api` fonksiyon biçimine çevrildi.

## Klasör yapısı

```
izin-portal-vercel/
├─ index.html              # Sitenin kendisi
├─ package.json            # firebase-admin bağımlılığı
├─ firestore.rules          # (Firebase projenizde zaten yayınlı, referans için)
└─ api/
   ├─ _shared.js
   ├─ create-employee.js
   ├─ bulk-import-employees.js
   ├─ delete-employee.js
   └─ change-password.js
```

## Kurulum — Firebase tarafında hiçbir şey değişmiyor

Firebase projeniz, Firestore kurallarınız, kullanıcılarınız (admin dahil)
olduğu gibi kalıyor. Sadece **hosting'i** değiştiriyoruz.

## 1. index.html'e firebaseConfig'i girin

Daha önce kullandığınız gerçek `firebaseConfig` değerlerini bu dosyaya da
girin (Ctrl+F ile "YOUR-API-KEY" arayın).

## 2. GitHub'a yükleyin

Yeni bir GitHub deposu oluşturup (örn. `izin-portali-vercel`) bu klasördeki
tüm dosya ve klasörleri (özellikle `api/` klasörünü İÇİNDEKİ dosyalarla
birlikte) yükleyin. İsterseniz mevcut `izin-portali` deponuzu da
kullanabilirsiniz — Vercel farklı bir depo/branch de kabul eder, ama en
temizi yeni bir depo açmaktır.

## 3. Vercel'e bağlayın

1. [vercel.com](https://vercel.com) adresine GitHub hesabınızla giriş yapın.
2. **"Add New..." → "Project"** deyin.
3. GitHub deponuzu (`izin-portali-vercel`) seçip **"Import"** deyin.
4. Build ayarlarına dokunmadan (Framework Preset: "Other" otomatik
   algılanır) **"Deploy"** deyin.

## 4. Servis hesabı anahtarını Vercel'e ekleyin

1. Proje sayfasında **Settings → Environment Variables**'a gidin.
2. Key: `FIREBASE_SERVICE_ACCOUNT_KEY`
   Value: Firebase Console'dan daha önce indirdiğiniz `.json` dosyasının
   TÜM içeriği (aynı değeri Netlify'da kullanmıştınız).
3. **"Save"** deyin.
4. **Deployments** sekmesinden en son deploy'un yanındaki ⋯ menüsünden
   **"Redeploy"** deyin (ortam değişkeni ancak yeni bir deploy'da devreye girer).

## 5. Test edin

Vercel'in verdiği adresi (örn. `https://izin-portali-vercel.vercel.app`)
açın, sicil no + şifrenizle giriş yapın. "Yeni Çalışan Ekle" gibi admin
işlemlerini de test edin.

## Notlar

- Vercel Hobby (ücretsiz) planında fonksiyon çalışma süresi sınırı Netlify'a
  göre daha cömert (60 saniyeye kadar), bu yüzden toplu çalışan içe
  aktarımında büyük gruplarla daha az zaman aşımı riski yaşarsınız — yine de
  110 gibi büyük sayılarda 20-30'luk gruplar halinde yüklemeniz önerilir.
- Vercel Hobby planı sözleşme olarak kişisel/ticari olmayan kullanım için
  tanımlanmıştır; küçük ölçekli şirket içi araçlar için pratikte yaygın
  olarak kullanılıyor olsa da, büyüdükçe Pro plana geçmeyi değerlendirin.
- Eski Netlify sitenizi silmenize gerek yok; Vercel deploy'u sorunsuz
  çalıştığından emin olduktan sonra Netlify'daki eski adresi kullanmayı
  bırakabilirsiniz.
