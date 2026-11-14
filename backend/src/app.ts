import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { registerSwagger } from './docs/swagger'
import { sendSuccess } from './lib/apiResponse'
import { errorHandler, notFoundHandler } from './middleware/error.middleware'
import { apiLimiter } from './middleware/rateLimit.middleware'
import { authRouter } from './routes/auth.routes'
import { dashboardRouter } from './routes/dashboard.routes'
import { healthRouter } from './routes/health.routes'
import { kendaraanRouter } from './routes/kendaraan.routes'
import { pegawaiRouter } from './routes/pegawai.routes'
import { peminjamanRouter } from './routes/peminjaman.routes'
import { perangkatDaerahRouter } from './routes/perangkat-daerah.routes'
import { rolesRouter } from './routes/roles.routes'
import { servisRouter } from './routes/servis.routes'
import { usersRouter } from './routes/users.routes'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(
    helmet({
      // Swagger UI membutuhkan inline script/style pada /api-docs
      contentSecurityPolicy: false,
    })
  )

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : true

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  )

  app.use('/api', apiLimiter)
  app.use(express.json({ limit: '15mb' }))
  app.use(express.urlencoded({ extended: true, limit: '15mb' }))

  app.get('/', (_req, res) => {
    sendSuccess(
      res,
      {
        name: 'SI-KDO BMD REST API',
        version: '1.0.0',
        swaggerUi: '/api-docs',
        openApiJson: '/api-docs.json',
        health: '/api/health',
      },
      'Selamat datang di REST API SI-KDO BMD.'
    )
  })

  registerSwagger(app)

  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/dashboard', dashboardRouter)
  app.use('/api/perangkat-daerah', perangkatDaerahRouter)
  app.use('/api/pegawai', pegawaiRouter)
  app.use('/api/kendaraan', kendaraanRouter)
  app.use('/api/peminjaman', peminjamanRouter)
  app.use('/api/servis', servisRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/roles', rolesRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
