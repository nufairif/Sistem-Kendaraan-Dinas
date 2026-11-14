import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, Download, Info, MapPin, Upload, X } from 'lucide-react'
import { CustomSelect } from '../../components/common/CustomSelect'
import { Modal } from '../../components/common/Modal'
import {
  JENIS_KENDARAAN_OPTIONS,
  KONDISI_OPTIONS,
  LOKASI_PARKIR_PRESETS,
  MEREK_KENDARAAN_LIST,
} from '../../constants/domainOptions'
import { createKendaraan, updateKendaraan } from '../../services/kendaraan.service'
import type {
  JenisKendaraan,
  KendaraanDinas,
  KendaraanInput,
  KondisiKendaraan,
  Pegawai,
  PerangkatDaerah,
  VehicleDocument,
} from '../../types/bmd'
import { compressVehicleImage, readVehicleDocument } from '../../utils/imageUpload'
import {
  MAX_TAHUN_PRODUKSI,
  MAX_VEHICLE_PHOTOS,
  kendaraanToFormState,
  makeEmptyKendaraanForm,
  type KendaraanFormState,
} from './kendaraanFormUtils'

interface DocumentUploadCardProps {
  kind: 'STNK' | 'BPKB'
  inputId: string
  doc: VehicleDocument | null
  uploading: boolean
  disabled: boolean
  onUpload: (e: ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
}

function DocumentUploadCard({
  kind,
  inputId,
  doc,
  uploading,
  disabled,
  onUpload,
  onClear,
}: DocumentUploadCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-800">
          Dokumen {kind}
        </span>
        {doc && (
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            Terunggah
          </span>
        )}
      </div>

      {doc ? (
        <div className="mt-2.5 space-y-2">
          <p className="truncate font-mono text-xs text-slate-700">
            {doc.fileName}
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={doc.dataUrl}
              download={doc.fileName}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Unduh
            </a>
            <label
              htmlFor={inputId}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
            >
              Ganti
            </label>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
            >
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2.5">
          <label
            htmlFor={inputId}
            className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            {uploading ? 'Mengunggah...' : `Upload ${kind} (PDF / Gambar)`}
          </label>
        </div>
      )}
      <input
        id={inputId}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        onChange={onUpload}
        disabled={disabled}
        className="sr-only"
      />
    </div>
  )
}

interface KendaraanFormModalProps {
  isOpen: boolean
  editingItem: KendaraanDinas | null
  selectedPdId: number | null
  pdList: PerangkatDaerah[]
  pegawaiList: Pegawai[]
  onClose: () => void
  onSaved: (message: string) => Promise<void>
}

