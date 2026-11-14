import type {
  AppUser,
  KendaraanDinas,
  Pegawai,
  PeminjamanKendaraan,
  PerangkatDaerah,
  RiwayatKendaraan,
  RoleDefinition,
  ServisKendaraan,
} from '@prisma/client'
import {
  normalizePermissionMap,
  type PagePermissionKey,
  type CrudPermission,
} from './permissions'

export interface VehiclePhotoDto {
  id: string
  name: string
  dataUrl: string
}

export interface VehicleDocumentDto {
  fileName: string
  mimeType: string
  dataUrl: string
  uploadedAt: string
}

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function serializeUser(user: AppUser) {
  const { passwordHash: _omitted, ...safeUser } = user
  return safeUser
}

export function serializeKendaraan<
  T extends KendaraanDinas & {
    perangkatDaerah?: PerangkatDaerah
    pegawai?: Pegawai | null
    riwayat?: RiwayatKendaraan[]
    servis?: ServisKendaraan[]
  },
>(item: T) {
  return {
    ...item,
    fotos: safeJsonParse<VehiclePhotoDto[]>(item.fotos, []),
    dokumenStnk: safeJsonParse<VehicleDocumentDto | null>(item.dokumenStnk, null),
    dokumenBpkb: safeJsonParse<VehicleDocumentDto | null>(item.dokumenBpkb, null),
    servis: item.servis ? item.servis.map(serializeServis) : undefined,
  }
}

export function serializeServis<
  T extends ServisKendaraan & {
    kendaraan?: KendaraanDinas
  },
>(item: T) {
  return {
    ...item,
    buktiNota: safeJsonParse<VehicleDocumentDto | null>(item.buktiNota, null),
    kendaraan: item.kendaraan
      ? {
          id: item.kendaraan.id,
          nomorPolisi: item.kendaraan.nomorPolisi,
          merek: item.kendaraan.merek,
          tipeModel: item.kendaraan.tipeModel,
          perangkatDaerahId: item.kendaraan.perangkatDaerahId,
        }
      : undefined,
  }
}

export function serializeRole(role: RoleDefinition & { _count?: { users: number } }) {
  const parsed = safeJsonParse<
    Partial<Record<PagePermissionKey, Partial<CrudPermission>>>
  >(role.permissions, {})

  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: normalizePermissionMap(parsed),
    userCount: role._count?.users,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  }
}

export function serializePeminjaman<
  T extends PeminjamanKendaraan & {
    kendaraan?: KendaraanDinas
    peminjamPegawai?: Pegawai | null
  },
>(item: T) {
  return {
    ...item,
    kendaraan: item.kendaraan
      ? {
          id: item.kendaraan.id,
          nomorPolisi: item.kendaraan.nomorPolisi,
          merek: item.kendaraan.merek,
          tipeModel: item.kendaraan.tipeModel,
          perangkatDaerahId: item.kendaraan.perangkatDaerahId,
          kondisi: item.kendaraan.kondisi,
        }
      : undefined,
  }
}
