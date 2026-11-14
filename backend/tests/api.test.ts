import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createApp } from '../src/app'
import { prisma } from '../src/lib/db'
import { seedDatabase } from '../prisma/seed'

interface ApiEnvelope<T = unknown> {
  success: boolean
  message: string
  data: T
  meta?: Record<string, unknown>
  error?: {
    code: string
    details?: unknown
  }
}

let server: Server
let baseUrl = ''
let adminToken = ''
let viewerToken = ''

async function requestJson<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; body: ApiEnvelope<T> }> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  const body = (await res.json()) as ApiEnvelope<T>
  return { status: res.status, body }
}

before(async () => {
  await seedDatabase(prisma)
  const app = createApp()
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as AddressInfo
      baseUrl = `http://127.0.0.1:${addr.port}`
      resolve()
    })
  })

  const adminLogin = await requestJson<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'admin.bpad', password: 'admin123' }),
  })
  assert.equal(adminLogin.status, 200)
  adminToken = adminLogin.body.data.token

  const viewerLogin = await requestJson<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'auditor.bmd', password: 'auditor123' }),
  })
  assert.equal(viewerLogin.status, 200)
  viewerToken = viewerLogin.body.data.token
})

after(async () => {
  await seedDatabase(prisma)
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()))
  })
  await prisma.$disconnect()
})

