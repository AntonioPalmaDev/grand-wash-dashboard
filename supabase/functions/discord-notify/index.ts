Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const DISCORD_WEBHOOK_URL = 'https://discordapp.com/api/webhooks/1494050923587047514/GsLynOIlYxZRNyhx4XRlqPfb1WAek4TOg1UiCIRKPXsjnHYxzIFOghX3raaFegLb0t-Q'

  function formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  try {
    const { type, nome, responsavel } = await req.json()
    const now = formatDate(new Date())
    const username = `ZERO FOCO BOT ${Math.floor(Math.random() * 10000)}`

    let embed: Record<string, unknown> = {}

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
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        embeds: [{
          ...embed,
          footer: { text: 'Sistema ZERO FOCO' },
          timestamp: new Date().toISOString()
        }]
      }),
    })

    if (!discordRes.ok) {
      const errText = await discordRes.text()
      console.error('Discord webhook error:', discordRes.status, errText)
      return new Response(JSON.stringify({ error: 'Discord webhook failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
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