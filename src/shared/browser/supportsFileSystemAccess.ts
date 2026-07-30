/**
 * Feature-check da File System Access API (enhancement opcional em desktop
 * Chrome/Edge). Ausente a API, o fluxo permanece OPFS + export/import (ADR-001).
 */
export function supportsFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function'
}
