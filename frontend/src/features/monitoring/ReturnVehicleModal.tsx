import { useState, type FormEvent } from 'react'
import { CustomSelect } from '../../components/common/CustomSelect'
import { Modal } from '../../components/common/Modal'
import { KONDISI_OPTIONS } from '../../constants/domainOptions'
import { completePeminjaman } from '../../services/peminjaman.service'
import type {
  KendaraanDinas,
  KondisiKendaraan,
  PeminjamanKendaraan,
} from '../../types/bmd'
import { formatTanggalPendek, getTodayIsoDate } from '../../utils/format'
import type { ReturnFormState } from './monitoringTypes'

interface ReturnVehicleModalProps {
  returnTarget: PeminjamanKendaraan
  kendaraanMap: Map<number, KendaraanDinas>
  onClose: () => void
  onCompleted: (message: string) => Promise<void>
}

export function ReturnVehicleModal({
  returnTarget,
  kendaraanMap,
  onClose,
  onCompleted,
}: ReturnVehicleModalProps) {
  const [returnForm, setReturnForm] = useState<ReturnFormState>(() => ({
    tanggalKembaliAktual: getTodayIsoDate(),
    kilometerAkhir:
      returnTarget.kilometerAwal !== null
        ? String(returnTarget.kilometerAwal)
        : '',
    kondisiSaatKembali: 'BAIK',
    catatan: '',
  }))
  const [returnError, setReturnError] = useState<string | null>(null)
  const [returning, setReturning] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setReturnError(null)
    setReturning(true)
    try {
      await completePeminjaman(returnTarget.id, {
        tanggalKembaliAktual: returnForm.tanggalKembaliAktual,
        kilometerAkhir: returnForm.kilometerAkhir.trim()
          ? Number(returnForm.kilometerAkhir)
          : null,
        kondisiSaatKembali: returnForm.kondisiSaatKembali,
        catatan: returnForm.catatan,
      })
      const k = kendaraanMap.get(returnTarget.kendaraanId)
      onClose()
      await onCompleted(
        `Pengembalian unit ${k?.nomorPolisi ?? ''} berhasil dicatat dengan kondisi ${returnForm.kondisiSaatKembali.replace('_', ' ')}.`
      )
    } catch (err) {
      setReturnError(
        err instanceof Error ? err.message : 'Gagal mencatat pengembalian unit.'
      )
    } finally {
      setReturning(false)
    }
  }

  return (
    <Modal
      isOpen
      title={`Catat Pengembalian Unit - ${kendaraanMap.get(returnTarget.kendaraanId)?.nomorPolisi ?? 'KDO'}`}
      subtitle="Verifikasi tanggal kembali aktual, odometer akhir, dan kondisi fisik kendaraan pasca pakai."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {returnError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {returnError}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
          <p>
            <strong>Peminjam:</strong> {returnTarget.peminjamNama}
          </p>
          <p className="mt-0.5">
            <strong>Pinjam:</strong>{' '}
            {formatTanggalPendek(returnTarget.tanggalPinjam)} s/d Rencana{' '}
            {formatTanggalPendek(returnTarget.tanggalKembaliRencana)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="return-tgl"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Tanggal Kembali Aktual <span className="text-rose-600">*</span>
            </label>
            <input
              id="return-tgl"
              type="date"
              required
              value={returnForm.tanggalKembaliAktual}
              onChange={(e) =>
                setReturnForm({
                  ...returnForm,
                  tanggalKembaliAktual: e.target.value,
                })
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="return-km"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Odometer Akhir (km)
            </label>
            <input
              id="return-km"
              type="number"
              min={0}
              value={returnForm.kilometerAkhir}
              onChange={(e) =>
                setReturnForm({
                  ...returnForm,
                  kilometerAkhir: e.target.value,
                })
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="return-kondisi"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Kondisi Fisik Saat Kembali
            </label>
            <CustomSelect
              id="return-kondisi"
              value={returnForm.kondisiSaatKembali}
              onChange={(val) =>
                setReturnForm({
                  ...returnForm,
                  kondisiSaatKembali: val as KondisiKendaraan,
                })
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
            {returnForm.kondisiSaatKembali !== 'BAIK' && (
              <p className="mt-1.5 text-xs text-amber-800">
                Catatan: Status kondisi pada master KDO akan otomatis diperbarui sesuai kondisi pengembalian dan unit akan diblokir dari peminjaman berikutnya.
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="return-catatan"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Catatan Pemeriksaan Pengembalian
            </label>
            <textarea
              id="return-catatan"
              rows={2}
              value={returnForm.catatan}
              onChange={(e) =>
                setReturnForm({ ...returnForm, catatan: e.target.value })
              }
              placeholder="Contoh: Bodi aman, kunci dan STNK kembali lengkap..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0a3649] focus:outline-none"
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
            disabled={returning}
            className="min-h-[44px] rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {returning ? 'Memproses...' : 'Konfirmasi Pengembalian'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

