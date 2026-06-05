# Smart Order Tracker
## Automasi Pemrosesan Order Online dan Notifikasi Real-Time Menggunakan n8n & AI

> **Tugas Besar RPA (Robotic Process Automation)**  
> Platform: n8n | AI: OpenAI/Gemini | Notifikasi: Telegram | Database: Google Sheets

---

## Struktur File

```
smart_order_tracker/
├── index.html    ← Form order (tampilan utama)
├── style.css     ← Desain & layout
├── script.js     ← Logika form & koneksi ke n8n
└── README.md     ← Panduan ini
```

---

## Cara Setup (Step-by-Step)

### 1. Siapkan Telegram Bot
1. Buka Telegram → cari `@BotFather`
2. Kirim `/newbot` → ikuti instruksi
3. Salin **Bot Token**
4. Kirim pesan ke bot → buka `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Salin nilai `"id"` dari `"chat"` → itu **Chat ID** kamu

### 2. Siapkan Google Sheets
1. Buat spreadsheet baru: **Smart Order Tracker DB**
2. Header di baris 1 (A1 s/d I1):
   ```
   Order ID | Timestamp | Nama | Email | Telepon | Produk | Jumlah | Alamat | Status | Ringkasan AI | Catatan
   ```
3. Salin **Spreadsheet ID** dari URL

### 3. Setup n8n
- **Cloud**: Daftar di https://n8n.cloud
- **Lokal**: `npm install -g n8n && n8n start` → buka http://localhost:5678

### 4. Buat Workflow n8n

#### Node 1 — Webhook (Trigger)
- Type: `Webhook`
- Method: `POST`
- Path: `order-masuk`
- Response: `Respond to Webhook`
- ⚠️ Salin Production URL → masukkan ke `script.js` (CONFIG.N8N_WEBHOOK_URL)

#### Node 2 — Set (Format Data)
- Type: `Set`
- Tambah field manual:

| Name        | Value                                          |
|-------------|------------------------------------------------|
| order_id    | `={{ $json.body.order_id }}`                  |
| timestamp   | `={{ $json.body.timestamp }}`                 |
| nama        | `={{ $json.body.nama }}`                      |
| email       | `={{ $json.body.email }}`                     |
| telepon     | `={{ $json.body.telepon }}`                   |
| produk      | `={{ $json.body.produk }}`                    |
| jumlah      | `={{ $json.body.jumlah }}`                    |
| alamat      | `={{ $json.body.alamat }}`                    |
| catatan     | `={{ $json.body.catatan }}`                   |
| status      | `Order Masuk`                                 |

#### Node 3 — Google Sheets (Simpan Data)
- Type: `Google Sheets`
- Operation: `Append or Update Row`
- Connect Google Account via OAuth
- Spreadsheet: Smart Order Tracker DB
- Sheet: Sheet1
- Column: mapping sesuai header

#### Node 4 — OpenAI (AI Ringkasan)
- Type: `OpenAI`
- Operation: `Message a Model`
- Model: `gpt-4o-mini`
- System Prompt: `Kamu adalah asisten untuk merangkum order belanja dalam Bahasa Indonesia.`
- User Message:
  ```
  Buatkan ringkasan singkat dan informatif untuk order berikut (2-3 kalimat):
  
  Order ID: {{ $('Set').item.json.order_id }}
  Nama: {{ $('Set').item.json.nama }}
  Email: {{ $('Set').item.json.email }}
  Produk: {{ $('Set').item.json.produk }}
  Jumlah: {{ $('Set').item.json.jumlah }} unit
  Alamat: {{ $('Set').item.json.alamat }}
  Catatan: {{ $('Set').item.json.catatan }}
  
  Mulai dengan: "📦 Order baru dari [nama]..."
  ```

#### Node 5 — Telegram (Kirim Notifikasi)
- Type: `Telegram`
- Credential: masukkan Bot Token
- Operation: `Send Message`
- Chat ID: (Chat ID kamu)
- Parse Mode: `MarkdownV2`
- Text:
  ```
  🛍️ *ORDER BARU MASUK*
  
  📋 *Order ID:* `{{ $('Set').item.json.order_id }}`
  👤 *Pelanggan:* {{ $('Set').item.json.nama }}
  📧 *Email:* {{ $('Set').item.json.email }}
  📦 *Produk:* {{ $('Set').item.json.produk }}
  🔢 *Jumlah:* {{ $('Set').item.json.jumlah }} unit
  📍 *Alamat:* {{ $('Set').item.json.alamat }}
  📅 *Waktu:* {{ $('Set').item.json.timestamp }}
  🔄 *Status:* {{ $('Set').item.json.status }}
  
  🤖 *Ringkasan AI:*
  {{ $('OpenAI').item.json.message.content }}
  ```

#### Node 6 — Webhook Response
- Type: `Respond to Webhook`
- Response Code: `200`
- Response Body:
  ```json
  { "success": true, "order_id": "{{ $('Set').item.json.order_id }}", "message": "Order berhasil diterima" }
  ```

### 5. Hubungkan Website ke n8n
Buka `script.js`, ganti baris ini:
```javascript
N8N_WEBHOOK_URL: "https://YOUR_N8N_INSTANCE/webhook/order-masuk",
```
Dengan URL webhook production dari n8n kamu.

---

## Workflow Status Update (Opsional/Bonus)

Buat workflow kedua di n8n:
1. **Webhook** — path: `update-status`
2. **Google Sheets** — Update Row (cari berdasarkan Order ID, update kolom Status)
3. **Telegram** — Kirim notifikasi perubahan status

---

## Outline Slide Presentasi (15–20 Slide)

| No | Judul Slide | Isi |
|----|-------------|-----|
| 1  | Cover | Judul, nama, NIM, mata kuliah |
| 2  | Agenda | Daftar topik yang akan dibahas |
| 3  | Latar Belakang | Masalah pencatatan order manual |
| 4  | Tujuan & Manfaat | Apa yang diselesaikan proyek ini |
| 5  | Landasan Teori: RPA | Definisi, konsep, trigger-based automation |
| 6  | Landasan Teori: AI | NLG, GPT, penggunaan di industri |
| 7  | Teknologi yang Digunakan | n8n, Google Sheets, Telegram, OpenAI |
| 8  | Arsitektur Sistem | Diagram alur end-to-end |
| 9  | Perancangan: Form Web | Screenshot + penjelasan HTML/CSS/JS |
| 10 | Perancangan: Workflow n8n | Screenshot setiap node |
| 11 | Implementasi: Webhook | Cara setup dan test |
| 12 | Implementasi: Google Sheets | Struktur database |
| 13 | Implementasi: Integrasi AI | Prompt dan output AI |
| 14 | Implementasi: Telegram | Contoh notifikasi diterima |
| 15 | Demo Live | (jalankan demo langsung) |
| 16 | Hasil Pengujian | Tabel test case + hasil |
| 17 | Kesimpulan | Apa yang berhasil, kendala, saran |
| 18 | Referensi | Daftar pustaka |

---

## Skenario Demo Presentasi

### Urutan Demo (±5 menit):
1. Buka `index.html` di browser
2. Isi form: Nama = **Budi Santoso**, Email = **budi@test.com**, Telepon = **081234567890**
3. Pilih produk: **Laptop Asus VivoBook 14**, Jumlah = **2**
4. Catatan: **Warna hitam jika ada**, Alamat = **Jl. Melati No. 5, Bandung**
5. Klik Submit → tunjukkan loading state
6. Buka Google Sheets → tunjukkan data masuk otomatis
7. Buka Telegram → tunjukkan notifikasi masuk beserta ringkasan AI
8. Tunjukkan kolom "Ringkasan AI" di Sheets → hasilnya dari GPT
9. (Bonus) Ubah status manual di Sheets → tunjukkan notifikasi update

### Backup Demo (jika internet lemot):
- Siapkan screenshot/video recording sebagai backup
- Siapkan data dummy yang sudah ada di Sheets

---

## 20 Pertanyaan Dosen & Jawaban

**Q1: Apa bedanya RPA dengan pemrograman biasa?**
> RPA mengotomasi proses berulang yang biasanya dilakukan manusia di antarmuka aplikasi, tanpa mengubah sistem yang sudah ada. Sementara pemrograman biasa membangun fungsi baru dari awal.

**Q2: Mengapa memilih n8n dibanding tools lain seperti Zapier atau Make?**
> n8n bersifat open-source, bisa di-host sendiri, lebih fleksibel dalam kustomisasi node, dan tidak ada batasan eksekusi ketat. Cocok untuk lingkungan akademis karena gratis dan transparan.

**Q3: Bagaimana cara kerja webhook dalam proyek ini?**
> Webhook adalah URL unik yang dibuat n8n untuk "mendengarkan" request HTTP. Saat form disubmit, browser mengirim data JSON ke URL tersebut via POST, dan n8n langsung memproses data itu secara otomatis.

**Q4: Apa fungsi AI dalam sistem ini?**
> AI (OpenAI GPT) bertugas mengubah data order yang berupa field-field terstruktur menjadi ringkasan teks yang mudah dibaca manusia. Ini adalah penerapan Natural Language Generation (NLG).

**Q5: Bagaimana keamanan data pengguna dalam sistem ini?**
> Data dikirim via HTTPS ke webhook n8n. Google Sheets hanya dapat diakses oleh akun yang diotorisasi. Bot Token dan API Key tidak pernah di-expose di frontend.

**Q6: Apa kelebihan Google Sheets sebagai database?**
> Mudah diakses tanpa konfigurasi server, sudah familier, mendukung Google Sheets API, dan cocok untuk demo/prototype. Untuk produksi, idealnya diganti dengan database seperti PostgreSQL.

**Q7: Apakah sistem ini bisa di-scale untuk ribuan order?**
> Untuk skala kecil-menengah bisa. Untuk ribuan order/hari, perlu upgrade ke database proper dan n8n yang di-host di server dengan resource memadai.

**Q8: Apa itu node dalam n8n?**
> Node adalah blok pemrosesan dalam workflow n8n. Setiap node memiliki fungsi spesifik: ada node trigger (pemicu), processing (pengolahan), dan action (aksi seperti kirim pesan atau simpan data).

**Q9: Bagaimana cara mengatasi jika webhook timeout?**
> Pastikan semua node memproses data dengan cepat. Tambahkan error handling di n8n menggunakan node "Error Trigger". Di frontend, sudah ada try-catch untuk menangani kegagalan koneksi.

**Q10: Mengapa menggunakan multi-step form?**
> Untuk UX yang lebih baik. Memecah form panjang menjadi langkah-langkah kecil mengurangi cognitive load pengguna dan memudahkan validasi per-step sebelum submit final.

**Q11: Apa perbedaan OpenAI dan Gemini? Mana yang kamu pilih?**
> OpenAI (GPT-4o-mini) lebih matang ekosistemnya dan lebih mudah diintegrasikan dengan n8n. Gemini dari Google juga bisa dipakai dan lebih murah. Untuk proyek ini saya pilih OpenAI karena dokumentasi n8n node-nya lebih lengkap.

**Q12: Bagaimana jika Telegram gagal menerima notifikasi?**
> n8n memiliki fitur retry otomatis. Bisa juga ditambahkan node "IF" untuk cek response Telegram dan kirim email backup jika gagal.

**Q13: Konsep RPA apa yang paling terlihat dalam proyek ini?**
> Trigger-based automation: sistem menunggu event (form disubmit), lalu menjalankan serangkaian proses secara otomatis tanpa intervensi manusia — persis seperti definisi RPA.

**Q14: Bagaimana cara menambahkan fitur update status order?**
> Buat workflow n8n kedua dengan webhook `/update-status`. Saat menerima Order ID dan status baru, workflow mencari row di Google Sheets dan mengupdate kolom Status, lalu mengirim notifikasi Telegram.

**Q15: Apakah proyek ini bisa diintegrasikan dengan WhatsApp?**
> Ya, dengan menggunakan WhatsApp Business API atau service pihak ketiga seperti Twilio atau WATI, yang bisa dihubungkan ke n8n melalui node HTTP Request.

**Q16: Apa limitasi sistem yang kamu buat?**
> Status update masih manual di Sheets, belum ada autentikasi pengguna, dan data inventory produk masih hardcoded di form. Ini area yang bisa dikembangkan selanjutnya.

**Q17: Mengapa memilih format JSON untuk komunikasi antara form dan n8n?**
> JSON adalah standar pertukaran data di web API, ringan, mudah diparse, dan didukung native oleh JavaScript dan n8n tanpa library tambahan.

**Q18: Bagaimana cara testing workflow n8n tanpa frontend?**
> Bisa menggunakan Postman atau curl untuk mengirim POST request langsung ke URL webhook dengan body JSON. n8n juga punya fitur "Test Workflow" built-in.

**Q19: Apa yang dimaksud automation dalam konteks RPA?**
> Automation adalah penggantian tugas manual berulang dengan proses yang berjalan otomatis berdasarkan aturan (rules) atau event tertentu, tanpa perlu campur tangan manusia setiap kali proses berjalan.

**Q20: Bagaimana potensi pengembangan sistem ini ke depan?**
> Bisa dikembangkan dengan: (1) Dashboard admin web real-time, (2) Integrasi payment gateway, (3) Sistem tracking pengiriman otomatis, (4) Notifikasi email ke pelanggan, (5) Laporan penjualan otomatis mingguan via AI.

---

## Estimasi Waktu & Tingkat Kesulitan

| Komponen | Waktu | Kesulitan | Risiko Error |
|---|---|---|---|
| Setup Telegram Bot | 15 menit | ⭐ Mudah | Rendah |
| Setup Google Sheets | 10 menit | ⭐ Mudah | Rendah |
| Setup n8n | 30 menit | ⭐⭐ Sedang | Sedang (jika lokal) |
| Webhook + Set Node | 20 menit | ⭐⭐ Sedang | Sedang |
| Google Sheets Node | 20 menit | ⭐⭐ Sedang | Tinggi (OAuth) |
| OpenAI Node | 15 menit | ⭐⭐ Sedang | Rendah |
| Telegram Node | 15 menit | ⭐ Mudah | Rendah |
| Customize HTML/CSS | 60 menit | ⭐⭐⭐ Sedang+ | Rendah |
| Testing & Debug | 30 menit | ⭐⭐ Sedang | Bervariasi |
| **Total** | **~3.5 jam** | **Sedang** | |

### Error Umum & Solusinya

| Error | Penyebab | Solusi |
|---|---|---|
| CORS Error di browser | Webhook URL salah/tidak aktif | Aktifkan workflow, cek URL production |
| 401 Unauthorized (Sheets) | OAuth expired | Re-auth Google di n8n credentials |
| Telegram: chat not found | Chat ID salah | Kirim pesan ke bot dulu, lalu getUpdates |
| OpenAI: 429 Too Many Requests | Rate limit API | Tunggu sebentar atau upgrade plan |
| n8n: Execution failed | Node tidak terhubung | Cek koneksi antar node di editor |

---

## Tips Presentasi

1. **Test demo H-1** — jangan test pertama kali saat presentasi
2. **Siapkan video backup** — rekam demo yang berhasil sebagai antisipasi
3. **Buka 3 tab browser**: form web, Google Sheets, dan Telegram Web
4. **Ceritakan alur data** saat demo: "Saya isi form → data masuk ke n8n → disimpan ke Sheets → AI merangkum → notifikasi masuk ke Telegram"
5. **Fokus ke konsep RPA**: jelaskan bahwa ini adalah trigger-based automation yang menggantikan proses manual

---

*Smart Order Tracker — Tugas RPA menggunakan n8n & AI*
