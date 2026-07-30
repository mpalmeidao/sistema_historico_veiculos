/**
 * Identificação e nomes fixos do cofre.
 * application_id: fourCC 'HVCF' (Histórico Veículos CoFre) em big-endian.
 */
export const COFRE_APPLICATION_ID = 0x48564346

/** @deprecated Use CURRENT_SCHEMA_VERSION de schemaVersion.ts */
export { CURRENT_SCHEMA_VERSION as COFRE_SCHEMA_VERSION_STUB } from './schemaVersion'

/** Extensão do arquivo portátil de export/import. */
export const COFRE_FILE_EXTENSION = '.cofre'

/** Nome do arquivo de trabalho no OPFS. */
export const OPFS_WORKING_FILENAME = 'trabalho.cofre'

/** Nome sugerido no download/export. */
export const DEFAULT_EXPORT_FILENAME = `historico-veiculos${COFRE_FILE_EXTENSION}`

/** Magic header de arquivo SQLite (16 bytes incluindo null). */
export const SQLITE_MAGIC = 'SQLite format 3\u0000'