export function KendaraanFormModal({
  isOpen,
  editingItem,
  selectedPdId,
  pdList,
  pegawaiList,
  onClose,
  onSaved,
}: KendaraanFormModalProps) {
  const defaultPdId = selectedPdId ?? (pdList.length > 0 ? pdList[0].id : '')
  const [form, setForm] = useState<KendaraanFormState>(() =>
    editingItem
      ? kendaraanToFormState(editingItem)
      : makeEmptyKendaraanForm(defaultPdId)
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [docUploading, setDocUploading] = useState<'STNK' | 'BPKB' | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const availablePegawaiForForm = useMemo(() => {
    const pdIdNum = Number(form.perangkatDaerahId)
    if (!pdIdNum) return pegawaiList
    return pegawaiList.filter((p) => p.perangkatDaerahId === pdIdNum)
  }, [pegawaiList, form.perangkatDaerahId])

  const handleMultiplePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    e.target.value = ''
    if (files.length === 0) return

    const remainingSlots = MAX_VEHICLE_PHOTOS - form.fotos.length
    if (remainingSlots <= 0) {
      setFormError(`Maksimal ${MAX_VEHICLE_PHOTOS} foto per unit kendaraan.`)
      return
    }

    const selectedFiles = files.slice(0, remainingSlots)
    setFormError(null)
    setPhotoUploading(true)
    try {
      const processed = await Promise.all(
        selectedFiles.map((file) => compressVehicleImage(file))
      )
      setForm((prev) => ({
        ...prev,
        fotos: [...prev.fotos, ...processed].slice(0, MAX_VEHICLE_PHOTOS),
      }))
      if (files.length > remainingSlots) {
        setFormError(
          `Hanya ${remainingSlots} foto tambahan yang dimuat (batas maksimal ${MAX_VEHICLE_PHOTOS} foto per kendaraan).`
        )
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal memproses foto kendaraan.'
      )
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleDocumentUpload = async (
    kind: 'STNK' | 'BPKB',
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setFormError(null)
    setDocUploading(kind)
    try {
      const doc = await readVehicleDocument(file, kind)
      setForm((prev) =>
        kind === 'STNK'
          ? { ...prev, dokumenStnk: doc }
          : { ...prev, dokumenBpkb: doc }
      )
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : `Gagal mengunggah dokumen ${kind}.`
      )
    } finally {
      setDocUploading(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.perangkatDaerahId) {
      setFormError('Silakan pilih Perangkat Daerah pemilik kendaraan.')
      return
    }

    const resolvedMerek =
      form.merekPilihan === 'LAINNYA'
        ? form.merekLainnya.trim()
        : form.merekPilihan.trim()

    if (!resolvedMerek) {
      setFormError('Silakan pilih atau ketik merek kendaraan.')
      return
    }

    const payload: KendaraanInput = {
      nomorPolisi: form.nomorPolisi,
      kodeBarang: form.kodeBarang,
      merek: resolvedMerek,
      tipeModel: form.tipeModel,
      jenis: form.jenis,
      tahunProduksi: Number(form.tahunProduksi),
      warna: form.warna,
      nomorRangka: form.nomorRangka,
      nomorMesin: form.nomorMesin,
      kondisi: form.kondisi,
      lokasiParkir: form.lokasiParkir,
      keterangan: form.keterangan,
      fotos: form.fotos,
      dokumenStnk: form.dokumenStnk,
      dokumenBpkb: form.dokumenBpkb,
      pajakTahunanJatuhTempo: form.pajakTahunanJatuhTempo || null,
      pajakLimaTahunanJatuhTempo: form.pajakLimaTahunanJatuhTempo || null,
      perangkatDaerahId: Number(form.perangkatDaerahId),
      pegawaiId: form.pegawaiId ? Number(form.pegawaiId) : null,
      nomorBast: form.nomorBast,
      catatanPerubahan: form.catatanPerubahan,
    }

    setSubmitting(true)
    try {
      const msg = editingItem
        ? `Data kendaraan ${(await updateKendaraan(editingItem.id, payload)).nomorPolisi} berhasil diperbarui.`
        : `Kendaraan baru ${(await createKendaraan(payload)).nomorPolisi} berhasil ditambahkan.`
      onClose()
      await onSaved(msg)
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan data kendaraan.'
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
          ? `Edit Kendaraan ${editingItem.nomorPolisi}`
          : 'Tambah Kendaraan Dinas Baru'
      }
      subtitle="Lengkapi identitas unit, masa berlaku pajak Samsat, foto fisik, dan dokumen legalitas STNK/BPKB."
      onClose={onClose}
      maxWidthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800"
          >
            {formError}
          </div>
        )}

        {/* Bagian 1 */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0a3649] text-xs font-bold text-white">
              1
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Identitas, Kondisi &amp; Penanggung Jawab
              </h3>
              <p className="text-xs text-slate-500">
                Informasi dasar unit KDO dan penugasan ke Perangkat Daerah / PNS.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="kdo-nopol"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Nomor Polisi Kendaraan <span className="text-rose-600">*</span>
              </label>
              <input
                id="kdo-nopol"
                type="text"
                required
                value={form.nomorPolisi}
                onChange={(e) =>
                  setForm({ ...form, nomorPolisi: e.target.value.toUpperCase() })
                }
                placeholder="Contoh: B 1042 PQA"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm uppercase focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="kdo-kode"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Kode Barang BMD (Opsional)
              </label>
              <input
                id="kdo-kode"
                type="text"
                value={form.kodeBarang}
                onChange={(e) => setForm({ ...form, kodeBarang: e.target.value })}
                placeholder="Contoh: 1.3.2.02.01.02.003-0001"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="kdo-merek-select"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Merek Kendaraan <span className="text-rose-600">*</span>
              </label>
              <CustomSelect
                id="kdo-merek-select"
                value={form.merekPilihan}
                onChange={(val) => setForm({ ...form, merekPilihan: val })}
                searchPlaceholder="Cari merek kendaraan..."
                options={[
                  ...MEREK_KENDARAAN_LIST.map((m) => ({ value: m, label: m })),
                  { value: 'LAINNYA', label: 'Lainnya (Ketik Manual)' },
                ]}
              />
              {form.merekPilihan === 'LAINNYA' && (
                <input
                  id="kdo-merek-custom"
                  type="text"
                  required
                  aria-label="Ketik merek kendaraan lainnya"
                  value={form.merekLainnya}
                  onChange={(e) =>
                    setForm({ ...form, merekLainnya: e.target.value })
                  }
                  placeholder="Ketik nama merek kendaraan..."
                  className="mt-2 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
                />
              )}
            </div>

            <div>
              <label
                htmlFor="kdo-model"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Tipe atau Model <span className="text-rose-600">*</span>
              </label>
              <input
                id="kdo-model"
                type="text"
                required
                value={form.tipeModel}
                onChange={(e) => setForm({ ...form, tipeModel: e.target.value })}
                placeholder="Contoh: Kijang Innova Zenix 2.0 G"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="kdo-jenis"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Jenis Kendaraan <span className="text-rose-600">*</span>
              </label>
              <CustomSelect
                id="kdo-jenis"
                value={form.jenis}
                onChange={(val) =>
                  setForm({ ...form, jenis: val as JenisKendaraan })
                }
                options={JENIS_KENDARAAN_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="kdo-tahun"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Tahun Produksi <span className="text-rose-600">*</span>
                </label>
                <input
                  id="kdo-tahun"
                  type="number"
                  required
                  min={1980}
                  max={MAX_TAHUN_PRODUKSI}
                  value={form.tahunProduksi}
                  onChange={(e) =>
                    setForm({ ...form, tahunProduksi: e.target.value })
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="kdo-warna"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Warna <span className="text-rose-600">*</span>
                </label>
                <input
                  id="kdo-warna"
                  type="text"
                  required
                  value={form.warna}
                  onChange={(e) => setForm({ ...form, warna: e.target.value })}
                  placeholder="Hitam / Putih"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="kdo-kondisi"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Kondisi / Status Kendaraan <span className="text-rose-600">*</span>
              </label>
              <CustomSelect
                id="kdo-kondisi"
                value={form.kondisi}
                onChange={(val) =>
                  setForm({ ...form, kondisi: val as KondisiKendaraan })
                }
                options={KONDISI_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                  dotClassName:
                    opt.value === 'BAIK'
                      ? 'bg-emerald-500'
                      : opt.value === 'RUSAK_RINGAN'
                        ? 'bg-amber-500'
                        : 'bg-rose-500',
                }))}
              />
            </div>

            <div>
              <label
                htmlFor="kdo-pd"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Perangkat Daerah Pemilik <span className="text-rose-600">*</span>
              </label>
              <CustomSelect
                id="kdo-pd"
                required
                value={form.perangkatDaerahId}
                onChange={(newPdId) => {
                  const currentPj = pegawaiList.find(
                    (p) => String(p.id) === form.pegawaiId
                  )
                  const keepPj =
                    currentPj && String(currentPj.perangkatDaerahId) === newPdId
                      ? form.pegawaiId
                      : ''
                  setForm({
                    ...form,
                    perangkatDaerahId: newPdId,
                    pegawaiId: keepPj,
                  })
                }}
                placeholder="-- Pilih Perangkat Daerah --"
                searchPlaceholder="Cari perangkat daerah..."
                options={[
                  { value: '', label: '-- Pilih Perangkat Daerah --' },
                  ...pdList.map((pd) => ({
                    value: String(pd.id),
                    label: `${pd.singkatan} - ${pd.nama}`,
                  })),
                ]}
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="kdo-pegawai"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Pegawai Negeri Sipil (PNS) Penanggung Jawab
              </label>
              <CustomSelect
                id="kdo-pegawai"
                value={form.pegawaiId}
                onChange={(val) => setForm({ ...form, pegawaiId: val })}
                searchPlaceholder="Cari nama, NIP, atau golongan PNS..."
                options={[
                  {
                    value: '',
                    label: 'Pool Perangkat Daerah (Belum Ada Penanggung Jawab)',
                  },
                  ...availablePegawaiForForm.map((p) => ({
                    value: String(p.id),
                    label: `${p.nama} (${p.golongan})`,
                    description: `NIP ${p.nip} · ${p.jabatan}`,
                  })),
                ]}
              />
            </div>

            <div>
              <label
                htmlFor="kdo-rangka"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Nomor Rangka (Opsional)
              </label>
              <input
                id="kdo-rangka"
                type="text"
                value={form.nomorRangka}
                onChange={(e) =>
                  setForm({ ...form, nomorRangka: e.target.value.toUpperCase() })
                }
                placeholder="Nomor rangka sesuai STNK/BPKB"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm uppercase focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="kdo-mesin"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Nomor Mesin (Opsional)
              </label>
              <input
                id="kdo-mesin"
                type="text"
                value={form.nomorMesin}
                onChange={(e) =>
                  setForm({ ...form, nomorMesin: e.target.value.toUpperCase() })
                }
                placeholder="Nomor mesin sesuai STNK/BPKB"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm uppercase focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="kdo-keterangan"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Keterangan Operasional &amp; Catatan Kondisi Fisik
              </label>
              <textarea
                id="kdo-keterangan"
                rows={2}
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                placeholder="Catatan penggunaan kendaraan atau rincian kondisi fisik..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bagian 2 */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0a3649] text-xs font-bold text-white">
                2
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Lokasi Parkir &amp; Penempatan Fisik
                </h3>
                <p className="text-xs text-slate-500">
                  Lokasi gedung parkir, pool SKPD, atau posisi penyimpanan kendaraan saat ini.
                </p>
              </div>
            </div>
            <MapPin className="h-4 w-4 text-[#0a3649]" aria-hidden="true" />
          </div>

          <div className="space-y-3 p-5">
            <div>
              <label
                htmlFor="kdo-lokasi-parkir"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Lokasi Parkir Utama
              </label>
              <input
                id="kdo-lokasi-parkir"
                type="text"
                value={form.lokasiParkir}
                onChange={(e) =>
                  setForm({ ...form, lokasiParkir: e.target.value })
                }
                placeholder="Contoh: Basement Gedung Dinas Pendidikan Lt. B1 / Pool Barat"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-slate-500">
                Pilih cepat lokasi umum:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {LOKASI_PARKIR_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setForm({ ...form, lokasiParkir: preset })}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      form.lokasiParkir === preset
                        ? 'border-[#0a3649] bg-[#0a3649] text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bagian 3 */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2563eb] text-xs font-bold text-white">
                3
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Masa Berlaku Pajak &amp; Plat Nomor
                </h3>
                <p className="text-xs text-slate-500">
                  Jadwal jatuh tempo pajak tahunan (PKB) &amp; pajak plat 5 tahunan untuk pengingat otomatis
                </p>
              </div>
            </div>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Pengingat Samsat
            </span>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="kdo-pajak-tahunan"
                  className="mb-1.5 block text-xs font-bold text-slate-800"
                >
                  Jatuh Tempo Pajak Tahunan (PKB)
                </label>
                <input
                  id="kdo-pajak-tahunan"
                  type="date"
                  value={form.pajakTahunanJatuhTempo}
                  onChange={(e) =>
                    setForm({ ...form, pajakTahunanJatuhTempo: e.target.value })
                  }
                  className="h-11 w-full rounded-full border border-slate-300 bg-white px-4 font-mono text-sm text-slate-900 focus:border-[#0a3649] focus:outline-none"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Tanggal perpanjangan STNK tahunan berikutnya
                </p>
              </div>

              <div>
                <label
                  htmlFor="kdo-pajak-5tahunan"
                  className="mb-1.5 block text-xs font-bold text-slate-800"
                >
                  Jatuh Tempo Pajak &amp; Plat 5 Tahunan
                </label>
                <input
                  id="kdo-pajak-5tahunan"
                  type="date"
                  value={form.pajakLimaTahunanJatuhTempo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pajakLimaTahunanJatuhTempo: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-full border border-slate-300 bg-white px-4 font-mono text-sm text-slate-900 focus:border-[#0a3649] focus:outline-none"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Tanggal penggantian plat kaleng / TNKB 5 tahunan
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-sky-200/80 bg-sky-50/50 px-4 py-3 text-xs leading-relaxed text-slate-700">
              <Info
                className="mt-0.5 h-4 w-4 shrink-0 text-[#0a3649]"
                aria-hidden="true"
              />
              <p>
                Tanggal ini akan otomatis membuat entri pengingat pada halaman{' '}
                <strong className="text-slate-900">Dokumen &amp; Pajak</strong>{' '}
                dan memicu notifikasi peringatan jika waktu jatuh tempo tersisa &lt; 30 hari.
              </p>
            </div>
          </div>
        </div>

        {/* Bagian 4 */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0a3649] text-xs font-bold text-white">
              4
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Galeri Foto Kendaraan &amp; Dokumen STNK / BPKB
              </h3>
              <p className="text-xs text-slate-500">
                Unggah hingga {MAX_VEHICLE_PHOTOS} foto fisik (JPG, JPEG, PNG otomatis dikonversi ke WebP) serta dokumen STNK dan BPKB.
              </p>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Foto Fisik Kendaraan ({form.fotos.length}/{MAX_VEHICLE_PHOTOS})
                </span>
                {form.fotos.length < MAX_VEHICLE_PHOTOS && (
                  <label
                    htmlFor="kdo-multi-foto"
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    {photoUploading ? 'Memproses...' : 'Tambah Foto (Bisa > 1)'}
                  </label>
                )}
                <input
                  id="kdo-multi-foto"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleMultiplePhotoChange}
                  disabled={photoUploading}
                  className="sr-only"
                />
              </div>

              {form.fotos.length === 0 ? (
                <label
                  htmlFor="kdo-multi-foto"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center hover:bg-slate-100/70"
                >
                  <Camera className="h-6 w-6 text-slate-400" aria-hidden="true" />
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    Klik untuk memilih satu atau beberapa foto kendaraan
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    JPG, JPEG, PNG, atau WebP (otomatis dikonversi menjadi .webp)
                  </p>
                </label>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {form.fotos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <img
                        src={photo.dataUrl}
                        alt={`Foto ${index + 1}: ${photo.name}`}
                        width={240}
                        height={160}
                        className="h-28 w-full object-cover"
                      />
                      {index === 0 && (
                        <span className="absolute left-2 top-2 rounded bg-[#0a3649]/90 px-2 py-0.5 text-[10px] font-bold text-white">
                          Utama
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            fotos: prev.fotos.filter((f) => f.id !== photo.id),
                          }))
                        }
                        aria-label={`Hapus foto ${photo.name}`}
                        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-700 text-white shadow hover:bg-rose-800"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DocumentUploadCard
                kind="STNK"
                inputId="kdo-doc-stnk"
                doc={form.dokumenStnk}
                uploading={docUploading === 'STNK'}
                disabled={docUploading !== null}
                onUpload={(e) => handleDocumentUpload('STNK', e)}
                onClear={() => setForm({ ...form, dokumenStnk: null })}
              />
              <DocumentUploadCard
                kind="BPKB"
                inputId="kdo-doc-bpkb"
                doc={form.dokumenBpkb}
                uploading={docUploading === 'BPKB'}
                disabled={docUploading !== null}
                onUpload={(e) => handleDocumentUpload('BPKB', e)}
                onClear={() => setForm({ ...form, dokumenBpkb: null })}
              />
            </div>
          </div>
        </div>

        {/* Bagian Riwayat / BAST */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold text-[#0a3649]">
            Pencatatan Riwayat / BAST (Otomatis tercatat bila ada perubahan kondisi, SKPD, atau penanggung jawab)
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="kdo-bast"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Nomor BAST / Surat Tugas (Opsional)
              </label>
              <input
                id="kdo-bast"
                type="text"
                value={form.nomorBast}
                onChange={(e) => setForm({ ...form, nomorBast: e.target.value })}
                placeholder="Contoh: BAST/DISDIK/045/2026"
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 font-mono text-xs focus:border-[#0a3649] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="kdo-catatan-riwayat"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Catatan Perubahan (Opsional)
              </label>
              <input
                id="kdo-catatan-riwayat"
                type="text"
                value={form.catatanPerubahan}
                onChange={(e) =>
                  setForm({ ...form, catatanPerubahan: e.target.value })
                }
                placeholder="Alasan serah terima / perubahan kondisi"
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs focus:border-[#0a3649] focus:outline-none"
              />
            </div>
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
            disabled={submitting || photoUploading || docUploading !== null}
            className="min-h-[44px] rounded-xl bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {submitting
              ? 'Menyimpan...'
              : editingItem
                ? 'Simpan Perubahan'
                : 'Simpan Kendaraan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

