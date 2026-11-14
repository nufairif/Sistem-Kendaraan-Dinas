import type { Express } from 'express'
import swaggerUi from 'swagger-ui-express'
import { openApiComponents } from './components'
import { fleetPaths } from './paths/fleet.paths'
import { masterPaths } from './paths/master.paths'
import { systemPaths } from './paths/system.paths'
import { usersPaths } from './paths/users.paths'

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SI-KDO BMD REST API',
    version: '1.0.0',
    description: [
      'Dokumentasi REST API resmi untuk **Sistem Pengelolaan Kendaraan Dinas Operasional (SI-KDO BMD)**.',
      '',
      '### Format Standar Response JSON',
      '- **Sukses (`200`, `201`)**: `{ "success": true, "message": "...", "data": ..., "meta": ... }`',
      '- **Error (`400`, `401`, `403`, `404`, `409`, `500`)**: `{ "success": false, "message": "...", "error": { "code": "...", "details": ... } }`',
      '',
      '### Akun Uji Coba (Hasil Seeding)',
      '| Role | Username | Password | Hak Akses |',
      '|---|---|---|---|',
      '| `ADMIN_BPAD` | `admin.bpad` | `admin123` | Akses penuh seluruh modul, User & Manajemen Role |',
      '| `OPERATOR_SKPD` | `operator.disdik` | `operator123` | Kelola KDO, Peminjaman, Servis, PNS, dan Perangkat Daerah |',
      '| `VIEWER` | `auditor.bmd` | `auditor123` | Mode pantau (hanya `GET`, hak akses dapat diubah per role) |',
    ].join('\n'),
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development Server (Localhost)',
    },
  ],
  tags: [
    { name: 'Health', description: 'Pemeriksaan kesehatan layanan API & database' },
    { name: 'Auth', description: 'Autentikasi JWT & informasi sesi pengguna' },
    { name: 'Dashboard', description: 'Statistik ringkasan BMD & pengingat pajak Samsat' },
    { name: 'Perangkat Daerah', description: 'CRUD master SKPD / Perangkat Daerah' },
    { name: 'Pegawai (PNS)', description: 'CRUD Pegawai Negeri Sipil penanggung jawab KDO' },
    { name: 'Kendaraan Dinas (KDO)', description: 'CRUD KDO, dokumen STNK/BPKB, galeri foto & riwayat' },
    { name: 'Monitoring & Peminjaman', description: 'CRUD peminjaman KDO, validasi bentrok & pencatatan pengembalian' },
    { name: 'Servis & Pemeliharaan', description: 'CRUD jadwal servis, perbaikan bengkel & uji KIR' },
    { name: 'Users & RBAC', description: 'Manajemen akun pengguna berdasarkan hak akses halaman' },
    { name: 'Roles & Hak Akses', description: 'Manajemen role dinamis dan matriks izin CRUD per halaman' },
  ],
  security: [{ bearerAuth: [] }],
  components: openApiComponents,
  paths: {
    ...systemPaths,
    ...masterPaths,
    ...fleetPaths,
    ...usersPaths,
  },
}

export function registerSwagger(app: Express): void {
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.status(200).json(openApiSpec)
  })

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      explorer: true,
      customSiteTitle: 'SI-KDO BMD API Docs (Swagger)',
      swaggerOptions: {
        docExpansion: 'list',
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        displayRequestDuration: true,
        persistAuthorization: true,
      },
    })
  )
}
