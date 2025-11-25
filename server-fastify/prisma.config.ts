import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Load environment variables from .env file
config();

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
    seed: 'bun ./prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
