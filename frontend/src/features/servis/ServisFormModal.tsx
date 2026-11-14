import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Download, Upload } from 'lucide-react'
import { CustomSelect } from '../../components/common/CustomSelect'
import { Modal } from '../../components/common/Modal'
import {
  JENIS_SERVIS_OPTIONS,
  STATUS_SERVIS_OPTIONS,
} from '../../constants/domainOptions'
import { createServis, updateServis } from '../../services/servis.service'
import type {
  JenisServis,
  KendaraanDinas,
  PerangkatDaerah,
  ServisInput,
  ServisKendaraan,
  StatusServis,
  VehicleDocument,
} from '../../types/bmd'
import { getTodayIsoDate } from '../../utils/format'
import { readVehicleDocument } from '../../utils/imageUpload'

interface ServisFormState {
  kendaraanId: string
  tanggalServis: string
  jenisServis: JenisServis
  status: StatusServis
  bengkel: string
  kilometer: string
  biaya: string
  servisBerikutnyaTanggal: string
  deskripsi: string
  buktiNota: VehicleDocument | null
}

function makeInitialServisForm(
  editingItem: ServisKendaraan | null,
  defaultKendaraanId: number | ''
): ServisFormState {
  if (editingItem) {
    return {
      kendaraanId: String(editingItem.kendaraanId),
      tanggalServis: editingItem.tanggalServis,
      jenisServis: editingItem.jenisServis,
      status: editingItem.status,
      bengkel: editingItem.bengkel,
      kilometer:
        editingItem.kilometer !== null ? String(editingItem.kilometer) : '',
      biaya: String(editingItem.biaya),
      servisBerikutnyaTanggal: editingItem.servisBerikutnyaTanggal ?? '',
      deskripsi: editingItem.deskripsi,
      buktiNota: editingItem.buktiNota ?? null,
    }
  }

  return {
    kendaraanId: defaultKendaraanId === '' ? '' : String(defaultKendaraanId),
    tanggalServis: getTodayIsoDate(),
    jenisServis: 'SERVIS_RUTIN',
    status: 'TERJADWAL',
    bengkel: '',
    kilometer: '',
    biaya: '0',
    servisBerikutnyaTanggal: '',
    deskripsi: '',
    buktiNota: null,
  }
}

interface ServisFormModalProps {
  isOpen: boolean
  editingItem: ServisKendaraan | null
  scopedKendaraanOptions: KendaraanDinas[]
  kendaraanMap: Map<number, KendaraanDinas>
  pdMap: Map<number, PerangkatDaerah>
  onClose: () => void
  onSaved: (message: string) => Promise<void>
}

