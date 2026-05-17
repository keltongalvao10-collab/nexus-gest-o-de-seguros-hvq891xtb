export const mockAvisos = [
  {
    id: '1',
    title: 'Sistema Atualizado',
    description:
      'O NEXUS Gestão de Seguros foi atualizado para a versão mais recente com melhorias de performance.',
    date: new Date().toISOString(),
    type: 'info',
  },
  {
    id: '2',
    title: 'Manutenção Programada',
    description:
      'Haverá uma janela de manutenção programada neste domingo, das 02:00 às 04:00 da manhã.',
    date: new Date(Date.now() + 86400000).toISOString(),
    type: 'warning',
  },
]
