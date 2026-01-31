
# Plano: Gráfico de Distribuição da Carteira de Investimentos

## Objetivo
Adicionar um gráfico de pizza (donut) na página de investimentos mostrando a distribuição percentual da carteira por tipo de investimento.

---

## Componente a Criar

### `src/components/dashboard/InvestmentDistributionChart.tsx`

Novo componente seguindo o padrão do `CategoryChart.tsx` existente.

**Props:**
```typescript
interface InvestmentDistributionChartProps {
  investments: Investment[];
}
```

**Estrutura visual:**
```
┌─────────────────────────────────────────────┐
│  Distribuição da Carteira                   │
│                                             │
│           ┌──────────────┐                  │
│          ╱                ╲                 │
│         │   [Gráfico      │                 │
│         │    de Pizza]    │                 │
│          ╲                ╱                 │
│           └──────────────┘                  │
│                                             │
│  ● Ações 45%    ● Cripto 25%               │
│  ● Renda Fixa 20%  ● Tesouro 10%           │
└─────────────────────────────────────────────┘
```

**Lógica:**
1. Filtrar apenas investimentos com `jaInvestido === true`
2. Agrupar por tipo e somar valores
3. Calcular percentual de cada tipo
4. Usar cores de `investmentTypeColors`
5. Exibir legenda com labels de `investmentTypeLabels`

**Recursos visuais:**
- Gráfico donut (pizza com centro vazio) usando Recharts
- Animação de entrada com framer-motion
- Tooltip mostrando valor em R$ e percentual
- Estado vazio: "Nenhum investimento realizado"
- Design glass-card consistente com o app

---

## Alteração na Página de Investimentos

### `src/pages/Investments.tsx`

**Importar o novo componente:**
```typescript
import InvestmentDistributionChart from '@/components/dashboard/InvestmentDistributionChart';
```

**Posicionar após os Summary Cards e antes dos Filters:**
```
┌─ Header ─────────────────────────────────────┐
│  Investimentos                          [+]  │
├──────────────────────────────────────────────┤
│ [Total R$X] [Pendente R$Y] [Este Mês R$Z]   │ ← Summary Cards
├──────────────────────────────────────────────┤
│         [GRÁFICO DE DISTRIBUIÇÃO]            │ ← NOVO
├──────────────────────────────────────────────┤
│ [Todos] [Pendentes] [Investidos] [Filtro ▼] │ ← Filters
├──────────────────────────────────────────────┤
│         Lista de Investimentos               │
└──────────────────────────────────────────────┘
```

---

## Seção Técnica

### Dependências utilizadas (já instaladas):
- `recharts` - biblioteca de gráficos
- `framer-motion` - animações

### Código do gráfico (baseado em CategoryChart):
```typescript
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Investment, investmentTypeLabels, investmentTypeColors, InvestmentType } from '@/types/investment';
import { motion } from 'framer-motion';

// Filtrar investimentos realizados
const invested = investments.filter(i => i.jaInvestido);

// Agrupar por tipo
const byType = invested.reduce((acc, inv) => {
  acc[inv.tipo] = (acc[inv.tipo] || 0) + inv.valorInvestido;
  return acc;
}, {} as Record<InvestmentType, number>);

// Converter para formato do gráfico
const data = Object.entries(byType).map(([type, value]) => ({
  name: investmentTypeLabels[type as InvestmentType],
  value,
  color: investmentTypeColors[type as InvestmentType],
}));
```

### Tooltip customizado:
- Exibe: "Ações: R$ 5.000,00 (45%)"
- Estilo escuro consistente com o tema

### Responsividade:
- Mobile: altura de 200px, legenda abaixo
- Desktop: altura de 250px