export function ServisFormModal({
  isOpen,
  editingItem,
  scopedKendaraanOptions,
  kendaraanMap,
  pdMap,
  onClose,
  onSaved,
}: ServisFormModalProps) {
  const defaultId =
    scopedKendaraanOptions.length > 0 ? scopedKendaraanOptions[0].id : ''
  const [form, setForm] = useState<ServisFormState>(() =>
    makeInitialServisForm(editingItem, defaultId)
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [notaUploading, setNotaUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleNotaUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setFormError(null)
    setNotaUploading(true)
    try {
      const doc = await readVehicleDocument(file, 'Bukti Nota Servis')
      setForm((prev) => ({ ...prev, buktiNota: doc }))
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Gagal mengunggah dokumen bukti nota servis.'
      )
    } finally {
      setNotaUploading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.kendaraanId) {
      setFormError('Silakan pilih kendaraan dinas terlebih dahulu.')
      return
    }

    const payload: ServisInput = {
      kendaraanId: Number(form.kendaraanId),
      tanggalServis: form.tanggalServis,
      jenisServis: form.jenisServis,
      status: form.status,
      bengkel: form.bengkel,
      kilometer: form.kilometer.trim() ? Number(form.kilometer) : null,
      biaya: form.biaya.trim() ? Number(form.biaya) : 0,
      servisBerikutnyaTanggal: form.servisBerikutnyaTanggal || null,
      deskripsi: form.deskripsi,
      buktiNota: form.buktiNota,
    }

    setSubmitting(true)
    try {
      const targetKendaraan = kendaraanMap.get(payload.kendaraanId)
      if (editingItem) {
        await updateServis(editingItem.id, payload)
      } else {
        await createServis(payload)
      }
      onClose()
      await onSaved(
        editingItem
          ? `Catatan servis kendaraan ${targetKendaraan?.nomorPolisi ?? ''} berhasil diperbarui.`
          : `Catatan servis kendaraan ${targetKendaraan?.nomorPolisi ?? ''} berhasil ditambahkan.`
      )
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan data servis.'
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
          ? 'Edit Catatan Servis KDO'
          : 'Catat Servis & Pemeliharaan KDO'
      }
      subtitle="Catat jadwal servis rutin, perbaikan bengkel, penggantian ban/aki, atau uji KIR kendaraan dinas."
      onClose={onClose}
      maxWidthClass="max-w-2xl"
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
              htmlFor="servis-kendaraan"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Kendaraan Dinas (KDO) <span className="text-rose-600">*</span>
            </label>
            <CustomSelect
              id="servis-kendaraan"
              required
              value={form.kendaraanId}
              onChange={(val) => setForm({ ...form, kendaraanId: val })}
              placeholder="-- Pilih Kendaraan Dinas --"
              searchPlaceholder="Cari plat nomor, merek, atau SKPD..."
              options={[
                { value: '', label: '-- Pilih Kendaraan Dinas --' },
                ...scopedKendaraanOptions.map((k) => {
                  const pd = pdMap.get(k.perangkatDaerahId)
                  return {
                    value: String(k.id),
                    label: `${k.nomorPolisi} - ${k.merek} ${k.tipeModel}`,
                    description: pd ? `${pd.singkatan} · ${pd.nama}` : '-',
                  }
                }),
              ]}
            />
          </div>

          <div>
            <label
              htmlFor="servis-tanggal"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Tanggal Masuk / Jadwal Servis{' '}
              <span className="text-rose-600">*</span>
            </label>
            <input
              id="servis-tanggal"
              type="date"
              required
              value={form.tanggalServis}
              onChange={(e) =>
                setForm({ ...form, tanggalServis: e.target.value })
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="servis-jenis"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Jenis Pemeliharaan <span className="text-rose-600">*</span>
            </label>
            <CustomSelect
              id="servis-jenis"
              value={form.jenisServis}
              onChange={(val) =>
                setForm({ ...form, jenisServis: val as JenisServis })
              }
              options={JENIS_SERVIS_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
            />
          </div>

          <div>
            <label
              htmlFor="servis-status"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Status Pengerjaan <span className="text-rose-600">*</span>
            </label>
            <CustomSelect
              id="servis-status"
              value={form.status}
              onChange={(val) =>
                setForm({ ...form, status: val as StatusServis })
              }
              options={STATUS_SERVIS_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
                dotClassName:
                  opt.value === 'SELESAI'
                    ? 'bg-emerald-500'
                    : opt.value === 'DALAM_PERBAIKAN'
                      ? 'bg-blue-500'
                      : 'bg-amber-500',
              }))}
            />
          </div>

          <div>
            <label
              htmlFor="servis-bengkel"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Bengkel / Rekanan Pelaksana{' '}
              <span className="text-rose-600">*</span>
            </label>
            <input
              id="servis-bengkel"
              type="text"
              required
              value={form.bengkel}
              onChange={(e) => setForm({ ...form, bengkel: e.target.value })}
              placeholder="Contoh: Auto2000 Gatot Subroto / UP PKB"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="servis-km"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Odometer / Kilometer Saat Ini (Opsional)
            </label>
            <input
              id="servis-km"
              type="number"
              min={0}
              value={form.kilometer}
              onChange={(e) => setForm({ ...form, kilometer: e.target.value })}
              placeholder="Contoh: 24500"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="servis-biaya"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Estimasi / Realisasi Biaya (Rp)
            </label>
            <input
              id="servis-biaya"
              type="number"
              min={0}
              value={form.biaya}
              onChange={(e) => setForm({ ...form, biaya: e.target.value })}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="servis-berikutnya"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Jadwal Servis Berkala Berikutnya (Opsional)
            </label>
            <input
              id="servis-berikutnya"
              type="date"
              value={form.servisBerikutnyaTanggal}
              onChange={(e) =>
                setForm({ ...form, servisBerikutnyaTanggal: e.target.value })
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="servis-deskripsi"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Uraian Pekerjaan &amp; Penggantian Suku Cadang{' '}
              <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="servis-deskripsi"
              rows={3}
              required
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              placeholder="Contoh: Ganti oli mesin 5W-30, filter oli, kampas rem depan, dan spooring..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Bukti Nota / Kwitansi Bengkel (Opsional)
                </p>
                <p className="text-[11px] text-slate-500">
                  Format PDF atau foto JPG/JPEG/PNG (gambar otomatis dikonversi ke .webp).
                </p>
              </div>
              {form.buktiNota && (
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Terunggah
                </span>
              )}
            </div>

            {form.buktiNota ? (
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <span className="truncate font-mono text-xs text-slate-700">
                  {form.buktiNota.fileName}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={form.buktiNota.dataUrl}
                    download={form.buktiNota.fileName}
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Unduh
                  </a>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, buktiNota: null })}
                    className="inline-flex min-h-[34px] items-center rounded-lg border border-rose-200 px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="servis-nota-upload"
                className="mt-2.5 inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                {notaUploading
                  ? 'Memproses...'
                  : 'Upload Nota / Kwitansi (PDF atau Gambar)'}
              </label>
            )}
            <input
              id="servis-nota-upload"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleNotaUpload}
              disabled={notaUploading}
              className="sr-only"
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
            disabled={submitting || notaUploading}
            className="min-h-[44px] rounded-xl bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {submitting
              ? 'Menyimpan...'
              : editingItem
                ? 'Simpan Perubahan'
                : 'Simpan Catatan Servis'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

