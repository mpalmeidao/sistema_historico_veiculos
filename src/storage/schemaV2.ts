import type { CofreSqlApi } from './types'

/** Descrição canônica ao migrar manutenção que só tinha valor (sem texto de peças). */
export const PECAS_MIGRATED_DESCRICAO = 'Valor migrado'

/**
 * DDL incremental do schema v2: peças trocadas como tabela filha.
 * Remoção de `pecas_trocadas` e migração de dados legado ficam em `migrateV1ToV2`.
 */
export function createManutencaoPecasTable(db: CofreSqlApi): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS manutencao_pecas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manutencao_id INTEGER NOT NULL REFERENCES manutencoes(id) ON DELETE CASCADE,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL CHECK (valor >= 0),
      posicao INTEGER NOT NULL DEFAULT 0
    )
  `)
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_manutencao_pecas_manutencao_id
      ON manutencao_pecas(manutencao_id)
  `)
}
