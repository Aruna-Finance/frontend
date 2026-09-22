# Aruna — inventarisasi komponen (dari 13 halaman mockup)

Dibuat sebelum coding, sesuai `app/docs/guide.md` Langkah 2. Daftar di bawah adalah pola UI
yang muncul di lebih dari satu halaman mockup (`VarSwap — Full Product Flow`), bukan
turunan dari `guide.md` semata — sebagian nama pola di `guide.md` sudah cocok, sebagian
saya sesuaikan dengan yang benar-benar ada di source mockup (dicatat di bagian
"Penyesuaian dari draf guide.md" di bawah).

## Kemunculan lintas halaman

| Pola | Sumber (halaman) | Catatan varian |
| --- | --- | --- |
| **Header nav** | Semua 13 halaman | Varian landing (logo besar, 2 tombol CTA) vs varian app (logo kecil, 4 nav link + tab aktif underline + wallet chip + kadang 1 tombol sekunder di kanan) |
| **Button** | Semua halaman | 3 gaya visual: primary (bg oranye, teks gelap), ghost (border saja), disabled (border+teks muram). Sebagian dirender `<a>` (navigasi antar mockup), nanti jadi `next/link` atau `<button>` tergantung konteks |
| **Card** (kontainer dasar) | Semua halaman | Default (`border-border`), raised/highlight (border oranye 1.5px, dipakai utk "kartu quote/keputusan penting"), danger (border+bg merah redup), success (border hijau redup, dipakai UWSettlement) |
| **StatCard** (label uppercase kecil + angka mono besar) | Main (hero), MarketDetail, LPActive, UWDashboard, UWVaults, UWSettlement, Proof | Kadang solo, kadang grid 2/3/4 kolom. Value bisa punya warna semantik (positive/negative/accent) |
| **DetailRow** (label kiri, value mono kanan, divider bawah) | LPQuote, LPConfirm, LPActive, LPSettlement, UWDeposit, UWSettlement, Proof | Pola paling sering berulang di seluruh mockup — dipakai di dalam card breakdown apa pun |
| **ProgressBar / CapacityBar** | Markets (tabel), MarketDetail, LPQuote, States ("between cycles"), UWDashboard (mini bar per skenario), UWSettlement (split bar) | Dua varian tebal: track 5-6px (radius 3px) dan track 8px (radius 4px). Label pendamping bervariasi ("reserving X / Y free", "N of M samples", dst) — dibuat sebagai `caption` opsional, bukan teks hardcode |
| **Badge / status pill** | LPSelectPosition (IN RANGE/OUT OF RANGE), UWVaults (COHORT OPEN), LPActive (IN THE MONEY), LPSettlement (PAID OUT/NO PAYOUT), UWSettlement (LOSING CYCLE), States (BLOCKING/WARNING/INTEGRITY/TRANSIENT/EMPTY/RETRY) | Dibuat generik (label + tone), **bukan** di-hardcode ke kata tertentu — tone yang tersedia: accent, positive, negative, neutral |
| **StepIndicator** (1·POSITION — 2·COVER — 3·CONFIRM) | LPSelectPosition, LPQuote, LPConfirm | Hanya di alur LP 3 langkah |
| **NumberedStep** (lingkaran nomor/check + teks) | LPConfirm ("two transactions" — status done/pending), UWDeposit ("what you are signing up for" — semua status default) | Disatukan jadi satu atom dengan prop `status` |
| **AmountInput** (input mono besar + suffix unit + tombol persen cepat) | LPQuote (coverage, tombol 25%/50%/Max), UWDeposit (amount, tombol Half/Max) | Tombol cepat dibuat sebagai daftar `{label, onClick}`, bukan hardcode 2 vs 3 tombol |
| **AcknowledgeCheckbox** | LPConfirm, UWDeposit | Checkbox + label panjang, dipakai sebelum tombol konfirmasi berbahaya |
| **StateCard** (tag status + kotak pesan + tombol aksi + footnote alasan) | States.dc.html (8 kali dalam satu halaman: capacity kurang, cohort hampir habis, oracle gap, antar-siklus, no positions, no vault, quote expired, wrong network) | Ini satu komponen yang dipakai berulang di satu halaman itu sendiri — tapi dirancang generik supaya field yang sama bisa dipicu di halaman transaksional (mis. LPQuote saat kapasitas kurang) |
| **Table primitives** (Table/TableRow/TableCell, grid kolom kustom per tabel) | Markets, UWDashboard (skenario), UWSettlement (klaim per underwriter), Proof (sampel TWAP) | Kolom & lebar beda tiap tabel → dibuat primitif komposisi (bukan 1 komponen tabel super-spesifik), baris punya prop `highlighted` untuk baris "kamu"/"sekarang" |
| **LineChart** (SVG polyline + grid + garis ambang putus-putus) | Main (sparkline hero, 2 kartu calm/whipsaw), MarketDetail, LPQuote (kurva payout), LPActive, LPSettlement (mini outcome) | Paling bervariasi — dibuat sebagai primitif rendah (titik, threshold lines, marker akhir) supaya tiap halaman bisa compose sendiri, BUKAN satu komponen "chart realized vol" yang kaku |
| **BarHistoryChart** | UWVaults (mini bar per pool), UWDashboard (cycle history) | Bar tunggal per periode, warna per-bar bisa beda (untung/rugi) |

