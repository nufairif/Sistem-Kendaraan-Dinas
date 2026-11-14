import { apiRequest, normalizeOptionalDate } from '../lib/apiClient'
import type {
  KendaraanDinas,
  KendaraanInput,
  RiwayatKendaraan,
} from '../types/bmd'

export async function listKendaraan(): Promise<KendaraanDinas[]> {
  return apiRequest<KendaraanDinas[]>('/kendaraan')
}

export async function listRiwayatByKendaraan(
  kendaraanId: number
): Promise<RiwayatKendaraan[]> {
  return apiRequest<RiwayatKendaraan[]>(`/kendaraan/${kendaraanId}/riwayat`)
}

export async function createKendaraan(
  input: KendaraanInput
): Promise<KendaraanDinas> {
  return apiRequest<KendaraanDinas>('/kendaraan', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      pajakTahunanJatuhTempo: normalizeOptionalDate(
        input.pajakTahunanJatuhTempo
      ),
      pajakLimaTahunanJatuhTempo: normalizeOptionalDate(
        input.pajakLimaTahunanJatuhTempo
      ),
    }),
  })
}

export async function updateKendaraan(
  id: number,
  input: KendaraanInput
): Promise<KendaraanDinas> {
  return apiRequest<KendaraanDinas>(`/kendaraan/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...input,
      pajakTahunanJatuhTempo: normalizeOptionalDate(
        input.pajakTahunanJatuhTempo
      ),
      pajakLimaTahunanJatuhTempo: normalizeOptionalDate(
        input.pajakLimaTahunanJatuhTempo
      ),
    }),
  })
}

export async function deleteKendaraan(id: number): Promise<void> {
  await apiRequest<{ id: number }>(`/kendaraan/${id}`, {
    method: 'DELETE',
  })
}

