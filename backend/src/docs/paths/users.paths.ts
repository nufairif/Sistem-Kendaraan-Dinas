import {
  idPathParam,
  jsonResponse,
  protectedWriteResponses,
  successSchema,
} from '../helpers'

export const usersPaths = {
  '/api/users': {
    get: {
      tags: ['Users & RBAC'],
      summary: 'Daftar akun pengguna sistem (butuh izin users.read)',
      parameters: [
        {
          name: 'role',
          in: 'query',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'aktif',
          in: 'query',
          schema: { type: 'string', enum: ['true', 'false'] },
        },
        { name: 'search', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        200: jsonResponse(
          '200 OK - Daftar pengguna aplikasi',
          successSchema(
            {
              type: 'array',
              items: { $ref: '#/components/schemas/AppUserResponse' },
            },
            true
          ),
          {
            success: true,
            message: 'Daftar pengguna aplikasi berhasil dimuat.',
            data: [
              {
                id: 1,
                username: 'admin.bpad',
                nama: 'Administrator Pengelola BMD',
                email: 'admin@bpad.jakarta.go.id',
                role: 'ADMIN_BPAD',
                perangkatDaerahId: null,
                aktif: true,
              },
            ],
            meta: { total: 1 },
          }
        ),
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
    post: {
      tags: ['Users & RBAC'],
      summary: 'Buat akun pengguna baru (butuh izin users.create)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppUserCreateInput' },
          },
        },
      },
      responses: {
        201: jsonResponse(
          '201 Created - Akun pengguna berhasil dibuat',
          successSchema({ $ref: '#/components/schemas/AppUserResponse' }),
          {
            success: true,
            message: 'Akun pengguna berhasil dibuat.',
            data: {
              id: 4,
              username: 'operator.dinkes',
              nama: 'Operator Pengurus Barang Dinkes',
              email: 'operator.dinkes@jakarta.go.id',
              role: 'OPERATOR_SKPD',
              perangkatDaerahId: 2,
              aktif: true,
            },
          }
        ),
        409: { $ref: '#/components/responses/Conflict' },
        ...protectedWriteResponses,
      },
    },
  },

  '/api/users/{id}': {
    get: {
      tags: ['Users & RBAC'],
      summary: 'Detail akun pengguna (butuh izin users.read)',
      parameters: [idPathParam],
      responses: {
        200: jsonResponse(
          '200 OK - Detail pengguna',
          successSchema({ $ref: '#/components/schemas/AppUserResponse' }),
          {
            success: true,
            message: 'Detail pengguna berhasil dimuat.',
            data: {
              id: 1,
              username: 'admin.bpad',
              nama: 'Administrator Pengelola BMD',
              email: 'admin@bpad.jakarta.go.id',
              role: 'ADMIN_BPAD',
              perangkatDaerahId: null,
              aktif: true,
            },
          }
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
    put: {
      tags: ['Users & RBAC'],
      summary: 'Perbarui akun pengguna (butuh izin users.update)',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppUserUpdateInput' },
          },
        },
      },
      responses: {
        200: jsonResponse(
          '200 OK - Data pengguna diperbarui',
          successSchema({ $ref: '#/components/schemas/AppUserResponse' }),
          {
            success: true,
            message: 'Data pengguna berhasil diperbarui.',
            data: {
              id: 2,
              username: 'operator.disdik',
              role: 'OPERATOR_SKPD',
              aktif: true,
            },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        409: { $ref: '#/components/responses/Conflict' },
        ...protectedWriteResponses,
      },
    },
    delete: {
      tags: ['Users & RBAC'],
      summary: 'Hapus akun pengguna (butuh izin users.delete)',
      parameters: [idPathParam],
      responses: {
        200: jsonResponse(
          '200 OK - Akun pengguna dihapus',
          successSchema({
            type: 'object',
            properties: { id: { type: 'integer' } },
          }),
          {
            success: true,
            message: 'Akun pengguna berhasil dihapus.',
            data: { id: 4 },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        ...protectedWriteResponses,
      },
    },
  },

  '/api/roles': {
    get: {
      tags: ['Roles & Hak Akses'],
      summary: 'Daftar role dinamis dan matriks hak akses CRUD per halaman',
      parameters: [
        { name: 'search', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        200: jsonResponse(
          '200 OK - Daftar role & hak akses',
          successSchema(
            {
              type: 'array',
              items: { $ref: '#/components/schemas/RoleDefinitionResponse' },
            },
            true
          ),
          {
            success: true,
            message: 'Daftar role & hak akses berhasil dimuat.',
            data: [],
            meta: { total: 3 },
          }
        ),
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
    post: {
      tags: ['Roles & Hak Akses'],
      summary: 'Buat role custom baru dengan hak akses per halaman',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RoleInput' },
          },
        },
      },
      responses: {
        201: jsonResponse(
          '201 Created - Role baru berhasil dibuat',
          successSchema({ $ref: '#/components/schemas/RoleDefinitionResponse' }),
          {
            success: true,
            message: 'Role hak akses baru berhasil dibuat.',
            data: { id: 4, code: 'STAF_ARMADA', isSystem: false },
          }
        ),
        409: { $ref: '#/components/responses/Conflict' },
        ...protectedWriteResponses,
      },
    },
  },

  '/api/roles/{id}': {
    get: {
      tags: ['Roles & Hak Akses'],
      summary: 'Detail konfigurasi role & hak akses',
      parameters: [idPathParam],
      responses: {
        200: jsonResponse(
          '200 OK - Detail role',
          successSchema({ $ref: '#/components/schemas/RoleDefinitionResponse' }),
          {
            success: true,
            message: 'Detail role & hak akses berhasil dimuat.',
            data: { id: 1, code: 'ADMIN_BPAD', isSystem: true },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
    put: {
      tags: ['Roles & Hak Akses'],
      summary: 'Perbarui role / izin CRUD (+ cascade kode role ke user terkait)',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RoleInput' },
          },
        },
      },
      responses: {
        200: jsonResponse(
          '200 OK - Role berhasil diperbarui',
          successSchema({ $ref: '#/components/schemas/RoleDefinitionResponse' }),
          {
            success: true,
            message: 'Konfigurasi role & hak akses berhasil diperbarui.',
            data: { id: 4, code: 'STAF_ARMADA' },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        409: { $ref: '#/components/responses/Conflict' },
        ...protectedWriteResponses,
      },
    },
    delete: {
      tags: ['Roles & Hak Akses'],
      summary: 'Hapus role custom (dilarang untuk role sistem / masih terpakai)',
      parameters: [idPathParam],
      responses: {
        200: jsonResponse(
          '200 OK - Role berhasil dihapus',
          successSchema({
            type: 'object',
            properties: { id: { type: 'integer' } },
          }),
          {
            success: true,
            message: 'Role hak akses berhasil dihapus.',
            data: { id: 4 },
          }
        ),
        404: { $ref: '#/components/responses/NotFound' },
        409: { $ref: '#/components/responses/Conflict' },
        ...protectedWriteResponses,
      },
    },
  },
}
