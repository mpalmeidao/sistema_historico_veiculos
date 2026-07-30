/**
 * JPEG 1×1 mínimo válido (para testes de miniatura no PDF).
 * Decodificado de um JPEG monocromático conhecido.
 */
export function minimalJpegBytes(): Uint8Array {
  const base64 =
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k='
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/** PDF mínimo válido (%PDF-1.1 … %%EOF). */
export function minimalPdfBytes(): Uint8Array {
  const text = `%PDF-1.1
1 0 obj<<>>endobj
2 0 obj<< /Length 0 >>stream
endstream
endobj
3 0 obj<< /Type /Page /Parent 4 0 R /MediaBox [0 0 3 3] >>endobj
4 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
5 0 obj<< /Type /Catalog /Pages 4 0 R >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000025 00000 n 
0000000078 00000 n 
0000000147 00000 n 
0000000208 00000 n 
trailer<< /Size 6 /Root 5 0 R >>
startxref
269
%%EOF`
  return new TextEncoder().encode(text)
}
