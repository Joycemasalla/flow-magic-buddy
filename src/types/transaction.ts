export type TransactionType = 'income' | 'expense';

export type TransactionCategory = 
  | 'salary' 
  | 'food' 
  | 'transport' 
  | 'shopping' 
  | 'health' 
  | 'entertainment' 
  | 'bills' 
  | 'education' 
  | 'investment' 
  | 'loan' 
  | 'other';

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
  createdAt: string;
}

export const categoryLabels: Record<TransactionCategory, string> = {
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

export const categoryIcons: Record<TransactionCategory, string> = {
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

export const categoryColors: Record<TransactionCategory, string> = {
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