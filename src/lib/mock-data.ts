export const mockAvisos = [
  {
    id: 1,
    title: 'Atualização do Sistema',
    date: '01/05/2026',
    desc: 'Nova versão do NEXUS com melhorias na extração de IA.',
  },
  {
    id: 2,
    title: 'Campanha HDI',
    date: '28/04/2026',
    desc: 'Bônus de 5% em todas as apólices Auto emitidas esta semana.',
  },
  {
    id: 3,
    title: 'Manutenção Programada',
    date: '25/04/2026',
    desc: 'O sistema ficará indisponível no domingo das 02h às 04h.',
  },
]

export const mockApolices = [
  {
    id: 'AP-1029',
    cliente: 'João Silva',
    seguradora: 'Porto Seguro',
    ramo: 'Auto',
    status: 'Vigente',
    premio: 2500,
    data: '15/04/2026',
  },
  {
    id: 'AP-1030',
    cliente: 'Maria Oliveira',
    seguradora: 'HDI',
    ramo: 'Residencial',
    status: 'Aguard. Apólice',
    premio: 850,
    data: '28/04/2026',
  },
  {
    id: 'AP-1031',
    cliente: 'Empresa ABC Ltda',
    seguradora: 'Sulamérica',
    ramo: 'Empresarial',
    status: 'Renovação',
    premio: 12400,
    data: '01/05/2026',
  },
  {
    id: 'AP-1032',
    cliente: 'Carlos Santos',
    seguradora: 'Allianz',
    ramo: 'Vida',
    status: 'Vigente',
    premio: 1200,
    data: '02/05/2026',
  },
  {
    id: 'AP-1033',
    cliente: 'Ana Costa',
    seguradora: 'Bradesco',
    ramo: 'Auto',
    status: 'Cancelada',
    premio: 3100,
    data: '10/04/2026',
  },
]

export const mockChartData = [
  { name: 'Jan', producao: 45000, comissao: 9000 },
  { name: 'Fev', producao: 52000, comissao: 10400 },
  { name: 'Mar', producao: 48000, comissao: 9600 },
  { name: 'Abr', producao: 61000, comissao: 12200 },
  { name: 'Mai', producao: 59000, comissao: 11800 },
]

export const mockPieData = [
  { name: 'Porto Seguro', value: 400 },
  { name: 'Sulamérica', value: 300 },
  { name: 'HDI', value: 300 },
  { name: 'Allianz', value: 200 },
]
