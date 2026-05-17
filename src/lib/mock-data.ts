export const mockAvisos = [
  {
    id: '1',
    title: 'Atualização do Sistema v2.0',
    date: new Date().toISOString(),
    content:
      'O sistema NEXUS foi atualizado com novos recursos de importação de apólices via PDF e integração nativa com o portal do corretor.',
    type: 'info',
  },
  {
    id: '2',
    title: 'Manutenção Programada',
    date: new Date().toISOString(),
    content:
      'O sistema passará por manutenção programada neste fim de semana entre 00:00 e 04:00. O acesso poderá apresentar instabilidade.',
    type: 'warning',
  },
  {
    id: '3',
    title: 'Novos Relatórios Disponíveis',
    date: new Date().toISOString(),
    content:
      'Foram adicionados 5 novos modelos de relatórios gerenciais para acompanhamento de produção e comissões.',
    type: 'success',
  },
]
