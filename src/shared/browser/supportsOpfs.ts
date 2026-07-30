/**
 * Feature-check de OPFS (Origin Private File System).
 * Ponto de extensão para app-shell e cofre: specs posteriores podem
 * plugar aviso de navegador sem suporte mínimo (ex.: Safari < 16.4).
 */
export function supportsOpfs(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.storage !== 'undefined' &&
    typeof navigator.storage.getDirectory === 'function'
  )
}
