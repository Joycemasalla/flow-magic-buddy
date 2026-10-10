import { describe, it, expect } from 'vitest';
import { calculatePeriodSummary } from './rules';
import { Transaction } from '@/types/transaction';
import { Investment } from '@/types/investment';
import { format, addDays } from 'date-fns';

describe('calculatePeriodSummary', () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const future = format(addDays(new Date(), 5), 'yyyy-MM-dd');

  it('Corrige Bug B.2-1: Empréstimos não entram como receita/despesa, apenas como loan', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'income',
        amount: 5000,
        date: today,
        category: 'Empréstimo',
        description: 'Empréstimo recebido',
        isLoan: true,
        isTransfer: false,
        paymentStatus: 'paid',
        paymentMethod: 'pix',
        userId: 'user1'
      }
    ];

    const summary = calculatePeriodSummary(transactions, []);
    
    // Agora o comportamento está CORRETO
    expect(summary.loansReceived).toBe(5000);
    expect(summary.income).toBe(0); // ✅ Não é receita
  });

  it('Corrige Bug B.2-16: Não soma duplamente os aportes', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'expense',
        amount: 1000,
        date: today,
        category: 'investment',
        description: 'Aporte CDB',
        isLoan: false,
        isTransfer: false,
        paymentStatus: 'paid',
        paymentMethod: 'pix',
        userId: 'user1'
      }
    ];

    const investments: Investment[] = [
      {
        id: '1',
        nome: 'CDB',
        tipo: 'RENDA_FIXA',
        valorInvestido: 1000,
        valorAtual: 1000,
        dataInvestimento: today,
        vencimento: '',
        userId: 'user1'
      }
    ];

    const summary = calculatePeriodSummary(transactions, investments);
    
    // Agora o comportamento está CORRETO
    expect(summary.invested).toBe(1000); // ✅ Apenas 1000 contabilizado pelas transações
  });

  it('Separa realizado e previsto corretamente', () => {
    const transactions: Transaction[] = [
      { id: '1', type: 'income', amount: 3000, date: today, category: 'salario', isLoan: false, isTransfer: false, userId: 'u1' } as Transaction,
      { id: '2', type: 'expense', amount: 500, date: today, category: 'food', isLoan: false, isTransfer: false, userId: 'u1' } as Transaction,
      { id: '3', type: 'expense', amount: 200, date: future, category: 'food', isLoan: false, isTransfer: false, userId: 'u1' } as Transaction, // futuro
    ];

    const summary = calculatePeriodSummary(transactions, []);
    
    expect(summary.realizedIncome).toBe(3000);
    expect(summary.expectedIncome).toBe(0);
    expect(summary.income).toBe(3000);

    expect(summary.realizedExpense).toBe(500);
    expect(summary.expectedExpense).toBe(200);
    expect(summary.expense).toBe(700);
  });
});
