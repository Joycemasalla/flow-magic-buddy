

# Filtros de Visualização no Dashboard: Investimentos e Empréstimos

## Problema
Investimentos e empréstimos saem do saldo mas não são gastos reais. O usuário quer poder ver o saldo/despesas com ou sem esses itens para ter uma visão mais precisa dos gastos reais.

## Solução
Adicionar toggle chips abaixo dos cards de resumo que permitem excluir investimentos e/ou empréstimos do cálculo de despesas e saldo.

```text
[Saldo atual: R$ 2.500,00]

[Receitas: R$ 5.000]  [Despesas: R$ 2.500]

  [✓ Incluir investimentos]  [✓ Incluir empréstimos]
```

Quando desmarcados, as transações com `category === 'investment'` ou `isLoan === true` são excluídas do cálculo de despesas (e consequentemente do saldo), dando uma visão dos gastos reais.

## Alterações

### 1. `src/pages/Dashboard.tsx`
- Adicionar dois estados: `includeInvestments` (default: true) e `includeLoans` (default: true)
- No `useMemo` de `stats`, filtrar transações de investimento e empréstimo conforme os toggles antes de calcular income/expense
- Renderizar dois chips/toggles clicáveis entre os SummaryCards e o InvestmentSummary

### 2. `src/components/dashboard/SummaryCards.tsx`
- Adicionar props opcionais `investmentAmount` e `loanAmount` para exibir um subtexto informativo no card de despesas quando filtros estiverem ativos (ex: "sem R$ 500 de investimentos")
- Alternativamente, manter simples e apenas mostrar o valor já filtrado sem subtexto adicional

### Comportamento
- Por padrão, tudo é incluído (visão completa)
- Ao desmarcar "Investimentos", transações com `category === 'investment'` são excluídas das despesas
- Ao desmarcar "Empréstimos", transações com `isLoan === true` são excluídas das despesas
- Os toggles são visuais (chips com ícone de check), consistentes com o design existente de pills/filtros

