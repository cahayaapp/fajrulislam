CAHAYA APP V63 — PUSH NOTIFICATION

Backend ini sudah diarahkan ke project:
absensi-santri-fajrul-islam
Database instance:
absensi-santri-fajrul-islam-default-rtdb
Region RTDB: us-central1

Trigger aktif setelah Cloud Functions dideploy:
1. Pesan baru dari Direktur / Wakil Direktur / Konselor / Admin ke wali.
2. Kabar Ananda baru dari indeks: halaqah, tahfiz, program, pembelajaran, pembinaan.
3. Notifikasi sistem khusus wali.
4. Broadcast wali / semua pengguna.

Frontend Portal Wali V63 otomatis:
- meminta izin notifikasi melalui tombol yang ditekan user;
- mendaftarkan service worker;
- membuat token FCM;
- menyimpan reverse index wali berdasarkan santri;
- membuka Kabar Ananda / chat saat notifikasi diketuk.

Deploy backend (sekali saja dari komputer yang sudah login Firebase CLI):
  cd push-backend
  npm --prefix functions install
  firebase deploy --only functions

VAPID key bersifat opsional pada frontend V63. Bila Anda sudah membuat Web Push certificate di Firebase Console, simpan public key di:
cahaya_app/pengaturan_notifikasi_web/vapidKey

FCM membutuhkan HTTPS pada deployment produksi.
