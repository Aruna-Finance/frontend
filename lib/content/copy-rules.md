# Aturan copy Aruna

Sumber tunggal semua teks produk adalah `lib/content/copy.ts`, disalin verbatim dari 13
halaman mockup (`VarSwap — Full Product Flow`). Tidak ada teks produk yang boleh
di-hardcode di JSX komponen/halaman — semua lewat konstanta/fungsi di file ini.

## Larangan

- **Tidak ada "protocol fee".** Sudah diverifikasi ke `aruna - desain smart contract.md`
  (§5.3 Premi & dust, §6.3 Rumus premi, §2 Peta kontrak): kontrak tidak punya mekanisme
  fee protokol/treasury sama sekali. `premiumsCollected` seluruhnya dibagi ke underwriter;
  satu-satunya potongan dari premi adalah `keeperBudget` (insentif keeper, bukan fee
  protokol). **Ini sudah diputuskan, bukan TODO lagi** — baris "Protocol fee: included"
  yang ada di `LPConfirm.dc.html` (mockup) sengaja **dihapus** dari `lpConfirmCopy.txCard.rows`
  di `copy.ts`. Jangan ditambahkan kembali kecuali SSOT/desain kontrak berubah.
- **Jangan parafrase.** Semua string di `copy.ts` disalin kata-per-kata dari file
  `.dc.html` sumber. Kalau kalimat terasa canggung atau kurang pas, itu sinyal untuk balik
  ke SSOT/mockup dan diskusikan perubahan sadar — bukan dirapikan diam-diam di sini.
- **Nama kontrak di panel "CONTRACTS" (`proofCopy`, lewat `lib/mock/proof.ts`)** memakai
  penamaan dari `aruna - desain smart contract.md` (§2, §8): `ArunaFactory`,
  `VarianceAccumulator`, `CoverVault`, `IPremiumPricer` — bukan placeholder mockup asli
  (`UnderwriterVault`, `CoverPolicy`, `Settlement`) karena `CoverPolicy` dan `Settlement`
  bukan kontrak terpisah (`Policy` adalah struct di dalam `CoverVault`, settlement adalah
  fungsi `finalize()`/`settleBatch()` di `CoverVault`).

## Catatan tempel-verbatim yang perlu direview kalau data berubah

- `uwDashboardCopy.historyFootnote` — kalimat "Five up, one down, +3.57% cumulative..."
  disalin persis dari `UWDashboard.dc.html` dan spesifik untuk contoh vault
  WETH/USDC 0.05% (5 siklus untung, 1 rugi dari 6 siklus, `lib/mock/vaults.ts`
  `cumulativeReturnPercent: 3.57`, `lossCount: 1`). Kalimat ini **tidak digeneralisasi**
  jadi template otomatis (butuh logika "N up, M down" dari array `cycleHistory` yang di
  luar scope Langkah 3). Kalau vault lain nanti dipakai di halaman yang sama, kalimat ini
  perlu ditulis ulang manual atau baru digeneralisasi.
- `uwVaultsCopy.historyCaption` sudah digeneralisasi (menerima `cumulativePercent` dan
  `lossCount`, termasuk tunggal/jamak "1 loss" vs "N losses") karena polanya berulang persis
  untuk tiap vault di `UWVaults.dc.html`.
