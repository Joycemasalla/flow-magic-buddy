import { Transaction } from '@/types/transaction';
import { Investment } from '@/contexts/TransactionContext';

export interface PeriodSummary {
  income: number;
  expense: number;
  invested: number;
  balance: number;
  // Loan impact
  loansGiven: number; // Empréstimos concedidos (saída)
  loansReceived: number; // Empréstimos recebidos/devolvidos (entrada)
}

/**
 * Filtra transações que ocorreram até a data limite (por padrão, hoje).
 * Lançamentos com data futura não são contabilizados no "saldo atual" ou "disponível atual",
 * a menos que se deseje ver a projeção.
 */
export function isRealized(dateStr: string, limitDate: Date = new Date()): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(23, 59, 59, 999);
  return d.getTime() <= limitDate.getTime();
}

/**
 * Calcula o resumo financeiro de um conjunto de transações e investimentos.
 * @param transactions As transações já filtradas pelo período desejado
 * @param investments Os investimentos já filtrados pelo período desejado
 * @param includeFuture Se deve incluir lançamentos futuros
 */
export function calculatePeriodSummary(
  transactions: Transaction[],
  investments: Investment[],
  options: {
    includeFuture?: boolean;
    includeLoans?: boolean;
    includeInvestments?: boolean;
  } = {}
): PeriodSummary {
  const { includeFuture = false, includeLoans = true, includeInvestments = true } = options;
  const limitDate = new Date();

  let income = 0;
  let expense = 0;
  let loansGiven = 0;
  let loansReceived = 0;
  let invested = 0;

  for (const t of transactions) {
    if (!includeFuture && !isRealized(t.date, limitDate)) {
      continue;
    }

    if (t.isLoan) {
      if (!includeLoans) continue;
      // Empréstimo dado (expense) ou devolvido (income)
      if (t.type === 'expense') loansGiven += t.amount;
      if (t.type === 'income') loansReceived += t.amount;
    }

    if (t.isTransfer) {
      continue;
    }

    if (t.type === 'income') {
      income += t.amount;
    } else {
      if (t.category === 'investment') {
        if (!includeInvestments) continue;
        invested += t.amount;
      } else {
        expense += t.amount;
      }
    }
  }

  // Investimentos reais (da tabela investments)
  for (const inv of investments) {
    if (!includeFuture && !isRealized(inv.dataInvestimento, limitDate)) {
      continue;
    }
    if (includeInvestments) {
      invested += inv.valorInvestido;
    }
  }

  return {
    income,
    expense,
    invested,
    loansGiven,
    loansReceived,
    balance: income - expense - invested, // O que 'sobrou'
  };
}

/**
 * Calcula o saldo real das contas, apenas com o que já foi realizado (<= hoje).
 */
export function calculateAccountBalance(
  transactions: Transaction[],
  accountId: string,
  includeFuture: boolean = false
): number {
  const limitDate = new Date();
  let balance = 0;

  for (const t of transactions) {
    if (t.accountId !== accountId) continue;
    if (!includeFuture && !isRealized(t.date, limitDate)) continue;

    if (t.type === 'income') {
      balance += t.amount;
    } else {
      balance -= t.amount;
    }
  }

  return balance;
}