describe('SI-KDO BMD REST API & Swagger', () => {
  it('GET /api/health returns 200 UP', async () => {
    const { status, body } = await requestJson<{ status: string; database: string }>(
      '/api/health'
    )
    assert.equal(status, 200)
    assert.equal(body.success, true)
    assert.equal(body.data.status, 'UP')
    assert.equal(body.data.database, 'connected')
  })

  it('GET /api-docs.json and /api-docs serve OpenAPI 3.0.3 spec and Swagger UI', async () => {
    const specRes = await fetch(`${baseUrl}/api-docs.json`)
    assert.equal(specRes.status, 200)
    const spec = (await specRes.json()) as {
      openapi: string
      paths: Record<string, unknown>
    }
    assert.equal(spec.openapi, '3.0.3')
    assert.ok(spec.paths['/api/kendaraan'])
    assert.ok(spec.paths['/api/peminjaman'])
    assert.ok(spec.paths['/api/servis'])
    assert.ok(spec.paths['/api/roles'])
    assert.ok(spec.paths['/api/auth/login'])

    const uiRes = await fetch(`${baseUrl}/api-docs/`)
    assert.equal(uiRes.status, 200)
    const html = await uiRes.text()
    assert.ok(html.toLowerCase().includes('swagger'))
  })

  it('Auth enforces 401 when missing token and 401 on wrong password', async () => {
    const unauth = await requestJson('/api/kendaraan')
    assert.equal(unauth.status, 401)
    assert.equal(unauth.body.success, false)
    assert.equal(unauth.body.error?.code, 'UNAUTHORIZED')

    const badLogin = await requestJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'admin.bpad', password: 'wrong' }),
    })
    assert.equal(badLogin.status, 401)
    assert.equal(badLogin.body.success, false)

    const me = await requestJson<{ username: string }>('/api/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(me.status, 200)
    assert.equal(me.body.data.username, 'admin.bpad')
  })

  it('RBAC returns 403 when VIEWER attempts mutating operations or ADMIN routes', async () => {
    const postKdo = await requestJson('/api/kendaraan', {
      method: 'POST',
      headers: { Authorization: `Bearer ${viewerToken}` },
      body: JSON.stringify({}),
    })
    assert.equal(postKdo.status, 403)
    assert.equal(postKdo.body.error?.code, 'FORBIDDEN')

    const getUsers = await requestJson('/api/users', {
      headers: { Authorization: `Bearer ${viewerToken}` },
    })
    assert.equal(getUsers.status, 403)
  })

  it('GET /api/dashboard returns seeded summary and supports perangkatDaerahId filter', async () => {
    const all = await requestJson<{
      totalKendaraan: number
      totalPegawai: number
      totalPerangkatDaerah: number
      totalSedangDipinjam: number
      totalBiayaServis: number
    }>('/api/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(all.status, 200)
    assert.equal(all.body.data.totalKendaraan, 8)
    assert.equal(all.body.data.totalPegawai, 6)
    assert.equal(all.body.data.totalPerangkatDaerah, 3)
    assert.equal(all.body.data.totalSedangDipinjam, 1)
    assert.equal(all.body.data.totalBiayaServis, 6480000)

    const pds = await requestJson<Array<{ id: number; singkatan: string }>>(
      '/api/perangkat-daerah',
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
    const disdik = pds.body.data.find((pd) => pd.singkatan === 'DISDIK')!
    const scoped = await requestJson<{ totalKendaraan: number }>(
      `/api/dashboard?perangkatDaerahId=${disdik.id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
    assert.equal(scoped.status, 200)
    assert.equal(scoped.body.data.totalKendaraan, 3)
  })

  it('Perangkat Daerah CRUD enforces 400 validation, 409 duplicate, and 409 delete protection', async () => {
    const bad = await requestJson('/api/perangkat-daerah', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ kodeSkpd: '', nama: '', singkatan: '' }),
    })
    assert.equal(bad.status, 400)

    const created = await requestJson<{ id: number; singkatan: string }>(
      '/api/perangkat-daerah',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          kodeSkpd: '1.99.01.01',
          nama: 'Dinas Uji Coba',
          singkatan: 'dujicoba',
          kepalaDinas: 'Kepala Uji',
          alamat: 'Jl. Uji No. 1',
          telepon: '021123456',
        }),
      }
    )
    assert.equal(created.status, 201)
    assert.equal(created.body.data.singkatan, 'DUJICOBA')

    const dup = await requestJson('/api/perangkat-daerah', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        kodeSkpd: '1.99.01.01',
        nama: 'Dinas Duplikat',
        singkatan: 'DUP',
      }),
    })
    assert.equal(dup.status, 409)

    const delOk = await requestJson(`/api/perangkat-daerah/${created.body.data.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(delOk.status, 200)

    // Tidak bisa menghapus SKPD yang masih memiliki pegawai/kendaraan
    const pds = await requestJson<Array<{ id: number }>>('/api/perangkat-daerah', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const delProtected = await requestJson(
      `/api/perangkat-daerah/${pds.body.data[0].id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    )
    assert.equal(delProtected.status, 409)
  })

  it('Kendaraan CRUD auto-creates RiwayatKendaraan and Servis CRUD works end-to-end', async () => {
    const pds = await requestJson<Array<{ id: number }>>('/api/perangkat-daerah', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const pdId = pds.body.data[0].id

    const pegs = await requestJson<Array<{ id: number }>>(
      `/api/pegawai?perangkatDaerahId=${pdId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
    const pegId = pegs.body.data[0].id

    const createdKdo = await requestJson<{ id: number; nomorPolisi: string }>(
      '/api/kendaraan',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          nomorPolisi: 'b  7777  xyz',
          kodeBarang: '1.3.2.02.99',
          merek: 'Toyota',
          tipeModel: 'Rush GR Sport',
          jenis: 'RODA_4',
          tahunProduksi: 2024,
          warna: 'Putih',
          kondisi: 'BAIK',
          lokasiParkir: 'Pool Kantor',
          perangkatDaerahId: pdId,
          pegawaiId: null,
          nomorBast: 'BAST/TEST/001',
        }),
      }
    )
    assert.equal(createdKdo.status, 201)
    assert.equal(createdKdo.body.data.nomorPolisi, 'B 7777 XYZ')
    const kdoId = createdKdo.body.data.id

    const updatedKdo = await requestJson<{ kondisi: string; pegawaiId: number }>(
      `/api/kendaraan/${kdoId}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          nomorPolisi: 'B 7777 XYZ',
          kodeBarang: '1.3.2.02.99',
          merek: 'Toyota',
          tipeModel: 'Rush GR Sport',
          jenis: 'RODA_4',
          tahunProduksi: 2024,
          warna: 'Putih',
          kondisi: 'RUSAK_RINGAN',
          lokasiParkir: 'Pool Kantor',
          perangkatDaerahId: pdId,
          pegawaiId: pegId,
        }),
      }
    )
    assert.equal(updatedKdo.status, 200)
    assert.equal(updatedKdo.body.data.kondisi, 'RUSAK_RINGAN')

    const riwayat = await requestJson<Array<{ jenisPerubahan: string }>>(
      `/api/kendaraan/${kdoId}/riwayat`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
    assert.equal(riwayat.status, 200)
    assert.equal(riwayat.body.data.length, 2)

    const createdServis = await requestJson<{ id: number; biaya: number }>(
      '/api/servis',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          kendaraanId: kdoId,
          tanggalServis: '2026-11-14',
          jenisServis: 'SERVIS_RUTIN',
          status: 'TERJADWAL',
          bengkel: 'Auto2000 Test',
          kilometer: 1000,
          biaya: 500000,
          deskripsi: 'Servis perdana',
        }),
      }
    )
    assert.equal(createdServis.status, 201)
    assert.equal(createdServis.body.data.biaya, 500000)

    const delKdo = await requestJson(`/api/kendaraan/${kdoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(delKdo.status, 200)

    const missingKdo = await requestJson(`/api/kendaraan/${kdoId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(missingKdo.status, 404)
  })

  it('Users endpoint never exposes passwordHash and supports CRUD', async () => {
    const list = await requestJson<Array<Record<string, unknown>>>('/api/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(list.status, 200)
    assert.ok(list.body.data.length >= 3)
    for (const u of list.body.data) {
      assert.equal('passwordHash' in u, false)
    }

    const created = await requestJson<{ id: number; username: string }>(
      '/api/users',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          username: 'tester.viewer',
          nama: 'Tester Viewer',
          email: 'tester.viewer@jakarta.go.id',
          password: 'password123',
          role: 'VIEWER',
          perangkatDaerahId: null,
          aktif: true,
        }),
      }
    )
    assert.equal(created.status, 201)

    const del = await requestJson(`/api/users/${created.body.data.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(del.status, 200)
  })

  it('Peminjaman CRUD validates unit eligibility, date overlap (409), and complete syncs condition + riwayat', async () => {
    const list = await requestJson<Array<{ id: number; status: string }>>(
      '/api/peminjaman',
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
    assert.equal(list.status, 200)
    assert.equal(list.body.data.length, 3)

    // Unit #3 kondisi RUSAK_RINGAN -> tidak memenuhi syarat dipinjam
    const ineligible = await requestJson('/api/peminjaman', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        kendaraanId: 3,
        peminjamNama: 'Tester Peminjam',
        tujuanKeperluan: 'Uji kelayakan unit rusak',
        tanggalPinjam: '2027-01-10',
        tanggalKembaliRencana: '2027-01-11',
        status: 'TERJADWAL',
      }),
    })
    assert.equal(ineligible.status, 400)

    // Unit #6 sudah TERJADWAL pada 2026-11-18 s/d 2026-11-19 -> bentrok 409
    const overlap = await requestJson('/api/peminjaman', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        kendaraanId: 6,
        peminjamNama: 'Peminjam Bentrok',
        tujuanKeperluan: 'Uji bentrok jadwal',
        tanggalPinjam: '2026-11-18',
        tanggalKembaliRencana: '2026-11-20',
        status: 'TERJADWAL',
      }),
    })
    assert.equal(overlap.status, 409)
    assert.equal(overlap.body.error?.code, 'CONFLICT')

    // Buat peminjaman baru pada unit layak (#1)
    const created = await requestJson<{ id: number; status: string }>(
      '/api/peminjaman',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          kendaraanId: 1,
          peminjamPegawaiId: 1,
          peminjamNama: 'Drs. Agus Darmawan, M.Si.',
          peminjamInstansi: 'Dinas Pendidikan',
          tujuanKeperluan: 'Koordinasi aset kecamatan',
          lokasiTujuan: 'Jakarta Timur',
          tanggalPinjam: '2027-02-01',
          tanggalKembaliRencana: '2027-02-02',
          status: 'DIPINJAM',
          nomorSuratTugas: 'ST/TEST/099/2027',
          kilometerAwal: 19000,
        }),
      }
    )
    assert.equal(created.status, 201)
    const peminjamanId = created.body.data.id

    // Complete dengan perubahan kondisi -> otomatis update KDO & tambah riwayat KONDISI
    const completed = await requestJson<{
      status: string
      kondisiSaatKembali: string
      kilometerAkhir: number
    }>(`/api/peminjaman/${peminjamanId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        tanggalKembaliAktual: '2027-02-02',
        kilometerAkhir: 19120,
        kondisiSaatKembali: 'RUSAK_RINGAN',
        catatan: 'Bumper belakang lecet ringan saat parkir.',
      }),
    })
    assert.equal(completed.status, 200)
    assert.equal(completed.body.data.status, 'SELESAI')
    assert.equal(completed.body.data.kondisiSaatKembali, 'RUSAK_RINGAN')

    const k1 = await requestJson<{
      kondisi: string
      riwayat: Array<{ jenisPerubahan: string; nomorBast: string }>
    }>('/api/kendaraan/1', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(k1.status, 200)
    assert.equal(k1.body.data.kondisi, 'RUSAK_RINGAN')
    assert.ok(
      k1.body.data.riwayat.some(
        (r) => r.jenisPerubahan === 'KONDISI' && r.nomorBast === 'ST/TEST/099/2027'
      )
    )

    const del = await requestJson(`/api/peminjaman/${peminjamanId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(del.status, 200)
  })

  it('Roles CRUD & dynamic RBAC allow custom role assignment, live permission enforcement, and code cascade', async () => {
    const rolesRes = await requestJson<
      Array<{ id: number; code: string; isSystem: boolean }>
    >('/api/roles', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(rolesRes.status, 200)
    assert.equal(rolesRes.body.data.length, 3)

    const sysRole = rolesRes.body.data.find((r) => r.code === 'VIEWER')!
    const delSystem = await requestJson(`/api/roles/${sysRole.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(delSystem.status, 400)

    const unknownRoleUser = await requestJson('/api/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        username: 'invalid.role.user',
        nama: 'Invalid Role',
        email: 'invalid.role@jakarta.go.id',
        password: 'password123',
        role: 'ROLE_TIDAK_ADA',
        perangkatDaerahId: null,
        aktif: true,
      }),
    })
    assert.equal(unknownRoleUser.status, 400)

    const createdRole = await requestJson<{ id: number; code: string }>(
      '/api/roles',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          code: 'staf armada',
          name: 'Staf Armada Lapangan',
          description: 'Kelola peminjaman kendaraan tanpa akses master user/role.',
          permissions: {
            dashboard: { read: true, create: false, update: false, delete: false },
            kendaraan: { read: true, create: false, update: false, delete: false },
            peminjaman: { read: true, create: true, update: true, delete: false },
            servis: { read: false, create: false, update: false, delete: false },
            pajakDokumen: { read: false, create: false, update: false, delete: false },
            pegawai: { read: false, create: false, update: false, delete: false },
            perangkatDaerah: { read: false, create: false, update: false, delete: false },
            users: { read: false, create: false, update: false, delete: false },
            roles: { read: false, create: false, update: false, delete: false },
          },
        }),
      }
    )
    assert.equal(createdRole.status, 201)
    assert.equal(createdRole.body.data.code, 'STAF_ARMADA')
    const customRoleId = createdRole.body.data.id

    const customUser = await requestJson<{ id: number; role: string }>(
      '/api/users',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          username: 'staf.armada',
          nama: 'Petugas Armada',
          email: 'armada@jakarta.go.id',
          password: 'password123',
          role: 'STAF_ARMADA',
          perangkatDaerahId: null,
          aktif: true,
        }),
      }
    )
    assert.equal(customUser.status, 201)
    const customUserId = customUser.body.data.id

    // Role masih dipakai -> 409 Conflict saat dihapus
    const delInUse = await requestJson(`/api/roles/${customRoleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(delInUse.status, 409)

    const customLogin = await requestJson<{
      token: string
      user: { role: string; permissions: { peminjaman: { create: boolean } } }
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'staf.armada', password: 'password123' }),
    })
    assert.equal(customLogin.status, 200)
    assert.equal(customLogin.body.data.user.role, 'STAF_ARMADA')
    assert.equal(customLogin.body.data.user.permissions.peminjaman.create, true)
    const customToken = customLogin.body.data.token

    // Diizinkan membaca kendaraan & peminjaman, ditolak untuk POST kendaraan & GET users
    const readKdo = await requestJson('/api/kendaraan', {
      headers: { Authorization: `Bearer ${customToken}` },
    })
    assert.equal(readKdo.status, 200)

    const readPmj = await requestJson('/api/peminjaman', {
      headers: { Authorization: `Bearer ${customToken}` },
    })
    assert.equal(readPmj.status, 200)

    const forbiddenPostKdo = await requestJson('/api/kendaraan', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customToken}` },
      body: JSON.stringify({}),
    })
    assert.equal(forbiddenPostKdo.status, 403)

    const forbiddenUsers = await requestJson('/api/users', {
      headers: { Authorization: `Bearer ${customToken}` },
    })
    assert.equal(forbiddenUsers.status, 403)

    // Ubah kode role & cabut izin peminjaman.read -> cascade ke user + langsung aktif pada JWT yang sama
    const updatedRole = await requestJson<{ id: number; code: string }>(
      `/api/roles/${customRoleId}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          code: 'ARMADA_LAPANGAN',
          name: 'Armada Lapangan',
          description: 'Updated role',
          permissions: {
            dashboard: { read: true, create: false, update: false, delete: false },
            kendaraan: { read: true, create: false, update: false, delete: false },
            peminjaman: { read: false, create: false, update: false, delete: false },
          },
        }),
      }
    )
    assert.equal(updatedRole.status, 200)
    assert.equal(updatedRole.body.data.code, 'ARMADA_LAPANGAN')

    const cascadedUser = await requestJson<{ role: string }>(
      `/api/users/${customUserId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
    assert.equal(cascadedUser.status, 200)
    assert.equal(cascadedUser.body.data.role, 'ARMADA_LAPANGAN')

    const revokedPmj = await requestJson('/api/peminjaman', {
      headers: { Authorization: `Bearer ${customToken}` },
    })
    assert.equal(revokedPmj.status, 403)

    await requestJson(`/api/users/${customUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const delCustomRole = await requestJson(`/api/roles/${customRoleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(delCustomRole.status, 200)
  })
})
