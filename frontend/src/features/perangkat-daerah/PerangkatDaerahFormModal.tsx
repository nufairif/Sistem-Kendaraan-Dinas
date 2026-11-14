import { useState, type FormEvent } from 'react'
import { Modal } from '../../components/common/Modal'
import {
  createPerangkatDaerah,
  updatePerangkatDaerah,
} from '../../services/master.service'
import type { PerangkatDaerah, PerangkatDaerahInput } from '../../types/bmd'

function buildInitialPdForm(
  editingItem: PerangkatDaerah | null,
): PerangkatDaerahInput {
  if (editingItem) {
    return {
      kodeSkpd: editingItem.kodeSkpd,
      nama: editingItem.nama,
      singkatan: editingItem.singkatan,
      kepalaDinas: editingItem.kepalaDinas,
      alamat: editingItem.alamat,
      telepon: editingItem.telepon,
    }
  }
  return {
    kodeSkpd: '',
    nama: '',
    singkatan: '',
    kepalaDinas: '',
    alamat: '',
    telepon: '',
  }
}

interface PerangkatDaerahFormModalProps {
  editingItem: PerangkatDaerah | null
  onClose: () => void
  onSaved: (message: string) => Promise<void>
}

export function PerangkatDaerahFormModal({
  editingItem,
  onClose,
  onSaved,
}: PerangkatDaerahFormModalProps) {
  const [form, setForm] = useState<PerangkatDaerahInput>(() =>
    buildInitialPdForm(editingItem),
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      const message = editingItem
        ? `Data ${(await updatePerangkatDaerah(editingItem.id, form)).nama} berhasil diperbarui.`
        : `Perangkat Daerah ${(await createPerangkatDaerah(form)).nama} berhasil ditambahkan.`
      await onSaved(message)
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan data Perangkat Daerah.',
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
          ? `Edit ${editingItem.nama}`
          : 'Tambah Perangkat Daerah Baru'
      }
      subtitle="Isi kode SKPD dan identitas instansi pengguna barang milik daerah."
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
              htmlFor="pd-kode"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Kode SKPD <span className="text-rose-600">*</span>
            </label>
            <input
              id="pd-kode"
              type="text"
              required
              value={form.kodeSkpd}
              onChange={(e) => setForm({ ...form, kodeSkpd: e.target.value })}
              placeholder="Contoh: 1.04.01.01"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="pd-singkatan"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Singkatan <span className="text-rose-600">*</span>
            </label>
            <input
              id="pd-singkatan"
              type="text"
              required
              value={form.singkatan}
              onChange={(e) =>
                setForm({ ...form, singkatan: e.target.value.toUpperCase() })
              }
              placeholder="Contoh: DISHUB"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm uppercase focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="pd-nama"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Nama Perangkat Daerah <span className="text-rose-600">*</span>
            </label>
            <input
              id="pd-nama"
              type="text"
              required
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Contoh: Dinas Perhubungan"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="pd-kepala"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Kepala Dinas / Kepala Badan
            </label>
            <input
              id="pd-kepala"
              type="text"
              value={form.kepalaDinas}
              onChange={(e) => setForm({ ...form, kepalaDinas: e.target.value })}
              placeholder="Nama Kepala SKPD"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="pd-telp"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Telepon Kantor
            </label>
            <input
              id="pd-telp"
              type="text"
              value={form.telepon}
              onChange={(e) => setForm({ ...form, telepon: e.target.value })}
              placeholder="(021) xxxxxxx"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="pd-alamat"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Alamat Kantor
            </label>
            <textarea
              id="pd-alamat"
              rows={2}
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              placeholder="Alamat lengkap kantor perangkat daerah..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0a3649] focus:outline-none"
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
                : 'Simpan Perangkat Daerah'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

