import { neon } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

type Database = NeonHttpDatabase<typeof schema>

// Lazy init: neon() throws if DATABASE_URL is missing, which would break
// `next build` at module-load time. The connection is only created on first
// actual use, so the exported `db` keeps the same API everywhere.
let instance: Database | null = null

function getDb(): Database {
  if (!instance) {
    const sql = neon(process.env.DATABASE_URL!)
    instance = drizzle(sql, { schema })
  }
  return instance
}

export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const real = getDb()
    const value = Reflect.get(real, prop) as unknown
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(real)
    }
    return value
  },
})

export type Db = typeof db
