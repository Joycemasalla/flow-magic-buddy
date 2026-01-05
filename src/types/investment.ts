export type InvestmentType = 
  | 'tesouro_direto' 
  | 'renda_fixa' 
  | 'acoes' 
  | 'cripto' 
  | 'fundos' 
  | 'poupanca' 
  | 'outros';

export type InvestmentStatus = 'pending' | 'invested';

export interface TesouroDiretoDetails {
  titulo: string;
  taxa: number;
  precoUnitario: number;
  vencimento: string;
}

export interface AcoesDetails {
  ticker: string;
  quantidade: number;
  precoMedio: number;
}

export interface CriptoDetails {
  moeda: string;
  quantidade: number;
  precoMedio: number;
}

export interface RendaFixaDetails {
  instituicao: string;
  taxa: number;
  tipoTaxa: 'cdi' | 'ipca' | 'prefixado';
  vencimento: string;
}

export interface PoupancaDetails {
  instituicao: string;
  objetivo?: string;
}

export interface FundosDetails {
  nomeGestor: string;
  tipoFundo: string;
  taxaAdministracao: number;
}

export type InvestmentDetails = 
  | TesouroDiretoDetails 
  | AcoesDetails 
  | CriptoDetails 
  | RendaFixaDetails 
  | PoupancaDetails
  | FundosDetails;

export interface Investment {
  id: string;
  nome: string;
  tipo: InvestmentType;
  valorInvestido: number;
  dataInvestimento: string;
  jaInvestido: boolean;
  descricao?: string;
  detalhesEspecificos?: InvestmentDetails;
  transactionId?: string;
  createdAt: string;
}

export const investmentTypeLabels: Record<InvestmentType, string> = {
  tesouro_direto: 'Tesouro Direto',
  renda_fixa: 'Renda Fixa',
  acoes: 'Ações',
  cripto: 'Cripto',
  fundos: 'Fundos',
  poupanca: 'Poupança',
  outros: 'Outros',
};

export const investmentTypeIcons: Record<InvestmentType, string> = {
  tesouro_direto: 'Landmark',
  renda_fixa: 'PiggyBank',
  acoes: 'BarChart3',
  cripto: 'Bitcoin',
  fundos: 'Layers',
  poupanca: 'Wallet',
  outros: 'Coins',
};

export const investmentTypeColors: Record<InvestmentType, string> = {
  tesouro_direto: 'hsl(200 84% 50%)',
  renda_fixa: 'hsl(160 84% 39%)',
  acoes: 'hsl(263 70% 50%)',
  cripto: 'hsl(38 92% 50%)',
  fundos: 'hsl(180 70% 45%)',
  poupanca: 'hsl(140 70% 45%)',
  outros: 'hsl(215 20% 65%)',
};
