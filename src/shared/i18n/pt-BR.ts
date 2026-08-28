/**
 * Strings de interface (PT-BR).
 * Isoladas aqui para não hardcodar em componentes e facilitar i18n futuro.
 * Sem framework de i18n no MVP.
 */
export const strings = {
  appName: 'Histórico de Veículos',
  home: {
    title: 'Histórico de Veículos',
    subtitle: 'Arquive manutenções no seu dispositivo. Sem login e sem nuvem de dados.',
  },
  shell: {
    adsPlaceholder: 'Espaço para anúncio',
    back: 'Voltar',
    unsupportedTitle: 'Navegador sem suporte',
    unsupportedBody:
      'Este navegador não oferece armazenamento local seguro (OPFS). Atualize para Safari 16.4+, Chrome, Edge ou Firefox recentes para usar o app com segurança.',
    tabs: {
      veiculos: 'Veículos',
      manutencoes: 'Manutenções',
      config: 'Ajustes',
    },
    manutencoesPickVeiculo:
      'Abra um veículo em Veículos e toque em Manutenções para ver o histórico.',
    configTitle: 'Configurações e backup',
    configSubtitle:
      'Exporte cópias do .cofre com frequência e guarde em pelo menos dois locais. O app não envia seus dados para a nuvem.',
  },
  cofre: {
    title: 'Seu cofre',
    subtitle: 'Os dados ficam só neste dispositivo. Exporte cópias para backup.',
    create: 'Criar cofre novo',
    import: 'Importar arquivo .cofre',
    export: 'Exportar .cofre',
    openWorking: 'Abrindo cofre…',
    emptyState: 'Nenhum cofre neste dispositivo. Crie um novo ou importe um backup.',
    contentVersion: 'Versão do conteúdo',
    modifiedAt: 'Última modificação',
    opfsUnavailableTitle: 'Navegador sem suporte',
    opfsUnavailableBody:
      'Este navegador não oferece armazenamento local seguro (OPFS). Atualize para Safari 16.4+, Chrome, Edge ou Firefox recentes para usar o app com segurança.',
    invalidFile: 'Arquivo inválido. Escolha um .cofre gerado por este aplicativo.',
    corruptFile: 'Não foi possível abrir o arquivo. Ele pode estar corrompido.',
    replaceTitle: 'Substituir cofre atual?',
    replaceMessage:
      'Já existe um cofre neste dispositivo. Importar outro arquivo substitui o atual. Esta ação não pode ser desfeita.',
    replaceConfirm: 'Substituir',
    replaceCancel: 'Cancelar',
    writeFailed: 'Falha ao salvar o cofre no dispositivo. Tente novamente.',
    createdOk: 'Cofre criado e salvo neste dispositivo.',
    importedOk: 'Cofre importado e salvo neste dispositivo.',
    exportedOk: 'Exportação iniciada.',
    loadError: 'Não foi possível carregar o cofre de trabalho.',
    schemaTooNewTitle: 'Atualize o aplicativo',
    schemaTooNewBody:
      'Este cofre foi criado por uma versão mais nova do app. Atualize para abri-lo. O arquivo não foi alterado.',
    migrationFailed:
      'Não foi possível atualizar o schema do cofre. O arquivo de trabalho não foi sobrescrito com um estado parcial.',
  },
  veiculos: {
    title: 'Veículos',
    emptyTitle: 'Nenhum veículo cadastrado',
    emptyBody: 'Cadastre o primeiro veículo para começar a arquivar o histórico de manutenções.',
    emptyCta: 'Cadastrar primeiro veículo',
    add: 'Novo veículo',
    edit: 'Editar veículo',
    createTitle: 'Novo veículo',
    editTitle: 'Editar veículo',
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    placa: 'Placa',
    marcaModelo: 'Marca / modelo',
    anoModelo: 'Ano / modelo',
    kmAtual: 'Km atual',
    proximaTroca: 'Próxima troca prevista',
    kmSuffix: 'km',
    deleteTitle: 'Excluir veículo?',
    deleteMessage: 'O veículo será removido do cofre. Esta ação não pode ser desfeita.',
    deleteConfirm: 'Excluir',
    deleteCancel: 'Cancelar',
    deleteWithHistoryTitle: 'Excluir veículo e histórico?',
    deleteWithHistoryMessage:
      'Este veículo possui manutenções registradas. Excluir remove o veículo e todo o histórico vinculado (manutenções e anexos). Esta ação não pode ser desfeita.',
    deleteWithHistoryConfirm: 'Excluir veículo e histórico',
    savedOk: 'Veículo salvo.',
    deletedOk: 'Veículo excluído.',
    loadError: 'Não foi possível carregar os veículos.',
    saveError: 'Não foi possível salvar o veículo.',
    deleteError: 'Não foi possível excluir o veículo.',
    fieldErrors: {
      placa: {
        required: 'Informe a placa.',
      },
      marcaModelo: {
        required: 'Informe a marca e o modelo.',
      },
      anoModelo: {
        invalid: 'Informe um ano válido.',
      },
      kmAtual: {
        required: 'Informe o km atual.',
        invalid: 'Informe um km atual numérico inteiro.',
        negative: 'O km atual não pode ser negativo.',
      },
    },
    openHistorico: 'Manutenções',
  },
  manutencoes: {
    title: 'Manutenções',
    emptyTitle: 'Nenhuma manutenção registrada',
    emptyBody: 'Registre a primeira manutenção deste veículo para montar o histórico.',
    emptyCta: 'Registrar primeira manutenção',
    add: 'Nova manutenção',
    edit: 'Editar',
    createTitle: 'Nova manutenção',
    editTitle: 'Editar manutenção',
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    back: 'Voltar',
    data: 'Data',
    km: 'Km',
    tipoServico: 'Tipo de serviço',
    pecasTrocadas: 'Peças trocadas',
    pecaDescricao: 'Descrição da peça',
    pecaValor: 'Valor',
    pecaAdd: 'Adicionar peça',
    pecaRemove: 'Remover',
    valorTotal: 'Valor total',
    valorTotalHint: 'Soma automática das peças',
    oficina: 'Oficina',
    valor: 'Valor',
    proximaRevisao: 'Próxima revisão prevista',
    kmSuffix: 'km',
    deleteTitle: 'Excluir manutenção?',
    deleteMessage: 'A manutenção será removida do histórico. Esta ação não pode ser desfeita.',
    deleteConfirm: 'Excluir',
    deleteCancel: 'Cancelar',
    savedOk: 'Manutenção salva.',
    deletedOk: 'Manutenção excluída.',
    loadError: 'Não foi possível carregar as manutenções.',
    saveError: 'Não foi possível salvar a manutenção.',
    deleteError: 'Não foi possível excluir a manutenção.',
    orderHint: 'Mais recentes primeiro',
    fieldErrors: {
      data: {
        required: 'Informe a data.',
        invalid: 'Informe uma data válida no formato AAAA-MM-DD.',
      },
      km: {
        required: 'Informe o km.',
        invalid: 'Informe um km numérico inteiro.',
        negative: 'O km não pode ser negativo.',
      },
      tipoServico: {
        required: 'Informe o tipo de serviço.',
      },
      pecasTrocadas: {
        required: 'Informe a descrição da peça.',
        invalid: 'Peça inválida. Informe descrição e valor.',
        negative: 'O valor da peça não pode ser negativo.',
      },
      valor: {
        invalid: 'Informe um valor numérico válido.',
        negative: 'O valor não pode ser negativo.',
      },
      veiculoId: {
        required: 'Selecione um veículo.',
        invalid: 'Veículo inválido.',
      },
    },
  },
  anexos: {
    title: 'Anexos da nota',
    empty: 'Nenhuma nota anexada. Tire uma foto ou escolha um PDF.',
    addPhoto: 'Anexar foto (câmera ou galeria)',
    addPdf: 'Anexar PDF',
    view: 'Visualizar',
    remove: 'Remover',
    closePreview: 'Fechar',
    processing: 'Processando imagem…',
    deleteTitle: 'Remover anexo?',
    deleteMessage: 'O arquivo será removido do cofre. Esta ação não pode ser desfeita.',
    deleteConfirm: 'Remover',
    deleteCancel: 'Cancelar',
    pdfWarnTitle: 'PDF grande',
    pdfWarnMessage:
      'Este PDF tem cerca de 2 MB ou mais. Ele será guardado sem compressão e pode aumentar o tamanho do cofre. Deseja continuar?',
    pdfWarnConfirm: 'Anexar mesmo assim',
    pdfWarnCancel: 'Cancelar',
    savedOk: 'Anexo salvo.',
    deletedOk: 'Anexo removido.',
    loadError: 'Não foi possível carregar os anexos.',
    saveError: 'Não foi possível salvar o anexo.',
    deleteError: 'Não foi possível remover o anexo.',
    unsupportedType: 'Tipo de arquivo não suportado. Use imagem (foto) ou PDF.',
    workerFailed: 'Não foi possível processar a imagem. O anexo não foi salvo.',
    sizeLabel: 'Tamanho',
  },
  onboarding: {
    title: 'Bem-vindo',
    intro:
      'Antes de criar ou importar um cofre, entenda como seus dados ficam protegidos — e onde a responsabilidade é sua.',
    autoSaveTitle: 'Salvo automaticamente neste dispositivo',
    autoSaveBody:
      'Enquanto você usa o app, o cofre de trabalho é gravado sozinho neste navegador (armazenamento local). Não há conta nem nuvem do aplicativo.',
    backupTitle: 'Faça cópias em pelo menos dois locais',
    backupBody:
      'Exporte o arquivo .cofre com frequência e guarde cópias em lugares distintos — por exemplo, uma nuvem pessoal e um pen drive ou HD externo. Se perder o único arquivo, o histórico não pode ser recuperado.',
    howToExportTitle: 'Como exportar (backup manual)',
    howToExportBody:
      'Em Ajustes, use o botão “Exportar .cofre”. Isso baixa uma cópia do seu arquivo para você guardar onde preferir.',
    acceptCheckbox: 'Li e aceito o termo de isenção de responsabilidade',
    continue: 'Aceitar e continuar',
    mustAccept: 'Aceite o termo para criar ou importar um cofre.',
    refuseHint: 'Sem o aceite, não é possível criar ou usar um cofre novo neste aplicativo.',
  },
  termo: {
    open: 'Ver termo de isenção',
    close: 'Fechar',
    gateTitle: 'Aceite necessário',
    gateBody:
      'Para continuar usando o cofre neste dispositivo, leia e aceite o termo de isenção de responsabilidade.',
    gateAccept: 'Aceitar e continuar',
  },
  backupReminder: {
    title: 'Hora de fazer um backup',
    body: 'Já faz um tempo (ou várias edições) sem uma cópia exportada do .cofre. Exporte agora e guarde em pelo menos dois locais.',
    export: 'Exportar .cofre',
    dismiss: 'Agora não',
  },
  ocr: {
    title: 'Extrair dados da nota (OCR)',
    processing: 'Lendo a nota…',
    cancel: 'Cancelar OCR',
    hint: 'Ao anexar uma foto da nota, o OCR tenta pré-preencher os campos. Revise antes de salvar. PDF é anexado sem OCR automático.',
    appliedOk: 'Sugestões aplicadas. Revise e salve quando quiser.',
    emptyResult:
      'Não foi possível identificar campos na nota. A nota foi anexada — preencha manualmente.',
    attachedWithoutPrefill:
      'Nota anexada. Não foi possível pré-preencher o formulário — complete os campos manualmente.',
    pdfNoOcr:
      'PDF anexado. Neste MVP não há OCR automático para PDF — preencha os campos manualmente.',
    modelAckTitle: 'Baixar modelo de OCR?',
    modelAckMessage:
      'Na primeira uso é necessário baixar o modelo de português (cerca de {{sizeMb}} MB). Depois ele pode ser reutilizado (e cacheado pelo app). Sem o download, a nota permanece anexada e você preenche manualmente.',
    modelAckConfirm: 'Baixar e continuar',
    modelAckSkip: 'Continuar sem OCR',
    retry: 'Tentar de novo',
    continueManual: 'Continuar sem OCR',
    failed:
      'Não foi possível ler a nota. A nota permanece anexada — verifique a conexão (modelo) ou tente outra imagem. O preenchimento manual permanece disponível.',
    modelDownloadFailed:
      'Falha ao baixar o modelo de OCR. A nota permanece anexada — tente de novo com conexão ou continue sem OCR.',
  },
  relatorio: {
    generate: 'Gerar relatório PDF',
    generating: 'Gerando relatório PDF…',
    progressMontando: 'Montando dados do histórico…',
    progressGerando: 'Montando o PDF…',
    progressEntregando: 'Preparando download…',
    success: 'Relatório gerado. O arquivo foi baixado ou compartilhado neste dispositivo.',
    emptyHistory:
      'Não há histórico de manutenções para exportar neste veículo. Registre ao menos uma manutenção antes de gerar o relatório.',
    error: 'Não foi possível gerar o relatório PDF. Tente novamente. O cofre não foi alterado.',
    veiculoNotFound: 'Veículo não encontrado. Não foi possível gerar o relatório.',
  },
} as const

export type Strings = typeof strings
