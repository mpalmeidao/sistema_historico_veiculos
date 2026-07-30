import { describe, expect, it } from 'vitest'
import { OCR_BINARIZE_THRESHOLD, preprocessImageData } from './ocrPreprocessCore'

describe('preprocessImageData', () => {
  it('deve converter pixels para preto/branco por limiar', () => {
    const data = new Uint8ClampedArray([
      200,
      200,
      200,
      255, // claro → branco
      40,
      40,
      40,
      255, // escuro → preto
    ])
    const imageData = { data, width: 2, height: 1 } as ImageData
    preprocessImageData(imageData, { contrast: 1, threshold: OCR_BINARIZE_THRESHOLD })

    expect(Array.from(data.slice(0, 4))).toEqual([255, 255, 255, 255])
    expect(Array.from(data.slice(4, 8))).toEqual([0, 0, 0, 255])
  })
})
