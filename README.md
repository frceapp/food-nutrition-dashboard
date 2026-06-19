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

Rules hanya memberikan akses kepada Firebase user dengan custom claim admin yang juga masih aktif di koleksi `whitelist_entries`.

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
