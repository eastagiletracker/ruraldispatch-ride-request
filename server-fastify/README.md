# Fastify + TypeScript Server

This is the new Fastify-based backend for Rural Dispatch, migrated from Express.js.

## Features

- **Fastify 5** - High-performance web framework
- **TypeScript** - Full type safety with strict mode
- **Prisma 7** - Type-safe database access
- **Zod** - Schema validation shared with frontend
- **Bun Runtime** - Fast development and production

## Development

```bash
# Install dependencies
bun install

# Run development server with hot reload
bun run dev

# Type check without emitting
bun run type-check

# Build for production
bun run build

# Run production build
bun start
```

## Architecture

- `src/index.ts` - Entry point
- `src/app.ts` - Fastify app configuration
- `src/plugins/` - Fastify plugins (CORS, Helmet, Prisma, Auth)
- `src/routes/` - API route handlers
- `src/database/` - Prisma client and database API
- `src/services/` - Business logic (SMS, scheduler)
- `src/types/` - TypeScript type definitions
- `src/schemas/` - Zod validation schemas

## Migration Status

See parent CLAUDE.md for complete migration documentation.

## Environment Variables

Uses the same `.env` file from the parent directory. All environment variables from the Express version are compatible.
