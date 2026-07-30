import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import initSqlJs, { type SqlJsStatic } from 'sql.js'

/** Carregamento de sql.js exclusivo do Vitest (não entra no bundle do browser). */
export async function initSqlJsForVitest(): Promise<SqlJsStatic> {
  const require = createRequire(import.meta.url)
  const entry = require.resolve('sql.js')
  const wasmPath = join(dirname(entry), 'sql-wasm.wasm')
  const fileBuffer = readFileSync(wasmPath)
  const wasmBinary = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength,
  )
  return initSqlJs({ wasmBinary })
}
