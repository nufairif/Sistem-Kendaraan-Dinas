import 'dotenv/config'
import { createApp } from './app'
import { prisma } from './lib/db'

const port = Number(process.env.PORT || 3001)
const app = createApp()

const server = app.listen(port, () => {
  console.log(`SI-KDO BMD REST API berjalan di http://localhost:${port}`)
  console.log(`Swagger UI tersedia di http://localhost:${port}/api-docs`)
  console.log(`OpenAPI JSON tersedia di http://localhost:${port}/api-docs.json`)
})

async function shutdown(signal: string) {
  console.log(`Menerima sinyal ${signal}, menutup server...`)
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
