import { describe, expect, it } from 'vitest'
import { TERMO_ISENCAO_PARAGRAFOS, TERMO_ISENCAO_TEXTO, TERMO_ISENCAO_TITULO } from './termoIsencao'

describe('termoIsencao', () => {
  it('deve expor título e texto reutilizáveis com o espírito da isenção', () => {
    expect(TERMO_ISENCAO_TITULO.length).toBeGreaterThan(0)
    expect(TERMO_ISENCAO_TEXTO).toMatch(/não armazena/i)
    expect(TERMO_ISENCAO_TEXTO).toMatch(/não sincroniza/i)
    expect(TERMO_ISENCAO_TEXTO).toMatch(/não consegue recuperar|não recupera/i)
    expect(TERMO_ISENCAO_TEXTO).toMatch(/exclusiva sua|responsabilidade/i)
  })

  it('deve manter parágrafos alinhados ao texto plano (mesma fonte para UI e PDF)', () => {
    expect(TERMO_ISENCAO_PARAGRAFOS.join('\n\n')).toBe(TERMO_ISENCAO_TEXTO)
    expect(TERMO_ISENCAO_PARAGRAFOS.length).toBeGreaterThanOrEqual(2)
  })
})
