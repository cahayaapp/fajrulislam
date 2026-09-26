# Face Attendance POC Multi-Device

Halaman: `dev/face-attendance-poc.html`

POC ini belum menggantikan Absensi Program produksi dan belum di-deploy.

## Arsitektur

```text
Laptop Admin
  -> callable saveFaceProfilePoc
  -> RTDB privat cahaya_app/face_attendance_poc/profiles/{studentKey}

HP Naqib
  -> callable syncFaceProfilesPoc(programId)
  -> backend memeriksa auth.uid, role, program, dan roster
  -> hanya profil roster aktif dikirim ke HP
  -> cache IndexedDB
  -> matching wajah lokal
  -> callable submitFaceCheckInPoc
```

Video dan frame kamera tidak dikirim ke server. Backend hanya menyimpan embedding dan metadata template. Check-in hanya mengirim hasil identifikasi, confidence, versi model, timestamp recognition, dan metadata perangkat/sesi minimal.

## Backend POC

Source of truth berada di Firebase RTDB melalui Admin SDK:

```text
cahaya_app/face_attendance_poc/
  programs/{programId}
  profiles/{studentKey}
  enrollment_audit/{auditId}
  checkins/{sessionId}/{studentKey}
```

Client tidak membaca atau menulis path tersebut secara langsung. Rules menetapkan `.read: false` dan `.write: false`; akses dilakukan melalui callable Functions:

- `getFaceAttendancePocContext`
- `saveFaceProfilePoc`
- `listFaceProfilesPoc`
- `syncFaceProfilesPoc`
- `submitFaceCheckInPoc`

Contoh konfigurasi program development:

```json
{
  "active": true,
  "name": "Shalat Subuh Putra",
  "unit": "PUTRA",
  "startTime": "04:00:00",
  "onTimeCutoff": "04:45:00",
  "scanCloseTime": "06:00:00",
  "timeZone": "Asia/Jakarta",
  "version": 1,
  "roster": { "student:contoh:key": true },
  "allowedNaqibUids": { "firebase-auth-uid-naqib": true }
}
```

Konfigurasi harus dibuat oleh proses admin terpercaya. Jangan memberikan client write ke `programs`.

## Enrollment Admin

1. Login Firebase Auth sebagai akun internal aktif dengan role Admin/Administrator/Direktur pada `cahaya_access/users/{uid}`.
2. Buka tab **Enrollment** dan pilih santri berdasarkan `studentKey` master.
3. Ambil empat sampel: depan, sedikit kiri, sedikit kanan, dan normal.
4. Browser menghasilkan embedding FaceRes; foto tidak disimpan.
5. Function memvalidasi versi, 4–8 sampel, vektor 1024, dan role; `profileVersion` dinaikkan transaksional.
6. Enrollment ulang memerlukan konfirmasi. Audit sebelumnya tidak dihapus.

## HP Naqib

1. Login Firebase Auth sebagai Naqib yang UID-nya ditugaskan pada program.
2. Pilih program dan tekan **Sync Face Profiles**.
3. Backend hanya mengirim profil aktif dalam roster program.
4. Template menjadi cache IndexedDB. Cache yang dihapus dapat diunduh lagi tanpa enrollment ulang.
5. Perbedaan `modelVersion` atau `embeddingVersion` menolak cache dan meminta pembaruan template.

## Offline

- Sesudah profil tersinkron, recognition tetap berjalan lokal.
- Check-in gagal kirim masuk `pendingCheckins` dengan `pendingSync: true` dan `submissionId` idempoten.
- Event `online` mencoba sinkron ulang.
- Check-in online memakai waktu server sebagai dasar status resmi.
- Check-in offline mempertahankan `recognitionTimestamp`, tetapi diberi `timeBasis: CLIENT_OFFLINE_REQUIRES_REVIEW`, `requiresReview: true`, dan `syncDelayMs`.

## IndexedDB

Database `cahaya-face-attendance-poc`:

- `enrollments`: cache template roster, bukan sumber kebenaran.
- `sessions`: sesi/check-in lokal.
- `pendingCheckins`: antrean offline.
- `meta`: deviceId dan metadata sync.

IndexedDB tidak terenkripsi dan belum layak untuk penyimpanan biometrik produksi. Produksi memerlukan enkripsi, kebijakan persetujuan/retensi/penghapusan, dan threat model.

## Model dan threshold

- Model: `@vladmandic/human@3.3.6:faceres`
- Embedding: `faceres-1024-v1`
- Similarity minimal: `0.62`
- Margin kandidat kedua: `0.06`
- Liveness dasar: tiga frame, perubahan yaw `0.12`, `real >= 0.5`, `live >= 0.5`

Threshold harus dikalibrasi melalui uji santri nyata dengan prioritas false-positive sangat rendah.

## Menjalankan dan batas POC

Sajikan repository melalui HTTPS. `localhost` dapat dipakai untuk desktop; HP melalui alamat LAN memerlukan HTTPS agar `getUserMedia()` diizinkan.

- Functions/rules hanya repository preparation; tidak di-deploy pada task ini.
- Uji otomatis memakai embedding sintetis untuk membuktikan Device A/B/C, cache, versioning, offline queue, dan permission logic.
- Akurasi nyata, peci, pencahayaan, suhu HP, serta spoof foto/video tetap memerlukan uji fisik dengan persetujuan subjek.
- Offline timestamp tidak sepenuhnya terpercaya tanpa attestation; record sengaja ditandai untuk review.
- Program roster POC harus disiapkan pada backend development sebelum uji HP nyata.
