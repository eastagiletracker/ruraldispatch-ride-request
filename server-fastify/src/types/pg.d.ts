/**
 * Type declaration for pg module ESM imports
 * @types/pg doesn't properly support ESM imports, so we add this declaration
 */
declare module 'pg' {
  import { Pool as PgPool, PoolConfig } from 'pg';
  export { PgPool as Pool, PoolConfig };
  export * from 'pg';
}
