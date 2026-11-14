export const openApiComponents = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description:
        'Masukkan token JWT hasil dari endpoint POST /api/auth/login. Contoh akun uji coba: admin.bpad / admin123',
    },
  },
  schemas: {
    ErrorEnvelope: {
      type: 'object',
      required: ['success', 'message', 'error'],
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validasi input gagal.' },
        error: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            details: {
              nullable: true,
              example: [
                { field: 'nomorPolisi', message: 'Nomor polisi wajib diisi.' },
              ],
            },
          },
        },
      },
    },
    LoginRequest: {
      type: 'object',
      required: ['identifier', 'password'],
      properties: {
        identifier: {
          type: 'string',
          description: 'Username atau email kedinasan',
          example: 'admin.bpad',
        },
        password: {
          type: 'string',
          format: 'password',
          example: 'admin123',
        },
      },
    },
    AuthSessionUser: {
      type: 'object',
      properties: {
        userId: { type: 'integer', example: 1 },
        username: { type: 'string', example: 'admin.bpad' },
        nama: { type: 'string', example: 'Administrator Pengelola BMD' },
        email: { type: 'string', example: 'admin@bpad.jakarta.go.id' },
        role: {
          type: 'string',
          description: 'Kode role aktif dari master RoleDefinition',
          example: 'ADMIN_BPAD',
        },
        roleName: {
          type: 'string',
          example: 'Admin BPAD',
        },
        permissions: {
          type: 'object',
          description: 'Matriks izin CRUD per halaman untuk role pengguna',
        },
        perangkatDaerahId: { type: 'integer', nullable: true, example: null },
        loggedInAt: {
          type: 'string',
          format: 'date-time',
          example: '2026-11-14T05:00:00.000Z',
        },
      },
    },
    VehiclePhoto: {
      type: 'object',
      required: ['id', 'name', 'dataUrl'],
      properties: {
        id: { type: 'string', example: '1731560000-abc123' },
        name: { type: 'string', example: 'innova-depan.webp' },
        dataUrl: {
          type: 'string',
          example: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4...',
        },
      },
    },
    VehicleDocument: {
      type: 'object',
      required: ['fileName', 'mimeType', 'dataUrl', 'uploadedAt'],
      properties: {
        fileName: { type: 'string', example: 'stnk-b1042pqa.pdf' },
        mimeType: { type: 'string', example: 'application/pdf' },
        dataUrl: {
          type: 'string',
          example: 'data:application/pdf;base64,JVBERi0xLjQK...',
        },
        uploadedAt: {
          type: 'string',
          format: 'date-time',
          example: '2026-11-14T05:00:00.000Z',
        },
      },
    },
    PerangkatDaerahInput: {
      type: 'object',
      required: ['kodeSkpd', 'nama', 'singkatan'],
      properties: {
        kodeSkpd: { type: 'string', example: '1.04.01.01' },
        nama: { type: 'string', example: 'Dinas Perhubungan' },
        singkatan: { type: 'string', example: 'DISHUB' },
        kepalaDinas: {
          type: 'string',
          example: 'Dr. Syafrin Liputo, M.T.',
        },
        alamat: {
          type: 'string',
          example: 'Jl. Taman Jatibaru No. 1, Jakarta Pusat',
        },
        telepon: { type: 'string', example: '(021) 3501349' },
      },
    },
    PerangkatDaerah: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        kodeSkpd: { type: 'string', example: '1.01.01.01' },
        nama: { type: 'string', example: 'Dinas Pendidikan' },
        singkatan: { type: 'string', example: 'DISDIK' },
        kepalaDinas: { type: 'string', example: 'Dr. H. Budi Santoso, M.Pd.' },
        alamat: {
          type: 'string',
          example: 'Jl. Jenderal Gatot Subroto Kav. 40-41, Jakarta Selatan',
        },
        telepon: { type: 'string', example: '(021) 39504027' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    PegawaiInput: {
      type: 'object',
      required: ['nip', 'nama', 'jabatan', 'golongan', 'perangkatDaerahId'],
      properties: {
        nip: {
          type: 'string',
          description: '18 digit NIP PNS',
          example: '198605142011011002',
        },
        nama: { type: 'string', example: 'Bambang Pamungkas, S.Kom.' },
        jabatan: { type: 'string', example: 'Analis Aset Daerah' },
        golongan: { type: 'string', example: 'III/c' },
        pangkat: { type: 'string', example: 'Penata' },
        noHp: { type: 'string', example: '081299001122' },
        email: {
          type: 'string',
          format: 'email',
          example: 'bambang.p@jakarta.go.id',
        },
        perangkatDaerahId: { type: 'integer', example: 1 },
      },
    },
    Pegawai: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        nip: { type: 'string', example: '197804122003121004' },
        nama: { type: 'string', example: 'Drs. Agus Darmawan, M.Si.' },
        jabatan: {
          type: 'string',
          example: 'Kepala Bidang Sarana dan Prasarana Pendidikan',
        },
        golongan: { type: 'string', example: 'IV/b' },
        pangkat: { type: 'string', example: 'Pembina Tingkat I' },
        noHp: { type: 'string', example: '081288901122' },
        email: { type: 'string', example: 'agus.darmawan@jakarta.go.id' },
        perangkatDaerahId: { type: 'integer', example: 1 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    KendaraanInput: {
      type: 'object',
      required: [
        'nomorPolisi',
        'merek',
        'tipeModel',
        'jenis',
        'tahunProduksi',
        'warna',
        'kondisi',
        'perangkatDaerahId',
      ],
      properties: {
        nomorPolisi: { type: 'string', example: 'B 1502 PQR' },
        kodeBarang: { type: 'string', example: '1.3.2.02.01.02.003-0015' },
        merek: { type: 'string', example: 'Toyota' },
        tipeModel: { type: 'string', example: 'Veloz 1.5 Q CVT' },
        jenis: {
          type: 'string',
          enum: ['RODA_4', 'RODA_2', 'KHUSUS'],
          example: 'RODA_4',
        },
        tahunProduksi: { type: 'integer', example: 2024 },
        warna: { type: 'string', example: 'Hitam' },
        nomorRangka: { type: 'string', example: 'MHKAA1BA0RJ001122' },
        nomorMesin: { type: 'string', example: '2NR-VE998811' },
        kondisi: {
          type: 'string',
          enum: ['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT'],
          example: 'BAIK',
        },
        lokasiParkir: {
          type: 'string',
          example: 'Basement Gedung Dinas Pendidikan',
        },
        keterangan: {
          type: 'string',
          example: 'Unit operasional pengawasan sekolah.',
        },
        fotos: {
          type: 'array',
          maxItems: 6,
          items: { $ref: '#/components/schemas/VehiclePhoto' },
          example: [],
        },
        dokumenStnk: {
          allOf: [{ $ref: '#/components/schemas/VehicleDocument' }],
          nullable: true,
          example: null,
        },
        dokumenBpkb: {
          allOf: [{ $ref: '#/components/schemas/VehicleDocument' }],
          nullable: true,
          example: null,
        },
        pajakTahunanJatuhTempo: {
          type: 'string',
          nullable: true,
          example: '2027-08-20',
        },
        pajakLimaTahunanJatuhTempo: {
          type: 'string',
          nullable: true,
          example: '2030-08-20',
        },
        perangkatDaerahId: { type: 'integer', example: 1 },
        pegawaiId: { type: 'integer', nullable: true, example: 1 },
        nomorBast: { type: 'string', example: 'BAST/DISDIK/099/2026' },
        catatanPerubahan: {
          type: 'string',
          example: 'Serah terima kendaraan operasional baru.',
        },
      },
    },
    KendaraanDinas: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        nomorPolisi: { type: 'string', example: 'B 1042 PQA' },
        kodeBarang: { type: 'string', example: '1.3.2.02.01.02.003-0001' },
        merek: { type: 'string', example: 'Toyota' },
        tipeModel: { type: 'string', example: 'Kijang Innova Zenix 2.0 G' },
        jenis: { type: 'string', enum: ['RODA_4', 'RODA_2', 'KHUSUS'] },
        tahunProduksi: { type: 'integer', example: 2024 },
        warna: { type: 'string', example: 'Hitam Metalik' },
        nomorRangka: { type: 'string', example: 'MHFAB1EM5R0012345' },
        nomorMesin: { type: 'string', example: 'M20A-1988421' },
        kondisi: {
          type: 'string',
          enum: ['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT'],
        },
        lokasiParkir: {
          type: 'string',
          example: 'Basement Gedung Dinas Pendidikan, Gatot Subroto',
        },
        keterangan: { type: 'string' },
        fotos: {
          type: 'array',
          items: { $ref: '#/components/schemas/VehiclePhoto' },
        },
        dokumenStnk: {
          allOf: [{ $ref: '#/components/schemas/VehicleDocument' }],
          nullable: true,
        },
        dokumenBpkb: {
          allOf: [{ $ref: '#/components/schemas/VehicleDocument' }],
          nullable: true,
        },
        pajakTahunanJatuhTempo: { type: 'string', nullable: true },
        pajakLimaTahunanJatuhTempo: { type: 'string', nullable: true },
        perangkatDaerahId: { type: 'integer', example: 1 },
        pegawaiId: { type: 'integer', nullable: true, example: 1 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    RiwayatKendaraan: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        kendaraanId: { type: 'integer', example: 1 },
        pegawaiId: { type: 'integer', nullable: true, example: 1 },
        pegawaiNamaSnapshot: {
          type: 'string',
          nullable: true,
          example: 'Drs. Agus Darmawan, M.Si.',
        },
        perangkatDaerahId: { type: 'integer', example: 1 },
        perangkatDaerahNamaSnapshot: {
          type: 'string',
          example: 'Dinas Pendidikan',
        },
        jenisPerubahan: {
          type: 'string',
          enum: ['PENDAFTARAN', 'PENUGASAN', 'KONDISI', 'MUTASI_SKPD'],
          example: 'PENDAFTARAN',
        },
        kondisiSaatItu: {
          type: 'string',
          enum: ['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT'],
          example: 'BAIK',
        },
        nomorBast: { type: 'string', example: 'BAST/DISDIK/012/2026' },
        catatan: { type: 'string' },
        tanggal: { type: 'string', format: 'date-time' },
      },
    },
    ServisInput: {
      type: 'object',
      required: [
        'kendaraanId',
        'tanggalServis',
        'jenisServis',
        'status',
        'bengkel',
        'biaya',
        'deskripsi',
      ],
      properties: {
        kendaraanId: { type: 'integer', example: 1 },
        tanggalServis: { type: 'string', example: '2026-11-14' },
        jenisServis: {
          type: 'string',
          enum: [
            'SERVIS_RUTIN',
            'PERBAIKAN',
            'GANTI_BAN_AKI',
            'UJI_KIR',
            'LAINNYA',
          ],
          example: 'SERVIS_RUTIN',
        },
        status: {
          type: 'string',
          enum: ['TERJADWAL', 'DALAM_PERBAIKAN', 'SELESAI'],
          example: 'SELESAI',
        },
        bengkel: { type: 'string', example: 'Auto2000 Gatot Subroto' },
        kilometer: { type: 'integer', nullable: true, example: 22500 },
        biaya: { type: 'integer', example: 1450000 },
        servisBerikutnyaTanggal: {
          type: 'string',
          nullable: true,
          example: '2027-05-14',
        },
        deskripsi: {
          type: 'string',
          example: 'Ganti oli mesin, filter AC, dan pengecekan rem.',
        },
        buktiNota: {
          allOf: [{ $ref: '#/components/schemas/VehicleDocument' }],
          nullable: true,
          example: null,
        },
      },
    },
    ServisKendaraan: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        kendaraanId: { type: 'integer', example: 1 },
        tanggalServis: { type: 'string', example: '2026-09-18' },
        jenisServis: {
          type: 'string',
          enum: [
            'SERVIS_RUTIN',
            'PERBAIKAN',
            'GANTI_BAN_AKI',
            'UJI_KIR',
            'LAINNYA',
          ],
        },
        status: {
          type: 'string',
          enum: ['TERJADWAL', 'DALAM_PERBAIKAN', 'SELESAI'],
        },
        bengkel: { type: 'string', example: 'Auto2000 Gatot Subroto' },
        kilometer: { type: 'integer', nullable: true, example: 18450 },
        biaya: { type: 'integer', example: 1850000 },
        servisBerikutnyaTanggal: {
          type: 'string',
          nullable: true,
          example: '2027-03-18',
        },
        deskripsi: { type: 'string' },
        buktiNota: {
          allOf: [{ $ref: '#/components/schemas/VehicleDocument' }],
          nullable: true,
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    AppUserCreateInput: {
      type: 'object',
      required: ['username', 'nama', 'email', 'password', 'role'],
      properties: {
        username: { type: 'string', example: 'operator.dinkes' },
        nama: { type: 'string', example: 'Operator Pengurus Barang Dinkes' },
        email: {
          type: 'string',
          format: 'email',
          example: 'operator.dinkes@jakarta.go.id',
        },
        password: { type: 'string', minLength: 6, example: 'rahasia123' },
        role: {
          type: 'string',
          description: 'Kode role dari master RoleDefinition',
          example: 'OPERATOR_SKPD',
        },
        perangkatDaerahId: { type: 'integer', nullable: true, example: 2 },
        aktif: { type: 'boolean', example: true },
      },
    },
    AppUserUpdateInput: {
      type: 'object',
      required: ['username', 'nama', 'email', 'role'],
      properties: {
        username: { type: 'string', example: 'operator.disdik' },
        nama: { type: 'string', example: 'Operator Pengurus Barang Disdik' },
        email: {
          type: 'string',
          format: 'email',
          example: 'operator.disdik@jakarta.go.id',
        },
        password: {
          type: 'string',
          description: 'Opsional saat update; isi jika ingin mengganti kata sandi',
          example: '',
        },
        role: {
          type: 'string',
          description: 'Kode role dari master RoleDefinition',
          example: 'OPERATOR_SKPD',
        },
        perangkatDaerahId: { type: 'integer', nullable: true, example: 1 },
        aktif: { type: 'boolean', example: true },
      },
    },
    AppUserResponse: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        username: { type: 'string', example: 'admin.bpad' },
        nama: { type: 'string', example: 'Administrator Pengelola BMD' },
        email: { type: 'string', example: 'admin@bpad.jakarta.go.id' },
        role: {
          type: 'string',
          example: 'ADMIN_BPAD',
        },
        perangkatDaerahId: { type: 'integer', nullable: true, example: null },
        aktif: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    CrudPermission: {
      type: 'object',
      properties: {
        read: { type: 'boolean', example: true },
        create: { type: 'boolean', example: false },
        update: { type: 'boolean', example: false },
        delete: { type: 'boolean', example: false },
      },
    },
    RoleInput: {
      type: 'object',
      required: ['code', 'name'],
      properties: {
        code: { type: 'string', example: 'STAF_ARMADA' },
        name: { type: 'string', example: 'Staf Armada Lapangan' },
        description: {
          type: 'string',
          example: 'Mengelola peminjaman dan jadwal servis unit KDO.',
        },
        permissions: {
          type: 'object',
          additionalProperties: { $ref: '#/components/schemas/CrudPermission' },
        },
      },
    },
    RoleDefinitionResponse: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        code: { type: 'string', example: 'ADMIN_BPAD' },
        name: { type: 'string', example: 'Admin BPAD' },
        description: { type: 'string' },
        isSystem: { type: 'boolean', example: true },
        permissions: {
          type: 'object',
          additionalProperties: { $ref: '#/components/schemas/CrudPermission' },
        },
        userCount: { type: 'integer', example: 1 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    PeminjamanInput: {
      type: 'object',
      required: [
        'kendaraanId',
        'peminjamNama',
        'tujuanKeperluan',
        'tanggalPinjam',
        'tanggalKembaliRencana',
        'status',
      ],
      properties: {
        kendaraanId: { type: 'integer', example: 1 },
        peminjamPegawaiId: { type: 'integer', nullable: true, example: 1 },
        peminjamNama: { type: 'string', example: 'Drs. Agus Darmawan, M.Si.' },
        peminjamInstansi: { type: 'string', example: 'Dinas Pendidikan' },
        tujuanKeperluan: {
          type: 'string',
          example: 'Monitoring progres rehabilitasi sekolah',
        },
        lokasiTujuan: { type: 'string', example: 'Jakarta Timur' },
        tanggalPinjam: { type: 'string', example: '2026-11-25' },
        tanggalKembaliRencana: { type: 'string', example: '2026-11-26' },
        tanggalKembaliAktual: {
          type: 'string',
          nullable: true,
          example: null,
        },
        status: {
          type: 'string',
          enum: ['DIPINJAM', 'TERJADWAL', 'SELESAI', 'DIBATALKAN'],
          example: 'TERJADWAL',
        },
        nomorSuratTugas: { type: 'string', example: 'ST/DISDIK/301/XI/2026' },
        kilometerAwal: { type: 'integer', nullable: true, example: 18750 },
        kilometerAkhir: { type: 'integer', nullable: true, example: null },
        kondisiSaatKembali: {
          type: 'string',
          enum: ['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT'],
          nullable: true,
          example: null,
        },
        catatan: { type: 'string', example: '' },
      },
    },
    PeminjamanCompleteInput: {
      type: 'object',
      required: ['tanggalKembaliAktual', 'kondisiSaatKembali'],
      properties: {
        tanggalKembaliAktual: { type: 'string', example: '2026-11-26' },
        kilometerAkhir: { type: 'integer', nullable: true, example: 18820 },
        kondisiSaatKembali: {
          type: 'string',
          enum: ['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT'],
          example: 'BAIK',
        },
        catatan: {
          type: 'string',
          example: 'Dikembalikan tepat waktu dalam kondisi baik.',
        },
      },
    },
    PeminjamanKendaraan: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        kendaraanId: { type: 'integer', example: 2 },
        peminjamPegawaiId: { type: 'integer', nullable: true, example: 2 },
        peminjamNama: { type: 'string' },
        peminjamInstansi: { type: 'string' },
        tujuanKeperluan: { type: 'string' },
        lokasiTujuan: { type: 'string' },
        tanggalPinjam: { type: 'string' },
        tanggalKembaliRencana: { type: 'string' },
        tanggalKembaliAktual: { type: 'string', nullable: true },
        status: {
          type: 'string',
          enum: ['DIPINJAM', 'TERJADWAL', 'SELESAI', 'DIBATALKAN'],
        },
        nomorSuratTugas: { type: 'string' },
        kilometerAwal: { type: 'integer', nullable: true },
        kilometerAkhir: { type: 'integer', nullable: true },
        kondisiSaatKembali: { type: 'string', nullable: true },
        catatan: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  },
  responses: {
    BadRequest: {
      description: '400 Bad Request - Validasi input / parameter gagal',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorEnvelope' },
          example: {
            success: false,
            message: 'Validasi input gagal.',
            error: {
              code: 'VALIDATION_ERROR',
              details: [
                {
                  field: 'nip',
                  message: 'NIP PNS harus terdiri dari tepat 18 digit angka.',
                },
              ],
            },
          },
        },
      },
    },
    Unauthorized: {
      description: '401 Unauthorized - Token JWT tidak ada, tidak valid, atau kedaluwarsa',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorEnvelope' },
          example: {
            success: false,
            message: 'Header Authorization Bearer token wajib disertakan.',
            error: { code: 'UNAUTHORIZED' },
          },
        },
      },
    },
    Forbidden: {
      description: '403 Forbidden - Role pengguna tidak memiliki izin operasi ini',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorEnvelope' },
          example: {
            success: false,
            message:
              'Akses ditolak. Peran "VIEWER" tidak diizinkan untuk operasi ini.',
            error: { code: 'FORBIDDEN' },
          },
        },
      },
    },
    NotFound: {
      description: '404 Not Found - Resource dengan ID yang diminta tidak ditemukan',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorEnvelope' },
          example: {
            success: false,
            message: 'Data tidak ditemukan.',
            error: { code: 'NOT_FOUND' },
          },
        },
      },
    },
    Conflict: {
      description: '409 Conflict - Data duplikat atau melanggar integritas relasi',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorEnvelope' },
          example: {
            success: false,
            message: 'Data duplikat atau masih memiliki relasi aktif.',
            error: { code: 'CONFLICT' },
          },
        },
      },
    },
    InternalServerError: {
      description: '500 Internal Server Error - Kesalahan tak terduga pada server',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorEnvelope' },
          example: {
            success: false,
            message: 'Terjadi kesalahan internal pada server.',
            error: { code: 'INTERNAL_SERVER_ERROR' },
          },
        },
      },
    },
  },
}
