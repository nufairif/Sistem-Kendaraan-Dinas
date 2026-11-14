import type { KondisiKendaraan } from '../../types/bmd'
import { getKondisiLabel } from '../../utils/format'

interface KondisiBadgeProps {
  kondisi: KondisiKendaraan
}

const STYLE_MAP: Record<
  KondisiKendaraan,
  { container: string; dot: string }
> = {
  BAIK: {
    container: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
  },
  RUSAK_RINGAN: {
    container: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-600',
  },
  RUSAK_BERAT: {
    container: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-600',
  },
}

export function KondisiBadge({ kondisi }: KondisiBadgeProps) {
  const style = STYLE_MAP[kondisi]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold ${style.container}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {getKondisiLabel(kondisi)}
    </span>
  )
}

