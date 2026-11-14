import { apiRequest, normalizeOptionalDate } from '../lib/apiClient'
import type {
  KondisiKendaraan,
  PeminjamanInput,
  PeminjamanKendaraan,
} from '../types/bmd'

export async function listPeminjaman(): Promise<PeminjamanKendaraan[]> {
  return apiRequest<PeminjamanKendaraan[]>('/peminjaman')
}

export async function createPeminjaman(
  input: PeminjamanInput
): Promise<PeminjamanKendaraan> {
  return apiRequest<PeminjamanKendaraan>('/peminjaman', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      tanggalKembaliAktual: normalizeOptionalDate(input.tanggalKembaliAktual),
    }),
  })
}

export async function updatePeminjaman(
  id: number,
  input: PeminjamanInput
): Promise<PeminjamanKendaraan> {
  return apiRequest<PeminjamanKendaraan>(`/peminjaman/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...input,
      tanggalKembaliAktual: normalizeOptionalDate(input.tanggalKembaliAktual),
    }),
  })
}

export async function completePeminjaman(
  id: number,
  returnData: {
    tanggalKembaliAktual: string
    kilometerAkhir: number | null
    kondisiSaatKembali: KondisiKendaraan
    catatan: string
  }
): Promise<PeminjamanKendaraan> {
  return apiRequest<PeminjamanKendaraan>(`/peminjaman/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify(returnData),
  })
}

export async function deletePeminjaman(id: number): Promise<void> {
  await apiRequest<{ id: number }>(`/peminjaman/${id}`, {
    method: 'DELETE',
  })
}

