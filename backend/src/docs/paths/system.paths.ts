import {
  jsonResponse,
  protectedReadResponses,
  successSchema,
} from '../helpers'

export const systemPaths = {
  '/api/health': {
    get: {
      tags: ['Health'],
      summary: 'Cek status server API & koneksi database',
      security: [],
      responses: {
        200: jsonResponse(
          '200 OK - Server dan database berjalan normal',
          successSchema({
            type: 'object',
            properties: {
              status: { type: 'string' },
              service: { type: 'string' },
              database: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          }),
          {
            success: true,
            message: 'Server REST API SI-KDO BMD berjalan normal.',
            data: {
              status: 'UP',
              service: 'si-kdo-bmd-api',
              database: 'connected',
              timestamp: '2026-11-14T05:00:00.000Z',
            },
          }
        ),
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  '/api/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login pengguna untuk mendapatkan JWT Bearer Token',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
            example: {
              identifier: 'admin.bpad',
              password: 'admin123',
            },
          },
        },
      },
      responses: {
        200: jsonResponse(
          '200 OK - Login berhasil, mengembalikan JWT dan profil sesi',
          successSchema({
            type: 'object',
            properties: {
              token: { type: 'string' },
              tokenType: { type: 'string' },
              user: { $ref: '#/components/schemas/AuthSessionUser' },
            },
          }),
          {
            success: true,
            message: 'Login berhasil.',
            data: {
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              tokenType: 'Bearer',
              user: {
                userId: 1,
                username: 'admin.bpad',
                nama: 'Administrator Pengelola BMD',
                email: 'admin@bpad.jakarta.go.id',
                role: 'ADMIN_BPAD',
                perangkatDaerahId: null,
                loggedInAt: '2026-11-14T05:00:00.000Z',
              },
            },
          }
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        401: jsonResponse(
          '401 Unauthorized - Username/email atau kata sandi salah',
          { $ref: '#/components/schemas/ErrorEnvelope' },
          {
            success: false,
            message: 'Username/Email atau kata sandi tidak sesuai.',
            error: { code: 'UNAUTHORIZED' },
          }
        ),
        403: jsonResponse(
          '403 Forbidden - Akun pengguna sedang dinonaktifkan',
          { $ref: '#/components/schemas/ErrorEnvelope' },
          {
            success: false,
            message:
              'Akun Anda sedang dinonaktifkan. Hubungi Admin BPAD untuk aktivasi kembali.',
            error: { code: 'FORBIDDEN' },
          }
        ),
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  '/api/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Ambil profil sesi pengguna yang sedang login',
      responses: {
        200: jsonResponse(
          '200 OK - Profil sesi pengguna',
          successSchema({ $ref: '#/components/schemas/AuthSessionUser' }),
          {
            success: true,
            message: 'Profil sesi pengguna berhasil dimuat.',
            data: {
              userId: 1,
              username: 'admin.bpad',
              nama: 'Administrator Pengelola BMD',
              email: 'admin@bpad.jakarta.go.id',
              role: 'ADMIN_BPAD',
              perangkatDaerahId: null,
              aktif: true,
              perangkatDaerah: null,
            },
          }
        ),
        401: { $ref: '#/components/responses/Unauthorized' },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  '/api/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Logout sesi pengguna',
      responses: {
        200: jsonResponse(
          '200 OK - Logout berhasil',
          successSchema({
            type: 'object',
            properties: { loggedOut: { type: 'boolean' } },
          }),
          {
            success: true,
            message: 'Logout berhasil. Hapus token Bearer di sisi klien.',
            data: { loggedOut: true },
          }
        ),
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },

  '/api/dashboard': {
    get: {
      tags: ['Dashboard'],
      summary: 'Ambil statistik ringkasan BMD, pengingat pajak, dan riwayat terbaru',
      parameters: [
        {
          name: 'perangkatDaerahId',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1 },
          description: 'Opsional: saring statistik untuk 1 Perangkat Daerah tertentu',
          example: 1,
        },
      ],
      responses: {
        200: jsonResponse(
          '200 OK - Statistik dashboard BMD',
          successSchema({ type: 'object' }),
          {
            success: true,
            message: 'Ringkasan dashboard BMD berhasil dimuat.',
            data: {
              totalKendaraan: 8,
              totalBaik: 5,
              totalRusakRingan: 2,
              totalRusakBerat: 1,
              totalBerpenanggungJawab: 6,
              totalPoolDinas: 2,
              totalPegawai: 6,
              totalPerangkatDaerah: 3,
              totalRoda4: 3,
              totalRoda2: 2,
              totalKhusus: 3,
              pajakPerluPerhatian: 4,
              totalServisAktif: 2,
              totalSedangDipinjam: 1,
              totalBiayaServis: 6480000,
              daftarPengingatPajak: [],
              perPerangkatDaerah: [],
              riwayatTerbaru: [],
            },
          }
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        ...protectedReadResponses,
      },
    },
  },
}
