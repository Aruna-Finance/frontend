Project ini pakai Next.js App Router (struktur app/ sudah ada). Baca dulu semua file
mockup di [tunjukkan path folder mockup .dc.html kamu] sebelum mulai apapun — jangan
bikin komponen dulu sebelum selesai baca semuanya.

PENTING soal nama: semua referensi "VarSwap" di mockup HARUS jadi "Aruna" di kode.
Termasuk nama kontrak (VarSwapFactory → ArunaFactory), variable, folder, komentar.
Jangan ada satupun sisa "VarSwap" di kode yang dihasilkan.

=== LANGKAH 1 — Ekstrak design token, JANGAN bikin UI dulu ===

Dari semua file mockup, kumpulkan dan tulis ke lib/design-tokens.ts:

1. Semua warna hex, dikelompokkan berdasarkan fungsi (background, surface, border,
   teks utama, teks sekunder, aksen oranye #E08A4A, aksen hijau/teal #6BBFA4, danger)
2. Font family (Instrument Serif untuk display, IBM Plex Sans untuk body,
   IBM Plex Mono untuk data/angka) dan tiap ukuran yang dipakai
3. Nilai border-radius yang berulang
4. Pola spasi (padding/gap) yang sering muncul

Ubah jadi CSS variable di app/globals.css DAN export sebagai object TypeScript di
lib/design-tokens.ts supaya bisa diimport ke tailwind.config.

=== LANGKAH 2 — Inventarisasi komponen berulang, MASIH belum bikin halaman ===

Bandingkan semua halaman mockup. Cari pola UI yang muncul di lebih dari satu halaman:

- Kartu statistik (label kecil uppercase + angka mono besar)
- Capacity bar (progress bar + teks "reserving X / Y free")
- Badge status cohort (FUNDING/ACTIVE/SETTLING/SETTLED, tiap status warna beda)
- Baris posisi (position row) — dipakai di LPActive, LPSettlement, UWDashboard
- Banner peringatan (background merah/oranye redup, ikon, teks) — pola dari States.dc.html
- Step indicator (1·POSITION — 2·COVER — 3·CONFIRM) di alur LP
- Tombol tiga varian: primary (oranye), ghost (border aja), disabled

Tulis daftar ini sebagai komentar di components/aruna/README.md sebelum mulai coding
komponennya — supaya kelihatan jelas rencana sebelum eksekusi.

Baru setelah itu, bangun tiap komponen itu SATU KALI di components/aruna/, dengan props
yang jelas typed (TypeScript interface per komponen, taruh di types/).

=== LANGKAH 3 — Setup struktur pendukung ===

Bikin folder dan file kosong/placeholder ini, ikuti struktur berikut PERSIS:

lib/contracts/
addresses.ts → export object kosong dengan komentar "// TODO: isi setelah deploy"
abis/ → satu file per kontrak (coverVault.ts, varianceAccumulator.ts,
premiumPricer.ts, arunaFactory.ts), masing-masing export array
ABI kosong dulu, komentar "// TODO: paste ABI dari artifact"
config.ts → setup wagmi buat Arbitrum One (chain id 42161), komentar
placeholder untuk RPC url

lib/mock/
vaults.ts, positions.ts, cohorts.ts, proof.ts
→ isi dengan data mock yang SAMA PERSIS angkanya kayak yang muncul di mockup
(WETH/USDC 0.05%, cohort 12, realized vol 41.2%, strike 35%, premium 380, dst)

lib/content/
copy.ts → SEMUA teks produk dari mockup dipindah ke sini sebagai konstanta,
kata-per-kata SAMA PERSIS dengan yang ada di file .dc.html —
jangan diparafrase, jangan "dirapikan", copy-paste verbatim
copy-rules.md → catat larangan: tidak ada "protocol fee" kecuali eksplisit
diputuskan (ini masih pertanyaan terbuka, tandai sebagai
// TODO: konfirmasi apakah protocol fee ini beneran ada)

hooks/
useVaults.ts, usePosition.ts, useCohort.ts, useQuote.ts
→ SEKARANG baca dari lib/mock/, tapi return shape-nya harus generic (tidak nempel
ke struktur mock), supaya nanti gampang diganti ke useReadContract dari wagmi
tanpa ubah komponen yang manggil hook ini

=== ATURAN KERAS ===

- Komponen di components/ TIDAK BOLEH import apapun dari lib/contracts/ atau lib/mock/
  secara langsung — HARUS lewat hooks/
- Tidak ada teks hardcoded di JSX — semua dari lib/content/copy.ts
- Tidak ada angka hardcoded di JSX — semua dari lib/mock/ lewat hooks/
- Tidak ada style inline — semua lewat Tailwind class yang baca dari design-tokens
- Jalankan skill avoid-ai-design setelah tiap halaman selesai, sebelum lanjut ke
  halaman berikutnya

Setelah Langkah 1-3 selesai, JANGAN langsung bikin semua halaman sekaligus — laporkan
dulu hasil design-tokens.ts dan daftar komponen dari Langkah 2, saya review dulu
sebelum lanjut ke pembuatan halaman satu-satu.
