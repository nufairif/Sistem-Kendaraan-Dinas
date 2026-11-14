export interface TaxStatusResult {
  status: 'NONE' | 'OVERDUE' | 'WARNING' | 'SAFE'
  daysRemaining: number | null
  label: string
}

export function getTaxStatus(dateStr: string | null): TaxStatusResult {
  if (!dateStr) {
    return { status: 'NONE', daysRemaining: null, label: 'Belum Diatur' }
  }

  const parts = dateStr.split('-')
  if (parts.length !== 3) {
    return { status: 'NONE', daysRemaining: null, label: 'Format Tidak Valid' }
  }

  const target = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  )
  if (Number.isNaN(target.getTime())) {
    return { status: 'NONE', daysRemaining: null, label: 'Format Tidak Valid' }
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffMs = target.getTime() - today.getTime()
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (daysRemaining < 0) {
    return {
      status: 'OVERDUE',
      daysRemaining,
      label: `Lewat ${Math.abs(daysRemaining)} hari`,
    }
  }
  if (daysRemaining === 0) {
    return {
      status: 'WARNING',
      daysRemaining: 0,
      label: 'Jatuh Tempo Hari Ini',
    }
  }
  if (daysRemaining < 30) {
    return {
      status: 'WARNING',
      daysRemaining,
      label: `Sisa ${daysRemaining} hari`,
    }
  }
  return {
    status: 'SAFE',
    daysRemaining,
    label: `Aktif (${daysRemaining} hari lagi)`,
  }
}
