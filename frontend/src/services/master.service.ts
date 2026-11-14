import { apiRequest } from '../lib/apiClient'
import type {
  Pegawai,
  PegawaiInput,
  PerangkatDaerah,
  PerangkatDaerahInput,
} from '../types/bmd'

export async function listPerangkatDaerah(): Promise<PerangkatDaerah[]> {
  return apiRequest<PerangkatDaerah[]>('/perangkat-daerah')
}

export async function createPerangkatDaerah(
  input: PerangkatDaerahInput
): Promise<PerangkatDaerah> {
  return apiRequest<PerangkatDaerah>('/perangkat-daerah', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updatePerangkatDaerah(
  id: number,
  input: PerangkatDaerahInput
): Promise<PerangkatDaerah> {
  return apiRequest<PerangkatDaerah>(`/perangkat-daerah/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deletePerangkatDaerah(id: number): Promise<void> {
  await apiRequest<{ id: number }>(`/perangkat-daerah/${id}`, {
    method: 'DELETE',
  })
}

export async function listPegawai(): Promise<Pegawai[]> {
  return apiRequest<Pegawai[]>('/pegawai')
}

export async function createPegawai(input: PegawaiInput): Promise<Pegawai> {
  return apiRequest<Pegawai>('/pegawai', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updatePegawai(
  id: number,
  input: PegawaiInput
): Promise<Pegawai> {
  return apiRequest<Pegawai>(`/pegawai/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deletePegawai(id: number): Promise<void> {
  await apiRequest<{ id: number }>(`/pegawai/${id}`, {
    method: 'DELETE',
  })
}

