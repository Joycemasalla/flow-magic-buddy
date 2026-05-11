# Contas Bancárias (Manuais) na Carteira

Adicionar um conceito de **"Conta"** (banco/dinheiro físico/poupança) ao app, sem integração com Open Finance. Saldos são calculados automaticamente a partir das transações, mas sempre editáveis manualmente.

## O que será criado

### 1. Cadastro de Contas
Cada conta tem:
- **Nome** (ex: "Nubank", "Carteira", "Poupança Itaú")
- **Tipo**: Conta corrente/digital, Dinheiro físico, Poupança/Reserva
- **Ícone + cor** (paleta pré-definida com logos comuns: Nubank roxo, Itaú laranja, etc.)
- **Saldo inicial** (informado no cadastro)
- **Visibilidade** (em carteiras compartilhadas): Minha / Do parceiro(a) / Conjunta
- **Arquivada** sim/não (esconde sem perder histórico)

### 2. Vínculo com transações
- Cada transação passa a ter um campo **conta de origem/destino** (opcional para histórico antigo, sugerido para novas)
- Formulário de nova transação ganha um seletor "Conta" logo após o tipo
- O **saldo da conta = saldo inicial + receitas vinculadas − despesas vinculadas + ajustes manuais**

### 3. Ajuste manual
- Botão "Ajustar saldo" em cada conta
- Quando o usuário define um novo saldo, o sistema cria uma **transação de ajuste** automática (categoria "Ajuste de saldo") com a diferença, mantendo a contabilidade consistente
- Histórico de ajustes visível na conta

### 4. Visualização
- **Dashboard**: novo card "Minhas Contas" abaixo dos cards de resumo, mostrando cada conta (ícone + nome + saldo) e o total. Respeita o modo privacidade.
- **Página dedicada `/contas`**: lista completa, criar/editar/arquivar/excluir, ver extrato filtrado por conta, botão de ajuste manual
- **Item no menu** e suporte do FAB contextual (na rota `/contas`, FAB abre modal de nova conta)

### 5. Compartilhamento
- Em carteira compartilhada, no cadastro escolhe-se: "Minha", "Do(a) parceiro(a)" ou "Conjunta"
- Todos veem todas as contas, mas filtros visuais separam por dono
- Edição: dono edita as próprias; conjuntas qualquer membro edita

## Detalhes técnicos

**Banco (Supabase)** — nova tabela `accounts`:
```
id, user_id, wallet_id, name, type (corrente|dinheiro|poupanca),
icon, color, initial_balance, owner_scope (mine|partner|joint),
archived, created_at, updated_at
```
+ RLS no mesmo padrão das outras tabelas (own OR wallet member)
+ realtime habilitado

**Coluna nova em `transactions`**: `account_id uuid NULL` (FK para accounts, ON DELETE SET NULL para não perder histórico ao excluir conta).

**Ajustes manuais**: implementados como transação tipo `income`/`expense` com categoria reservada `"Ajuste de saldo"` e flag derivada (sem nova coluna), mantendo o cálculo único e consistente.

**Frontend**:
- `src/contexts/AccountContext.tsx` (CRUD + cálculo de saldo derivado)
- `src/pages/Accounts.tsx` + rota `/contas`
- `src/components/accounts/AccountCard.tsx`, `AccountFormSheet.tsx`, `AdjustBalanceSheet.tsx`
- `src/components/dashboard/AccountsSummary.tsx` (card no Dashboard)
- Atualizar `TransactionForm.tsx` e `QuickRecordModal.tsx` com seletor de conta
- Atualizar FAB em `AppLayout` para `/contas`
- Atualizar menu de navegação

## Fora do escopo (por enquanto)
- Cartão de crédito (fatura/limite) — exige modelagem própria, fica para depois
- Integração Open Finance / Pluggy / Belvo
- Transferência entre contas (pode virar próxima evolução: uma transação que debita de uma e credita em outra)

## Migração de dados existentes
Transações antigas ficam com `account_id = NULL` ("Sem conta"). Um banner sugere atribuir uma conta retroativamente, mas nada quebra.
