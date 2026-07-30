import initSqlJs, { type SqlJsStatic } from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'

let sqlJsPromise: Promise<SqlJsStatic> | null = null

/**
 * Carrega sql.js uma vez.
 * Browser/produção: Vite resolve o `.wasm` via `?url`.
 * Vitest: loader separado com wasmBinary (fora do grafo do build de produção).
 */
export async function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    if (import.meta.env.MODE === 'test') {
      sqlJsPromise = import('./sqlJsLoader.vitest').then((m) => m.initSqlJsForVitest())
    } else {
      sqlJsPromise = initSqlJs({ locateFile: () => wasmUrl })
    }
  }
  return sqlJsPromise
}

/** Só para testes: reinicia o cache do módulo. */
export function resetSqlJsCacheForTests(): void {
  sqlJsPromise = null
}
