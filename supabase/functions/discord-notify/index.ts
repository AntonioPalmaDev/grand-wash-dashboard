const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WEBHOOK_URL =
  "https://discordapp.com/api/webhooks/1494340186690158737/Eo_zNSHILTQZ2VSCou0A31rYgNdyaUj9EPHqLuL2-vajQfppwSNsjZECAwhPtAeYVA5g";

const CORES = {
  verde: 0x2ecc71,
  azul: 0x3498db,
};

function formatarData(date?: string | Date): string {
  const d = date ? new Date(date) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function campo(nome: string, valor?: string | null): { name: string; value: string; inline: boolean } {
  return { name: nome, value: valor?.trim() || "---", inline: true };
}

interface NotificacaoDados {
  nome?: string;
  email?: string;
  responsavel?: string;
  status?: string;
  cliente?: string;
  data?: string;
}

function criarEmbed(tipo: string, dados: NotificacaoDados) {
  const dataFormatada = formatarData(dados.data);

  switch (tipo) {
    case "novo_usuario":
      return {
        title: "👤 Novo usuário criado",
        color: CORES.verde,
        fields: [
          campo("Nome", dados.nome),
          campo("Email", dados.email),
          campo("Data", dataFormatada),
        ],
      };

    case "novo_cliente":
      return {
        title: "🏢 Novo cliente criado",
        color: CORES.azul,
        fields: [
          campo("Nome do cliente", dados.nome),
          campo("Responsável", dados.responsavel),
          campo("Data", dataFormatada),
        ],
      };

    case "nova_operacao":
      return {
        title: "🚀 Nova operação criada",
        color: CORES.verde,
        fields: [
          campo("Nome da operação", dados.nome),
          campo("Responsável", dados.responsavel),
          campo("Status", dados.status),
          campo("Data", dataFormatada),
        ],
      };

    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, ...dados } = await req.json();
    const embed = criarEmbed(type, dados);

    if (!embed) {
      return new Response(JSON.stringify({ error: "Tipo inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    console.log(`[discord-notify] tipo=${type} status=${res.status}`);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[discord-notify] erro:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
