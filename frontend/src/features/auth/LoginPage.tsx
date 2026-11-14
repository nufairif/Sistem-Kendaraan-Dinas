import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, KeyRound, Lock, User } from 'lucide-react'
import { loginUser } from '../../services/auth.service'
import type { AuthSession } from '../../types/bmd'

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void
}

const DEMO_ACCOUNTS = [
  {
    label: 'Admin BPAD',
    identifier: 'admin.bpad',
    password: 'admin123',
    note: 'Akses penuh + Manajemen User',
  },
]

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const session = await loginUser(identifier, password)
      onLoginSuccess(session)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal masuk ke dalam sistem.',
      )
    } finally {
      setLoading(false)
    }
  }

  const fillDemoAccount = (id: string, pass: string) => {
    setIdentifier(id)
    setPassword(pass)
    setError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f6f9] px-4 py-10">
      <main className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-12">
        {/* Panel Informasi Instansi */}
        <section className="flex flex-col justify-between gap-8 bg-[#0a3649] p-8 text-white lg:col-span-5">
          <div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white font-mono text-sm font-extrabold text-[#0a3649]">
              BMD
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
              SI-KDO Daerah
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              Sistem Pengelolaan Kendaraan Dinas Operasional (KDO) sebagai bagian dari tata kelola Barang Milik Daerah (BMD).
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-white/15 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Akun Uji Coba Lokal
            </div>
            <p className="text-xs text-slate-300">
              Klik akun di bawah ini untuk mengisi form masuk secara otomatis:
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.identifier}
                  type="button"
                  onClick={() => fillDemoAccount(acc.identifier, acc.password)}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/15"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">
                      {acc.label}
                    </span>
                    <span className="font-mono text-[11px] text-sky-300">
                      {acc.identifier}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-300">
                    {acc.note}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Form Login */}
        <section className="flex flex-col justify-center p-8 sm:p-10 lg:col-span-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
              Akses Portal Pengelola Aset
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#0a3649]">
              Masuk ke Akun Anda
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Masukkan username atau email kedinasan beserta kata sandi untuk melanjutkan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="login-identifier"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Username atau Email
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="login-identifier"
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: admin.bpad atau admin@bpad.jakarta.go.id"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0a3649] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0a3649] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'
                  }
                  className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 min-h-[46px] w-full rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

