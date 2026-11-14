import { apiRequest } from '../lib/apiClient'
import type { DashboardSummary } from '../types/bmd'

export async function getDashboardSummary(
  filterPdId?: number | null
): Promise<DashboardSummary> {
  const query = filterPdId ? `?perangkatDaerahId=${filterPdId}` : ''
  return apiRequest<DashboardSummary>(`/dashboard${query}`)
}

