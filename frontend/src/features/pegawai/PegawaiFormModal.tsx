import { useState, type FormEvent } from 'react'
import { CustomSelect } from '../../components/common/CustomSelect'
import { Modal } from '../../components/common/Modal'
import { GOLONGAN_PNS_MAP } from '../../constants/domainOptions'
import { createPegawai, updatePegawai } from '../../services/master.service'
import type { Pegawai, PegawaiInput, PerangkatDaerah } from '../../types/bmd'

interface PegawaiFormState {
  nip: string
  nama: string
  jabatan: string
  golongan: string
  pangkat: string
  noHp: string
  email: string
  perangkatDaerahId: string
}

function buildInitialForm(
  editingItem: Pegawai | null,
  defaultPdId: number | '',
): PegawaiFormState {
  if (editingItem) {
    return {
      nip: editingItem.nip,
      nama: editingItem.nama,
      jabatan: editingItem.jabatan,
      golongan: editingItem.golongan,
      pangkat: editingItem.pangkat,
      noHp: editingItem.noHp,
      email: editingItem.email,
      perangkatDaerahId: String(editingItem.perangkatDaerahId),
    }
  }
  return {
    nip: '',
    nama: '',
    jabatan: '',
    golongan: 'III/a',
    pangkat: 'Penata Muda',
    noHp: '',
    email: '',
    perangkatDaerahId: defaultPdId === '' ? '' : String(defaultPdId),
  }
}

interface PegawaiFormModalProps {
  editingItem: Pegawai | null
  defaultPdId: number | ''
  pdList: PerangkatDaerah[]
  onClose: () => void
  onSaved: (message: string) => Promise<void>
}

export function PegawaiFormModal({
  editingItem,
  defaultPdId,
  pdList,
  onClose,
  onSaved,
}: PegawaiFormModalProps) {
  const [form, setForm] = useState<PegawaiFormState>(() =>
    buildInitialForm(editingItem, defaultPdId),
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleGolonganChange = (newGolongan: string) => {
    const match = GOLONGAN_PNS_MAP.find((g) => g.golongan === newGolongan)
    setForm((prev) => ({
      ...prev,
      golongan: newGolongan,
      pangkat: match ? match.pangkat : prev.pangkat,
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.perangkatDaerahId) {
      setFormError('Silakan pilih Perangkat Daerah tempat pegawai bertugas.')
      return
    }

    const payload: PegawaiInput = {
      nip: form.nip,
      nama: form.nama,
      jabatan: form.jabatan,
      golongan: form.golongan,
      pangkat: form.pangkat,
      noHp: form.noHp,
      email: form.email,
      perangkatDaerahId: Number(form.perangkatDaerahId),
    }

    setSubmitting(true)
    try {
      const message = editingItem
        ? `Data PNS ${(await updatePegawai(editingItem.id, payload)).nama} berhasil diperbarui.`
        : `PNS baru ${(await createPegawai(payload)).nama} berhasil didaftarkan.`
      await onSaved(message)
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan data PNS.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen
      title={
        editingItem
          ? `Edit Data PNS: ${editingItem.nama}`
          : 'Tambah Pegawai Negeri Sipil Baru'
      }
      subtitle="Isi data kepegawaian PNS sesuai SK pangkat/jabatan terbaru."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800"
          >
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="pns-nip"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              NIP (18 Digit) <span className="text-rose-600">*</span>
            </label>
            <input
              id="pns-nip"
              type="text"
              required
              maxLength={22}
              value={form.nip}
              onChange={(e) => setForm({ ...form, nip: e.target.value })}
              placeholder="198509232010012011"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="pns-nama"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Nama Lengkap &amp; Gelar <span className="text-rose-600">*</span>
            </label>
            <input
              id="pns-nama"
              type="text"
              required
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Nama lengkap pegawai"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="pns-jabatan"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Jabatan <span className="text-rose-600">*</span>
            </label>
            <input
              id="pns-jabatan"
              type="text"
              required
              value={form.jabatan}
              onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
              placeholder="Contoh: Kepala Seksi Pengawasan Infrastruktur"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="pns-golongan"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Golongan Ruang <span className="text-rose-600">*</span>
            </label>
            <CustomSelect
              id="pns-golongan"
              value={form.golongan}
              onChange={handleGolonganChange}
              searchPlaceholder="Cari golongan atau pangkat..."
              options={GOLONGAN_PNS_MAP.map((g) => ({
                value: g.golongan,
                label: `${g.golongan} (${g.pangkat})`,
              }))}
            />
          </div>

          <div>
            <label
              htmlFor="pns-pangkat"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Pangkat
            </label>
            <input
              id="pns-pangkat"
              type="text"
              value={form.pangkat}
              onChange={(e) => setForm({ ...form, pangkat: e.target.value })}
              placeholder="Contoh: Penata Tingkat I"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="pns-pd"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Perangkat Daerah Asal <span className="text-rose-600">*</span>
            </label>
            <CustomSelect
              id="pns-pd"
              required
              value={form.perangkatDaerahId}
              onChange={(val) => setForm({ ...form, perangkatDaerahId: val })}
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

          <div>
            <label
              htmlFor="pns-hp"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Nomor HP (Opsional)
            </label>
            <input
              id="pns-hp"
              type="tel"
              value={form.noHp}
              onChange={(e) => setForm({ ...form, noHp: e.target.value })}
              placeholder="0812xxxxxxxx"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="pns-email"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Email Kedinasan (Opsional)
            </label>
            <input
              id="pns-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="nama@jakarta.go.id"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2.5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] rounded-lg bg-[#0a3649] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#072836] disabled:opacity-60"
          >
            {submitting
              ? 'Menyimpan...'
              : editingItem
                ? 'Simpan Perubahan'
                : 'Simpan PNS'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

