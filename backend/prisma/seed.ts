import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { makeDefaultPermissionMap } from '../src/lib/permissions'

const prisma = new PrismaClient()

export async function clearDatabase(client: PrismaClient = prisma): Promise<void> {
  // Bersihkan seluruh tabel dengan urutan child -> parent agar aman terhadap FK
  await client.peminjamanKendaraan.deleteMany()
  await client.servisKendaraan.deleteMany()
  await client.riwayatKendaraan.deleteMany()
  await client.kendaraanDinas.deleteMany()
  await client.pegawai.deleteMany()
  await client.appUser.deleteMany()
  await client.roleDefinition.deleteMany()
  await client.perangkatDaerah.deleteMany()
  await client.$executeRawUnsafe(
    `DELETE FROM sqlite_sequence WHERE name IN ('PerangkatDaerah', 'Pegawai', 'KendaraanDinas', 'RiwayatKendaraan', 'ServisKendaraan', 'PeminjamanKendaraan', 'RoleDefinition', 'AppUser')`
  )
}

export async function seedDatabase(client: PrismaClient = prisma): Promise<void> {
  await clearDatabase(client)

  const adminUsername = (process.env.SEED_ADMIN_USERNAME || 'admin.bpad')
    .trim()
    .toLowerCase()
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123'
  const adminNama = (
    process.env.SEED_ADMIN_NAMA || 'Super Admin Pengelola BMD'
  ).trim()
  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL || 'admin@bpad.jakarta.go.id'
  )
    .trim()
    .toLowerCase()

  // 1. Role tunggal bawaan: Super Admin (ADMIN_BPAD) dengan akses penuh ke semua modul
  await client.roleDefinition.create({
    data: {
      code: 'ADMIN_BPAD',
      name: 'Super Admin',
      description:
        'Akses penuh (Super Admin) ke seluruh modul sistem: Dashboard, KDO, Monitoring/Peminjaman, Servis, Dokumen/Pajak, PNS, Perangkat Daerah, User, dan Role.',
      isSystem: true,
      permissions: JSON.stringify(makeDefaultPermissionMap(true)),
    },
  })

  // 2. Akun tunggal bawaan: 1 akun Super Admin aktif
  const passwordHash = await bcrypt.hash(adminPassword, 10)
  await client.appUser.create({
    data: {
      username: adminUsername,
      nama: adminNama,
      email: adminEmail,
      passwordHash,
      role: 'ADMIN_BPAD',
      perangkatDaerahId: null,
      aktif: true,
    },
  })
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log(
        'Seed database SI-KDO BMD berhasil dijalankan (1 Super Admin, tanpa data dummy).'
      )
    })
    .catch((err) => {
      console.error('Gagal melakukan seeding database:', err)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
