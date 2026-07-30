import type { CofreSqlApi } from './types'

/**
 * DDL do schema baseline v1.
 * Campos alinhados às specs de veículos, manutenções e anexos (mínimo para abrir cofre novo).
 * CRUD de domínio fica nos planos posteriores — aqui só a estrutura.
 */
export function applySchemaV1Ddl(db: CofreSqlApi): void {
  db.run('PRAGMA foreign_keys = ON')

  db.run(`
    CREATE TABLE IF NOT EXISTS cofre_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      content_version INTEGER NOT NULL,
      modified_at TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS veiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placa TEXT NOT NULL,
      marca_modelo TEXT NOT NULL,
      ano_modelo INTEGER,
      km_atual INTEGER NOT NULL DEFAULT 0 CHECK (km_atual >= 0),
      proxima_troca TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS manutencoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      veiculo_id INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
      data TEXT NOT NULL,
      km INTEGER NOT NULL CHECK (km >= 0),
      tipo_servico TEXT NOT NULL,
      pecas_trocadas TEXT,
      oficina TEXT,
      valor REAL CHECK (valor IS NULL OR valor >= 0),
      proxima_revisao TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS anexos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manutencao_id INTEGER NOT NULL REFERENCES manutencoes(id) ON DELETE CASCADE,
      mime_type TEXT NOT NULL,
      file_name TEXT,
      bytes BLOB NOT NULL,
      size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
      created_at TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo_id
      ON manutencoes(veiculo_id)
  `)
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo_data
      ON manutencoes(veiculo_id, data DESC)
  `)
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_anexos_manutencao_id
      ON anexos(manutencao_id)
  `)
}
