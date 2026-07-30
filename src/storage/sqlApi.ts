import type { Database } from 'sql.js'
import type { CofreSqlApi, QueryResult, SqlValue } from './types'

export function createSqlApi(db: Database): CofreSqlApi {
  return {
    run(sql: string, params: SqlValue[] = []): void {
      db.run(sql, params as never[])
    },
    exec(sql: string): QueryResult[] {
      return db.exec(sql) as QueryResult[]
    },
    getRows(sql: string, params: SqlValue[] = []): SqlValue[][] {
      const stmt = db.prepare(sql)
      try {
        if (params.length > 0) {
          stmt.bind(params as never[])
        }
        const rows: SqlValue[][] = []
        while (stmt.step()) {
          rows.push(stmt.get() as SqlValue[])
        }
        return rows
      } finally {
        stmt.free()
      }
    },
  }
}
