import { Transaction } from '@/types/transaction';
import { Investment } from '@/types/investment';
import { classifyTransaction } from './classify';
import { format } from 'date-fns';

export interface PeriodSummary {
  income: number;
  expense: number;
  invested: number;
  balance: number;
  
  realizedIncome: number;
  expectedIncome: number;
  
  realizedExpense: number;
  expectedExpense: number;

  loansGiven: number;
  loansReceived: number;
}

/**
 * Filtra transações que ocorreram até a data limite (por padrão, hoje).
 * Agora considera a data local corretamente e inclui o próprio dia.
 */
export function isRealized(dateStr: string, limitDate: Date = new Date()): boolean {
  const limitDateStr = format(limitDate, 'yyyy-MM-dd');
  return dateStr <= limitDateStr;
}

/**
 * Calcula o resumo financeiro de um conjunto de transações e investimentos.
 * Utiliza a fonte da verdade de classificação: classifyTransaction.
 */
export function summarizePeriod(
  transactions: Transaction[],
  investments: Investment[],
  options: {
    includeLoans?: boolean;
    includeInvestments?: boolean;
    includeFuture?: boolean;
  } = {}
): PeriodSummary {
  const { includeLoans = true, includeInvestments = true } = options;
  const limitDate = new Date();

  let realizedIncome = 0;
  let expectedIncome = 0;
  let realizedExpense = 0;
  let expectedExpense = 0;
  
  let loansGiven = 0;
  let loansReceived = 0;
  let invested = 0;

  for (const t of transactions) {
    const isPastOrToday = isRealized(t.date, limitDate);
    const nature = classifyTransaction(t);
    const amt = t.amount;

    if (nature === 'income') {
      if (isPastOrToday) realizedIncome += amt;
      else expectedIncome += amt;
    } else if (nature === 'expense' || nature === 'loan_interest') {
      if (isPastOrToday) realizedExpense += amt;
      else expectedExpense += amt;
    } else if (nature === 'investment_aporte') {
      if (includeInvestments && isPastOrToday) invested += amt;
    } else if (nature === 'investment_resgate') {
      // Resgate entra nas contas, mas não conta como receita (a não ser que se queira)
    } else if (nature === 'loan_principal') {
      if (includeLoans) {
        if (t.type === 'expense') loansGiven += amt;
        if (t.type === 'income') loansReceived += amt;
      }
    }
    // 'transfer' e 'adjustment' são ignorados dos totais de receita e despesa
  }

  // BUG B.2-16: A dupla soma. A fonte da verdade para o valor *Aportado* no período 
  // são as transações de aporte. A tabela 'investments' serve para o Patrimônio.
  // Portanto, ignoramos o array investments aqui para não somar 2 vezes.

  const income = realizedIncome + expectedIncome;
  const expense = realizedExpense + expectedExpense;

  return {
    income,
    expense,
    realizedIncome,
    expectedIncome,
    realizedExpense,
    expectedExpense,
    invested,
    loansGiven,
    loansReceived,
    balance: realizedIncome - realizedExpense, 
  };
}

export const calculatePeriodSummary = summarizePeriod;

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

    // Todas as saídas/entradas afetam saldo, não importando a natureza
    if (t.type === 'income') {
      balance += t.amount;
    } else if (t.type === 'expense') {
      balance -= t.amount;
    }
  }

  return balance;
}
