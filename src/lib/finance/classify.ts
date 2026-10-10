import { Transaction } from '@/types/transaction';

export type TransactionNature =
  | 'expense'           // Despesa comum (consumo)
  | 'income'            // Receita comum (salário, etc)
  | 'transfer'          // Transferência entre contas
  | 'investment_aporte' // Aporte em investimento
  | 'investment_resgate'// Resgate de investimento
  | 'loan_principal'    // Empréstimo (recebido ou concedido) e pagamento de principal
  | 'loan_interest'     // Juros de empréstimo pagos
  | 'adjustment';       // Ajuste de saldo

/**
 * Retorna a natureza real da transação, unificando os conceitos de type, category e flags.
 */
export function classifyTransaction(t: Transaction): TransactionNature {
  if (t.isTransfer) {
    return 'transfer';
  }

  // Ajustes
  if (t.category === 'adjustment' || t.category === 'other' && (t.description?.toLowerCase().includes('ajuste') || false)) {
    // Mantemos compatibilidade caso haja ajustes antigos na categoria "other" (embora seja melhor migrá-los)
    // Para simplificar agora, focamos na categoria 'adjustment' proposta
    if (t.category === 'adjustment') {
        return 'adjustment';
    }
  }

  // Empréstimos
  if (t.isLoan || t.category === 'loan' || t.category === 'Empréstimo') {
    if (t.category === 'Juros e tarifas') {
      return 'loan_interest';
    }
    return 'loan_principal';
  }

  // Investimentos
  if (t.category === 'investment' || t.category === 'Investimento') {
    if (t.type === 'expense') {
      return 'investment_aporte';
    } else {
      return 'investment_resgate';
    }
  }

  // Comum
  if (t.type === 'income') {
    return 'income';
  } else {
    return 'expense';
  }
}
