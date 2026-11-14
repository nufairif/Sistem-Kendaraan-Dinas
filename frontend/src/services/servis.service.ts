import { apiRequest, normalizeOptionalDate } from '../lib/apiClient'
import type { ServisInput, ServisKendaraan } from '../types/bmd'

export async function listServis(): Promise<ServisKendaraan[]> {
  return apiRequest<ServisKendaraan[]>('/servis')
}

export async function createServis(
  input: ServisInput
): Promise<ServisKendaraan> {
  return apiRequest<ServisKendaraan>('/servis', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      servisBerikutnyaTanggal: normalizeOptionalDate(
        input.servisBerikutnyaTanggal
      ),
    }),
  })
}

export async function updateServis(
  id: number,
  input: ServisInput
): Promise<ServisKendaraan> {
  return apiRequest<ServisKendaraan>(`/servis/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...input,
      servisBerikutnyaTanggal: normalizeOptionalDate(
        input.servisBerikutnyaTanggal
      ),
    }),
  })
}

export async function deleteServis(id: number): Promise<void> {
  await apiRequest<{ id: number }>(`/servis/${id}`, {
    method: 'DELETE',
  })
}

