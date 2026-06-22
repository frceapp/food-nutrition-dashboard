# NUTRIA Dashboard

Repository dashboard adalah aplikasi React independen. Browser menggunakan Firebase Authentication dan membaca Cloud Firestore secara langsung; tidak ada `API_URL` atau request dashboard ke backend FastAPI.

## Konfigurasi Firebase

1. Salin `.env.example` menjadi `.env`.
2. Isi seluruh nilai `FIREBASE_*` dari konfigurasi Firebase Web App. Nilainya sama dengan konfigurasi Firebase di `.env` bot.
3. Aktifkan Firebase Authentication dan Cloud Firestore.
4. Deploy rules dan index:

```powershell
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy --only firestore
```

Rules memberikan admin aktif akses pengelolaan penuh dashboard. Pengguna whitelist biasa hanya dapat membaca profil dan log makanan miliknya sendiri.

### Error `auth/configuration-not-found`

Buka Firebase Console untuk project yang sama, pilih **Authentication**, lalu klik **Get started**. Custom-token login tidak memerlukan provider email atau Google, tetapi layanan Authentication tetap harus diinisialisasi. Tambahkan domain deployment dashboard di **Authentication > Settings > Authorized domains**.

## Development

```powershell
npm install
npm run dev
```

## Docker

Compose membaca nilai `FIREBASE_*` dari `.env` dan memasukkannya sebagai runtime config Nginx:

```powershell
docker compose up --build
```

Dashboard tersedia pada port `5173` secara default.

## Build

```powershell
npm run build
```

Firebase Web App config bersifat publik. Kontrol akses data tetap dilakukan oleh Firebase Authentication dan [`firestore.rules`](firestore.rules).

Jangan menyalin `OPENROUTER_API_KEY` atau file service-account ke repository/dashboard server. Keduanya hanya diperlukan oleh bot.

## Login dengan kode pendek

Pengguna whitelist mengirim `login` atau `dashboard` ke bot WhatsApp. Tautan yang diterima hanya membawa kode acak pendek, bukan Firebase JWT. Bot menyimpan token sementara pada dokumen Firestore dengan document ID berupa hash SHA-256 kode. Dashboard mengambil dokumen tersebut langsung dari Firestore, login ke Firebase, lalu menghapusnya. Dashboard tidak menghubungi backend bot dan tidak memerlukan `AUTH_API_URL`.

Deploy [`firestore.rules`](firestore.rules) setelah perubahan ini. Rules mengizinkan pembacaan satu dokumen login yang diketahui kodenya dan belum kedaluwarsa, melarang listing koleksi, serta hanya mengizinkan admin terkait menghapus dokumen setelah login.

## Pengaturan dan statistik penggunaan

Menu **Pengaturan** menyimpan maintenance manual/terjadwal, jeda dan kuota gambar, batas revisi, serta timeout konfirmasi otomatis ke `app_settings/runtime`. Menu **Penggunaan** membaca telemetry `usage_events` untuk menampilkan request WhatsApp, gambar, revisi, token OpenRouter, estimasi biaya, pengguna aktif, dan tren 7/30 hari.

Rules terbaru wajib dideploy sebelum kedua menu tersebut digunakan:

```powershell
firebase deploy --only firestore:rules
```
