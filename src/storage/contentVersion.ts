import type { ContentVersionMeta, CofreSqlApi } from './types'

export function readContentMeta(db: CofreSqlApi): ContentVersionMeta {
  const rows = db.getRows('SELECT content_version, modified_at FROM cofre_meta WHERE id = 1')
  const row = rows[0]
  if (!row) {
    return { contentVersion: 0, modifiedAt: '' }
  }
  return {
    contentVersion: Number(row[0] ?? 0),
    modifiedAt: String(row[1] ?? ''),
  }
}

export function writeContentMeta(db: CofreSqlApi, meta: ContentVersionMeta): void {
  db.run(
    `INSERT INTO cofre_meta (id, content_version, modified_at) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       content_version = excluded.content_version,
       modified_at = excluded.modified_at`,
    [meta.contentVersion, meta.modifiedAt],
  )
}

/**
 * Incrementa o contador e atualiza o timestamp.
 * Regra: após N gravações relevantes (create conta como 1ª), contentVersion === N.
 */
export function bumpContentMeta(
  db: CofreSqlApi,
  now: () => string = () => new Date().toISOString(),
): ContentVersionMeta {
  const current = readContentMeta(db)
  const next: ContentVersionMeta = {
    contentVersion: current.contentVersion + 1,
    modifiedAt: now(),
  }
  writeContentMeta(db, next)
  return next
}
