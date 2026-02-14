import { defineConfig } from 'prisma/config'
import * as dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DIRECT_URL ?? 'postgresql://placeholder',
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
