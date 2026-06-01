import { bankLogoValue } from '@/lib/bankLogos';

export type AccountType = 'corrente' | 'dinheiro' | 'poupanca';
export type AccountOwnerScope = 'mine' | 'partner' | 'joint';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  icon: string; // lucide icon name (used when no logo)
  color: string; // hex
  /**
   * Stored logo reference. When prefixed with `bank:` it points to a bundled
   * BANK_LOGOS entry (no network). Legacy values may contain a plain http URL.
   */
  logoUrl?: string | null;
  initialBalance: number;
  ownerScope: AccountOwnerScope;
  archived: boolean;
  userId: string;
  walletId: string | null;
  createdAt: string;
}

export const accountTypeLabels: Record<AccountType, string> = {
  corrente: 'Conta corrente / digital',
  dinheiro: 'Dinheiro / Carteira física',
  poupanca: 'Poupança / Reserva',
};

export const accountTypeShort: Record<AccountType, string> = {
  corrente: 'Corrente',
  dinheiro: 'Dinheiro',
  poupanca: 'Poupança',
};

export const accountOwnerLabels: Record<AccountOwnerScope, string> = {
  mine: 'Minha',
  partner: 'Do(a) parceiro(a)',
  joint: 'Conjunta',
};

// Sugestões de bancos brasileiros — logos bundlados no app
export const accountPresets: { name: string; color: string; icon: string; bankSlug?: string }[] = [
  { name: 'Nubank', color: '#820AD1', icon: 'CreditCard', bankSlug: 'nubank' },
  { name: 'Itaú', color: '#EC7000', icon: 'Building2', bankSlug: 'itau' },
  { name: 'Bradesco', color: '#CC092F', icon: 'Building2', bankSlug: 'bradesco' },
  { name: 'Banco do Brasil', color: '#FAE128', icon: 'Building2', bankSlug: 'bb' },
  { name: 'Caixa', color: '#0070AF', icon: 'Building2', bankSlug: 'caixa' },
  { name: 'Santander', color: '#EC0000', icon: 'Building2', bankSlug: 'santander' },
  { name: 'Inter', color: '#FF7A00', icon: 'CreditCard', bankSlug: 'inter' },
  { name: 'C6 Bank', color: '#242424', icon: 'CreditCard', bankSlug: 'c6' },
  { name: 'PicPay', color: '#21C25E', icon: 'Wallet', bankSlug: 'picpay' },
  { name: 'Mercado Pago', color: '#00B1EA', icon: 'Wallet', bankSlug: 'mercadopago' },
  { name: 'PagBank', color: '#048138', icon: 'Wallet', bankSlug: 'pagbank' },
  { name: 'Carteira', color: '#8B5CF6', icon: 'Wallet' },
  { name: 'Poupança', color: '#10B981', icon: 'PiggyBank' },
];

export const accountColorPalette = [
  '#820AD1', '#EC7000', '#CC092F', '#0070AF', '#EC0000',
  '#FF7A00', '#242424', '#11C76F', '#00B1EA', '#048138',
  '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6',
];

export const accountIconOptions = [
  'Wallet', 'CreditCard', 'Building2', 'Landmark', 'PiggyBank', 'Banknote', 'Coins', 'DollarSign',
];

/** Convert a bank slug to the value stored in `logo_url`. */
export const bankLogo = (slug: string) => bankLogoValue(slug);
