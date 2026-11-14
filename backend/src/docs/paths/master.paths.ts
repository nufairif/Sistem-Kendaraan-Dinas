import {
  idPathParam,
  jsonResponse,
  protectedReadResponses,
  protectedWriteResponses,
  successSchema,
} from '../helpers'

export const masterPaths = {
  '/api/perangkat-daerah': {
    get: {
      tags: ['Perangkat Daerah'],
      summary: 'Daftar seluruh Perangkat Daerah (SKPD)',
      parameters: [
        {
          name: 'search',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Cari berdasarkan kode SKPD, nama, singkatan, atau kepala dinas',
        },
      ],
      responses: {
        200: jsonResponse(
          '200 OK - Daftar Perangkat Daerah',
          successSchema(
            {
              type: 'array',
              items: { $ref: '#/components/schemas/PerangkatDaerah' },
            },
            true
          ),
          {
            success: true,
            message: 'Daftar Perangkat Daerah berhasil dimuat.',
            data: [
              {
                id: 1,
                kodeSkpd: '1.01.01.01',
                nama: 'Dinas Pendidikan',
                singkatan: 'DISDIK',
                kepalaDinas: 'Dr. H. Budi Santoso, M.Pd.',
                alamat: 'Jl. Jenderal Gatot Subroto Kav. 40-41, Jakarta Selatan',
                telepon: '(021) 39504027',
                createdAt: '2026-11-14T05:00:00.000Z',
                updatedAt: '2026-11-14T05:00:00.000Z',
                _count: { pegawai: 2, kendaraan: 3 },
              },
            ],
            meta: { total: 1 },
          }
        ),
        ...protectedReadResponses,
      },
    },
    post: {
      tags: ['Perangkat Daerah'],
      summary: 'Tambah Perangkat Daerah baru',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PerangkatDaerahInput' },
          },
        },
      },
      responses: {
        201: jsonResponse(
          '201 Created - Perangkat Daerah berhasil ditambahkan',
          successSchema({ $ref: '#/components/schemas/PerangkatDaerah' }),
          {
            success: true,
            message: 'Perangkat Daerah berhasil ditambahkan.',
            data: {
              id: 4,
              kodeSkpd: '1.04.01.01',
              nama: 'Dinas Perhubungan',
              singkatan: 'DISHUB',
              kepalaDinas: 'Dr. Syafrin Liputo, M.T.',
              alamat: 'Jl. Taman Jatibaru No. 1, Jakarta Pusat',
              telepon: '(021) 3501349',
              createdAt: '2026-11-14T05:00:00.000Z',
              updatedAt: '2026-11-14T05:00:00.000Z',
            },
          }
        ),
        409: { $ref: '#/components/responses/Conflict' },
        ...protectedWriteResponses,
      },
    },
  },

  '/api/perangkat-daerah/{id}': {
    get: {
      tags: ['Perangkat Daerah'],
      summary: 'Detail Perangkat Daerah beserta daftar PNS dan KDO miliknya',
      parameters: [idPathParam],
      responses: {
        200: jsonResponse(
          '200 OK - Detail Perangkat Daerah',
          successSchema({ $ref: '#/components/schemas/PerangkatDaerah' }),
          {
            success: true,
            message: 'Detail Perangkat Daerah berhasil dimuat.',
            data: {
              id: 1,
              kodeSkpd: '1.01.01.01',
              nama: 'Dinas Pendidikan',
              singkatan: 'DISDIK',
              kepalaDinas: 'Dr. H. Budi Santoso, M.Pd.',
              alamat: 'Jl. Jenderal Gatot Subroto Kav. 40-41, Jakarta Selatan',
              telepon: '(021) 39504027',
              pegawai: [],
              kendaraan: [],
              _count: { pegawai: 2, kendaraan: 3 },
            },
          }
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        404: { $ref: '#/components/responses/NotFound' },
        ...protectedReadResponses,
      },
    },
    put: {
      tags: ['Perangkat Daerah'],
      summary: 'Perbarui data Perangkat Daerah',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PerangkatDaerahInput' },
          },
        },
      },
      responses: {
        200: jsonResponse(
          '200 OK - Data Perangkat Daerah diperbarui',
          successSchema({ $ref: '#/components/schemas/PerangkatDaerah' }),
          {
            success: true,
            message: 'Data Perangkat Daerah berhasil diperbarui.',
            data: {
              id: 1,
              kodeSkpd: '1.01.01.01',
              nama: 'Dinas Pendidikan DKI Jakarta',
              singkatan: 'DISDIK',
            },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        409: { $ref: '#/components/responses/Conflict' },
        ...protectedWriteResponses,
      },
    },
    delete: {
      tags: ['Perangkat Daerah'],
      summary: 'Hapus Perangkat Daerah (ditolak jika masih memiliki PNS/KDO)',
      parameters: [idPathParam],
      responses: {
        200: jsonResponse(
          '200 OK - Data Perangkat Daerah berhasil dihapus',
          successSchema({
            type: 'object',
            properties: { id: { type: 'integer' } },
          }),
          {
            success: true,
            message: 'Data Perangkat Daerah berhasil dihapus.',
            data: { id: 4 },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        409: { $ref: '#/components/responses/Conflict' },
        ...protectedWriteResponses,
      },
    },
  },

  '/api/pegawai': {
    get: {
      tags: ['Pegawai (PNS)'],
      summary: 'Daftar Pegawai Negeri Sipil (PNS)',
      parameters: [
        {
          name: 'perangkatDaerahId',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Filter berdasarkan ID Perangkat Daerah',
        },
        {
          name: 'golongan',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter berdasarkan golongan PNS (misal: IV/a, III/c)',
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Cari berdasarkan NIP, nama, atau jabatan',
        },
      ],
      responses: {
        200: jsonResponse(
          '200 OK - Daftar PNS',
          successSchema(
            { type: 'array', items: { $ref: '#/components/schemas/Pegawai' } },
            true
          ),
          {
            success: true,
            message: 'Daftar Pegawai Negeri Sipil (PNS) berhasil dimuat.',
            data: [
              {
                id: 1,
                nip: '197804122003121004',
                nama: 'Drs. Agus Darmawan, M.Si.',
                jabatan: 'Kepala Bidang Sarana dan Prasarana Pendidikan',
                golongan: 'IV/b',
                pangkat: 'Pembina Tingkat I',
                noHp: '081288901122',
                email: 'agus.darmawan@jakarta.go.id',
                perangkatDaerahId: 1,
              },
            ],
            meta: { total: 1 },
          }
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        ...protectedReadResponses,
      },
    },
    post: {
      tags: ['Pegawai (PNS)'],
      summary: 'Tambah data PNS baru (validasi 18 digit NIP)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PegawaiInput' },
          },
        },
      },
      responses: {
        201: jsonResponse(
          '201 Created - Data PNS berhasil ditambahkan',
          successSchema({ $ref: '#/components/schemas/Pegawai' }),
          {
            success: true,
            message: 'Data PNS berhasil ditambahkan.',
            data: {
              id: 7,
              nip: '198605142011011002',
              nama: 'Bambang Pamungkas, S.Kom.',
              jabatan: 'Analis Aset Daerah',
              golongan: 'III/c',
              pangkat: 'Penata',
              noHp: '081299001122',
              email: 'bambang.p@jakarta.go.id',
              perangkatDaerahId: 1,
            },
          }
        ),
        409: { $ref: '#/components/responses/Conflict' },
        ...protectedWriteResponses,
      },
    },
  },

  '/api/pegawai/{id}': {
    get: {
      tags: ['Pegawai (PNS)'],
      summary: 'Detail PNS beserta daftar KDO yang dipertanggungjawabkan',
      parameters: [idPathParam],
      responses: {
        200: jsonResponse(
          '200 OK - Detail PNS',
          successSchema({ $ref: '#/components/schemas/Pegawai' }),
          {
            success: true,
            message: 'Detail PNS berhasil dimuat.',
            data: {
              id: 1,
              nip: '197804122003121004',
              nama: 'Drs. Agus Darmawan, M.Si.',
              jabatan: 'Kepala Bidang Sarana dan Prasarana Pendidikan',
              golongan: 'IV/b',
              kendaraan: [],
            },
          }
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        404: { $ref: '#/components/responses/NotFound' },
        ...protectedReadResponses,
      },
    },
    put: {
      tags: ['Pegawai (PNS)'],
      summary: 'Perbarui data PNS',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PegawaiInput' },
          },
        },
      },
      responses: {
        200: jsonResponse(
          '200 OK - Data PNS diperbarui',
          successSchema({ $ref: '#/components/schemas/Pegawai' }),
          {
            success: true,
            message: 'Data PNS berhasil diperbarui.',
            data: {
              id: 1,
              nip: '197804122003121004',
              nama: 'Drs. Agus Darmawan, M.Si.',
            },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        409: { $ref: '#/components/responses/Conflict' },
        ...protectedWriteResponses,
      },
    },
    delete: {
      tags: ['Pegawai (PNS)'],
      summary:
        'Hapus PNS (otomatis melepas penanggung jawab KDO ke Pool SKPD + catat riwayat)',
      parameters: [idPathParam],
      responses: {
        200: jsonResponse(
          '200 OK - Data PNS berhasil dihapus',
          successSchema({
            type: 'object',
            properties: { id: { type: 'integer' } },
          }),
          {
            success: true,
            message:
              'Data PNS berhasil dihapus dan kendaraan terkait dikembalikan ke Pool Perangkat Daerah.',
            data: { id: 7 },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        ...protectedWriteResponses,
      },
    },
  },
}
