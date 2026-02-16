import { z } from 'zod';
import { InvestmentType } from '@/types/investment';

const tesouroDiretoSchema = z.object({
  titulo: z.string().max(255).default(''),
  taxa: z.number().min(0).max(100).default(0),
  precoUnitario: z.number().min(0).default(0),
  vencimento: z.string().max(20).default(''),
});

const acoesSchema = z.object({
  ticker: z.string().max(20).default(''),
  quantidade: z.number().min(0).default(0),
  precoMedio: z.number().min(0).default(0),
});

const criptoSchema = z.object({
  moeda: z.string().max(50).default(''),
  quantidade: z.number().min(0).default(0),
  precoMedio: z.number().min(0).default(0),
});

const rendaFixaSchema = z.object({
  instituicao: z.string().max(255).default(''),
  taxa: z.number().min(0).max(200).default(0),
  tipoTaxa: z.enum(['cdi', 'ipca', 'prefixado']).default('cdi'),
  vencimento: z.string().max(20).default(''),
});

const poupancaSchema = z.object({
  instituicao: z.string().max(255).default(''),
  objetivo: z.string().max(255).optional(),
});

const fundosSchema = z.object({
  nomeGestor: z.string().max(255).default(''),
  tipoFundo: z.string().max(100).default(''),
  taxaAdministracao: z.number().min(0).max(100).default(0),
  precoMedio: z.number().min(0).optional(),
  quantidade: z.number().min(0).optional(),
});

const detailsSchemaMap: Record<string, z.ZodTypeAny> = {
  tesouro_direto: tesouroDiretoSchema,
  acoes: acoesSchema,
  cripto: criptoSchema,
  renda_fixa: rendaFixaSchema,
  poupanca: poupancaSchema,
  fundos: fundosSchema,
};

/**
 * Validates and sanitizes investment specific_details based on the investment type.
 * Returns the validated object or null if validation fails or no schema exists.
 */
export function validateInvestmentDetails(
  tipo: InvestmentType,
  details: unknown
): Record<string, unknown> | null {
  if (!details || typeof details !== 'object') return null;

  const schema = detailsSchemaMap[tipo];
  if (!schema) return null;

  const result = schema.safeParse(details);
  if (result.success) {
    return result.data as Record<string, unknown>;
  }

  // If strict parse fails, try to coerce by picking only known keys
  // This strips any injected extra fields
  const partial = schema.safeParse({});
  if (partial.success) {
    // Merge only valid fields from input
    const cleaned: Record<string, unknown> = {};
    const defaults = partial.data as Record<string, unknown>;
    const input = details as Record<string, unknown>;
    for (const key of Object.keys(defaults)) {
      if (key in input) {
        cleaned[key] = input[key];
      } else {
        cleaned[key] = defaults[key];
      }
    }
    const recheck = schema.safeParse(cleaned);
    return recheck.success ? (recheck.data as Record<string, unknown>) : null;
  }

  return null;
}
