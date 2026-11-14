import {
  idPathParam,
  jsonResponse,
  protectedReadResponses,
  protectedWriteResponses,
  successSchema,
} from '../helpers'

export const fleetPaths = {
  '/api/kendaraan': {
    get: {
      tags: ['Kendaraan Dinas (KDO)'],
      summary: 'Daftar Kendaraan Dinas Operasional (KDO)',
      parameters: [
        {
          name: 'kondisi',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT'],
          },
        },
        {
          name: 'jenis',
          in: 'query',
          schema: { type: 'string', enum: ['RODA_4', 'RODA_2', 'KHUSUS'] },
        },
        { name: 'perangkatDaerahId', in: 'query', schema: { type: 'integer' } },
        { name: 'pegawaiId', in: 'query', schema: { type: 'integer' } },
        {
          name: 'penugasan',
          in: 'query',
          schema: { type: 'string', enum: ['ASSIGNED', 'POOL'] },
          description: 'ASSIGNED (berpenanggung jawab) atau POOL (belum ada PJ)',
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Cari nomor polisi, merek, tipe/model, atau kode barang',
        },
      ],
      responses: {
        200: jsonResponse(
          '200 OK - Daftar KDO',
          successSchema(
            {
              type: 'array',
              items: { $ref: '#/components/schemas/KendaraanDinas' },
            },
            true
          ),
          {
            success: true,
            message: 'Daftar Kendaraan Dinas Operasional (KDO) berhasil dimuat.',
            data: [
              {
                id: 1,
                nomorPolisi: 'B 1042 PQA',
                kodeBarang: '1.3.2.02.01.02.003-0001',
                merek: 'Toyota',
                tipeModel: 'Kijang Innova Zenix 2.0 G',
                jenis: 'RODA_4',
                tahunProduksi: 2024,
                warna: 'Hitam Metalik',
                kondisi: 'BAIK',
                lokasiParkir: 'Basement Gedung Dinas Pendidikan, Gatot Subroto',
                fotos: [],
                dokumenStnk: null,
                dokumenBpkb: null,
                pajakTahunanJatuhTempo: '2027-06-15',
                pajakLimaTahunanJatuhTempo: '2029-06-15',
                perangkatDaerahId: 1,
                pegawaiId: 1,
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
      tags: ['Kendaraan Dinas (KDO)'],
      summary: 'Tambah KDO baru (+ otomatis buat entri RiwayatKendaraan PENDAFTARAN)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/KendaraanInput' },
          },
        },
      },
      responses: {
        201: jsonResponse(
          '201 Created - Kendaraan dinas berhasil ditambahkan',
          successSchema({ $ref: '#/components/schemas/KendaraanDinas' }),
          {
            success: true,
            message: 'Kendaraan dinas operasional berhasil ditambahkan.',
            data: {
              id: 9,
              nomorPolisi: 'B 1502 PQR',
              merek: 'Toyota',
              tipeModel: 'Veloz 1.5 Q CVT',
              jenis: 'RODA_4',
              tahunProduksi: 2024,
              kondisi: 'BAIK',
              perangkatDaerahId: 1,
              pegawaiId: 1,
            },
          }
        ),
        409: { $ref: '#/components/responses/Conflict' },
        ...protectedWriteResponses,
      },
    },
  },

  '/api/kendaraan/{id}': {
    get: {
      tags: ['Kendaraan Dinas (KDO)'],
      summary: 'Detail KDO beserta relasi SKPD, PNS, Riwayat, dan Servis',
      parameters: [idPathParam],
      responses: {
        200: jsonResponse(
          '200 OK - Detail KDO lengkap',
          successSchema({ $ref: '#/components/schemas/KendaraanDinas' }),
          {
            success: true,
            message: 'Detail Kendaraan Dinas Operasional (KDO) berhasil dimuat.',
            data: {
              id: 1,
              nomorPolisi: 'B 1042 PQA',
              merek: 'Toyota',
              tipeModel: 'Kijang Innova Zenix 2.0 G',
              kondisi: 'BAIK',
              riwayat: [],
              servis: [],
            },
          }
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        404: { $ref: '#/components/responses/NotFound' },
        ...protectedReadResponses,
      },
    },
    put: {
      tags: ['Kendaraan Dinas (KDO)'],
      summary:
        'Perbarui KDO (+ otomatis catat RiwayatKendaraan jika SKPD/PJ/Kondisi berubah)',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/KendaraanInput' },
          },
        },
      },
      responses: {
        200: jsonResponse(
          '200 OK - Data KDO berhasil diperbarui',
          successSchema({ $ref: '#/components/schemas/KendaraanDinas' }),
          {
            success: true,
            message: 'Data kendaraan dinas berhasil diperbarui.',
            data: {
              id: 1,
              nomorPolisi: 'B 1042 PQA',
              kondisi: 'BAIK',
            },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        409: { $ref: '#/components/responses/Conflict' },
        ...protectedWriteResponses,
      },
    },
    delete: {
      tags: ['Kendaraan Dinas (KDO)'],
      summary: 'Hapus data KDO beserta riwayat dan servisnya',
      parameters: [idPathParam],
      responses: {
        200: jsonResponse(
          '200 OK - Data KDO berhasil dihapus',
          successSchema({
            type: 'object',
            properties: { id: { type: 'integer' } },
          }),
          {
            success: true,
            message: 'Data kendaraan dinas berhasil dihapus.',
            data: { id: 9 },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        ...protectedWriteResponses,
      },
    },
  },

  '/api/kendaraan/{id}/riwayat': {
    get: {
      tags: ['Kendaraan Dinas (KDO)'],
      summary: 'Daftar log riwayat penugasan, mutasi SKPD & kondisi sebuah KDO',
      parameters: [idPathParam],
      responses: {
        200: jsonResponse(
          '200 OK - Log riwayat KDO',
          successSchema(
            {
              type: 'array',
              items: { $ref: '#/components/schemas/RiwayatKendaraan' },
            },
            true
          ),
          {
            success: true,
            message: 'Riwayat perubahan kendaraan dinas berhasil dimuat.',
            data: [
              {
                id: 1,
                kendaraanId: 1,
                pegawaiId: 1,
                pegawaiNamaSnapshot: 'Drs. Agus Darmawan, M.Si.',
                perangkatDaerahId: 1,
                perangkatDaerahNamaSnapshot: 'Dinas Pendidikan',
                jenisPerubahan: 'PENDAFTARAN',
                kondisiSaatItu: 'BAIK',
                nomorBast: 'BAST/DISDIK/012/2026',
                catatan:
                  'Pencatatan awal KDO dan serah terima pemakaian ke Kabid Sarpras.',
                tanggal: '2026-01-15T10:00:00.000Z',
              },
            ],
            meta: { total: 1 },
          }
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        404: { $ref: '#/components/responses/NotFound' },
        ...protectedReadResponses,
      },
    },
  },

  '/api/servis': {
    get: {
      tags: ['Servis & Pemeliharaan'],
      summary: 'Daftar catatan servis, perbaikan, ban/aki, dan uji KIR',
      parameters: [
        { name: 'kendaraanId', in: 'query', schema: { type: 'integer' } },
        { name: 'perangkatDaerahId', in: 'query', schema: { type: 'integer' } },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['TERJADWAL', 'DALAM_PERBAIKAN', 'SELESAI'],
          },
        },
        {
          name: 'jenisServis',
          in: 'query',
          schema: {
            type: 'string',
            enum: [
              'SERVIS_RUTIN',
              'PERBAIKAN',
              'GANTI_BAN_AKI',
              'UJI_KIR',
              'LAINNYA',
            ],
          },
        },
        { name: 'search', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        200: jsonResponse(
          '200 OK - Daftar catatan servis',
          successSchema(
            {
              type: 'array',
              items: { $ref: '#/components/schemas/ServisKendaraan' },
            },
            true
          ),
          {
            success: true,
            message: 'Daftar catatan servis & pemeliharaan berhasil dimuat.',
            data: [
              {
                id: 1,
                kendaraanId: 1,
                tanggalServis: '2026-09-18',
                jenisServis: 'SERVIS_RUTIN',
                status: 'SELESAI',
                bengkel: 'Auto2000 Gatot Subroto',
                kilometer: 18450,
                biaya: 1850000,
                servisBerikutnyaTanggal: '2027-03-18',
                deskripsi:
                  'Servis berkala 20.000 km: ganti oli mesin, filter oli, balancing & spooring.',
                buktiNota: null,
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
      tags: ['Servis & Pemeliharaan'],
      summary: 'Tambah catatan servis / pemeliharaan KDO baru',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ServisInput' },
          },
        },
      },
      responses: {
        201: jsonResponse(
          '201 Created - Catatan servis berhasil ditambahkan',
          successSchema({ $ref: '#/components/schemas/ServisKendaraan' }),
          {
            success: true,
            message: 'Catatan servis & pemeliharaan berhasil ditambahkan.',
            data: {
              id: 5,
              kendaraanId: 1,
              tanggalServis: '2026-11-14',
              jenisServis: 'SERVIS_RUTIN',
              status: 'SELESAI',
              bengkel: 'Auto2000 Gatot Subroto',
              kilometer: 22500,
              biaya: 1450000,
            },
          }
        ),
        ...protectedWriteResponses,
      },
    },
  },

  '/api/servis/{id}': {
    get: {
      tags: ['Servis & Pemeliharaan'],
      summary: 'Detail catatan servis kendaraan',
      parameters: [idPathParam],
      responses: {
        200: jsonResponse(
          '200 OK - Detail catatan servis',
          successSchema({ $ref: '#/components/schemas/ServisKendaraan' }),
          {
            success: true,
            message: 'Detail catatan servis berhasil dimuat.',
            data: {
              id: 1,
              kendaraanId: 1,
              tanggalServis: '2026-09-18',
              jenisServis: 'SERVIS_RUTIN',
              status: 'SELESAI',
              bengkel: 'Auto2000 Gatot Subroto',
              biaya: 1850000,
            },
          }
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        404: { $ref: '#/components/responses/NotFound' },
        ...protectedReadResponses,
      },
    },
    put: {
      tags: ['Servis & Pemeliharaan'],
      summary: 'Perbarui catatan servis kendaraan',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ServisInput' },
          },
        },
      },
      responses: {
        200: jsonResponse(
          '200 OK - Catatan servis diperbarui',
          successSchema({ $ref: '#/components/schemas/ServisKendaraan' }),
          {
            success: true,
            message: 'Data catatan servis berhasil diperbarui.',
            data: {
              id: 1,
              status: 'SELESAI',
              biaya: 1850000,
            },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        ...protectedWriteResponses,
      },
    },
    delete: {
      tags: ['Servis & Pemeliharaan'],
      summary: 'Hapus catatan servis kendaraan',
      parameters: [idPathParam],
      responses: {
        200: jsonResponse(
          '200 OK - Catatan servis dihapus',
          successSchema({
            type: 'object',
            properties: { id: { type: 'integer' } },
          }),
          {
            success: true,
            message: 'Data catatan servis berhasil dihapus.',
            data: { id: 5 },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        ...protectedWriteResponses,
      },
    },
  },

  '/api/peminjaman': {
    get: {
      tags: ['Monitoring & Peminjaman'],
      summary: 'Daftar peminjaman & jadwal penggunaan KDO',
      parameters: [
        { name: 'kendaraanId', in: 'query', schema: { type: 'integer' } },
        { name: 'perangkatDaerahId', in: 'query', schema: { type: 'integer' } },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['DIPINJAM', 'TERJADWAL', 'SELESAI', 'DIBATALKAN'],
          },
        },
        { name: 'search', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        200: jsonResponse(
          '200 OK - Daftar peminjaman kendaraan',
          successSchema(
            {
              type: 'array',
              items: { $ref: '#/components/schemas/PeminjamanKendaraan' },
            },
            true
          ),
          {
            success: true,
            message: 'Daftar peminjaman & monitoring kendaraan berhasil dimuat.',
            data: [],
            meta: { total: 3 },
          }
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        ...protectedReadResponses,
      },
    },
    post: {
      tags: ['Monitoring & Peminjaman'],
      summary: 'Buat peminjaman / booking KDO baru (+ validasi kelayakan & bentrok)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PeminjamanInput' },
          },
        },
      },
      responses: {
        201: jsonResponse(
          '201 Created - Peminjaman berhasil disimpan',
          successSchema({ $ref: '#/components/schemas/PeminjamanKendaraan' }),
          {
            success: true,
            message: 'Jadwal peminjaman kendaraan berhasil disimpan.',
            data: { id: 4, status: 'TERJADWAL' },
          }
        ),
        409: { $ref: '#/components/responses/Conflict' },
        ...protectedWriteResponses,
      },
    },
  },

  '/api/peminjaman/{id}': {
    get: {
      tags: ['Monitoring & Peminjaman'],
      summary: 'Detail peminjaman kendaraan',
      parameters: [idPathParam],
      responses: {
        200: jsonResponse(
          '200 OK - Detail peminjaman',
          successSchema({ $ref: '#/components/schemas/PeminjamanKendaraan' }),
          {
            success: true,
            message: 'Detail peminjaman kendaraan berhasil dimuat.',
            data: { id: 1, status: 'DIPINJAM' },
          }
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        404: { $ref: '#/components/responses/NotFound' },
        ...protectedReadResponses,
      },
    },
    put: {
      tags: ['Monitoring & Peminjaman'],
      summary: 'Perbarui data / jadwal peminjaman kendaraan',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PeminjamanInput' },
          },
        },
      },
      responses: {
        200: jsonResponse(
          '200 OK - Data peminjaman diperbarui',
          successSchema({ $ref: '#/components/schemas/PeminjamanKendaraan' }),
          {
            success: true,
            message: 'Data peminjaman kendaraan berhasil diperbarui.',
            data: { id: 1, status: 'DIPINJAM' },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        409: { $ref: '#/components/responses/Conflict' },
        ...protectedWriteResponses,
      },
    },
    delete: {
      tags: ['Monitoring & Peminjaman'],
      summary: 'Hapus data peminjaman kendaraan',
      parameters: [idPathParam],
      responses: {
        200: jsonResponse(
          '200 OK - Peminjaman dihapus',
          successSchema({
            type: 'object',
            properties: { id: { type: 'integer' } },
          }),
          {
            success: true,
            message: 'Data peminjaman kendaraan berhasil dihapus.',
            data: { id: 4 },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        ...protectedWriteResponses,
      },
    },
  },

  '/api/peminjaman/{id}/complete': {
    post: {
      tags: ['Monitoring & Peminjaman'],
      summary:
        'Catat pengembalian kendaraan (+ sinkronisasi kondisi KDO & riwayat)',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PeminjamanCompleteInput' },
          },
        },
      },
      responses: {
        200: jsonResponse(
          '200 OK - Pengembalian berhasil dicatat',
          successSchema({ $ref: '#/components/schemas/PeminjamanKendaraan' }),
          {
            success: true,
            message:
              'Pengembalian kendaraan berhasil dicatat dan status peminjaman selesai.',
            data: { id: 1, status: 'SELESAI' },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        ...protectedWriteResponses,
      },
    },
  },
}
