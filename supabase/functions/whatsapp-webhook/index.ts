// Webhook do Twilio Sandbox (WhatsApp) -> registra transações e envia relatórios.
// Responde com TwiML (gratuito, não consome a API de envio do Twilio).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const TZ = "America/Sao_Paulo";

const CATEGORIES = [
  "salary", "food", "transport", "shopping", "health",
  "entertainment", "bills", "education", "investment", "loan", "other",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  salary: "Salário", food: "Alimentação", transport: "Transporte",
  shopping: "Compras", health: "Saúde", entertainment: "Entretenimento",
  bills: "Contas", education: "Educação", investment: "Investimento",
  loan: "Empréstimo", other: "Outros",
};

function twiml(message: string) {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`,
    { headers: { "Content-Type": "text/xml; charset=utf-8" } },
  );
}

function localDateString(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const HELP = [
  "🤖 *MoneyFlow no WhatsApp*",
  "",
  "*Registrar:*",
  "• gastei 35 no uber",
  "• despesa 120 mercado ontem",
  "• recebi 3000 de salário",
  "",
  "*Relatórios:*",
  "• gastos de hoje",
  "• gastos da semana",
  "• gastos do mês",
  "• resumo do mês",
].join("\n");

type Intent =
  | { action: "transaction"; type: "income" | "expense"; amount: number; description: string; category: string; date: string }
  | { action: "report"; period: "today" | "week" | "month"; scope: "expense" | "income" | "all" }
  | { action: "help" };

async function interpret(text: string): Promise<Intent> {
  if (!LOVABLE_API_KEY) return { action: "help" };
  const today = localDateString();

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        {
          role: "system",
          content:
            `Você interpreta mensagens financeiras em português do Brasil e devolve APENAS JSON.\n` +
            `Hoje é ${today} (fuso ${TZ}).\n` +
            `Categorias válidas: ${CATEGORIES.join(", ")}.\n\n` +
            `Formatos possíveis:\n` +
            `1) Registro: {"action":"transaction","type":"expense|income","amount":number,"description":"texto curto","category":"uma das categorias","date":"YYYY-MM-DD"}\n` +
            `2) Relatório: {"action":"report","period":"today|week|month","scope":"expense|income|all"}\n` +
            `3) Ajuda/incompreensível: {"action":"help"}\n\n` +
            `Regras: valores em reais (aceite "35", "35,90", "1.200"). "gastei/paguei/comprei" = expense. ` +
            `"recebi/ganhei/salário/entrou" = income. Sem data explícita use hoje. "ontem" = dia anterior. ` +
            `Se pedir "resumo" use scope "all". Responda somente o JSON.`,
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    console.error(`AI gateway failed [${res.status}]: ${await res.text()}`);
    return { action: "help" };
  }

  const data = await res.json();
  try {
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    if (parsed.action === "transaction") {
      const amount = Number(parsed.amount);
      if (!isFinite(amount) || amount <= 0) return { action: "help" };
      return {
        action: "transaction",
        type: parsed.type === "income" ? "income" : "expense",
        amount,
        description: String(parsed.description || "Registro via WhatsApp").slice(0, 120),
        category: CATEGORIES.includes(parsed.category) ? parsed.category : "other",
        date: /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : today,
      };
    }
    if (parsed.action === "report") {
      return {
        action: "report",
        period: ["today", "week", "month"].includes(parsed.period) ? parsed.period : "month",
        scope: ["expense", "income", "all"].includes(parsed.scope) ? parsed.scope : "expense",
      };
    }
  } catch (e) {
    console.error("Failed to parse AI output", e);
  }
  return { action: "help" };
}

function periodStart(period: "today" | "week" | "month") {
  const todayStr = localDateString();
  const [y, m, d] = todayStr.split("-").map(Number);
  if (period === "today") return todayStr;
  if (period === "month") return `${todayStr.slice(0, 7)}-01`;
  const base = new Date(Date.UTC(y, m - 1, d));
  const dow = base.getUTCDay(); // 0=dom
  base.setUTCDate(base.getUTCDate() - dow);
  return base.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  try {
    const form = await req.formData();
    const from = String(form.get("From") ?? "");
    const body = String(form.get("Body") ?? "").trim();
    const phone = from.replace("whatsapp:", "").replace(/[^\d+]/g, "");

    if (!phone) return twiml("Não consegui identificar seu número.");

    // 1) Vínculo de conta
    const codeMatch = body.match(/^(?:vincular|conectar)\s+([A-Za-z0-9]{6})$/i);
    if (codeMatch) {
      const code = codeMatch[1].toUpperCase();
      const { data: link } = await supabase
        .from("whatsapp_links")
        .select("id, user_id")
        .eq("link_code", code)
        .maybeSingle();

      if (!link) return twiml("Código inválido. Gere um novo código no app (menu WhatsApp).");

      await supabase.from("whatsapp_links").update({ phone: null, verified_at: null }).eq("phone", phone);
      const { error } = await supabase
        .from("whatsapp_links")
        .update({ phone, verified_at: new Date().toISOString() })
        .eq("id", link.id);

      if (error) {
        console.error("link error", error);
        return twiml("Não consegui vincular agora. Tente novamente.");
      }
      return twiml("✅ Número vinculado com sucesso!\n\n" + HELP);
    }

    const { data: link } = await supabase
      .from("whatsapp_links")
      .select("user_id")
      .eq("phone", phone)
      .not("verified_at", "is", null)
      .maybeSingle();

    if (!link) {
      return twiml(
        "👋 Seu número ainda não está vinculado ao MoneyFlow.\n\n" +
          "Abra o app, vá em *WhatsApp* e envie aqui:\n*vincular SEUCODIGO*",
      );
    }

    if (!body || /^(ajuda|help|menu|oi|ol[áa])$/i.test(body)) return twiml(HELP);

    const intent = await interpret(body);

    if (intent.action === "transaction") {
      const { error } = await supabase.from("transactions").insert({
        user_id: link.user_id,
        description: intent.description,
        amount: intent.amount,
        type: intent.type,
        category: intent.category,
        date: intent.date,
        wallet_id: null,
      });
      if (error) {
        console.error("insert error", error);
        return twiml("Não consegui salvar o registro. Tente de novo.");
      }
      const icon = intent.type === "income" ? "💰 Receita" : "💸 Despesa";
      const [yy, mm, dd] = intent.date.split("-");
      return twiml(
        `${icon} registrada!\n\n` +
          `${intent.description}\n` +
          `Valor: ${brl(intent.amount)}\n` +
          `Categoria: ${CATEGORY_LABELS[intent.category]}\n` +
          `Data: ${dd}/${mm}/${yy}`,
      );
    }

    if (intent.action === "report") {
      const start = periodStart(intent.period);
      const end = localDateString();
      const { data: rows, error } = await supabase
        .from("transactions")
        .select("amount, type, category, description, date, is_loan")
        .eq("user_id", link.user_id)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });

      if (error) {
        console.error("report error", error);
        return twiml("Não consegui gerar o relatório agora.");
      }

      const list = (rows ?? []).filter((r: any) => !r.is_loan);
      const income = list.filter((r: any) => r.type === "income").reduce((s: number, r: any) => s + Number(r.amount), 0);
      const expense = list.filter((r: any) => r.type === "expense").reduce((s: number, r: any) => s + Number(r.amount), 0);

      const label = intent.period === "today" ? "hoje" : intent.period === "week" ? "desta semana" : "deste mês";

      if (!list.length) return twiml(`Nenhum lançamento ${label}. 🎉`);

      const byCat = new Map<string, number>();
      for (const r of list as any[]) {
        if (r.type !== "expense") continue;
        byCat.set(r.category, (byCat.get(r.category) ?? 0) + Number(r.amount));
      }
      const top = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

      const lines = [`📊 *Resumo ${label}*`, ""];
      if (intent.scope !== "expense") lines.push(`Receitas: ${brl(income)}`);
      lines.push(`Despesas: ${brl(expense)}`);
      if (intent.scope === "all") lines.push(`Saldo: ${brl(income - expense)}`);
      if (top.length) {
        lines.push("", "*Maiores gastos por categoria:*");
        for (const [cat, val] of top) lines.push(`• ${CATEGORY_LABELS[cat] ?? cat}: ${brl(val)}`);
      }
      lines.push("", `${list.length} lançamento(s)`);
      return twiml(lines.join("\n"));
    }

    return twiml("Não entendi 🤔\n\n" + HELP);
  } catch (e) {
    console.error("webhook error", e);
    return twiml("Ocorreu um erro. Tente novamente em instantes.");
  }
});
