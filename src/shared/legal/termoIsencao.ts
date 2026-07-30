/**
 * Texto canônico do termo de isenção de responsabilidade.
 * Fonte única para onboarding, consulta no app e rodapé do relatório PDF.
 * Não alterar o espírito sem alinhar com discovery-conceitual 6.7.
 */

export const TERMO_ISENCAO_TITULO = 'Termo de isenção de responsabilidade'

/**
 * Corpo completo em texto plano (parágrafos separados por linha em branco).
 * Adequado para PDF e para qualquer consumidor que precise de string única.
 */
export const TERMO_ISENCAO_TEXTO = [
  'Este aplicativo funciona apenas neste dispositivo. Ele não armazena seus dados em servidores, não sincroniza entre aparelhos e não consegue recuperar um cofre perdido, apagado ou corrompido.',
  'A guarda do arquivo .cofre (cópias de segurança e do armazenamento de trabalho neste navegador) é exclusiva sua. Limpar dados do site, trocar de aparelho ou perder o arquivo pode significar perda definitiva do histórico.',
  'Ao usar o aplicativo, você declara estar ciente de que a responsabilidade pela conservação e pelo backup dos dados é sua.',
].join('\n\n')

/** Parágrafos do termo — mesma fonte que TERMO_ISENCAO_TEXTO, para renderização na UI. */
export const TERMO_ISENCAO_PARAGRAFOS: readonly string[] = TERMO_ISENCAO_TEXTO.split('\n\n')
