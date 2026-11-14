import { useMemo, useState, type FormEvent } from 'react'
import { CustomSelect } from '../../components/common/CustomSelect'
import { Modal } from '../../components/common/Modal'
import { STATUS_PEMINJAMAN_OPTIONS } from '../../constants/domainOptions'
import {
  createPeminjaman,
  updatePeminjaman,
} from '../../services/peminjaman.service'
import type {
  KendaraanDinas,
  Pegawai,
  PeminjamanInput,
  PeminjamanKendaraan,
  PerangkatDaerah,
  ServisKendaraan,
  StatusPeminjaman,
} from '../../types/bmd'
import { evaluateVehicleBorrowStatus } from '../../utils/vehicleRules'
import {
  makeEmptyPeminjamanForm,
  type PeminjamanFormState,
} from './monitoringTypes'

interface PeminjamanFormModalProps {
  isOpen: boolean
  editingItem: PeminjamanKendaraan | null
  preselectedKendaraanId?: number
  scopedKendaraanList: KendaraanDinas[]
  scopedPegawaiList: Pegawai[]
  servisList: ServisKendaraan[]
  peminjamanList: PeminjamanKendaraan[]
  kendaraanMap: Map<number, KendaraanDinas>
  pdMap: Map<number, PerangkatDaerah>
  pegawaiMap: Map<number, Pegawai>
  onClose: () => void
  onSaved: (message: string) => Promise<void>
}

