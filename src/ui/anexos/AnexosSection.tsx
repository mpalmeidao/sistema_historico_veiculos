import { useEffect, useRef, useState } from 'react'
import {
  IonAlert,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonText,
} from '@ionic/react'
import { documentAttachOutline, imagesOutline } from 'ionicons/icons'
import type { AnexoMeta, PreparedAnexo } from '../../domain'
import { MIME_PDF } from '../../domain'
import { strings } from '../../shared/i18n'
import type { UseAnexosResult } from '../hooks/useAnexos'

export interface AnexosSectionProps {
  anexos: AnexoMeta[]
  processing: boolean
  errorMessage: string | null
  attachFile: UseAnexosResult['attachFile']
  confirmPreparedAnexo: UseAnexosResult['confirmPreparedAnexo']
  loadAnexoBytes: UseAnexosResult['loadAnexoBytes']
  removeAnexo: UseAnexosResult['removeAnexo']
  /** Chamado após anexo persistido ou pendente (criação). */
  onAttached?: (prepared: PreparedAnexo) => void
  disabled?: boolean
  /** Quando true, oculta o título (o wizard já mostra o título da etapa). */
  hideTitle?: boolean
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AnexosSection({
  anexos,
  processing,
  errorMessage,
  attachFile,
  confirmPreparedAnexo,
  loadAnexoBytes,
  removeAnexo,
  onAttached,
  disabled = false,
  hideTitle = false,
}: AnexosSectionProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const [pendingDelete, setPendingDelete] = useState<AnexoMeta | null>(null)
  const [pendingPdf, setPendingPdf] = useState<PreparedAnexo | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewMime, setPreviewMime] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
    }
  }, [])

  function clearPreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setPreviewUrl(null)
    setPreviewMime(null)
  }

  function resetFileInputs() {
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
    if (pdfInputRef.current) pdfInputRef.current.value = ''
  }

  async function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return
    resetFileInputs()

    const result = await attachFile(file)
    if (result.status === 'needs-pdf-confirm') {
      setPendingPdf(result.prepared)
      return
    }
    if (result.status === 'saved') {
      onAttached?.(result.prepared)
    }
  }

  async function handleView(meta: AnexoMeta) {
    const full = await loadAnexoBytes(meta.id)
    if (!full) return
    clearPreview()
    const copy = new Uint8Array(full.bytes)
    const blob = new Blob([copy.buffer], { type: full.mimeType })
    const url = URL.createObjectURL(blob)
    previewUrlRef.current = url
    setPreviewUrl(url)
    setPreviewMime(full.mimeType)
  }

  const busy = processing || disabled

  return (
    <section data-testid="anexos-section" className="hvcf-anexos">
      {!hideTitle && <h3 className="hvcf-anexos__title">{strings.anexos.title}</h3>}
      <IonNote data-testid="ocr-hint">{strings.ocr.hint}</IonNote>

      {errorMessage && (
        <IonText color="danger">
          <p data-testid="anexos-error">{errorMessage}</p>
        </IonText>
      )}
      {processing && <IonNote data-testid="anexos-processing">{strings.anexos.processing}</IonNote>}

      <div className="hvcf-anexos-actions">
        <IonButton
          data-testid="anexo-add-photo"
          className="hvcf-anexos-actions__btn"
          disabled={busy}
          onClick={() => cameraInputRef.current?.click()}
        >
          {strings.anexos.addPhoto}
        </IonButton>
        <IonButton
          data-testid="anexo-add-gallery"
          className="hvcf-anexos-actions__btn"
          fill="outline"
          disabled={busy}
          onClick={() => galleryInputRef.current?.click()}
        >
          {strings.anexos.addGallery}
        </IonButton>
        <IonButton
          data-testid="anexo-add-pdf"
          className="hvcf-anexos-actions__btn"
          fill="outline"
          disabled={busy}
          onClick={() => pdfInputRef.current?.click()}
        >
          {strings.anexos.addPdf}
        </IonButton>
      </div>

      <input
        ref={cameraInputRef}
        data-testid="anexo-photo-input"
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(event) => {
          void handleFiles(event.target.files)
        }}
      />
      <input
        ref={galleryInputRef}
        data-testid="anexo-gallery-input"
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          void handleFiles(event.target.files)
        }}
      />
      <input
        ref={pdfInputRef}
        data-testid="anexo-pdf-input"
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(event) => {
          void handleFiles(event.target.files)
        }}
      />

      {anexos.length === 0 ? (
        <div className="hvcf-anexos-empty" data-testid="anexos-empty">
          <span className="hvcf-anexos-empty__icon" aria-hidden="true">
            <IonIcon icon={imagesOutline} />
          </span>
          <p className="hvcf-anexos-empty__title">{strings.anexos.emptyTitle}</p>
          <p className="hvcf-anexos-empty__body">{strings.anexos.empty}</p>
        </div>
      ) : (
        <IonList data-testid="anexos-list">
          {anexos.map((anexo) => (
            <IonItem key={anexo.id} data-testid={`anexo-item-${anexo.id}`}>
              <IonIcon
                slot="start"
                icon={anexo.mimeType === MIME_PDF ? documentAttachOutline : imagesOutline}
                aria-hidden="true"
              />
              <IonLabel>
                <h3 data-testid={`anexo-name-${anexo.id}`}>
                  {anexo.fileName ?? (anexo.mimeType === MIME_PDF ? 'PDF' : 'Imagem')}
                </h3>
                <IonNote>
                  {strings.anexos.sizeLabel}: {formatSize(anexo.sizeBytes)}
                </IonNote>
              </IonLabel>
              <div slot="end" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <IonButton
                  data-testid={`anexo-view-${anexo.id}`}
                  size="small"
                  fill="outline"
                  onClick={() => {
                    void handleView(anexo)
                  }}
                >
                  {strings.anexos.view}
                </IonButton>
                <IonButton
                  data-testid={`anexo-delete-${anexo.id}`}
                  size="small"
                  color="danger"
                  fill="clear"
                  onClick={() => setPendingDelete(anexo)}
                >
                  {strings.anexos.remove}
                </IonButton>
              </div>
            </IonItem>
          ))}
        </IonList>
      )}

      {previewUrl && (
        <div data-testid="anexo-preview" style={{ marginTop: '1rem' }}>
          {previewMime === MIME_PDF ? (
            <iframe
              title={strings.anexos.view}
              src={previewUrl}
              style={{
                width: '100%',
                minHeight: '280px',
                border: '1px solid var(--hvcf-color-border-subtle)',
              }}
            />
          ) : (
            <img
              data-testid="anexo-preview-image"
              src={previewUrl}
              alt={strings.anexos.view}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          )}
          <IonButton
            data-testid="anexo-preview-close"
            size="small"
            fill="clear"
            onClick={clearPreview}
          >
            {strings.anexos.closePreview}
          </IonButton>
        </div>
      )}

      <IonAlert
        isOpen={pendingDelete !== null}
        header={strings.anexos.deleteTitle}
        message={strings.anexos.deleteMessage}
        buttons={[
          {
            text: strings.anexos.deleteCancel,
            role: 'cancel',
            handler: () => setPendingDelete(null),
          },
          {
            text: strings.anexos.deleteConfirm,
            role: 'destructive',
            handler: () => {
              const target = pendingDelete
              setPendingDelete(null)
              if (target) void removeAnexo(target.id)
            },
          },
        ]}
        onDidDismiss={() => setPendingDelete(null)}
      />

      <IonAlert
        isOpen={pendingPdf !== null}
        header={strings.anexos.pdfWarnTitle}
        message={strings.anexos.pdfWarnMessage}
        buttons={[
          {
            text: strings.anexos.pdfWarnCancel,
            role: 'cancel',
            handler: () => setPendingPdf(null),
          },
          {
            text: strings.anexos.pdfWarnConfirm,
            role: 'confirm',
            handler: () => {
              const prepared = pendingPdf
              setPendingPdf(null)
              if (!prepared) return
              void (async () => {
                const result = await confirmPreparedAnexo(prepared)
                if (result.ok) onAttached?.(result.prepared)
              })()
            },
          },
        ]}
        onDidDismiss={() => setPendingPdf(null)}
      />
    </section>
  )
}
