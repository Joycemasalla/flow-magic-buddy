export type TransactionType = 'income' | 'expense';

export type TransactionCategory = string;

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: string;
  isLoan?: boolean;
  loanPerson?: string;
  loanStatus?: 'pending' | 'paid' | 'received';
  loanSettledDate?: string;
  /** Total já pago/recebido para empréstimos com quitação parcial. */
  loanPaidAmount?: number;
  accountId?: string | null;
  isTransfer?: boolean;
  linkedTransactionId?: string;
  tags?: string[]; // For profile modes like 'casal' (couple)
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  amount: number;
  type: 'monthly' | 'single';
  dueDay: number;
  category: TransactionCategory;
  isActive: boolean;
  /** Quantos dias antes do vencimento destacar como alerta. */
  alertDaysBefore: number;
  /** Último mês (YYYY-MM) em que foi marcado como pago. */
  lastPaidMonth?: string | null;
  /** Transação gerada pelo último pagamento. */
  lastTransactionId?: string | null;
  createdAt: string;
}

export const categoryLabels: Record<string, string> = {
  salary: 'Salário',
  food: 'Alimentação',
  transport: 'Transporte',
  shopping: 'Compras',
  health: 'Saúde',
  entertainment: 'Entretenimento',
  bills: 'Contas',
  education: 'Educação',
  investment: 'Investimento',
  loan: 'Empréstimo',
  other: 'Outros',
};

export const categoryIcons: Record<string, string> = {
  salary: 'Wallet',
  food: 'UtensilsCrossed',
  transport: 'Car',
  shopping: 'ShoppingBag',
  health: 'Heart',
  entertainment: 'Gamepad2',
  bills: 'Receipt',
  education: 'GraduationCap',
  investment: 'TrendingUp',
  loan: 'HandCoins',
  other: 'MoreHorizontal',
};

export const categoryColors: Record<string, string> = {
  salary: 'hsl(160 84% 39%)',
  food: 'hsl(38 92% 50%)',
  transport: 'hsl(200 84% 50%)',
  shopping: 'hsl(300 70% 50%)',
  health: 'hsl(0 84% 60%)',
  entertainment: 'hsl(263 70% 50%)',
  bills: 'hsl(210 40% 50%)',
  education: 'hsl(180 70% 45%)',
  investment: 'hsl(140 70% 45%)',
  loan: 'hsl(30 90% 55%)',
  other: 'hsl(215 20% 65%)',
};