export function PeminjamanFormModal({
  isOpen,
  editingItem,
  preselectedKendaraanId,
  scopedKendaraanList,
  scopedPegawaiList,
  servisList,
  peminjamanList,
  kendaraanMap,
  pdMap,
  pegawaiMap,
  onClose,
  onSaved,
}: PeminjamanFormModalProps) {
  const eligibleForFormList = useMemo(() => {
    return scopedKendaraanList.filter(
      (k) =>
        evaluateVehicleBorrowStatus(
          k,
          servisList,
          peminjamanList,
          editingItem?.id
        ).eligible
    )
  }, [scopedKendaraanList, servisList, peminjamanList, editingItem])

  const blockedForFormList = useMemo(() => {
    return scopedKendaraanList
      .map((k) => ({
        kendaraan: k,
        eval: evaluateVehicleBorrowStatus(
          k,
          servisList,
          peminjamanList,
          editingItem?.id
        ),
      }))
      .filter((row) => !row.eval.eligible)
  }, [scopedKendaraanList, servisList, peminjamanList, editingItem])

  const [form, setForm] = useState<PeminjamanFormState>(() => {
    if (editingItem) {
      return {
        kendaraanId: String(editingItem.kendaraanId),
        peminjamPegawaiId: editingItem.peminjamPegawaiId
          ? String(editingItem.peminjamPegawaiId)
          : '',
        peminjamNama: editingItem.peminjamNama,
        peminjamInstansi: editingItem.peminjamInstansi,
        tujuanKeperluan: editingItem.tujuanKeperluan,
        lokasiTujuan: editingItem.lokasiTujuan,
        tanggalPinjam: editingItem.tanggalPinjam,
        tanggalKembaliRencana: editingItem.tanggalKembaliRencana,
        status: editingItem.status,
        nomorSuratTugas: editingItem.nomorSuratTugas,
        kilometerAwal:
          editingItem.kilometerAwal !== null
            ? String(editingItem.kilometerAwal)
            : '',
        catatan: editingItem.catatan,
      }
    }

    const fallbackEligible = eligibleForFormList.find((k) => {
      const ev = evaluateVehicleBorrowStatus(k, servisList, peminjamanList)
      return ev.eligible && !ev.activeLoan
    })
    const chosenId =
      preselectedKendaraanId ?? fallbackEligible?.id ?? eligibleForFormList[0]?.id
    return makeEmptyPeminjamanForm(chosenId ? String(chosenId) : '')
  })

  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSelectPegawai = (pegawaiIdStr: string) => {
    if (!pegawaiIdStr) {
      setForm((prev) => ({ ...prev, peminjamPegawaiId: '' }))
      return
    }
    const peg = pegawaiMap.get(Number(pegawaiIdStr))
    const pd = peg ? pdMap.get(peg.perangkatDaerahId) : undefined
    setForm((prev) => ({
      ...prev,
      peminjamPegawaiId: pegawaiIdStr,
      peminjamNama: peg ? peg.nama : prev.peminjamNama,
      peminjamInstansi: peg
        ? `${pd?.nama ?? ''}${peg.jabatan ? ` (${peg.jabatan})` : ''}`.trim()
        : prev.peminjamInstansi,
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.kendaraanId) {
      setFormError(
        'Silakan pilih unit kendaraan berkondisi Baik terlebih dahulu.'
      )
      return
    }

    const payload: PeminjamanInput = {
      kendaraanId: Number(form.kendaraanId),
      peminjamPegawaiId: form.peminjamPegawaiId
        ? Number(form.peminjamPegawaiId)
        : null,
      peminjamNama: form.peminjamNama,
      peminjamInstansi: form.peminjamInstansi,
      tujuanKeperluan: form.tujuanKeperluan,
      lokasiTujuan: form.lokasiTujuan,
      tanggalPinjam: form.tanggalPinjam,
      tanggalKembaliRencana: form.tanggalKembaliRencana,
      tanggalKembaliAktual: editingItem?.tanggalKembaliAktual ?? null,
      status: form.status,
      nomorSuratTugas: form.nomorSuratTugas,
      kilometerAwal: form.kilometerAwal.trim()
        ? Number(form.kilometerAwal)
        : null,
      kilometerAkhir: editingItem?.kilometerAkhir ?? null,
      kondisiSaatKembali: editingItem?.kondisiSaatKembali ?? null,
      catatan: form.catatan,
    }

    setSubmitting(true)
    try {
      const k = kendaraanMap.get(payload.kendaraanId)
      if (editingItem) {
        await updatePeminjaman(editingItem.id, payload)
      } else {
        await createPeminjaman(payload)
      }
      onClose()
      await onSaved(
        editingItem
          ? `Data peminjaman kendaraan ${k?.nomorPolisi ?? ''} berhasil diperbarui.`
          : `Peminjaman kendaraan ${k?.nomorPolisi ?? ''} berhasil dicatat.`
      )
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan data peminjaman kendaraan.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={
        editingItem
          ? 'Edit Data Peminjaman KDO'
          : 'Catat Peminjaman Kendaraan Dinas'
      }
      subtitle="Hanya unit berkondisi Baik, tidak sedang servis, dan pajak aktif yang tersedia di pilihan armada."
      maxWidthClass="max-w-2xl"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="pinjam-kendaraan"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Pilih Kendaraan Laik Jalan (Kondisi Baik){' '}
              <span className="text-rose-600">*</span>
            </label>
            <CustomSelect
              id="pinjam-kendaraan"
              required
              value={form.kendaraanId}
              onChange={(val) => setForm({ ...form, kendaraanId: val })}
              placeholder="-- Pilih KDO Berkondisi Baik --"
              searchPlaceholder="Cari plat nomor, merek, atau SKPD..."
              options={[
                { value: '', label: '-- Pilih KDO Berkondisi Baik --' },
                ...eligibleForFormList.map((k) => {
                  const pd = pdMap.get(k.perangkatDaerahId)
                  const ev = evaluateVehicleBorrowStatus(
                    k,
                    servisList,
                    peminjamanList,
                    editingItem?.id
                  )
                  return {
                    value: String(k.id),
                    label: `${k.nomorPolisi} - ${k.merek} ${k.tipeModel}`,
                    description: pd ? `${pd.singkatan} · ${pd.nama}` : '-',
                    badge: ev.activeLoan ? 'Sedang Dipinjam' : 'Siap',
                    dotClassName: ev.activeLoan
                      ? 'bg-blue-500'
                      : 'bg-emerald-500',
                  }
                }),
              ]}
            />
            {blockedForFormList.length > 0 && (
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                <p className="font-semibold text-slate-700">
                  Unit tidak dapat dipilih ({blockedForFormList.length} diblokir):
                </p>
                <p className="mt-0.5 leading-relaxed">
                  {blockedForFormList
                    .map(
                      (b) =>
                        `${b.kendaraan.nomorPolisi} (${b.eval.blockReasons.join(', ')})`
                    )
                    .join(' · ')}
                </p>
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="pinjam-pegawai"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Pilih dari Daftar PNS (Opsional - Mengisi Otomatis Nama &amp; Instansi)
            </label>
            <CustomSelect
              id="pinjam-pegawai"
              value={form.peminjamPegawaiId}
              onChange={handleSelectPegawai}
              searchPlaceholder="Cari nama PNS, jabatan, atau SKPD..."
              options={[
                {
                  value: '',
                  label: '-- Isi Manual atau Pilih PNS Terdaftar --',
                },
                ...scopedPegawaiList.map((p) => {
                  const pd = pdMap.get(p.perangkatDaerahId)
                  return {
                    value: String(p.id),
                    label: p.nama,
                    description: `${pd?.singkatan ?? '-'} · ${p.jabatan}`,
                  }
                }),
              ]}
            />
          </div>

          <div>
            <label
              htmlFor="pinjam-nama"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Nama Peminjam <span className="text-rose-600">*</span>
            </label>
            <input
              id="pinjam-nama"
              type="text"
              required
              value={form.peminjamNama}
              onChange={(e) => setForm({ ...form, peminjamNama: e.target.value })}
              placeholder="Nama lengkap peminjam"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="pinjam-instansi"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Bidang / Unit Kerja Peminjam
            </label>
            <input
              id="pinjam-instansi"
              type="text"
              value={form.peminjamInstansi}
              onChange={(e) =>
                setForm({ ...form, peminjamInstansi: e.target.value })
              }
              placeholder="Contoh: Bidang Sarpras Disdik"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="pinjam-tgl-mulai"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Tanggal Pinjam <span className="text-rose-600">*</span>
            </label>
            <input
              id="pinjam-tgl-mulai"
              type="date"
              required
              value={form.tanggalPinjam}
              onChange={(e) =>
                setForm({ ...form, tanggalPinjam: e.target.value })
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="pinjam-tgl-kembali"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Rencana Tanggal Kembali <span className="text-rose-600">*</span>
            </label>
            <input
              id="pinjam-tgl-kembali"
              type="date"
              required
              value={form.tanggalKembaliRencana}
              onChange={(e) =>
                setForm({ ...form, tanggalKembaliRencana: e.target.value })
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="pinjam-status"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Status Peminjaman
            </label>
            <CustomSelect
              id="pinjam-status"
              value={form.status}
              onChange={(val) =>
                setForm({ ...form, status: val as StatusPeminjaman })
              }
              options={STATUS_PEMINJAMAN_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
                dotClassName:
                  opt.value === 'DIPINJAM'
                    ? 'bg-blue-500'
                    : opt.value === 'TERJADWAL'
                      ? 'bg-amber-500'
                      : opt.value === 'SELESAI'
                        ? 'bg-emerald-500'
                        : 'bg-slate-400',
              }))}
            />
          </div>

          <div>
            <label
              htmlFor="pinjam-surat"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              No. Surat Tugas / SPPD (Opsional)
            </label>
            <input
              id="pinjam-surat"
              type="text"
              value={form.nomorSuratTugas}
              onChange={(e) =>
                setForm({ ...form, nomorSuratTugas: e.target.value })
              }
              placeholder="Contoh: ST/DISDIK/214/XI/2026"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="pinjam-lokasi"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Lokasi Tujuan
            </label>
            <input
              id="pinjam-lokasi"
              type="text"
              value={form.lokasiTujuan}
              onChange={(e) =>
                setForm({ ...form, lokasiTujuan: e.target.value })
              }
              placeholder="Contoh: Kantor Walikota Jakarta Selatan"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="pinjam-km-awal"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Odometer Awal (km)
            </label>
            <input
              id="pinjam-km-awal"
              type="number"
              min={0}
              value={form.kilometerAwal}
              onChange={(e) =>
                setForm({ ...form, kilometerAwal: e.target.value })
              }
              placeholder="Contoh: 31420"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="pinjam-tujuan"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Keperluan / Tugas Dinas <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="pinjam-tujuan"
              rows={2}
              required
              value={form.tujuanKeperluan}
              onChange={(e) =>
                setForm({ ...form, tujuanKeperluan: e.target.value })
              }
              placeholder="Contoh: Monitoring lapangan dan pengiriman dokumen dinas..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="pinjam-catatan"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Catatan Kondisi Awal / BBM (Opsional)
            </label>
            <input
              id="pinjam-catatan"
              type="text"
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              placeholder="Contoh: STNK & kunci cadangan diserahkan, BBM penuh"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2.5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] rounded-xl bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {submitting
              ? 'Menyimpan...'
              : editingItem
                ? 'Simpan Perubahan'
                : 'Simpan Peminjaman'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

