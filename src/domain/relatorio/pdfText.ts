/**
 * Sanitiza texto para fontes WinAnsi do pdf-lib (StandardFonts).
 * Caracteres fora do conjunto são substituídos para não quebrar a geração.
 */
export function toPdfSafeText(value: string): string {
  return Array.from(value)
    .map((char) => {
      const code = char.charCodeAt(0)
      // ASCII imprimível + Latin-1 suplementar usado pelo WinAnsi
      if (code === 0x09 || code === 0x0a || code === 0x0d) return char
      if (code >= 0x20 && code <= 0x7e) return char
      if (code >= 0xa0 && code <= 0xff) return char
      // Em dash / en dash → hífen
      if (code === 0x2014 || code === 0x2013) return '-'
      // Aspas tipográficas
      if (code === 0x201c || code === 0x201d || code === 0x2018 || code === 0x2019) return '"'
      return '?'
    })
    .join('')
}

/** Quebra texto em linhas respeitando largura máxima (largura em pontos). */
export function wrapText(
  text: string,
  maxWidth: number,
  measure: (line: string) => number,
): string[] {
  const paragraphs = text.split(/\r?\n/)
  const lines: string[] = []

  for (const paragraph of paragraphs) {
    if (paragraph.trim().length === 0) {
      lines.push('')
      continue
    }
    const words = paragraph.split(/\s+/)
    let current = ''
    for (const word of words) {
      const candidate = current.length === 0 ? word : `${current} ${word}`
      if (measure(candidate) <= maxWidth) {
        current = candidate
      } else {
        if (current.length > 0) lines.push(current)
        if (measure(word) <= maxWidth) {
          current = word
        } else {
          // palavra maior que a coluna: corta por caractere
          let chunk = ''
          for (const ch of word) {
            const next = chunk + ch
            if (measure(next) <= maxWidth) {
              chunk = next
            } else {
              if (chunk.length > 0) lines.push(chunk)
              chunk = ch
            }
          }
          current = chunk
        }
      }
    }
    if (current.length > 0) lines.push(current)
  }

  return lines
}