## Yang TIDAK jadi komponen terpisah (dan alasannya)

- **PositionCard (LPSelectPosition)** dan **VaultSummaryCard (UWVaults)** — bentuknya mirip
  (baris besar: judul+badge kiri, meta, grid/stat, tombol aksi kanan) tapi isi internalnya
  cukup beda (satu pakai badge+range, satu pakai bar chart mini+3 stat). Dipaksakan jadi satu
  komponen generik berisiko `props` jadi keranjang sampah. Keduanya dibangun sebagai
  komponen halaman terpisah, tersusun dari atom yang sama (`Card`, `Badge`, `StatCard`,
  `Button`, `BarHistoryChart`) — bukan di `components/aruna/` tapi nanti di level halaman
  masing-masing pada Langkah 4.
- **Callout/banner berdiri sendiri** — awalnya dikira perlu komponen banner terpisah dari
  `StateCard`, tapi isinya (tag+pesan+aksi+footnote) sama persis dengan `StateCard`. Jadi
  banner peringatan di LPConfirm ("read this before signing") dipakai lewat `StateCard` juga
  (varian tanpa tombol aksi), bukan komponen baru.

## Penyesuaian dari draf guide.md

- **"Badge status cohort (FUNDING/ACTIVE/SETTLING/SETTLED)"** — kata-kata itu tidak muncul
  sebagai badge literal di mockup manapun (itu istilah state-machine dari desain smart
  contract). Badge di mockup yang benar-benar ada: IN RANGE/OUT OF RANGE, COHORT OPEN, IN
  THE MONEY, PAID OUT/NO PAYOUT/LOSING CYCLE, dan 6 tag di States. Komponen `Badge` dibuat
  generik (`label` bebas + `tone`) supaya kata FUNDING/ACTIVE dkk tetap bisa dipakai nanti
  tanpa ubah komponen.
- **"Baris posisi (position row) — dipakai di LPActive, LPSettlement, UWDashboard"** — saya
  tidak menemukan pola "baris posisi" yang identik di tiga halaman itu di source mockup
  yang sebenarnya. Yang ada di sana adalah `StatCard`, `DetailRow`, dan tabel skenario —
  sudah tercakup oleh atom di atas. Saya catat ini sebagai koreksi, bukan diam-diam
  diabaikan.

## Struktur file

```
types/aruna.ts              — interface props semua komponen di bawah
components/aruna/
  Button.tsx
  Card.tsx
  Badge.tsx
  StatCard.tsx
  DetailRow.tsx
  ProgressBar.tsx
  StepIndicator.tsx
  NumberedStep.tsx
  AmountInput.tsx
  AcknowledgeCheckbox.tsx
  StateCard.tsx
  Table.tsx
  Header.tsx
  charts/LineChart.tsx
  charts/BarHistoryChart.tsx
```

Semua komponen di atas presentational murni — tidak ada fetch data, tidak ada import dari
`lib/mock/` atau `lib/contracts/` (sesuai ATURAN KERAS di `guide.md`, itu tugas `hooks/`
pada Langkah 3 dan halaman pada Langkah 4).
