Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // 🔹 CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 🔥 COLOQUE SEU WEBHOOK AQUI (ou use env corretamente)
  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1494071476188348487/0xAisZWH6i547zNGaGSUBvOiVKPfHek2FGMzuE4WAk6UXibIEVHl_7kLjgID7yu5Il3N'

  // 🔹 Formatar data
  function formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  try {
  console.log("🔥 Função chamada")

  let body = {}

  try {
    body = await req.json()
  } catch (e) {
    console.error("❌ Erro ao ler JSON:", e)
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log("📦 BODY:", body)

  const { type, nome, responsavel } = body

  if (!type) {
    console.error("❌ TYPE NÃO INFORMADO")
    return new Response(JSON.stringify({ error: "Type is required" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const now = formatDate(new Date())
  const username = `ZERO FOCO BOT ${Math.floor(Math.random() * 10000)}`

  let embed = {}

  if (type === 'novo_usuario') {
    embed = {
      title: '👤 Novo usuário cadastrado',
      color: 3066993,
      fields: [
        { name: 'Nome', value: nome || 'Não informado', inline: true },
        { name: 'Data', value: now, inline: true }
      ]
    }
  } else if (type === 'nova_operacao') {
    embed = {
      title: '⚙️ Nova operação criada',
      color: 3447003,
      fields: [
        { name: 'Responsável', value: responsavel || 'Sistema', inline: true },
        { name: 'Data', value: now, inline: true }
      ]
    }
  } else {
    console.error("❌ TYPE INVÁLIDO:", type)
    return new Response(JSON.stringify({ error: 'Invalid type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log("📡 Enviando pro Discord...")

  const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      embeds: [embed]
    }),
  })

  console.log("📊 STATUS DISCORD:", discordRes.status)

  const text = await discordRes.text()
  console.log("📨 RESPOSTA DISCORD:", text)

  if (!discordRes.ok) {
    return new Response(JSON.stringify({ error: 'Discord webhook failed' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

} catch (error) {
  console.error("💥 ERRO GERAL:", error)

  return new Response(JSON.stringify({ error: 'Internal error' }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
} catch (error) {
    console.error('Error:', error)

    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})